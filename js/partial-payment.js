(()=>{
  const KEY='gf3_data';
  const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(+n||0);
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}};
  const save=s=>localStorage.setItem(KEY,JSON.stringify(s));
  const remaining=e=>Math.max(0,(+e.amount||0)-(+e.paidAmount||0));
  let observer=null,decorating=false;
  function modal(){
    let el=document.getElementById('paymentActionModal');
    if(el)return el;
    el=document.createElement('div');
    el.id='paymentActionModal';el.className='modal hidden';
    el.innerHTML='<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="paymentActionTitle"><div class="modal-head"><h2 id="paymentActionTitle">Registrar pagamento</h2><button type="button" class="icon-btn" data-payment-close aria-label="Fechar">×</button></div><p id="paymentActionDescription" class="muted"></p><div id="paymentPartialField" class="hidden"><label>Valor pago agora<input id="paymentPartialAmount" inputmode="decimal" placeholder="0,00"></label></div><div class="actions"><button type="button" class="primary-btn" id="paymentFullButton">Quitar despesa</button><button type="button" class="secondary-btn" id="paymentPartialButton">Registrar pagamento parcial</button></div><button type="button" class="text-btn" data-payment-close>Cancelar</button></div>';
    document.body.appendChild(el);
    el.addEventListener('click',e=>{if(e.target===el||e.target.closest('[data-payment-close]'))close()});
    el.querySelector('#paymentFullButton').addEventListener('click',()=>settle('full'));
    el.querySelector('#paymentPartialButton').addEventListener('click',()=>settle('partial'));
    return el;
  }
  let activeId=null;
  function close(){const el=document.getElementById('paymentActionModal');if(el)el.classList.add('hidden');activeId=null}
  function persist(){Promise.resolve(window.gf3PersistLocal?.()).then(()=>window.gf3Refresh?.()).catch(error=>console.error('Falha ao atualizar pagamento:',error))}
  function settle(mode){
    const s=load();if(!s?.expenses)return;
    const e=s.expenses.find(x=>x.id===activeId);if(!e)return close();
    if(mode==='full'){
      if(!confirm('Confirmar a quitação total desta despesa?'))return;
      e.paidAmount=+e.amount||0;e.status='pago';e.paidDate=new Date().toISOString().slice(0,10);
    }else{
      const raw=document.getElementById('paymentPartialAmount').value;
      const n=+String(raw).replace(/R\\$|\\s/g,'').replace(/\\./g,'').replace(',','.');
      const open=remaining(e);
      if(!Number.isFinite(n)||n<=0||n>open){alert('Informe um valor válido, até o valor em aberto.');return}
      const paid=Math.round(n*100)/100;
      e.paidAmount=(+e.paidAmount||0)+paid;
      e.partialPayments=Array.isArray(e.partialPayments)?e.partialPayments:[];
      e.partialPayments.push({amount:paid,date:new Date().toISOString()});
      e.status=remaining(e)<=0.005?'pago':'parcial';
      if(e.status==='pago')e.paidDate=new Date().toISOString().slice(0,10);
    }
    save(s);close();persist();
  }
  function openPayment(id){
    const s=load();const e=s?.expenses?.find(x=>x.id===id);if(!e)return;
    activeId=id;const el=modal(),paid=+e.paidAmount||0,open=remaining(e);
    el.querySelector('#paymentActionTitle').textContent='Registrar pagamento';
    el.querySelector('#paymentActionDescription').textContent='Despesa: '+e.description+' · Em aberto: '+money(open)+(paid>0?' · Já pago: '+money(paid):'');
    el.querySelector('#paymentPartialField').classList.remove('hidden');
    el.querySelector('#paymentPartialAmount').value='';
    el.classList.remove('hidden');
  }
  function refreshPending(){
    const s=load();if(!s?.expenses)return;
    const pending=s.expenses.filter(e=>!e.synthetic&&!e.adjustment&&e.status!=='pago').reduce((a,e)=>a+remaining(e),0);
    const el=document.getElementById('pendingExpenses');if(el)el.textContent=money(pending);
  }
  function decorate(){
    if(decorating)return;decorating=true;if(observer)observer.disconnect();
    try{
      const s=load();if(!s?.expenses)return;
      document.querySelectorAll('.expense-row').forEach(row=>{
        const btn=row.querySelector('[data-a="pay"]');if(!btn)return;
        const e=s.expenses.find(x=>x.id===btn.dataset.id);if(!e)return;
        const paid=+e.paidAmount||0,open=remaining(e),container=btn.parentElement;
        let partial=container.querySelector('[data-a="partial"]');if(partial)partial.remove();
        btn.textContent=e.status==='pago'?'Reabrir':'Registrar pagamento';
        const status=row.querySelector('.status');
        if(status){status.textContent=e.status==='pago'?'Pago':paid>0?'Pagamento parcial':'Pendente';status.className='status '+(e.status==='pago'?'paid':'pending')}
        const amount=row.querySelector('.expense-right>b');
        if(amount)amount.innerHTML=money(e.amount)+'<small style="display:block;font-weight:400;margin-top:3px">Pago: '+money(paid)+' · Em aberto: '+money(open)+'</small>';
      });
      refreshPending();
    }finally{decorating=false;if(observer)observer.observe(document.body,{childList:true,subtree:true})}
  }
  document.addEventListener('click',event=>{
    const pay=event.target.closest('[data-a="pay"]');if(!pay)return;
    event.preventDefault();event.stopImmediatePropagation();
    const s=load();if(!s?.expenses)return;
    const e=s.expenses.find(x=>x.id===pay.dataset.id);if(!e)return;
    if(e.status==='pago'){
      if(!confirm('Reabrir esta despesa?'))return;
      e.status=(+e.paidAmount||0)>0?'parcial':'pendente';
      if(e.status==='pendente'){e.paidAmount=0;e.paidDate=null}
      save(s);persist();return;
    }
    openPayment(e.id);
  },true);
  observer=new MutationObserver(()=>decorate());observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(decorate,0);
})();