"""Stateless WebSocket broker for Kosciany Poker.

The browser is the source of truth. This service merely fans out raw client
messages to other peers in the same room. It never inspects, validates, or
persists game state.
"""

from __future__ import annotations

import asyncio
import logging
import os
from collections import defaultdict
from typing import DefaultDict, Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketState

logger = logging.getLogger("kosciany-broker")
logging.basicConfig(level=logging.INFO)


def _allowed_origins() -> list[str]:
    raw = os.environ.get("ALLOWED_ORIGINS", "*")
    if raw.strip() == "*":
        return ["*"]
    return [o.strip() for o in raw.split(",") if o.strip()]


app = FastAPI(title="Kosciany Poker Broker", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RoomRegistry:
    """In-memory peer registry. No game state — only live WebSocket handles."""

    def __init__(self) -> None:
        self._rooms: DefaultDict[str, Set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def join(self, room: str, ws: WebSocket) -> None:
        async with self._lock:
            self._rooms[room].add(ws)
        logger.info("peer joined room=%s size=%d", room, len(self._rooms[room]))

    async def leave(self, room: str, ws: WebSocket) -> None:
        async with self._lock:
            peers = self._rooms.get(room)
            if peers:
                peers.discard(ws)
                if not peers:
                    self._rooms.pop(room, None)
        logger.info("peer left room=%s", room)

    async def peers(self, room: str) -> list[WebSocket]:
        async with self._lock:
            return list(self._rooms.get(room, ()))


registry = RoomRegistry()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.websocket("/ws/{room}")
async def ws_endpoint(websocket: WebSocket, room: str) -> None:
    await websocket.accept()
    await registry.join(room, websocket)
    try:
        while True:
            message = await websocket.receive_text()
            for peer in await registry.peers(room):
                if peer is websocket:
                    continue
                if peer.client_state != WebSocketState.CONNECTED:
                    continue
                try:
                    await peer.send_text(message)
                except Exception:  # noqa: BLE001
                    logger.exception("failed to relay to peer; dropping")
                    await registry.leave(room, peer)
    except WebSocketDisconnect:
        pass
    finally:
        await registry.leave(room, websocket)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8000")),
        log_level="info",
    )
