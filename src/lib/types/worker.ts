export type WorkerMessage = 
  | { type: 'START'; file: File; chunkSize: number; fileId: string }
  | { type: 'PAUSE'; fileId: string }
  | { type: 'RESUME'; fileId: string }
  | { type: 'ABORT'; fileId: string };

export type WorkerResponse = 
  | { type: 'CHUNK_READY'; chunk: ArrayBuffer; offset: number; fileId: string; isLast: boolean }
  | { type: 'PROGRESS'; bytesRead: number; speedBps: number; fileId: string }
  | { type: 'ERROR'; error: string; fileId: string }
  | { type: 'COMPLETE'; fileId: string };
