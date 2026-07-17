export type PeerDeviceType = 'laptop' | 'smartphone' | 'tablet' | 'desktop';

export type TransferStatus = 'idle' | 'seeding' | 'downloading' | 'complete' | 'error';

export interface Peer {
  id: string;
  name: string;
  deviceType: PeerDeviceType;
}

export interface FileTransfer {
  id: string;
  peerId: string;
  fileName: string;
  totalSize: number;
  transferredSize: number;
  speedBytesPerSecond: number;
  status: TransferStatus;
  blobUrl?: string;
}

export interface ClipboardEntry {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
}
