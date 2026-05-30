import { useState } from 'react';
import { useGameStore } from './game/store';
import { DiceInput } from './components/DiceInput';
import { MultiplierToggle } from './components/MultiplierToggle';
import { PlayersBar } from './components/PlayersBar';
import { NetworkControls } from './components/NetworkControls';
import { ExportButtons } from './components/ExportButtons';
import { MenuScreen } from './components/MenuScreen';
import { ScorecardModal } from './components/ScorecardModal';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const players = useGameStore((s) => s.players);
  const activePlayerId = useGameStore((s) => s.activePlayerId);
  const playMode = useGameStore((s) => s.playMode);
  const diceMode = useGameStore((s) => s.diceMode);
  const resetGame = useGameStore((s) => s.resetGame);
  const openMenu = useGameStore((s) => s.openMenu);

  const [openCardPlayerId, setOpenCardPlayerId] = useState<string | null>(null);

  if (screen === 'menu') return <MenuScreen />;

  const activePlayer =
    players.find((p) => p.playerId === activePlayerId) ?? players[0] ?? null;
  const openCardPlayer =
    openCardPlayerId != null
      ? players.find((p) => p.playerId === openCardPlayerId) ?? null
      : null;
  const openCardIsActive =
    !!openCardPlayer && !!activePlayer && openCardPlayer.playerId === activePlayer.playerId;

  return (
    <div className="min-h-screen px-4 sm:px-8 py-8 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
        <div>
          <div className="text-[10px] uppercase tracking-[0.4em] text-amber-200/70">
            Polski wariant · digital scorecard ·{' '}
            <span className="text-ivory/70">{playMode}</span> ·{' '}
            <span className="text-ivory/70">
              {diceMode === 'auto' ? 'virtual dice' : 'real-life dice'}
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-ivory mt-1">
            Kościany Poker
          </h1>
        </div>
        <div className="flex gap-2">
          <ExportButtons />
          {activePlayer && (
            <button
              type="button"
              className="btn btn-primary text-sm"
              onClick={() => setOpenCardPlayerId(activePlayer.playerId)}
            >
              Open scorecard
            </button>
          )}
          <button type="button" className="btn btn-ghost text-sm" onClick={openMenu}>
            Menu
          </button>
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={() => {
              if (confirm('Reset the entire scorecard?')) resetGame();
            }}
          >
            Reset
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 flex flex-col gap-6">
          <DiceInput />
          <MultiplierToggle />
        </section>

        <aside className="lg:col-span-5 flex flex-col gap-6">
          <PlayersBar onOpenScorecard={setOpenCardPlayerId} />
          {playMode === 'network' && <NetworkControls />}
          <div className="felt-card p-5 text-sm text-ivory/70 leading-relaxed">
            <h3 className="font-display text-lg text-ivory mb-2">Quick rules</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>3 rolls per turn; keep dice between rolls.</li>
              <li>Top section: <span className="font-mono">(n − 3) × v</span>; never doubled.</li>
              <li>Top bonus per column: ≥15 → +50, ≥21 → +100.</li>
              <li>Each top column unlocks its own bottom column (3 entries).</li>
              <li>n-of-a-kind sums only the matching dice.</li>
              <li>First Roll ×2 doubles bottom-section scores only.</li>
              <li>Clean column +100 if no crossed-out bottom cells.</li>
            </ul>
          </div>
        </aside>
      </div>

      {openCardPlayer && (
        <ScorecardModal
          player={openCardPlayer}
          readOnly={!openCardIsActive}
          onClose={() => setOpenCardPlayerId(null)}
        />
      )}

      <footer className="mt-10 text-center text-xs text-ivory/40 tracking-[0.2em] uppercase">
        Client-authoritative · localStorage persisted · WebSocket broker
      </footer>
    </div>
  );
}
