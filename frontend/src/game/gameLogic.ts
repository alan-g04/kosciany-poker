import {
  BOTTOM_CATEGORY_IDS,
  BottomCategoryId,
  CATEGORY_FACE,
  CategoryId,
  ColumnScores,
  ColumnTotals,
  DiceRoll,
  DieFace,
  PlayerScorecard,
  PlayerTotals,
  ScoreEntry,
  TOP_CATEGORY_IDS,
  TopCategoryId,
} from './types';

// ---------------------------------------------------------------------------
// Tunable constants — ISOLATED at the top of the module per spec.
// ---------------------------------------------------------------------------

export const TOP_BONUS_SMALL_THRESHOLD = 15;
export const TOP_BONUS_SMALL_REWARD = 50;
export const TOP_BONUS_BIG_THRESHOLD = 21;
export const TOP_BONUS_BIG_REWARD = 100;

export const BOTTOM_SECTION_UNLOCK_TOP_SCORES = 3;
export const COLUMN_CLEAN_SWEEP_BONUS = 100;
export const FIRST_ROLL_MULTIPLIER = 2;

// ---------------------------------------------------------------------------
// Dice helpers
// ---------------------------------------------------------------------------

export function countFaces(dice: DiceRoll): Record<DieFace, number> {
  const counts: Record<DieFace, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const d of dice) counts[d] += 1;
  return counts;
}

export function sumDice(dice: DiceRoll): number {
  return dice.reduce<number>((acc, d) => acc + d, 0);
}

// ---------------------------------------------------------------------------
// Raw category evaluators (BEFORE first-roll multiplier).
// Bottom-section evaluators return { value, crossedOut } where crossedOut is
// true when the roll does not satisfy the category's criteria.
// ---------------------------------------------------------------------------

/**
 * Top-section formula: Score = (n - 3) * v
 *   n = frequency of the rolled face for this category
 *   v = face value of the category (1..6)
 *
 * Examples (per spec):
 *   two 3s  -> (2 - 3) * 3 = -3
 *   four 5s -> (4 - 3) * 5 = +5
 */
export function evaluateTopRaw(category: TopCategoryId, dice: DiceRoll): number {
  const face = CATEGORY_FACE[category];
  const counts = countFaces(dice);
  const n = counts[face];
  return (n - 3) * face;
}

interface BottomEval {
  value: number;
  crossedOut: boolean;
}

function bottomZero(): BottomEval {
  return { value: 0, crossedOut: true };
}

function maxCount(counts: Record<DieFace, number>): number {
  return Math.max(counts[1], counts[2], counts[3], counts[4], counts[5], counts[6]);
}

/**
 * Returns the face that appears most often (highest face wins ties), so
 * "n of a kind" scoring uses the strongest matching group available.
 */
function dominantFace(counts: Record<DieFace, number>): DieFace {
  let best: DieFace = 1;
  for (const f of [1, 2, 3, 4, 5, 6] as DieFace[]) {
    if (counts[f] > counts[best] || (counts[f] === counts[best] && f > best)) {
      best = f;
    }
  }
  return best;
}

/**
 * For "n of a kind" categories: only the n matching dice contribute.
 *   e.g. dice [3,3,3,2,6] → threeOfAKind = 3 * 3 = 9
 *        dice [4,4,4,4,2] → fourOfAKind  = 4 * 4 = 16
 */
function sumOfKind(counts: Record<DieFace, number>, n: number): number {
  const face = dominantFace(counts);
  return face * n;
}

function isStraight(counts: Record<DieFace, number>, length: 4 | 5): boolean {
  const present = ([1, 2, 3, 4, 5, 6] as DieFace[]).map((f) => counts[f] >= 1);
  let run = 0;
  for (const p of present) {
    run = p ? run + 1 : 0;
    if (run >= length) return true;
  }
  return false;
}

export function evaluateBottomRaw(category: BottomCategoryId, dice: DiceRoll): BottomEval {
  const counts = countFaces(dice);
  switch (category) {
    case 'threeOfAKind':
      return maxCount(counts) >= 3
        ? { value: sumOfKind(counts, 3), crossedOut: false }
        : bottomZero();
    case 'fourOfAKind':
      return maxCount(counts) >= 4
        ? { value: sumOfKind(counts, 4), crossedOut: false }
        : bottomZero();
    case 'fullHouse': {
      const hasThree = Object.values(counts).some((c) => c === 3);
      const hasTwo = Object.values(counts).some((c) => c === 2);
      const isYahtzee = maxCount(counts) === 5;
      // Strict full house: exactly 3+2. Five of a kind does not satisfy.
      return hasThree && hasTwo && !isYahtzee
        ? { value: 25, crossedOut: false }
        : bottomZero();
    }
    case 'smallStraight':
      return isStraight(counts, 4) ? { value: 30, crossedOut: false } : bottomZero();
    case 'largeStraight':
      return isStraight(counts, 5) ? { value: 40, crossedOut: false } : bottomZero();
    case 'poker':
      return maxCount(counts) >= 5 ? { value: 50, crossedOut: false } : bottomZero();
    case 'chance':
      return { value: sumDice(dice), crossedOut: false };
  }
}

// ---------------------------------------------------------------------------
// Score-entry factories (apply first-roll multiplier).
// ---------------------------------------------------------------------------

function applyFirstRoll(value: number, firstRoll: boolean): number {
  return firstRoll ? value * FIRST_ROLL_MULTIPLIER : value;
}

