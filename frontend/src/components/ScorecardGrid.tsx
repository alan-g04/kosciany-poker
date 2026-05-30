import { useMemo } from 'react';
import { useGameStore } from '../game/store';
import {
  BOTTOM_CATEGORY_IDS,
  CATEGORY_LABEL,
  COLUMN_COUNT,
  CategoryId,
  ColumnIndex,
  PlayerScorecard,
  TOP_CATEGORY_IDS,
} from '../game/types';
import {
  calculatePlayerTotals,
  isBottomColumnUnlocked,
  isCellSelectable,
  previewCellScore,
  TOP_BONUS_BIG_REWARD,
  TOP_BONUS_BIG_THRESHOLD,
  TOP_BONUS_SMALL_REWARD,
  TOP_BONUS_SMALL_THRESHOLD,
  COLUMN_CLEAN_SWEEP_BONUS,
  BOTTOM_SECTION_UNLOCK_TOP_SCORES,
} from '../game/gameLogic';

interface CellProps {
  player: PlayerScorecard;
  column: ColumnIndex;
  category: CategoryId;
  bottomLockedForColumn: boolean;
  readOnly: boolean;
  onScored?: () => void;
}

function Cell({ player, column, category, bottomLockedForColumn, readOnly, onScored }: CellProps) {
  const dice = useGameStore((s) => s.dice);
  const firstRoll = useGameStore((s) => s.firstRoll);
  const rollsThisTurn = useGameStore((s) => s.rollsThisTurn);
  const scoreCell = useGameStore((s) => s.scoreCell);

  const entry = player.columns[column][category];
  const isBottom = BOTTOM_CATEGORY_IDS.includes(category as never);
  const locked = isBottom && bottomLockedForColumn;
  const hasRolled = rollsThisTurn > 0;
  const selectable =
    !readOnly && !locked && hasRolled && isCellSelectable(player, column, category);
  const preview = selectable ? previewCellScore(dice, category, firstRoll) : null;

  let body: React.ReactNode = null;
  let classes = 'grid-cell';
  if (entry) {
    classes += entry.crossedOut ? ' text-crimson line-through' : ' text-ivory';
    body = entry.crossedOut ? '✕' : entry.value;
  } else if (locked) {
    classes += ' grid-cell-locked';
    body = '—';
  } else if (selectable && preview) {
    classes += ' grid-cell-clickable grid-cell-highlight';
    body = (
      <span className={preview.crossedOut ? 'text-crimson/80' : 'text-amber-200/90'}>
        {preview.crossedOut ? '✕' : preview.value}
      </span>
    );
  } else {
    classes += ' grid-cell-clickable text-ivory/30';
    body = '·';
  }

  return (
    <div
      className={classes}
      onClick={() => {
        if (!selectable) return;
        scoreCell(column, category);
        onScored?.();
      }}
      role={selectable ? 'button' : undefined}
      aria-label={`${CATEGORY_LABEL[category]} column ${column + 1}`}
    >
      {body}
    </div>
  );
}

function TotalsRow({
  label,
  values,
  emphasis = false,
}: {
  label: string;
  values: (number | string)[];
  emphasis?: boolean;
}) {
  return (
    <>
      <div
        className={`grid-cell justify-start pl-3 text-left ${
          emphasis ? 'text-ivory font-bold' : 'text-ivory/70'
        }`}
      >
        {label}
      </div>
      {values.map((v, i) => (
        <div
          key={i}
          className={`grid-cell ${emphasis ? 'text-ivory font-bold' : 'text-ivory/80'}`}
        >
          {v}
        </div>
      ))}
    </>
  );
}

interface ScorecardGridProps {
  player: PlayerScorecard;
  readOnly?: boolean;
  onScored?: () => void;
}

