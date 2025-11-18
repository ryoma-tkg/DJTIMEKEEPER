// [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-phase3-dev/src/App.jsx]
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Routes, Route, useNavigate, Navigate, Link, useParams } from 'react-router-dom'; // ★ useParams をインポート

import {
    auth,
    db,
    // storage, // (App.jsx では不要)
    googleProvider,
    onAuthStateChanged,
    signInWithPopup,
    signOut
} from './firebase';
import { doc, getDoc } from 'firebase/firestore'; // ★ getDoc をインポート

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

// (ローディングコンポーネント - 変更なし)
const LoadingScreen = ({ text = "読み込み中..." }) => (
    <div className="flex flex-col items-center justify-center h-screen bg-surface-background">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spinner mb-4"></div>
        <p className="text-lg text-on-surface-variant">{text}</p>
    </div>
);


// ▼▼▼ 【!!! 新設 !!!】 eventId から最初の floorId を見つけてリダイレクトするコンポーネント ▼▼▼

/**
 * (EditorPage用) /edit/:eventId へのアクセスを /edit/:eventId/:floorId にリダイレクトする
 */
const EditorRedirector = () => {
    const { eventId } = useParams();
    const [targetFloorId, setTargetFloorId] = useState(null);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        const fetchFirstFloor = async () => {
            const docRef = doc(db, 'timetables', eventId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                // (新データ構造 floors があるか？)
                if (data.floors && Object.keys(data.floors).length > 0) {
                    // floors マップを order 順でソートし、最初のIDを取得
                    const firstFloorId = Object.keys(data.floors).sort(
                        (a, b) => (data.floors[a].order || 0) - (data.floors[b].order || 0)
                    )[0];
                    setTargetFloorId(firstFloorId);
                    setStatus('found');
                }
                // (旧データ構造 timetable があるか？)
                else if (data.timetable) {
                    // 旧データの場合は 'default' という仮想のフロアIDを使う
                    setTargetFloorId('default');
                    setStatus('found');
                }
                else {
                    setStatus('not-found'); // フロア情報がない
                }
            } else {
                setStatus('not-found');
            }
        };
        fetchFirstFloor();
    }, [eventId]);

    if (status === 'loading') {
        return <LoadingScreen text="フロア情報を検索中..." />;
    }
    if (status === 'not-found') {
        return <Navigate to="/" replace />; // 
    }
    // /edit/:eventId/:floorId へリダイレクト
    return <Navigate to={`/edit/${eventId}/${targetFloorId}`} replace />;
};

/**
 * (LivePage用) /live/:eventId へのアクセスを /live/:eventId/:floorId にリダイレクトする
 */
const LiveRedirector = () => {
    const { eventId } = useParams();
    const [targetFloorId, setTargetFloorId] = useState(null);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        // (EditorRedirector と全く同じロジック)
        const fetchFirstFloor = async () => {
            const docRef = doc(db, 'timetables', eventId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.floors && Object.keys(data.floors).length > 0) {
                    const firstFloorId = Object.keys(data.floors).sort(
                        (a, b) => (data.floors[a].order || 0) - (data.floors[b].order || 0)
                    )[0];
                    setTargetFloorId(firstFloorId);
                    setStatus('found');
                } else if (data.timetable) {
                    setTargetFloorId('default');
                    setStatus('found');
                }
                else {
                    setStatus('not-found');
                }
            } else {
                setStatus('not-found');
            }
        };
        fetchFirstFloor();
    }, [eventId]);

    if (status === 'loading') {
        return <LoadingScreen text="フロア情報を検索中..." />;
    }
    if (status === 'not-found') {
        return <Navigate to="/" replace />; // 
    }
    // /live/:eventId/:floorId へリダイレクト
    return <Navigate to={`/live/${eventId}/${targetFloorId}`} replace />;
};
// ▲▲▲ 【!!! 新設 !!!】 リダイレクトコンポーネントここまで ▲▲▲


