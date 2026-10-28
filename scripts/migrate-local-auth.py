from pathlib import Path
import re

p=Path('app.js')
s=p.read_text()
s=s.replace('import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";\n','')
s=s.replace('import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";\n','')
s=s.replace('import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";\n\n','')
s=re.sub(r'const firebaseConfig=.*?;\n','',s,count=1)
s=s.replace('const firebaseApp=initializeApp(firebaseConfig),auth=getAuth(firebaseApp),db=getFirestore(firebaseApp),$=id=>document.getElementById(id);','const $=id=>document.getElementById(id);')
s=s.replace('const saveLocal=()=>{localStorage.setItem("gf_expenses",JSON.stringify(state.expenses));localStorage.setItem("gf_cards",JSON.stringify(state.cards));localStorage.setItem("gf_categories",JSON.stringify(state.categories));localStorage.setItem("gf_settings",JSON.stringify(state.settings))};let saveTimer=null;','const saveLocal=()=>{localStorage.setItem("gf_expenses",JSON.stringify(state.expenses));localStorage.setItem("gf_cards",JSON.stringify(state.cards));localStorage.setItem("gf_categories",JSON.stringify(state.categories));localStorage.setItem("gf_settings",JSON.stringify(state.settings))};')
s=re.sub(r'function save\(\)\{saveLocal\(\);if\(!state\.user\)return Promise\.resolve\(\);.*?return Promise\.resolve\(\)\}\nasync function saveCloud.*?\nfunction migrateData', 'function save(){saveLocal();return Promise.resolve()}\nfunction migrateData', s, flags=re.S)
s=re.sub(r'function showAuthError\(e\)\{.*?\}\nasync function logout\(\)\{await signOut\(auth\)\}', 'function showAuthError(e){console.error(e)}\nfunction logout(){sessionStorage.removeItem("gf_unlocked");location.reload()}', s)
s=re.sub(r'\nonAuthStateChanged\(auth,async user=>\{.*?\}\);\s*$', '\nif(sessionStorage.getItem("gf_unlocked")==="1"){state.user={uid:"local"};setAppVisible(true);renderDashboard()}else setAppVisible(false);\n', s, flags=re.S)
# Dia de vencimento: permitir 1-31 e, nos meses menores, usar o ultimo dia do mes.
s=s.replace('const day=Math.min(28,Number(f.fixedDay)||dateKey(f.dueDate||f.date).getDate());for(let i=0;i<60;i++){const d=addMonths(base,i+(i===0&&base.getDate()>day?1:0));d.setDate(day);','const day=Math.min(31,Math.max(1,Number(f.fixedDay)||dateKey(f.dueDate||f.date).getDate()));for(let i=0;i<60;i++){const d=addMonths(base,i+(i===0&&base.getDate()>day?1:0));d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()));')
p.write_text(s)

ip=Path('index.html')
html=ip.read_text()
html=html.replace('name="fixedDay" type="number" min="1" max="28"','name="fixedDay" type="number" min="1" max="31"')
ip.write_text(html)
