import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// index.htmlから firebaseConfig をコピペ
const firebaseConfig = {
  apiKey: "AIzaSyCDe_GANzGxXP0IRk90is37L1ZGobw1sQ8", // 先輩のキーっすよね！
  authDomain: "djtable-2408d.firebaseapp.com",
  projectId: "djtable-2408d",
  storageBucket: "djtable-2408d.firebasestorage.app",
  messagingSenderId: "780384107579",
  appId: "1:780384107579:web:97fddd203fedff885af01e"
};

// index.html で window.appId にしてたやつ
export const appId = 'github-pages-deploy'; 

// アプリを初期化
const app = initializeApp(firebaseConfig);

// 各サービスを初期化してエクスポート（App.jsxで使えるようにする）
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 必要な関数も再エクスポート
export {
    signInAnonymously,
    onAuthStateChanged,
    doc,
    onSnapshot,
    setDoc,
    ref,
    uploadBytes,
    getDownloadURL,
};