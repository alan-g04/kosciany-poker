import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  CategoryId,
  ColumnIndex,
  DiceRoll,
  DieFace,
  PlayerScorecard,
  ScoreEntry,
} from './types';
import {
  buildBottomEntry,
  buildTopEntry,
  emptyPlayer,
  isBottomCategory,
  isBottomColumnUnlocked,
  isCellSelectable,
} from './gameLogic';

export type PlayMode = 'local' | 'network';
export type DiceMode = 'manual' | 'auto';
export type Screen = 'menu' | 'playing';

export type KeptMask = [boolean, boolean, boolean, boolean, boolean];
export type DieNonces = [number, number, number, number, number];

export const MAX_ROLLS_PER_TURN = 3;
const NO_KEPT: KeptMask = [false, false, false, false, false];
const ALL_KEPT: KeptMask = [true, true, true, true, true];
const ZERO_NONCES: DieNonces = [0, 0, 0, 0, 0];

export type ActionEvent =
  | { kind: 'score'; playerId: string; column: ColumnIndex; category: CategoryId; entry: ScoreEntry }
  | { kind: 'addPlayer'; player: PlayerScorecard }
  | { kind: 'removePlayer'; playerId: string }
  | { kind: 'renamePlayer'; playerId: string; name: string }
  | { kind: 'setDice'; dice: DiceRoll }
  | { kind: 'setFirstRoll'; firstRoll: boolean }
  | { kind: 'setActivePlayer'; playerId: string }
  | { kind: 'reset' };

export interface GameState {
  // app state
  screen: Screen;
  playMode: PlayMode;
  diceMode: DiceMode;

  // gameplay
  dice: DiceRoll;
  firstRoll: boolean;
  keptMask: KeptMask;
  rollsThisTurn: number;
  /** True between scoring and the auto-advance firing — blocks further scoring. */
  turnScored: boolean;
  players: PlayerScorecard[];
  activePlayerId: string | null;
  viewedPlayerId: string | null;
  /** Per-die animation trigger — increments only when that die's face is re-rolled. */
  dieNonces: DieNonces;

  // network
  remoteEmitter: ((action: ActionEvent) => void) | null;

  // screen / mode actions
  startGame: (opts: { playMode: PlayMode; diceMode: DiceMode }) => void;
  openMenu: () => void;
  setDiceMode: (mode: DiceMode) => void;

  // dice actions
  setDie: (idx: number, face: DieFace) => void;
  cycleDie: (idx: number) => void;
  setDice: (dice: DiceRoll) => void;
  setFirstRoll: (v: boolean) => void;
  rollVirtualDice: () => void;
  nextManualRoll: () => void;
  toggleKept: (idx: number) => void;

  // players
  addPlayer: (name: string) => void;
  removePlayer: (playerId: string) => void;
  renamePlayer: (playerId: string, name: string) => void;
  setActivePlayer: (playerId: string) => void;
  setViewedPlayer: (playerId: string) => void;

  // scoring
  scoreCell: (column: ColumnIndex, category: CategoryId) => void;

  // reset
  resetGame: () => void;

  // network plumbing
  setRemoteEmitter: (fn: ((action: ActionEvent) => void) | null) => void;
  applyRemote: (action: ActionEvent) => void;
}

const STARTING_DICE: DiceRoll = [1, 1, 1, 1, 1];
const AUTO_SWITCH_DELAY_MS = 1200;

const nextFace = (f: DieFace): DieFace => ((f % 6) + 1) as DieFace;

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function randomFace(): DieFace {
  return ((Math.floor(Math.random() * 6) + 1) as DieFace);
}

function randomDice(): DiceRoll {
  return [randomFace(), randomFace(), randomFace(), randomFace(), randomFace()];
}

