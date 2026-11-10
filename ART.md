# Replacing the art (and music)

Every picture in Crumble Kingdom is asked for by name. If a file with that name is in `client/assets/`, the game
uses it. If not, it draws the built-in art. So you can replace one picture at a time and nothing breaks.

**How:** export a PNG with a transparent background, name it as below, put it in `client/assets/`, and push.

## Names

| What | File name | Notes |
| --- | --- | --- |
| A hero | `hero-<id>.png` | Facing **right**, feet at the bottom edge. About 400 px tall is plenty. |
| A hero in one pose (optional) | `hero-<id>-<pose>.png` | Poses: `idle`, `walk`, `attack`, `hurt`, `win`, `dance`, `nap`, `play`. Missing poses use `hero-<id>.png`. |
| A hero's menu picture (optional) | `portrait-<id>.png` | Square. Used in menus and skill buttons. |
| A foe | `foe-<kind>.png` | Facing **left**. |
| A boss | `boss-<kind>.png` | Facing **left**, bigger (about 600 px tall). |
| A building | `building-<type>.png` | Standing on the bottom edge. Add `-<level>` for a per-level look, e.g. `building-castle-5.png`. |
| A decoration | `decor-<type>.png` | Same as buildings. |
| A battle background | `bg-<episode>.png` | Wide picture, 300 px tall scene; it scrolls and repeats sideways. |
| Kingdom music | `music-kingdom.mp3` | Loops in the kingdom. |
| Battle music | `music-battle.mp3` | Loops in battles. |

## Ids

**Heroes:** `chip` `cosmo` `brick` `truffle` `flan` `pippin` `marma` `mallow` `luna` `biscuit` `waffle` `poppy`
`minty` `mochi` `toffee` `stack` `rolly` `antie` `klina`

**Foes:** `mouse` `dust` `crow` `gummy` `cupcake` `bee` `shroom` `frog` `snail` `bat` `crystal` `ghost` `slime`
`beetle` `guard`

**Bosses:** `rat` `gumboss` `owl` `toad` `queenbee` `golem` `sludge` `frost` `shadow` `birman`

**Buildings:** `castle` (Cake Castle) `pond` (Sugar Mill) `lumber` (Flour Windmill) `mill` (Butter Churn)
`bakery` (Jam Kitchen) `cottage` (Gingerbread House)

**Decorations:** `candytree` `lolly` `flowers` `gumdrop` `lamp` `fence` `tree` `cherry` `fountain` `statue` `crystals`

**Episodes (for backgrounds):** `village` `candy` `forest` `marsh` `hive` `moon` `poison` `frost` `night` `castle`

## Tips

- Keep the same facing direction as above, or characters will walk backwards.
- The game still animates your pictures (bobbing, squashing, flashing when hit), so one picture per hero is enough.
- To go back to the built-in art for something, delete its file.

## The Magic Oven

The Oven is a screen, not a building. Its bake animation uses these optional pictures:

| File | What it is |
| --- | --- |
| `oven.png` | The oven with its door shut |
| `oven-open.png` | The oven with its door open (falls back to `oven.png`) |
| `bg-oven.png` | The bakery room behind the oven (16:9) |

## Changing the special event (for example at Christmas)

Edit the `EVENT` block in `client/js/data.js`: its name, icon, two colours, the featured sweets and the odds.
Nothing else needs to change.
