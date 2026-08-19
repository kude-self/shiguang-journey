(() => {
  const escLight=s=>String(s||'').replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
  function initialSessionForRecord(r){
    if(r?.record_type!=='初遇' || typeof sessions==='undefined') return null;
    return sessions.find(s=>s.journey_id===r.journey_id) || sessions.find(s=>s.traveler_id===r.traveler_id && (s.light_color||s.light_meaning));
  }
  function addLightToExportSheet(){
    const observer=new MutationObserver(mutations=>{
      for(const m of mutations){
        for(const node of m.addedNodes){
          if(!(node instanceof HTMLElement) || node.style.left!=='-99999px') continue;
          const title=node.textContent||'';
          if(!title.includes('初遇紀錄') || node.querySelector('[data-export-initial-light]')) continue;
          const currentRecord=(typeof records!=='undefined'?records:[]).find(r=>r.record_type==='初遇' && title.includes((travelers.find(t=>t.id===r.traveler_id)?.name)||''));
          const s=initialSessionForRecord(currentRecord);
          if(!s || (!s.light_color&&!s.light_meaning)) continue;
          const content=node.querySelector('div[style*="white-space:pre-wrap"]');
          if(!content) continue;
          const box=document.createElement('div'); box.dataset.exportInitialLight='1';
          box.style.cssText='margin:34px 0 6px;padding:26px 30px;border-radius:24px;background:rgba(245,229,226,.72);border:1px solid rgba(170,138,102,.14);font-family:"PingFang TC","Noto Serif TC",sans-serif;';
          box.innerHTML=`<div style="font-family:'Songti TC','Noto Serif TC',serif;font-size:28px;font-weight:600;letter-spacing:.08em;color:#6f6258">✦ 初見你的光</div><div style="margin-top:13px;font-size:25px;line-height:1.7;color:#665d55">${s.light_color?`<span style="font-weight:600">${escLight(s.light_color)}</span>`:''}${s.light_meaning?`<div style="margin-top:6px">${escLight(s.light_meaning)}</div>`:''}</div>`;
          content.insertAdjacentElement('beforebegin',box);
        }
      }
    });
    observer.observe(document.body,{childList:true});
  }
  document.addEventListener('DOMContentLoaded',addLightToExportSheet);
})();