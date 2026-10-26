import { getApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const auth=getAuth(getApp()),db=getFirestore(getApp());
const money=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0);
const monthNames=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

function ensurePaymentModal(){
  if(document.getElementById("paymentConfirmModal"))return;
  const style=document.createElement("style");
  style.textContent=`#paymentConfirmModal{position:fixed;inset:0;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;padding:18px;z-index:99999}#paymentConfirmModal[hidden]{display:none!important}.gf-payment-dialog{width:min(360px,100%);background:#fff;border-radius:18px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.25)}.gf-payment-dialog h3{margin:0 0 8px;font-size:19px}.gf-payment-dialog p{margin:0;color:#64748b;line-height:1.45}.gf-payment-dialog .gf-payment-info{margin:14px 0;padding:12px;border-radius:12px;background:#f8fafc}.gf-payment-dialog .gf-payment-info strong{display:block;color:#17221b}.gf-payment-dialog .gf-payment-info span{display:block;margin-top:4px;font-weight:700}.gf-payment-actions{display:flex;gap:9px;margin-top:16px}.gf-payment-actions button{flex:1;border:0;border-radius:11px;padding:11px 12px;font-weight:700;cursor:pointer}.gf-payment-cancel{background:#e5e7eb;color:#374151}.gf-payment-ok{background:#16a34a;color:#fff}.gf-payment-ok.danger{background:#dc2626}`;
  document.head.appendChild(style);
  const modal=document.createElement("div");
  modal.id="paymentConfirmModal";
  modal.hidden=true;
  modal.innerHTML=`<div class="gf-payment-dialog" role="dialog" aria-modal="true"><h3 id="paymentConfirmTitle">Confirmar pagamento</h3><p id="paymentConfirmText">Confirme esta alteração.</p><div class="gf-payment-info"><strong id="paymentConfirmDescription"></strong><span id="paymentConfirmAmount"></span></div><div class="gf-payment-actions"><button type="button" class="gf-payment-cancel" id="paymentConfirmCancel">Cancelar</button><button type="button" class="gf-payment-ok" id="paymentConfirmOk">Confirmar</button></div></div>`;
  document.body.appendChild(modal);
  modal.addEventListener("click",e=>{if(e.target===modal)closePaymentModal()});
  document.getElementById("paymentConfirmCancel").addEventListener("click",e=>{e.preventDefault();e.stopPropagation();closePaymentModal()});
}
let pendingAction=null;
function closePaymentModal(){
  const m=document.getElementById("paymentConfirmModal");
  if(m)m.hidden=true;
  pendingAction=null;
}
function askPayment(ids,description,amount,currentStatus,isInvoice=false){
  ensurePaymentModal();
  const paid=currentStatus!=="pago";
  document.getElementById("paymentConfirmTitle").textContent=paid?(isInvoice?"Confirmar pagamento da fatura":"Confirmar pagamento"):"Reabrir pagamento";
  document.getElementById("paymentConfirmText").textContent=paid?(isInvoice?"Confirme que deseja marcar esta fatura como paga.":"Confirme que deseja marcar esta despesa como paga."):"Confirme que deseja reabrir este pagamento.";
  document.getElementById("paymentConfirmDescription").textContent=description||"Pagamento";
  document.getElementById("paymentConfirmAmount").textContent=money(amount);
  const ok=document.getElementById("paymentConfirmOk");
  ok.textContent=paid?"Marcar como pago":"Reabrir";
  ok.classList.toggle("danger",!paid);
  pendingAction={ids:Array.isArray(ids)?ids:[ids],status:paid?"pago":"pendente"};
  ok.disabled=false;
  ok.onclick=async e=>{e.preventDefault();const action=pendingAction;if(!action)return;ok.disabled=true;try{await updatePayments(action.ids,action.status)}catch(e){console.error(e);alert("Não foi possível atualizar o pagamento.");}finally{ok.disabled=false}};
  document.getElementById("paymentConfirmModal").hidden=false;
}
async function updatePayments(ids,status){
  const user=auth.currentUser;if(!user)throw new Error("Usuário não autenticado.");
  const ref=doc(db,"users",user.uid,"data","main"),snap=await getDoc(ref);if(!snap.exists())throw new Error("Dados não encontrados.");
  const data=snap.data(),expenses=Array.isArray(data.expenses)?[...data.expenses]:[];let changed=false;
  expenses.forEach(e=>{if(ids.includes(e.id)){e.status=status;changed=true}});
  if(!changed)return;
  await setDoc(ref,{...data,expenses,updatedAt:new Date().toISOString()});
  localStorage.setItem("gf_expenses",JSON.stringify(expenses));
  location.reload();
}
window.markExpensePaid=async id=>{let list=[];try{list=JSON.parse(localStorage.getItem("gf_expenses")||"[]")}catch{}const e=list.find(x=>x.id===id);if(e)askPayment(e.id,e.description,e.amount,e.status,false)};

document.addEventListener("click",event=>{
  const button=event.target.closest(".gf-toggle-bank");
  if(button){event.preventDefault();event.stopImmediatePropagation();let list=[];try{list=JSON.parse(localStorage.getItem("gf_expenses")||"[]")}catch{}const e=list.find(x=>x.id===button.dataset.id);if(e)askPayment(e.id,e.description,e.amount,e.status,false);return}
  const invoiceButton=event.target.closest("#payInvoice,#reopenInvoice");
  if(!invoiceButton)return;
  event.preventDefault();event.stopImmediatePropagation();
  let expenses=[],cards=[];try{expenses=JSON.parse(localStorage.getItem("gf_expenses")||"[]");cards=JSON.parse(localStorage.getItem("gf_cards")||"[]")}catch{}
  const cardName=(document.getElementById("cardTitle")?.textContent||"").replace(/^Fatura\s*/i,"").trim();
  const card=cards.find(c=>c.name===cardName)||cards.find(c=>cardName.toLowerCase().includes(String(c.name||"").toLowerCase()));
  const label=(document.getElementById("invoiceMonth")?.textContent||"").toLowerCase();
  const mi=monthNames.findIndex(m=>label.includes(m));const year=label.match(/20\d{2}/)?.[0];
  let target=expenses.filter(e=>e.payment==="Cartão de crédito"&&e.cardId===card?.id);
  if(mi>=0&&year)target=target.filter(e=>{const d=new Date(`${e.dueDate||e.date}T12:00:00`);return d.getMonth()===mi&&String(d.getFullYear())===year});
  if(!target.length){alert("Não foi possível identificar os lançamentos desta fatura.");return}
  const paid=target.every(e=>e.status==="pago");const total=target.reduce((s,e)=>s+Number(e.amount||0),0);
  askPayment(target.map(e=>e.id),`Fatura ${card?.name||"do cartão"}`,total,paid?"pago":"pendente",true);
},true);
