(() => {
  const cleanName = s => String(s || '旅人').replace(/[\\/:*?"<>|]/g, '-');
  const recordTitle = type => type === '初遇' ? '初遇紀錄' : type === '拾光' ? '拾光紀錄' : '旅程紀錄';
  const recordTagline = type => type === '初遇' ? '一場相遇，留下第一次看見。' : type === '拾光' ? '四週整理，把一路看見的自己留下來。' : '三個月，把真正發生在生活裡的改變留下來。';
  const palette = type => type === '初遇' ? ['#f5e5e2','#fffaf5'] : type === '拾光' ? ['#e4ece1','#fffaf5'] : ['#e2ebf0','#fffaf5'];

  function injectStyles(){
    if(document.getElementById('recordExportStyles')) return;
    const style=document.createElement('style');
    style.id='recordExportStyles';
    style.textContent=`
      .record-flow-note{margin-top:12px;padding:10px 12px;border-radius:14px;background:rgba(255,253,249,.72);border:1px dashed rgba(170,138,102,.18);font-size:12px;line-height:1.7;color:#8f877f}
      .record-export-guide{margin:18px 0 0;padding:16px 18px;border-radius:18px;background:linear-gradient(135deg,rgba(241,223,220,.40),rgba(223,232,221,.38),rgba(223,232,238,.35));border:1px solid rgba(170,138,102,.14)}
      .record-export-guide strong{display:block;font-family:"Songti TC","Noto Serif TC","PMingLiU",serif;font-size:17px;color:#5a5149;margin-bottom:5px}
      .record-export-guide span{font-size:12px;line-height:1.75;color:#8f877f}
      .record-export-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid rgba(170,138,102,.12)}
      .record-export-actions .small-btn{background:rgba(241,235,227,.92);border:1px solid rgba(170,138,102,.12)}
      .record-export-actions .export-image{background:rgba(241,223,220,.62)}
      .record-export-actions .export-pdf{background:rgba(223,232,221,.68)}
      .traveler-story-head{background:linear-gradient(145deg,rgba(255,253,249,.96),rgba(241,227,200,.28));}
      .traveler-story-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:18px}
      .traveler-story-pill{padding:12px 13px;border-radius:16px;background:rgba(255,253,249,.78);border:1px solid rgba(170,138,102,.11)}
      .traveler-story-pill span{display:block;font-size:10px;letter-spacing:.08em;color:#a0968e;margin-bottom:5px}.traveler-story-pill strong{font-family:Georgia,"Times New Roman",serif;font-size:23px;font-weight:400;color:#554d46}
      .journey-story-list{display:grid;gap:14px;margin-top:15px}
      .journey-story{position:relative;overflow:hidden;border-radius:22px;border:1px solid rgba(170,138,102,.13);padding:18px;background:#fffdf9}
      .journey-story[data-type="初遇"]{background:linear-gradient(135deg,rgba(255,253,249,.98),rgba(241,223,220,.52))}
      .journey-story[data-type="拾光"]{background:linear-gradient(135deg,rgba(255,253,249,.98),rgba(223,232,221,.62))}
      .journey-story[data-type="同行"]{background:linear-gradient(135deg,rgba(255,253,249,.98),rgba(223,232,238,.62))}
      .journey-story-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.journey-story-title{font-family:"Songti TC","Noto Serif TC","PMingLiU",serif;font-size:20px;font-weight:600;letter-spacing:.04em}.journey-story-tag{font-size:11px;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.68);white-space:nowrap}.journey-story-meta{font-size:11px;color:#948b83;margin-top:5px}.journey-story-line{font-family:"Kaiti TC","STKaiti","DFKai-SB",serif;color:#847b73;font-size:13px;line-height:1.8;margin:10px 0}.journey-story-actions{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0 4px}.journey-story-actions button{border:0;border-radius:11px;padding:8px 10px;background:rgba(255,255,255,.72);color:#5f574f;font-size:12px}
      .journey-counts{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.journey-counts span{font-size:11px;border-radius:999px;padding:6px 9px;background:rgba(255,255,255,.58);color:#817870}
      .journey-subsection{margin-top:15px;padding-top:13px;border-top:1px solid rgba(170,138,102,.10)}.journey-subsection-title{font-size:12px;font-weight:600;letter-spacing:.06em;color:#81776f;margin-bottom:8px}
      .journey-mini{padding:10px 11px;margin-top:7px;border-radius:13px;background:rgba(255,255,255,.60);font-size:12px;line-height:1.65}.journey-mini strong{font-weight:600}.journey-mini .mini-date{color:#a0968c;font-size:10px;margin-bottom:3px}.journey-record-status{display:inline-block;margin-left:6px;font-size:10px;color:#9a8a76}
      .no-journey-invite{text-align:center;padding:28px 14px}.no-journey-invite p{color:#948b83;font-size:13px;line-height:1.8}.no-journey-invite button{margin-top:7px}
      @media(max-width:900px){.record-export-guide{padding:14px 15px}.record-export-actions{display:grid;grid-template-columns:1fr 1fr}.record-export-actions .small-btn{width:100%;min-height:40px}.traveler-story-summary{grid-template-columns:repeat(3,minmax(0,1fr))}.traveler-story-pill{padding:10px}.traveler-story-pill strong{font-size:21px}.journey-story{padding:16px}.journey-story-top{gap:8px}.journey-story-title{font-size:18px}.journey-story-actions{display:grid;grid-template-columns:1fr 1fr}.journey-story-actions button{min-height:39px}.journey-story-actions button:first-child{grid-column:1/-1}}
    `;
    document.head.appendChild(style);
  }

  function makeSheet(r){
    const t = travelers.find(x => x.id === r.traveler_id);
    const text = r.confirmed_text || r.draft_text || '';
    const [accent,paper] = palette(r.record_type);
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;left:-99999px;top:0;width:1080px;min-height:1350px;padding:92px 88px 78px;background:'+paper+';color:#514a43;font-family:"PingFang TC","Noto Serif TC","Microsoft JhengHei",sans-serif;box-sizing:border-box;overflow:hidden;';
    wrap.innerHTML = `
      <div style="position:absolute;width:360px;height:360px;border-radius:50%;right:-120px;top:-100px;background:${accent};opacity:.9"></div>
      <div style="position:absolute;width:270px;height:210px;border-radius:48% 52% 60% 40%;left:-100px;bottom:-70px;background:${accent};opacity:.48;transform:rotate(18deg)"></div>
      <div style="position:relative;z-index:1">
        <div style="font-family:Georgia,serif;font-style:italic;letter-spacing:.28em;color:#aa8a66;font-size:22px">SHIGUANG TRAVELER JOURNAL</div>
        <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-top:32px;padding-bottom:34px;border-bottom:1px solid #e5d8cb">
          <div><div style="font-size:62px;font-family:'Songti TC','Noto Serif TC',serif;font-weight:600;letter-spacing:.08em">${recordTitle(r.record_type)}</div><div style="font-size:25px;color:#92877e;margin-top:14px">${recordTagline(r.record_type)}</div></div>
          <div style="font-size:25px;color:#aa8a66">𓇼 拾光所</div>
        </div>
        <div style="margin-top:48px;display:flex;gap:18px;align-items:center"><div style="padding:11px 20px;border-radius:999px;background:${accent};font-size:23px">${t?.name || '旅人'}</div><div style="font-size:21px;color:#9b9188">${new Date(r.updated_at).toLocaleDateString('zh-TW')}</div></div>
        <div style="margin-top:46px;font-family:'Kaiti TC','STKaiti','DFKai-SB',serif;font-size:31px;line-height:2.05;letter-spacing:.035em;white-space:pre-wrap;overflow-wrap:anywhere">${text.replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}</div>
        <div style="margin-top:58px;padding-top:25px;border-top:1px solid #eadfd4;font-size:19px;color:#a69b91;letter-spacing:.12em">拾起一路看見的光，也把此刻的自己留下來。</div>
      </div>`;
    document.body.appendChild(wrap);
    return {wrap,t};
  }

  async function canvasFor(r){
    if(!window.html2canvas){ toast('圖片工具尚未載入，請重新整理後再試'); throw new Error('html2canvas missing'); }
    const {wrap,t} = makeSheet(r);
    try { const canvas = await html2canvas(wrap,{scale:1.5,backgroundColor:'#fffaf5',useCORS:true}); return {canvas,t}; }
    finally { wrap.remove(); }
  }
  function downloadUrl(url,name){ const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove(); }
  async function exportImage(id){
    const r=records.find(x=>x.id===id); if(!r)return;
    if(!r.confirmed_text && !r.draft_text)return toast('這份紀錄還沒有文字可以匯出');
    toast('正在製作圖片…');
    try{const {canvas,t}=await canvasFor(r);canvas.toBlob(blob=>{if(!blob)return toast('圖片建立失敗');const url=URL.createObjectURL(blob);downloadUrl(url,`${cleanName(t?.name)}-${recordTitle(r.record_type)}.png`);setTimeout(()=>URL.revokeObjectURL(url),2000);toast('圖片已匯出');},'image/png');}catch(e){console.error(e);toast('圖片匯出失敗，請再試一次');}
  }
  async function exportPdf(id){
    const r=records.find(x=>x.id===id); if(!r)return;
    if(!r.confirmed_text && !r.draft_text)return toast('這份紀錄還沒有文字可以匯出');
    if(!window.jspdf?.jsPDF)return toast('PDF 工具尚未載入，請重新整理後再試');
    toast('正在製作 PDF…');
    try{
      const {canvas,t}=await canvasFor(r); const img=canvas.toDataURL('image/jpeg',.94); const {jsPDF}=window.jspdf;
      const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'}); const pageW=210,pageH=297; const imgH=canvas.height*pageW/canvas.width; let offset=0;
      pdf.addImage(img,'JPEG',0,offset,pageW,imgH); let remaining=imgH-pageH;
      while(remaining>0){offset-=pageH;pdf.addPage();pdf.addImage(img,'JPEG',0,offset,pageW,imgH);remaining-=pageH;}
      pdf.save(`${cleanName(t?.name)}-${recordTitle(r.record_type)}.pdf`); toast('PDF 已匯出');
    }catch(e){console.error(e);toast('PDF 匯出失敗，請再試一次');}
  }

  function enhanceRecordCards(){
    const page=document.getElementById('recordsPage'); if(!page)return;
    [...page.querySelectorAll('.record-grid .record-card')].forEach(card=>{
      if(card.querySelector('.record-flow-note'))return; const note=document.createElement('div'); note.className='record-flow-note'; note.textContent='整理文案 → 保存紀錄 → 匯出圖片／PDF'; card.appendChild(note);
    });
    const savedCard=document.getElementById('recordList')?.closest('.card');
    if(savedCard && !savedCard.querySelector('.record-export-guide')){
      const guide=document.createElement('div'); guide.className='record-export-guide'; guide.innerHTML='<strong>匯出紀錄</strong><span>文案保存後，這裡會直接出現「匯出圖片」與「匯出 PDF」。如果還沒有保存紀錄，請先從上方選擇初遇／拾光／同行整理文案。</span>';
      savedCard.insertBefore(guide,document.getElementById('recordList'));
    }
  }

  function addButtons(){
    const list=document.getElementById('recordList'); if(!list || typeof records==='undefined')return;
    [...list.querySelectorAll('.session-card')].forEach((card,i)=>{
      const r=records[i]; if(!r||card.querySelector('.record-export-actions'))return;
      const box=document.createElement('div'); box.className='record-export-actions'; box.innerHTML=`<button class="small-btn export-image" data-export-image="${r.id}">匯出圖片</button><button class="small-btn export-pdf" data-export-pdf="${r.id}">匯出 PDF</button>`; card.appendChild(box);
    });
    list.querySelectorAll('[data-export-image]').forEach(b=>b.onclick=()=>exportImage(b.dataset.exportImage));
    list.querySelectorAll('[data-export-pdf]').forEach(b=>b.onclick=()=>exportPdf(b.dataset.exportPdf));
  }

  function openRecordForJourney(jid){
    const j=journeys.find(x=>x.id===jid); if(!j)return;
    document.getElementById('recordId').value=''; document.getElementById('recordType').value=j.journey_type;
    document.getElementById('recordDialogTitle').textContent=`整理${journeyName(j.journey_type)}紀錄文案`;
    fillTravelerOptions('recordTraveler',j.traveler_id); fillJourneyOptions('recordJourney',j.traveler_id,j.id,j.journey_type);
    document.getElementById('draftText').value=''; document.getElementById('confirmedText').value=''; document.getElementById('recordStatus').value='draft'; document.getElementById('recordDialog').showModal();
  }

  function sessionMini(s,j){
    const p=(sessionPrompts[j.journey_type]||sessionPrompts.初遇); const body=s.insight||s.bring||s.picked_light||'';
    return `<div class="journey-mini"><div class="mini-date">${fmt(s.session_date)}${s.stage?` · ${esc(s.stage)}`:''}</div>${body?`<strong>${esc(p.insight||'看見')}</strong> ${esc(body.slice(0,120))}${body.length>120?'…':''}`:'這次相遇尚未留下摘要。'}</div>`;
  }
  function recordMini(r){
    const text=r.confirmed_text||r.draft_text||'';
    return `<div class="journey-mini"><div class="mini-date">${new Date(r.updated_at).toLocaleDateString('zh-TW')}<span class="journey-record-status">${r.status==='confirmed'?'已確認':'草稿'}</span></div>${text?`${esc(text.slice(0,120))}${text.length>120?'…':''}`:'尚未留下文案。'}</div>`;
  }
  function renderJourneyStory(j){
    const jsessions=sessions.filter(s=>s.journey_id===j.id).sort((a,b)=>String(a.session_date).localeCompare(String(b.session_date)));
    const jrecords=records.filter(r=>r.journey_id===j.id).sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at));
    return `<div class="journey-story" data-type="${esc(j.journey_type)}">
      <div class="journey-story-top"><div><div class="journey-story-title">${esc(journeyName(j.journey_type))}</div><div class="journey-story-meta">開始於 ${fmt(j.start_date)}</div></div><span class="journey-story-tag">${j.status==='completed'?'已完成':'進行中'}</span></div>
      <div class="journey-story-line">${esc(journeyTagline(j.journey_type))}${j.note?`<br>${esc(j.note)}`:''}</div>
      <div class="journey-counts"><span>${jsessions.length} 次相遇</span><span>${jrecords.length} 份紀錄</span></div>
      <div class="journey-story-actions"><button data-story-session="${j.id}">＋ 新增這段旅程的相遇紀錄</button><button data-story-record="${j.id}">整理紀錄</button><button data-story-edit="${j.id}">編輯旅程</button></div>
      <div class="journey-subsection"><div class="journey-subsection-title">相遇紀錄</div>${jsessions.length?jsessions.map(s=>sessionMini(s,j)).join(''):'<div class="journey-mini">這段旅程還沒有相遇紀錄。</div>'}</div>
      <div class="journey-subsection"><div class="journey-subsection-title">拾光冊</div>${jrecords.length?jrecords.map(recordMini).join(''):'<div class="journey-mini">這段旅程還沒有保存紀錄。</div>'}</div>
    </div>`;
  }

  function installTravelerDetail(){
    openDetail = function(id){
      const t=travelerFor(id); if(!t)return; currentDetailId=id;
      const js=journeys.filter(j=>j.traveler_id===id).sort((a,b)=>String(a.start_date).localeCompare(String(b.start_date)));
      const active=js.filter(j=>j.status!=='completed').length, completed=js.filter(j=>j.status==='completed').length;
      document.getElementById('travelerDetail').innerHTML=`
        <div class="card traveler-story-head"><div class="detail-top"><div><div class="eyebrow">TRAVELER STORY</div><h3>${esc(t.name)}</h3><div class="muted">第一次相遇 ${fmt(t.first_meeting_date)}</div></div><div class="row-actions"><button class="small-btn" data-detail-new-journey="${t.id}">＋ 開始新旅程</button><button class="small-btn" data-detail-edit-traveler="${t.id}">編輯旅人</button></div></div>
        <div class="detail-grid"><div class="detail-block"><span>此刻想整理</span><p>${esc(t.concern||'—')}</p></div><div class="detail-block"><span>希望看見</span><p>${esc(t.hope||'—')}</p></div><div class="detail-block full"><span>私人備註</span><p>${esc(t.private_note||'—')}</p></div></div>
        <div class="traveler-story-summary"><div class="traveler-story-pill"><span>全部旅程</span><strong>${js.length}</strong></div><div class="traveler-story-pill"><span>進行中</span><strong>${active}</strong></div><div class="traveler-story-pill"><span>已完成</span><strong>${completed}</strong></div></div></div>
        <div class="card" style="margin-top:16px"><div class="section-head"><div><div class="eyebrow">JOURNEY TIMELINE</div><h3 style="margin-top:4px">旅程紀錄</h3></div></div>${js.length?`<div class="journey-story-list">${js.map(renderJourneyStory).join('')}</div>`:`<div class="no-journey-invite"><p>這位旅人目前還沒有開始任何旅程。<br>建立旅程後，初遇、拾光與同行會各自收藏自己的相遇紀錄。</p><button class="primary" data-detail-new-journey="${t.id}">＋ 開始第一段旅程</button></div>`}</div>`;
      setPage('detail'); bindTravelerDetail();
    };
  }

  function bindTravelerDetail(){
    document.querySelectorAll('[data-detail-new-journey]').forEach(b=>b.onclick=()=>openJourney(null,b.dataset.detailNewJourney));
    document.querySelectorAll('[data-detail-edit-traveler]').forEach(b=>b.onclick=()=>openTraveler(b.dataset.detailEditTraveler));
    document.querySelectorAll('[data-story-edit]').forEach(b=>b.onclick=()=>openJourney(b.dataset.storyEdit));
    document.querySelectorAll('[data-story-session]').forEach(b=>{b.onclick=()=>{const j=journeys.find(x=>x.id===b.dataset.storySession);if(j)openSession(null,j.traveler_id,j.id);};});
    document.querySelectorAll('[data-story-record]').forEach(b=>b.onclick=()=>openRecordForJourney(b.dataset.storyRecord));
  }

  function refreshExportUi(){enhanceRecordCards();addButtons();}

  window.addEventListener('load',()=>{
    injectStyles(); installTravelerDetail();
    const list=document.getElementById('recordList');
    if(list){ const observer=new MutationObserver(refreshExportUi); observer.observe(list,{childList:true,subtree:true}); }
    refreshExportUi();
  });
})();