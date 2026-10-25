import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA2-FFv1_kdi8Q_NfHi9uQMWfb6LYge1zQ",
  authDomain: "gestaofinanceira-ee882.firebaseapp.com",
  projectId: "gestaofinanceira-ee882",
  storageBucket: "gestaofinanceira-ee882.firebasestorage.app",
  messagingSenderId: "334105279920",
  appId: "1:334105279920:web:97628313aabced377eea75"
};

const app = initializeApp(firebaseConfig, "auth-guard");
const auth = getAuth(app);
const ALLOWED_EMAIL = "samuelmarvila17@gmail.com";

onAuthStateChanged(auth, async user => {
  if (user && user.email?.toLowerCase() !== ALLOWED_EMAIL) {
    const error = document.getElementById("loginError");
    if (error) error.textContent = "Esta conta Google não tem autorização para acessar o sistema.";
    await signOut(auth);
  }
});
