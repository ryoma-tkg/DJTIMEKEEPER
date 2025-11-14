import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
// 
import {
    auth, db, storage, appId,
    signInAnonymously, onAuthStateChanged,
    doc, onSnapshot, setDoc,
} from './firebase';

// 
import { TimetableEditor } from './components/TimetableEditor';
import { SimpleImage, UserIcon, AlertTriangleIcon, parseTime, GodModeIcon } from './components/common';
import { FullTimelineView } from './components/FullTimelineView';


// 
const BackgroundImage = memo(() => {
    return null;
});

const useImagePreloader = (urls) => {
    const [loadedUrls, setLoadedUrls] = useState(new Set());
    // 
    const urlsKey = JSON.stringify(urls);

    useEffect(() => {
        let isCancelled = false;
        // 
        const filteredUrls = JSON.parse(urlsKey);

        // 
        // 
        setLoadedUrls(prevSet => {
            const newSet = new Set();
            let changed = false;

            prevSet.forEach(url => {
                if (filteredUrls.includes(url)) {
                    newSet.add(url);
                } else {
                    changed = true; // 
                }
            });

            // 
            if (!changed && prevSet.size === filteredUrls.length) {
                return prevSet; // 
            }
            return newSet;
        });

        // 
        const loadImages = async () => {
            try {
                await Promise.all(
                    filteredUrls.map(url => {
                        // 
                        if (!url) {
                            return Promise.resolve();
                        }

                        return new Promise((resolve) => {
                            const img = new Image();
                            img.src = url;
                            img.onload = () => {
                                if (!isCancelled) {
                                    // 
                                    // 
                                    setLoadedUrls(prevSet => {
                                        // 
                                        if (prevSet.has(url)) return prevSet;

                                        // 
                                        const updatedSet = new Set(prevSet);
                                        updatedSet.add(url);
                                        return updatedSet;
                                    });
                                }
                                resolve();
                            };
                            img.onerror = () => {
                                // 
                                console.warn(`[useImagePreloader] Failed to load image: ${url}`);
                                resolve();
                            };
                        });
                    })
                );
            } catch (error) {
                if (!isCancelled) console.error("Failed to preload images", error);
            }
        };

        loadImages(); // 

        return () => { isCancelled = true; };
    }, [urlsKey]); // 

    const allLoaded = urls.filter(Boolean).every(url => loadedUrls.has(url));
    return { loadedUrls, allLoaded };
};

