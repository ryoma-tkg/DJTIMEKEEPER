// [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-phase3-dev/src/firebase.js]
import { initializeApp } from "firebase/app";
// ▼▼▼ 【!!! 修正 !!!】 認証まわりで使う機能を追加インポート ▼▼▼
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider, // Google認証プロバイダ
  signInWithPopup,    // ポップアップでログイン
  signOut             // ログアウト
} from "firebase/auth";
// ▲▲▲ 【!!! 修正 !!!】 ここまで ▲▲▲

import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// (firebaseConfig - 変更なし)
const firebaseConfig = {
  apiKey: "AIzaSyCDe_GANzGxXP0IRk90is37L1ZGobw1sQ8", // 先輩のキーっすよね！
  authDomain: "djtable-2408d.firebaseapp.com",
  projectId: "djtable-2408d",
  storageBucket: "djtable-2408d.firebasestorage.app",
  messagingSenderId: "780384107579",
  appId: "1:780384107579:web:97fddd203fedff885af01e"
};

// (appId - 変更なし)
export const appId = 'github-pages-deploy';

// (app - 変更なし)
const app = initializeApp(firebaseConfig);

// (各サービス - 変更なし)
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ▼▼▼ 【!!! 追加 !!!】 Google認証で使うプロバイダをエクスポート ▼▼▼
export const googleProvider = new GoogleAuthProvider();

// ▼▼▼ 【!!! 修正 !!!】 必要な関数を再エクスポート ▼▼▼
export {
  // signInAnonymously, // ← 匿名認証はもう使わないので削除
  onAuthStateChanged,
  signInWithPopup,    // ← 追加
  signOut,            // ← 追加
  doc,
  onSnapshot,
  setDoc,
  ref,
  uploadBytes,
  getDownloadURL,
};