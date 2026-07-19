import { useState, useEffect, useRef, useCallback } from 'react';
import { Peer, FileTransfer, ClipboardEntry } from '../lib/types/network';
import { WorkerMessage, WorkerResponse } from '../lib/types/worker';
import { useKnowledgeTree } from './useKnowledgeTree';
import { useSettings } from './useSettings';

const BUFFER_THRESHOLD = 65536; // 64KB (Prevents flooding mobile buffers)

export function useWebRTC(roomId: string, addLog?: (msg: string) => void) {
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
    }
  }, []);
  
  const localIdRef = useRef<string>(Math.random().toString(36).substring(2, 9));
  const peerRef = useRef<any>(null);
  const dataChannels = useRef<Map<string, any>>(new Map()); // PeerJS DataConnection map
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
        } catch (err) {}
      } else if (!hasActiveTransfers && wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        } catch (err) {}
      }
    };
    
    updateWakeLock();
    
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [transfers]);

  // Setup Signaling via PeerJS
  useEffect(() => {
    if (!roomId) return;
    
    setLocalIdStr(localIdRef.current);
    let isMounted = true;

    const setupDataConnection = (conn: any) => {
      const targetId = conn.peer;

      conn.on('open', () => {
        if (addLog) addLog(`DataConnection secured with peer: ${targetId}`);
        dataChannels.current.set(targetId, conn);
        
        // Exchange UI info
        conn.send(JSON.stringify({
          type: 'PEER_INFO',
          name: settingsRef.current.displayName,
          deviceType: settingsRef.current.deviceType
        }));

        // Access underlying RTCDataChannel for buffer threshold
        if (conn.dataChannel) {
          conn.dataChannel.bufferedAmountLowThreshold = BUFFER_THRESHOLD / 2;
          conn.dataChannel.onbufferedamountlow = () => {
            fileWorkers.current.forEach((worker, fileId) => {
              worker.postMessage({ type: 'RESUME', fileId } as WorkerMessage);
            });
          };
        }
      });

      conn.on('close', () => {
        if (addLog) addLog(`DataConnection closed with peer: ${targetId}`);
        setPeers(prev => prev.filter(p => p.id !== targetId));
        dataChannels.current.delete(targetId);
      });
      
      conn.on('data', (data: any) => {
        // Handle JSON / Strings
        if (typeof data === 'string') {
          try {
            const msg = JSON.parse(data);
            if (msg.type === 'PEER_INFO') {
              setPeers(prev => {
                if (prev.find(p => p.id === targetId)) {
                  return prev.map(p => p.id === targetId ? { ...p, name: msg.name, deviceType: msg.deviceType } : p);
                }
                return [...prev, { id: targetId, name: msg.name, deviceType: msg.deviceType }];
              });
            } else if (msg.type === 'CLIPBOARD_TEXT' && msg.payload) {
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
              if (addLog) addLog(`Inbound file transfer started: ${msg.fileName} (${msg.totalSize} bytes)`);
            } else if (msg.type === 'CHUNK_HEADER') {
              activeChunkFileId.current = msg.fileId;
            }
          } catch (err) {
            console.error('Failed to parse text message:', err);
          }
        } else if (data instanceof ArrayBuffer || data instanceof Uint8Array || data instanceof Blob) {
          // Handle binary chunk natively (serialization: raw)
          const fileId = activeChunkFileId.current;
          if (!fileId) return;
          
          const fileBuffer = receivedFiles.current.get(fileId);
          if (!fileBuffer) return;
          
          const processChunk = async () => {
            let buffer: ArrayBuffer;
            if (data instanceof Blob) {
              buffer = await data.arrayBuffer();
            } else {
              buffer = (data instanceof Uint8Array ? data.buffer : data) as ArrayBuffer;
            }
            
            fileBuffer.chunks.push(buffer);
            fileBuffer.receivedBytes += buffer.byteLength;
            
            const isComplete = fileBuffer.receivedBytes === fileBuffer.totalSize;
            let blobUrl: string | undefined;
            
            if (isComplete) {
              const blob = new Blob(fileBuffer.chunks);
              blobUrl = URL.createObjectURL(blob);
              receivedFiles.current.delete(fileId);
              if (addLog) addLog(`File download complete for: ${fileBuffer.fileName}`);
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
          };
          processChunk();
        }
      });
    };

    const initPeer = async () => {
      const PeerModule = (await import('peerjs')).default;
      const roomPeerId = `warpshare-room-${roomId}`;
      
      const config = {
        host: "0.peerjs.com",
        port: 443,
        secure: true,
        pingInterval: 5000,
        config: {
          iceServers: [
            { urls: "stun:stun.cloudflare.com:3478" },
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" }
          ],
          iceCandidatePoolSize: 10,
          sdpSemantics: "unified-plan",
          iceTransportPolicy: "all",
        },
        debug: 1
      };

      if (addLog) addLog('Initializing WebRTC engine...');

      let p = new PeerModule(roomPeerId, config);
      
      p.on('open', (id: string) => {
        if (!isMounted) return;
        if (addLog) addLog(`Opened as Room Host: ${id}`);
        
        p.on('connection', (conn: any) => {
          if (addLog) addLog('Inbound connection received! Securing DataChannel...');
          setupDataConnection(conn);
        });
      });

      p.on('error', (err: any) => {
        if (!isMounted) return;
        if (err.type === 'unavailable-id') {
          if (addLog) addLog('Room taken, initializing as Guest Mode...');
          const guestPeer = new PeerModule(config);
          peerRef.current = guestPeer;
          
          guestPeer.on('open', (guestId: string) => {
             if (addLog) addLog(`Guest registered. Dialing Host room: ${roomPeerId}...`);
             // Force RAW serialization to bypass BinaryPack limits on mobile
             const conn = guestPeer.connect(roomPeerId, { 
                serialization: "raw", 
                reliable: true 
             });
             setupDataConnection(conn);
          });
          
          guestPeer.on('error', (guestErr: any) => {
             if (addLog) addLog(`Guest Peer error: ${guestErr.message}`);
          });
        } else {
          if (addLog) addLog(`PeerJS error: ${err.type}`);
        }
      });
      
      peerRef.current = p;
    };

    initPeer();

    return () => {
      isMounted = false;
      if (peerRef.current) peerRef.current.destroy();
      dataChannels.current.clear();
      fileWorkers.current.forEach(worker => worker.terminate());
      fileWorkers.current.clear();
    };
  }, [roomId]);

  const startBroadcast = useCallback((file: File) => {
    if (dataChannels.current.size === 0) {
      if (addLog) addLog('No peers connected to broadcast to.');
    }

    addActivity('file');
    const fileId = Math.random().toString(36).substring(2, 9);
    
    if (addLog) addLog(`Starting broadcast for: ${file.name}`);

    const metadataMsg = JSON.stringify({
      type: 'FILE_START',
      fileId,
      fileName: file.name,
      totalSize: file.size
    });
    
    dataChannels.current.forEach(channel => {
      if (channel.open) {
        channel.send(metadataMsg);
      }
    });
    
    setTransfers(prev => {
      const newTransfers = Array.from(dataChannels.current.keys()).map(peerId => ({
        id: `${fileId}-${peerId}`,
        peerId,
        fileName: file.name,
        totalSize: file.size,
        transferredSize: 0,
        speedBytesPerSecond: 0,
        status: 'seeding' as const
      }));
      
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
            if (channel.open) {
               channel.send(JSON.stringify({ type: 'CHUNK_HEADER', fileId }));
               channel.send(msg.chunk);
               if (channel.dataChannel && channel.dataChannel.bufferedAmount > BUFFER_THRESHOLD) {
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
          if (addLog) addLog(`Broadcast chunking complete for ${file.name}.`);
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
          if (addLog) addLog(`Worker error chunking file: ${msg.error}`);
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
      chunkSize: 16384, // 16KB is the maximum safe chunk size for iOS Safari WebRTC
      fileId
    } as WorkerMessage);

  }, [addLog]);

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
      if (channel.open) {
        channel.send(payload);
      }
    });

    setClipboardEntries(prev => [entry, ...prev]);
  }, []);

  return { peers, transfers, clipboardEntries, startBroadcast, broadcastClipboard, localId: localIdStr };
}
