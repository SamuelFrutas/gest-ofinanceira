document.addEventListener("DOMContentLoaded",()=>{
  const form=document.getElementById("expenseForm");
  const button=form?.querySelector(".save-btn");
  if(form&&button){
    button.type="button";
    button.addEventListener("click",()=>{
      if(!form.checkValidity()){form.reportValidity();return;}
      if(form.elements.fixed?.checked&&form.elements.installment?.checked){alert("Escolha apenas uma opção: despesa fixa ou compra parcelada.");return;}
      try{form.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}))}catch(error){console.error("Erro ao salvar despesa:",error);alert("Não foi possível salvar a despesa. Tente novamente.")}
    });
  }
  window.addEventListener("error",event=>console.error("Erro no sistema:",event.error||event.message));
  window.addEventListener("unhandledrejection",event=>console.error("Erro assíncrono no sistema:",event.reason));
  initFinanceUI();
});

function initFinanceUI(){
  if(document.getElementById("gfFinanceStyle"))return;
  const style=document.createElement("style");style.id="gfFinanceStyle";style.textContent=`
  .gf-category-chart{display:flex;align-items:center;justify-content:center;gap:28px;padding:18px 8px 24px;flex-wrap:wrap}
  .gf-donut{width:190px;height:190px;border-radius:50%;position:relative;flex:0 0 190px;box-shadow:0 8px 25px rgba(15,23,42,.10)}
  .gf-donut::after{content:"";position:absolute;inset:40px;background:#fff;border-radius:50%}
  .gf-donut-center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;z-index:2;color:#17221b;text-align:center}
  .gf-donut-center strong{font-size:20px}.gf-donut-center small{font-size:12px;color:#64748b;margin-top:2px}
  .gf-legend{display:grid;gap:10px;min-width:190px;max-width:100%;flex:1}.gf-legend-row{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:14px}.gf-legend-name{display:flex;align-items:center;gap:8px;min-width:0}.gf-legend-name span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gf-dot{width:10px;height:10px;border-radius:50%;display:block;flex:0 0 10px}
  .gf-payable-list{display:grid;gap:10px}.gf-payable{border:1px solid #e5e7eb;border-radius:18px;padding:15px;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:14px}.gf-payable-info{min-width:0}.gf-payable-info strong{display:block;font-size:16px}.gf-payable-info small{display:block;color:#64748b;line-height:1.4;margin-top:4px}.gf-payable-right{text-align:right;flex:0 0 auto}.gf-payable-right strong{display:block;font-size:17px}.gf-payable-right .mini-btn{margin-top:7px}.gf-card-invoice{cursor:pointer}.gf-card-invoice:active{transform:scale(.99)}
  @media(max-width:560px){.gf-donut{width:165px;height:165px;flex-basis:165px}.gf-donut::after{inset:34px}.gf-payable{padding:13px}.gf-payable-info strong{font-size:15px}.gf-payable-right strong{font-size:16px}}
  `;document.head.appendChild(style);
  const colors=["#16a34a","#0ea5e9","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#64748b","#84cc16","#f97316"];
  const money=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0);
  const esc=s=>String(s??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const parseDate=s=>{const d=new Date(String(s||"")+"T12:00:00");return isNaN(d)?null:d};
  const monthKey=s=>{const d=parseDate(s);return d?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`:""};
  const monthNames=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  function currentMonth(){const t=(document.getElementById("monthLabel")?.textContent||"").toLowerCase();const y=t.match(/20\d{2}/)?.[0];const m=monthNames.findIndex(x=>t.includes(x));if(y&&m>=0)return `${y}-${String(m+1).padStart(2,"0")}`;return monthKey(new Date().toISOString().slice(0,10))}
  function data(){let expenses=[];let cards=[];try{expenses=JSON.parse(localStorage.getItem("gf_expenses")||"[]")}catch{}try{cards=JSON.parse(localStorage.getItem("gf_cards")||"[]")}catch{}return{expenses:expenses.filter(e=>!e.adjustment&&!e.synthetic),cards}}
  function renderCategoryChart(){
    const box=document.getElementById("categoryChart");if(!box)return;
    const {expenses}=data(),mk=currentMonth(),cats={};
    expenses.filter(e=>monthKey(e.date)===mk).forEach(e=>{cats[e.category]=(cats[e.category]||0)+Number(e.amount||0)});
    const entries=Object.entries(cats).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
    if(!entries.length){box.innerHTML='<div class="empty">Nenhum gasto neste mês.</div>';return}
    const total=entries.reduce((s,[,v])=>s+v,0);let deg=0;
    const stops=entries.map(([name,v],i)=>{const start=deg;deg+=v/total*360;return `${colors[i%colors.length]} ${start}deg ${deg}deg`}).join(",");
    const legend=entries.map(([name,v],i)=>`<div class="gf-legend-row"><div class="gf-legend-name"><i class="gf-dot" style="background:${colors[i%colors.length]}"></i><span>${esc(name)}</span></div><strong>${money(v)}</strong></div>`).join("");
    box.innerHTML=`<div class="gf-donut" style="background:conic-gradient(${stops})"><div class="gf-donut-center"><strong>${money(total)}</strong><small>Total no mês</small></div></div><div class="gf-legend">${legend}</div>`;
  }
  function hideOldInvoicePanel(){const box=document.getElementById("invoiceExpenseList");const panel=box?.closest(".panel");if(panel)panel.style.display="none"}
  function renderPayables(){
    const page=document.getElementById("expenses");if(!page||page.classList.contains("hidden"))return;
    const target=document.getElementById("allExpenses");if(!target)return;
    hideOldInvoicePanel();
    const {expenses,cards}=data(),mk=currentMonth();
    const q=(document.getElementById("expenseSearch")?.value||"").toLowerCase(),type=document.getElementById("typeFilter")?.value||"",payment=document.getElementById("paymentFilter")?.value||"",status=document.getElementById("statusFilter")?.value||"";
    const items=[];const cardGroups={};
    expenses.forEach(e=>{
      if(e.payment==="Cartão de crédito"){
        if(monthKey(e.dueDate||e.date)!==mk)return;
        const key=`${e.cardId||""}|${mk}`;(cardGroups[key]??={cardId:e.cardId,month:mk,items:[]}).items.push(e);return
      }
      if(monthKey(e.date)!==mk)return;
      if(q&&!`${e.description||""} ${e.category||""}`.toLowerCase().includes(q))return;if(type&&e.type!==type)return;if(payment&&payment!=="Conta bancária")return;if(status&&e.status!==status)return;
      items.push({kind:"bank",due:e.dueDate||e.date,e});
    });
    Object.values(cardGroups).forEach(g=>{
      const card=cards.find(c=>c.id===g.cardId);let list=g.items.filter(e=>(!q||`${card?.name||"Cartão"} ${e.description||""} ${e.category||""}`.toLowerCase().includes(q))&&(!type||e.type===type));if(payment&&payment!=="Cartão de crédito")list=[];if(!list.length)return;
      const pending=list.some(e=>e.status!=="pago");const invoiceStatus=pending?"pendente":"pago";if(status&&status!==invoiceStatus)return;items.push({kind:"card",due:g.month,card,month:g.month,items:list,total:list.reduce((s,e)=>s+Number(e.amount||0),0),pending});
    });
    items.sort((a,b)=>String(a.due).localeCompare(String(b.due)));
    const brDate=s=>parseDate(s)?.toLocaleDateString("pt-BR")||"—";
    const monthLabel=s=>{const [y,m]=String(s).split("-");return m&&y?`${m}/${y}`:"—"};
    target.innerHTML=items.length?`<div class="gf-payable-list">${items.map(p=>p.kind==="bank"?`<div class="gf-payable"><div class="gf-payable-info"><strong>${esc(p.e.description)}</strong><small>${esc(p.e.category)} · ${esc(p.e.type)} · Conta bancária<br>Vencimento: ${brDate(p.e.dueDate||p.e.date)}</small></div><div class="gf-payable-right"><strong>${money(p.e.amount)}</strong><span class="status ${p.e.status==="pago"?"paid":"pending"}">${p.e.status==="pago"?"Pago":"Pendente"}</span><br><button class="mini-btn gf-toggle-bank" data-id="${esc(p.e.id)}">${p.e.status==="pago"?"Reabrir":"Marcar pago"}</button></div></div>`:`<div class="gf-payable gf-card-invoice" data-card="${esc(p.card?.id||"")}" data-month="${esc(p.month)}"><div class="gf-payable-info"><strong>💳 Fatura ${esc(p.card?.name||"Cartão")}</strong><small>Vencimento da fatura: ${monthLabel(p.month)}<br>${p.items.length} lançamento${p.items.length===1?"":"s"} no cartão</small></div><div class="gf-payable-right"><strong>${money(p.total)}</strong><span class="status ${p.pending?"pending":"paid"}">${p.pending?"Pendente":"Paga"}</span><br><button class="mini-btn gf-open-invoice">Ver fatura</button></div></div>`).join("")}</div>`:'<div class="empty">Nenhuma despesa a pagar encontrada.</div>';
    const total=items.reduce((s,p)=>s+(p.kind==="bank"?Number(p.e.amount||0):Number(p.total||0)),0);const ft=document.getElementById("filteredTotal");if(ft)ft.textContent=money(total);
    target.querySelectorAll(".gf-toggle-bank").forEach(b=>b.addEventListener("click",()=>toggleExpenses([b.dataset.id])));
    target.querySelectorAll(".gf-card-invoice,.gf-open-invoice").forEach(el=>el.addEventListener("click",ev=>{if(ev.target.closest(".gf-toggle-bank"))return;const row=el.closest(".gf-card-invoice")||el;openInvoice(row.dataset.card,row.dataset.month)}));
  }
  async function toggleExpenses(ids){
    try{
      const [{getApp},{getAuth},{getFirestore,doc,getDoc,setDoc}]=await Promise.all([import("https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js"),import("https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js"),import("https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js")]);
      const user=getAuth(getApp()).currentUser;if(!user)return;
      const ref=doc(getFirestore(getApp()),"users",user.uid,"data","main"),snap=await getDoc(ref);if(!snap.exists())return;
      const d=snap.data(),arr=Array.isArray(d.expenses)?d.expenses:[];arr.forEach(e=>{if(ids.includes(e.id))e.status=e.status==="pago"?"pendente":"pago"});await setDoc(ref,{...d,expenses:arr,updatedAt:new Date().toISOString()});localStorage.setItem("gf_expenses",JSON.stringify(arr));renderPayables();
    }catch(e){console.error(e);alert("Não foi possível atualizar o pagamento.")}
  }
  function openInvoice(cardId,month){
    const rows=[...document.querySelectorAll("#invoiceExpenseList .invoice-row")];
    const card=data().cards.find(c=>c.id===cardId);const name=(card?.name||"Cartão").toLowerCase();
    const row=rows.find(r=>r.textContent.toLowerCase().includes(name)&&r.textContent.includes(String(month).split("-")[1]+"/"+String(month).split("-")[0]));
    if(row){row.click();return}
    const any=rows.find(r=>r.textContent.toLowerCase().includes(name));if(any)any.click();
  }
  function run(){renderCategoryChart();renderPayables()}
  run();setInterval(run,900);
  ["expenseSearch","typeFilter","paymentFilter","statusFilter"].forEach(id=>document.getElementById(id)?.addEventListener("input",renderPayables));
  ["typeFilter","paymentFilter","statusFilter"].forEach(id=>document.getElementById(id)?.addEventListener("change",renderPayables));
  document.getElementById("monthLabel")&&new MutationObserver(renderCategoryChart).observe(document.getElementById("monthLabel"),{childList:true,characterData:true,subtree:true});
}
