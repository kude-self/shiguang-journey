const SUPABASE_URL = "https://tgfxrbghzzttqbpfwypw.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZtAF_kDvx1WGNM3RPIhxzA_nMjHQwyN";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let travelers = [];
let journeys = [];
let sessions = [];
let records = [];
let currentDetailId = null;

const $ = id => document.getElementById(id);
const esc = (s="") => String(s ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const fmt = d => d ? new Date(d + (String(d).length===10 ? "T00:00:00" : "")).toLocaleDateString("zh-TW") : "—";
const today = () => new Date().toISOString().slice(0,10);

function toast(msg){ const t=$("toast"); if(!t) return; t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),2200); }
function empty(text){ return `<div class="empty">${esc(text)}</div>`; }
function journeyName(type){ return type==="初遇"?"初遇":type==="拾光"?"拾光｜四週":"同行｜三個月"; }
function journeyTagline(type){ return type==="初遇"?"一場相遇，留下第一次看見。":type==="拾光"?"四週整理，把一路看見的自己留下來。":"三個月，把真正發生在生活裡的改變留下來。"; }
function travelerJourneyCount(id){ return journeys.filter(j=>j.traveler_id===id).length; }
function journeyFor(id){ return journeys.find(j=>j.id===id); }
function travelerFor(id){ return travelers.find(t=>t.id===id); }

function enhanceUI(){
  // 新增旅人只保留基本資料，不再讓旅人在建立時被綁定旅程。
  ["journeyType","travelerStatus"].forEach(id=>{ const el=$(id); if(el?.closest("label")) el.closest("label").style.display="none"; });
  if($("travelerDialogTitle")) $("travelerDialogTitle").textContent="新增旅人資料";

  // 旅程頁新增固定的「開始旅程」入口。
  const jp=$("journeysPage");
  if(jp && !$("newJourneyBtn")){
    const head=document.createElement("div");
    head.className="section-head";
    head.style.marginBottom="16px";
    head.innerHTML=`<div><div class="eyebrow">JOURNEY</div><h3 style="margin:4px 0 0">旅程管理</h3></div><button class="primary" id="newJourneyBtn">＋ 開始新旅程</button>`;
    jp.prepend(head);
  }

  // 新增旅程 Dialog。
  if(!$("journeyDialog")){
    const d=document.createElement("dialog");
    d.id="journeyDialog";
    d.innerHTML=`<form method="dialog" class="dialog-card" id="journeyForm">
      <div class="dialog-head"><div><div class="eyebrow">JOURNEY</div><h3 id="journeyDialogTitle">開始新旅程</h3></div><button type="button" class="icon-btn close-journey">×</button></div>
      <input type="hidden" id="journeyId">
      <div class="form-grid">
        <label>旅人<select id="journeyTraveler" required></select></label>
        <label>旅程<select id="journeySelect" required><option value="初遇">初遇</option><option value="拾光">拾光｜四週</option><option value="同行">同行｜三個月</option></select></label>
        <label>開始日期<input id="journeyStartDate" type="date" required></label>
        <label>旅程狀態<select id="journeyStatus"><option value="active">進行中</option><option value="completed">已完成</option></select></label>
        <label class="full">這段旅程想留下的備註<textarea id="journeyNote" placeholder="可留空"></textarea></label>
      </div>
      <div class="dialog-actions"><button type="button" class="ghost close-journey">取消</button><button class="primary" value="default">儲存旅程</button></div>
    </form>`;
    document.body.appendChild(d);
  }

  // 相遇紀錄：在旅人後面加入「所屬旅程」。
  const st=$("sessionTraveler")?.closest("label");
  if(st && !$("sessionJourney")){
    const label=document.createElement("label");
    label.innerHTML=`所屬旅程<select id="sessionJourney" required></select>`;
    st.insertAdjacentElement("afterend",label);
  }

  // 拾光冊：加入旅程選擇，避免同一位旅人有多段相同類型旅程時混在一起。
  const rt=$("recordTraveler")?.closest("label");
  if(rt && !$("recordJourney")){
    const label=document.createElement("label");
    label.innerHTML=`所屬旅程<select id="recordJourney"></select>`;
    rt.insertAdjacentElement("afterend",label);
  }

  bindStaticEvents();
}

