(() => {
  const $id=id=>document.getElementById(id);
  const journeyById=id=>(typeof journeys!=='undefined'?journeys:[]).find(j=>j.id===id);
  const guides={
    初遇:{title:'初遇｜第一次看見',note:'記下第一次相遇時最重要的感受、看見與此刻的光。',tone:'rgba(241,223,220,.38)'},
    拾光:{title:'拾光｜四週變化',note:'每一週留下事件、情緒、反覆模式、能量變化與下一步微行動。',tone:'rgba(223,232,238,.42)'},
    同行:{title:'同行｜生活裡的改變',note:'記下真實生活中的選擇、界線、關係、身體訊號與落地行動。',tone:'rgba(223,232,221,.46)'}
  };
  function ensureGuide(){
    const grid=$id('sessionForm')?.querySelector('.form-grid');
    if(!grid||$id('journeyFormGuide'))return;
    const box=document.createElement('div');box.id='journeyFormGuide';box.className='full journey-form-guide';
    grid.prepend(box);
    const style=document.createElement('style');style.textContent=`.journey-form-guide{grid-column:1/-1;margin:4px 0 10px;padding:14px 16px;border-radius:16px;border:1px solid rgba(170,138,102,.12);transition:.2s}.journey-form-guide strong{display:block;font-family:"Songti TC","Noto Serif TC",serif;font-size:16px;letter-spacing:.05em}.journey-form-guide span{display:block;margin-top:5px;color:#8f877f;font-size:12px;line-height:1.65}`;document.head.appendChild(style);
  }
  function updateGuide(){
    ensureGuide();const j=journeyById($id('sessionJourney')?.value);const type=j?.journey_type||'初遇';const g=guides[type];const box=$id('journeyFormGuide');
    if(box){box.style.background=g.tone;box.innerHTML=`<strong>${g.title}</strong><span>${g.note}</span>`;}
  }
  document.addEventListener('DOMContentLoaded',()=>{
    ensureGuide();$id('sessionJourney')?.addEventListener('change',()=>setTimeout(updateGuide,0));
    if(typeof openSession==='function'){
      const original=openSession;openSession=function(...args){const out=original.apply(this,args);setTimeout(updateGuide,0);return out;};
    }
    if(!document.querySelector('script[data-booking-handoff]')){
      const s=document.createElement('script');s.src='./booking-handoff.js?v=20260820';s.dataset.bookingHandoff='1';document.body.appendChild(s);
    }
  });
})();