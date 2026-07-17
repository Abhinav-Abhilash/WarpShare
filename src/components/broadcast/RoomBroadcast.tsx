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
    <div className="flex flex-col w-full h-full max-w-4xl">
      <Dropzone onDrop={startBroadcast} />
      <MeshTelemetry peers={peers} transfers={transfers} />
    </div>
  );
}