const App = () => {
    // (認証まわり、テーマ管理、開発者モード管理 - 変更なし)
    const [user, setUser] = useState(null);
    const [authStatus, setAuthStatus] = useState('loading');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const navigate = useNavigate();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const ADMIN_USER_ID = "GLGPpy6IlyWbGw15OwBPzRdCPZI2";
    const [isDevMode, setIsDevMode] = useState(false);
    useEffect(() => { /* ... (テーマ適用ロジック - 変更なし) ... */
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);
    const toggleTheme = () => { /* ... (変更なし) ... */
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };
    const toggleDevMode = () => { /* ... (変更なし) ... */
        if (user && user.uid === ADMIN_USER_ID) {
            setIsDevMode(prev => !prev);
        }
    };
    useEffect(() => { /* ... (認証ロジック - 変更なし) ... */
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                setAuthStatus('authed');
                if (firebaseUser.uid === ADMIN_USER_ID) {
                    console.warn("管理者モードで起動しました。");
                    setIsDevMode(true);
                } else {
                    setIsDevMode(false);
                }
                console.log("ログイン成功:", firebaseUser.uid);
            } else {
                setUser(null);
                setAuthStatus('no-auth');
                setIsDevMode(false);
                console.log("ログアウト、または未ログイン");
            }
        });
        return () => unsubscribe();
    }, []);
    const handleLogin = async () => { /* ... (変更なし) ... */
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
    const handleLogout = async () => { /* ... (変更なし) ... */
        await signOut(auth);
        navigate('/login');
    };
    // (認証読み込み中 - 変更なし)
    if (authStatus === 'loading') {
        return <LoadingScreen text="認証情報を確認中..." />;
    }

    // ▼▼▼ 【!!! 修正 !!!】 メインの return (ルーティング) ▼▼▼
    return (
        <>
            <Routes>
                {/* --- ルート: / (変更なし) --- */}
                <Route
                    path="/"
                    element={
                        authStatus === 'authed' ? (
                            <DashboardPage user={user} onLogout={handleLogout} />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* --- ログインページ: /login (変更なし) --- */}
                <Route
                    path="/login"
                    element={
                        authStatus === 'authed' ? (
                            <Navigate to="/" replace />
                        ) : (
                            <LoginPage onLoginClick={handleLogin} isLoggingIn={isLoggingIn} />
                        )
                    }
                />

                {/* --- 編集ページ (フロアIDあり): /edit/:eventId/:floorId --- */}
                <Route
                    path="/edit/:eventId/:floorId" // ★ :floorId を追加
                    element={
                        authStatus === 'authed' ? (
                            <EditorPage
                                user={user}
                                isDevMode={isDevMode}
                                onToggleDevMode={toggleDevMode}
                                theme={theme}
                                toggleTheme={toggleTheme}
                            />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* --- 編集ページ (フロアIDなし): /edit/:eventId --- */}
                <Route
                    path="/edit/:eventId" // ★ フロアIDなしのルート
                    element={
                        authStatus === 'authed' ? (
                            <EditorRedirector /> // ★ リダイレクト用コンポーネントを呼ぶ
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* --- ライブページ (フロアIDあり): /live/:eventId/:floorId --- */}
                <Route
                    path="/live/:eventId/:floorId" // ★ :floorId を追加
                    element={
                        <LivePage
                            theme={theme}
                            toggleTheme={toggleTheme}
                        />
                    }
                />

                {/* --- ライブページ (フロアIDなし): /live/:eventId --- */}
                <Route
                    path="/live/:eventId" // ★ フロアIDなしのルート
                    element={
                        <LiveRedirector /> // ★ リダイレクト用コンポーネントを呼ぶ
                    }
                />

                {/* --- 404 Not Found (変更なし) --- */}
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
// ▲▲▲ 【!!! 修正 !!!】 ルーティングここまで ▲▲▲

export default App;