const sessionPrompts={
  初遇:{
    stage:["這次想談的主題","例如：關係、工作、迷惘、選擇"],
    bring:"目前最明顯的情緒／狀態",
    insight:"這次看見了什麼？",
    importantQuote:"旅人說過、值得留下的一句話",
    changeSeen:"此刻最在意的是什麼？",
    method:"脈輪／能量覺察",
    leaveMessage:"想留給旅人的話",
    pickedLight:"這次拾起的光"
  },
  拾光:{
    stage:["旅程週次","例如：Week 1、Week 2"],
    bring:"這週發生了什麼？／情緒與事件回顧",
    insight:"這週看見了什麼？",
    importantQuote:"這週值得留下的一句話",
    changeSeen:"反覆出現的模式／卡點",
    method:"脈輪／能量變化",
    leaveMessage:"這週的練習／微行動",
    pickedLight:"下一週想帶著什麼繼續走？"
  },
  同行:{
    stage:["旅程節點","例如：第 1 次、第 2 次"],
    bring:"近期真實生活中的改變",
    insight:"這次看見了什麼？",
    importantQuote:"值得留下的一句話",
    changeSeen:"關係／界線／選擇，或反覆卡住的地方",
    method:"身體訊號與步伐",
    leaveMessage:"這次做出的新選擇／落地行動",
    pickedLight:"接下來想持續練習的方向"
  }
};

function setLabelFor(id,text){ const el=$(id); const label=el?.closest("label"); if(!label) return; const nodes=[...label.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE); if(nodes[0]) nodes[0].textContent=text; else label.prepend(document.createTextNode(text)); }
function applySessionPrompts(type){
  const p=sessionPrompts[type]||sessionPrompts.初遇;
  setLabelFor("sessionStage",p.stage[0]); $("sessionStage").placeholder=p.stage[1];
  setLabelFor("bring",p.bring); setLabelFor("insight",p.insight); setLabelFor("importantQuote",p.importantQuote);
  setLabelFor("changeSeen",p.changeSeen); setLabelFor("method",p.method); setLabelFor("leaveMessage",p.leaveMessage); setLabelFor("pickedLight",p.pickedLight);
  const title=$("sessionDialog")?.querySelector(".dialog-head h3"); if(title) title.textContent=`新增${journeyName(type)}紀錄`;
}

async function init(){
  enhanceUI();
  const {data}=await sb.auth.getSession();
  if(data.session) await enterApp(data.session.user); else showAuth();
  sb.auth.onAuthStateChange(async(_event,session)=>{
    if(session?.user && session.user.id!==currentUser?.id) await enterApp(session.user);
    if(!session) showAuth();
  });
}
function showAuth(){ currentUser=null; $("authPage").classList.remove("hidden"); $("app").classList.add("hidden"); }
async function enterApp(user){ currentUser=user; $("authPage").classList.add("hidden"); $("app").classList.remove("hidden"); $("userEmail").textContent=user.email||""; await loadAll(); }
async function loadAll(){
  const [t,j,s,r]=await Promise.all([
    sb.from("travelers").select("*").order("updated_at",{ascending:false}),
    sb.from("journeys").select("*").order("start_date",{ascending:false}),
    sb.from("sessions").select("*").order("session_date",{ascending:false}),
    sb.from("records").select("*").order("updated_at",{ascending:false})
  ]);
  if(t.error) toast("旅人資料讀取失敗："+t.error.message);
  if(j.error) toast("旅程資料讀取失敗："+j.error.message);
  if(s.error) toast("相遇紀錄讀取失敗："+s.error.message);
  if(r.error) toast("拾光冊讀取失敗："+r.error.message);
  travelers=t.data||[]; journeys=j.data||[]; sessions=s.data||[]; records=r.data||[];
  renderAll();
}