export function ScorecardGrid({ player, readOnly = false, onScored }: ScorecardGridProps) {
  const totals = useMemo(() => calculatePlayerTotals(player), [player]);
  const bottomLockedByCol: [boolean, boolean, boolean] = [
    !isBottomColumnUnlocked(player, 0),
    !isBottomColumnUnlocked(player, 1),
    !isBottomColumnUnlocked(player, 2),
  ];
  const allBottomLocked = bottomLockedByCol.every(Boolean);

  const colHeaders = Array.from({ length: COLUMN_COUNT }, (_, i) => `Col ${i + 1}`);

  return (
    <div className="felt-card p-5">
      <div className="grid" style={{ gridTemplateColumns: '1.4fr repeat(3, 1fr)' }}>
        <div className="grid-cell justify-start pl-3 text-left font-display text-amber-200/90">
          {player.name}
        </div>
        {colHeaders.map((h, i) => (
          <div key={i} className="grid-cell font-display text-amber-200/90 text-xs tracking-[0.2em]">
            {h}
          </div>
        ))}

        <div className="col-span-4 mt-2 mb-1 text-[10px] uppercase tracking-[0.25em] text-ivory/40 pl-3">
          Top section · score = (n − 3) × v
        </div>

        {TOP_CATEGORY_IDS.map((cat) => (
          <FullRow
            key={cat}
            player={player}
            category={cat}
            bottomLockedByCol={[false, false, false]}
            readOnly={readOnly}
            onScored={onScored}
          />
        ))}

        <TotalsRow
          label="Top raw"
          values={totals.columns.map((c) => c.topRaw)}
        />
        <TotalsRow
          label={`Bonus (≥${TOP_BONUS_SMALL_THRESHOLD} → +${TOP_BONUS_SMALL_REWARD}, ≥${TOP_BONUS_BIG_THRESHOLD} → +${TOP_BONUS_BIG_REWARD})`}
          values={totals.columns.map((c) => c.topBonus)}
        />
        <TotalsRow
          label="Top total"
          values={totals.columns.map((c) => c.topTotal)}
          emphasis
        />

        <div className="col-span-4 mt-3 mb-1 text-[10px] uppercase tracking-[0.25em] text-ivory/40 pl-3">
          Bottom section {allBottomLocked && (
            <span className="text-crimson">
              · each column locks until ≥{BOTTOM_SECTION_UNLOCK_TOP_SCORES} top scores in that column
            </span>
          )}
        </div>

        {BOTTOM_CATEGORY_IDS.map((cat) => (
          <FullRow
            key={cat}
            player={player}
            category={cat}
            bottomLockedByCol={bottomLockedByCol}
            readOnly={readOnly}
            onScored={onScored}
          />
        ))}

        <TotalsRow
          label="Bottom raw"
          values={totals.columns.map((c) => c.bottomRaw)}
        />
        <TotalsRow
          label={`Clean column +${COLUMN_CLEAN_SWEEP_BONUS}`}
          values={totals.columns.map((c) => c.columnBonus)}
        />
        <TotalsRow
          label="Column total"
          values={totals.columns.map((c) => c.total)}
          emphasis
        />

        <div className="col-span-4 mt-4 border-t border-ivory/15" />

        <div className="grid-cell justify-start pl-3 text-left font-display text-amber-200">
          Grand total
        </div>
        <div className="col-span-3 grid-cell font-display text-2xl text-ivory">
          {totals.grandTotal}
        </div>
      </div>
    </div>
  );
}

function FullRow({
  player,
  category,
  bottomLockedByCol,
  readOnly,
  onScored,
}: {
  player: PlayerScorecard;
  category: CategoryId;
  bottomLockedByCol: [boolean, boolean, boolean];
  readOnly: boolean;
  onScored?: () => void;
}) {
  return (
    <>
      <div className="grid-cell justify-start pl-3 text-left text-ivory/80">
        {CATEGORY_LABEL[category]}
      </div>
      {[0, 1, 2].map((col) => (
        <Cell
          key={col}
          player={player}
          column={col as ColumnIndex}
          category={category}
          bottomLockedForColumn={bottomLockedByCol[col]}
          readOnly={readOnly}
          onScored={onScored}
        />
      ))}
    </>
  );
}
