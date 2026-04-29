import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBT6Mf4GfKMGuasdPp6ZmY2MwyKX41EoPA",
  authDomain: "dailytracker-2026.firebaseapp.com",
  projectId: "dailytracker-2026",
  storageBucket: "dailytracker-2026.firebasestorage.app",
  messagingSenderId: "977139174808",
  appId: "1:977139174808:web:a999a51a07f038aa886fed",
  measurementId: "G-ST402T3BB5"
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);