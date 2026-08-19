(() => {
  const byId = id => document.getElementById(id);
  const journeyForId = id => (window.journeys || journeys || []).find(j => j.id === id);

  function ensureFields(){
    const anchor = byId('bring')?.closest('label');
    if (!anchor || byId('initialLightBlock')) return;
    const block = document.createElement('div');
    block.id = 'initialLightBlock';
    block.className = 'full initial-light-block';
    block.innerHTML = `
      <div class="initial-light-title">✦ 初見你的光</div>
      <div class="initial-light-note">留下當下感受到的光的顏色與簡短意義。</div>
      <div class="initial-light-grid">
        <label>光的顏色<input id="lightColor" placeholder="例如：金黃色、霧藍色、淡紫色"></label>
        <label>簡短意義<textarea id="lightMeaning" placeholder="這道光此刻讓你感受到什麼？"></textarea></label>
      </div>`;
    anchor.insertAdjacentElement('afterend', block);
    const style = document.createElement('style');
    style.textContent = `.initial-light-block{grid-column:1/-1;padding:16px 18px;border-radius:16px;background:rgba(241,227,200,.25);border:1px solid rgba(185,154,115,.15)}.initial-light-title{font-family:"Songti TC","Noto Serif TC","PMingLiU",serif;font-size:17px;font-weight:600;letter-spacing:.08em}.initial-light-note{margin:5px 0 12px;color:#8f877f;font-size:12px}.initial-light-grid{display:grid;grid-template-columns:1fr 2fr;gap:12px}.initial-light-grid label{display:flex;flex-direction:column;gap:6px}@media(max-width:700px){.initial-light-grid{grid-template-columns:1fr}}`;
    document.head.appendChild(style);
  }

  function syncVisibility(){
    ensureFields();
    const j = journeyForId(byId('sessionJourney')?.value);
    const isInitial = j?.journey_type === '初遇';
    const block = byId('initialLightBlock');
    if (block) block.style.display = isInitial ? '' : 'none';
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureFields();
    const journeySelect = byId('sessionJourney');
    if (journeySelect) journeySelect.addEventListener('change', syncVisibility);

    const originalOpenSession = window.openSession || openSession;
    window.openSession = openSession = function(...args){
      const result = originalOpenSession.apply(this,args);
      setTimeout(() => {
        syncVisibility();
        const id = byId('sessionId')?.value;
        const s = (window.sessions || sessions || []).find(x => x.id === id);
        if (byId('lightColor')) byId('lightColor').value = s?.light_color || '';
        if (byId('lightMeaning')) byId('lightMeaning').value = s?.light_meaning || '';
      },0);
      return result;
    };

    const form = byId('sessionForm');
    if (form) form.addEventListener('submit', async () => {
      const id = byId('sessionId')?.value;
      const j = journeyForId(byId('sessionJourney')?.value);
      if (!id || j?.journey_type !== '初遇') return;
      await sb.from('sessions').update({
        light_color: byId('lightColor')?.value.trim() || null,
        light_meaning: byId('lightMeaning')?.value.trim() || null
      }).eq('id',id);
    });
  });
})();
