import React from 'react';
import { Dropzone } from './Dropzone';
import { MeshTelemetry } from './MeshTelemetry';
import { Peer, FileTransfer } from '../../lib/types/network';

interface RoomBroadcastProps {
  peers: Peer[];
  transfers: FileTransfer[];
  startBroadcast: (file: File) => void;
}

export function RoomBroadcast({ peers, transfers, startBroadcast }: RoomBroadcastProps) {
  return (
    <div className="flex flex-col md:flex-row w-full max-w-screen-xl mx-auto gap-6 p-4 sm:px-6 overflow-x-hidden">
      {/* Left Side: Primary File Drop Zone & Controls */}
      <div className="w-full md:w-[65%] bg-white dark:bg-[#18181B] border border-[var(--border)] rounded-xl p-6 overflow-y-auto">
        <Dropzone onDrop={startBroadcast} />
      </div>

      {/* Right Side: Room Telemetry & Network Logs */}
      <div className="w-full md:w-[35%] bg-zinc-50 dark:bg-zinc-900/50 border border-[var(--border)] rounded-xl p-6 overflow-y-auto">
        <MeshTelemetry peers={peers} transfers={transfers} />
      </div>
    </div>
  );
}
