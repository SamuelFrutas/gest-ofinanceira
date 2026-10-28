(()=>{
  const KEY='gf3_data';
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-a="del"]');
    if(!button)return;
    let state;
    try{state=JSON.parse(localStorage.getItem(KEY)||'null')}catch{return}
    if(!state?.expenses)return;
    const id=button.dataset.id;
    const expense=state.expenses.find(item=>item.id===id);
    if(!expense?.fixed)return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const choice=window.prompt(
      'Esta é uma despesa fixa/recorrente.\n\n'+
      '1 — Excluir somente esta\n'+
      '2 — Excluir todas\n'+
      '3 — Excluir esta e daqui pra frente\n\n'+
      'Digite 1, 2 ou 3:'
    );
    if(!['1','2','3'].includes(choice))return;

    if(choice==='1'){
      state.expenses=state.expenses.filter(item=>item.id!==id);
    }else if(choice==='2'){
      state.expenses=state.expenses.filter(item=>item.seriesId!==expense.seriesId);
    }else{
      state.expenses=state.expenses.filter(item=>
        item.seriesId!==expense.seriesId || String(item.date)<String(expense.date)
      );
    }

    localStorage.setItem(KEY,JSON.stringify(state));
    location.reload();
  },true);
})();
