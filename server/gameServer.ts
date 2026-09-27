import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

interface ClientPlayer {
  ws: WebSocket;
  id: string;
  room: string;
  name: string;
  avatarUrl: string;
  skin: unknown;
  segments: Array<{ x: number; y: number }>;
  angle: number;
  score: number;
  thickness: number;
  isBoosting: boolean;
  isAlive: boolean;
}

const rooms = new Map<string, Map<string, ClientPlayer>>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setupWebSocketServer(httpServer: any) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  let nextPlayerId = 1;

  wss.on('connection', (ws: WebSocket) => {
    const playerId = `player-${Date.now()}-${nextPlayerId++}`;
    let currentRoom = 'ARENA-PUBLIC';

    // Send init packet with player ID
    ws.send(
      JSON.stringify({
        type: 'init',
        id: playerId,
      })
    );

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'join') {
          // Remove from previous room if any
          if (rooms.has(currentRoom)) {
            rooms.get(currentRoom)?.delete(playerId);
          }

          currentRoom = data.room || 'ARENA-PUBLIC';
          if (!rooms.has(currentRoom)) {
            rooms.set(currentRoom, new Map());
          }

          const roomMap = rooms.get(currentRoom)!;
          roomMap.set(playerId, {
            ws,
            id: playerId,
            room: currentRoom,
            name: data.name || 'Pemain Cacing',
            avatarUrl: data.avatarUrl || '',
            skin: data.skin,
            segments: [],
            angle: 0,
            score: 10,
            thickness: 18,
            isBoosting: false,
            isAlive: true,
          });
        } else if (data.type === 'move') {
          const roomMap = rooms.get(currentRoom);
          const p = roomMap?.get(playerId);
          if (p) {
            p.segments = data.segments || [];
            p.angle = data.angle || 0;
            p.score = data.score || p.score;
            p.thickness = data.thickness || p.thickness;
            p.isBoosting = !!data.isBoosting;
            p.isAlive = data.isAlive !== false;
          }
        }
      } catch {
        // Ignore parse error
      }
    });

    ws.on('close', () => {
      if (rooms.has(currentRoom)) {
        const roomMap = rooms.get(currentRoom);
        roomMap?.delete(playerId);
        if (roomMap?.size === 0 && currentRoom !== 'ARENA-PUBLIC') {
          rooms.delete(currentRoom);
        }
      }
    });

    ws.on('error', () => {
      // Clean up on error
    });
  });

  // Broadcast loop: sync other players in the same room ~20 times per second
  setInterval(() => {
    rooms.forEach((roomMap) => {
      if (roomMap.size === 0) return;

      const wormsPayload: Array<{
        id: string;
        name: string;
        avatarUrl: string;
        skin: unknown;
        segments: Array<{ x: number; y: number }>;
        angle: number;
        score: number;
        thickness: number;
        isBoosting: boolean;
        isAlive: boolean;
      }> = [];

      roomMap.forEach((p) => {
        if (p.isAlive && p.segments.length > 0) {
          wormsPayload.push({
            id: p.id,
            name: p.name,
            avatarUrl: p.avatarUrl,
            skin: p.skin,
            segments: p.segments,
            angle: p.angle,
            score: p.score,
            thickness: p.thickness,
            isBoosting: p.isBoosting,
            isAlive: p.isAlive,
          });
        }
      });

      const message = JSON.stringify({
        type: 'sync',
        worms: wormsPayload,
      });

      roomMap.forEach((p) => {
        if (p.ws.readyState === WebSocket.OPEN) {
          p.ws.send(message);
        }
      });
    });
  }, 50);

  return wss;
}
