(()=> {
  const KEY='gf3_data';
  let activeModal=null,activeKeyHandler=null,returnFocus=null;
  function closeModal(){
    if(activeKeyHandler){document.removeEventListener('keydown',activeKeyHandler);activeKeyHandler=null;}
    if(!activeModal)return;
    activeModal.remove();
    activeModal=null;
    if(returnFocus?.isConnected)returnFocus.focus();
    returnFocus=null;
  }
  function showChoiceModal(onChoose){
    closeModal();
    const modal=document.createElement('div');
    modal.className='modal recurring-delete-modal';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-labelledby','recurringDeleteTitle');
    modal.innerHTML=`
      <div class="modal-card recurring-delete-card">
        <div class="modal-head">
          <div>
            <span class="eyebrow">DESPESA RECORRENTE</span>
            <h2 id="recurringDeleteTitle">Como deseja excluir?</h2>
          </div>
          <button type="button" class="icon-btn" data-recurring-cancel aria-label="Fechar">×</button>
        </div>
        <p class="muted">Escolha o que deve acontecer com esta despesa. Os meses anteriores serão preservados.</p>
        <div class="recurring-delete-actions">
          <button type="button" class="secondary-btn" data-recurring-choice="one">Excluir somente esta ocorrência</button>
          <button type="button" class="mini-btn danger recurring-delete-future" data-recurring-choice="future">Excluir esta e as próximas</button>
          <button type="button" class="secondary-btn recurring-delete-cancel" data-recurring-cancel>Cancelar</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    activeModal=modal;
    const close=()=>closeModal();
    modal.addEventListener('click',event=>{
      if(event.target===modal||event.target.closest('[data-recurring-cancel]')){close();return;}
      const choice=event.target.closest('[data-recurring-choice]')?.dataset.recurringChoice;
      if(choice){close();onChoose(choice);}
    });
    returnFocus=document.activeElement;
    activeKeyHandler=event=>{if(event.key==='Escape')close();};
    document.addEventListener('keydown',activeKeyHandler);
    modal.querySelector('[data-recurring-choice="one"]').focus();
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-a="del"]');
    if(!button)return;
    let state;
    try{state=JSON.parse(localStorage.getItem(KEY)||'null')}catch{return}
    if(!state?.expenses)return;
    const id=button.dataset.id;
    const expense=state.expenses.find(item=>item.id===id);
    if(!expense?.fixed||!expense.seriesId)return;

    event.preventDefault();
    event.stopImmediatePropagation();

    showChoiceModal(choice=>{
      if(choice==='one'){
        state.expenses=state.expenses.filter(item=>item.id!==id);
      }else{
        state.expenses=state.expenses.filter(item=>
          item.seriesId!==expense.seriesId || String(item.date)<String(expense.date)
        );
      }
      localStorage.setItem(KEY,JSON.stringify(state));
      Promise.resolve(window.gf3PersistLocal?.()).then(()=>{window.gf3Refresh?.();}).catch(error=>{console.error('Falha ao atualizar despesas recorrentes:',error);});
    });
  },true);
})();