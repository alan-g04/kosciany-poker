import { useEffect } from 'react';

interface RulebookModalProps {
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="font-display text-lg text-amber-200/90 mb-2 tracking-wide">{title}</h3>
      <div className="text-sm text-ivory/80 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export function RulebookModal({ onClose }: RulebookModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-felt-950/80 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Rulebook"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl my-8 felt-card p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5 gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-amber-200/70">
              Rulebook
            </div>
            <h2 className="font-display text-3xl text-ivory mt-1">Kościany Poker</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost text-sm"
            aria-label="Close rulebook"
          >
            Close ✕
          </button>
        </div>

        <Section title="The board">
          <p>
            Each player has a single scorecard with <strong>three free-choice columns</strong>.
            There is no required fill order — within the rules below, any open
            cell in any column can be scored at any time during your turn.
          </p>
          <p>
            The scorecard is split into a top section (the{' '}
            <em>Szkółka</em>: six face-tally rows, one per die value) and a
            bottom section (seven combination rows from three-of-a-kind to
            chance).
          </p>
        </Section>

        <Section title="The turn">
          <p>You may roll up to <strong>three times</strong> per turn.</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Roll 1: all five dice are rolled.</li>
            <li>Between rolls, tap any die (or its <em>Keep</em> button) to lock it.</li>
            <li>Re-rolls only re-randomise dice you have not kept.</li>
            <li>After roll 3, every die is locked automatically.</li>
            <li>You must roll at least once before any cell becomes scorable.</li>
            <li>Each turn ends as soon as you log one score.</li>
          </ul>
          <p>
            After scoring, the table pauses briefly so everyone can read the
            result, then turn control passes to the next player.
          </p>
        </Section>

        <Section title="Top section · Szkółka">
          <p>
            For each face (1s–6s), the score in a column is computed by the
            formula{' '}
            <span className="font-mono text-amber-200/90">(n − 3) × v</span>,
            where <span className="font-mono">n</span> is how many dice show
            that face and <span className="font-mono">v</span> is the face
            value.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Three of a face → 0.</li>
            <li>Four 5s → <span className="font-mono">(4−3) × 5 = +5</span>.</li>
            <li>Two 3s → <span className="font-mono">(2−3) × 3 = −3</span>.</li>
            <li>Zero 6s → <span className="font-mono">(0−3) × 6 = −18</span>.</li>
          </ul>
          <p>
            <strong>Top scores are never doubled</strong>, even when the
            first-roll ×2 marker is armed.
          </p>
        </Section>

        <Section title="Top bonuses (per column)">
          <p>The Szkółka raw sum in each column awards a tiered bonus:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Top raw ≥ 15 → <strong>+50</strong></li>
            <li>Top raw ≥ 21 → <strong>+100</strong></li>
          </ul>
          <p>The higher tier supersedes the lower; you only ever earn one.</p>
        </Section>

        <Section title="Bottom section">
          <p>
            Bottom cells in a column unlock independently: column N's bottom
            opens once <strong>3 entries</strong> are logged in column N's top
            (filling other columns' tops doesn't help).
          </p>
          <p className="text-ivory/60">
            Rows are listed in the order they appear on the scorecard.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Pair</strong> · requires ≥2 matching dice. Score =
              highest pair × 2.
            </li>
            <li>
              <strong>2-Pair</strong> · requires two distinct pairs (a full
              house counts as well). Score = sum of all four paired dice.
            </li>
            <li>
              <strong>3 of a Kind</strong> · requires ≥3 matching dice. Score =
              face × 3 (only the matching dice count).
            </li>
            <li>
              <strong>Small Straight</strong> · exactly 1-2-3-4-5. Fixed{' '}
              <strong>15</strong>.
            </li>
            <li>
              <strong>Large Straight</strong> · exactly 2-3-4-5-6. Fixed{' '}
              <strong>20</strong>.
            </li>
            <li>
              <strong>Full House</strong> · strictly 3+2 of two different
              faces. Five-of-a-kind does <em>not</em> satisfy this. Fixed{' '}
              <strong>25</strong>.
            </li>
            <li>
              <strong>4 of a Kind</strong> · requires ≥4 matching dice. Score =
              face × 4.
            </li>
            <li>
              <strong>Poker</strong> (five of a kind) · all five dice match.
              Fixed <strong>50</strong>.
            </li>
            <li>
              <strong>Chance</strong> · always scores; sum of all five dice.
            </li>
            <li>
              <strong>Odds</strong> · always scores; sum of every die showing
              1, 3, or 5.
            </li>
            <li>
              <strong>Evens</strong> · always scores; sum of every die showing
              2, 4, or 6.
            </li>
          </ul>
          <p>
            If you log a row whose criteria the dice don't meet (Pair, 2-Pair,
            3/4-of-a-kind, Poker, the straights, or Full House), the cell is{' '}
            <strong>crossed out</strong> and scores 0. Chance, Odds, and Evens
            never cross out.
          </p>
        </Section>

        <Section title="First Roll ×2">
          <p>
            When the ×2 marker is armed, the next bottom-section cell you log
            is doubled. It applies to bottom scores only — Szkółka entries are
            never doubled.
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              In <strong>virtual dice</strong> mode the marker is automatic:
              it's armed at the start of every turn and clears the instant
              you re-roll.
            </li>
            <li>
              In <strong>real-life dice</strong> mode you control the marker
              yourself, so it accurately reflects what your physical dice did.
            </li>
            <li>A crossed-out bottom cell is never doubled.</li>
          </ul>
        </Section>

        <Section title="Clean-sweep column bonus">
          <p>
            Complete every row in a column and you'll be awarded{' '}
            <strong>+100</strong> for that column — but only if{' '}
            <em>no bottom cell in that column is crossed out</em>. Any cross
            cancels the bonus.
          </p>
        </Section>

        <Section title="Networked play">
          <p>
            Pick "Networked" from the menu and share a room code from the
            Network panel. The server is a stateless pub/sub broker — every
            client keeps its own state, and action diffs are broadcast to peers
            in the room.
          </p>
          <p>
            You can open any peer's scorecard popup at any time, even when
            it's not your turn.
          </p>
        </Section>

        <Section title="End of game">
          <p>
            The game ends when every player has filled every cell in all three
            columns. The highest grand total wins. Use the Export CSV button to
            archive the final scorecard.
          </p>
        </Section>
      </div>
    </div>
  );
}
