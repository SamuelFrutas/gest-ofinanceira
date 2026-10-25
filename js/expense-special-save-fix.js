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