import React, { useState } from 'react';
import { Radio, Trash2, Copy, Check, Laptop, Smartphone, Monitor, Tablet } from 'lucide-react';
import { ClipboardEntry, Peer, PeerDeviceType } from '../../lib/types/network';

interface ClipboardProps {
  entries: ClipboardEntry[];
  peers: Peer[];
  onBroadcast: (text: string) => void;
  localId: string;
}

const DeviceIcon = ({ type, className }: { type: PeerDeviceType; className?: string }) => {
  switch (type) {
    case 'laptop': return <Laptop className={className} />;
    case 'smartphone': return <Smartphone className={className} />;
    case 'desktop': return <Monitor className={className} />;
    case 'tablet': return <Tablet className={className} />;
    default: return <Laptop className={className} />;
  }
};

export function Clipboard({ entries, peers, onBroadcast, localId }: ClipboardProps) {
  const [text, setText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleBroadcast = () => {
    if (text.trim()) {
      onBroadcast(text);
      setText('');
    }
  };

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="flex flex-col w-full h-full max-w-4xl">
      {/* Header */}
      <header className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Universal LAN Clipboard</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Broadcast terminal commands, code snippets, or URLs instantly across the local network.
        </p>
      </header>

      {/* Input Workspace */}
      <div className="flex flex-col p-4 bg-white dark:bg-[#18181B] border border-[var(--border)] rounded-[12px] shadow-sm mb-8">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste code or text here..."
          className="w-full h-32 px-4 py-3 bg-zinc-50 dark:bg-[#111113] border-none text-[var(--foreground)] placeholder-zinc-400 dark:placeholder-zinc-600 resize-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#18181B]"
        />
        
        {/* Action Bar */}
        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[var(--border)]">
          <button
            onClick={() => setText('')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Canvas
          </button>
          <button
            onClick={handleBroadcast}
            disabled={!text.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-[10px] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#18181B]"
          >
            <Radio className="w-4 h-4" />
            Broadcast to Room
          </button>
        </div>
      </div>

      {/* Broadcast Feed */}
      <div className="flex flex-col gap-6">
        {entries.map((entry, index) => {
          const isLocal = entry.senderId === localId;
          const peer = isLocal 
            ? { name: 'You (Local)', deviceType: 'laptop' as PeerDeviceType }
            : peers.find(p => p.id === entry.senderId) || { name: `Peer ${entry.senderId}`, deviceType: 'laptop' as PeerDeviceType };
          
          const timeAgo = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={entry.id} className="flex flex-col group">
              {index > 0 && <hr className="border-t border-[var(--border)] mb-6" />}
              
              <div className="flex flex-col p-5 bg-white dark:bg-[#18181B] border border-[var(--border)] rounded-[12px]">
                {/* Entry Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                    <DeviceIcon type={peer.deviceType} className="w-4 h-4" />
                    <span className="font-medium text-[var(--foreground)]">{peer.name}</span>
                    <span>•</span>
                    <span>{timeAgo}</span>
                  </div>
                  
                  <button 
                    onClick={() => handleCopy(entry.id, entry.text)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#18181B]"
                    title="Copy to clipboard"
                  >
                    {copiedId === entry.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy to Clipboard
                      </>
                    )}
                  </button>
                </div>
                
                {/* Entry Content */}
                <div className="w-full p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-[var(--border)]/50 overflow-x-auto">
                  <pre className="font-mono text-sm text-[var(--foreground)] whitespace-pre-wrap word-break">
                    {entry.text}
                  </pre>
                </div>
              </div>
            </div>
          );
        })}
        
        {entries.length === 0 && (
          <div className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400 border border-dashed border-[var(--border)] rounded-[12px]">
            No clipboard entries yet. Be the first to broadcast!
          </div>
        )}
      </div>
    </div>
  );
}