function travelerRow(t){
  const count=travelerJourneyCount(t.id);
  return `<div class="traveler-row">
    <div class="row-main" data-open="${t.id}"><strong>${esc(t.name)}</strong><div class="row-sub">${esc(t.concern||"尚未留下主題")} · ${fmt(t.first_meeting_date)}</div></div>
    <span class="badge">${count?`${count} 段旅程`:"尚未開始旅程"}</span>
    <div class="row-actions"><button class="small-btn" data-edit="${t.id}">編輯</button><button class="small-btn" data-delete="${t.id}">刪除</button></div>
  </div>`;
}
function journeyRow(j){
  const t=travelerFor(j.traveler_id);
  return `<div class="traveler-row">
    <div class="row-main" data-open="${j.traveler_id}"><strong>${esc(t?.name||"未知旅人")}｜${esc(journeyName(j.journey_type))}</strong><div class="row-sub">${fmt(j.start_date)}${j.note?` · ${esc(j.note)}`:""}</div></div>
    <span class="badge">${j.status==="completed"?"已完成":"進行中"}</span>
    <div class="row-actions"><button class="small-btn" data-journey-session="${j.id}">＋紀錄</button><button class="small-btn" data-journey-edit="${j.id}">編輯</button></div>
  </div>`;
}
function renderAll(){
  $("statTotal").textContent=travelers.length;
  $("statMeet").textContent=journeys.filter(j=>j.journey_type==="初遇").length;
  $("statLight").textContent=journeys.filter(j=>j.status!=="completed"&&j.journey_type==="拾光").length;
  $("statWalk").textContent=journeys.filter(j=>j.status!=="completed"&&j.journey_type==="同行").length;
  $("recentTravelers").innerHTML=travelers.length?travelers.slice(0,6).map(travelerRow).join(""):empty("還沒有旅人，從第一場相遇開始。");
  renderTravelerList(); renderJourneys(); renderSessions(); renderRecords(); bindDynamicEvents();
}
function renderTravelerList(){
  const q=($("travelerSearch")?.value||"").trim().toLowerCase();
  const list=travelers.filter(t=>[t.name,t.concern,t.hope,t.private_note].some(v=>String(v||"").toLowerCase().includes(q)));
  $("travelerList").innerHTML=list.length?list.map(travelerRow).join(""):empty("找不到符合的旅人。");
}
function renderJourneys(){
  const groups={
    journeyMeet:journeys.filter(j=>j.status!=="completed"&&j.journey_type==="初遇"),
    journeyLight:journeys.filter(j=>j.status!=="completed"&&j.journey_type==="拾光"),
    journeyWalk:journeys.filter(j=>j.status!=="completed"&&j.journey_type==="同行"),
    journeyDone:journeys.filter(j=>j.status==="completed")
  };
  Object.entries(groups).forEach(([id,list])=>$(id).innerHTML=list.length?list.map(journeyRow).join(""):empty("目前沒有旅程"));
}
function renderSessions(){
  $("sessionList").innerHTML=sessions.length?sessions.map(s=>{
    const t=travelerFor(s.traveler_id), j=journeyFor(s.journey_id);
    return `<div class="session-card"><div class="section-head"><div><h4>${esc(t?.name||"未知旅人")}｜${esc(j?journeyName(j.journey_type):"相遇紀錄")}${s.stage?` · ${esc(s.stage)}`:""}</h4><div class="session-meta">${fmt(s.session_date)}</div></div><div class="row-actions"><button class="small-btn" data-session-edit="${s.id}">編輯</button><button class="small-btn" data-session-delete="${s.id}">刪除</button></div></div>${s.bring?`<p><b>${esc((sessionPrompts[j?.journey_type]||sessionPrompts.初遇).bring)}：</b>${esc(s.bring)}</p>`:""}${s.insight?`<p><b>看見：</b>${esc(s.insight)}</p>`:""}${s.picked_light?`<p><b>留下：</b>${esc(s.picked_light)}</p>`:""}</div>`;
  }).join(""):empty("還沒有相遇紀錄。");
}
function renderRecords(){
  $("recordList").innerHTML=records.length?records.map(r=>{
    const t=travelerFor(r.traveler_id), j=journeyFor(r.journey_id);
    return `<div class="session-card"><div class="section-head"><div><h4>${esc(t?.name||"未知旅人")}｜${esc(r.record_type)}${j?` · ${fmt(j.start_date)}`:""}</h4><div class="session-meta">${r.status==="confirmed"?"已確認":"草稿"} · ${new Date(r.updated_at).toLocaleString("zh-TW")}</div></div><div class="row-actions"><button class="small-btn" data-record-edit="${r.id}">編輯</button><button class="small-btn" data-record-delete="${r.id}">刪除</button></div></div><p>${esc((r.confirmed_text||r.draft_text||"").slice(0,180))}${(r.confirmed_text||r.draft_text||"").length>180?"…":""}</p></div>`;
  }).join(""):empty("還沒有保存的紀錄文案。");
}

