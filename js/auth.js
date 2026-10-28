import "./financial-core-fix.js";
import "./final-stabilization.js";

// Login próprio da Gestão Financeira: senha única, sem Firebase Authentication.
const PASSWORD_HASH="e29ab9450f6f2b102abfe58ae59a244fa2cb74a5ae8da3b6cf030c90514b9a4b";
const SESSION_KEY="gf_unlocked";
const DB_NAME="gestao_financeira_auth";
const STORE_NAME="credentials";
const $=id=>document.getElementById(id);

function hash(text){const data=new TextEncoder().encode(text);return crypto.subtle.digest("SHA-256",data).then(b=>Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join(""))}
function openDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE_NAME))req.result.createObjectStore(STORE_NAME,{keyPath:"id"})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function seedDatabase(){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE_NAME,"readwrite"),store=tx.objectStore(STORE_NAME),get=store.get("main");get.onsuccess=()=>{if(!get.result)store.put({id:"main",passwordHash:PASSWORD_HASH});};tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}
async function checkPassword(password){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE_NAME,"readonly"),get=tx.objectStore(STORE_NAME).get("main");get.onsuccess=async()=>{try{const saved=get.result?.passwordHash||PASSWORD_HASH;resolve((await hash(password))===saved)}catch(e){reject(e)}finally{db.close()}};get.onerror=()=>{db.close();reject(get.error)}})}
function hideApplication(){document.body.classList.add("signed-out");document.querySelectorAll("body > header,body > nav,body > main,body > .fab,body > .modal").forEach(e=>e.classList.add("app-hidden"));$("loginScreen")?.classList.remove("hidden")}
function showApplication(){document.body.classList.remove("signed-out");document.querySelectorAll("body > header,body > nav,body > main,body > .fab,body > .modal").forEach(e=>e.classList.remove("app-hidden"));$("loginScreen")?.classList.add("hidden");if($("userName"))$("userName").textContent="Samuel"}
function lock(){sessionStorage.removeItem(SESSION_KEY);hideApplication();if($("loginPassword"))$("loginPassword").value=""}
async function login(event){event?.preventDefault();const password=$("loginPassword")?.value||"",button=$("loginButton"),error=$("loginError");if(!password){error.textContent="Digite a senha.";return}button.disabled=true;error.textContent="Verificando...";try{const ok=await checkPassword(password);if(!ok){error.textContent="Senha incorreta.";button.disabled=false;return}sessionStorage.setItem(SESSION_KEY,"1");showApplication();error.textContent="";button.disabled=false;setTimeout(showApplication,300);setTimeout(showApplication,1200)}catch(e){console.error("LOGIN_LOCAL",e);error.textContent="Não foi possível verificar a senha.";button.disabled=false}}

await seedDatabase();
$("loginForm")?.addEventListener("submit",login);
$("logoutButton")?.addEventListener("click",e=>{e.preventDefault();lock()});
$("resetPassword")?.remove();
if(sessionStorage.getItem(SESSION_KEY)==="1")showApplication();else hideApplication();

// O app antigo ainda possui o listener de autenticação do Firebase; este observador
// mantém o login próprio como autoridade da tela, sem exigir conta ou e-mail.
setInterval(()=>{if(sessionStorage.getItem(SESSION_KEY)==="1")showApplication()},1500);