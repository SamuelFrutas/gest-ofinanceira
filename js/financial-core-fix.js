const FC_KEYS={expenses:"gf_expenses",cards:"gf_cards",categories:"gf_categories",settings:"gf_settings"};
const fcRead=k=>{try{return JSON.parse(localStorage.getItem(k)||"null")}catch{return null}};
const fcWrite=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const fcDate=s=>{const d=new Date(`${s}T12:00:00`);return Number.isNaN(d.getTime())?null:d};
const fcIso=d=>d.toISOString().slice(0,10);
function fcCardDue(purchase,card){
  const d=fcDate(purchase); if(!d||!card)return purchase;
  const closing=Math.min(31,Math.max(1,Number(card.closing)||31));
  const due=Math.min(28,Math.max(1,Number(card.due)||10));
  if(d.getDate()>closing || (d.getDate()<=closing && due<=d.getDate())) d.setMonth(d.getMonth()+1);
  return fcIso(new Date(d.getFullYear(),d.getMonth(),due,12));
}
function fcNormalize(){
  const expenses=Array.isArray(fcRead(FC_KEYS.expenses))?fcRead(FC_KEYS.expenses):[];
  const cards=Array.isArray(fcRead(FC_KEYS.cards))?fcRead(FC_KEYS.cards):[];
  let changed=false;
  const normalized=expenses.map(e=>{
    const x={...e};
    if(!x.id){x.id=crypto.randomUUID();changed=true}
    if(!x.date&&x.dueDate){x.date=x.dueDate;changed=true}
    if(!x.dueDate&&x.date){x.dueDate=x.date;changed=true}
    if(x.status!=="pago"&&x.status!=="pendente"){x.status="pago";changed=true}
    if(!x.description)x.description="Sem descrição";
    if(!Number.isFinite(Number(x.amount))){x.amount=0;changed=true}else{x.amount=Math.round(Number(x.amount)*100)/100}
    if(x.payment!=="Cartão de crédito")x.payment="Conta bancária";
    if(x.cardId){const card=cards.find(c=>c.id===x.cardId);if(card){const due=fcCardDue(x.date,card);if(due&&x.dueDate!==due){x.dueDate=due;changed=true}}}
    return x;
  });
  if(changed)fcWrite(FC_KEYS.expenses,normalized);
}
function fcRefreshMonth(){
  const report=document.getElementById("reports");
  if(report&&!report.classList.contains("hidden")){
    const select=document.getElementById("reportPeriod");
    if(select)select.dispatchEvent(new Event("change"));
  }
}
function fcInstall(){
  fcNormalize();
  const amount=document.getElementById("expenseAmount");
  if(amount){amount.setAttribute("inputmode","decimal");amount.setAttribute("min","0.01");}
  const prev=document.getElementById("prevMonth"),next=document.getElementById("nextMonth");
  prev?.addEventListener("click",()=>setTimeout(fcRefreshMonth,0));
  next?.addEventListener("click",()=>setTimeout(fcRefreshMonth,0));
  window.addEventListener("storage",e=>{if(Object.values(FC_KEYS).includes(e.key))location.reload()});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fcInstall,{once:true});else fcInstall();