function setPage(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden")); $(page+"Page").classList.remove("hidden");
  document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===page));
  $("pageTitle").textContent=({dashboard:"拾光首頁",travelers:"旅人",journeys:"旅程",sessions:"相遇紀錄",records:"拾光冊"})[page]||"旅人";
  if(page!=="detail") currentDetailId=null;
}
function fillTravelerOptions(id,selected=""){ $(id).innerHTML=travelers.map(t=>`<option value="${t.id}" ${t.id===selected?"selected":""}>${esc(t.name)}</option>`).join(""); }
function fillJourneyOptions(id,travelerId,selected="",typeFilter=""){
  const list=journeys.filter(j=>j.traveler_id===travelerId && (!typeFilter||j.journey_type===typeFilter));
  $(id).innerHTML=list.length?list.map(j=>`<option value="${j.id}" ${j.id===selected?"selected":""}>${esc(journeyName(j.journey_type))} · ${fmt(j.start_date)}${j.status==="completed"?"（已完成）":""}</option>`).join(""):`<option value="">尚未建立旅程</option>`;
}

function openTraveler(id=null){
  const t=travelerFor(id); $("travelerDialogTitle").textContent=t?"編輯旅人資料":"新增旅人資料"; $("travelerId").value=t?.id||""; $("travelerName").value=t?.name||""; $("firstMeetingDate").value=t?.first_meeting_date||today(); $("concern").value=t?.concern||""; $("hope").value=t?.hope||""; $("privateNote").value=t?.private_note||""; $("journeyType").value="初遇"; $("travelerStatus").value="active"; $("travelerDialog").showModal();
}
async function saveTraveler(e){
  e.preventDefault(); const id=$("travelerId").value; const payload={name:$("travelerName").value.trim(),first_meeting_date:$("firstMeetingDate").value||null,concern:$("concern").value.trim()||null,hope:$("hope").value.trim()||null,private_note:$("privateNote").value.trim()||null,journey_type:"初遇",status:"active",updated_at:new Date().toISOString()};
  if(!payload.name)return toast("請先填旅人稱呼"); const result=id?await sb.from("travelers").update(payload).eq("id",id):await sb.from("travelers").insert(payload); if(result.error)return toast("儲存失敗："+result.error.message); $("travelerDialog").close(); toast(id?"旅人資料已更新":"旅人已加入"); await loadAll();
}
async function deleteTraveler(id){ const t=travelerFor(id); if(!confirm(`確定刪除「${t?.name||"這位旅人"}」嗎？\n此旅人的旅程也會一併刪除。`))return; const {error}=await sb.from("travelers").delete().eq("id",id); if(error)return toast("刪除失敗："+error.message); toast("旅人已刪除"); await loadAll(); }

