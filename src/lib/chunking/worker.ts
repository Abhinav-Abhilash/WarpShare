// Web Worker for processing large files into chunks
// Runs entirely on a background thread to ensure the main UI never lags.

self.onmessage = async (e: MessageEvent) => {
  const { file, chunkSize } = e.data;
  
  if (!file) return;

  try {
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      const buffer = await chunk.arrayBuffer();
      
      // Post chunk back to main thread using Transferable Objects for zero-copy performance
      self.postMessage({
        type: 'chunk',
        chunkIndex: i,
        totalChunks,
        buffer
      }, { transfer: [buffer] });
    }

    self.postMessage({ type: 'done' });
  } catch (error) {
    self.postMessage({ type: 'error', error: (error as Error).message });
  }
};
