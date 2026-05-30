import { useGameStore } from '../game/store';

export function MultiplierToggle() {
  const firstRoll = useGameStore((s) => s.firstRoll);
  const setFirstRoll = useGameStore((s) => s.setFirstRoll);

  return (
    <div className="felt-card p-6 flex items-center justify-between gap-4">
      <div>
        <div className="font-display text-xl text-ivory">First Roll ×2</div>
        <p className="text-sm text-ivory/60 max-w-xs">
          When on, the next bottom-section cell you log is doubled. Stays on
          until you turn it off — top-section scores are never doubled.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setFirstRoll(!firstRoll)}
        className={`relative w-20 h-10 rounded-full transition-colors ${
          firstRoll ? 'bg-amber-400' : 'bg-felt-900'
        } border border-ivory/20`}
        role="switch"
        aria-checked={firstRoll}
        aria-label="First roll multiplier"
      >
        <span
          className={`absolute top-1 left-1 w-8 h-8 rounded-full bg-ivory shadow transition-transform ${
            firstRoll ? 'translate-x-10' : 'translate-x-0'
          }`}
        />
        <span
          className={`absolute inset-0 flex items-center justify-center font-mono text-xs font-bold ${
            firstRoll ? 'text-felt-950' : 'text-ivory/40'
          }`}
        >
          {firstRoll ? '×2' : 'OFF'}
        </span>
      </button>
    </div>
  );
}