function rerollNonKept(dice: DiceRoll, kept: KeptMask): DiceRoll {
  return dice.map((d, i) => (kept[i] ? d : randomFace())) as DiceRoll;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => {
      const emit = (action: ActionEvent) => {
        const fn = get().remoteEmitter;
        if (fn) fn(action);
      };

      const writeEntry = (
        playerId: string,
        column: ColumnIndex,
        category: CategoryId,
        entry: ScoreEntry,
      ) => {
        set((state) => ({
          players: state.players.map((p) => {
            if (p.playerId !== playerId) return p;
            const columns = p.columns.map((c, i) =>
              i === column ? { ...c, [category]: entry } : c,
            ) as PlayerScorecard['columns'];
            return { ...p, columns };
          }),
        }));
      };

      const scheduleAutoAdvance = () => {
        setTimeout(() => {
          const { players, activePlayerId } = get();
          if (players.length < 2) {
            // Solo: reset turn state and re-arm the multiplier for the next roll.
            set({
              keptMask: [...NO_KEPT] as KeptMask,
              rollsThisTurn: 0,
              turnScored: false,
              firstRoll: true,
            });
            emit({ kind: 'setFirstRoll', firstRoll: true });
            return;
          }
          const idx = Math.max(
            0,
            players.findIndex((p) => p.playerId === activePlayerId),
          );
          const nextIdx = (idx + 1) % players.length;
          const next = players[nextIdx];
          if (!next) return;
          set({
            activePlayerId: next.playerId,
            viewedPlayerId: next.playerId,
            keptMask: [...NO_KEPT] as KeptMask,
            rollsThisTurn: 0,
            turnScored: false,
            firstRoll: true,
          });
          emit({ kind: 'setActivePlayer', playerId: next.playerId });
          emit({ kind: 'setFirstRoll', firstRoll: true });
        }, AUTO_SWITCH_DELAY_MS);
      };

      const firstPlayer = emptyPlayer(makeId(), 'Player 1');

      return {
        screen: 'menu',
        playMode: 'local',
        diceMode: 'manual',

        dice: STARTING_DICE,
        firstRoll: true,
        keptMask: [...NO_KEPT] as KeptMask,
        rollsThisTurn: 0,
        turnScored: false,
        players: [firstPlayer],
        activePlayerId: firstPlayer.playerId,
        viewedPlayerId: firstPlayer.playerId,
        dieNonces: [...ZERO_NONCES] as DieNonces,

        remoteEmitter: null,

        startGame: ({ playMode, diceMode }) => {
          const state = get();
          const active = state.activePlayerId ?? state.players[0]?.playerId ?? null;
          set({
            screen: 'playing',
            playMode,
            diceMode,
            activePlayerId: active,
            viewedPlayerId: active,
            keptMask: [...NO_KEPT] as KeptMask,
            rollsThisTurn: 0,
            turnScored: false,
            firstRoll: true,
          });
        },

        openMenu: () => set({ screen: 'menu' }),

        setDiceMode: (mode) => set({ diceMode: mode }),

        setDie: (idx, face) => {
          const { keptMask } = get();
          if (keptMask[idx]) return;
          const dice = [...get().dice] as DiceRoll;
          dice[idx] = face;
          set({ dice });
          emit({ kind: 'setDice', dice });
        },

        cycleDie: (idx) => {
          const { keptMask } = get();
          if (keptMask[idx]) return;
          const dice = [...get().dice] as DiceRoll;
          dice[idx] = nextFace(dice[idx]);
          set({ dice });
          emit({ kind: 'setDice', dice });
        },

        setDice: (dice) => {
          set({ dice });
          emit({ kind: 'setDice', dice });
        },

        setFirstRoll: (v) => {
          set({ firstRoll: v });
          emit({ kind: 'setFirstRoll', firstRoll: v });
        },

        toggleKept: (idx) => {
          set((s) => {
            // After 3 rolls dice are locked; ignore toggle attempts.
            if (s.rollsThisTurn >= MAX_ROLLS_PER_TURN) return s;
            // Cannot keep dice before the first roll has happened.
            if (s.rollsThisTurn === 0) return s;
            const next = [...s.keptMask] as KeptMask;
            next[idx] = !next[idx];
            return { keptMask: next };
          });
        },

        rollVirtualDice: () => {
          const s = get();
          if (s.rollsThisTurn >= MAX_ROLLS_PER_TURN) return;
          const isFirst = s.rollsThisTurn === 0;
          const newDice = isFirst ? randomDice() : rerollNonKept(s.dice, s.keptMask);
          const newRolls = s.rollsThisTurn + 1;
          const newKept = newRolls >= MAX_ROLLS_PER_TURN ? ([...ALL_KEPT] as KeptMask) : s.keptMask;
          // The x2 first-roll bonus only applies to a score logged after roll 1.
          // The moment the player rolls again, it clears automatically.
          const newFirstRoll = newRolls <= 1 ? s.firstRoll : false;
          // Only bump the nonce on dice that actually re-rolled this throw.
          // Using the PRE-roll keptMask so the 3rd roll (which post-locks all
          // dice) still animates the dice that were just thrown.
          const newDieNonces = s.dieNonces.map((n, i) =>
            isFirst || !s.keptMask[i] ? n + 1 : n,
          ) as DieNonces;
          set({
            dice: newDice,
            rollsThisTurn: newRolls,
            keptMask: newKept,
            firstRoll: newFirstRoll,
            dieNonces: newDieNonces,
          });
          emit({ kind: 'setDice', dice: newDice });
          if (newFirstRoll !== s.firstRoll) {
            emit({ kind: 'setFirstRoll', firstRoll: newFirstRoll });
          }
        },

        nextManualRoll: () => {
          const s = get();
          if (s.rollsThisTurn >= MAX_ROLLS_PER_TURN) return;
          const newRolls = s.rollsThisTurn + 1;
          const newKept = newRolls >= MAX_ROLLS_PER_TURN ? ([...ALL_KEPT] as KeptMask) : s.keptMask;
          const newFirstRoll = newRolls <= 1 ? s.firstRoll : false;
          set({
            rollsThisTurn: newRolls,
            keptMask: newKept,
            firstRoll: newFirstRoll,
          });
          if (newFirstRoll !== s.firstRoll) {
            emit({ kind: 'setFirstRoll', firstRoll: newFirstRoll });
          }
        },

        addPlayer: (name) => {
          const player = emptyPlayer(makeId(), name || `Player ${get().players.length + 1}`);
          set((s) => ({
            players: [...s.players, player],
            activePlayerId: s.activePlayerId ?? player.playerId,
            viewedPlayerId: s.viewedPlayerId ?? player.playerId,
          }));
          emit({ kind: 'addPlayer', player });
        },

        removePlayer: (playerId) => {
          set((s) => {
            const players = s.players.filter((p) => p.playerId !== playerId);
            const fallback = players[0]?.playerId ?? null;
            return {
              players,
              activePlayerId: s.activePlayerId === playerId ? fallback : s.activePlayerId,
              viewedPlayerId: s.viewedPlayerId === playerId ? fallback : s.viewedPlayerId,
            };
          });
          emit({ kind: 'removePlayer', playerId });
        },

        renamePlayer: (playerId, name) => {
          set((s) => ({
            players: s.players.map((p) => (p.playerId === playerId ? { ...p, name } : p)),
          }));
          emit({ kind: 'renamePlayer', playerId, name });
        },

        setActivePlayer: (playerId) => {
          set({ activePlayerId: playerId, viewedPlayerId: playerId });
          emit({ kind: 'setActivePlayer', playerId });
        },

        setViewedPlayer: (playerId) => set({ viewedPlayerId: playerId }),

        scoreCell: (column, category) => {
          const { dice, firstRoll, players, activePlayerId, rollsThisTurn, turnScored, diceMode } = get();
          // Only one cell can be scored per turn (rest are locked
          // until the next player takes over).
          if (turnScored) return;
          // In virtual dice mode the player must roll at least once first;
          // manual mode trusts the user to have already rolled IRL.
          if (diceMode === 'auto' && rollsThisTurn === 0) return;
          const playerId = activePlayerId ?? players[0]?.playerId;
          if (!playerId) return;
          const player = players.find((p) => p.playerId === playerId);
          if (!player) return;
          if (!isCellSelectable(player, column, category)) return;
          if (isBottomCategory(category) && !isBottomColumnUnlocked(player, column)) return;
          const entry = isBottomCategory(category)
            ? buildBottomEntry(category, dice, firstRoll)
            : buildTopEntry(category, dice, firstRoll);
          writeEntry(playerId, column, category, entry);
          set({ turnScored: true });
          emit({ kind: 'score', playerId, column, category, entry });
          scheduleAutoAdvance();
        },

        resetGame: () => {
          const player = emptyPlayer(makeId(), 'Player 1');
          set({
            screen: 'menu',
            dice: STARTING_DICE,
            firstRoll: true,
            keptMask: [...NO_KEPT] as KeptMask,
            rollsThisTurn: 0,
            turnScored: false,
            players: [player],
            activePlayerId: player.playerId,
            viewedPlayerId: player.playerId,
            dieNonces: [...ZERO_NONCES] as DieNonces,
          });
          emit({ kind: 'reset' });
        },

        setRemoteEmitter: (fn) => set({ remoteEmitter: fn }),

        applyRemote: (action) => {
          switch (action.kind) {
            case 'score': {
              writeEntry(action.playerId, action.column, action.category, action.entry);
              break;
            }
            case 'addPlayer': {
              set((s) =>
                s.players.find((p) => p.playerId === action.player.playerId)
                  ? s
                  : { players: [...s.players, action.player] },
              );
              break;
            }
            case 'removePlayer': {
              set((s) => ({ players: s.players.filter((p) => p.playerId !== action.playerId) }));
              break;
            }
            case 'renamePlayer': {
              set((s) => ({
                players: s.players.map((p) =>
                  p.playerId === action.playerId ? { ...p, name: action.name } : p,
                ),
              }));
              break;
            }
            case 'setDice':
              set((s) => ({
                dice: action.dice,
                dieNonces: s.dieNonces.map((n, i) =>
                  s.dice[i] !== action.dice[i] ? n + 1 : n,
                ) as DieNonces,
              }));
              break;
            case 'setFirstRoll':
              set({ firstRoll: action.firstRoll });
              break;
            case 'setActivePlayer':
              set((s) => ({
                activePlayerId: action.playerId,
                viewedPlayerId:
                  s.viewedPlayerId == null || s.viewedPlayerId === s.activePlayerId
                    ? action.playerId
                    : s.viewedPlayerId,
              }));
              break;
            case 'reset': {
              const player = emptyPlayer(makeId(), 'Player 1');
              set({
                dice: STARTING_DICE,
                firstRoll: true,
                keptMask: [...NO_KEPT] as KeptMask,
                rollsThisTurn: 0,
                turnScored: false,
                players: [player],
                activePlayerId: player.playerId,
                viewedPlayerId: player.playerId,
              });
              break;
            }
          }
        },
      };
    },
    {
      name: 'kosciany-poker:v5',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        screen: s.screen,
        playMode: s.playMode,
        diceMode: s.diceMode,
        dice: s.dice,
        firstRoll: s.firstRoll,
        players: s.players,
        activePlayerId: s.activePlayerId,
        viewedPlayerId: s.viewedPlayerId,
      }),
    },
  ),
);
