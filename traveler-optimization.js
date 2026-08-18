(() => {
  // 旅人本身只保存基本資料；旅程與狀態屬於 journeys，不再留在旅人表單。
  ["journeyType","travelerStatus"].forEach(id => {
    const el = document.getElementById(id);
    const label = el?.closest("label");
    if (label) label.remove();
  });

  const originalSaveJourney = saveJourney;
  const originalSaveSession = saveSession;
  const originalSaveRecord = saveRecord;

  openTraveler = function(id = null){
    const t = travelerFor(id);
    $("travelerDialogTitle").textContent = t ? "編輯旅人資料" : "新增旅人資料";
    $("travelerId").value = t?.id || "";
    $("travelerName").value = t?.name || "";
    $("firstMeetingDate").value = t?.first_meeting_date || today();
    $("concern").value = t?.concern || "";
    $("hope").value = t?.hope || "";
    $("privateNote").value = t?.private_note || "";
    $("travelerDialog").showModal();
  };

  saveTraveler = async function(e){
    e.preventDefault();
    const id = $("travelerId").value;
    const payload = {
      name: $("travelerName").value.trim(),
      first_meeting_date: $("firstMeetingDate").value || null,
      concern: $("concern").value.trim() || null,
      hope: $("hope").value.trim() || null,
      private_note: $("privateNote").value.trim() || null,
      updated_at: new Date().toISOString()
    };
    if (!payload.name) return toast("請先填旅人稱呼");

    let result;
    if (id) {
      result = await sb.from("travelers").update(payload).eq("id", id).select().single();
    } else {
      result = await sb.from("travelers").insert(payload).select().single();
    }
    if (result.error) return toast("儲存失敗：" + result.error.message);

    $("travelerDialog").close();
    toast(id ? "旅人資料已更新" : "旅人已加入");
    const openId = result.data?.id || id;
    await loadAll();
    if (openId) openDetail(openId);
  };

  travelerRow = function(t){
    const count = travelerJourneyCount(t.id);
    const active = journeys.filter(j => j.traveler_id === t.id && j.status !== "completed").length;
    const badge = count ? `${count} 段旅程${active ? ` · ${active} 進行中` : ""}` : "尚未開始旅程";
    return `<div class="traveler-row">
      <div class="row-main" data-open="${t.id}">
        <strong>${esc(t.name)}</strong>
        <div class="row-sub">${esc(t.concern || "尚未留下主題")} · ${fmt(t.first_meeting_date)}</div>
      </div>
      <span class="badge">${esc(badge)}</span>
      <div class="row-actions">
        <button class="small-btn" data-open="${t.id}">開啟紀錄</button>
        <button class="small-btn" data-edit="${t.id}">編輯</button>
        <button class="small-btn" data-delete="${t.id}">刪除</button>
      </div>
    </div>`;
  };

  // 從旅人詳細頁操作後，自動回到同一位旅人的工作區，不必重新找人。
  saveJourney = async function(e){
    const detailId = currentDetailId;
    await originalSaveJourney(e);
    if (detailId && travelerFor(detailId)) openDetail(detailId);
  };
  saveSession = async function(e){
    const detailId = currentDetailId;
    await originalSaveSession(e);
    if (detailId && travelerFor(detailId)) openDetail(detailId);
  };
  saveRecord = async function(e){
    const detailId = currentDetailId;
    await originalSaveRecord(e);
    if (detailId && travelerFor(detailId)) openDetail(detailId);
  };

  // 讓旅人頁更像入口，而不是資料清單。
  const style = document.createElement("style");
  style.textContent = `
    #travelersPage .traveler-row .row-main{cursor:pointer}
    #travelersPage .traveler-row .row-main:hover strong{opacity:.78}
    #travelersPage .traveler-row .row-actions [data-open]{background:rgba(241,227,200,.60);border-color:rgba(185,154,115,.16)}
    #travelerDialog .form-grid{grid-template-columns:1fr 1fr}
    #travelerDialog .form-grid label:nth-of-type(n+3){grid-column:1/-1}
    @media(max-width:900px){
      #travelerDialog .form-grid{grid-template-columns:1fr}
      #travelerDialog .form-grid label{grid-column:1/-1}
      #travelersPage .traveler-row .row-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px}
      #travelersPage .traveler-row .row-actions [data-open]{grid-column:1/-1}
    }
  `;
  document.head.appendChild(style);
})();