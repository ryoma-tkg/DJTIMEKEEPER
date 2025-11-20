// [src/App.jsx]
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, Navigate, Link, useParams } from 'react-router-dom';

import {
    auth,
    db,
    googleProvider,
    onAuthStateChanged,
    signInWithPopup,
    signOut
} from './firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { LoadingScreen } from './components/common';
import { PerformanceMonitor } from './components/PerformanceMonitor';

// 遅延ロード
const LoginPage = lazy(() => import('./components/LoginPage').then(module => ({ default: module.LoginPage })));
const DashboardPage = lazy(() => import('./components/DashboardPage').then(module => ({ default: module.DashboardPage })));
const EditorPage = lazy(() => import('./components/EditorPage').then(module => ({ default: module.EditorPage })));
const LivePage = lazy(() => import('./components/LivePage').then(module => ({ default: module.LivePage })));

// --- Redirector コンポーネント ---
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
                if (data.floors && Object.keys(data.floors).length > 0) {
                    const firstFloorId = Object.keys(data.floors).sort(
                        (a, b) => (data.floors[a].order || 0) - (data.floors[b].order || 0)
                    )[0];
                    setTargetFloorId(firstFloorId);
                    setStatus('found');
                } else if (data.timetable) {
                    setTargetFloorId('default');
                    setStatus('found');
                } else {
                    setStatus('not-found');
                }
            } else {
                setStatus('not-found');
            }
        };
        fetchFirstFloor();
    }, [eventId]);

    if (status === 'loading') return <LoadingScreen text="フロア情報を検索中..." />;
    if (status === 'not-found') return <Navigate to="/" replace />;
    return <Navigate to={`/edit/${eventId}/${targetFloorId}`} replace />;
};

const LiveRedirector = () => {
    const { eventId } = useParams();
    const [targetFloorId, setTargetFloorId] = useState(null);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
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
                } else {
                    setStatus('not-found');
                }
            } else {
                setStatus('not-found');
            }
        };
        fetchFirstFloor();
    }, [eventId]);

    if (status === 'loading') return <LoadingScreen text="フロア情報を検索中..." />;
    if (status === 'not-found') return <Navigate to="/" replace />;
    return <Navigate to={`/live/${eventId}/${targetFloorId}`} replace />;
};


const App = () => {
    const [user, setUser] = useState(null);
    const [authStatus, setAuthStatus] = useState('loading');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const navigate = useNavigate();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    // 管理者ID
    const ADMIN_USER_IDS = [
        "GLGPpy6IlyWbGw15OwBPzRdCPZI2",
    ];

    const [isDevMode, setIsDevMode] = useState(false);
    // モニター表示管理
    const [isPerfMonitorVisible, setIsPerfMonitorVisible] = useState(false);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    const toggleDevMode = () => {
        if (user && ADMIN_USER_IDS.includes(user.uid)) {
            setIsDevMode(prev => !prev);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                setAuthStatus('authed');

                if (ADMIN_USER_IDS.includes(firebaseUser.uid)) {
                    console.warn("管理者モードで起動しました。");
                    setIsDevMode(true);
                } else {
                    setIsDevMode(false);
                }

                try {
                    const userDocRef = doc(db, "users", firebaseUser.uid);
                    const userSnap = await getDoc(userDocRef);

                    if (!userSnap.exists()) {
                        await setDoc(userDocRef, {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                            role: 'free',
                            createdAt: serverTimestamp(),
                            lastLoginAt: serverTimestamp(),
                            preferences: {
                                theme: localStorage.getItem('theme') || 'dark',
                                defaultStartTime: '22:00',
                                defaultVjEnabled: false,
                                defaultMultiFloor: false,
                            }
                        });
                        console.log("[Auth] User profile created.");
                    } else {
                        await updateDoc(userDocRef, {
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                            lastLoginAt: serverTimestamp()
                        });
                        console.log("[Auth] User profile synced.");
                    }
                } catch (error) {
                    console.error("[Auth] User sync failed:", error);
                }

            } else {
                setUser(null);
                setAuthStatus('no-auth');
                setIsDevMode(false);
            }
        });
        return () => unsubscribe();
    }, []);

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

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/login');
    };

    if (authStatus === 'loading') {
        return <LoadingScreen text="認証情報を確認中..." />;
    }

    return (
        <>
            {/* 管理者モード時のみ、モニターコンポーネントを常駐させる */}
            {isDevMode && (
                <PerformanceMonitor
                    visible={isPerfMonitorVisible}
                    onClose={() => setIsPerfMonitorVisible(false)}
                />
            )}

            <Suspense fallback={<LoadingScreen text="読み込み中..." />}>
                <Routes>
                    <Route
                        path="/"
                        element={
                            authStatus === 'authed' ? (
                                <DashboardPage
                                    user={user}
                                    onLogout={handleLogout}
                                    theme={theme}
                                    toggleTheme={toggleTheme}
                                    isDevMode={isDevMode}
                                    onToggleDevMode={toggleDevMode}
                                    isPerfMonitorVisible={isPerfMonitorVisible}
                                    onTogglePerfMonitor={() => setIsPerfMonitorVisible(p => !p)}
                                />
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />

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

                    <Route
                        path="/edit/:eventId/:floorId"
                        element={
                            authStatus === 'authed' ? (
                                <EditorPage
                                    user={user}
                                    isDevMode={isDevMode}
                                    onToggleDevMode={toggleDevMode}
                                    theme={theme}
                                    toggleTheme={toggleTheme}
                                    isPerfMonitorVisible={isPerfMonitorVisible}
                                    onTogglePerfMonitor={() => setIsPerfMonitorVisible(p => !p)}
                                />
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />

                    <Route
                        path="/edit/:eventId"
                        element={
                            authStatus === 'authed' ? (
                                <EditorRedirector />
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />

                    <Route
                        path="/live/:eventId/:floorId"
                        element={
                            <LivePage
                                theme={theme}
                                toggleTheme={toggleTheme}
                            />
                        }
                    />

                    <Route
                        path="/live/:eventId"
                        element={
                            <LiveRedirector />
                        }
                    />

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
            </Suspense>
        </>
    );
};

export default App;