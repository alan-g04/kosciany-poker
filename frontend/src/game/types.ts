export type DieFace = 1 | 2 | 3 | 4 | 5 | 6;
export type DiceRoll = [DieFace, DieFace, DieFace, DieFace, DieFace];

export const COLUMN_COUNT = 3;
export type ColumnIndex = 0 | 1 | 2;

export type TopCategoryId = 'ones' | 'twos' | 'threes' | 'fours' | 'fives' | 'sixes';

export type BottomCategoryId =
  | 'pair'
  | 'twoPair'
  | 'threeOfAKind'
  | 'smallStraight'
  | 'largeStraight'
  | 'fullHouse'
  | 'fourOfAKind'
  | 'poker'
  | 'chance'
  | 'odds'
  | 'evens';

export type CategoryId = TopCategoryId | BottomCategoryId;

export const TOP_CATEGORY_IDS: readonly TopCategoryId[] = [
  'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
] as const;

export const BOTTOM_CATEGORY_IDS: readonly BottomCategoryId[] = [
  'pair',
  'twoPair',
  'threeOfAKind',
  'smallStraight',
  'largeStraight',
  'fullHouse',
  'fourOfAKind',
  'poker',
  'chance',
  'odds',
  'evens',
] as const;

export const CATEGORY_FACE: Record<TopCategoryId, DieFace> = {
  ones: 1,
  twos: 2,
  threes: 3,
  fours: 4,
  fives: 5,
  sixes: 6,
};

export const CATEGORY_LABEL: Record<CategoryId, string> = {
  ones: '1s',
  twos: '2s',
  threes: '3s',
  fours: '4s',
  fives: '5s',
  sixes: '6s',
  pair: 'Pair',
  twoPair: '2-Pair',
  threeOfAKind: '3 of a Kind',
  smallStraight: 'Small Straight',
  largeStraight: 'Large Straight',
  fullHouse: 'Full House',
  fourOfAKind: '4 of a Kind',
  poker: 'Poker (5 of a Kind)',
  chance: 'Chance',
  odds: 'Odds',
  evens: 'Evens',
};

export interface ScoreEntry {
  /** Final integer score written into the cell (after first-roll multiplier). */
  value: number;
  /** True when player crossed out a bottom category (scored 0 due to unmet criteria). */
  crossedOut: boolean;
  /** Whether the first-roll x2 multiplier was applied to this entry. */
  firstRoll: boolean;
}

export type ColumnScores = Partial<Record<CategoryId, ScoreEntry>>;

export interface PlayerScorecard {
  playerId: string;
  name: string;
  columns: [ColumnScores, ColumnScores, ColumnScores];
}

export interface ColumnTotals {
  topRaw: number;
  topBonus: number;
  topTotal: number;
  bottomRaw: number;
  columnBonus: number;
  total: number;
  topFilled: number;
  bottomFilled: number;
  complete: boolean;
}

export interface PlayerTotals {
  columns: [ColumnTotals, ColumnTotals, ColumnTotals];
  grandTotal: number;
}
