import { useState } from 'react';
import { useGameStore } from './game/store';
import { DiceInput } from './components/DiceInput';
import { MultiplierToggle } from './components/MultiplierToggle';
import { PlayersBar } from './components/PlayersBar';
import { NetworkControls } from './components/NetworkControls';
import { ExportButtons } from './components/ExportButtons';
import { MenuScreen } from './components/MenuScreen';
import { ScorecardGrid } from './components/ScorecardGrid';
import { ScorecardModal } from './components/ScorecardModal';
import { RulebookModal } from './components/RulebookModal';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const players = useGameStore((s) => s.players);
  const activePlayerId = useGameStore((s) => s.activePlayerId);
  const playMode = useGameStore((s) => s.playMode);
  const resetGame = useGameStore((s) => s.resetGame);
  const openMenu = useGameStore((s) => s.openMenu);

  const [popupPlayerId, setPopupPlayerId] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  if (screen === 'menu') return <MenuScreen />;

  const activePlayer =
    players.find((p) => p.playerId === activePlayerId) ?? players[0] ?? null;

  const popupPlayer =
    popupPlayerId != null && popupPlayerId !== activePlayer?.playerId
      ? players.find((p) => p.playerId === popupPlayerId) ?? null
      : null;

  const handleOpenScorecard = (playerId: string) => {
    if (playerId === activePlayer?.playerId) return;
    setPopupPlayerId(playerId);
  };

  return (
    <div className="min-h-screen flex flex-col px-4 sm:px-8 py-8 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl text-ivory leading-none">
            Kościany Poker
          </h1>
          <div className="text-[10px] uppercase tracking-[0.4em] text-amber-200/70 mt-3">
            Grucha wariant · digital scorecard
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <ExportButtons />
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={() => setRulesOpen(true)}
          >
            Rules
          </button>
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

      <div className="grid lg:grid-cols-12 gap-6 flex-1">
        <section className="lg:col-span-7 flex flex-col gap-6">
          <DiceInput />
          <MultiplierToggle />
          {activePlayer && <ScorecardGrid player={activePlayer} />}
        </section>

        <aside className="lg:col-span-5 flex flex-col gap-6">
          <PlayersBar onOpenScorecard={handleOpenScorecard} />
          {playMode === 'network' && <NetworkControls />}
        </aside>
      </div>

      {popupPlayer && (
        <ScorecardModal
          player={popupPlayer}
          readOnly
          onClose={() => setPopupPlayerId(null)}
        />
      )}
      {rulesOpen && <RulebookModal onClose={() => setRulesOpen(false)} />}

      <footer className="mt-12 pt-6 border-t border-ivory/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-ivory/50">
        <span>© 2026 Alan Gruszkiewicz</span>
        <span>
          <a
            href="https://github.com/alan-g04/kosciany-poker"
            target="_blank"
            rel="noreferrer"
            className="hover:text-ivory underline-offset-2 hover:underline"
          >
            Source on GitHub
          </a>
        </span>
      </footer>
    </div>
  );
}
