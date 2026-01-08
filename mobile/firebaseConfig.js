// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // 1. הוספנו את השורה הזו

const firebaseConfig = {
  apiKey: "AIzaSyAhL2kkTcznt-oePuQRfaa8t6vMtbmSOp8",
  authDomain: "buyforce-app-e12d0.firebaseapp.com",
  projectId: "buyforce-app-e12d0",
  storageBucket: "buyforce-app-e12d0.firebasestorage.app",
  messagingSenderId: "266182462184",
  appId: "1:266182462184:web:e22113d80505d697d3d75d",
  measurementId: "G-ETGMENNRBH"
};

// אתחול האפליקציה
const app = initializeApp(firebaseConfig);

// ייצוא שירות האימות
export const auth = getAuth(app);

// 2. הוספנו את השורה הזו - זה מה שהיה חסר לך!
export const db = getFirestore(app);