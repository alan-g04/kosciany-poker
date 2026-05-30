# Kościany Poker

Client-authoritative digital scorecard for a 3-column Yahtzee variant. React + Vite SPA frontend, FastAPI stateless WebSocket broker for peer sync.

## Layout

```
kosciany-poker/
├── frontend/   # Vite + React 18 + TS + Tailwind + Zustand
├── backend/    # FastAPI + Uvicorn (stateless WS broker)
└── render.yaml # Two-service blueprint
```

## Local dev

Backend:

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e .
uvicorn main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
npm test             # vitest unit tests for gameLogic
npm run lint         # tsc --noEmit
npm run build
```

The frontend reads `VITE_WS_URL` at build time (default `ws://localhost:8000/ws`).

## Game flow

1. **Menu** — pick local vs networked play and real-life vs virtual dice. Settings persist in `localStorage`.
2. **Turn loop** — each player has up to **3 rolls** per turn.
   - **Virtual dice**: tap *Roll* (first roll is automatic for the new player). Between rolls, tap any die or its *Keep* button to lock it; *Re-roll unkept* re-randomises the rest. After the 3rd roll all dice auto-lock.
   - **Real-life dice**: tap the on-screen die to cycle face values (or use the 1–6 buttons), tap *Begin turn* / *Mark roll N* to count each roll, *Keep* dice to lock them from edits.
3. **Score** — open the scorecard popup (Open scorecard / Scorecard buttons), click a highlighted cell. The modal auto-closes; ~2s later the next player's turn begins.

## Game rules implemented

- 3 free-choice columns per player; no directional fill order.
- Top section per category: `score = (n − 3) × v`. **Never doubled.**
- Top bonus per column (tiered):
  - `topRaw ≥ 15` → `+50`
  - `topRaw ≥ 21` → `+100`
- Each top column unlocks its own bottom column at 3 top entries in that column.
- `threeOfAKind` and `fourOfAKind` sum only the matching dice (e.g. `[3,3,3,2,6]` → 9 for 3-of-a-kind).
- First Roll ×2 toggle doubles the next **bottom-section** cell only; user controls when to switch it off.
- Clean-sweep column bonus: `+100` if column is complete and no crossed-out bottom cells.
- All tunable constants live at the top of `frontend/src/game/gameLogic.ts`.

## Networked play

The FastAPI service is a pure pub/sub fan-out keyed by room id. Clients post action diffs (`{ peerId, action }`); the broker rebroadcasts to other peers in the room. **Game state never leaves the browser.** In network mode you can open any peer's scorecard popup to look at their table while it's their turn.

Set `ALLOWED_ORIGINS` on the broker (comma-separated) to lock CORS to the deployed SPA origin.

## Deploy on Render

This repo's `render.yaml` is a two-service Docker blueprint.

1. Push the repo to GitHub.
2. In Render, **New → Blueprint**, point at the repo. Render reads `render.yaml`.
3. Render will create two services:
   - `kosciany-poker-broker` — FastAPI WebSocket broker (Docker, `/health` check).
   - `kosciany-poker-web` — nginx-served SPA (Docker).
4. Set env vars on each service before the first build finishes:
   - **broker**: `ALLOWED_ORIGINS=https://kosciany-poker-web.onrender.com` (or the actual web URL).
   - **web**: `VITE_WS_URL=wss://kosciany-poker-broker.onrender.com/ws` (matches the broker URL).
5. Trigger deploys. The frontend bakes `VITE_WS_URL` into the JS bundle at build time, so changing it requires a redeploy of the web service.

The free Render plan spins services down after idle — first connect may take ~30s while both warm up.

## Export

In-app CSV export of the live scorecard. (PDF export was removed.)
