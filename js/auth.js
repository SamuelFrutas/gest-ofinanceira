import { getApps, getApp, initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

const firebaseConfig={apiKey:"AIzaSyA2-FFv1_kdi8Q_NfHi9uQMWfb6LYge1zKQ",authDomain:"gestaofinanceira-ee882.firebaseapp.com",projectId:"gestaofinanceira-ee882",storageBucket:"gestaofinanceira-ee882.firebasestorage.app",messagingSenderId:"334105279920",appId:"1:334105279920:web:97628313aabced377eea75"};
const firebaseApp=getApps().length?getApp():initializeApp(firebaseConfig);
const auth=getAuth(firebaseApp);
const $=id=>document.getElementById(id);

function setSignedIn(user){
  document.body.classList.toggle("signed-out",!user);
  $("loginScreen")?.classList.toggle("hidden",!!user);
  document.querySelectorAll("body > header,body > nav,body > main,body > .fab").forEach(el=>el.classList.toggle("app-hidden",!user));
  if(user)window.dispatchEvent(new CustomEvent("gf-auth-ready",{detail:{user}}));
}
function showError(text){const el=$("loginError");if(el)el.textContent=text}
function message(e){const c=e?.code||"";if(c.includes("invalid-credential")||c.includes("wrong-password")||c.includes("user-not-found"))return"E-mail ou senha incorretos.";if(c.includes("invalid-email"))return"Informe um e-mail válido.";if(c.includes("too-many-requests"))return"Muitas tentativas. Aguarde alguns minutos e tente novamente.";if(c.includes("network-request-failed"))return"Sem conexão com a internet.";if(c.includes("user-disabled"))return"Esta conta está desativada.";return"Não foi possível entrar. Tente novamente."}
async function login(e){e?.preventDefault();const email=$("loginEmail")?.value.trim()||"",password=$("loginPassword")?.value||"",button=$("loginButton");if(!email||!password){showError("Informe seu e-mail e sua senha.");return}if(button)button.disabled=true;showError("Entrando...");try{await signInWithEmailAndPassword(auth,email,password)}catch(err){console.error("LOGIN_ERROR",err);showError(message(err));if(button)button.disabled=false}}
async function reset(){const email=$("loginEmail")?.value.trim()||"";if(!email){showError("Informe seu e-mail para receber o link de redefinição.");$("loginEmail")?.focus();return}try{await sendPasswordResetEmail(auth,email);showError("Se esse e-mail estiver cadastrado, enviaremos as instruções para redefinir a senha.")}catch(err){console.error(err);showError("Não foi possível enviar a redefinição agora.")}}
function init(){const form=$("loginForm");if(form&&!form.dataset.authBound){form.dataset.authBound="1";form.addEventListener("submit",login)}const resetBtn=$("resetPassword");if(resetBtn&&!resetBtn.dataset.authBound){resetBtn.dataset.authBound="1";resetBtn.addEventListener("click",reset)}const logout=$("logoutBtn");if(logout&&!logout.dataset.authBound){logout.dataset.authBound="1";logout.addEventListener("click",()=>signOut(auth))}onAuthStateChanged(auth,setSignedIn)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
