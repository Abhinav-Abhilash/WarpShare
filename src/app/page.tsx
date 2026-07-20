"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar, TabId } from '@/components/layout/Sidebar';
import { RoomBroadcast } from '@/components/broadcast/RoomBroadcast';
import { Clipboard } from '@/components/broadcast/Clipboard';
import { KnowledgeTree } from '@/components/knowledge/KnowledgeTree';
import { Settings } from '@/components/settings/Settings';
import RoomQRCode from '@/components/RoomQRCode';
import { useWebRTC } from '@/hooks/useWebRTC';
import { Copy, Check } from 'lucide-react';

export default function Home() {
  const [roomId, setRoomId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabId>('broadcast');
  const { peers, transfers, clipboardEntries, startBroadcast, broadcastClipboard, localId } = useWebRTC(roomId);
  const [copiedRoomId, setCopiedRoomId] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let room = params.get('room');
    if (!room) {
      room = Math.floor(1000 + Math.random() * 9000).toString();
      window.history.replaceState(null, '', `?room=${room}`);
    }
    setRoomId(room);
  }, []);

  const handleCopyRoom = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopiedRoomId(true);
    setTimeout(() => setCopiedRoomId(false), 1500);
  };

  if (!roomId) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[var(--background)]">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden bg-[var(--background)]">
      {/* Fixed Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:px-8 md:py-10 flex flex-col">
        {/* Room Connection Handshake Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 mb-6 md:mb-8 bg-white dark:bg-[#18181B] border border-[var(--border)] rounded-[12px] shadow-sm max-w-4xl gap-4 sm:gap-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <span className="px-3 py-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 rounded-full w-fit">
              Room #{roomId}
            </span>
            <div className="flex items-center gap-2 text-sm">
              {peers.length === 0 ? (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-pulse" />
                  <span className="text-zinc-500 dark:text-zinc-400">Waiting for peers... Open this link in a second tab or device to begin sending.</span>
                </>
              ) : (
                <>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-emerald-700 dark:text-emerald-400">Connected to {peers.length} local peer(s) • Ready to broadcast.</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <RoomQRCode roomId={roomId} />
            <button
              onClick={handleCopyRoom}
              className="flex items-center justify-center gap-2 px-3 py-1.5 w-full sm:w-auto text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
            >
              {copiedRoomId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Room Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Canvas */}
        {activeTab === 'broadcast' && (
           <RoomBroadcast peers={peers} transfers={transfers} startBroadcast={startBroadcast} />
        )}
        
        {activeTab === 'clipboard' && (
           <Clipboard entries={clipboardEntries} peers={peers} onBroadcast={broadcastClipboard} localId={localId} />
        )}

        {/* Upcoming Views */}
        {activeTab === 'tree' && (
           <KnowledgeTree />
        )}
        {activeTab === 'settings' && (
           <Settings />
        )}
      </main>
    </div>
  );
}
