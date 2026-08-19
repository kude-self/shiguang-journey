(() => {
  const $id=id=>document.getElementById(id);
  const fmtSafe=d=>d?new Date(String(d).length===10?d+'T00:00:00':d).toLocaleDateString('zh-TW'):'—';
  const jName=t=>t==='初遇'?'初遇':t==='拾光'?'拾光｜四週':'同行｜三個月';
  const escSafe=s=>typeof esc==='function'?esc(s):String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function ensureWorkspace(){
    const page=$id('dashboardPage'); if(!page||$id('dashboardWorkspace')) return;
    const wrap=document.createElement('div');
    wrap.id='dashboardWorkspace';
    wrap.className='dashboard-workspace';
    wrap.innerHTML=`
      <div class="workspace-head"><div><div class="eyebrow">TODAY'S JOURNEY</div><h3>現在正在發生的旅程</h3></div><span class="workspace-note">打開首頁，就知道下一步要看哪裡。</span></div>
      <div class="workspace-grid">
        <section class="card workspace-card"><div class="section-head"><h3>正在進行</h3><span id="workspaceActiveCount" class="workspace-count">0</span></div><div id="workspaceActive"></div></section>
        <section class="card workspace-card"><div class="section-head"><h3>最近相遇</h3><span id="workspaceRecentCount" class="workspace-count">0</span></div><div id="workspaceRecent"></div></section>
        <section class="card workspace-card workspace-pending"><div class="section-head"><h3>待整理</h3><span id="workspacePendingCount" class="workspace-count">0</span></div><div id="workspacePending"></div></section>
      </div>`;
    page.appendChild(wrap);
    const style=document.createElement('style');
    style.textContent=`
      .dashboard-workspace{margin-top:20px}.workspace-head{display:flex;justify-content:space-between;align-items:end;gap:14px;margin-bottom:12px}.workspace-head h3{margin:4px 0 0;font-family:"Songti TC","Noto Serif TC","PMingLiU",serif;font-size:21px;font-weight:600;letter-spacing:.05em}.workspace-note{font-size:12px;color:#978d84}.workspace-grid{display:grid;grid-template-columns:1.05fr 1fr 1fr;gap:14px}.workspace-card{min-height:230px}.workspace-count{display:inline-flex;align-items:center;justify-content:center;min-width:27px;height:27px;padding:0 8px;border-radius:999px;background:rgba(241,227,200,.48);font-family:Georgia,serif;color:#7a6a58;font-size:12px}.workspace-item{padding:11px 2px;border-bottom:1px solid rgba(170,138,102,.10);cursor:pointer}.workspace-item:last-child{border-bottom:0}.workspace-item:hover .workspace-item-title{opacity:.72}.workspace-item-title{font-family:"Songti TC","Noto Serif TC","PMingLiU",serif;font-size:14px;font-weight:600;color:#5a5149}.workspace-item-meta{margin-top:4px;font-size:11px;color:#9a9087;line-height:1.55}.workspace-tag{display:inline-block;margin-left:6px;padding:3px 7px;border-radius:999px;background:rgba(255,255,255,.62);font-size:10px;color:#8a7d72}.workspace-empty{padding:25px 5px;text-align:center;color:#aaa096;font-size:12px;line-height:1.8}.workspace-pending{background:linear-gradient(145deg,rgba(255,253,249,.96),rgba(241,227,200,.24))}.workspace-pending .workspace-item{border-bottom-color:rgba(185,154,115,.13)}
      @media(max-width:900px){.workspace-head{align-items:flex-start;flex-direction:column}.workspace-note{display:none}.workspace-grid{grid-template-columns:1fr}.workspace-card{min-height:0}.dashboard-workspace{margin-top:16px}.workspace-item{padding:12px 1px}}
    `;
    document.head.appendChild(style);
  }

  function tFor(id){return (typeof travelers!=='undefined'?travelers:[]).find(t=>t.id===id)}
  function jFor(id){return (typeof journeys!=='undefined'?journeys:[]).find(j=>j.id===id)}

  function renderWorkspace(){
    ensureWorkspace();
    if(!$id('dashboardWorkspace')) return;
    const js=typeof journeys!=='undefined'?journeys:[];
    const ss=typeof sessions!=='undefined'?sessions:[];
    const rs=typeof records!=='undefined'?records:[];

    const active=js.filter(j=>j.status!=='completed').slice().sort((a,b)=>String(b.start_date||'').localeCompare(String(a.start_date||''))).slice(0,6);
    $id('workspaceActiveCount').textContent=active.length;
    $id('workspaceActive').innerHTML=active.length?active.map(j=>{const t=tFor(j.traveler_id);const count=ss.filter(s=>s.journey_id===j.id).length;return `<div class="workspace-item" data-ws-open="${j.traveler_id}"><div class="workspace-item-title">${escSafe(t?.name||'未知旅人')} · ${escSafe(jName(j.journey_type))}<span class="workspace-tag">${count} 次相遇</span></div><div class="workspace-item-meta">${fmtSafe(j.start_date)} 開始${j.note?` · ${escSafe(j.note)}`:''}</div></div>`}).join(''):`<div class="workspace-empty">目前沒有進行中的旅程。</div>`;

    const recent=ss.slice().sort((a,b)=>String(b.session_date||'').localeCompare(String(a.session_date||''))).slice(0,6);
    $id('workspaceRecentCount').textContent=recent.length;
    $id('workspaceRecent').innerHTML=recent.length?recent.map(s=>{const t=tFor(s.traveler_id),j=jFor(s.journey_id);return `<div class="workspace-item" data-ws-open="${s.traveler_id}"><div class="workspace-item-title">${escSafe(t?.name||'未知旅人')} · ${escSafe(j?jName(j.journey_type):'相遇')}</div><div class="workspace-item-meta">${fmtSafe(s.session_date)}${s.stage?` · ${escSafe(s.stage)}`:''}${s.insight?` · ${escSafe(String(s.insight).slice(0,36))}`:''}</div></div>`}).join(''):`<div class="workspace-empty">還沒有留下相遇紀錄。</div>`;

    const pending=[];
    js.forEach(j=>{
      const journeySessions=ss.filter(s=>s.journey_id===j.id);
      if(!journeySessions.length) return;
      const r=rs.find(x=>x.journey_id===j.id && x.record_type===j.journey_type);
      if(!r) pending.push({j,label:'尚未整理正式紀錄'});
      else if(r.status!=='confirmed') pending.push({j,label:'紀錄文案待確認'});
    });
    pending.sort((a,b)=>String(b.j.start_date||'').localeCompare(String(a.j.start_date||'')));
    $id('workspacePendingCount').textContent=pending.length;
    $id('workspacePending').innerHTML=pending.length?pending.slice(0,8).map(({j,label})=>{const t=tFor(j.traveler_id);const count=ss.filter(s=>s.journey_id===j.id).length;return `<div class="workspace-item" data-ws-open="${j.traveler_id}"><div class="workspace-item-title">${escSafe(t?.name||'未知旅人')} · ${escSafe(jName(j.journey_type))}</div><div class="workspace-item-meta">${escSafe(label)} · 已有 ${count} 次相遇</div></div>`}).join(''):`<div class="workspace-empty">目前沒有待整理的紀錄。<br>這裡很乾淨 ✦</div>`;

    document.querySelectorAll('[data-ws-open]').forEach(el=>el.onclick=()=>typeof openDetail==='function'&&openDetail(el.dataset.wsOpen));
  }

  document.addEventListener('DOMContentLoaded',()=>{
    ensureWorkspace();
    const original=renderAll;
    renderAll=function(){ original(); renderWorkspace(); };
    setTimeout(renderWorkspace,0);
  });
})();