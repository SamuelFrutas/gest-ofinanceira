(()=>{
  const KEY='gf3_data';
  const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(+n||0);
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}};
  const save=s=>localStorage.setItem(KEY,JSON.stringify(s));
  const remaining=e=>Math.max(0,(+e.amount||0)-(+e.paidAmount||0));
  function refreshPending(){
    const s=load(); if(!s?.expenses)return;
    const pending=s.expenses.filter(e=>!e.synthetic&&!e.adjustment&&e.status!=='pago').reduce((a,e)=>a+remaining(e),0);
    const el=document.getElementById('pendingExpenses'); if(el)el.textContent=money(pending);
  }
  function decorate(){
    const s=load(); if(!s?.expenses)return;
    document.querySelectorAll('.expense-row').forEach(row=>{
      const btn=row.querySelector('[data-a="pay"]'); if(!btn)return;
      const id=btn.dataset.id, e=s.expenses.find(x=>x.id===id); if(!e)return;
      const container=btn.parentElement;
      let partial=container.querySelector('[data-a="partial"]');
      if(e.status!=='pago' && !partial){
        partial=document.createElement('button');
        partial.className='mini-btn'; partial.dataset.a='partial'; partial.dataset.id=id; partial.textContent='Pagamento parcial';
        container.insertBefore(partial,btn.nextSibling);
      }
      const status=row.querySelector('.status');
      if(status){
        if(e.status==='pago'){status.textContent='Pago';status.className='status paid'}
        else if((+e.paidAmount||0)>0){status.textContent='Pago parcial';status.className='status pending'}
        else{status.textContent='Pendente';status.className='status pending'}
      }
      const amount=row.querySelector('.expense-right>b');
      if(amount){
        const r=remaining(e);
        amount.textContent=money(r);
        if((+e.paidAmount||0)>0 && e.status!=='pago') amount.title='Valor restante';
      }
    });
    refreshPending();
  }
  document.addEventListener('click',event=>{
    const partial=event.target.closest('[data-a="partial"]');
    if(partial){
      event.preventDefault();event.stopImmediatePropagation();
      const s=load(); if(!s?.expenses)return;
      const e=s.expenses.find(x=>x.id===partial.dataset.id); if(!e)return;
      const r=remaining(e);
      const value=prompt(`Valor pago agora:\nRestante: ${money(r)}`);
      if(value===null)return;
      const n=+String(value).replace(/R\\$|\\s/g,'').replace(/\\./g,'').replace(',','.');
      if(!Number.isFinite(n)||n<=0||n>r){alert('Informe um valor válido, até o valor restante.');return}
      e.paidAmount=(+e.paidAmount||0)+Math.round(n*100)/100;
      e.partialPayments=Array.isArray(e.partialPayments)?e.partialPayments:[];
      e.partialPayments.push({amount:Math.round(n*100)/100,date:new Date().toISOString()});
      e.status=remaining(e)<=0.005?'pago':'parcial';
      save(s);location.reload();return;
    }
    const pay=event.target.closest('[data-a="pay"]');
    if(pay){
      event.preventDefault();event.stopImmediatePropagation();
      const s=load();if(!s?.expenses)return;
      const e=s.expenses.find(x=>x.id===pay.dataset.id);if(!e)return;
      if(e.status==='pago') e.status=(+e.paidAmount||0)>0?'parcial':'pendente';
      else e.status='pago';
      save(s);location.reload();
    }
  },true);
  const observer=new MutationObserver(decorate);
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(decorate,0);
})();
