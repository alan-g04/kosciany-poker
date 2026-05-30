import { useGameStore, MAX_ROLLS_PER_TURN } from '../game/store';
import { Die } from './Die';
import { DieFace } from '../game/types';

const FACES: DieFace[] = [1, 2, 3, 4, 5, 6];

export function DiceInput() {
  const dice = useGameStore((s) => s.dice);
  const cycleDie = useGameStore((s) => s.cycleDie);
  const setDie = useGameStore((s) => s.setDie);
  const firstRoll = useGameStore((s) => s.firstRoll);
  const diceMode = useGameStore((s) => s.diceMode);
  const rollNonce = useGameStore((s) => s.rollNonce);
  const keptMask = useGameStore((s) => s.keptMask);
  const rollsThisTurn = useGameStore((s) => s.rollsThisTurn);
  const rollVirtualDice = useGameStore((s) => s.rollVirtualDice);
  const nextManualRoll = useGameStore((s) => s.nextManualRoll);
  const toggleKept = useGameStore((s) => s.toggleKept);

  const isAuto = diceMode === 'auto';
  const rollsLeft = MAX_ROLLS_PER_TURN - rollsThisTurn;
  const canRoll = rollsLeft > 0;
  const canKeep = rollsThisTurn > 0 && rollsThisTurn < MAX_ROLLS_PER_TURN;

  return (
    <div className="felt-card p-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="font-display text-xl tracking-wide text-ivory">
          {isAuto ? 'Virtual dice' : 'Real-life dice'}
        </h2>
        <span className="text-xs uppercase tracking-[0.2em] text-ivory/60">
          Roll {Math.min(rollsThisTurn, MAX_ROLLS_PER_TURN)} / {MAX_ROLLS_PER_TURN}
          {firstRoll && <span className="text-amber-300/90 ml-2">· ×2 ARMED</span>}
        </span>
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        {dice.map((face, idx) => {
          const kept = keptMask[idx];
          const editable = !isAuto && !kept;
          return (
            <div key={idx} className="flex flex-col items-center gap-2">
              <div className={`relative ${kept ? 'ring-2 ring-emerald-400/80 rounded-xl' : ''}`}>
                <Die
                  face={face}
                  onClick={
                    isAuto
                      ? canKeep
                        ? () => toggleKept(idx)
                        : undefined
                      : () => cycleDie(idx)
                  }
                  active={firstRoll}
                  rollKey={isAuto && !kept ? rollNonce : undefined}
                />
                {kept && (
                  <span className="absolute -top-2 -right-2 text-[9px] font-mono bg-emerald-500 text-felt-950 rounded px-1 py-0.5 uppercase tracking-wider">
                    Kept
                  </span>
                )}
              </div>

              {!isAuto && (
                <div className="flex gap-1">
                  {FACES.map((f) => (
                    <button
                      key={f}
                      type="button"
                      disabled={!editable}
                      onClick={() => setDie(idx, f)}
                      className={`w-5 h-5 text-[10px] rounded-sm font-mono ${
                        face === f
                          ? 'bg-ivory text-felt-950'
                          : editable
                            ? 'bg-felt-900 text-ivory/50 hover:text-ivory'
                            : 'bg-felt-900 text-ivory/20 cursor-not-allowed'
                      }`}
                      aria-label={`Set die ${idx + 1} to ${f}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}

              {canKeep && (
                <button
                  type="button"
                  onClick={() => toggleKept(idx)}
                  className={`text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded ${
                    kept
                      ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-300/40'
                      : 'border border-ivory/20 text-ivory/60 hover:text-ivory'
                  }`}
                >
                  {kept ? 'Release' : 'Keep'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex justify-center items-center gap-3 text-sm">
        {isAuto ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => rollVirtualDice()}
            disabled={!canRoll}
          >
            {rollsThisTurn === 0 ? 'Roll dice' : 'Re-roll unkept'}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => nextManualRoll()}
            disabled={!canRoll}
          >
            {rollsThisTurn === 0 ? 'Begin turn' : `Mark roll ${rollsThisTurn + 1}`}
          </button>
        )}
        {!canRoll && (
          <span className="text-xs uppercase tracking-[0.2em] text-amber-300/80">
            All dice locked · pick a cell
          </span>
        )}
      </div>
    </div>
  );
}
