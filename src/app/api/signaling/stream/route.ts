import { NextRequest } from 'next/server';

// Global store for SSE clients, safe across HMR in local dev
type SSEClient = { controller: ReadableStreamDefaultController; roomId: string };
const globalClients = (global as any).sseClients || new Map<string, SSEClient>();
if (!(global as any).sseClients) {
  (global as any).sseClients = globalClients;
}

export const dynamic = 'force-dynamic'; // Prevent static generation

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId');
  const roomId = searchParams.get('roomId');

  if (!clientId || !roomId) {
    return new Response('Missing clientId or roomId', { status: 400 });
  }

  let clientController: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(controller) {
      clientController = controller;
      globalClients.set(clientId, { controller, roomId });
      
      // Send initial heartbeat so connection opens
      const encoder = new TextEncoder();
      try {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'HEARTBEAT' })}\n\n`));
      } catch (e) {
        // stream already closed
      }
    },
    cancel() {
      globalClients.delete(clientId);
    }
  });

  req.signal.addEventListener('abort', () => {
    globalClients.delete(clientId);
    try {
      clientController.close();
    } catch(e) {}
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    }
  });
}
