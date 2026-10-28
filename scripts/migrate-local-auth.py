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
p.write_text(s)
