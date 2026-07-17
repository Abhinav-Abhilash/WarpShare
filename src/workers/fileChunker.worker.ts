import { WorkerMessage, WorkerResponse } from '../lib/types/worker';

let file: File | null = null;
let chunkSize = 65536; // 64KB default
let fileId = '';
let offset = 0;
let isPaused = false;
let isAborted = false;
let lastProgressTime = 0;
let bytesReadSinceLastProgress = 0;

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;
  
  switch (msg.type) {
    case 'START':
      file = msg.file;
      chunkSize = msg.chunkSize;
      fileId = msg.fileId;
      offset = 0;
      isPaused = false;
      isAborted = false;
      lastProgressTime = performance.now();
      bytesReadSinceLastProgress = 0;
      readNextChunk();
      break;
    case 'PAUSE':
      if (msg.fileId === fileId) {
        isPaused = true;
      }
      break;
    case 'RESUME':
      if (msg.fileId === fileId && isPaused) {
        isPaused = false;
        readNextChunk();
      }
      break;
    case 'ABORT':
      if (msg.fileId === fileId) {
        isAborted = true;
        cleanup();
      }
      break;
  }
};

async function readNextChunk() {
  if (!file || isPaused || isAborted || offset >= file.size) {
    if (offset >= (file?.size || 0) && file) {
       postMessage({ type: 'COMPLETE', fileId } as WorkerResponse);
       cleanup();
    }
    return;
  }

  const end = Math.min(offset + chunkSize, file.size);
  const slice = file.slice(offset, end);
  const isLast = end >= file.size;
  
  try {
    const arrayBuffer = await slice.arrayBuffer();
    
    // Calculate speed
    bytesReadSinceLastProgress += arrayBuffer.byteLength;
    const now = performance.now();
    const timeDiff = now - lastProgressTime;
    
    let speedBps = 0;
    // Update progress every ~250ms or on last chunk to avoid spamming main thread
    if (timeDiff >= 250 || isLast) {
       speedBps = (bytesReadSinceLastProgress / timeDiff) * 1000;
       postMessage({
         type: 'PROGRESS',
         bytesRead: end,
         speedBps,
         fileId
       } as WorkerResponse);
       
       lastProgressTime = now;
       bytesReadSinceLastProgress = 0;
    }

    // Send chunk (Transferable object for zero-copy)
    ;(postMessage as (message: any, transfer: Transferable[]) => void)({
      type: 'CHUNK_READY',
      chunk: arrayBuffer,
      offset,
      fileId,
      isLast
    } as WorkerResponse, [arrayBuffer]);

    offset = end;
    
    // Immediately queue next read if not paused or aborted
    if (!isPaused && !isAborted) {
      readNextChunk();
    }
    
  } catch (err) {
    postMessage({
      type: 'ERROR',
      error: err instanceof Error ? err.message : 'Unknown error reading file',
      fileId
    } as WorkerResponse);
    cleanup();
  }
}

function cleanup() {
  file = null;
  offset = 0;
}
