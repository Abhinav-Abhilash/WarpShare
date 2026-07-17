import React from 'react';
import { Laptop, Smartphone, Monitor, Tablet, Download } from 'lucide-react';
import { Peer, FileTransfer, PeerDeviceType } from '../../lib/types/network';

interface MeshTelemetryProps {
  peers: Peer[];
  transfers: FileTransfer[];
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

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export function MeshTelemetry({ peers, transfers }: MeshTelemetryProps) {
  return (
    <div className="w-full flex flex-col mt-8 border border-[var(--border)] rounded-xl bg-white dark:bg-[#18181B] overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--border)] bg-zinc-50 dark:bg-zinc-900/50">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Active Transfers ({transfers.length})</h3>
      </div>
      
      <div className="flex flex-col divide-y divide-[var(--border)]/50">
        {transfers.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No active transfers. Drop a file to start broadcasting.
          </div>
        )}
        
        {transfers.map((transfer) => {
          // Find the peer, or mock a "Local Transfer" if we are seeding with no peers connected yet
          const peer = peers.find((p) => p.id === transfer.peerId) || {
            id: 'local',
            name: transfer.peerId === 'local' ? 'Awaiting Peers...' : 'Unknown Peer',
            deviceType: 'laptop'
          };

          const isComplete = transfer.status === 'complete';
          const speedString = `${formatBytes(transfer.speedBytesPerSecond)}/s`;
          const progressString = isComplete
            ? '100% Complete'
            : `${formatBytes(transfer.transferredSize)} / ${formatBytes(transfer.totalSize)}`;

          return (
            <div key={transfer.id} className="flex items-center justify-between px-5 py-4 text-sm hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors duration-200">
              {/* Peer Info */}
              <div className="flex items-center gap-3 w-1/3">
                <div className="flex items-center justify-center w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                  <DeviceIcon type={peer.deviceType} className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-[var(--foreground)] truncate">{peer.name}</span>
                  <span className="text-xs text-zinc-500 truncate max-w-[180px] sm:max-w-xs text-ellipsis">{transfer.fileName}</span>
                </div>
              </div>

              {/* Status / Speed */}
              <div className="flex items-center justify-center gap-3 w-1/3 text-zinc-500 dark:text-zinc-400">
                <span className="w-12 border-t border-dashed border-[var(--border)]"></span>
                <span className={`capitalize ${transfer.status === 'seeding' ? 'text-emerald-600 dark:text-emerald-500' : ''}`}>
                  {transfer.status} ({speedString})
                </span>
                <span className="w-12 border-t border-dashed border-[var(--border)]"></span>
              </div>

              {/* Progress */}
              <div className="flex justify-end w-1/3">
                {isComplete && transfer.blobUrl ? (
                  <a 
                    href={transfer.blobUrl} 
                    download={transfer.fileName}
                    onClick={() => {
                      if (transfer.blobUrl) {
                        setTimeout(() => {
                          URL.revokeObjectURL(transfer.blobUrl!);
                        }, 60000); // Revoke memory pointer after 60 seconds
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#18181B]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Save File
                  </a>
                ) : (
                  <div className={`px-3 py-1 rounded-full border text-xs font-medium ${
                    isComplete 
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:text-indigo-400'
                  }`}>
                    {progressString}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
