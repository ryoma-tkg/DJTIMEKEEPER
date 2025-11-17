// [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-db4819ead3cea781e61d33b885b764c6c79391fb/src/App.jsx]
import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
// 
import {
    auth, db, storage, appId,
    signInAnonymously, onAuthStateChanged,
    doc, onSnapshot, setDoc,
} from './firebase';

// 
import { TimetableEditor } from './components/TimetableEditor';
// 
import {
    AlertTriangleIcon,
    getTodayDateString,
    VIVID_COLORS,
    PowerIcon
} from './components/common';
import { LiveView } from './components/LiveView'; // 
import { useImagePreloader } from './hooks/useImagePreloader'; // 
import { DevControls } from './components/DevControls'; // 

// (getDefaultEventConfig - 変更なし)
const getDefaultEventConfig = () => ({
    title: 'DJ Timekeeper Pro',
    // 
    startDate: getTodayDateString(),
    startTime: '22:00',
    vjFeatureEnabled: false
});
// 


// 
const App = () => {
    const [mode, setMode] = useState('edit');
    const [timetable, setTimetable] = useState([]);
    const [vjTimetable, setVjTimetable] = useState([]); // 

    // 
    const [eventConfig, setEventConfig] = useState(getDefaultEventConfig());

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [appStatus, setAppStatus] = useState('connecting');
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const dbRef = useRef(null);
    const storageRef = useRef(null);
    const [timeOffset, setTimeOffset] = useState(0);
    const [isReadOnly, setIsReadOnly] = useState(false);
    // ▼▼▼ 【!!! 修正 !!!】 forceVjHide の state を削除 ▼▼▼
    // const [forceVjHide, setForceVjHide] = useState(false);
    // ▲▲▲ 【!!! 修正 !!!】 ここまで ▲▲▲

    // 
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    // 
    const [isDevMode, setIsDevMode] = useState(
        localStorage.getItem('devModeEnabled') === 'true'
    );
    // 


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

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    // (toggleDevMode - 変更なし)
    const toggleDevMode = () => {
        setIsDevMode(prev => {
            const newValue = !prev;
            localStorage.setItem('devModeEnabled', newValue);
            return newValue;
        });
    };
    // 


    const imageUrlsToPreload = useMemo(() => timetable.map(dj => dj.imageUrl), [timetable]);
    const { loadedUrls, allLoaded: imagesLoaded } = useImagePreloader(imageUrlsToPreload); // 

    // (useEffect fetchTimeOffset - 変更なし)
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
        // 
        if (!isDevMode) {
            fetchTimeOffset();
        } else {
            console.log("開発者モードONのため、自動時刻合わせをスキップしました。");
        }
    }, [appStatus, isDevMode]); // 

    // ▼▼▼ 【!!! 修正 !!!】 URLハッシュの判定ロジックを「#live」のみに戻す ▼▼▼
    useEffect(() => {
        // 
        if (window.location.hash === '#live') {
            // 参加者モード
            console.log("閲覧専用モード (#live) で起動っす！");
            setIsReadOnly(true);
            setMode('live');
            // setForceVjHide(true); // ★ 削除
        }
        // else if (window.location.hash === '#staff') { ... } // ★ 削除

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
    }, []); // 
    // ▲▲▲ 【!!! 修正 !!!】 ここまで ▲▲▲


    // (useEffect onSnapshot - 変更なし)
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
                setVjTimetable(data.vjTimetable || []); // 

                // 
                setEventConfig(prevConfig => ({
                    ...getDefaultEventConfig(), // 
                    ...(data.eventConfig || {}), // 
                    // 
                }));
                // 
            } else {
                console.log("No shared document! Creating initial data.");
                // 
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

    // (saveDataToFirestore - 変更なし)
    const saveDataToFirestore = useCallback(() => {
        if (isReadOnly || appStatus !== 'online' || !isAuthenticated || !dbRef.current) return;
        const docRef = doc(dbRef.current, 'artifacts', appId, 'public', 'sharedTimetable');
        // 
        const dataToSave = { timetable, vjTimetable, eventConfig };
        setDoc(docRef, dataToSave, { merge: true }).catch(error => {
            console.error("Error saving data to Firestore:", error);
        });
    }, [timetable, vjTimetable, eventConfig, isAuthenticated, appStatus, isReadOnly]); // 

    // (useEffect saveData - 変更なし)
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
    }, [timetable, vjTimetable, eventConfig, saveDataToFirestore, appStatus, isInitialLoading, isReadOnly]); // 

    // (handleSetMode - 変更なし)
    const handleSetMode = (newMode) => {
        if (isReadOnly && newMode === 'edit') {
            // 
            console.warn("閲覧専用モードのため、編集モードには戻れません。");
            return;
        }
        if (newMode === 'live' && !imagesLoaded) {
            // 
            console.warn("まだ画像の準備中っす！ちょっと待ってからもう一回押してくださいっす！");
            return;
        }
        setMode(newMode);
    };

    // (handleTimeJump, handleTimeReset - 変更なし)
    const handleTimeJump = (minutes) => {
        const msToAdd = minutes * 60 * 1000;
        setTimeOffset(prevOffset => prevOffset + msToAdd);
        console.log(`[DevMode] Time Jump: ${minutes} min. New offset: ${timeOffset + msToAdd}ms`);
    };
    const handleTimeReset = () => {
        setTimeOffset(0);
        console.log("[DevMode] Time Reset to 0.");
    };

    // (handleToggleVjFeature - 変更なし)
    const handleToggleVjFeature = () => {
        setEventConfig(prev => ({
            ...prev,
            vjFeatureEnabled: !prev.vjFeatureEnabled
        }));
    };

    // (handleSetStartNow - 変更なし)
    const handleSetStartNow = () => {
        console.log("[DevMode] Setting event start time to NOW (local)...");
        const now = new Date(); // 

        // 
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        const newStartDate = `${year}-${month}-${day}`;
        const newStartTime = `${hours}:${minutes}`;

        setEventConfig(prev => ({
            ...prev,
            startDate: newStartDate,
            startTime: newStartTime,
        }));
        setTimeOffset(0); // 
        console.log(`[DevMode] Event Start Time set to NOW: ${newStartDate} ${newStartTime}`);
    };
    // 

    // (handleLoadDummyData - 変更なし)
    const handleLoadDummyData = () => {
        console.log("[DevMode] Loading Dummy Data (No Images)...");
        const dummyDJs = [
            { id: 1700000000001, name: "Intro", duration: 5, imageUrl: '', color: VIVID_COLORS[0], isBuffer: true },
            { id: 1700000000002, name: "DJ Alpha", duration: 30, imageUrl: '', color: VIVID_COLORS[1], isBuffer: false },
            { id: 1700000000003, name: "DJ Bravo", duration: 30, imageUrl: '', color: VIVID_COLORS[2], isBuffer: false },
            { id: 1700000000004, name: "Changeover", duration: 5, imageUrl: '', color: VIVID_COLORS[3], isBuffer: true },
            { id: 1700000000005, name: "DJ Charlie", duration: 45, imageUrl: '', color: VIVID_COLORS[4], isBuffer: false }
        ];

        const dummyVJs = [
            { id: 1800000000001, name: "VJ One", duration: 65 }, // 5 + 30 + 30
            { id: 1800000000002, name: "VJ Two", duration: 50 }  // 5 + 45
        ];

        setTimetable(dummyDJs);
        if (eventConfig.vjFeatureEnabled) {
            setVjTimetable(dummyVJs);
        } else {
            setVjTimetable([]); // 
        }

        // 
        handleSetStartNow();
    };
    // (handleFinishEvent, crash state - 変更なし)
    const handleFinishEvent = () => {
        console.log("[DevMode] Forcing event finish...");
        // 
        handleTimeJump(1440);
    };
    const [crash, setCrash] = useState(false);
    if (crash) {
        throw new Error('Test Error from DevControls');
    }

    // 


    const isLoading = isInitialLoading;

    if (isLoading) {
        // (変更なし)
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
            // (変更なし)
            return <div className="flex items-center justify-center h-screen"><p className="text-2xl">Connecting...</p></div>;

        case 'config_error':
            // (変更なし)
            return (
                <div className="flex items-center justify-center h-screen p-8 text-center bg-surface-background text-on-surface">
                    <div className="bg-surface-container p-8 rounded-2xl shadow-2xl max-w-2xl">
                        {/* (省略) */}
                    </div>
                </div>
            );

        case 'offline':
        case 'online':
            return (
                <>
                    {/* (オフラインアラート - 変更なし) */}
                    {appStatus === 'offline' && (
                        <div className="fixed bottom-4 left-4 z-50 bg-amber-500/90 text-white font-bold py-2 px-4 rounded-full shadow-lg flex items-center gap-2 animate-fade-in-up">
                            <AlertTriangleIcon className="w-5 h-5" />
                            <span>オフラインモード</span>
                        </div>
                    )}

                    {/* ▼▼▼ 【!!! 修正 !!!】 LiveView から forceVjHide を削除 ▼▼▼ */}
                    {mode === 'edit' && !isReadOnly ?
                        // 
                        <TimetableEditor
                            eventConfig={eventConfig}
                            setEventConfig={setEventConfig}
                            timetable={timetable}
                            setTimetable={setTimetable}
                            vjTimetable={vjTimetable} // 
                            setVjTimetable={setVjTimetable} // 
                            setMode={handleSetMode}
                            storage={storageRef.current} // 
                            timeOffset={timeOffset}
                            theme={theme} // 
                            toggleTheme={toggleTheme} // 
                            imagesLoaded={imagesLoaded} // 
                        /> :
                        // 
                        <LiveView
                            timetable={timetable}
                            vjTimetable={vjTimetable} // 
                            eventConfig={eventConfig} // 
                            setMode={handleSetMode}
                            loadedUrls={loadedUrls}
                            timeOffset={timeOffset}
                            isReadOnly={isReadOnly}
                            // forceVjHide={forceVjHide} // ★【削除】
                            theme={theme} // 
                            toggleTheme={toggleTheme} // 
                        />
                    }
                    {/* ▲▲▲ 【!!! 修正 !!!】 ここまで ▲▲▲ */}


                    {/* (DevControls - 変更なし) */}
                    {isDevMode && !isReadOnly && (
                        <DevControls
                            mode={mode}
                            setMode={handleSetMode} // 
                            timeOffset={timeOffset}
                            onTimeJump={handleTimeJump}
                            onTimeReset={handleTimeReset}

                            // 
                            eventConfig={eventConfig}
                            timetable={timetable}
                            vjTimetable={vjTimetable}
                            onToggleVjFeature={handleToggleVjFeature}
                            onLoadDummyData={handleLoadDummyData}
                            onSetStartNow={handleSetStartNow}
                            onFinishEvent={handleFinishEvent}
                            onCrashApp={() => setCrash(true)}

                            imagesLoaded={imagesLoaded} // 
                            onToggleDevMode={toggleDevMode} // 
                        />
                    )}

                    {/* (開発者モードON/OFFボタン - 変更なし) */}
                    {!isReadOnly && (
                        <button
                            onClick={toggleDevMode}
                            title="開発者モード切替"
                            className={`
                                fixed z-[998] right-4
                                ${isDevMode ? 'bottom-[270px]' : 'bottom-4'} 
                                w-12 h-12 rounded-full 
                                flex items-center justify-center 
                                shadow-xl transition-all duration-300
                                ${isDevMode ? 'bg-brand-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-background'}
                            `}
                        >
                            <PowerIcon className="w-6 h-6" />
                        </button>
                    )}
                    {/* */}
                </>
            );

        default:
            return <div className="flex items-center justify-center h-screen"><p className="text-2xl">Loading...</p></div>;
    }
};

export default App;