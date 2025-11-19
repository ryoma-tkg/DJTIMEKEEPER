// [src/firebase.js]
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth";

// ▼▼▼ 【修正】 getFirestore, enableIndexedDbPersistence を削除し、新しい初期化関数をインポート ▼▼▼
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { doc, onSnapshot, setDoc } from "firebase/firestore"; // 他の必要なものは維持

import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const appId = 'github-pages-deploy';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// ▼▼▼ 【修正】 最新の書き方でFirestoreを初期化（オフライン永続化もここで設定） ▼▼▼
// enableIndexedDbPersistence(db)... の代わりに、初期化時にオプションとして渡します
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager() // 複数タブでの同期もサポート
  })
});
// ▲▲▲ 修正ここまで ▲▲▲

export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// enableIndexedDbPersistence のブロックは削除しました

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