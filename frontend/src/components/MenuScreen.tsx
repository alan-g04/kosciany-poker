import { useState } from 'react';
import { useGameStore, type PlayMode, type DiceMode } from '../game/store';

interface OptionCardProps<T extends string> {
  value: T;
  current: T;
  onSelect: (v: T) => void;
  label: string;
  hint: string;
}

function OptionCard<T extends string>({
  value,
  current,
  onSelect,
  label,
  hint,
}: OptionCardProps<T>) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex-1 text-left p-4 rounded-xl border transition-colors ${
        active
          ? 'border-amber-400 bg-amber-400/10'
          : 'border-ivory/15 hover:border-ivory/40'
      }`}
    >
      <div className="font-display text-lg text-ivory">{label}</div>
      <div className="text-xs text-ivory/60 mt-1 leading-snug">{hint}</div>
    </button>
  );
}

export function MenuScreen() {
  const startGame = useGameStore((s) => s.startGame);
  const initialPlayMode = useGameStore((s) => s.playMode);
  const initialDiceMode = useGameStore((s) => s.diceMode);
  const [playMode, setPlayMode] = useState<PlayMode>(initialPlayMode);
  const [diceMode, setDiceMode] = useState<DiceMode>(initialDiceMode);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="felt-card max-w-xl w-full p-8">
        <div className="text-[10px] uppercase tracking-[0.4em] text-amber-200/70">
          Polski wariant · digital scorecard
        </div>
        <h1 className="font-display text-4xl sm:text-5xl text-ivory mt-1 mb-8">
          Kościany Poker
        </h1>

        <section className="mb-6">
          <h2 className="text-xs uppercase tracking-[0.25em] text-ivory/50 mb-3">
            Play mode
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <OptionCard
              value="local"
              current={playMode}
              onSelect={setPlayMode}
              label="Local"
              hint="One device, passing turns around the table."
            />
            <OptionCard
              value="network"
              current={playMode}
              onSelect={setPlayMode}
              label="Networked"
              hint="Join a room over the broker and share a scorecard with peers."
            />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-[0.25em] text-ivory/50 mb-3">
            Dice
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <OptionCard
              value="manual"
              current={diceMode}
              onSelect={setDiceMode}
              label="Real-life dice"
              hint="Tap each die to enter the face you rolled IRL."
            />
            <OptionCard
              value="auto"
              current={diceMode}
              onSelect={setDiceMode}
              label="Virtual dice"
              hint="Tap Roll — the app spins five dice and locks in random faces."
            />
          </div>
        </section>

        <button
          type="button"
          className="btn btn-primary w-full text-base"
          onClick={() => startGame({ playMode, diceMode })}
        >
          Start
        </button>

        <p className="text-[11px] text-ivory/40 mt-4 leading-relaxed">
          You can return here any time via Reset. Networked play still needs a
          room code from the Network panel after starting.
        </p>
      </div>
    </div>
  );
}