function openJourney(id=null,travelerId=""){
  if(!travelers.length)return toast("請先新增旅人"); const j=journeyFor(id); $("journeyDialogTitle").textContent=j?"編輯旅程":"開始新旅程"; $("journeyId").value=j?.id||""; fillTravelerOptions("journeyTraveler",j?.traveler_id||travelerId||travelers[0].id); $("journeySelect").value=j?.journey_type||"初遇"; $("journeyStartDate").value=j?.start_date||today(); $("journeyStatus").value=j?.status||"active"; $("journeyNote").value=j?.note||""; $("journeyDialog").showModal();
}
async function saveJourney(e){
  e.preventDefault(); const id=$("journeyId").value; const payload={traveler_id:$("journeyTraveler").value,journey_type:$("journeySelect").value,start_date:$("journeyStartDate").value,status:$("journeyStatus").value,note:$("journeyNote").value.trim()||null,updated_at:new Date().toISOString()};
  const result=id?await sb.from("journeys").update(payload).eq("id",id):await sb.from("journeys").insert(payload); if(result.error)return toast("旅程儲存失敗："+result.error.message); $("journeyDialog").close(); toast(id?"旅程已更新":"新旅程已開始"); await loadAll();
}

function openSession(id=null,travelerId="",journeyId=""){
  if(!travelers.length)return toast("請先新增旅人"); const s=sessions.find(x=>x.id===id); const tid=s?.traveler_id||travelerId||travelers[0].id; fillTravelerOptions("sessionTraveler",tid); const sid=s?.journey_id||journeyId||journeys.find(j=>j.traveler_id===tid)?.id||""; fillJourneyOptions("sessionJourney",tid,sid); const j=journeyFor(sid); applySessionPrompts(j?.journey_type||"初遇"); $("sessionId").value=s?.id||""; $("sessionDate").value=s?.session_date||today(); $("sessionStage").value=s?.stage||""; $("bring").value=s?.bring||""; $("insight").value=s?.insight||""; $("importantQuote").value=s?.important_quote||""; $("changeSeen").value=s?.change_seen||""; $("method").value=s?.method||""; $("leaveMessage").value=s?.leave_message||""; $("pickedLight").value=s?.picked_light||""; $("sessionDialog").showModal();
}
async function saveSession(e){
  e.preventDefault(); const id=$("sessionId").value; const jid=$("sessionJourney").value; const j=journeyFor(jid); if(!jid||!j)return toast("請先替這位旅人建立旅程"); const payload={traveler_id:$("sessionTraveler").value,journey_id:jid,session_date:$("sessionDate").value,stage:$("sessionStage").value.trim()||null,bring:$("bring").value.trim()||null,insight:$("insight").value.trim()||null,important_quote:$("importantQuote").value.trim()||null,change_seen:$("changeSeen").value.trim()||null,method:$("method").value.trim()||null,leave_message:$("leaveMessage").value.trim()||null,picked_light:$("pickedLight").value.trim()||null,updated_at:new Date().toISOString()}; const result=id?await sb.from("sessions").update(payload).eq("id",id):await sb.from("sessions").insert(payload); if(result.error)return toast("儲存失敗："+result.error.message); $("sessionDialog").close(); toast(id?"相遇紀錄已更新":"相遇紀錄已保存"); await loadAll();
}
async function deleteSession(id){ if(!confirm("確定刪除這筆相遇紀錄嗎？"))return; const {error}=await sb.from("sessions").delete().eq("id",id); if(error)return toast("刪除失敗："+error.message); toast("紀錄已刪除"); await loadAll(); }

