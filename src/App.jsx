import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
// 
import {
    auth, db, storage, appId,
    signInAnonymously, onAuthStateChanged,
    doc, onSnapshot, setDoc,
} from './firebase';

// 
import { TimetableEditor } from './components/TimetableEditor';
import { AlertTriangleIcon } from './components/common'; // 
import { LiveView } from './components/LiveView'; // 
import { useImagePreloader } from './hooks/useImagePreloader'; // 


// 
const App = () => {
    const [mode, setMode] = useState('edit');
    const [timetable, setTimetable] = useState([]);
    const [eventConfig, setEventConfig] = useState({ title: 'DJ Timekeeper Pro', startTime: '22:00' });
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [appStatus, setAppStatus] = useState('connecting');
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const dbRef = useRef(null);
    const storageRef = useRef(null);
    const [timeOffset, setTimeOffset] = useState(0);
    const [isReadOnly, setIsReadOnly] = useState(false);

    // 
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

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
    // 


    const imageUrlsToPreload = useMemo(() => timetable.map(dj => dj.imageUrl), [timetable]);
    const { loadedUrls, allLoaded: imagesLoaded } = useImagePreloader(imageUrlsToPreload); // 

    // 
    useEffect(() => {
        const fetchTimeOffset = async () => {
            if (appStatus !== 'online') {
                setTimeOffset(0);
                return;
            }
            try {
                const response = await fetch('https://worldtimeapi.org/api/ip');
                if (!response.ok) throw new Error('Failed to fetch time');
                const data = await response.json();
                const externalTime = data.unixtime * 1000;
                const localTime = new Date().getTime();
                const offset = externalTime - localTime;
                console.log(`Time offset calculated: ${offset}ms`);
                setTimeOffset(offset);
            } catch (error) {
                console.warn('Failed to fetch external time, using device time.', error);
                setTimeOffset(0);
            }
        };
        fetchTimeOffset();
    }, [appStatus]);

    // 
    useEffect(() => {
        if (window.location.hash === '#live') {
            // ★★★ 
            console.log("閲覧専用モード (#live) で起動っす！");
            setIsReadOnly(true);
            setMode('live');
        }

        const connectionTimeout = setTimeout(() => {
            if (appStatus === 'connecting') {
                console.warn("Connection to Firebase timed out. Entering offline mode.");
                setAppStatus('offline');
                setIsInitialLoading(false);
            }
        }, 5000);

        try {
            dbRef.current = db;
            storageRef.current = storage;

            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    clearTimeout(connectionTimeout);
                    setIsAuthenticated(true);
                    setAppStatus('online');
                } else {
                    await signInAnonymously(auth);
                }
            });
        } catch (e) {
            console.error("Firebase services setup failed:", e);
            clearTimeout(connectionTimeout);
            setAppStatus('offline');
            setIsInitialLoading(false);
        }

        return () => clearTimeout(connectionTimeout);
    }, []);

    // 
    useEffect(() => {
        if (appStatus !== 'online' || !isAuthenticated || !dbRef.current) {
            if (appStatus === 'offline' && isInitialLoading) {
                setIsInitialLoading(false);
            }
            return;
        }

        const docRef = doc(dbRef.current, 'artifacts', appId, 'public', 'sharedTimetable');

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setTimetable(data.timetable || []);
                setEventConfig(data.eventConfig || { title: 'DJ Timekeeper Pro', startTime: '22:00' });
            } else {
                console.log("No shared document! Creating initial data.");
            }
            // 
            if (isInitialLoading) {
                setIsInitialLoading(false);
            }
        }, (error) => {
            console.error("Firestore snapshot error:", error);
            setAppStatus('offline');
            setIsInitialLoading(false);
        });

        return () => unsubscribe();
    }, [isAuthenticated, appStatus, isInitialLoading]);

    // 
    const saveDataToFirestore = useCallback(() => {
        if (isReadOnly || appStatus !== 'online' || !isAuthenticated || !dbRef.current) return;
        const docRef = doc(dbRef.current, 'artifacts', appId, 'public', 'sharedTimetable');
        const dataToSave = { timetable, eventConfig };
        setDoc(docRef, dataToSave, { merge: true }).catch(error => {
            console.error("Error saving data to Firestore:", error);
        });
    }, [timetable, eventConfig, isAuthenticated, appStatus, isReadOnly]);

    useEffect(() => {
        if (isReadOnly || appStatus === 'offline' || isInitialLoading) {
            return;
        }
        const handler = setTimeout(() => {
            saveDataToFirestore();
        }, 1000);
        return () => {
            clearTimeout(handler);
        };
    }, [timetable, eventConfig, saveDataToFirestore, appStatus, isInitialLoading, isReadOnly]);

    // 
    const handleSetMode = (newMode) => {
        if (isReadOnly && newMode === 'edit') {
            // ★★★ 
            console.warn("閲覧専用モードのため、編集モードには戻れません。");
            return;
        }
        if (newMode === 'live' && !imagesLoaded) {
            // ★★★ 
            console.warn("まだ画像の準備中っす！ちょっと待ってからもう一回押してくださいっす！");
            return;
        }
        setMode(newMode);
    };

    const isLoading = isInitialLoading;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-surface-background">
                <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spinner mb-4"></div>
                <p className="text-lg text-on-surface-variant">
                    {appStatus === 'connecting' ? "Connecting..." : "Loading Timetable..."}
                </p>
            </div>
        );
    }

    // 
    switch (appStatus) {
        case 'connecting':
            return <div className="flex items-center justify-center h-screen"><p className="text-2xl">Connecting...</p></div>;

        case 'config_error':
            return (
                <div className="flex items-center justify-center h-screen p-8 text-center bg-surface-background text-on-surface">
                    <div className="bg-surface-container p-8 rounded-2xl shadow-2xl max-w-2xl">
                        {/* ★★★ */}
                        <h1 className="text-2xl font-bold text-red-400 mb-4">Firebaseの設定が必要です</h1>
                        <p className="text-on-surface-variant mb-6">
                            このアプリを動作させるには、<code>src/firebase.js</code> ファイル内の <code>firebaseConfig</code> オブジェクトを、ご自身のFirebaseプロジェクトのものに置き換える必要があります。
                        </p>
                        <code className="bg-surface-background text-left p-4 rounded-lg block overflow-x-auto text-sm">
                            <pre className="whitespace-pre-wrap">
                                {`// src/firebase.js
const firebaseConfig = {
  apiKey: "ご自身のAPIキー",
  authDomain: "your-project.firebaseapp.com",
  // ...
};`}
                            </pre>
                        </code>
                        <p className="text-on-surface-variant mt-6 text-sm">
                            Firebaseコンソールでプロジェクトを作成し、ウェブアプリの設定画面から <code>firebaseConfig</code> をコピーして貼り付けてください。
                        </p>
                        {/* ★★★ */}
                    </div>
                </div>
            );

        case 'offline':
        case 'online':
            return (
                <>
                    {/* */}
                    <button
                        onClick={toggleTheme}
                        className="fixed bottom-4 right-4 z-50 bg-surface-container text-on-surface p-3 rounded-full shadow-lg hover:bg-brand-primary"
                        title="
"
                    >
                        {theme === 'dark' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                        )}
                    </button>
                    {/* */}

                    {appStatus === 'offline' && (
                        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500/90 text-white font-bold py-2 px-4 rounded-full shadow-lg flex items-center gap-2 animate-fade-in-up">
                            <AlertTriangleIcon className="w-5 h-5" />
                            <span>オフラインモード (データは保存・共有されません)</span>
                        </div>
                    )}

                    {/* */}
                    {mode === 'edit' && !isReadOnly ?
                        // 
                        <TimetableEditor
                            eventConfig={eventConfig}
                            setEventConfig={setEventConfig}
                            timetable={timetable}
                            setTimetable={setTimetable}
                            setMode={handleSetMode}
                            storage={storageRef.current} // 
                            timeOffset={timeOffset}
                        /> :
                        // 
                        <LiveView
                            timetable={timetable}
                            eventConfig={eventConfig}
                            setMode={handleSetMode}
                            loadedUrls={loadedUrls}
                            timeOffset={timeOffset}
                            isReadOnly={isReadOnly}
                            theme={theme} // ★★★ theme を渡すっす！
                        />
                    }
                </>
            );

        default:
            return <div className="flex items-center justify-center h-screen"><p className="text-2xl">Loading...</p></div>;
    }
};

export default App;