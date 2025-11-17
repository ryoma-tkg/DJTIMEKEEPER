// [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-phase3-dev/src/firebase.js]
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ▼▼▼ 【!!! 修正 !!!】 .env.local から読み込むように変更 ▼▼▼
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
// ▲▲▲ 【!!! 修正 !!!】 ここまで ▲▲▲

// index.html で window.appId にしてたやつ
export const appId = 'github-pages-deploy';

// アプリを初期化
const app = initializeApp(firebaseConfig);

// (これ以降は変更なし)
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  doc,
  onSnapshot,
  setDoc,
  ref,
  uploadBytes,
  getDownloadURL,
};