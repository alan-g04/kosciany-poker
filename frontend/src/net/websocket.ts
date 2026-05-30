import { ActionEvent, useGameStore } from '../game/store';

const DEFAULT_WS_URL =
  (import.meta.env.VITE_WS_URL as string | undefined) ?? 'ws://localhost:8000/ws';

export type ConnectionStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error';

interface ConnectionMeta {
  ws: WebSocket;
  room: string;
  peerId: string;
  url: string;
}

interface WireMessage {
  peerId: string;
  action: ActionEvent;
}

let current: ConnectionMeta | null = null;
const statusListeners = new Set<(s: ConnectionStatus) => void>();
let lastStatus: ConnectionStatus = 'idle';

function setStatus(s: ConnectionStatus) {
  lastStatus = s;
  for (const l of statusListeners) l(s);
}

export function subscribeStatus(fn: (s: ConnectionStatus) => void): () => void {
  statusListeners.add(fn);
  fn(lastStatus);
  return () => {
    statusListeners.delete(fn);
  };
}

export function getStatus(): ConnectionStatus {
  return lastStatus;
}

export function connect(room: string, url: string = DEFAULT_WS_URL): void {
  disconnect();
  const peerId = Math.random().toString(36).slice(2, 10);
  const endpoint = `${url.replace(/\/$/, '')}/${encodeURIComponent(room)}`;
  setStatus('connecting');
  const ws = new WebSocket(endpoint);
  current = { ws, room, peerId, url };

  ws.onopen = () => {
    setStatus('open');
    useGameStore.getState().setRemoteEmitter((action) => {
      if (current && current.ws.readyState === WebSocket.OPEN) {
        const msg: WireMessage = { peerId, action };
        current.ws.send(JSON.stringify(msg));
      }
    });
  };

  ws.onclose = () => {
    if (current?.ws === ws) {
      useGameStore.getState().setRemoteEmitter(null);
      current = null;
    }
    setStatus('closed');
  };

  ws.onerror = () => setStatus('error');

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data) as WireMessage;
      if (msg.peerId === peerId) return;
      useGameStore.getState().applyRemote(msg.action);
    } catch {
      /* ignore malformed */
    }
  };
}

export function disconnect(): void {
  if (current) {
    try {
      current.ws.close();
    } catch {
      /* ignore */
    }
    useGameStore.getState().setRemoteEmitter(null);
    current = null;
  }
  setStatus('idle');
}

export function currentRoom(): string | null {
  return current?.room ?? null;
}
