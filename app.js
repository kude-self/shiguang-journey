const SUPABASE_URL = "https://tgfxrbghzzttqbpfwypw.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZtAF_kDvx1WGNM3RPIhxzA_nMjHQwyN";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let travelers = [];
let sessions = [];
let records = [];
let currentDetailId = null;

const $ = (id) => document.getElementById(id);
const esc = (s="") => String(s ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const fmt = (d) => d ? new Date(d + (d.length===10 ? "T00:00:00" : "")).toLocaleDateString("zh-TW") : "—";

function toast(msg){
  const t=$("toast"); t.textContent=msg; t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2200);
}
function today(){ return new Date().toISOString().slice(0,10); }

async function init(){
  const { data } = await sb.auth.getSession();
  if(data.session){ await enterApp(data.session.user); }
  else showAuth();

  sb.auth.onAuthStateChange(async (_event, session)=>{
    if(session?.user && session.user.id !== currentUser?.id) await enterApp(session.user);
    if(!session) showAuth();
  });
}
function showAuth(){
  currentUser=null;
  $("authPage").classList.remove("hidden");
  $("app").classList.add("hidden");
}
async function enterApp(user){
  currentUser=user;
  $("authPage").classList.add("hidden");
  $("app").classList.remove("hidden");
  $("userEmail").textContent=user.email || "";
  await loadAll();
}
async function loadAll(){
  const [t,s,r] = await Promise.all([
    sb.from("travelers").select("*").order("updated_at",{ascending:false}),
    sb.from("sessions").select("*").order("session_date",{ascending:false}),
    sb.from("records").select("*").order("updated_at",{ascending:false})
  ]);
  if(t.error) toast("旅人資料讀取失敗："+t.error.message);
  if(s.error) toast("相遇紀錄讀取失敗："+s.error.message);
  if(r.error) toast("拾光冊讀取失敗："+r.error.message);
  travelers=t.data||[]; sessions=s.data||[]; records=r.data||[];
  renderAll();
}
function travelerLabel(t){
  if(t.status==="completed") return "完成旅程";
  return t.journey_type || "初遇";
}
function travelerRow(t){
  return `<div class="traveler-row">
    <div class="row-main" data-open="${t.id}">
      <strong>${esc(t.name)}</strong>
      <div class="row-sub">${esc(t.concern||"尚未留下主題")} · ${fmt(t.first_meeting_date)}</div>
    </div>
    <span class="badge">${esc(travelerLabel(t))}</span>
    <div class="row-actions">
      <button class="small-btn" data-edit="${t.id}">編輯</button>
      <button class="small-btn" data-delete="${t.id}">刪除</button>
    </div>
  </div>`;
}
function renderAll(){
  $("statTotal").textContent=travelers.length;
  $("statMeet").textContent=travelers.filter(t=>t.status!=="completed" && t.journey_type==="初遇").length;
  $("statLight").textContent=travelers.filter(t=>t.status!=="completed" && t.journey_type==="拾光").length;
  $("statWalk").textContent=travelers.filter(t=>t.status!=="completed" && t.journey_type==="同行").length;

  $("recentTravelers").innerHTML=travelers.length ? travelers.slice(0,6).map(travelerRow).join("") : empty("還沒有旅人，從第一場相遇開始。");
  renderTravelerList();
  renderJourneys();
  renderSessions();
  renderRecords();
  bindRowEvents();
}
function empty(text){return `<div class="empty">${esc(text)}</div>`;}
function renderTravelerList(){
  const q=($("travelerSearch")?.value||"").trim().toLowerCase();
  const list=travelers.filter(t=>[t.name,t.concern,t.hope,t.private_note].some(v=>String(v||"").toLowerCase().includes(q)));
  $("travelerList").innerHTML=list.length?list.map(travelerRow).join(""):empty("找不到符合的旅人。");
}
function renderJourneys(){
  const groups={
    journeyMeet:travelers.filter(t=>t.status!=="completed"&&t.journey_type==="初遇"),
    journeyLight:travelers.filter(t=>t.status!=="completed"&&t.journey_type==="拾光"),
    journeyWalk:travelers.filter(t=>t.status!=="completed"&&t.journey_type==="同行"),
    journeyDone:travelers.filter(t=>t.status==="completed")
  };
  Object.entries(groups).forEach(([id,list])=>$(id).innerHTML=list.length?list.map(travelerRow).join(""):empty("目前沒有旅人"));
}
function renderSessions(){
  $("sessionList").innerHTML=sessions.length?sessions.map(s=>{
    const t=travelers.find(x=>x.id===s.traveler_id);
    return `<div class="session-card">
      <div class="section-head"><div><h4>${esc(t?.name||"未知旅人")}｜${esc(s.stage||"相遇紀錄")}</h4><div class="session-meta">${fmt(s.session_date)}</div></div>
      <div class="row-actions"><button class="small-btn" data-session-edit="${s.id}">編輯</button><button class="small-btn" data-session-delete="${s.id}">刪除</button></div></div>
      ${s.bring?`<p><b>這次帶來：</b>${esc(s.bring)}</p>`:""}
      ${s.insight?`<p><b>這次看見：</b>${esc(s.insight)}</p>`:""}
      ${s.important_quote?`<p><b>值得留下：</b>「${esc(s.important_quote)}」</p>`:""}
      ${s.picked_light?`<p><b>拾起的光：</b>${esc(s.picked_light)}</p>`:""}
    </div>`;
  }).join(""):empty("還沒有相遇紀錄。");
}
function renderRecords(){
  $("recordList").innerHTML=records.length?records.map(r=>{
    const t=travelers.find(x=>x.id===r.traveler_id);
    return `<div class="session-card">
      <div class="section-head"><div><h4>${esc(t?.name||"未知旅人")}｜${esc(r.record_type)}</h4><div class="session-meta">${r.status==="confirmed"?"已確認":"草稿"} · ${new Date(r.updated_at).toLocaleString("zh-TW")}</div></div>
      <div class="row-actions"><button class="small-btn" data-record-edit="${r.id}">編輯</button><button class="small-btn" data-record-delete="${r.id}">刪除</button></div></div>
      <p>${esc((r.confirmed_text||r.draft_text||"").slice(0,180))}${(r.confirmed_text||r.draft_text||"").length>180?"…":""}</p>
    </div>`;
  }).join(""):empty("還沒有保存的紀錄文案。");
}
function bindRowEvents(){
  document.querySelectorAll("[data-open]").forEach(el=>el.onclick=()=>openDetail(el.dataset.open));
  document.querySelectorAll("[data-edit]").forEach(el=>el.onclick=()=>openTraveler(el.dataset.edit));
  document.querySelectorAll("[data-delete]").forEach(el=>el.onclick=()=>deleteTraveler(el.dataset.delete));
  document.querySelectorAll("[data-session-edit]").forEach(el=>el.onclick=()=>openSession(el.dataset.sessionEdit));
  document.querySelectorAll("[data-session-delete]").forEach(el=>el.onclick=()=>deleteSession(el.dataset.sessionDelete));
  document.querySelectorAll("[data-record-edit]").forEach(el=>el.onclick=()=>openRecordEdit(el.dataset.recordEdit));
  document.querySelectorAll("[data-record-delete]").forEach(el=>el.onclick=()=>deleteRecord(el.dataset.recordDelete));
}
function setPage(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
  $(page+"Page").classList.remove("hidden");
  document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===page));
  const titles={dashboard:"拾光首頁",travelers:"旅人",journeys:"旅程",sessions:"相遇紀錄",records:"拾光冊"};
  $("pageTitle").textContent=titles[page]||"旅人";
  if(page!=="detail") currentDetailId=null;
}
function fillTravelerOptions(selectId, selected=""){
  $(selectId).innerHTML=travelers.map(t=>`<option value="${t.id}" ${t.id===selected?"selected":""}>${esc(t.name)}｜${esc(travelerLabel(t))}</option>`).join("");
}
function openTraveler(id=null){
  const t=travelers.find(x=>x.id===id);
  $("travelerDialogTitle").textContent=t?"編輯旅人":"新增旅人";
  $("travelerId").value=t?.id||"";
  $("travelerName").value=t?.name||"";
  $("journeyType").value=t?.journey_type||"初遇";
  $("firstMeetingDate").value=t?.first_meeting_date||today();
  $("travelerStatus").value=t?.status||"active";
  $("concern").value=t?.concern||"";
  $("hope").value=t?.hope||"";
  $("privateNote").value=t?.private_note||"";
  $("travelerDialog").showModal();
}
async function saveTraveler(e){
  e.preventDefault();
  const id=$("travelerId").value;
  const payload={
    name:$("travelerName").value.trim(),
    journey_type:$("journeyType").value,
    first_meeting_date:$("firstMeetingDate").value||null,
    status:$("travelerStatus").value,
    concern:$("concern").value.trim()||null,
    hope:$("hope").value.trim()||null,
    private_note:$("privateNote").value.trim()||null,
    updated_at:new Date().toISOString()
  };
  if(!payload.name) return toast("請先填旅人稱呼");
  const result=id ? await sb.from("travelers").update(payload).eq("id",id) : await sb.from("travelers").insert(payload);
  if(result.error) return toast("儲存失敗："+result.error.message);
  $("travelerDialog").close(); toast(id?"旅人資料已更新":"旅人已加入");
  await loadAll();
  if(currentDetailId===id) openDetail(id);
}
async function deleteTraveler(id){
  const t=travelers.find(x=>x.id===id);
  if(!confirm(`確定要刪除「${t?.name||"這位旅人"}」嗎？\n\n如果資料表有關聯限制，請先刪除該旅人的相遇紀錄與拾光冊紀錄。`)) return;
  const {error}=await sb.from("travelers").delete().eq("id",id);
  if(error) return toast("刪除失敗："+error.message);
  toast("旅人已刪除"); await loadAll();
}
function openSession(id=null, travelerId=""){
  const s=sessions.find(x=>x.id===id);
  $("sessionId").value=s?.id||"";
  fillTravelerOptions("sessionTraveler",s?.traveler_id||travelerId);
  $("sessionDate").value=s?.session_date||today();
  $("sessionStage").value=s?.stage||"";
  $("bring").value=s?.bring||"";
  $("insight").value=s?.insight||"";
  $("importantQuote").value=s?.important_quote||"";
  $("changeSeen").value=s?.change_seen||"";
  $("method").value=s?.method||"";
  $("leaveMessage").value=s?.leave_message||"";
  $("pickedLight").value=s?.picked_light||"";
  if(!travelers.length)return toast("請先新增一位旅人");
  $("sessionDialog").showModal();
}
async function saveSession(e){
  e.preventDefault();
  const id=$("sessionId").value;
  const payload={
    traveler_id:$("sessionTraveler").value,
    session_date:$("sessionDate").value,
    stage:$("sessionStage").value.trim()||null,
    bring:$("bring").value.trim()||null,
    insight:$("insight").value.trim()||null,
    important_quote:$("importantQuote").value.trim()||null,
    change_seen:$("changeSeen").value.trim()||null,
    method:$("method").value.trim()||null,
    leave_message:$("leaveMessage").value.trim()||null,
    picked_light:$("pickedLight").value.trim()||null,
    updated_at:new Date().toISOString()
  };
  const result=id?await sb.from("sessions").update(payload).eq("id",id):await sb.from("sessions").insert(payload);
  if(result.error)return toast("儲存失敗："+result.error.message);
  $("sessionDialog").close();toast(id?"相遇紀錄已更新":"相遇紀錄已保存");await loadAll();
  if(currentDetailId) openDetail(currentDetailId);
}
async function deleteSession(id){
  if(!confirm("確定刪除這筆相遇紀錄嗎？"))return;
  const {error}=await sb.from("sessions").delete().eq("id",id);
  if(error)return toast("刪除失敗："+error.message);
  toast("紀錄已刪除");await loadAll();if(currentDetailId)openDetail(currentDetailId);
}
function timelineFor(t){
  if(t.status==="completed")return ["第一次相遇","一路拾光","完成旅程"];
  if(t.journey_type==="初遇")return ["第一次相遇","初遇"];
  if(t.journey_type==="拾光")return ["初遇","拾光 1","拾光 2","拾光 3","拾光 4"];
  return ["初遇","拾光","同行 1","同行 2","同行 3","完成"];
}
function openDetail(id){
  const t=travelers.find(x=>x.id===id); if(!t)return;
  currentDetailId=id;
  const rs=sessions.filter(s=>s.traveler_id===id);
  $("travelerDetail").innerHTML=`<div class="card">
    <div class="detail-top"><div><div class="eyebrow">${esc(travelerLabel(t))}</div><h3>${esc(t.name)}</h3><div class="muted">第一次相遇：${fmt(t.first_meeting_date)}</div></div>
    <div class="row-actions"><button class="ghost" id="detailEdit">編輯旅人</button><button class="primary" id="detailAddSession">＋ 記下這次相遇</button></div></div>
    <div class="timeline">${timelineFor(t).map(x=>`<span class="step">${esc(x)}</span>`).join("")}</div>
    <div class="detail-grid">
      <div class="detail-block"><span>此刻最想整理</span><p>${esc(t.concern||"尚未填寫")}</p></div>
      <div class="detail-block"><span>希望在旅程裡看見</span><p>${esc(t.hope||"尚未填寫")}</p></div>
      <div class="detail-block" style="grid-column:1/-1"><span>只給自己的備註</span><p>${esc(t.private_note||"—")}</p></div>
    </div>
    <div class="section-head" style="margin-top:24px"><h3>一路留下的相遇</h3></div>
    <div>${rs.length?rs.map(s=>`<div class="session-card">
      <div class="section-head"><div><h4>${esc(s.stage||"相遇紀錄")}</h4><div class="session-meta">${fmt(s.session_date)}</div></div><button class="small-btn" data-detail-session="${s.id}">編輯</button></div>
      ${s.bring?`<p><b>帶來：</b>${esc(s.bring)}</p>`:""}
      ${s.insight?`<p><b>看見：</b>${esc(s.insight)}</p>`:""}
      ${s.important_quote?`<p><b>留下：</b>「${esc(s.important_quote)}」</p>`:""}
      ${s.change_seen?`<p><b>改變：</b>${esc(s.change_seen)}</p>`:""}
      ${s.leave_message?`<p><b>留給旅人的話：</b>${esc(s.leave_message)}</p>`:""}
      ${s.picked_light?`<p><b>拾起的光：</b>${esc(s.picked_light)}</p>`:""}
    </div>`).join(""):empty("這位旅人還沒有相遇紀錄。")}</div>
  </div>`;
  document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
  $("detailPage").classList.remove("hidden"); $("pageTitle").textContent="旅人旅程";
  $("detailEdit").onclick=()=>openTraveler(id);
  $("detailAddSession").onclick=()=>openSession(null,id);
  document.querySelectorAll("[data-detail-session]").forEach(b=>b.onclick=()=>openSession(b.dataset.detailSession));
}
function buildDraft(type,t){
  const rs=sessions.filter(s=>s.traveler_id===t.id).sort((a,b)=>String(a.session_date).localeCompare(String(b.session_date)));
  const seen=rs.map(s=>s.insight).filter(Boolean).join("\n");
  const quotes=rs.map(s=>s.important_quote).filter(Boolean).map(q=>`「${q}」`).join("\n");
  const light=rs.map(s=>s.picked_light).filter(Boolean).join("\n");
  if(type==="初遇") return `𓇼 初遇｜《初遇紀錄》\n\n一場相遇，留下第一次看見。\n\n旅人｜${t.name}\n此刻帶來｜${t.concern||"待整理"}\n\n這次看見｜\n${seen||"待整理"}\n\n想留下的一句話｜\n${quotes||"待整理"}\n\n這次拾起的光｜\n${light||"待整理"}`;
  if(type==="拾光") return `𓇼 拾光｜《拾光紀錄》\n\n四週整理，把一路看見的自己留下來。\n\n旅人｜${t.name}\n一路看見｜\n${seen||"待整理"}\n\n旅人留下的話｜\n${quotes||"待整理"}\n\n一路拾起的光｜\n${light||"待整理"}\n\n※ 這是系統依現有相遇紀錄整理出的草稿，請確認文案後再作為正式版。`;
  return `𓇼 同行｜《旅程紀錄》\n\n三個月，把真正發生在生活裡的改變留下來。\n\n旅人｜${t.name}\n一路看見｜\n${seen||"待整理"}\n\n真正發生的改變｜\n${rs.map(s=>s.change_seen).filter(Boolean).join("\n")||"待整理"}\n\n旅人留下的話｜\n${quotes||"待整理"}\n\n旅程裡拾起的光｜\n${light||"待整理"}\n\n※ 這是系統依現有相遇紀錄整理出的草稿，請確認文案後再作為正式版。`;
}
function openRecord(type){
  if(!travelers.length)return toast("請先新增旅人");
  $("recordId").value="";
  $("recordType").value=type;
  $("recordDialogTitle").textContent=`${type}｜整理紀錄文案`;
  fillTravelerOptions("recordTraveler");
  $("draftText").value=buildDraft(type,travelers[0]);
  $("confirmedText").value="";
  $("recordStatus").value="draft";
  $("recordDialog").showModal();
}
function openRecordEdit(id){
  const r=records.find(x=>x.id===id);if(!r)return;
  $("recordId").value=r.id;$("recordType").value=r.record_type;
  $("recordDialogTitle").textContent=`${r.record_type}｜編輯紀錄文案`;
  fillTravelerOptions("recordTraveler",r.traveler_id);
  $("draftText").value=r.draft_text||"";$("confirmedText").value=r.confirmed_text||"";
  $("recordStatus").value=r.status||"draft";$("recordDialog").showModal();
}
async function saveRecord(e){
  e.preventDefault();
  const id=$("recordId").value;
  const status=$("recordStatus").value;
  const payload={
    traveler_id:$("recordTraveler").value,
    record_type:$("recordType").value,
    draft_text:$("draftText").value,
    confirmed_text:$("confirmedText").value||null,
    status,
    confirmed_at:status==="confirmed"?new Date().toISOString():null,
    updated_at:new Date().toISOString()
  };
  const result=id?await sb.from("records").update(payload).eq("id",id):await sb.from("records").insert(payload);
  if(result.error)return toast("保存失敗："+result.error.message);
  $("recordDialog").close();toast("紀錄文案已保存");await loadAll();
}
async function deleteRecord(id){
  if(!confirm("確定刪除這份紀錄文案嗎？"))return;
  const {error}=await sb.from("records").delete().eq("id",id);
  if(error)return toast("刪除失敗："+error.message);
  toast("文案已刪除");await loadAll();
}
function exportBackup(){
  const blob=new Blob([JSON.stringify({exported_at:new Date().toISOString(),travelers,sessions,records},null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`shiguang-backup-${today()}.json`;a.click();URL.revokeObjectURL(a.href);
}

$("signInBtn").onclick=async()=>{const {error}=await sb.auth.signInWithPassword({email:$("authEmail").value.trim(),password:$("authPassword").value});if(error)toast(error.message);};
$("signUpBtn").onclick=async()=>{const {data,error}=await sb.auth.signUp({email:$("authEmail").value.trim(),password:$("authPassword").value});if(error)toast(error.message);else toast(data.session?"帳號建立完成":"帳號已建立，請依信箱驗證設定完成登入");};
$("signOutBtn").onclick=()=>sb.auth.signOut();
$("newTravelerBtn").onclick=()=>openTraveler();
$("newSessionBtn").onclick=()=>openSession();
$("exportBtn").onclick=exportBackup;
$("travelerSearch").oninput=()=>{renderTravelerList();bindRowEvents();};
$("travelerForm").onsubmit=saveTraveler;
$("sessionForm").onsubmit=saveSession;
$("recordForm").onsubmit=saveRecord;
$("backBtn").onclick=()=>setPage("travelers");
document.querySelectorAll(".nav").forEach(n=>n.onclick=()=>setPage(n.dataset.page));
document.querySelectorAll(".close-dialog").forEach(b=>b.onclick=()=>$("travelerDialog").close());
document.querySelectorAll(".close-session").forEach(b=>b.onclick=()=>$("sessionDialog").close());
document.querySelectorAll(".close-record").forEach(b=>b.onclick=()=>$("recordDialog").close());
document.querySelectorAll(".make-record").forEach(b=>b.onclick=()=>openRecord(b.dataset.type));
$("recordTraveler").onchange=()=>{const t=travelers.find(x=>x.id===$("recordTraveler").value);if(t&&!$("recordId").value)$("draftText").value=buildDraft($("recordType").value,t);};

init();