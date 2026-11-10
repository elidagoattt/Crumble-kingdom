# Crumble Kingdom

A cosy dessert kingdom game by Eli. Build a bakery kingdom on a giant cake island, bake a team of sweets in the
Magic Oven, and play a 10-episode story (160 levels) to win back the Golden Recipe from King Whiskers the Hungry.

Everything in it is original: the characters, art, story and music.

## Run it

```
python server.py          # then open http://localhost:8080
```

No installs needed (Python standard library only). On Render the service runs `python server.py` and reads `PORT`.

## How the game is put together

| File | What it does |
| --- | --- |
| `client/index.html`, `client/css/game.css` | The page and all styling. Phones play in landscape. |
| `client/js/data.js` | Every number and name: sweets, skills, foes, bosses, episodes, story lines, buildings, castle levels, oven odds, goals. **Balance changes go here.** |
| `client/js/core.js` | The save file and the rules (spending, building, levelling, baking, finishing levels). |
| `client/js/sweets.js` | Draws the 19 heroes. |
| `client/js/artkit.js` | Draws foes, bosses and scenery. |
| `client/js/art.js` | The art layer: uses a PNG from `client/assets/` if there is one, otherwise the code-drawn art. Also draws buildings. |
| `client/js/kingdom.js` | The island: camera, leaves, buildings, placing, wandering sweets. |
| `client/js/battle.js` | Battles: waves, skills, bosses, Auto, speeds 1x / 1.5x / 2.5x. |
| `client/js/ui.js` | Menus: build, sweets, story map, story scenes, Magic Oven, settings. |
| `client/js/sound.js` | Sound effects and the soundtrack (played live from note lists, no files). |
| `server.py` | Serves the game and lists replacement art at `/api/art`. |

Progress is saved in the browser (`localStorage`), per device. There are no accounts and no online play yet.

## Replacing the art and music

See [ART.md](ART.md). Short version: drop a PNG with the right name into `client/assets/` and push. No code changes.
