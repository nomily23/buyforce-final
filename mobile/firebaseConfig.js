import { initializeApp } from 'firebase/app';
// הוספנו את Platform כדי לזהות אם אנחנו בטלפון או במחשב
import { Platform } from 'react-native';
// הוספתי כאן את setPersistence כדי שהאתר לא יקרוס
import { getAuth, initializeAuth, getReactNativePersistence, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// --- אתחול שירותים עם בדיקת סביבה (Web vs Mobile) ---

// הוספתי כאן שורת הסבר למחשב (הערה) כדי שלא יהיה אדום ב-register.tsx
/** @type {import("firebase/auth").Auth} */
let auth;

if (Platform.OS === 'web') {
  // בדפדפן: השתמש בשיטה הרגילה של הדפדפן
  auth = getAuth(app);
  // תיקון קטן: הפקודה נכתבת ככה בגרסה החדשה (אחרת האתר קורס)
  setPersistence(auth, browserLocalPersistence);
} else {
  // בטלפון (אנדרואיד/אייפון): השתמש ב-AsyncStorage
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

// ייצוא המשתנה auth שהוגדר למעלה
export { auth };

// 2. Database
export const db = getFirestore(app);

// 3. Storage
export const storage = getStorage(app);

// 4. Analytics
export const analytics = isSupported().then((yes) => yes ? getAnalytics(app) : null);

export default app;