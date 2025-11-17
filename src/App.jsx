// [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-phase3-dev/src/App.jsx]
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Routes, Route, useNavigate, Navigate, Link } from 'react-router-dom'; // ★ Link をインポート

import {
    auth,
    db,
    storage,
    googleProvider,
    onAuthStateChanged,
    signInWithPopup,
    signOut
} from './firebase';

// ▼▼▼ ページコンポーネントをインポート ▼▼▼
import { LoginPage } from './components/LoginPage';
import { DashboardPage } from './components/DashboardPage';
import { EditorPage } from './components/EditorPage';
import { LivePage } from './components/LivePage';
// ▲▲▲ ここまで ▲▲▲


// (古いコンポーネントはもう使わない)
import {
    AlertTriangleIcon,
    PowerIcon
} from './components/common';
// import { useImagePreloader } from './hooks/useImagePreloader';
// import { DevControls } from './components/DevControls';

// (ローディングコンポーネント)
const LoadingScreen = ({ text = "読み込み中..." }) => (
    <div className="flex flex-col items-center justify-center h-screen bg-surface-background">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spinner mb-4"></div>
        <p className="text-lg text-on-surface-variant">{text}</p>
    </div>
);


// 
const App = () => {
    // 認証まわりの state
    const [user, setUser] = useState(null); // ログイン中のユーザー情報
    const [authStatus, setAuthStatus] = useState('loading'); // 'loading', 'authed', 'no-auth'
    const [isLoggingIn, setIsLoggingIn] = useState(false); // ログインボタン押下中か
    const navigate = useNavigate(); // ページ遷移用

    // (古い state は EditorPage/LivePage に移動)

    // テーマ管理
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    // 開発者モードの管理
    // ★ ここにあなたの Google ログイン後の UID をコピペしてください ★
    // (Firebaseコンソールの Authentication > Users タブで確認できます)
    const ADMIN_USER_ID = "GLGPpy6IlyWbGw15OwBPzRdCPZI2"; // 例: "aBcDeFgHiJkLmNoPqRsTuVwXyZ1"

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

    // 開発者モードのトグル (EditorPage に渡す用)
    const toggleDevMode = () => {
        if (user && user.uid === ADMIN_USER_ID) {
            setIsDevMode(prev => !prev);
        }
    };


    // 認証ロジック (ADMIN_USER_IDの判定を追加)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                // ログイン成功
                setUser(firebaseUser);
                setAuthStatus('authed');

                // ★ 開発者モードの判定
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

    // === レンダリング ===

    // (認証読み込み中 - 変更なし)
    if (authStatus === 'loading') {
        return <LoadingScreen text="認証情報を確認中..." />;
    }

    // ★ メインの return (ルーティング)
    return (
        <>
            <Routes>
                {/* --- ルート: / --- */}
                <Route
                    path="/"
                    element={
                        authStatus === 'authed' ? (
                            // ログイン済み -> ダッシュボードへ
                            <DashboardPage user={user} onLogout={handleLogout} />
                        ) : (
                            // 未ログイン -> /login へ強制移動
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* --- ログインページ: /login --- */}
                <Route
                    path="/login"
                    element={
                        authStatus === 'authed' ? (
                            // ログイン済み -> / へ強制移動
                            <Navigate to="/" replace />
                        ) : (
                            // 未ログイン -> ログインページ表示
                            <LoginPage onLoginClick={handleLogin} isLoggingIn={isLoggingIn} />
                        )
                    }
                />

                {/* --- 編集ページ: /edit/:eventId --- */}
                <Route
                    path="/edit/:eventId"
                    element={
                        authStatus === 'authed' ? (
                            // ログイン済み -> EditorPage を表示 (権限チェックは EditorPage 内部で行う)
                            <EditorPage
                                user={user}
                                isDevMode={isDevMode}
                                onToggleDevMode={toggleDevMode}
                                theme={theme}
                                toggleTheme={toggleTheme}
                            />
                        ) : (
                            // 未ログイン -> /login に強制移動
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
        </>
    );
};

export default App;