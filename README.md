# Crumble Kingdom Test 🍪

A small **original Cookie Run: Kingdom-style fan-game prototype** featuring **Jax Cookie** (Charge / Front) and **Pomni Cookie** (Ranged / Middle), drawn with temporary canvas art and placeholder idle animations.

## Play
- Select **Start Battle**.
- Cookies automatically attack enemies in three waves.
- Tap Jax's **Prank Rush** and Pomni's **Jester Volley** special skills when their cooldowns finish.
- On desktop press **1** / **2** for skills. Works on mobile with touch.
- Win after defeating the boss wave; retry if both cookies are knocked out.

## Development
Self-contained browser prototype in `index.html`; Python HTTP server in `server.py`. Render uses Python runtime, build command `python -m compileall -q server.py`, start `python server.py`, free plan. Port read from `PORT`.

Character art and battle moves are temporary drawings, not extracted assets or final animation sheets. The prototype does **not** yet include a kingdom builder, gacha, persistent player accounts or true online multiplayer.
