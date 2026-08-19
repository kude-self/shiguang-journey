(() => {
  const byId = id => document.getElementById(id);
  const tableKeys = ['travelers','journeys','sessions','records'];

  function addImportButton(){
    const exportBtn = byId('exportBtn');
    if (!exportBtn || byId('importBackupBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'importBackupBtn';
    btn.className = 'ghost';
    btn.textContent = '匯入資料備份';
    exportBtn.insertAdjacentElement('afterend', btn);

    const input = document.createElement('input');
    input.id = 'backupFileInput';
    input.type = 'file';
    input.accept = '.json,application/json';
    input.hidden = true;
    document.body.appendChild(input);

    btn.addEventListener('click', () => input.click());
    input.addEventListener('change', importBackup);
  }

  function validateBackup(data){
    if (!data || typeof data !== 'object') throw new Error('備份檔格式不正確');
    for (const key of tableKeys) {
      if (data[key] !== undefined && !Array.isArray(data[key])) {
        throw new Error(`${key} 資料格式不正確`);
      }
    }
  }

  function prepareRows(rows){
    return (rows || []).map(row => ({...row, owner_id: currentUser.id}));
  }

  async function upsertTable(table, rows){
    if (!rows.length) return;
    const { error } = await sb.from(table).upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(`${table} 匯入失敗：${error.message}`);
  }

  async function importBackup(event){
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const data = parsed.data || parsed;
      validateBackup(data);

      const summary = `旅人 ${(data.travelers||[]).length} 筆、旅程 ${(data.journeys||[]).length} 筆、相遇紀錄 ${(data.sessions||[]).length} 筆、拾光冊 ${(data.records||[]).length} 筆`;
      if (!window.confirm(`準備匯入：${summary}\n\n相同 ID 會更新，不會先刪除目前資料。確定繼續嗎？`)) return;

      toast('正在匯入備份…');
      await upsertTable('travelers', prepareRows(data.travelers));
      await upsertTable('journeys', prepareRows(data.journeys));
      await upsertTable('sessions', prepareRows(data.sessions));
      await upsertTable('records', prepareRows(data.records));
      await loadAll();
      toast('備份已匯入完成');
    } catch (err) {
      console.error(err);
      toast(`備份匯入失敗：${err.message || '請確認檔案格式'}`);
    }
  }

  document.addEventListener('DOMContentLoaded', addImportButton);
})();