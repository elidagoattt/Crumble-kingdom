/* Crumble Kingdom: start-up. Loads the save and any replacement art, then shows the kingdom. */
(() => {
'use strict';
const CK = window.CK, UI = window.CKUI, Kingdom = window.CKKingdom, Battle = window.CKBattle, Sound = window.CKSound;

function fight(w, s) {
  const S = CK.state, ep = window.CKData.EPISODES[w];
  const go = () => {
    Kingdom.hide(); Sound.setMusic('battle');
    const ok = Battle.start({w, s, onEnd: res => {
      Kingdom.show(); Sound.setMusic('kingdom'); UI.renderHud();
      const back = () => UI.openEpisode(res.win && res.out?.episodeDone && w < 9 ? w + 1 : w);
      if (!res.win) return back();
      const friend = () => res.out?.friend ? UI.friendJoined(res.out.friend, back) : back();
      if (res.out?.episodeDone && !S.seenStory['o' + w]) { S.seenStory['o' + w] = 1; CK.changed(); UI.scene(w, ep.outro, friend); } else friend();
    }});
    if (!ok) { Kingdom.show(); UI.toast('Put at least one sweet in your team first.'); }
  };
  // the first level of an episode opens with its story
  if (s === 0 && !S.seenStory['i' + w]) { S.seenStory['i' + w] = 1; CK.changed(); UI.scene(w, ep.intro, go); } else go();
}

async function boot() {
  CK.load();
  await Promise.race([window.CKArt.load(), new Promise(r => setTimeout(r, 4000))]);
  Kingdom.init(document.getElementById('kingdom')); Kingdom.show();
  UI.init();
  document.getElementById('loading').classList.add('gone');
  document.addEventListener('pointerdown', () => { Sound.unlock(); Sound.setMusic(Battle.active() ? 'battle' : 'kingdom'); }, {once: true});
  if (!CK.state.tutorial) UI.story(); else UI.daily();
  // production keeps going while the tab is hidden; redraw the numbers when the player comes back
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { UI.renderHud(); UI.daily(); } });
}
window.CKGame = {fight};
boot();
})();
