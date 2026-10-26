document.addEventListener("DOMContentLoaded",()=>{
  const form=document.getElementById("expenseForm");
  const button=form?.querySelector(".save-btn");
  if(!form||!button)return;

  button.type="button";

  button.addEventListener("click",()=>{
    if(!form.checkValidity()){
      form.reportValidity();
      return;
    }

    if(form.elements.fixed?.checked&&form.elements.installment?.checked){
      alert("Escolha apenas uma opção: despesa fixa ou compra parcelada.");
      return;
    }

    const nativeDateToString=Date.prototype.toString;
    let restored=false;
    const restoreDate=()=>{
      if(restored)return;
      restored=true;
      Date.prototype.toString=nativeDateToString;
    };

    try{
      Date.prototype.toString=function(){
        return this.toISOString().slice(0,10);
      };
      const event=new Event("submit",{bubbles:true,cancelable:true});
      form.dispatchEvent(event);
      setTimeout(restoreDate,0);
    }catch(error){
      restoreDate();
      console.error("Erro ao salvar despesa:",error);
      alert("Não foi possível salvar a despesa. O sistema encontrou um erro e ele foi registrado.");
    }
  });

  window.addEventListener("error",event=>{
    console.error("Erro no sistema:",event.error||event.message);
  });
  window.addEventListener("unhandledrejection",event=>{
    console.error("Erro assíncrono no sistema:",event.reason);
  });
});

