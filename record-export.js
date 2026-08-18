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
      @media(max-width:900px){.record-export-guide{padding:14px 15px}.record-export-actions{display:grid;grid-template-columns:1fr 1fr}.record-export-actions .small-btn{width:100%;min-height:40px}}
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
      const {canvas,t}=await canvasFor(r);
      const img=canvas.toDataURL('image/jpeg',.94);
      const {jsPDF}=window.jspdf;
      const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
      const pageW=210,pageH=297;
      const imgH=canvas.height*pageW/canvas.width;
      let offset=0;
      pdf.addImage(img,'JPEG',0,offset,pageW,imgH);
      let remaining=imgH-pageH;
      while(remaining>0){offset-=pageH;pdf.addPage();pdf.addImage(img,'JPEG',0,offset,pageW,imgH);remaining-=pageH;}
      pdf.save(`${cleanName(t?.name)}-${recordTitle(r.record_type)}.pdf`);
      toast('PDF 已匯出');
    }catch(e){console.error(e);toast('PDF 匯出失敗，請再試一次');}
  }

  function enhanceRecordCards(){
    const page=document.getElementById('recordsPage');
    if(!page)return;
    const templates=[...page.querySelectorAll('.record-grid .record-card')];
    templates.forEach(card=>{
      if(card.querySelector('.record-flow-note'))return;
      const note=document.createElement('div');
      note.className='record-flow-note';
      note.textContent='整理文案 → 保存紀錄 → 匯出圖片／PDF';
      card.appendChild(note);
    });
    const savedCard=document.getElementById('recordList')?.closest('.card');
    if(savedCard && !savedCard.querySelector('.record-export-guide')){
      const guide=document.createElement('div');
      guide.className='record-export-guide';
      guide.innerHTML='<strong>匯出紀錄</strong><span>文案保存後，這裡會直接出現「匯出圖片」與「匯出 PDF」。如果還沒有保存紀錄，請先從上方選擇初遇／拾光／同行整理文案。</span>';
      const list=document.getElementById('recordList');
      savedCard.insertBefore(guide,list);
    }
  }

  function addButtons(){
    const list=document.getElementById('recordList');
    if(!list || typeof records==='undefined')return;
    const cards=[...list.querySelectorAll('.session-card')];
    cards.forEach((card,i)=>{
      const r=records[i];
      if(!r||card.querySelector('.record-export-actions'))return;
      const box=document.createElement('div');
      box.className='record-export-actions';
      box.innerHTML=`<button class="small-btn export-image" data-export-image="${r.id}">匯出圖片</button><button class="small-btn export-pdf" data-export-pdf="${r.id}">匯出 PDF</button>`;
      card.appendChild(box);
    });
    list.querySelectorAll('[data-export-image]').forEach(b=>b.onclick=()=>exportImage(b.dataset.exportImage));
    list.querySelectorAll('[data-export-pdf]').forEach(b=>b.onclick=()=>exportPdf(b.dataset.exportPdf));
  }

  function refreshExportUi(){enhanceRecordCards();addButtons();}

  window.addEventListener('load',()=>{
    injectStyles();
    const list=document.getElementById('recordList');
    if(list){
      const observer=new MutationObserver(refreshExportUi);
      observer.observe(list,{childList:true,subtree:true});
    }
    refreshExportUi();
  });
})();