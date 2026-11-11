/* Crumble Kingdom: all the game's numbers and names live here, so balancing never means digging through code. */
(() => {
'use strict';

// ---- roles: where a cat stands and how it fights
const ROLES = {
  guard:  {name:'Guard',   icon:'🛡️', row:0, range:26,  color:'#4a90d9'},   // front line, soaks hits
  slash:  {name:'Slasher', icon:'⚔️', row:0, range:28,  color:'#e0564a'},   // front line, big damage
  shot:   {name:'Shooter', icon:'🏹', row:1, range:150, color:'#e89a3c'},   // middle, single target
  magic:  {name:'Mage',    icon:'✨', row:2, range:170, color:'#9a6ae0'},   // back, hits groups
  heal:   {name:'Healer',  icon:'💚', row:2, range:160, color:'#4fbf6a'},   // back, heals
  support:{name:'Support', icon:'🎵', row:1, range:140, color:'#e06aa8'}    // middle, buffs
};

const RARITY = {
  common:  {name:'Common',  color:'#8fa3b8', stars:1, mult:1.00, weight:0},
  rare:    {name:'Rare',    color:'#4a9ee8', stars:2, mult:1.15, weight:0},
  epic:    {name:'Epic',    color:'#b467e8', stars:3, mult:1.32, weight:0},
  special: {name:'Special', color:'#f2b632', stars:4, mult:1.50, weight:0}
};

/* Skills. kind decides what happens when the skill fires:
 *  hit    damage to the nearest foe (x power)        aoe    damage to every foe in range
 *  heal   heals all allies (x power of ATK)          shield allies take less damage for `dur` seconds
 *  rally  allies attack faster for `dur` seconds     stun   damage + freezes foes for `dur` seconds
 *  form   this cat powers up for `dur` seconds       freeze stops every foe for `dur`, then clocks strike
 */
const CATS = {
  chip:    {name:'Chip',     kind:'Choc Chip Cookie',   role:'slash',  rarity:'rare',    hp:520, atk:64, skill:{name:'Chip Shot',      icon:'🍪', kind:'hit',   power:3.4, cd:9,  text:'Flings a giant chocolate chip at the nearest foe.'}},
  cosmo:   {name:'Cosmo',    kind:'Galaxy Donut',       role:'magic',  rarity:'epic',    hp:400, atk:70, skill:{name:'Sprinkle Storm', icon:'🌌', kind:'aoe',   power:2.3, cd:12, text:'A swirl of star sprinkles hits every foe.'}},
  brick:   {name:'Brick',    kind:'Fudge Brownie',      role:'guard',  rarity:'rare',    hp:820, atk:40, skill:{name:'Fudge Bonk',     icon:'🔨', kind:'stun',  power:1.8, cd:11, dur:2.5, text:'Bonks the foes and leaves them stuck in fudge.'}},
  truffle: {name:'Truffle',  kind:'Dark Chocolate',     role:'slash',  rarity:'epic',    hp:500, atk:78, skill:{name:'Cocoa Dash',     icon:'🍫', kind:'aoe',   power:2.0, cd:10, text:'Dashes through the whole enemy line.'}},
  flan:    {name:'Flan',     kind:'Caramel Pudding',    role:'heal',   rarity:'rare',    hp:430, atk:44, skill:{name:'Caramel Hug',    icon:'💛', kind:'heal',  power:3.2, cd:12, text:'A warm wobble that heals the whole team.'}},
  pippin:  {name:'Pippin',   kind:'Pumpkin Pie',        role:'shot',   rarity:'rare',    hp:420, atk:62, skill:{name:'Pie Bomb',       icon:'🥧', kind:'aoe',   power:1.9, cd:10, text:'Lobs a pie that bursts on the foes.'}},
  marma:   {name:'Marma',    kind:'Orange Tart',        role:'support',rarity:'common',  hp:430, atk:40, skill:{name:'Fresh Bake',     icon:'🍊', kind:'heal',  power:2.0, cd:13, text:'Warm zest heals the team a little.'}},
  mallow:  {name:'Mallow',   kind:'Marshmallow',        role:'guard',  rarity:'common',  hp:700, atk:36, skill:{name:'Squish Wall',    icon:'☁️', kind:'shield',power:0.5, cd:14, dur:5, text:'The team takes half damage for a while.'}},
  luna:    {name:'Luna',     kind:'Lavender Macaron',   role:'magic',  rarity:'epic',    hp:390, atk:74, skill:{name:'Moon Glaze',     icon:'🌙', kind:'stun',  power:2.1, cd:13, dur:2, text:'A moonlit glaze hits every foe and dazes them.'}},
  biscuit: {name:'Biscuit',  kind:'Shortbread',         role:'slash',  rarity:'common',  hp:470, atk:54, skill:{name:'Crumble Crash',  icon:'💥', kind:'hit',   power:2.8, cd:8,  text:'A flying leap onto the nearest foe.'}},
  waffle:  {name:'Waffle',   kind:'Golden Waffle',      role:'guard',  rarity:'rare',    hp:780, atk:46, skill:{name:'Iron Press',     icon:'🧇', kind:'aoe',   power:1.7, cd:11, text:'Slams a waffle iron down on the front foes.'}},
  poppy:   {name:'Poppy',    kind:'Strawberry Cupcake', role:'heal',   rarity:'common',  hp:400, atk:38, skill:{name:'Frosting Shower',icon:'🍓', kind:'heal',  power:2.4, cd:12, text:'Sweet frosting rains down and heals the team.'}},
  minty:   {name:'Minty',    kind:'Mint Ice Cream',     role:'support',rarity:'rare',    hp:440, atk:46, skill:{name:'Cool Breeze',    icon:'🍃', kind:'rally', power:1.5, cd:14, dur:6, text:'The team attacks much faster for a while.'}},
  mochi:   {name:'Mochi',    kind:'Rice Cake',          role:'shot',   rarity:'common',  hp:390, atk:52, skill:{name:'Bouncy Shot',    icon:'🍡', kind:'hit',   power:2.6, cd:8,  text:'Fires a bouncy dumpling at the nearest foe.'}},
  toffee:  {name:'Toffee',   kind:'Wrapped Toffee',     role:'shot',   rarity:'common',  hp:410, atk:50, skill:{name:'Sticky Toffee',  icon:'🍬', kind:'stun',  power:1.2, cd:12, dur:2.2, text:'Toffee splats the foes and glues them in place.'}},
  stack:   {name:'Stack',    kind:'Pancake Stack',      role:'magic',  rarity:'rare',    hp:380, atk:66, skill:{name:'Syrup Zap',      icon:'⚡', kind:'aoe',   power:2.0, cd:11, text:'Hot syrup jumps across every foe.'}},
  rolly:   {name:'Rolly',    kind:'Matcha Roll',        role:'support',rarity:'epic',    hp:460, atk:52, skill:{name:'Cream Guard',    icon:'🍵', kind:'shield',power:0.4, cd:14, dur:6, text:'Whipped cream swirls round the team and blocks most damage.'}},
  antie:   {name:'Antie',    kind:'Blueberry Cookie',   role:'slash',  rarity:'special', eventOnly:true, hp:560, atk:86, skill:{name:'Powered Form',   icon:'🔺', kind:'form',  power:2.2, cd:16, dur:7, text:'Antie powers up: far stronger and faster for a while.'}},
  klina:   {name:'Klina',    kind:'Sugar Glass Cookie', role:'magic',  rarity:'special', eventOnly:true, hp:450, atk:82, skill:{name:'Time Freeze',    icon:'⏳', kind:'freeze',power:2.6, cd:17, dur:3.5, text:'The hourglass grows and flips. Time stops, then clocks strike every foe.'}},
  // ---- Christmas event sweets (only from the event bake)
  ginger:  {name:'Ginger',   kind:'Gingerbread Cookie', role:'guard',  rarity:'rare',    eventOnly:true, hp:860, atk:42, skill:{name:'Icing Armour',   icon:'🎄', kind:'shield',power:0.5, cd:13, dur:5, text:'Thick icing: the team takes half damage for a while.'}},
  twist:   {name:'Twist',    kind:'Candy Cane',         role:'shot',   rarity:'rare',    eventOnly:true, hp:430, atk:66, skill:{name:'Peppermint Shot',icon:'🍬', kind:'hit',   power:3.0, cd:9,  text:'A minty bolt that hits one foe very hard.'}},
  figgy:   {name:'Figgy',    kind:'Christmas Pudding',  role:'heal',   rarity:'epic',    eventOnly:true, hp:470, atk:52, skill:{name:'Warm Custard',   icon:'🍮', kind:'heal',  power:3.8, cd:11, text:'A pour of warm custard heals the whole team.'}},
  yule:    {name:'Yule',     kind:'Chocolate Yule Log', role:'slash',  rarity:'epic',    eventOnly:true, hp:540, atk:80, skill:{name:'Log Roll',       icon:'🪵', kind:'aoe',   power:2.2, cd:10, text:'Rolls right through the whole enemy line.'}},
  frostine:{name:'Frostine', kind:'Snowflake Meringue', role:'magic',  rarity:'special', eventOnly:true, hp:470, atk:84, skill:{name:'Blizzard',       icon:'❄️', kind:'freeze',power:2.7, cd:16, dur:3.5, text:'A blizzard freezes every foe, then the ice shatters.'}}
};
const STARTERS = ['chip', 'mochi', 'mallow'];

// ---- foes (stats are for world 1; they scale up per stage)
const FOES = {
  mouse:  {name:'Crumb Thief',  hp:120, atk:14, spd:34, range:22},
  dust:   {name:'Flour Puff',    hp:150, atk:12, spd:24, range:22},
  crow:   {name:'Pie Crow',          hp:110, atk:16, spd:44, range:24, fly:true},
  gummy:  {name:'Sour Gummy',    hp:180, atk:15, spd:26, range:22, hop:true},
  cupcake:{name:'Burnt Cupcake', hp:170, atk:16, spd:28, range:22, hop:true},
  bee:    {name:'Honey Bee',     hp:100, atk:17, spd:46, range:24, fly:true},
  shroom: {name:'Mould Shroom',  hp:190, atk:15, spd:16, range:130, ranged:true},
  frog:   {name:'Mint Frog',      hp:180, atk:16, spd:28, range:22, hop:true},
  snail:  {name:'Caramel Snail',   hp:340, atk:14, spd:11, range:22},
  bat:    {name:'Cocoa Bat',      hp:110, atk:17, spd:42, range:24, fly:true},
  crystal:{name:'Rock Candy Sprite',hp:240, atk:19, spd:14, range:140, ranged:true},
  ghost:  {name:'Steam Ghost',         hp:160, atk:18, spd:32, range:24, fly:true},
  slime:  {name:'Syrup Slime',   hp:210, atk:18, spd:20, range:22, hop:true},
  beetle: {name:'Liquorice Beetle',   hp:230, atk:20, spd:24, range:22},
  guard:  {name:'Fork Guard',  hp:300, atk:21, spd:24, range:24}
};

const BOSSES = {
  rat:    {name:'Baron Crumbsnatcher',  hp:750, atk:30, special:{name:'Crumb Toss',    icon:'🍪', kind:'aoe',    power:1.6}},
  gumboss:{name:'Gumdrop Gobbler', hp:900, atk:32, special:{name:'Sticky Goo',     icon:'🍬', kind:'slow',   power:1.2, dur:3}},
  owl:    {name:'Nibbler the Night Owl',        hp:950, atk:36, special:{name:'Feather Storm',  icon:'🪶', kind:'aoe',    power:1.8}},
  toad:   {name:'Treacle Toad',       hp:1150, atk:36, special:{name:'Tongue Lash',    icon:'👅', kind:'back',   power:2.6}},
  golem:  {name:'Rock Candy Golem',   hp:1400, atk:40, special:{name:'Candy Rain',   icon:'💎', kind:'aoe',    power:1.9}},
  sludge: {name:'Burnt Sugar Queen',    hp:1300, atk:40, special:{name:'Burnt Puddles',  icon:'🔥', kind:'poison', power:0.5, dur:5}},
  queenbee:{name:'Queen Honeycomb',     hp:1050, atk:36, special:{name:'Honey Swarm',    icon:'🐝', kind:'aoe',    power:1.7}},
  frost:  {name:'Glacier Golem',       art:'golem',   tint:'hue-rotate(150deg) brightness(1.15)', hp:1500, atk:42, special:{name:'Brain Freeze',  icon:'🧊', kind:'slow',   power:1.4, dur:3.5}},
  shadow: {name:'The Midnight Gobbler', art:'gumboss', tint:'hue-rotate(200deg) brightness(.75) saturate(1.3)', hp:1600, atk:44, special:{name:'Shadow Goo',   icon:'🌑', kind:'poison', power:0.5, dur:5}},
  birman: {name:'King Whiskers the Hungry', hp:1700, atk:46, special:{name:'Giant Paw Swipe',icon:'🐾', kind:'aoe',    power:2.2}}
};

// ---- story mode: 10 episodes. Each has its own land, foes, boss and a short story told before and after.
const EPISODES = [
  {id:'village', name:'Vanilla Village',      icon:'🧁', levels:13, sky:['#aee3ff','#fff4e6'], hill:'#bfe8c6', ground:'#a8e0b0', dirt:'#e6c28a', deco:'houses',   foes:['mouse','dust','crow'],      boss:'rat', gift:'poppy',
   intro:[['chip','The Golden Recipe is gone! King Whiskers gobbled it up, page by page.'],['mallow','And his crumb thieves are all over Vanilla Village!'],['chip','Then we take it back. One page at a time. Ready?']],
   outro:[['rat','Squeak! Fine, take the page. The King has nine more!'],['poppy','You saved my bakery! Let me come with you. I can patch up bumps and bruises.']]},
  {id:'candy',   name:'Candy Blossom',        icon:'🌸', levels:15, sky:['#ffc6dd','#fff3f8'], hill:'#ffb0cf', ground:'#f59cc0', dirt:'#e88aa8', deco:'blossom',  foes:['gummy','cupcake','bee'],    boss:'gumboss',
   intro:[['poppy','Candy Blossom used to smell like spun sugar. Now it smells... burnt.'],['chip','Someone is chewing through the candy trees. Look at those bite marks!']],
   outro:[['gumboss','Bleh! The page tasted of paper anyway.'],['chip','Two pages. The recipe is starting to make sense.']]},
  {id:'forest',  name:'Matcha Woods',         icon:'🍵', levels:15, sky:['#c6eeb0','#f3ffe6'], hill:'#7fc060', ground:'#6fb050', dirt:'#8a6a42', deco:'trees',    foes:['shroom','crow','mouse'],    boss:'owl', gift:'brick',
   intro:[['mochi','The woods are quiet. Too quiet. Even the tea leaves are hiding.'],['chip','Stay close. Something is watching from the branches.']],
   outro:[['owl','Hoo... I only wanted a midnight snack.'],['brick','I was stuck in that tree for days! I owe you. Nothing gets past me.']]},
  {id:'marsh',   name:'Caramel Marsh',        icon:'🍮', levels:17, sky:['#ffe0a8','#fff6e0'], hill:'#e8b060', ground:'#d99a48', dirt:'#a8662a', deco:'lilies',   foes:['frog','snail','crow'],      boss:'toad',
   intro:[['brick','Careful. The caramel here pulls you under if you stand still.'],['poppy','Then we keep moving. Sticky feet, brave hearts!']],
   outro:[['toad','Ribbit. That page was my favourite lily pad.'],['chip','Four pages! Almost halfway.']]},
  {id:'hive',    name:'Honeycomb Hollow',     icon:'🍯', levels:15, sky:['#fff0a8','#fffbe6'], hill:'#f2c84a', ground:'#e8b02e', dirt:'#b87a1e', deco:'sunflowers',foes:['bee','snail','dust'],      boss:'queenbee', gift:'stack',
   intro:[['chip','The buzzing is so loud my chips are rattling.'],['mallow','The Queen keeps a page in the royal honey jar. This will get sticky.']],
   outro:[['queenbee','You fight well for dessert. Take it, and take my best cook too.'],['stack','Hot off the griddle and ready to zap! Where to next?']]},
  {id:'moon',    name:'Rock Candy Caves',     icon:'💎', levels:17, sky:['#1d1640','#4a3a7a'], hill:'#2e2558', ground:'#3a2f63', dirt:'#2a2148', deco:'crystals', foes:['bat','crystal','ghost'],    boss:'golem',
   intro:[['stack','It is dark down here. And crunchy.'],['chip','The crystals glow when the page is near. Follow the light!']],
   outro:[['golem','CRUMBLE... you... win.'],['poppy','Six pages. I can almost taste the recipe.']]},
  {id:'poison',  name:'Burnt Sugar Wastes',   icon:'🔥', levels:18, sky:['#4a2a1a','#b8683a'], hill:'#6a3a20', ground:'#5a3018', dirt:'#3a1e0e', deco:'toxic',    foes:['slime','beetle','bat'],     boss:'sludge', gift:'flan',
   intro:[['brick','This is what happens when the King gets near an oven.'],['chip','Everything is scorched. Watch your step, the puddles still bubble.']],
   outro:[['sludge','So bitter... so beaten...'],['flan','I thought I would be burnt forever. Thank you! I will keep everyone standing.']]},
  {id:'frost',   name:'Frosted Peaks',        icon:'🍦', levels:15, sky:['#cfe8ff','#ffffff'], hill:'#e6f2ff', ground:'#f4faff', dirt:'#b8d4ee', deco:'frost',    foes:['ghost','crystal','snail'],  boss:'frost',
   intro:[['flan','B-b-brrr. Even my caramel is shivering.'],['chip','The King froze this page inside a glacier. We will have to break it out.']],
   outro:[['frost','COLD... no... more.'],['chip','Eight! Only two pages left, and both are in his castle.']]},
  {id:'night',   name:'The Midnight Bakery',  icon:'🌙', levels:17, sky:['#141028','#3a2a5a'], hill:'#241a40', ground:'#30244e', dirt:'#1c1430', deco:'castle',   foes:['ghost','bat','guard'],      boss:'shadow',
   intro:[['poppy','A bakery that only opens at midnight. And nobody ever comes out.'],['chip','The ovens are on. Something is cooking, and it is not friendly.']],
   outro:[['shadow','The night... is over...'],['mallow','One page to go. The castle gates are open!']]},
  {id:'castle',  name:"The Hungry King's Castle", icon:'🏰', levels:18, sky:['#4a4060','#6a5a80'], hill:'#544a6c', ground:'#6a2a3a', dirt:'#4a1c28', deco:'castle', foes:['guard','ghost','beetle'], boss:'birman',
   intro:[['birman','More snacks? How kind of you to deliver yourselves.'],['chip','We are not snacks. We are the Crumble Kingdom, and we want our recipe back!']],
   outro:[['birman','Enough! Take it. I only wanted... to bake something myself. Nobody ever taught me.'],['chip','Then come and learn. The Golden Recipe was always meant to be shared.'],['poppy','The kingdom is whole again. Thank you, baker!']]}
];
const WORLDS = EPISODES;       // older name
const STAGES_PER_WORLD = 0;    // no longer fixed: use EPISODES[w].levels
const TOTAL_LEVELS = EPISODES.reduce((n, e) => n + e.levels, 0);
const levelIndex = (w, s) => EPISODES.slice(0, w).reduce((n, e) => n + e.levels, 0) + s;

/* What a level looks like. Difficulty grows steadily so that a team levelled about one level per three stages keeps up.
 * The last level of an episode is its boss; the middle level is a tougher "elite" wave. */
function stageInfo(w, s) {
  const world = EPISODES[w], n = levelIndex(w, s), scale = 1 + n * 0.046;
  const boss = s === world.levels - 1, elite = !boss && s === Math.floor(world.levels / 2);
  const waves = [], count = boss ? 2 : 3;
  for (let i = 0; i < count; i++) {
    const size = Math.min(6, 2 + Math.floor((s % 6 + i) / 2) + (w > 2 ? 1 : 0) + (elite ? 1 : 0));
    const wave = [];
    for (let k = 0; k < size; k++) wave.push(world.foes[(k + i + s) % world.foes.length]);
    waves.push(wave);
  }
  return {
    world, w, s, n, scale: scale * (elite ? 1.15 : 1), boss: boss ? world.boss : null, elite, waves,
    name: world.name + ' ' + (w + 1) + '-' + (s + 1),
    power: Math.round(1050 * scale * (boss ? 1.2 : elite ? 1.1 : 1)),
    reward: {sugar: Math.round(120 + n * 22), jam: 30 + n * 6, flour: 10 + n * 3, butter: n > 2 ? 4 + n * 2 : 0},
    firstCutters: boss ? 2 : elite ? 1 : 0, firstTickets: boss ? 1 : 0
  };
}

/* Kingdom buildings. `make` buildings fill up over time and are tapped to collect.
 * size is in tiles; cost and output grow with level. */
const BUILDINGS = {
  castle:  {name:'Cake Castle',     icon:'🏰', size:2, unique:true, fixed:true, max:12,  text:'The heart of your kingdom. Upgrading it unlocks more buildings and land.'},
  pond:    {name:'Sugar Mill',      icon:'🍬', size:2, make:'sugar',  rate:40, cap:240, cost:{sugar:80},              max:10, need:1, text:'Grinds sugar over time.'},
  lumber:  {name:'Flour Windmill',  icon:'🌾', size:2, make:'flour',  rate:14, cap:90,  cost:{sugar:150},             max:10, need:1, text:'Mills flour for building.'},
  mill:    {name:'Butter Churn',    icon:'🧈', size:2, make:'butter', rate:8,  cap:50,  cost:{sugar:400, flour:60},   max:10, need:2, text:'Churns butter for upgrades.'},
  bakery:  {name:'Jam Kitchen',     icon:'🍓', size:2, make:'jam',    rate:10, cap:70,  cost:{sugar:300, flour:40},   max:10, need:2, text:'Cooks jam that levels up your sweets.'},
  cottage: {name:'Gingerbread House',icon:'🏠', size:2, cozy:12, cost:{sugar:250, flour:50},             max:8, need:1, text:'A snug home. More of your sweets wander the kingdom.'},
  // Extra buildings. `per`: you may build one more every `per` castle levels after `need` (see limitOf in core.js).
  honey:   {name:'Honey Hive',      icon:'🍯', size:2, make:'sugar',  rate:110, cap:800, cost:{sugar:1800, flour:300, butter:40},  max:10, need:3, per:3, text:'Busy bees make lots of sugar.'},
  market:  {name:'Sweet Market',    icon:'🛒', size:2, make:'flour',  rate:36, cap:260, cost:{sugar:2600, flour:200, butter:80},   max:10, need:4, per:3, text:'Traders bring sacks of flour.'},
  dairy:   {name:'Milk Barn',       icon:'🥛', size:2, make:'butter', rate:20, cap:150, cost:{sugar:5200, flour:900, butter:120},  max:10, need:5, per:3, text:'Fresh cream means much more butter.'},
  jamfair: {name:'Berry Greenhouse',icon:'🫐', size:2, make:'jam',    rate:26, cap:200, cost:{sugar:4200, flour:700, butter:150},  max:10, need:5, per:3, text:'Berries all year round: lots of jam.'},
  cutter:  {name:'Cutter Workshop', icon:'✂️', size:2, make:'cutters', rate:1/180, cap:2, slow:true, unique:true, cost:{sugar:3000, flour:500, butter:100}, max:6, need:3, text:'Forges a Cookie Cutter every few hours.'},
  booth:   {name:'Ticket Booth',    icon:'🎟️', size:2, make:'tickets', rate:1/480, cap:1, slow:true, unique:true, cost:{sugar:9000, flour:1500, butter:400}, max:6, need:6, text:'Prints an Event Ticket every few hours.'},
  parlour: {name:'Ice Cream Parlour',icon:'🍦', size:2, cozy:20, cost:{sugar:1500, flour:250, butter:30},   max:8, need:3, per:2, text:'A cool treat for everyone. Very cozy.'},
  teahouse:{name:'Teapot House',    icon:'🫖', size:2, cozy:30, cost:{sugar:4000, flour:600, butter:120},  max:8, need:5, per:3, text:'Tea and biscuits at any hour.'},
  school:  {name:'Baking School',   icon:'🎓', size:2, cozy:40, unique:true, cost:{sugar:6000, flour:1200, butter:200}, max:8, need:4, text:'Where little sweets learn to bake.'},
  clock:   {name:'Candy Clock Tower',icon:'🕰️', size:2, cozy:60, unique:true, cost:{sugar:16000, flour:2800, butter:600}, max:8, need:7, text:'Chimes on the hour, every hour.'},
  lighthouse:{name:'Candy Cane Lighthouse',icon:'🗼', size:2, cozy:90, unique:true, cost:{sugar:40000, flour:6500, butter:1600}, max:8, need:9, text:'Its light can be seen from every shore.'},
  candytree:{name:'Candy Tree',     icon:'🍭', size:1, decor:true, cozy:2,  cost:{sugar:30},                          need:1},
  lolly:   {name:'Lollipop',        icon:'🍭', size:1, decor:true, cozy:2,  cost:{sugar:30},                          need:1},
  flowers: {name:'Icing Flowers',   icon:'🌷', size:1, decor:true, cozy:2,  cost:{sugar:20},                          need:1},
  gumdrop: {name:'Gumdrops',        icon:'🍬', size:1, decor:true, cozy:1,  cost:{sugar:15},                          need:1},
  lamp:    {name:'Candy Lamp',      icon:'🏮', size:1, decor:true, cozy:3,  cost:{sugar:60, flour:10},                need:2},
  fence:   {name:'Wafer Fence',     icon:'🪜', size:1, decor:true, cozy:1,  cost:{flour:6},                           need:1},
  tree:    {name:'Mint Tree',       icon:'🌳', size:1, decor:true, cozy:2,  cost:{sugar:40},                          need:2},
  cherry:  {name:'Giant Cherry',    icon:'🍒', size:1, decor:true, cozy:4,  cost:{sugar:120},                         need:3},
  fountain:{name:'Chocolate Fountain',icon:'⛲', size:2, decor:true, cozy:10, cost:{sugar:600, flour:60, butter:20},  need:3},
  statue:  {name:'Hero Statue',     icon:'🗿', size:1, decor:true, cozy:8,  cost:{sugar:800, butter:30},              need:5},
  crystals:{name:'Rock Candy',      icon:'💎', size:1, decor:true, cozy:6,  cost:{sugar:500, butter:25},              need:6}
};
// The kingdom is a GRID x GRID island. Most of it starts hidden under leaves; each Castle level clears a bigger
// square around the castle (`land` tiles wide) and allows more buildings (`limit`). cost = price to reach the NEXT level.
const GRID = 30;
const CASTLE = [
  null,
  {cost:{sugar:300, flour:40},                  land:8,  limit:{pond:1, lumber:1, cottage:1}},
  {cost:{sugar:900, flour:150, butter:10},      land:10, limit:{pond:2, lumber:1, mill:1, bakery:1, cottage:2}},
  {cost:{sugar:2400, flour:400, butter:60},     land:12, limit:{pond:2, lumber:2, mill:1, bakery:1, cottage:2}},
  {cost:{sugar:5500, flour:900, butter:160},    land:14, limit:{pond:3, lumber:2, mill:2, bakery:2, cottage:3}},
  {cost:{sugar:11000, flour:1800, butter:380},  land:16, limit:{pond:3, lumber:3, mill:2, bakery:2, cottage:4}},
  {cost:{sugar:20000, flour:3400, butter:750},  land:18, limit:{pond:4, lumber:3, mill:3, bakery:3, cottage:4}},
  {cost:{sugar:34000, flour:5600, butter:1300}, land:20, limit:{pond:4, lumber:4, mill:3, bakery:3, cottage:5}},
  {cost:{sugar:52000, flour:8500, butter:2100}, land:22, limit:{pond:5, lumber:4, mill:4, bakery:4, cottage:5}},
  {cost:{sugar:76000, flour:12000, butter:3200},land:24, limit:{pond:5, lumber:5, mill:4, bakery:4, cottage:6}},
  {cost:{sugar:105000, flour:17000, butter:4600},land:26,limit:{pond:6, lumber:5, mill:5, bakery:5, cottage:6}},
  {cost:{sugar:140000, flour:23000, butter:6500},land:28,limit:{pond:6, lumber:6, mill:5, bakery:5, cottage:7}},
  {cost:null,                                   land:30, limit:{pond:7, lumber:6, mill:6, bakery:6, cottage:8}}
];

const RES = {
  sugar: {name:'Sugar',  icon:'🍬'},
  flour: {name:'Flour',  icon:'🌾'},
  butter:{name:'Butter', icon:'🧈'},
  jam:   {name:'Jam',    icon:'🍓'},
  cutters:{name:'Cookie Cutters', icon:'✂️'},
  tickets:{name:'Event Tickets',  icon:'🎟️'}
};

/* The Magic Oven. It is always open from the Oven button: nothing to build or level up.
 * A classic bake costs Cookie Cutters; the special event bake costs Event Tickets.
 * Both are only ever earned by playing: they cannot be bought. Odds are shown in the game. */
const GACHA = {
  cost1: 1, cost10: 10, pity: 40,              // an Epic or better is guaranteed within `pity` bakes
  odds: {common: 60, rare: 30, epic: 10}       // Special sweets marked `eventOnly` never come from a classic bake
};
/* The special event. To change it edit only this block: name, look, featured sweets, odds, end date.
 * `featured` sweets are picked half of the time whenever their rarity comes up. */
const EVENT = {
  id: 'christmas', name: 'Christmas Bake', icon: '🎄', colors: ['#c8323c', '#2e9a4a'],
  blurb: 'Five festive sweets, only here until New Year. Antie and Klina too!',
  featured: ['frostine', 'figgy', 'yule', 'ginger', 'twist'],
  odds: {common: 48, rare: 34, epic: 14, special: 4},
  until: '2027-01-01T00:00:00',   // the event bake closes at this time (leave out for an event that never ends)
  festive: true                   // snow, lights and a snowy island while the event is on
};

// Guided goals, done in order. Each one pays Cookie Cutters.
const GOALS = [
  {id:'pond',    text:'Build a Sugar Mill',               cutters:1, check:s => count(s, 'pond') >= 1, go:'build'},
  {id:'collect', text:'Collect sugar from your mill',     cutters:1, check:s => s.stats.collected >= 1, go:'kingdom'},
  {id:'stage1',  text:'Win stage 1-1',                    cutters:1, check:s => (s.stars['0-0'] || 0) > 0, go:'map'},
  {id:'lumber',  text:'Build a Flour Windmill',           cutters:1, check:s => count(s, 'lumber') >= 1, go:'build'},
  {id:'castle2', text:'Upgrade the Castle to level 2',    cutters:1, check:s => s.castle >= 2, go:'kingdom'},
  {id:'draw',    text:'Bake a new friend at the Oven',    cutters:1, check:s => s.stats.draws >= 1, go:'well'},
  {id:'level',   text:'Level a sweet up to level 5',      cutters:1, check:s => Object.values(s.cats).some(c => c.lv >= 5), go:'cats'},
  {id:'boss1',   text:'Beat Baron Crumbsnatcher (1-13)',  cutters:1, check:s => (s.stars['0-12'] || 0) > 0, go:'map'},
  {id:'team5',   text:'Put 5 sweets in your team',        cutters:1, check:s => s.team.filter(Boolean).length >= 5, go:'cats'},
  {id:'cozy',    text:'Reach 60 cozy points',             cutters:1, check:s => window.CK.cozy(s) >= 60, go:'build'},
  {id:'world3',  text:'Finish Episode 2: Candy Blossom',  cutters:2, check:s => (s.stars['1-14'] || 0) > 0, go:'map'},
  {id:'castle4', text:'Upgrade the Castle to level 4',    cutters:2, check:s => s.castle >= 4, go:'kingdom'},
  {id:'castle6', text:'Upgrade the Castle to level 6',    cutters:2, check:s => s.castle >= 6, go:'kingdom'},
  {id:'ep5',     text:'Finish Episode 5: Honeycomb Hollow', cutters:3, check:s => (s.stars['4-14'] || 0) > 0, go:'map'},
  {id:'king',    text:'Defeat King Whiskers the Hungry',  cutters:5, check:s => (s.stars['9-17'] || 0) > 0, go:'map'}
];
function count(s, type) { return s.buildings.filter(b => b.type === type).length; }

// ---- stat maths shared by the roster screen and the battle
const MAX_LEVEL = 60;
function catStats(id, own) {
  const c = CATS[id], lv = own?.lv || 1, stars = own?.stars || 0;
  const grow = (1 + (lv - 1) * 0.085) * (1 + stars * 0.1);
  const hp = Math.round(c.hp * grow), atk = Math.round(c.atk * grow);
  return {hp, atk, power: Math.round(hp * 0.35 + atk * 4.2)};
}
const levelCost = lv => Math.round(20 * Math.pow(lv, 1.25));
const dupeJam = {common: 60, rare: 150, epic: 400, special: 1200};

window.CKData = {ROLES, RARITY, CATS, STARTERS, FOES, BOSSES, WORLDS, EPISODES, TOTAL_LEVELS, levelIndex, GRID, STAGES_PER_WORLD, stageInfo, BUILDINGS, CASTLE, RES, GACHA, EVENT, GOALS,
  MAX_LEVEL, catStats, levelCost, dupeJam, count};
})();
