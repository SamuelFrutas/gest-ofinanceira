const state={expenses:JSON.parse(localStorage.getItem('gf_expenses')||'[]'),month:new Date()};
const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);
const parseMoney=s=>Number(String(s).replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,''))||0;
const monthKey=d=>{const x=new Date(d+'T12:00:00');return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}`};
const currentKey=()=>`${state.month.getFullYear()}-${String(state.month.getMonth()+1).padStart(2,'0')}`;
const save=()=>localStorage.setItem('gf_expenses',JSON.stringify(state.expenses));
function render(){
 const key=currentKey();
 document.getElementById('monthLabel').textContent=state.month.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^./,m=>m.toUpperCase());
 const list=state.expenses.filter(e=>monthKey(e.date)===key); const total=list.reduce((s,e)=>s+e.amount,0); const personal=list.filter(e=>e.type==='Pessoal').reduce((s,e)=>s+e.amount,0); const company=total-personal;
 document.getElementById('totalExpenses').textContent=money(total);document.getElementById('personalExpenses').textContent=money(personal);document.getElementById('companyExpenses').textContent=money(company);document.getElementById('titheValue').textContent=money(personal*.10);
 const el=document.getElementById('expenseList');el.innerHTML=list.length?list.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(e=>`<div class="expense"><div class="expense-info"><strong>${escapeHtml(e.description)}</strong><small>${escapeHtml(e.category)} · ${escapeHtml(e.type)} · ${escapeHtml(e.payment)}</small></div><div class="expense-value">${money(e.amount)}<small>${new Date(e.date+'T12:00:00').toLocaleDateString('pt-BR')}</small></div></div>`).join(''):'<div class="empty">Nenhuma despesa cadastrada neste mês.</div>';
 const cats={};list.forEach(e=>cats[e.category]=(cats[e.category]||0)+e.amount);const ce=document.getElementById('categoryList');ce.innerHTML=Object.keys(cats).length?Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<div class="expense"><strong>${escapeHtml(c)}</strong><strong>${money(v)}</strong></div>`).join(''):'<div class="empty">Cadastre despesas para ver o resumo.</div>';
}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
const modal=document.getElementById('expenseModal');
function openModal(){modal.classList.remove('hidden');document.querySelector('[name=date]').value=new Date().toISOString().slice(0,10);document.querySelector('[name=description]').focus()}
function closeModal(){modal.classList.add('hidden')}
document.getElementById('newExpense').onclick=openModal;document.getElementById('fab').onclick=openModal;document.getElementById('closeModal').onclick=closeModal;modal.onclick=e=>{if(e.target===modal)closeModal()};
document.getElementById('prevMonth').onclick=()=>{state.month.setMonth(state.month.getMonth()-1);render()};document.getElementById('nextMonth').onclick=()=>{state.month.setMonth(state.month.getMonth()+1);render()};
document.getElementById('expenseForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);state.expenses.push({id:crypto.randomUUID(),description:f.get('description'),amount:parseMoney(f.get('amount')),date:f.get('date'),category:f.get('category'),type:f.get('type'),payment:f.get('payment')});save();e.target.reset();closeModal();render()};
['openCards','openReports','openTithe','seeAll'].forEach(id=>document.getElementById(id).onclick=()=>alert('Esta área será implementada na próxima etapa do sistema.'));
render();
