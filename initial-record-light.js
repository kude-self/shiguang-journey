(() => {
  // 穩定讀取：單一資料表暫時失敗時不讓整個首頁一起失效，並自動重試一次。
  if (typeof loadAll === 'function') {
    loadAll = async function(){
      const query = async (name, run) => {
        let result = await run();
        if (result.error) {
          await new Promise(r => setTimeout(r, 650));
          result = await run();
        }
        if (result.error) console.error(`Shiguang ${name} load error:`, result.error);
        return result;
      };
      try {
        const [t,j,s,r] = await Promise.all([
          query('travelers', () => sb.from('travelers').select('*').order('updated_at',{ascending:false})),
          query('journeys', () => sb.from('journeys').select('*').order('start_date',{ascending:false})),
          query('sessions', () => sb.from('sessions').select('*').order('session_date',{ascending:false})),
          query('records', () => sb.from('records').select('*').order('updated_at',{ascending:false}))
        ]);
        if (!t.error) travelers=t.data||[];
        if (!j.error) journeys=j.data||[];
        if (!s.error) sessions=s.data||[];
        if (!r.error) records=r.data||[];
        renderAll();
        const failed=[['旅人',t],['旅程',j],['相遇紀錄',s],['拾光冊',r]].filter(([,x])=>x.error).map(([n])=>n);
        if(failed.length) toast(`${failed.join('、')}暫時讀取失敗，其他資料已正常載入`);
      } catch(err) {
        console.error('Shiguang loadAll fatal:',err);
        renderAll();
        toast('資料連線不穩定，請稍後重新整理');
      }
    };
  }

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