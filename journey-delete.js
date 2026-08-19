(() => {
  function addDeleteButtons(){
    document.querySelectorAll('[data-journey-edit]').forEach(editBtn=>{
      const id=editBtn.getAttribute('data-journey-edit');
      const box=editBtn.parentElement;
      if(!id||!box||box.querySelector(`[data-journey-delete="${id}"]`)) return;
      const btn=document.createElement('button');
      btn.className='small-btn';
      btn.setAttribute('data-journey-delete',id);
      btn.textContent='刪除';
      btn.style.background='rgba(243,228,226,.85)';
      btn.style.color='#9a625e';
      editBtn.insertAdjacentElement('afterend',btn);
    });
  }

  async function deleteJourney(id){
    const j=(typeof journeys!=='undefined'?journeys:[]).find(x=>x.id===id);
    if(!j) return;
    const t=(typeof travelers!=='undefined'?travelers:[]).find(x=>x.id===j.traveler_id);
    const sessionCount=(typeof sessions!=='undefined'?sessions:[]).filter(x=>x.journey_id===id).length;
    const recordCount=(typeof records!=='undefined'?records:[]).filter(x=>x.journey_id===id).length;
    const details=(sessionCount||recordCount)?`\n\n這段旅程目前有 ${sessionCount} 筆相遇紀錄、${recordCount} 份拾光冊，刪除旅程時會一起刪除。`:'';
    if(!window.confirm(`確定要刪除「${t?.name||'旅人'}｜${j.journey_type}」這段旅程嗎？${details}\n\n此動作無法復原。`)) return;
    try{
      toast('正在刪除旅程…');
      let res=await sb.from('records').delete().eq('journey_id',id); if(res.error) throw res.error;
      res=await sb.from('sessions').delete().eq('journey_id',id); if(res.error) throw res.error;
      res=await sb.from('journeys').delete().eq('id',id); if(res.error) throw res.error;
      await loadAll();
      toast('旅程已刪除');
    }catch(err){console.error(err);toast('旅程刪除失敗，請再試一次');}
  }

  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-journey-delete]');
    if(!btn) return;
    e.preventDefault();e.stopPropagation();deleteJourney(btn.getAttribute('data-journey-delete'));
  });

  const observer=new MutationObserver(addDeleteButtons);
  document.addEventListener('DOMContentLoaded',()=>{addDeleteButtons();observer.observe(document.body,{childList:true,subtree:true});});
})();