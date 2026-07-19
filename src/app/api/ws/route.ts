import { NextRequest } from 'next/server';

// Global store to keep track of connected WebSockets
type ClientConnection = {
  ws: any;
  roomId: string;
  clientId: string;
};

// Use a global variable to persist across hot reloads in dev
const clients: Set<ClientConnection> = ((global as any).wsClients) || new Set<ClientConnection>();
if (!(global as any).wsClients) {
  (global as any).wsClients = clients;
}

export function GET() {
  return new Response('WebSocket Endpoint', { status: 426 });
}

export function SOCKET(
  client: any,
  request: NextRequest,
) {
  const url = new URL(request.url);
  const roomId = url.searchParams.get('roomId');
  const clientId = url.searchParams.get('clientId');

  if (!roomId || !clientId) {
    client.close(1008, 'Missing roomId or clientId');
    return;
  }

  const connection: ClientConnection = { ws: client, roomId, clientId };
  clients.add(connection);

  console.log(`[WS] Client ${clientId} connected to room ${roomId}`);

  client.onmessage = (event: any) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch (e) {
      return;
    }

    // Broadcast the message to all other clients in the same room
    for (const c of clients) {
      if (c.roomId === roomId && c.clientId !== clientId) {
        // Only send if the socket is open
        try {
          c.ws.send(event.data);
        } catch (err) {
          clients.delete(c);
        }
      }
    }
  };

  client.onclose = () => {
    console.log(`[WS] Client ${clientId} disconnected from room ${roomId}`);
    clients.delete(connection);
  };

  client.onerror = () => {
    clients.delete(connection);
  };
}