function openDetail(id){
  const t=travelerFor(id); if(!t)return; currentDetailId=id; const js=journeys.filter(j=>j.traveler_id===id); const ss=sessions.filter(s=>s.traveler_id===id);
  $("travelerDetail").innerHTML=`<div class="card"><div class="detail-top"><div><div class="eyebrow">TRAVELER</div><h3>${esc(t.name)}</h3><div class="muted">第一次相遇 ${fmt(t.first_meeting_date)}</div></div><div class="row-actions"><button class="small-btn" data-detail-journey="${t.id}">＋開始旅程</button><button class="small-btn" data-edit="${t.id}">編輯旅人</button></div></div><div class="detail-grid"><div class="detail-block"><span>此刻想整理</span><p>${esc(t.concern||"—")}</p></div><div class="detail-block"><span>希望看見</span><p>${esc(t.hope||"—")}</p></div><div class="detail-block"><span>私人備註</span><p>${esc(t.private_note||"—")}</p></div><div class="detail-block"><span>旅程數</span><p>${js.length} 段</p></div></div></div><div class="card" style="margin-top:16px"><div class="section-head"><h3>這位旅人的旅程</h3></div>${js.length?js.map(journeyRow).join(""):empty("尚未開始任何旅程。")}</div><div class="card" style="margin-top:16px"><div class="section-head"><h3>相遇紀錄</h3></div>${ss.length?ss.map(s=>{const j=journeyFor(s.journey_id);return `<div class="session-card"><h4>${esc(j?journeyName(j.journey_type):"相遇紀錄")} ${s.stage?`· ${esc(s.stage)}`:""}</h4><div class="session-meta">${fmt(s.session_date)}</div>${s.insight?`<p>${esc(s.insight)}</p>`:""}</div>`}).join(""):empty("還沒有相遇紀錄。")}</div>`;
  setPage("detail"); bindDynamicEvents();
}

function openRecord(type){
  if(!travelers.length)return toast("請先新增旅人"); $("recordId").value=""; $("recordType").value=type; $("recordDialogTitle").textContent=`整理${journeyName(type)}紀錄文案`; fillTravelerOptions("recordTraveler",travelers[0].id); fillJourneyOptions("recordJourney",travelers[0].id,"",type); $("draftText").value=""; $("confirmedText").value=""; $("recordStatus").value="draft"; $("recordDialog").showModal();
}
function openRecordEdit(id){ const r=records.find(x=>x.id===id); if(!r)return; $("recordId").value=r.id; $("recordType").value=r.record_type; $("recordDialogTitle").textContent=`編輯${journeyName(r.record_type)}紀錄文案`; fillTravelerOptions("recordTraveler",r.traveler_id); fillJourneyOptions("recordJourney",r.traveler_id,r.journey_id||"",r.record_type); $("draftText").value=r.draft_text||""; $("confirmedText").value=r.confirmed_text||""; $("recordStatus").value=r.status||"draft"; $("recordDialog").showModal(); }
async function saveRecord(e){ e.preventDefault(); const id=$("recordId").value; const payload={traveler_id:$("recordTraveler").value,journey_id:$("recordJourney").value||null,record_type:$("recordType").value,draft_text:$("draftText").value.trim()||null,confirmed_text:$("confirmedText").value.trim()||null,status:$("recordStatus").value,confirmed_at:$("recordStatus").value==="confirmed"?new Date().toISOString():null,updated_at:new Date().toISOString()}; const result=id?await sb.from("records").update(payload).eq("id",id):await sb.from("records").insert(payload); if(result.error)return toast("保存失敗："+result.error.message); $("recordDialog").close(); toast("紀錄文案已保存"); await loadAll(); }
async function deleteRecord(id){ if(!confirm("確定刪除這份紀錄文案嗎？"))return; const {error}=await sb.from("records").delete().eq("id",id); if(error)return toast("刪除失敗："+error.message); toast("紀錄文案已刪除"); await loadAll(); }

