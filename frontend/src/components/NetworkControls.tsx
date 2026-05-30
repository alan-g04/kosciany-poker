import { useEffect, useState } from 'react';
import {
  ConnectionStatus,
  connect,
  disconnect,
  subscribeStatus,
} from '../net/websocket';

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  idle: 'Offline',
  connecting: 'Connecting…',
  open: 'Connected',
  closed: 'Disconnected',
  error: 'Error',
};

const STATUS_DOT: Record<ConnectionStatus, string> = {
  idle: 'bg-ivory/30',
  connecting: 'bg-amber-400 animate-pulse',
  open: 'bg-emerald-400',
  closed: 'bg-ivory/40',
  error: 'bg-crimson',
};

export function NetworkControls() {
  const [room, setRoom] = useState('');
  const [status, setStatus] = useState<ConnectionStatus>('idle');

  useEffect(() => subscribeStatus(setStatus), []);

  const connected = status === 'open' || status === 'connecting';

  return (
    <div className="felt-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl text-ivory">Networked play</h2>
        <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ivory/60">
          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="Room code (e.g. parlor-42)"
          className="flex-1 bg-felt-950 border border-ivory/15 rounded-lg px-3 py-2 text-ivory font-mono text-sm outline-none focus:border-amber-400/70"
          disabled={connected}
        />
        {connected ? (
          <button type="button" className="btn btn-danger text-sm" onClick={() => disconnect()}>
            Leave
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary text-sm"
            onClick={() => room.trim() && connect(room.trim())}
            disabled={!room.trim()}
          >
            Join
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-ivory/50">
        Stateless broker — broadcasts your action diffs to peers in the same
        room. Game state lives on each client.
      </p>
    </div>
  );
}
