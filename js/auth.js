import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

const firebaseConfig={apiKey:"AIzaSyA2-FFv1_kdi8Q_NfHi9uQMWfb6LYge1zKQ",authDomain:"gestaofinanceira-ee882.firebaseapp.com",projectId:"gestaofinanceira-ee882",storageBucket:"gestaofinanceira-ee882.firebasestorage.app",messagingSenderId:"334105279920",appId:"1:334105279920:web:97628313aabced377eea75"};
const auth=getAuth(initializeApp(firebaseConfig));
const $=id=>document.getElementById(id);
let applicationLoaded=false;

function hideApplication(){
  document.body.classList.add("signed-out");
  document.querySelectorAll("body > header,body > nav,body > main,body > .fab,body > .modal").forEach(e=>e.classList.add("app-hidden"));
  $("loginScreen")?.classList.remove("hidden");
}

function showApplication(){
  $("loginScreen")?.classList.add("hidden");
}

async function loadApplication(){
  if(applicationLoaded)return;
  applicationLoaded=true;
  try{
    await import(`../app.js?auth=${Date.now()}`);
  }catch(err){
    applicationLoaded=false;
    console.error("Erro ao carregar o aplicativo:",err);
    hideApplication();
    $("loginError").textContent="O sistema encontrou um erro ao carregar. Atualize a página e tente novamente.";
  }
}

async function loginEmail(event){
  event?.preventDefault();
  const email=$("loginEmail").value.trim();
  const password=$("loginPassword").value;
  const button=$("loginButton");
  const error=$("loginError");
  if(!email||!password){error.textContent="Informe seu e-mail e sua senha.";return;}
  try{
    button.disabled=true;
    error.style.color="";
    error.textContent="Entrando...";
    await signInWithEmailAndPassword(auth,email,password);
  }catch(err){
    console.error(err);
    const messages={
      "auth/invalid-credential":"E-mail ou senha incorretos.",
      "auth/invalid-email":"Informe um e-mail válido.",
      "auth/too-many-requests":"Muitas tentativas. Aguarde alguns minutos e tente novamente.",
      "auth/user-disabled":"Esta conta está desativada."
    };
    error.textContent=messages[err.code]||"Não foi possível entrar. Tente novamente.";
    button.disabled=false;
  }
}

async function resetPassword(){
  const email=$("loginEmail").value.trim();
  const error=$("loginError");
  if(!email){error.textContent="Informe seu e-mail para receber o link de redefinição.";$("loginEmail").focus();return;}
  try{
    await sendPasswordResetEmail(auth,email);
    error.style.color="#15803d";
    error.textContent="Se esse e-mail estiver cadastrado, enviaremos as instruções para redefinir a senha.";
  }catch(err){
    console.error(err);
    error.style.color="#b91c1c";
    error.textContent="Não foi possível enviar a redefinição agora.";
  }
}

$("loginForm").addEventListener("submit",loginEmail);
$("resetPassword").addEventListener("click",resetPassword);
hideApplication();

onAuthStateChanged(auth,user=>{
  if(!user){
    applicationLoaded=false;
    hideApplication();
    if($("loginButton"))$("loginButton").disabled=false;
    return;
  }
  showApplication();
  loadApplication();
});
