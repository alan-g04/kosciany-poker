import { describe, expect, it } from 'vitest';
import {
  BOTTOM_SECTION_UNLOCK_TOP_SCORES,
  COLUMN_CLEAN_SWEEP_BONUS,
  FIRST_ROLL_MULTIPLIER,
  TOP_BONUS_BIG_REWARD,
  TOP_BONUS_BIG_THRESHOLD,
  TOP_BONUS_SMALL_REWARD,
  TOP_BONUS_SMALL_THRESHOLD,
  buildBottomEntry,
  buildTopEntry,
  calculateColumnTotals,
  emptyPlayer,
  evaluateBottomRaw,
  evaluateTopRaw,
  isBottomColumnUnlocked,
  isCellSelectable,
  previewCellScore,
  topBonusForRaw,
} from './gameLogic';
import { DiceRoll, BOTTOM_CATEGORY_IDS, TOP_CATEGORY_IDS } from './types';

const d = (a: number, b: number, c: number, e: number, f: number): DiceRoll =>
  [a, b, c, e, f] as unknown as DiceRoll;

describe('top-section formula (n - 3) * v', () => {
  it('two 3s -> -3', () => {
    expect(evaluateTopRaw('threes', d(3, 3, 1, 2, 6))).toBe(-3);
  });

  it('four 5s -> +5', () => {
    expect(evaluateTopRaw('fives', d(5, 5, 5, 5, 2))).toBe(5);
  });

  it('zero of the face -> -3 * v', () => {
    expect(evaluateTopRaw('sixes', d(1, 2, 3, 4, 5))).toBe(-18);
  });

  it('exactly three -> 0', () => {
    expect(evaluateTopRaw('fours', d(4, 4, 4, 1, 2))).toBe(0);
  });

  it('five of a kind tops -> (5-3)*v', () => {
    expect(evaluateTopRaw('twos', d(2, 2, 2, 2, 2))).toBe(4);
  });
});

describe('bottom-section evaluators', () => {
  it('three of a kind sums only the matching three dice', () => {
    expect(evaluateBottomRaw('threeOfAKind', d(3, 3, 3, 2, 6))).toEqual({ value: 9, crossedOut: false });
  });

  it('three of a kind not satisfied -> crossed out', () => {
    expect(evaluateBottomRaw('threeOfAKind', d(1, 2, 3, 4, 5))).toEqual({ value: 0, crossedOut: true });
  });

  it('four of a kind sums only the matching four dice', () => {
    expect(evaluateBottomRaw('fourOfAKind', d(4, 4, 4, 4, 2))).toEqual({ value: 16, crossedOut: false });
  });

  it('full house = 25 (strict 3+2)', () => {
    expect(evaluateBottomRaw('fullHouse', d(2, 2, 5, 5, 5))).toEqual({ value: 25, crossedOut: false });
  });

  it('five of a kind is NOT a full house', () => {
    expect(evaluateBottomRaw('fullHouse', d(3, 3, 3, 3, 3))).toEqual({ value: 0, crossedOut: true });
  });

  it('small straight = 30', () => {
    expect(evaluateBottomRaw('smallStraight', d(1, 2, 3, 4, 6))).toEqual({ value: 30, crossedOut: false });
    expect(evaluateBottomRaw('smallStraight', d(2, 3, 4, 5, 5))).toEqual({ value: 30, crossedOut: false });
  });

  it('large straight = 40', () => {
    expect(evaluateBottomRaw('largeStraight', d(1, 2, 3, 4, 5))).toEqual({ value: 40, crossedOut: false });
    expect(evaluateBottomRaw('largeStraight', d(2, 3, 4, 5, 6))).toEqual({ value: 40, crossedOut: false });
    expect(evaluateBottomRaw('largeStraight', d(1, 2, 3, 4, 6))).toEqual({ value: 0, crossedOut: true });
  });

  it('poker (5 of a kind) = 50', () => {
    expect(evaluateBottomRaw('poker', d(6, 6, 6, 6, 6))).toEqual({ value: 50, crossedOut: false });
    expect(evaluateBottomRaw('poker', d(6, 6, 6, 6, 1))).toEqual({ value: 0, crossedOut: true });
  });

  it('chance always scores sum, never crossed out', () => {
    expect(evaluateBottomRaw('chance', d(1, 2, 3, 4, 5))).toEqual({ value: 15, crossedOut: false });
    expect(evaluateBottomRaw('chance', d(6, 6, 6, 6, 6))).toEqual({ value: 30, crossedOut: false });
  });
});

