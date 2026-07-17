import { NextRequest, NextResponse } from 'next/server';

type SSEClient = { controller: ReadableStreamDefaultController; roomId: string };
const globalClients = ((global as any).sseClients as Map<string, SSEClient>) || new Map<string, SSEClient>();

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const msg = await req.json();
    
    // Push the message to all connected clients EXCEPT the sender
    const encoder = new TextEncoder();
    const dataString = `data: ${JSON.stringify(msg)}\n\n`;
    const encodedData = encoder.encode(dataString);
    
    let sentCount = 0;
    
    for (const [clientId, client] of Array.from(globalClients.entries())) {
      if (client.roomId === msg.roomId && clientId !== msg.senderId) {
        try {
          client.controller.enqueue(encodedData);
          sentCount++;
        } catch (err) {
          // Client might have disconnected without aborting, clean up
          globalClients.delete(clientId);
        }
      }
    }
    
    return NextResponse.json({ success: true, deliveredTo: sentCount });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process signaling message' }, { status: 500 });
  }
}
