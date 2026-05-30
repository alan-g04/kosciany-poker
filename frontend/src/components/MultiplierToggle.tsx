import { useGameStore } from '../game/store';

export function MultiplierToggle() {
  const firstRoll = useGameStore((s) => s.firstRoll);
  const diceMode = useGameStore((s) => s.diceMode);
  const setFirstRoll = useGameStore((s) => s.setFirstRoll);

  // Virtual dice mode controls the multiplier automatically — the user can't
  // toggle it. In manual mode the player needs to flip it themselves to
  // reflect what their physical dice did.
  const interactive = diceMode === 'manual';

  return (
    <div className="felt-card p-6 flex items-center justify-between gap-4">
      <div>
        <div className="font-display text-xl text-ivory">First Roll ×2</div>
        <p className="text-sm text-ivory/60 max-w-xs">
          {interactive
            ? 'Doubles the next bottom-section cell you log. Clears when you mark roll 2. Top scores are never doubled.'
            : 'Indicator only — virtual dice arms it on each turn and clears it once you re-roll.'}
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
          onClick={interactive ? () => setFirstRoll(!firstRoll) : undefined}
          disabled={!interactive}
          aria-disabled={!interactive}
          className={`relative w-14 h-7 rounded-full transition-colors border ${
            firstRoll ? 'bg-amber-400 border-ivory/25' : 'bg-felt-950 border-ivory/25'
          } ${interactive ? '' : 'opacity-60 cursor-not-allowed'}`}
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