describe('first-roll multiplier', () => {
  it('does NOT multiply a top-section entry, even when firstRoll is true', () => {
    const entry = buildTopEntry('fives', d(5, 5, 5, 5, 2), true);
    expect(entry.value).toBe(5);
    expect(entry.firstRoll).toBe(false);
  });

  it('does NOT multiply a negative top-section entry', () => {
    const entry = buildTopEntry('sixes', d(1, 2, 3, 4, 5), true);
    expect(entry.value).toBe(-18);
    expect(FIRST_ROLL_MULTIPLIER).toBe(2);
  });

  it('doubles a bottom-section entry that scored', () => {
    const entry = buildBottomEntry('chance', d(1, 2, 3, 4, 5), true);
    expect(entry.value).toBe(30);
    expect(entry.firstRoll).toBe(true);
  });

  it('does NOT multiply a crossed-out bottom entry', () => {
    const entry = buildBottomEntry('poker', d(1, 2, 3, 4, 5), true);
    expect(entry.value).toBe(0);
    expect(entry.crossedOut).toBe(true);
    expect(entry.firstRoll).toBe(false);
  });
});

describe('top-section bonus tiering', () => {
  it('returns 0 below small threshold', () => {
    expect(topBonusForRaw(TOP_BONUS_SMALL_THRESHOLD - 1)).toBe(0);
  });

  it('returns small reward exactly at small threshold', () => {
    expect(topBonusForRaw(TOP_BONUS_SMALL_THRESHOLD)).toBe(TOP_BONUS_SMALL_REWARD);
  });

  it('returns small reward between thresholds', () => {
    expect(topBonusForRaw(TOP_BONUS_BIG_THRESHOLD - 1)).toBe(TOP_BONUS_SMALL_REWARD);
  });

  it('returns big reward at big threshold', () => {
    expect(topBonusForRaw(TOP_BONUS_BIG_THRESHOLD)).toBe(TOP_BONUS_BIG_REWARD);
  });

  it('returns big reward above big threshold', () => {
    expect(topBonusForRaw(999)).toBe(TOP_BONUS_BIG_REWARD);
  });
});

describe('column totals', () => {
  it('applies top bonus and clean-sweep bonus on a complete column', () => {
    const column = {
      ones: { value: 2, crossedOut: false, firstRoll: false },
      twos: { value: 4, crossedOut: false, firstRoll: false },
      threes: { value: 6, crossedOut: false, firstRoll: false },
      fours: { value: 8, crossedOut: false, firstRoll: false },
      fives: { value: 10, crossedOut: false, firstRoll: false },
      sixes: { value: 12, crossedOut: false, firstRoll: false },
      threeOfAKind: { value: 17, crossedOut: false, firstRoll: false },
      fourOfAKind: { value: 18, crossedOut: false, firstRoll: false },
      fullHouse: { value: 25, crossedOut: false, firstRoll: false },
      smallStraight: { value: 30, crossedOut: false, firstRoll: false },
      largeStraight: { value: 40, crossedOut: false, firstRoll: false },
      poker: { value: 50, crossedOut: false, firstRoll: false },
      chance: { value: 25, crossedOut: false, firstRoll: false },
    };
    const totals = calculateColumnTotals(column);
    expect(totals.topRaw).toBe(42);
    expect(totals.topBonus).toBe(TOP_BONUS_BIG_REWARD);
    expect(totals.bottomRaw).toBe(205);
    expect(totals.columnBonus).toBe(COLUMN_CLEAN_SWEEP_BONUS);
    expect(totals.complete).toBe(true);
    expect(totals.total).toBe(42 + TOP_BONUS_BIG_REWARD + 205 + COLUMN_CLEAN_SWEEP_BONUS);
  });

  it('withholds clean-sweep bonus when ANY bottom cell is crossed out', () => {
    const column = {
      ones: { value: 2, crossedOut: false, firstRoll: false },
      twos: { value: 4, crossedOut: false, firstRoll: false },
      threes: { value: 6, crossedOut: false, firstRoll: false },
      fours: { value: 8, crossedOut: false, firstRoll: false },
      fives: { value: 10, crossedOut: false, firstRoll: false },
      sixes: { value: 12, crossedOut: false, firstRoll: false },
      threeOfAKind: { value: 17, crossedOut: false, firstRoll: false },
      fourOfAKind: { value: 18, crossedOut: false, firstRoll: false },
      fullHouse: { value: 25, crossedOut: false, firstRoll: false },
      smallStraight: { value: 30, crossedOut: false, firstRoll: false },
      largeStraight: { value: 40, crossedOut: false, firstRoll: false },
      poker: { value: 0, crossedOut: true, firstRoll: false },
      chance: { value: 25, crossedOut: false, firstRoll: false },
    };
    const totals = calculateColumnTotals(column);
    expect(totals.complete).toBe(true);
    expect(totals.columnBonus).toBe(0);
  });

  it('does NOT award clean-sweep bonus on an incomplete column', () => {
    const column = {
      ones: { value: 2, crossedOut: false, firstRoll: false },
    };
    const totals = calculateColumnTotals(column);
    expect(totals.complete).toBe(false);
    expect(totals.columnBonus).toBe(0);
  });
});

