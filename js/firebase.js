import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyA2-FFv1_kdi8Q_NfHi9uQMWfb6LYge1zQ",
  authDomain: "gestaofinanceira-ee882.firebaseapp.com",
  projectId: "gestaofinanceira-ee882",
  storageBucket: "gestaofinanceira-ee882.firebasestorage.app",
  messagingSenderId: "334105279920",
  appId: "1:334105279920:web:97628313aabced377eea75"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
