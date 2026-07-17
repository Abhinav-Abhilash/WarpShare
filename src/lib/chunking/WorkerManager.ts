// Manager class to safely instantiate the Web Worker in Next.js

export class FileWorkerManager {
  private worker: Worker | null = null;

  constructor() {
    // Next.js Server Components protection: Ensure window exists
    if (typeof window !== 'undefined') {
      // Safe initialization specifically formatted for Turbopack/Webpack
      this.worker = new Worker(new URL('./worker.ts', import.meta.url));
    }
  }

  public processFile(file: File, chunkSize: number = 64 * 1024): void {
    if (!this.worker) {
      console.error("Worker not initialized (likely running on server)");
      return;
    }

    this.worker.postMessage({ file, chunkSize });

    this.worker.onmessage = (e) => {
      const data = e.data;
      if (data.type === 'chunk') {
        // In the real implementation, we will route this through WebRTC DataChannels
        console.debug(`Processed chunk ${data.chunkIndex + 1}/${data.totalChunks}`);
      } else if (data.type === 'done') {
        console.debug('File processing complete');
      } else if (data.type === 'error') {
        console.error('Worker error:', data.error);
      }
    };
  }
  
  public terminate() {
    if (this.worker) {
      this.worker.terminate();
    }
  }
}
