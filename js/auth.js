import { getApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

const auth = getAuth(getApp());
const $ = id => document.getElementById(id);

async function loginEmail(event){
  event?.preventDefault();
  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;
  const button = $("loginButton");
  const error = $("loginError");

  if(!email || !password){
    error.textContent = "Informe seu e-mail e sua senha.";
    return;
  }

  try{
    button.disabled = true;
    error.textContent = "Entrando...";
    await signInWithEmailAndPassword(auth, email, password);
  }catch(err){
    console.error(err);
    const messages = {
      "auth/invalid-credential":"E-mail ou senha incorretos.",
      "auth/invalid-email":"Informe um e-mail válido.",
      "auth/too-many-requests":"Muitas tentativas. Aguarde alguns minutos e tente novamente.",
      "auth/user-disabled":"Esta conta está desativada."
    };
    error.textContent = messages[err.code] || "Não foi possível entrar. Tente novamente.";
    button.disabled = false;
  }
}

async function resetPassword(){
  const email = $("loginEmail").value.trim();
  const error = $("loginError");
  if(!email){
    error.textContent = "Informe seu e-mail para receber o link de redefinição.";
    $("loginEmail").focus();
    return;
  }
  try{
    await sendPasswordResetEmail(auth, email);
    error.style.color = "#15803d";
    error.textContent = "Se esse e-mail estiver cadastrado, enviaremos as instruções para redefinir a senha.";
  }catch(err){
    console.error(err);
    error.style.color = "#b91c1c";
    error.textContent = "Não foi possível enviar a redefinição agora.";
  }
}

$("loginForm").addEventListener("submit", loginEmail);
$("resetPassword").addEventListener("click", resetPassword);
