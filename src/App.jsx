// [src/App.jsx]
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, Navigate, Link, useParams } from 'react-router-dom';

import {
    auth,
    db, // ここは './firebase' が正しいです
    googleProvider,
    onAuthStateChanged,
    signInWithPopup,
    signInAnonymously,
    signOut
} from './firebase'; // ★重要: App.jsxはsrc直下なので './firebase'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { LoadingScreen } from './components/common';
import { PerformanceMonitor } from './components/PerformanceMonitor';

// 遅延ロード
const LoginPage = lazy(() => import('./components/LoginPage').then(module => ({ default: module.LoginPage })));
const DashboardPage = lazy(() => import('./components/DashboardPage').then(module => ({ default: module.DashboardPage })));
const EditorPage = lazy(() => import('./components/EditorPage').then(module => ({ default: module.EditorPage })));
const LivePage = lazy(() => import('./components/LivePage').then(module => ({ default: module.LivePage })));
const SetupPage = lazy(() => import('./components/SetupPage').then(module => ({ default: module.SetupPage })));

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

const RedirectToLive = () => {
    const { eventId, floorId } = useParams();
    const targetPath = floorId ? `/live/${eventId}/${floorId}` : `/live/${eventId}`;
    return <Navigate to={targetPath} replace />;
};

const App = () => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);

    const [authStatus, setAuthStatus] = useState('loading');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const navigate = useNavigate();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    const SUPER_ADMIN_UID = "GLGPpy6IlyWbGw15OwBPzRdCPZI2";

    const [isDevMode, setIsDevMode] = useState(false);
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
        if (isDevMode) {
            setIsDevMode(false);
        } else {
            checkIsAdmin().then(isAdmin => {
                if (isAdmin) setIsDevMode(true);
            });
        }
    };

    const checkIsAdmin = async () => {
        if (!auth.currentUser) return false;
        if (auth.currentUser.uid === SUPER_ADMIN_UID) return true;

        try {
            const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
            return snap.exists() && snap.data().role === 'admin';
        } catch (e) {
            return false;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);

                try {
                    const userDocRef = doc(db, "users", firebaseUser.uid);
                    const userSnap = await getDoc(userDocRef);

                    let userData = null;
                    const isSuperAdmin = firebaseUser.uid === SUPER_ADMIN_UID;

                    if (!userSnap.exists()) {
                        const newUserData = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                            role: isSuperAdmin ? 'admin' : 'free',
                            createdAt: serverTimestamp(),
                            lastLoginAt: serverTimestamp(),
                            isSetupCompleted: false,
                            preferences: {
                                theme: localStorage.getItem('theme') || 'dark',
                                defaultStartTime: '22:00',
                                defaultVjEnabled: false,
                                defaultMultiFloor: false,
                            }
                        };
                        await setDoc(userDocRef, newUserData);
                        userData = newUserData;
                    } else {
                        const currentData = userSnap.data();
                        const shouldPromoteToAdmin = isSuperAdmin && currentData.role !== 'admin';

                        const updatePayload = {
                            email: firebaseUser.email,
                            lastLoginAt: serverTimestamp()
                        };

                        if (shouldPromoteToAdmin) {
                            updatePayload.role = 'admin';
                        }

                        if (currentData.isSetupCompleted === undefined) {
                            updatePayload.isSetupCompleted = true;
                        }

                        await updateDoc(userDocRef, updatePayload);
                        userData = { ...currentData, ...updatePayload };
                    }

                    setUserProfile(userData);

                    if (isSuperAdmin || userData?.role === 'admin') {
                        setIsDevMode(true);
                    } else {
                        setIsDevMode(false);
                    }

                    if (userData?.preferences?.theme) {
                        setTheme(userData.preferences.theme);
                    }

                } catch (error) {
                    console.error("[Auth] User sync failed:", error);
                    setIsDevMode(false);
                } finally {
                    setAuthStatus('authed');
                }

            } else {
                setUser(null);
                setUserProfile(null);
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
            alert("ログインに失敗しました。");
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleGuestLogin = async () => {
        if (isLoggingIn) return;
        setIsLoggingIn(true);
        try {
            await signInAnonymously(auth);
        } catch (error) {
            console.error("ゲストログインに失敗:", error);
            alert("ゲストログインに失敗しました。");
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        setIsDevMode(false);
        setUserProfile(null);
        navigate('/login');
    };

    const handleSetupComplete = () => {
        setUserProfile(prev => ({ ...prev, isSetupCompleted: true }));
        navigate('/');
    };

    if (authStatus === 'loading') {
        return <LoadingScreen text="認証情報を確認中..." />;
    }

    const needsSetup = authStatus === 'authed' && user && !user.isAnonymous && userProfile && userProfile.isSetupCompleted === false;

    return (
        <>
            {isDevMode && (
                <PerformanceMonitor
                    visible={isPerfMonitorVisible}
                    onClose={() => setIsPerfMonitorVisible(false)}
                />
            )}

            <Suspense fallback={<LoadingScreen text="読み込み中..." />}>
                <Routes>
                    <Route
                        path="/setup"
                        element={
                            needsSetup ? (
                                <SetupPage
                                    user={user}
                                    userProfile={userProfile}
                                    theme={theme}
                                    toggleTheme={toggleTheme}
                                    onComplete={handleSetupComplete}
                                />
                            ) : (
                                <Navigate to="/" replace />
                            )
                        }
                    />

                    <Route
                        path="/"
                        element={
                            authStatus === 'authed' ? (
                                needsSetup ? (
                                    <Navigate to="/setup" replace />
                                ) : (
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
                                )
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
                                <LoginPage
                                    onLoginClick={handleLogin}
                                    onGuestClick={handleGuestLogin}
                                    isLoggingIn={isLoggingIn}
                                />
                            )
                        }
                    />

                    <Route
                        path="/edit/:eventId/:floorId"
                        element={
                            authStatus === 'authed' ? (
                                needsSetup ? <Navigate to="/setup" replace /> :
                                    <EditorPage
                                        user={user}
                                        userProfile={userProfile}
                                        isDevMode={isDevMode}
                                        onToggleDevMode={toggleDevMode}
                                        theme={theme}
                                        toggleTheme={toggleTheme}
                                        isPerfMonitorVisible={isPerfMonitorVisible}
                                        onTogglePerfMonitor={() => setIsPerfMonitorVisible(p => !p)}
                                    />
                            ) : (
                                <RedirectToLive />
                            )
                        }
                    />

                    <Route
                        path="/edit/:eventId"
                        element={
                            authStatus === 'authed' ? (
                                needsSetup ? <Navigate to="/setup" replace /> :
                                    <EditorRedirector />
                            ) : (
                                <RedirectToLive />
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