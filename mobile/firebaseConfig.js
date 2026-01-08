// firebaseConfig.js
import { initializeApp } from 'firebase/app';
// 1. Auth - אימות משתמשים
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
// 2. Firestore - מסד נתונים
import { getFirestore } from 'firebase/firestore';
// 3. Storage - שמירת תמונות (מוצרים/פרופיל)
import { getStorage } from 'firebase/storage';
// 4. Analytics - דרישת PRD (סטטיסטיקות)
import { getAnalytics, isSupported } from 'firebase/analytics';
// 5. AsyncStorage - לשמירת חיבור משתמש גם כשסוגרים את האפליקציה
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

// --- אתחול שירותים ---

// 1. Auth עם שמירה מקומית (כדי שהמשתמש לא יתנתק כל פעם שיוצאים מהאפליקציה)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// 2. Database
export const db = getFirestore(app);

// 3. Storage (בשביל תמונות פרופיל ותמונות מוצרים)
export const storage = getStorage(app);

// 4. Analytics (רץ רק אם הסביבה תומכת בזה, למניעת קריסות)
// זה עונה על הדרישה ב-PRD: "Firebase Analytics -> user events"
export const analytics = isSupported().then((yes) => yes ? getAnalytics(app) : null);

export default app;