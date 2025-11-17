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

// ▼▼▼ 【!!! 修正 !!!】 ページコンポーネントを3つインポート ▼▼▼
import { LoginPage } from './components/LoginPage';
import { DashboardPage } from './components/DashboardPage'; // ★ 追加
import { EditorPage } from './components/EditorPage'; // ★ 追加
import { LivePage } from './components/LivePage'; // ★ 追加
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

    // (開発者モード - 変更なし)
    // ★ ここにあなたの Google ログイン後の UID をコピペしてください ★
    const ADMIN_USER_ID = "YOUR_GOOGLE_UID_HERE"; // 例: "aBcDeFgHiJkLmNoPqRsTuVwXyZ1"

    const [isDevMode, setIsDevMode] = useState(false);

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

    // ▼▼▼ 【!!! 追加 !!!】 開発者モードのトグルを EditorPage に渡す用 ▼▼▼
    const toggleDevMode = () => {
        if (user && user.uid === ADMIN_USER_ID) {
            setIsDevMode(prev => !prev);
        }
    };
    // ▲▲▲ 【!!! 追加 !!!】 ここまで ▲▲▲


    // (認証ロジック - 変更なし)
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
    }, []); // 



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

    // (古いロジック - コメントアウト)
    // ...


    // === レンダリング ===

    // (認証読み込み中 - 変更なし)
    if (authStatus === 'loading') {
        return <LoadingScreen text="認証情報を確認中..." />;
    }

    // ▼▼▼ 【!!! 修正 !!!】 メインの return を Routes に変更 ▼▼▼
    return (
        <>
            {/* (オフラインアラートは EditorPage/LivePage に移動) */}

            <Routes>
                {/* --- ルート: / --- */}
                <Route
                    path="/"
                    element={
                        authStatus === 'authed' ? (
                            // ★ 修正: DashboardPage に user と onLogout を渡す
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

                {/* --- ▼▼▼ 【!!! 追加 !!!】 /edit と /live のルート ▼▼▼ --- */}

                {/* --- 編集ページ: /edit/:eventId --- */}
                <Route
                    path="/edit/:eventId"
                    element={
                        authStatus === 'authed' ? (
                            // ログイン済みなら EditorPage を表示
                            <EditorPage
                                user={user}
                                isDevMode={isDevMode}
                                onToggleDevMode={toggleDevMode}
                                theme={theme}
                                toggleTheme={toggleTheme}
                            />
                        ) : (
                            // 未ログインなら /login に強制移動
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* --- ライブページ: /live/:eventId --- */}
                <Route
                    path="/live/:eventId"
                    element={
                        // ★ 閲覧専用なので、ログインチェック不要！
                        <LivePage
                            theme={theme}
                            toggleTheme={toggleTheme}
                        />
                    }
                />

                {/* --- 404 Not Found (仮) --- */}
                <Route
                    path="*"
                    element={
                        <div className="p-8">
                            <h1>404 - ページが見つかりません</h1>
                            <Link to="/">ダッシュボードに戻る</Link>
                        </div>
                    }
                />

            </Routes>
            {/* ▲▲▲ 【!!! 修正 !!!】 ここまで ▲▲▲ */}

            {/* (開発者モードボタンは EditorPage に移動したので削除) */}
        </>
    );
    // ▲▲▲ 【!!! 修正 !!!】 ここまで ▲▲▲
};

export default App;