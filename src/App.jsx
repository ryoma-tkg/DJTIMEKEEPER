// [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-phase3-dev/src/App.jsx]
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'; // ★ Navigate を追加

import {
    auth,
    db,
    storage,
    googleProvider,
    onAuthStateChanged,
    signInWithPopup,
    signOut
} from './firebase';

// ▼▼▼ 【!!! 修正 !!!】 DashboardPage をインポート ▼▼▼
import { LoginPage } from './components/LoginPage';
import { DashboardPage } from './components/DashboardPage'; // ★ 追加
// import { EditorPage } from './components/EditorPage'; // ←これは次回作ります
// import { LivePage } from './components/LivePage'; // ←これは次回作ります
// ▲▲▲ 【!!! 修正 !!!】 ここまで ▲▲▲


// (古いコンポーネント - コメントアウトのまま)
// import { TimetableEditor } from './components/TimetableEditor';
// import { LiveView } from './components/LiveView';
import {
    AlertTriangleIcon,
    PowerIcon
} from './components/common';
// import { useImagePreloader } from './hooks/useImagePreloader';
// import { DevControls } from './components/DevControls';

// (LoadingScreen - 変更なし)
const LoadingScreen = ({ text = "読み込み中..." }) => (
    <div className="flex flex-col items-center justify-center h-screen bg-surface-background">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spinner mb-4"></div>
        <p className="text-lg text-on-surface-variant">{text}</p>
    </div>
);


// 
const App = () => {
    // (state - 変更なし)
    const [user, setUser] = useState(null);
    const [authStatus, setAuthStatus] = useState('loading');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const navigate = useNavigate();

    // (古い state - コメントアウトのまま)
    // ...

    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    // ▼▼▼ 【!!! 修正 !!!】 開発者モードは、ログインしたユーザーIDで判定する ▼▼▼
    // ★ ここにあなたの Google ログイン後の UID をコピペしてください ★
    // (Firebaseコンソールの Authentication > Users タブで確認できます)
    const ADMIN_USER_ID = "YOUR_GOOGLE_UID_HERE"; // 例: "aBcDeFgHiJkLmNoPqRsTuVwXyZ1"

    const [isDevMode, setIsDevMode] = useState(false); // デフォルトはOFF

    // (useEffect theme - 変更なし)
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    // (toggleTheme - 変更なし)
    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    // (toggleDevMode - 削除)


    // ▼▼▼ 【!!! 修正 !!!】 認証ロジックを変更 ▼▼▼
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                // ログイン成功
                setUser(firebaseUser);
                setAuthStatus('authed');

                // ★ 修正: 開発者モードの判定
                if (firebaseUser.uid === ADMIN_USER_ID) {
                    console.warn("管理者モードで起動しました。");
                    setIsDevMode(true);
                } else {
                    setIsDevMode(false);
                }

                console.log("ログイン成功:", firebaseUser.uid);
            } else {
                // ログアウトした、または未ログイン
                setUser(null);
                setAuthStatus('no-auth');
                setIsDevMode(false); // ログアウトしたら開発者モードOFF
                console.log("ログアウト、または未ログイン");
            }
        });
        return () => unsubscribe();
    }, []); // navigate を依存配列から削除
    // ▲▲▲ 【!!! 修正 !!!】 ここまで ▲▲▲


    // (handleLogin - 変更なし)
    const handleLogin = async () => {
        if (isLoggingIn) return;
        setIsLoggingIn(true);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Googleログインに失敗:", error);
            alert("ログインに失敗しました。ポップアップがブロックされていないか確認してください。");
        } finally {
            setIsLoggingIn(false);
        }
    };

    // (handleLogout - 変更なし)
    const handleLogout = async () => {
        await signOut(auth);
        navigate('/login');
    };

    // (古いロジック - コメントアウトのまま)
    // ...


    // === レンダリング ===

    // (認証読み込み中 - 変更なし)
    if (authStatus === 'loading') {
        return <LoadingScreen text="認証情報を確認中..." />;
    }

    // ▼▼▼ 【!!! 修正 !!!】 メインの return を Routes に変更 ▼▼▼
    return (
        <>
            {/* (オフラインアラート - あとで復活させます) */}
            {/* {appStatus === 'offline' && ( ... )} */}

            <Routes>
                {/* --- ルート: / --- */}
                <Route
                    path="/"
                    element={
                        authStatus === 'authed' ? (
                            // ★ 修正: 仮のダッシュボードを DashboardPage に置き換え
                            <DashboardPage user={user} onLogout={handleLogout} />
                        ) : (
                            // ★ 修正: 未ログインなら /login に強制移動
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* --- ログインページ: /login --- */}
                <Route
                    path="/login"
                    element={
                        authStatus === 'authed' ? (
                            // ★ 修正: ログイン済みなら / に強制移動
                            <Navigate to="/" replace />
                        ) : (
                            <LoginPage onLoginClick={handleLogin} isLoggingIn={isLoggingIn} />
                        )
                    }
                />

                {/* --- （次回以降、ここに追加） --- */}
                {/* <Route path="/edit/:eventId" element={ ... } /> */}
                {/* <Route path="/live/:eventId" element={ ... } /> */}
                {/* <Route path="*" element={ <NotFoundPage /> } /> */}

            </Routes>

            {/* (開発者モード - いったんコメントアウト) */}
            {/* {isDevMode && !isReadOnly && ( ... )} */}
            {/* {!isReadOnly && ( ... )} */}
        </>
    );
    // ▲▲▲ 【!!! 修正 !!!】 ここまで ▲▲▲
};

export default App;