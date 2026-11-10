"""Build step placeholder.

The Render service for this game was first created for another project whose build command runs
`python tools/build_demo.py`. Crumble Kingdom needs no build, so this just checks the game files are present.
"""
from pathlib import Path

client = Path(__file__).resolve().parent.parent / 'client'
needed = ['index.html', 'css/game.css', 'js/main.js']
missing = [name for name in needed if not (client / name).is_file()]
if missing:
    raise SystemExit('Missing game files: ' + ', '.join(missing))
print('Crumble Kingdom: nothing to build, all files present.')
