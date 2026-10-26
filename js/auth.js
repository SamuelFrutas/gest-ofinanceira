import { getApps, getApp, initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

// O app principal e o módulo de login são carregados como módulos independentes.
// Por isso, não podemos assumir que app.js já criou o Firebase App quando este
// arquivo executar. Reutilizamos o app existente ou criamos o mesmo app uma vez.
const firebaseConfig={apiKey:"AIzaSyA2-FFv1_kdi8Q_NfHi9uQMWfb6LYge1zKQ",authDomain:"gestaofinanceira-ee882.firebaseapp.com",projectId:"gestaofinanceira-ee882",storageBucket:"gestaofinanceira-ee882.firebasestorage.app",messagingSenderId:"334105279920",appId:"1:334105279920:web:97628313aabced377eea75"};
const firebaseApp=getApps().length?getApp():initializeApp(firebaseConfig);
const auth=getAuth(firebaseApp);
const $=id=>document.getElementById(id);

async function loginEmail(event){
  event?.preventDefault();
  const email=$("loginEmail")?.value.trim()||"";
  const password=$("loginPassword")?.value||"";
  const button=$("loginButton");
  const error=$("loginError");
  if(!email||!password){error.textContent="Informe seu e-mail e sua senha.";return}
  try{
    button.disabled=true;
    error.style.color="";
    error.textContent="Entrando...";
    await signInWithEmailAndPassword(auth,email,password);
  }catch(err){
    console.error("Erro no login:",err);
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
  const email=$("loginEmail")?.value.trim()||"";
  const error=$("loginError");
  if(!email){error.textContent="Informe seu e-mail para receber o link de redefinição.";$("loginEmail")?.focus();return}
  try{
    await sendPasswordResetEmail(auth,email);
    error.style.color="#15803d";
    error.textContent="Se esse e-mail estiver cadastrado, enviaremos as instruções para redefinir a senha.";
  }catch(err){
    console.error("Erro ao redefinir senha:",err);
    error.style.color="#b91c1c";
    error.textContent="Não foi possível enviar a redefinição agora.";
  }
}

const form=$("loginForm");
const reset=$("resetPassword");
if(form)form.addEventListener("submit",loginEmail);
if(reset)reset.addEventListener("click",resetPassword);
