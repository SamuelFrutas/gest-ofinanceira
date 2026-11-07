import { auth } from './firebase.js';
import { onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';

const el = id => document.getElementById(id);
const loginScreen = el('loginScreen');
const appShell = el('appShell');
const form = el('loginForm');
const errorBox = el('loginError');
const submit = el('loginSubmit');

function showApp(user) {
  loginScreen.classList.toggle('hidden', !!user);
  appShell.classList.toggle('app-hidden', !user);
}

function message(text, isError = true) {
  errorBox.textContent = text;
  errorBox.style.color = isError ? '#b91c1c' : '#15803d';
}

onAuthStateChanged(auth, user => {
  showApp(user);
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const email = el('loginEmail').value.trim();
  const password = el('loginPassword').value;
  submit.disabled = true;
  submit.textContent = 'Entrando...';
  message('');
  try {
    await signInWithEmailAndPassword(auth, email, password);
    form.reset();
  } catch (error) {
    const messages = {
      'auth/invalid-email': 'Confira o formato do e-mail.',
      'auth/invalid-credential': 'E-mail ou senha incorretos.',
      'auth/user-disabled': 'Esta conta está desativada.',
      'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.'
    };
    message(messages[error.code] || 'Não foi possível entrar. Confira seus dados e tente novamente.');
  } finally {
    submit.disabled = false;
    submit.textContent = 'Entrar';
  }
});

el('togglePassword').addEventListener('click', () => {
  const input = el('loginPassword');
  const visible = input.type === 'password';
  input.type = visible ? 'text' : 'password';
  el('togglePassword').textContent = visible ? 'Ocultar' : 'Mostrar';
  el('togglePassword').setAttribute('aria-label', visible ? 'Ocultar senha' : 'Mostrar senha');
});

el('forgotPassword').addEventListener('click', async () => {
  const email = el('loginEmail').value.trim();
  if (!email) {
    message('Digite seu e-mail acima para receber o link de recuperação.');
    el('loginEmail').focus();
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    message('Se esse e-mail estiver cadastrado, você receberá um link para redefinir a senha.', false);
  } catch {
    message('Não foi possível enviar o e-mail de recuperação. Confira o endereço e tente novamente.');
  }
});

el('logoutButton').addEventListener('click', async () => {
  try { await signOut(auth); }
  catch { message('Não foi possível sair da conta.'); }
});
