import { useState, useEffect, useRef, useCallback } from 'react';
import { Peer, FileTransfer, ClipboardEntry } from '../lib/types/network';
import { SignalingMessage } from '../lib/types/signaling';
import { WorkerMessage, WorkerResponse } from '../lib/types/worker';
import { useKnowledgeTree } from './useKnowledgeTree';
import { useSettings } from './useSettings';

const BUFFER_THRESHOLD = 1024 * 1024; // 1MB

export function useWebRTC(roomId: string) {
  const { addActivity } = useKnowledgeTree();
  const { settings } = useSettings();
  const settingsRef = useRef(settings);
  
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const [peers, setPeers] = useState<Peer[]>([]);
  const [transfers, setTransfers] = useState<FileTransfer[]>([]);
  const [clipboardEntries, setClipboardEntries] = useState<ClipboardEntry[]>([]);
  const [localIdStr, setLocalIdStr] = useState<string>('');
  
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      console.error("WebRTC Data Channels require a Secure Context (HTTPS or localhost).");
      alert("Security Warning: WebRTC Data Channels require a Secure Context. Please access this app via HTTPS or localhost to ensure file transfers work correctly.");
    }
  }, []);
  
  const localIdRef = useRef<string>(Math.random().toString(36).substring(2, 9));
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const dataChannels = useRef<Map<string, RTCDataChannel>>(new Map());
  const signalingChannel = useRef<BroadcastChannel | null>(null);
  const fileWorkers = useRef<Map<string, Worker>>(new Map());
  const receivedFiles = useRef<Map<string, { chunks: ArrayBuffer[], receivedBytes: number, totalSize: number, fileName: string }>>(new Map());
  const activeChunkFileId = useRef<string>('');
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    const hasActiveTransfers = transfers.some(t => t.status === 'seeding' || t.status === 'downloading');
    
    const updateWakeLock = async () => {
      if (hasActiveTransfers && !wakeLockRef.current) {
        try {
          if ('wakeLock' in navigator) {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
          }
        } catch (err) {
          console.warn('Wake Lock request failed:', err);
        }
      } else if (!hasActiveTransfers && wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        } catch (err) {
          console.warn('Wake Lock release failed:', err);
        }
      }
    };
    
    updateWakeLock();
    
    // Clean up on unmount
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [transfers]);

  // Helper to send to both channels
  const broadcastSignal = useCallback((msg: any) => {
    const fullMsg = { ...msg, roomId } as SignalingMessage;
    // Send via local BroadcastChannel
    signalingChannel.current?.postMessage(fullMsg);
    // Send via SSE to local Wi-Fi peers
    fetch('/api/signaling/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullMsg)
    }).catch(err => console.warn('SSE signaling send failed', err));
  }, [roomId]);

  // Setup Signaling
  useEffect(() => {
    if (!roomId) return;
    
    setLocalIdStr(localIdRef.current);
    const localId = localIdRef.current;
    
    // 1. BroadcastChannel (Same machine / multi-tab)
    const channel = new BroadcastChannel('warpshare-signaling-' + roomId);
    signalingChannel.current = channel;

    // 2. SSE EventSource (Local Wi-Fi Discovery)
    let sseRetryTimeout: NodeJS.Timeout;
    let eventSource: EventSource | null = null;

    const handleSignalingMessage = async (msg: any) => {
      if (msg.type === 'HEARTBEAT') return;
      if (msg.senderId === localId) return; // Ignore own messages
      if (msg.targetId && msg.targetId !== localId) return; // Ignore messages meant for others

      switch (msg.type) {
        case 'PEER_DISCOVER':
          setPeers(prev => {
            if (prev.find(p => p.id === msg.senderId)) {
              return prev.map(p => p.id === msg.senderId ? { ...p, name: msg.name, deviceType: msg.deviceType } : p);
            }
            return [...prev, { id: msg.senderId, name: msg.name, deviceType: msg.deviceType }];
          });
          
          if (localId > msg.senderId) {
            initiateConnection(msg.senderId);
          } else {
             broadcastSignal({
               type: 'PEER_DISCOVER',
               senderId: localId,
               name: settingsRef.current.displayName,
               deviceType: settingsRef.current.deviceType
             });
          }
          break;

        case 'PEER_LEAVE':
          setPeers(prev => prev.filter(p => p.id !== msg.senderId));
          peerConnections.current.get(msg.senderId)?.close();
          peerConnections.current.delete(msg.senderId);
          dataChannels.current.delete(msg.senderId);
          break;

        case 'OFFER':
          await handleOffer(msg.senderId, msg.sdp);
          break;

        case 'ANSWER':
          await handleAnswer(msg.senderId, msg.sdp);
          break;

        case 'ICE_CANDIDATE':
          await handleIceCandidate(msg.senderId, msg.candidate);
          break;
      }
    };

    channel.onmessage = (event) => handleSignalingMessage(event.data);

    const connectSSE = (retryCount = 0) => {
      if (eventSource) eventSource.close();
      
      eventSource = new EventSource(`/api/signaling/stream?clientId=${localId}&roomId=${roomId}`);
      
      eventSource.onopen = () => {
        retryCount = 0; // reset on success
      };

      eventSource.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleSignalingMessage(msg);
        } catch (err) {
          console.error('Failed to parse SSE message:', err);
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        const timeout = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
        sseRetryTimeout = setTimeout(() => connectSSE(retryCount + 1), timeout);
      };
    };

    connectSSE();

    // Broadcast our presence
    setTimeout(() => {
      broadcastSignal({
        type: 'PEER_DISCOVER',
        senderId: localId,
        name: settingsRef.current.displayName,
        deviceType: settingsRef.current.deviceType
      });
    }, 500);

    return () => {
      broadcastSignal({ type: 'PEER_LEAVE', senderId: localId });
      channel.close();
      if (eventSource) eventSource.close();
      clearTimeout(sseRetryTimeout);
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();
      dataChannels.current.clear();
      fileWorkers.current.forEach(worker => worker.terminate());
      fileWorkers.current.clear();
    };
  }, [broadcastSignal, roomId]);

  const createPeerConnection = (targetId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        broadcastSignal({
          type: 'ICE_CANDIDATE',
          senderId: localIdRef.current,
          targetId,
          candidate: event.candidate.toJSON()
        });
      }
    };

    pc.ondatachannel = (event) => {
      setupDataChannel(targetId, event.channel);
    };
    
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setPeers(prev => prev.filter(p => p.id !== targetId));
        peerConnections.current.delete(targetId);
        dataChannels.current.delete(targetId);
      }
    };

    peerConnections.current.set(targetId, pc);
    return pc;
  };

  const setupDataChannel = (targetId: string, channel: RTCDataChannel) => {
    channel.binaryType = 'arraybuffer';
    channel.bufferedAmountLowThreshold = BUFFER_THRESHOLD / 2; // trigger low when half empty

    channel.onopen = () => console.log(`DataChannel opened with ${targetId}`);
    channel.onclose = () => console.log(`DataChannel closed with ${targetId}`);
    
    channel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'CLIPBOARD_TEXT' && msg.payload) {
            setClipboardEntries(prev => [msg.payload, ...prev]);
          } else if (msg.type === 'FILE_START') {
            receivedFiles.current.set(msg.fileId, { chunks: [], receivedBytes: 0, totalSize: msg.totalSize, fileName: msg.fileName });
            
            setTransfers(prev => [...prev, {
              id: `${msg.fileId}-${targetId}`,
              peerId: targetId,
              fileName: msg.fileName,
              totalSize: msg.totalSize,
              transferredSize: 0,
              speedBytesPerSecond: 0,
              status: 'downloading'
            }]);
          } else if (msg.type === 'CHUNK_HEADER') {
            activeChunkFileId.current = msg.fileId;
          }
        } catch (err) {
          console.error('Failed to parse data channel message:', err);
        }
      } else {
        // Handle binary data for file transfer
        const fileId = activeChunkFileId.current;
        if (!fileId) return;
        
        const fileBuffer = receivedFiles.current.get(fileId);
        if (!fileBuffer) return;
        
        fileBuffer.chunks.push(event.data);
        fileBuffer.receivedBytes += event.data.byteLength;
        
        const isComplete = fileBuffer.receivedBytes === fileBuffer.totalSize;
        let blobUrl: string | undefined;
        
        if (isComplete) {
          const blob = new Blob(fileBuffer.chunks);
          blobUrl = URL.createObjectURL(blob);
          receivedFiles.current.delete(fileId);
        }
        
        setTransfers(prev => prev.map(t => {
          if (t.id === `${fileId}-${targetId}`) {
            return {
              ...t,
              transferredSize: fileBuffer.receivedBytes,
              status: isComplete ? 'complete' : 'downloading',
              ...(blobUrl ? { blobUrl } : {})
            };
          }
          return t;
        }));
      }
    };

    channel.onbufferedamountlow = () => {
      // Resume all workers if any channel drained enough
      fileWorkers.current.forEach(worker => {
        worker.postMessage({ type: 'RESUME', fileId: 'all' } as WorkerMessage);
      });
    };

    dataChannels.current.set(targetId, channel);
  };

  const initiateConnection = async (targetId: string) => {
    const pc = createPeerConnection(targetId);
    const channel = pc.createDataChannel('file-transfer', { ordered: true });
    setupDataChannel(targetId, channel);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    broadcastSignal({
      type: 'OFFER',
      senderId: localIdRef.current,
      targetId,
      sdp: offer
    });
  };

  const handleOffer = async (targetId: string, sdp: RTCSessionDescriptionInit) => {
    const pc = createPeerConnection(targetId);
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    broadcastSignal({
      type: 'ANSWER',
      senderId: localIdRef.current,
      targetId,
      sdp: answer
    });
  };

  const handleAnswer = async (targetId: string, sdp: RTCSessionDescriptionInit) => {
    const pc = peerConnections.current.get(targetId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    }
  };

  const handleIceCandidate = async (targetId: string, candidate: RTCIceCandidateInit) => {
    const pc = peerConnections.current.get(targetId);
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const startBroadcast = useCallback((file: File) => {
    if (dataChannels.current.size === 0) {
      console.warn('No peers connected to broadcast to.');
      // return; // allow seeding state even if no peers for testing UI
    }

    addActivity('file');
    const fileId = Math.random().toString(36).substring(2, 9);
    
    const metadataMsg = JSON.stringify({
      type: 'FILE_START',
      fileId,
      fileName: file.name,
      totalSize: file.size
    });
    
    dataChannels.current.forEach(channel => {
      if (channel.readyState === 'open') {
        channel.send(metadataMsg);
      }
    });
    
    // Add dummy transfers to represent broadcasting to all current peers
    setTransfers(prev => {
      const newTransfers = Array.from(peerConnections.current.keys()).map(peerId => ({
        id: `${fileId}-${peerId}`,
        peerId,
        fileName: file.name,
        totalSize: file.size,
        transferredSize: 0,
        speedBytesPerSecond: 0,
        status: 'seeding' as const
      }));
      
      // If no peers, just add one generic seeding state for UI demonstration
      if (newTransfers.length === 0) {
         newTransfers.push({
            id: fileId,
            peerId: 'local',
            fileName: file.name,
            totalSize: file.size,
            transferredSize: 0,
            speedBytesPerSecond: 0,
            status: 'seeding'
         });
      }
      
      return [...prev, ...newTransfers];
    });

    const worker = new Worker(new URL('../workers/fileChunker.worker.ts', import.meta.url));
    fileWorkers.current.set(fileId, worker);

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      
      switch (msg.type) {
        case 'CHUNK_READY':
          let shouldPause = false;
          
          dataChannels.current.forEach((channel) => {
            if (channel.readyState === 'open') {
               channel.send(JSON.stringify({ type: 'CHUNK_HEADER', fileId }));
               channel.send(msg.chunk);
               if (channel.bufferedAmount > BUFFER_THRESHOLD) {
                 shouldPause = true;
               }
            }
          });

          if (shouldPause) {
             worker.postMessage({ type: 'PAUSE', fileId } as WorkerMessage);
          }
          break;
          
        case 'PROGRESS':
          setTransfers(prev => prev.map(t => {
             if (t.id.includes(fileId)) {
                return {
                   ...t,
                   transferredSize: msg.bytesRead,
                   speedBytesPerSecond: msg.speedBps
                };
             }
             return t;
          }));
          break;
          
        case 'COMPLETE':
          setTransfers(prev => prev.map(t => {
             if (t.id.includes(fileId)) {
                return { ...t, status: 'complete', transferredSize: t.totalSize, speedBytesPerSecond: 0 };
             }
             return t;
          }));
          worker.terminate();
          fileWorkers.current.delete(fileId);
          break;
          
        case 'ERROR':
          console.error('Worker error:', msg.error);
          setTransfers(prev => prev.map(t => {
             if (t.id.includes(fileId)) {
                return { ...t, status: 'error' };
             }
             return t;
          }));
          worker.terminate();
          fileWorkers.current.delete(fileId);
          break;
      }
    };

    worker.postMessage({
      type: 'START',
      file,
      chunkSize: 65536,
      fileId
    } as WorkerMessage);

  }, []);

  const broadcastClipboard = useCallback((text: string) => {
    if (!text.trim()) return;
    
    addActivity('snippet');
    const entry: ClipboardEntry = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      senderId: localIdRef.current,
      timestamp: Date.now()
    };

    const payload = JSON.stringify({ type: 'CLIPBOARD_TEXT', payload: entry });
    
    dataChannels.current.forEach((channel) => {
      if (channel.readyState === 'open') {
        channel.send(payload);
      }
    });

    setClipboardEntries(prev => [entry, ...prev]);
  }, []);

  return { peers, transfers, clipboardEntries, startBroadcast, broadcastClipboard, localId: localIdStr };
}
