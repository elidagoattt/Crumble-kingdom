# Crumble Kingdom — test build

A tiny, playable candy-kingdom platformer featuring **Jax Cookie** and **Pomni Cookie**.

This repository contains an original, hand-drawn **placeholder** character-art prototype based on the owner's reference screenshots. It is **not** the artwork from the screenshots and is not a finished full game.

## Play

Choose Jax Cookie (faster running) or Pomni Cookie (slightly higher jump). Run through the candy kingdom, collect eight sugar stars, dodge jelly enemies, and reach the castle gate.

- Desktop: **A / D** or **← / →** to move; **W / ↑ / Space** to jump; **P** to pause; **R** to restart.
- Phone: on-screen left, right and jump buttons (landscape recommended).
- Character choice, pause, reset, sound toggle, and a completion screen are included.

## Local run

```bash
python server.py
```

Open http://localhost:10000 — no external dependencies required.

## Render

Python web service, main branch. Build command: `python -m py_compile server.py`; start command: `python server.py`. `PORT` is read from the Render environment.

## Source

- `index.html` — game UI and character selection
- `style.css` — responsive stage and touch controls
- `game.js` — canvas game, animations, input and levels
- `server.py` — minimal stdlib HTTP server and health endpoint

All character drawings are temporary originals; replace with approved sprite sheets later.