(function(){
  const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);
  const months=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const colors=['#16a34a','#0ea5e9','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#64748b','#84cc16','#f97316'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateOnly=s=>{const d=new Date(String(s||'')+'T12:00:00');return isNaN(d)?null:d};
  const monthKey=d=>{const x=dateOnly(d);return x?`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}`:''};
  const currentMonth=()=>{const el=document.getElementById('monthLabel');const text=(el?.textContent||'').toLowerCase();let m=months.findIndex(x=>text.includes(x));const y=text.match(/(20\d{2})/);return y&&m>=0?`${y[1]}-${String(m+1).padStart(2,'0')}`:monthKey(new Date())};
  const getData=()=>({expenses:JSON.parse(localStorage.getItem('gf_expenses')||'[]').filter(e=>!e.adjustment&&!e.synthetic),cards:JSON.parse(localStorage.getItem('gf_cards')||'[]')});
  function style(){if(document.getElementById('uiEnhanceStyle'))return;const s=document.createElement('style');s.id='uiEnhanceStyle';s.textContent=`
  .gf-category-chart{display:flex;gap:22px;align-items:center;justify-content:center;padding:12px 4px 22px;flex-wrap:wrap}
  .gf-donut{width:190px;height:190px;border-radius:50%;position:relative;flex:0 0 190px;box-shadow:0 8px 24px rgba(15,23,42,.08)}
  .gf-donut:after{content:'';position:absolute;inset:38px;background:#fff;border-radius:50%}
  .gf-donut-center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;z-index:1;font-weight:800;color:#17221b}
  .gf-donut-center small{font-weight:500;color:#64748b;font-size:12px}
  .gf-legend{display:grid;gap:9px;min-width:170px;max-width:100%;flex:1}
  .gf-legend-row{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:14px}
  .gf-legend-name{display:flex;align-items:center;gap:8px;min-width:0}.gf-dot{width:10px;height:10px;border-radius:50%;flex:0 0 10px}.gf-legend-name span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .gf-payable-list{display:grid;gap:10px}.gf-payable{border:1px solid #e5e7eb;border-radius:18px;padding:15px 14px;background:#fff;display:flex;justify-content:space-between;gap:12px;align-items:center}.gf-payable-info{min-width:0}.gf-payable-info strong{display:block;font-size:16px}.gf-payable-info small{display:block;color:#6b7280;margin-top:4px;line-height:1.35}.gf-payable-right{text-align:right;flex:0 0 auto}.gf-payable-right strong{display:block;font-size:17px}.gf-payable-right button{margin-top:7px}.gf-payable-card{cursor:pointer}.gf-payable-card:active{transform:scale(.99)}
  @media(max-width:560px){.gf-donut{width:165px;height:165px;flex-basis:165px}.gf-donut:after{inset:34px}.gf-payable{padding:13px}.gf-payable-info strong{font-size:15px}.gf-payable-right strong{font-size:16px}}
  `;document.head.appendChild(s)}
  function replaceAction(){const old=document.getElementById('newExpense');if(!old||old.dataset.gfDone)return;const b=old.cloneNode(true);b.removeAttribute('id');b.dataset.go='expenses';b.dataset.gfDone='1';b.textContent='💰 Despesas';b.addEventListener('click',()=>document.querySelector('.nav-item[data-page="expenses"]')?.click());old.replaceWith(b)}
  function categoryPanel(){const dash=document.getElementById('dashboard');if(!dash)return;const recent=document.getElementById('expenseList')?.closest('.panel');const cat=document.getElementById('categoryList')?.closest('.panel');if(!recent||!cat)return;const head=cat.querySelector('.panel-head h2');if(head)head.textContent='Gastos por categoria';if(!document.getElementById('gfCategoryChart')){const chart=document.createElement('div');chart.id='gfCategoryChart';chart.className='gf-category-chart';cat.insertBefore(chart,document.getElementById('categoryList'));}dash.appendChild(cat);dash.appendChild(recent)}
  function renderChart(){const box=document.getElementById('gfCategoryChart');if(!box)return;const {expenses}=getData(),mk=currentMonth();const cats={};expenses.filter(e=>monthKey(e.date)===mk).forEach(e=>cats[e.category]=(cats[e.category]||0)+Number(e.amount||0));const entries=Object.entries(cats).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);const total=entries.reduce((s,[,v])=>s+v,0);if(!entries.length){box.innerHTML='<div class="empty">Nenhum gasto neste mês.</div>';return}let deg=0;const stops=entries.map(([name,val],i)=>{const start=deg;deg+=val/total*360;return `${colors[i%colors.length]} ${start}deg ${deg}deg`}).join(',');const legend=entries.map(([name,val],i)=>`<div class="gf-legend-row"><div class="gf-legend-name"><i class="gf-dot" style="background:${colors[i%colors.length]}"></i><span>${esc(name)}</span></div><strong>${money(val)}</strong></div>`).join('');box.innerHTML=`<div class="gf-donut" style="background:conic-gradient(${stops})"><div class="gf-donut-center"><strong>${money(total)}</strong><small>Total</small></div></div><div class="gf-legend">${legend}</div>`}
  function renderValues(){const list=document.getElementById('categoryList');if(!list)return;const {expenses}=getData(),mk=currentMonth(),cats={};expenses.filter(e=>monthKey(e.date)===mk).forEach(e=>cats[e.category]=(cats[e.category]||0)+Number(e.amount||0));const entries=Object.entries(cats).sort((a,b)=>b[1]-a[1]);list.innerHTML=entries.length?entries.map(([c,v])=>`<div class="expense"><strong>${esc(c)}</strong><strong>${money(v)}</strong></div>`).join(''):'<div class="empty">Cadastre despesas para ver o resumo.</div>'}
  function gMonth(k){const [y,m]=k.split('-');return `${months[Number(m)-1]} de ${y}`}
  function renderPayables(){const page=document.getElementById('expenses');if(!page||page.classList.contains('hidden'))return;const target=document.getElementById('allExpenses');if(!target)return;const {expenses,cards}=getData();const q=(document.getElementById('expenseSearch')?.value||'').toLowerCase(),type=document.getElementById('typeFilter')?.value||'',payment=document.getElementById('paymentFilter')?.value||'',status=document.getElementById('statusFilter')?.value||'';const cardGroups={};expenses.filter(e=>e.payment==='Cartão de crédito').forEach(e=>{const key=`${e.cardId||''}|${monthKey(e.dueDate||e.date)}`;if(!cardGroups[key])cardGroups[key]={cardId:e.cardId,month:monthKey(e.dueDate||e.date),items:[]};cardGroups[key].items.push(e)});const payables=[];expenses.filter(e=>e.payment!=='Cartão de crédito').forEach(e=>{if(q&&!(`${e.description} ${e.category}`.toLowerCase().includes(q)))return;if(type&&e.type!==type)return;if(payment&&payment!=='Conta bancária')return;if(status&&status!==e.status)return;payables.push({kind:'bank',due:e.dueDate||e.date,e})});Object.values(cardGroups).forEach(g=>{const card=cards.find(c=>c.id===g.cardId),items=g.items,filtered=items.filter(e=>(!q||(`${card?.name||'Cartão'} ${e.description} ${e.category}`.toLowerCase().includes(q)))&&(!type||e.type===type));if(!filtered.length)return;const total=filtered.reduce((s,e)=>s+Number(e.amount||0),0),pending=filtered.some(e=>e.status!=='pago'),invoiceStatus=pending?'pendente':'pago';if(status&&status!==invoiceStatus)return;if(payment&&payment!=='Cartão de crédito')return;payables.push({kind:'card',due:g.month,e:{card,items:filtered,total,pending,month:g.month}})});payables.sort((a,b)=>String(a.due).localeCompare(String(b.due)));target.innerHTML=payables.length?`<div class="gf-payable-list">${payables.map(p=>{if(p.kind==='bank'){const e=p.e;return `<div class="gf-payable"><div class="gf-payable-info"><strong>${esc(e.description)}</strong><small>${esc(e.category)} · ${esc(e.type)} · Conta bancária<br>Vencimento: ${dateOnly(e.dueDate||e.date)?.toLocaleDateString('pt-BR')||'—'}</small></div><div class="gf-payable-right"><strong>${money(e.amount)}</strong><span class="status ${e.status==='pago'?'paid':'pending'}">${e.status==='pago'?'Pago':'Pendente'}</span><br><button class="mini-btn gf-pay-bank" data-id="${esc(e.id)}">${e.status==='pago'?'Reabrir':'Marcar pago'}</button></div></div>`}return `<div class="gf-payable gf-payable-card" data-card="${esc(p.e.card?.id||'')}" data-month="${esc(p.e.month)}"><div class="gf-payable-info"><strong>💳 Fatura ${esc(p.e.card?.name||'Cartão')}</strong><small>Fatura de ${esc(gMonth(p.e.month))}<br>${p.e.items.length} lançamento${p.e.items.length===1?'':'s'} no cartão</small></div><div class="gf-payable-right"><strong>${money(p.e.total)}</strong><span class="status ${p.e.pending?'pending':'paid'}">${p.e.pending?'Pendente':'Pago'}</span><br><button class="mini-btn gf-open-card">Ver fatura</button></div></div>`}).join('')}</div>`:'<div class="empty">Nenhuma despesa a pagar encontrada.</div>';const total=payables.reduce((s,p)=>s+(p.kind==='bank'?Number(p.e.amount||0):Number(p.e.total||0)),0);const ft=document.getElementById('filteredTotal');if(ft)ft.textContent=money(total);target.querySelectorAll('.gf-pay-bank').forEach(btn=>btn.addEventListener('click',()=>{if(typeof window.markExpensePaid==='function'){window.markExpensePaid(btn.dataset.id);setTimeout(renderPayables,250);return}const data=JSON.parse(localStorage.getItem('gf_expenses')||'[]');const e=data.find(x=>x.id===btn.dataset.id);if(!e)return;e.status=e.status==='pago'?'pendente':'pago';localStorage.setItem('gf_expenses',JSON.stringify(data));renderPayables()}));target.querySelectorAll('.gf-payable-card,.gf-open-card').forEach(el=>el.addEventListener('click',ev=>{if(ev.target.closest('.gf-pay-bank'))return;const row=el.closest('.gf-payable-card')||el;const cardId=row.dataset.card,month=row.dataset.month;const card=cards.find(c=>c.id===cardId);const old=[...document.querySelectorAll('#invoiceExpenseList .invoice-row')].find(x=>x.textContent.toLowerCase().includes((card?.name||'cartão').toLowerCase())&&x.textContent.includes(month.split('-')[1]+'/'+month.split('-')[0]));if(old){old.click();return}const existing=document.querySelector('#invoiceExpenseList .invoice-row');if(existing)existing.click()}))}
  function run(){style();replaceAction();categoryPanel();renderChart();renderValues();renderPayables()}
  document.addEventListener('DOMContentLoaded',()=>{run();document.getElementById('expenseSearch')?.addEventListener('input',renderPayables);document.getElementById('typeFilter')?.addEventListener('change',renderPayables);document.getElementById('paymentFilter')?.addEventListener('change',renderPayables);document.getElementById('statusFilter')?.addEventListener('change',renderPayables);const ml=document.getElementById('monthLabel');if(ml)new MutationObserver(()=>{categoryPanel();renderChart();renderValues()}).observe(ml,{childList:true,subtree:true,characterData:true});setInterval(run,1200)})
})();