const LiveView = ({ timetable, eventConfig, setMode, loadedUrls, timeOffset, isReadOnly }) => {
    const [now, setNow] = useState(new Date(new Date().getTime() + timeOffset));
    const timelineContainerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);

    const [isFullTimelineOpen, setIsFullTimelineOpen] = useState(false);

    // 
    const [currentData, setCurrentData] = useState(null);

    // 
    const [visibleContent, setVisibleContent] = useState(null);
    // 
    const [isFadingOut, setIsFadingOut] = useState(false);

    // 
    const animationTimerRef = useRef(null);

    const schedule = useMemo(() => {
        if (timetable.length === 0) return [];
        const scheduleData = [];
        let lastEndTime = parseTime(eventConfig.startTime);
        for (const dj of timetable) {
            const startTime = new Date(lastEndTime);
            const durationMinutes = parseFloat(dj.duration) || 0;
            const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
            scheduleData.push({ ...dj, startTime, endTime });
            lastEndTime = endTime;
        }
        return scheduleData;
    }, [timetable, eventConfig.startTime]);

    const currentlyPlayingIndex = useMemo(() => {
        return schedule.findIndex(dj => now >= dj.startTime && now < dj.endTime)
    }, [now, schedule]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date(new Date().getTime() + timeOffset)), 1000);
        const updateWidth = () => {
            if (timelineContainerRef.current) setContainerWidth(timelineContainerRef.current.offsetWidth);
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => {
            clearInterval(timer);
            window.removeEventListener('resize', updateWidth);
        };
    }, [timeOffset]);

    // 
    useEffect(() => {
        const currentIndex = currentlyPlayingIndex;

        let newContentData = null;

        if (currentIndex !== -1) {
            // --- ON AIR ---
            const dj = schedule[currentIndex];
            const nextDj = (currentIndex < schedule.length - 1) ? schedule[currentIndex + 1] : null;
            const total = (dj.endTime - dj.startTime) / 1000;
            const remainingMs = (dj.endTime - now);
            const remainingSeconds = Math.floor(remainingMs / 1000);
            const visualProgress = (remainingSeconds <= 0 && remainingMs > -1000)
                ? 100
                : (total > 0 ? ((total - (remainingMs / 1000)) / total) * 100 : 0);

            newContentData = {
                ...dj,
                status: 'ON AIR',
                timeLeft: remainingSeconds,
                progress: visualProgress,
                nextDj: nextDj,
                animationKey: dj.id
            };

        } else {
            const upcomingDj = schedule.find(dj => now < dj.startTime);
            if (upcomingDj) {
                // --- UPCOMING ---
                const remainingMs = (upcomingDj.startTime - now);
                const remainingSeconds = Math.ceil(remainingMs / 1000);

                newContentData = {
                    ...upcomingDj,
                    status: 'UPCOMING',
                    timeLeft: remainingSeconds,
                    progress: 0,
                    nextDj: schedule[0],
                    animationKey: `upcoming-${upcomingDj.id}`
                };
            } else {
                // --- FINISHED ---
                newContentData = {
                    id: 'finished',
                    status: 'FINISHED',
                    animationKey: 'finished'
                };
            }
        }
        setCurrentData(newContentData);

    }, [now, schedule, currentlyPlayingIndex]);

    // 
    useEffect(() => {
        // 
        if (!visibleContent && currentData) {
            setVisibleContent(currentData);
            return;
        }
        // 
        if (currentData && visibleContent) {
            if (currentData.animationKey !== visibleContent.animationKey) {

                if (animationTimerRef.current) {
                    clearTimeout(animationTimerRef.current);
                }
                const FADE_OUT_DURATION = 400;
                setIsFadingOut(true);
                animationTimerRef.current = setTimeout(() => {
                    setVisibleContent(currentData);
                    setIsFadingOut(false);
                    animationTimerRef.current = null;
                }, FADE_OUT_DURATION);
            }
            // 
            else if (currentData.animationKey === visibleContent.animationKey && !isFadingOut) {
                setVisibleContent(currentData);
            }
        }
    }, [currentData, visibleContent]);

    // 
    useEffect(() => {
        let wakeLock = null;

        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await navigator.wakeLock.request('screen');
                    console.log('Wake Lock is active!');
                } else {
                    console.warn('Wake Lock API is not supported on this browser.');
                }
            } catch (err) {
                // 
                console.error(`${err.name}, ${err.message}`);
            }
        };

        // 
        requestWakeLock();

        // 
        const handleVisibilityChange = () => {
            if (wakeLock !== null && document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            // 
            if (wakeLock !== null) {
                wakeLock.release().then(() => {
                    console.log('Wake Lock released');
                    wakeLock = null;
                });
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);
    // 


    const timelineTransform = useMemo(() => {
        if (schedule.length === 0 || containerWidth === 0) return 'translateX(0px)';
        const itemWidth = 256, gap = 24, step = itemWidth + gap;
        const centerScreenOffset = containerWidth / 2, centerItemOffset = itemWidth / 2;

        const targetId = visibleContent?.id;
        let targetIndex = schedule.findIndex(dj => dj.id === targetId);

        if (targetIndex === -1) {
            if (visibleContent?.status === 'FINISHED') targetIndex = schedule.length - 1;
            else targetIndex = 0;
        }

        const finalX = centerScreenOffset - centerItemOffset - (targetIndex * step);
        return `translateX(${finalX}px)`;
    }, [visibleContent, containerWidth, schedule]);

    const formatTime = (seconds) => {
        if (seconds < 0) seconds = 0;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const bgColorStyle = (visibleContent?.status === 'ON AIR' && !isFadingOut)
        ? { background: `radial-gradient(ellipse 80% 60% at 50% 120%, ${visibleContent.color}33, transparent)` }
        : {};

    const renderContent = (content) => {
        if (!content) return null;

        // --- UPCOMING ---
        if (content.status === 'UPCOMING') {
            const dj = content;
            const eventStartTime = eventConfig.startTime;
            const eventEndTime = schedule.length > 0
                ? schedule[schedule.length - 1].endTime.toTimeString().slice(0, 5)
                : '??:??';

            return (
                <main className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center text-center">
                    <h2 className="text-2xl md:text-3xl text-on-surface-variant font-bold tracking-widest mb-4">UPCOMING</h2>
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold break-words leading-tight">{eventConfig.title}</h1>
                    <p className="text-2xl md:text-3xl font-semibold tracking-wider font-mono mt-4" style={{ color: dj.color }}>
                        {eventStartTime} - {eventEndTime}
                    </p>
                    <p className="flex flex-col items-center justify-center text-6xl sm:text-7xl md:text-8xl text-on-surface my-12">
                        <span className="text-3xl sm:text-4xl text-on-surface-variant font-sans font-bold mb-2">開始まで</span>
                        <span className="font-mono inline-block text-center w-[5ch]">{formatTime(dj.timeLeft)}</span>
                    </p>
                </main>
            );
        }

        // --- ON AIR ---
        if (content.status === 'ON AIR') {
            const dj = content;
            const isImageReady = !dj.imageUrl || loadedUrls.has(dj.imageUrl);

            return (
                <main className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-8">

                    {/* */}
                    {!dj.isBuffer && (
                        <div className={`
                            w-full max-w-sm sm:max-w-md aspect-square bg-surface-container rounded-full shadow-2xl overflow-hidden flex-shrink-0 relative
                            transform-gpu
                        `}>
                            <div className={`
                                w-full h-full flex items-center justify-center 
                                transition-opacity duration-300 ease-in-out 
                                ${isImageReady ? 'opacity-100' : 'opacity-100'} 
                            `}>

                                {/* */}
                                {dj.imageUrl && isImageReady ? (
                                    <SimpleImage src={dj.imageUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-1/2 h-1/2 text-on-surface-variant" />
                                )}
                            </div>

                            {dj.imageUrl && !isImageReady && (
                                <div className={`
                                    absolute inset-0 flex items-center justify-center 
                                    bg-surface-container 
                                    opacity-100
                                `}>
                                    <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spinner"></div>
                                </div>
                            )}
                        </div>
                    )}
                    {/* */}

                    {/* */}
                    <div className={`flex flex-col ${dj.isBuffer ? 'items-center text-center' : 'text-center md:text-left'}`}>
                        <div className="flex flex-col">
                            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold break-words leading-tight mb-3">{dj.name}</h1>
                            <p className="text-2xl md:text-3xl font-semibold tracking-wider font-mono mb-3" style={{ color: dj.color }}>
                                {dj.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {dj.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {dj.isBuffer ? (
                                <p className="flex flex-col items-center justify-center text-6xl sm:text-7xl md:text-8xl text-on-surface my-4">
                                    <span className="text-3xl sm:text-4xl text-on-surface-variant font-sans font-bold mb-2 mt-4">残り</span>
                                    <span className="font-mono inline-block text-center w-[5ch]">{formatTime(dj.timeLeft)}</span>
                                </p>
                            ) : (
                                <p className="flex items-baseline justify-center md:justify-start text-6xl sm:text-7xl md:text-8xl text-on-surface my-2 whitespace-nowrap">
                                    <span className="text-3xl sm:text-4xl text-on-surface-variant mr-4 font-sans font-bold">残り</span>
                                    <span className="font-mono inline-block text-left w-[5ch]">{formatTime(dj.timeLeft)}</span>
                                </p>
                            )}
                            <div className={`bg-surface-container rounded-full h-3.5 overflow-hidden w-full`}>
                                <div className="h-full rounded-full transition-all duration-500 ease-in-out"
                                    style={{ width: `${dj.progress}%`, backgroundColor: dj.color }}></div>
                            </div>
                        </div>
                        {dj.nextDj && (
                            <div className="mt-8 pt-6 border-t border-on-surface-variant/20">
                                <p className="text-sm text-on-surface-variant font-bold tracking-widest mb-1">NEXT UP</p>
                                <p className="text-2xl font-semibold">{dj.nextDj.name} <span className="text-lg font-sans text-on-surface-variant ml-2 font-mono">{dj.nextDj.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ~</span></p>
                            </div>
                        )}
                    </div>
                </main>
            );
        }

        // --- FINISHED ---
        if (content.status === 'FINISHED') {
            return (<div className="text-center"><h1 className="text-5xl md:text-7xl font-bold">EVENT FINISHED</h1></div>);
        }

        return null;
    };


    // 
    const scheduleForModal = useMemo(() => {
        return schedule.map(dj => ({
            ...dj,
            startTime: dj.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            endTime: dj.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            // 
            startTimeDate: dj.startTime.toISOString(),
            endTimeDate: dj.endTime.toISOString(),
        }));
    }, [schedule]);

    return (
        <div className="fixed inset-0" style={bgColorStyle}>
            {/* Header */}
            <header className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 w-max flex flex-col items-center space-y-2 z-20">
                <h1 className="text-xl font-bold text-on-surface-variant tracking-wider">{eventConfig.title}</h1>
                <div className="bg-black/30 backdrop-blur-sm text-on-surface font-bold py-2 px-4 rounded-full text-2xl tracking-wider font-mono text-center w-[10ch]">
                    {now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
            </header>

            {/* */}
            <div className="absolute top-4 md:top-8 right-4 flex gap-2 z-20">
                <button
                    onClick={() => setIsFullTimelineOpen(true)}
                    className="flex items-center bg-surface-container/50 backdrop-blur-sm hover:bg-surface-container text-white font-semibold py-2 px-4 rounded-full transition-colors duration-200 text-sm"
                >
                    全体を見る
                </button>
                {!isReadOnly && (
                    <button onClick={() => setMode('edit')} className="flex items-center bg-surface-container hover:opacity-90 text-white font-bold py-2 px-4 rounded-full transition-opacity duration-200 text-sm">
                        編集
                    </button>
                )}
            </div>
            {/* */}

            {/* Main Content Area */}
            <div className="absolute top-24 bottom-32 left-0 right-0 px-4 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full overflow-y-auto flex items-center justify-center relative">
                    {visibleContent && (
                        <div
                            key={visibleContent.animationKey}
                            className={`
                                w-full absolute inset-0 p-4 flex items-center justify-center will-change-[transform,opacity]
                                ${isFadingOut ? 'animate-fade-out-down' : 'animate-fade-in-up'}
                            `}
                        >
                            {renderContent(visibleContent)}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Timeline */}
            {currentData?.status !== 'FINISHED' && (
                <div ref={timelineContainerRef} className="absolute bottom-0 left-0 right-0 w-full shrink-0 overflow-hidden mask-gradient z-10 pb-4 h-32">
                    <div
                        className="flex h-full items-center space-x-6 px-4 py-2 will-change-transform"
                        style={{
                            transform: timelineTransform,
                            transition: 'transform 0.4s ease-in-out'
                        }}
                    >
                        {schedule.map((dj, index) => {
                            const isPlaying = currentlyPlayingIndex === index;
                            // 
                            const borderClass = isPlaying ? 'border-2 border-white' : 'border border-white/30';

                            return (
                                <div
                                    key={dj.id}
                                    className={`
                                            shrink-0 w-64 h-24 bg-surface-container/40 backdrop-blur-sm rounded-2xl p-4 flex items-center 
                                            ${borderClass} 
                                            ${dj.isBuffer ? 'justify-center' : 'space-x-6'} 
                                        
                                            ${isPlaying ? 'opacity-100 scale-100' : 'opacity-60 scale-90'}
                                            transition-all duration-1000 ease-in-out 
                                            will-change-[opacity,transform,border] 
                                          `}
                                >

                                    {/* */}
                                    {dj.imageUrl ? (
                                        <div className="w-14 h-14 rounded-full bg-surface-container flex-shrink-0 flex items-center justify-center overflow-hidden">
                                            <SimpleImage src={dj.imageUrl} className="w-full h-full object-cover" />
                                        </div>
                                    ) : !dj.isBuffer ? (
                                        <div className="w-14 h-14 rounded-full bg-surface-container flex-shrink-0 flex items-center justify-center overflow-hidden">
                                            <UserIcon className="w-8 h-8 text-on-surface-variant" />
                                        </div>
                                    ) : null /* */}
                                    {/* */}

                                    <div className="overflow-hidden flex flex-col justify-center">
                                        <p className={`text-lg font-bold truncate w-full ${dj.isBuffer ? 'text-center' : 'text-left'}`}>{dj.name}</p>
                                        <p className={`text-sm font-mono text-on-surface-variant ${dj.isBuffer ? 'text-center' : 'text-left'}`}>{dj.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* */}
            <FullTimelineView
                isOpen={isFullTimelineOpen}
                onClose={() => setIsFullTimelineOpen(false)}
                schedule={scheduleForModal}
                now={now}
                currentlyPlayingIndex={currentlyPlayingIndex}
            />
        </div>
    );
};


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
    const { loadedUrls, allLoaded: imagesLoaded } = useImagePreloader(imageUrlsToPreload);

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
                        />
                    }
                </>
            );

        default:
            return <div className="flex items-center justify-center h-screen"><p className="text-2xl">Loading...</p></div>;
    }
};

export default App;