async function exportBackup(){ const data={exported_at:new Date().toISOString(),travelers,journeys,sessions,records}; const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`shiguang-backup-${today()}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); toast("資料備份已匯出"); }

function bindStaticEvents(){
  document.querySelectorAll(".nav").forEach(n=>n.onclick=()=>setPage(n.dataset.page));
  $("newTravelerBtn").onclick=()=>openTraveler(); $("newSessionBtn").onclick=()=>openSession(); $("exportBtn").onclick=exportBackup; $("backBtn").onclick=()=>setPage("travelers");
  $("travelerSearch").oninput=renderTravelerList;
  $("travelerForm").onsubmit=saveTraveler; $("sessionForm").onsubmit=saveSession; $("recordForm").onsubmit=saveRecord; $("journeyForm").onsubmit=saveJourney;
  document.querySelectorAll(".close-dialog").forEach(b=>b.onclick=()=>$("travelerDialog").close()); document.querySelectorAll(".close-session").forEach(b=>b.onclick=()=>$("sessionDialog").close()); document.querySelectorAll(".close-record").forEach(b=>b.onclick=()=>$("recordDialog").close()); document.querySelectorAll(".close-journey").forEach(b=>b.onclick=()=>$("journeyDialog").close());
  $("newJourneyBtn").onclick=()=>openJourney();
  $("sessionTraveler").onchange=()=>{ const tid=$("sessionTraveler").value; fillJourneyOptions("sessionJourney",tid); const j=journeyFor($("sessionJourney").value); applySessionPrompts(j?.journey_type||"初遇"); };
  $("sessionJourney").onchange=()=>{ const j=journeyFor($("sessionJourney").value); applySessionPrompts(j?.journey_type||"初遇"); };
  $("recordTraveler").onchange=()=>fillJourneyOptions("recordJourney",$("recordTraveler").value,"",$("recordType").value);
  document.querySelectorAll(".make-record").forEach(b=>b.onclick=()=>openRecord(b.dataset.type));
  $("signInBtn").onclick=async()=>{ const email=$("authEmail").value.trim(),password=$("authPassword").value; const {error}=await sb.auth.signInWithPassword({email,password}); if(error)toast("登入失敗："+error.message); };
  $("signUpBtn").onclick=async()=>{ const email=$("authEmail").value.trim(),password=$("authPassword").value; const {error}=await sb.auth.signUp({email,password}); if(error)toast("建立帳號失敗："+error.message); else toast("帳號已建立，請確認信箱或直接登入"); };
  $("signOutBtn").onclick=()=>sb.auth.signOut();
}
function bindDynamicEvents(){
  document.querySelectorAll("[data-open]").forEach(el=>el.onclick=()=>openDetail(el.dataset.open)); document.querySelectorAll("[data-edit]").forEach(el=>el.onclick=()=>openTraveler(el.dataset.edit)); document.querySelectorAll("[data-delete]").forEach(el=>el.onclick=()=>deleteTraveler(el.dataset.delete));
  document.querySelectorAll("[data-journey-edit]").forEach(el=>el.onclick=()=>openJourney(el.dataset.journeyEdit)); document.querySelectorAll("[data-journey-session]").forEach(el=>el.onclick=()=>{const j=journeyFor(el.dataset.journeySession);openSession(null,j?.traveler_id||"",j?.id||"")}); document.querySelectorAll("[data-detail-journey]").forEach(el=>el.onclick=()=>openJourney(null,el.dataset.detailJourney));
  document.querySelectorAll("[data-session-edit]").forEach(el=>el.onclick=()=>openSession(el.dataset.sessionEdit)); document.querySelectorAll("[data-session-delete]").forEach(el=>el.onclick=()=>deleteSession(el.dataset.sessionDelete)); document.querySelectorAll("[data-record-edit]").forEach(el=>el.onclick=()=>openRecordEdit(el.dataset.recordEdit)); document.querySelectorAll("[data-record-delete]").forEach(el=>el.onclick=()=>deleteRecord(el.dataset.recordDelete));
}

document.addEventListener("DOMContentLoaded",init);
