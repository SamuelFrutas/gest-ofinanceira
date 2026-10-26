import { getApp, getApps } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

let editingCardId=null;
const moneyToNumber=s=>Number(String(s||"").replace(/\./g,"").replace(",",".").replace(/[^0-9.-]/g,""))||0;
const esc=s=>String(s??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

function cards(){try{return JSON.parse(localStorage.getItem("gf_cards")||"[]")}catch{return []}}
function saveLocalCards(v){localStorage.setItem("gf_cards",JSON.stringify(v))}
function resetCardModal(){editingCardId=null;const title=document.querySelector("#cardModal .modal-head h2"),button=document.querySelector("#cardForm .save-btn");if(title)title.textContent="Novo cartão";if(button)button.textContent="Salvar cartão"}
function openEditCard(id){
  const card=cards().find(c=>c.id===id);if(!card)return;
  editingCardId=id;
  const form=document.getElementById("cardForm");if(!form)return;
  document.querySelector("#cardModal .modal-head h2").textContent="Editar cartão";
  form.name.value=card.name||"";form.bank.value=card.bank||"";form.limit.value=String(card.limit||0).replace(".",",");form.closing.value=card.closing||"";form.due.value=card.due||"";
  document.getElementById("cardModal").classList.remove("hidden");
  form.name.focus();
}
function addEditButtons(){
  const box=document.getElementById("cardsList");if(!box)return;
  const list=cards();
  [...box.querySelectorAll(".card")].forEach((cardEl,i)=>{
    if(cardEl.querySelector(".gf-edit-card"))return;
    const card=list[i];if(!card)return;
    const area=document.createElement("div");area.className="gf-card-edit-area";
    area.innerHTML=`<button type="button" class="secondary-btn gf-edit-card" data-card-id="${esc(card.id)}">✏️ Editar cartão</button>`;
    cardEl.appendChild(area);
    area.querySelector("button").addEventListener("click",()=>openEditCard(card.id));
  });
}
async function saveEditedCard(form){
  const all=cards(),idx=all.findIndex(c=>c.id===editingCardId);if(idx<0)return;
  const name=form.name.value.trim();if(!name){alert("Informe o nome do cartão.");return}
  const limit=moneyToNumber(form.limit.value);if(limit<0){alert("Informe um limite válido.");return}
  const closing=form.closing.value?Number(form.closing.value):"";
  const due=form.due.value?Number(form.due.value):"";
  if(closing&&(closing<1||closing>31)||due&&(due<1||due>31)){alert("As datas devem ficar entre 1 e 31.");return}
  all[idx]={...all[idx],name,bank:form.bank.value.trim(),limit,closing,due};
  saveLocalCards(all);
  const appReady=()=>getApps().length>0;
  if(!appReady()){alert("Aguarde o sistema terminar de carregar e tente novamente.");return}
  const user=getAuth(getApp()).currentUser;if(!user){alert("Sua sessão expirou. Entre novamente.");return}
  try{
    const ref=doc(getFirestore(getApp()),"users",user.uid,"data","main"),snap=await getDoc(ref);
    if(!snap.exists())throw new Error("Dados financeiros não encontrados.");
    const data=snap.data();await setDoc(ref,{...data,cards:all,updatedAt:new Date().toISOString()});
    editingCardId=null;
    document.getElementById("cardModal").classList.add("hidden");
    resetCardModal();
    document.querySelector('.nav-item[data-page="cards"]')?.click();
  }catch(error){console.error(error);alert("Não foi possível salvar as alterações do cartão. Tente novamente.")}
}

document.addEventListener("DOMContentLoaded",()=>{
  const style=document.createElement("style");style.textContent=`.gf-card-edit-area{display:flex;gap:8px;margin-top:8px}.gf-edit-card{width:100%}`;document.head.appendChild(style);
  const form=document.getElementById("cardForm");
  form?.addEventListener("submit",event=>{
    if(!editingCardId)return;
    event.preventDefault();event.stopImmediatePropagation();saveEditedCard(form);
  },true);
  document.getElementById("closeCardModal")?.addEventListener("click",()=>resetCardModal());
  document.getElementById("addCard")?.addEventListener("click",()=>resetCardModal());
  const box=document.getElementById("cardsList");
  if(box)new MutationObserver(addEditButtons).observe(box,{childList:true,subtree:true});
  setInterval(addEditButtons,500);
});