export function buildTopEntry(
  category: TopCategoryId,
  dice: DiceRoll,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _firstRoll: boolean,
): ScoreEntry {
  // Top-section scores are NEVER multiplied by the first-roll bonus.
  const raw = evaluateTopRaw(category, dice);
  return {
    value: raw,
    crossedOut: false,
    firstRoll: false,
  };
}

export function buildBottomEntry(
  category: BottomCategoryId,
  dice: DiceRoll,
  firstRoll: boolean,
): ScoreEntry {
  const raw = evaluateBottomRaw(category, dice);
  // Crossed-out cells score 0 and are not multiplied by the first-roll bonus.
  const value = raw.crossedOut ? 0 : applyFirstRoll(raw.value, firstRoll);
  return {
    value,
    crossedOut: raw.crossedOut,
    firstRoll: raw.crossedOut ? false : firstRoll,
  };
}

// ---------------------------------------------------------------------------
// Column-level totals
// ---------------------------------------------------------------------------

export function topBonusForRaw(topRaw: number): number {
  if (topRaw >= TOP_BONUS_BIG_THRESHOLD) return TOP_BONUS_BIG_REWARD;
  if (topRaw >= TOP_BONUS_SMALL_THRESHOLD) return TOP_BONUS_SMALL_REWARD;
  return 0;
}

export function calculateColumnTotals(column: ColumnScores): ColumnTotals {
  let topRaw = 0;
  let bottomRaw = 0;
  let topFilled = 0;
  let bottomFilled = 0;
  let bottomCrossedOut = 0;

  for (const id of TOP_CATEGORY_IDS) {
    const entry = column[id];
    if (entry) {
      topRaw += entry.value;
      topFilled += 1;
    }
  }

  for (const id of BOTTOM_CATEGORY_IDS) {
    const entry = column[id];
    if (entry) {
      bottomRaw += entry.value;
      bottomFilled += 1;
      if (entry.crossedOut) bottomCrossedOut += 1;
    }
  }

  const complete =
    topFilled === TOP_CATEGORY_IDS.length && bottomFilled === BOTTOM_CATEGORY_IDS.length;

  const topBonus = topBonusForRaw(topRaw);
  // Per spec: +100 only when column is complete AND no crossed-out bottom cells.
  const columnBonus = complete && bottomCrossedOut === 0 ? COLUMN_CLEAN_SWEEP_BONUS : 0;

  const topTotal = topRaw + topBonus;
  const total = topTotal + bottomRaw + columnBonus;

  return {
    topRaw,
    topBonus,
    topTotal,
    bottomRaw,
    columnBonus,
    total,
    topFilled,
    bottomFilled,
    complete,
  };
}

export function calculatePlayerTotals(player: PlayerScorecard): PlayerTotals {
  const columns = player.columns.map((c) => calculateColumnTotals(c)) as PlayerTotals['columns'];
  const grandTotal = columns[0].total + columns[1].total + columns[2].total;
  return { columns, grandTotal };
}

// ---------------------------------------------------------------------------
// Selection rules
// ---------------------------------------------------------------------------

/**
 * Bottom column N is locked until top column N has at least
 * BOTTOM_SECTION_UNLOCK_TOP_SCORES entries. Per-column gating: each top
 * column unlocks its own bottom column independently.
 */
export function isBottomColumnUnlocked(
  player: PlayerScorecard,
  columnIndex: 0 | 1 | 2,
): boolean {
  let topCount = 0;
  for (const id of TOP_CATEGORY_IDS) {
    if (player.columns[columnIndex][id]) topCount += 1;
  }
  return topCount >= BOTTOM_SECTION_UNLOCK_TOP_SCORES;
}

/**
 * True if ANY bottom column is unlocked — used for status copy / hints only.
 */
export function isBottomSectionUnlocked(player: PlayerScorecard): boolean {
  return (
    isBottomColumnUnlocked(player, 0) ||
    isBottomColumnUnlocked(player, 1) ||
    isBottomColumnUnlocked(player, 2)
  );
}

/**
 * Returns true if the given (column, category) cell is currently selectable
 * by the player (free-choice columns, no directional fill).
 */
export function isCellSelectable(
  player: PlayerScorecard,
  columnIndex: 0 | 1 | 2,
  category: CategoryId,
): boolean {
  if (player.columns[columnIndex][category] !== undefined) return false;
  if (isBottomCategory(category)) {
    return isBottomColumnUnlocked(player, columnIndex);
  }
  return true;
}

export function isBottomCategory(category: CategoryId): category is BottomCategoryId {
  return (BOTTOM_CATEGORY_IDS as readonly string[]).includes(category);
}

export function isTopCategory(category: CategoryId): category is TopCategoryId {
  return (TOP_CATEGORY_IDS as readonly string[]).includes(category);
}

/**
 * Given the current dice and first-roll state, returns the integer that
 * WOULD be written into the cell if the user selected it now. This is the
 * value displayed during the highlight/preview phase.
 */
export function previewCellScore(
  dice: DiceRoll,
  category: CategoryId,
  firstRoll: boolean,
): { value: number; crossedOut: boolean } {
  if (isTopCategory(category)) {
    // Top section ignores firstRoll entirely.
    const entry = buildTopEntry(category, dice, false);
    return { value: entry.value, crossedOut: false };
  }
  const entry = buildBottomEntry(category, dice, firstRoll);
  return { value: entry.value, crossedOut: entry.crossedOut };
}

// ---------------------------------------------------------------------------
// Empty scorecard factory
// ---------------------------------------------------------------------------

export function emptyColumn(): ColumnScores {
  return {};
}

export function emptyPlayer(playerId: string, name: string): PlayerScorecard {
  return {
    playerId,
    name,
    columns: [emptyColumn(), emptyColumn(), emptyColumn()],
  };
}