describe('per-column bottom unlock', () => {
  it('locked when the column has fewer than threshold top entries', () => {
    const player = emptyPlayer('p1', 'Alice');
    player.columns[0].ones = { value: 1, crossedOut: false, firstRoll: false };
    player.columns[0].twos = { value: 2, crossedOut: false, firstRoll: false };
    expect(isBottomColumnUnlocked(player, 0)).toBe(false);
    expect(isCellSelectable(player, 0, 'poker')).toBe(false);
  });

  it('top entries in other columns do NOT unlock this column', () => {
    const player = emptyPlayer('p2', 'Bob');
    player.columns[0].ones = { value: 1, crossedOut: false, firstRoll: false };
    player.columns[1].twos = { value: 2, crossedOut: false, firstRoll: false };
    player.columns[2].threes = { value: 3, crossedOut: false, firstRoll: false };
    expect(BOTTOM_SECTION_UNLOCK_TOP_SCORES).toBe(3);
    expect(isBottomColumnUnlocked(player, 0)).toBe(false);
    expect(isBottomColumnUnlocked(player, 1)).toBe(false);
    expect(isBottomColumnUnlocked(player, 2)).toBe(false);
    expect(isCellSelectable(player, 0, 'poker')).toBe(false);
  });

  it('unlocks once that column has enough top entries', () => {
    const player = emptyPlayer('p3', 'Cara');
    player.columns[1].ones = { value: 1, crossedOut: false, firstRoll: false };
    player.columns[1].twos = { value: 2, crossedOut: false, firstRoll: false };
    player.columns[1].threes = { value: 3, crossedOut: false, firstRoll: false };
    expect(isBottomColumnUnlocked(player, 0)).toBe(false);
    expect(isBottomColumnUnlocked(player, 1)).toBe(true);
    expect(isBottomColumnUnlocked(player, 2)).toBe(false);
    expect(isCellSelectable(player, 1, 'poker')).toBe(true);
    expect(isCellSelectable(player, 0, 'poker')).toBe(false);
  });

  it('already-filled cell is never selectable', () => {
    const player = emptyPlayer('p4', 'Dee');
    // give column 0 enough top entries so chance would otherwise be selectable
    player.columns[0].ones = { value: 1, crossedOut: false, firstRoll: false };
    player.columns[0].twos = { value: 2, crossedOut: false, firstRoll: false };
    player.columns[0].threes = { value: 3, crossedOut: false, firstRoll: false };
    player.columns[0].chance = { value: 20, crossedOut: false, firstRoll: false };
    expect(isCellSelectable(player, 0, 'chance')).toBe(false);
  });
});

describe('preview scoring', () => {
  it('top preview ignores firstRoll', () => {
    const dice = d(5, 5, 5, 5, 2);
    expect(previewCellScore(dice, 'fives', false)).toEqual({ value: 5, crossedOut: false });
    expect(previewCellScore(dice, 'fives', true)).toEqual({ value: 5, crossedOut: false });
  });

  it('bottom preview applies firstRoll multiplier', () => {
    const dice = d(1, 2, 3, 4, 5);
    expect(previewCellScore(dice, 'chance', false)).toEqual({ value: 15, crossedOut: false });
    expect(previewCellScore(dice, 'chance', true)).toEqual({ value: 30, crossedOut: false });
  });

  it('bottom preview marks crossedOut correctly', () => {
    const dice = d(1, 2, 3, 4, 5);
    expect(previewCellScore(dice, 'poker', false)).toEqual({ value: 0, crossedOut: true });
    expect(previewCellScore(dice, 'largeStraight', false)).toEqual({ value: 40, crossedOut: false });
  });
});

describe('category id arrays', () => {
  it('top has 6 ids', () => {
    expect(TOP_CATEGORY_IDS).toHaveLength(6);
  });
  it('bottom has 7 ids', () => {
    expect(BOTTOM_CATEGORY_IDS).toHaveLength(7);
  });
});
