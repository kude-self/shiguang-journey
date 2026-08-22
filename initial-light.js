(() => {
  const byId = id => document.getElementById(id);
  const allJourneys = () => (typeof journeys !== 'undefined' ? journeys : []);
  const allSessions = () => (typeof sessions !== 'undefined' ? sessions : []);
  const journeyForId = id => allJourneys().find(j => j.id === id);

  function ensureFields(){
    const anchor = byId('bring')?.closest('label');
    if (!anchor || byId('initialLightBlock')) return;
    const block = document.createElement('div');
    block.id = 'initialLightBlock';
    block.className = 'full initial-light-block';
    block.innerHTML = `<div class="initial-light-title">✦ 初見你的光</div><div class="initial-light-note">在初遇開始時，留下當下感受到的光，以及它此刻帶來的訊息。</div><div class="initial-light-grid"><label>光的顏色<input id="lightColor" placeholder="例如：金黃色、霧藍色、淡紫色"></label><label>這道光代表什麼／帶來的訊息<textarea id="lightMeaning" placeholder="簡短記下你感受到的意義與訊息"></textarea></label></div>`;
    anchor.insertAdjacentElement('afterend', block);
    const style = document.createElement('style');
    style.textContent = `.initial-light-block{grid-column:1/-1;padding:18px;border-radius:20px;background:linear-gradient(145deg,rgba(255,250,239,.96),rgba(241,227,200,.34));border:1px solid rgba(185,154,115,.18)}.initial-light-title{font-family:"Songti TC","Noto Serif TC","PMingLiU",serif;font-size:18px;font-weight:700;letter-spacing:.06em;color:#66594f}.initial-light-note{margin:6px 0 14px;color:#8f877f;font-size:13px;line-height:1.7}.initial-light-grid{display:grid;grid-template-columns:1fr 1.6fr;gap:12px}.initial-light-grid label{display:flex;flex-direction:column;gap:6px}.initial-light-summary{margin-top:10px;padding:12px 14px;border-radius:14px;background:rgba(241,227,200,.22)}.initial-light-summary b{display:block;margin-bottom:4px}@media(max-width:700px){.initial-light-grid{grid-template-columns:1fr}.initial-light-block{padding:15px}.initial-light-title{font-size:17px}.initial-light-note{font-size:12px}}`;
    document.head.appendChild(style);
  }

  function syncVisibility(){
    ensureFields();
    const j = journeyForId(byId('sessionJourney')?.value);
    const block = byId('initialLightBlock');
    if (block) block.style.display = j?.journey_type === '初遇' ? '' : 'none';
  }

  function paintSavedLights(){
    document.querySelectorAll('.session-card').forEach(card => card.querySelectorAll('.initial-light-summary').forEach(x=>x.remove()));
    const cards = [...document.querySelectorAll('#sessionList .session-card')];
    cards.forEach((card,index) => {
      const s = allSessions()[index];
      const j = journeyForId(s?.journey_id);
      if (!s || j?.journey_type !== '初遇' || (!s.light_color && !s.light_meaning)) return;
      const box=document.createElement('div'); box.className='initial-light-summary';
      box.innerHTML=`<b>✦ 初見你的光</b>${s.light_color?`<span>${esc(s.light_color)}</span>`:''}${s.light_meaning?`<div>${esc(s.light_meaning)}</div>`:''}`;
      card.appendChild(box);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureFields();
    byId('sessionJourney')?.addEventListener('change', syncVisibility);

    const originalOpenSession = openSession;
    openSession = function(...args){
      const result=originalOpenSession.apply(this,args);
      setTimeout(()=>{
        syncVisibility();
        const s=allSessions().find(x=>x.id===byId('sessionId')?.value);
        if(byId('lightColor')) byId('lightColor').value=s?.light_color||'';
        if(byId('lightMeaning')) byId('lightMeaning').value=s?.light_meaning||'';
      },0);
      return result;
    };

    const originalSaveSession = saveSession;
    saveSession = async function(e){
      e.preventDefault();
      const isInitial=journeyForId(byId('sessionJourney')?.value)?.journey_type==='初遇';
      const lightColor=isInitial ? (byId('lightColor')?.value.trim()||null) : null;
      const lightMeaning=isInitial ? (byId('lightMeaning')?.value.trim()||null) : null;
      const editingId=byId('sessionId')?.value;
      await originalSaveSession.call(this,e);
      let savedId=editingId;
      if(!savedId && isInitial){
        const tid=byId('sessionTraveler')?.value, jid=byId('sessionJourney')?.value;
        const {data}=await sb.from('sessions').select('id').eq('traveler_id',tid).eq('journey_id',jid).order('created_at',{ascending:false}).limit(1);
        savedId=data?.[0]?.id;
      }
      if(savedId && isInitial){
        await sb.from('sessions').update({light_color:lightColor,light_meaning:lightMeaning}).eq('id',savedId);
        await loadAll();
      }
    };

    const originalRenderSessions=renderSessions;
    renderSessions=function(){ originalRenderSessions(); setTimeout(paintSavedLights,0); };
  });
})();