(()=>{
  const norm=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,'');
  const fmtTime=t=>String(t||'').slice(0,5);
  let bookingRows=[];

  function style(){
    if(document.getElementById('bookingHandoffStyle')) return;
    const s=document.createElement('style'); s.id='bookingHandoffStyle';
    s.textContent=`
      .booking-import-btn{background:#eef4ea!important;color:#5f745e!important;border-color:#d7e3d3!important}
      #bookingImportDialog .dialog-card{max-width:680px}
      .booking-import-list{display:grid;gap:10px;max-height:58vh;overflow:auto;margin-top:12px}
      .booking-import-row{border:1px solid rgba(185,154,115,.16);background:#fffdf9;border-radius:18px;padding:13px;display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}
      .booking-import-row strong{display:block;font-size:15px}.booking-import-meta{font-size:12px;color:#857b72;line-height:1.6;margin-top:4px}
      .booking-import-state{display:inline-block;margin-top:6px;padding:4px 8px;border-radius:999px;background:#eef4ea;color:#5f745e;font-size:11px;font-weight:700}
      @media(max-width:600px){.booking-import-row{grid-template-columns:1fr}.booking-import-row button{width:100%}}
    `;
    document.head.appendChild(s);
  }

  function ensureDialog(){
    if(document.getElementById('bookingImportDialog')) return;
    const d=document.createElement('dialog'); d.id='bookingImportDialog';
    d.innerHTML=`<div class="dialog-card"><div class="dialog-head"><div><div class="eyebrow">BOOKING</div><h3>從預約帶入旅人</h3></div><button type="button" class="icon-btn" id="closeBookingImport">×</button></div><p class="muted">只顯示已正式確認的預約。點一次，就會把旅人與旅程帶進紀錄系統；已經帶入過的同日期旅程不會重複建立。</p><div id="bookingImportList" class="booking-import-list"></div><div class="dialog-actions"><button type="button" class="ghost" id="closeBookingImport2">關閉</button></div></div>`;
    document.body.appendChild(d);
    document.getElementById('closeBookingImport').onclick=()=>d.close();
    document.getElementById('closeBookingImport2').onclick=()=>d.close();
  }

  function ensureButton(){
    if(document.getElementById('bookingImportBtn')) return;
    const top=document.querySelector('.top-actions'); if(!top) return;
    const b=document.createElement('button'); b.id='bookingImportBtn'; b.className='ghost booking-import-btn'; b.textContent='♡ 從預約帶入';
    b.onclick=openImport;
    top.insertBefore(b,top.firstChild);
  }

  async function openImport(){
    ensureDialog();
    const list=document.getElementById('bookingImportList'); list.innerHTML='<div class="empty">正在讀取已確認預約…</div>';
    document.getElementById('bookingImportDialog').showModal();
    try{
      const {data,error}=await sb.from('traveler_bookings').select('*').eq('status','confirmed').order('booking_date',{ascending:false}).order('booking_time',{ascending:false});
      if(error) throw error;
      bookingRows=data||[];
      renderRows();
    }catch(err){ console.error(err); list.innerHTML='<div class="empty">目前無法讀取預約資料。</div>'; }
  }

  function alreadyImported(b){
    const t=travelers.find(x=>norm(x.name)===norm(b.traveler_name));
    return !!(t&&journeys.some(j=>j.traveler_id===t.id&&j.journey_type===b.journey&&j.start_date===b.booking_date));
  }

  function renderRows(){
    const list=document.getElementById('bookingImportList');
    if(!bookingRows.length){list.innerHTML='<div class="empty">目前沒有已確認的預約。</div>';return;}
    list.innerHTML=bookingRows.map(b=>{
      const done=alreadyImported(b);
      return `<div class="booking-import-row"><div><strong>${esc(b.traveler_name)}｜${esc(b.journey)}</strong><div class="booking-import-meta">${esc(b.booking_date)}・${esc(fmtTime(b.booking_time))}<br>${esc((b.contact_method==='LINE'?'LINE':'Instagram')+'・'+(b.instagram||''))}</div>${done?'<span class="booking-import-state">已在旅人紀錄中</span>':''}</div><button class="${done?'ghost':'primary'}" data-import-booking="${b.id}">${done?'開啟紀錄':'帶入旅人紀錄'}</button></div>`;
    }).join('');
    list.querySelectorAll('[data-import-booking]').forEach(btn=>btn.onclick=()=>importBooking(btn.dataset.importBooking));
  }

  async function importBooking(id){
    const b=bookingRows.find(x=>x.id===id); if(!b) return;
    const btn=document.querySelector(`[data-import-booking="${id}"]`); if(btn){btn.disabled=true;btn.textContent='處理中…';}
    try{
      let t=travelers.find(x=>norm(x.name)===norm(b.traveler_name));
      if(!t){
        const payload={name:b.traveler_name,first_meeting_date:b.booking_date,journey_type:b.journey||'初遇',private_note:`由預約系統帶入｜${b.contact_method==='LINE'?'LINE':'Instagram'}：${b.instagram||''}`,updated_at:new Date().toISOString()};
        const {data,error}=await sb.from('travelers').insert(payload).select().single(); if(error) throw error; t=data;
      }
      let j=journeys.find(x=>x.traveler_id===t.id&&x.journey_type===b.journey&&x.start_date===b.booking_date);
      if(!j){
        const payload={traveler_id:t.id,journey_type:b.journey,start_date:b.booking_date,status:'active',note:'由預約系統帶入',updated_at:new Date().toISOString()};
        const {data,error}=await sb.from('journeys').insert(payload).select().single(); if(error) throw error; j=data;
      }
      await loadAll();
      document.getElementById('bookingImportDialog')?.close();
      setPage('travelers');
      if(travelerFor(t.id)) openDetail(t.id);
      toast(alreadyImported(b)?'已開啟這位旅人的紀錄 ♡':'已帶入旅人紀錄 ♡');
    }catch(err){console.error(err);toast('帶入失敗，請再試一次');}
    finally{if(btn){btn.disabled=false;btn.textContent=alreadyImported(b)?'開啟紀錄':'帶入旅人紀錄';}}
  }

  function mount(){
    try{style();ensureDialog();ensureButton();}catch(e){console.error('booking handoff mount failed',e);}
  }
  const timer=setInterval(()=>{ if(typeof sb!=='undefined'&&document.querySelector('.top-actions')){mount(); if(typeof currentUser!=='undefined'&&currentUser) clearInterval(timer);} },500);
  window.addEventListener('load',mount);
})();