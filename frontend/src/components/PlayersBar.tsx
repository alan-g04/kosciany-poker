import { useGameStore } from '../game/store';

interface PlayersBarProps {
  onOpenScorecard: (playerId: string) => void;
}

export function PlayersBar({ onOpenScorecard }: PlayersBarProps) {
  const players = useGameStore((s) => s.players);
  const activePlayerId = useGameStore((s) => s.activePlayerId);
  const setActivePlayer = useGameStore((s) => s.setActivePlayer);
  const addPlayer = useGameStore((s) => s.addPlayer);
  const removePlayer = useGameStore((s) => s.removePlayer);
  const renamePlayer = useGameStore((s) => s.renamePlayer);

  const active = activePlayerId ?? players[0]?.playerId ?? null;

  return (
    <div className="felt-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl text-ivory">Players</h2>
        <button
          type="button"
          className="btn btn-ghost text-sm"
          onClick={() => addPlayer(`Player ${players.length + 1}`)}
        >
          + Add
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {players.map((p) => {
          const isActive = p.playerId === active;
          return (
            <li
              key={p.playerId}
              className={`flex items-center gap-2 p-2 rounded-lg border ${
                isActive ? 'border-amber-400/70 bg-amber-400/5' : 'border-ivory/10'
              }`}
            >
              <button
                type="button"
                onClick={() => setActivePlayer(p.playerId)}
                className="text-[10px] uppercase tracking-[0.2em] text-ivory/60 hover:text-ivory min-w-[3.2rem] text-left"
                aria-label={`Set ${p.name} as active turn`}
              >
                {isActive ? 'Turn' : 'Set turn'}
              </button>

              <input
                value={p.name}
                onChange={(e) => renamePlayer(p.playerId, e.target.value)}
                className="bg-transparent flex-1 font-display text-lg text-ivory outline-none"
              />

              {!isActive && (
                <button
                  type="button"
                  onClick={() => onOpenScorecard(p.playerId)}
                  className="text-[11px] uppercase tracking-[0.18em] px-2 py-1 rounded border border-ivory/20 text-ivory/70 hover:text-ivory hover:border-ivory/50"
                  aria-label={`Open ${p.name}'s scorecard`}
                >
                  Scorecard
                </button>
              )}

              <button
                type="button"
                className="text-ivory/40 hover:text-crimson text-sm"
                onClick={() => removePlayer(p.playerId)}
                aria-label={`Remove ${p.name}`}
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
