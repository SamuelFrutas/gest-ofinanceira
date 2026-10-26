import { getApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const auth=getAuth(getApp()),db=getFirestore(getApp());
const dateOnly=s=>new Date(`${s}T12:00:00`);
const iso=d=>new Date(d).toISOString().slice(0,10);
const addMonths=(s,n)=>{const d=dateOnly(s);d.setMonth(d.getMonth()+n);return d};
const parseMoney=s=>Number(String(s||"").replace(/\./g,"").replace(",",".").replace(/[^0-9.-]/g,""))||0;

async function saveSpecialExpense(form){
  const user=auth.currentUser;
  if(!user) throw new Error("Usuário não autenticado.");
  const amount=parseMoney(form.amount.value);
  if(amount<=0) throw new Error("Informe um valor válido.");
  if(!form.description.value.trim()) throw new Error("Informe a descrição.");
  if(form.payment.value==="Cartão de crédito"&&!form.cardId.value) throw new Error("Selecione um cartão.");
  const ref=doc(db,"users",user.uid,"data","main"),snap=await getDoc(ref),cloud=snap.exists()?snap.data():{};
  const expenses=Array.isArray(cloud.expenses)?[...cloud.expenses]:[],cards=Array.isArray(cloud.cards)?cloud.cards:[],categories=Array.isArray(cloud.categories)?cloud.categories:[],settings=cloud.settings||{tithePercent:10};
  const seriesId=crypto.randomUUID(),base=form.date.value,payment=form.payment.value,card=payment==="Cartão de crédito"?cards.find(c=>c.id===form.cardId.value):null;
  if(form.fixed.checked){
    const day=Math.min(28,Math.max(1,Number(form.fixedDay.value)||dateOnly(form.dueDate.value||base).getDate()));
    for(let i=0;i<60;i++){const d=addMonths(base,i);d.setDate(day);const date=iso(d);expenses.push({id:crypto.randomUUID(),seriesId,seriesType:"fixed",description:form.description.value.trim(),amount,date,dueDate:date,fixedDay:day,category:form.category.value,type:form.type.value,payment,note:form.note.value||"",cardId:card?.id||null,status:"pendente"})}
  }else{
    const n=Math.max(2,Number(form.installments.value)||2),cents=Math.round(amount*100),part=Math.floor(cents/n),rest=cents-part*n;
    for(let i=0;i<n;i++){
      const d=form.interval.value==="week"?new Date(`${base}T12:00:00`):addMonths(base,i);if(form.interval.value==="week")d.setDate(d.getDate()+i*7);
      const date=iso(d),value=(part+(i===n-1?rest:0))/100;
      let due=i===0?(form.dueDate.value||date):date;
      if(card){const x=new Date(`${date}T12:00:00`),closing=Number(card.closing)||31,dueDay=Number(card.due)||10;if(x.getDate()>closing)x.setMonth(x.getMonth()+1);due=iso(new Date(x.getFullYear(),x.getMonth(),Math.min(dueDay,28),12))}
      expenses.push({id:crypto.randomUUID(),seriesId,seriesType:"installment",installmentNumber:i+1,installmentTotal:n,description:form.description.value.trim(),amount:value,date,dueDate:due,category:form.category.value,type:form.type.value,payment,note:form.note.value||"",cardId:card?.id||null,status:"pendente"});
    }
  }
  await setDoc(ref,{expenses,cards,categories,settings,updatedAt:new Date().toISOString()});
  localStorage.setItem("gf_expenses",JSON.stringify(expenses));localStorage.setItem("gf_cards",JSON.stringify(cards));localStorage.setItem("gf_categories",JSON.stringify(categories));localStorage.setItem("gf_settings",JSON.stringify(settings));
}

document.addEventListener("submit",async event=>{
  const form=event.target;if(form?.id!=="expenseForm")return;
  const fixed=form.fixed?.checked,bankInstallment=form.installment?.checked&&form.payment?.value==="Conta bancária";
  if(!fixed&&!bankInstallment)return;
  event.preventDefault();event.stopImmediatePropagation();
  const button=form.querySelector(".save-btn");if(button)button.disabled=true;
  try{await saveSpecialExpense(form);document.getElementById("expenseModal")?.classList.add("hidden");location.reload()}catch(error){console.error("Erro ao salvar despesa especial:",error);alert(error?.message||"Não foi possível salvar a despesa.");if(button)button.disabled=false}
},true);

function paymentConfirmationModal(){
  let modal=document.getElementById("paymentConfirmModal");
  if(modal)return modal;
  modal=document.createElement("div");
  modal.id="paymentConfirmModal";
  modal.innerHTML=`<div class="payment-confirm-backdrop"></div><div class="payment-confirm-box" role="dialog" aria-modal="true" aria-labelledby="paymentConfirmTitle"><div class="payment-confirm-icon">✓</div><h3 id="paymentConfirmTitle">Confirmar pagamento</h3><p id="paymentConfirmText">Deseja realmente marcar esta despesa como paga?</p><div class="payment-confirm-actions"><button type="button" class="payment-confirm-cancel">Cancelar</button><button type="button" class="payment-confirm-ok">Marcar como pago</button></div></div>`;
  const style=document.createElement("style");
  style.textContent=`#paymentConfirmModal{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px}#paymentConfirmModal.hidden{display:none}.payment-confirm-backdrop{position:absolute;inset:0;background:rgba(15,23,42,.42);backdrop-filter:blur(2px)}.payment-confirm-box{position:relative;width:min(360px,100%);background:#fff;border-radius:18px;padding:22px;box-shadow:0 20px 60px rgba(15,23,42,.25);text-align:center;animation:paymentPop .16s ease-out}.payment-confirm-icon{width:42px;height:42px;margin:0 auto 10px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#dcfce7;color:#15803d;font-size:22px;font-weight:800}.payment-confirm-box h3{margin:0 0 7px;font-size:18px;color:#17221b}.payment-confirm-box p{margin:0;color:#64748b;font-size:14px;line-height:1.45}.payment-confirm-actions{display:flex;gap:9px;margin-top:18px}.payment-confirm-actions button{flex:1;border:0;border-radius:11px;padding:11px 10px;font-weight:700;cursor:pointer}.payment-confirm-cancel{background:#f1f5f9;color:#334155}.payment-confirm-ok{background:#16a34a;color:#fff}.payment-confirm-actions button:disabled{opacity:.6;cursor:not-allowed}@keyframes paymentPop{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}`;
  document.head.appendChild(style);document.body.appendChild(modal);return modal;
}

async function confirmAndMarkPaid(id,button){
  const modal=paymentConfirmationModal();
  modal.classList.remove("hidden");
  const ok=modal.querySelector(".payment-confirm-ok"),cancel=modal.querySelector(".payment-confirm-cancel"),backdrop=modal.querySelector(".payment-confirm-backdrop");
  const close=()=>{modal.classList.add("hidden");ok.disabled=false};
  ok.disabled=false;
  const expenseId=id;
  const expenseName=JSON.parse(localStorage.getItem("gf_expenses")||"[]").find(e=>e.id===expenseId)?.description;
  const text=modal.querySelector("#paymentConfirmText");if(text)text.textContent=expenseName?`Deseja realmente marcar “${expenseName}” como paga?`:"Deseja realmente marcar esta despesa como paga?";
  const handler=async()=>{
    ok.disabled=true;
    try{
      const user=auth.currentUser;if(!user)throw new Error("Usuário não autenticado.");
      const ref=doc(db,"users",user.uid,"data","main"),snap=await getDoc(ref);if(!snap.exists())throw new Error("Dados financeiros não encontrados.");
      const data=snap.data(),expenses=Array.isArray(data.expenses)?[...data.expenses]:[],item=expenses.find(e=>e.id===expenseId);if(!item)throw new Error("Despesa não encontrada.");
      item.status="pago";
      await setDoc(ref,{...data,expenses,updatedAt:new Date().toISOString()});
      localStorage.setItem("gf_expenses",JSON.stringify(expenses));
      close();
      if(typeof window.renderAllVisible==="function")window.renderAllVisible();
      else window.location.reload();
    }catch(error){console.error("Erro ao confirmar pagamento:",error);alert(error?.message||"Não foi possível marcar a despesa como paga.");ok.disabled=false}
  };
  ok.onclick=handler;cancel.onclick=close;backdrop.onclick=close;
  const keyHandler=e=>{if(e.key==="Escape"){close();document.removeEventListener("keydown",keyHandler)}};document.addEventListener("keydown",keyHandler);
}

document.addEventListener("click",event=>{
  const button=event.target.closest("button");if(!button)return;
  const label=(button.textContent||"").trim().toLowerCase();
  if(label!=="marcar pago")return;
  let id=button.dataset.id||"";
  if(!id){const onclick=button.getAttribute("onclick")||"";id=onclick.match(/markExpensePaid\(['\"]([^'\"]+)['\"]\)/)?.[1]||""}
  if(!id)return;
  event.preventDefault();event.stopImmediatePropagation();
  confirmAndMarkPaid(id,button);
},true);
