import { useGameStore } from '../game/store';

export function MultiplierToggle() {
  const firstRoll = useGameStore((s) => s.firstRoll);
  const setFirstRoll = useGameStore((s) => s.setFirstRoll);

  return (
    <div className="felt-card p-6 flex items-center justify-between gap-4">
      <div>
        <div className="font-display text-xl text-ivory">First Roll ×2</div>
        <p className="text-sm text-ivory/60 max-w-xs">
          Doubles the next bottom-section cell you log. Clears the moment
          you roll a second time. Top-section scores are never doubled.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`font-mono text-xs uppercase tracking-[0.2em] ${
            firstRoll ? 'text-amber-200' : 'text-ivory/40'
          }`}
        >
          {firstRoll ? '×2 armed' : 'Off'}
        </span>
        <button
          type="button"
          onClick={() => setFirstRoll(!firstRoll)}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            firstRoll ? 'bg-amber-400' : 'bg-felt-950'
          } border border-ivory/25`}
          role="switch"
          aria-checked={firstRoll}
          aria-label="First-roll multiplier"
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-ivory shadow transition-transform ${
              firstRoll ? 'translate-x-7' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
