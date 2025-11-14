import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
// 
import { SimpleImage, UserIcon, parseTime, GodModeIcon, MenuIcon, XIcon, InfoIcon, ToastNotification, SettingsIcon, MoonIcon, SunIcon } from './common';
import { FullTimelineView } from './FullTimelineView';

// 
const BackgroundImage = memo(() => {
    return null;
});

// 
const LiveSettingsModal = ({
    isOpen,
    onClose,
    theme,
    toggleTheme,
    isWakeLockEnabled,
    onWakeLockToggle
}) => {
    if (!isOpen) return null;

    // 
    const ThemeToggle = () => (
        <div className="flex items-center justify-between">
            <label className="text-base text-on-surface">テーマ</label>
            <button
                onClick={toggleTheme}
                className="flex items-center gap-2 bg-surface-background hover:opacity-80 text-on-surface-variant font-semibold py-2 px-4 rounded-full"
            >
                {theme === 'dark' ? (
                    <>
                        <MoonIcon className="w-5 h-5" /> <span>ダーク</span>
                    </>
                ) : (
                    <>
                        <SunIcon className="w-5 h-5" /> <span>ライト</span>
                    </>
                )}
            </button>
        </div>
    );

    // 
    const WakeLockToggle = () => (
        <div className="flex items-center justify-between">
            <label className="text-base text-on-surface">画面のスリープ防止</label>
            <button
                onClick={onWakeLockToggle}
                className={`w-14 h-8 rounded-full flex items-center p-1 transition-colors ${isWakeLockEnabled ? 'bg-brand-primary justify-end' : 'bg-surface-background justify-start'
                    }`}
            >
                <span className="w-6 h-6 rounded-full bg-white shadow-md block" />
            </button>
        </div>
    );


    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in-up" onClick={onClose}>
            <div className="bg-surface-container rounded-2xl p-6 w-full max-w-md shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-background text-on-surface-variant hover:text-on-surface"
                >
                    <XIcon className="w-6 h-6" />
                </button>

                <h2 className="text-2xl font-bold mb-6">表示設定</h2>

                <div className="space-y-4">
                    <ThemeToggle />
                    <WakeLockToggle />
                </div>
            </div>
        </div>
    );
};

// ★★★ VJバーのレイアウトをPC/SP共に修正っす！ ★★★
const VjBar = ({ vjTimetable, now }) => {
    // 
    const formatVjTime = (seconds) => {
        if (seconds < 0) seconds = 0;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        // 
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    // 
    const { currentVj, nextVj } = useMemo(() => {
        let currentVj = null;
        let nextVj = null;

        const sortedVjs = [...vjTimetable].sort((a, b) => {
            return parseTime(a.startTime) - parseTime(b.startTime);
        });

        for (const vj of sortedVjs) {
            const startTime = parseTime(vj.startTime);
            const endTime = parseTime(vj.endTime);

            // 
            const isPlaying = (endTime < startTime)
                ? (now >= startTime) || (now < endTime) // 
                : (now >= startTime && now < endTime);  // 

            if (isPlaying) {
                currentVj = vj;
            } else if (now < startTime && !nextVj) {
                nextVj = vj; // 
            }
        }

        // 
        if (!currentVj && !nextVj && sortedVjs.length > 0 && now < sortedVjs[0].startTime) {
            nextVj = sortedVjs[0];
        }

        return { currentVj, nextVj };
    }, [vjTimetable, now]);

    // VJ
    const remainingSeconds = useMemo(() => {
        if (!currentVj) return 0;
        const endTime = parseTime(currentVj.endTime);
        let remainingMs = endTime.getTime() - now.getTime();

        // 
        if (endTime < parseTime(currentVj.startTime) && endTime < now) {
            remainingMs += 24 * 60 * 60 * 1000; // 
        }

        return Math.max(0, remainingMs / 1000);
    }, [currentVj, now]);


    return (
        <div className="absolute bottom-32 left-0 right-0 w-full h-auto min-h-[6rem] z-10 flex flex-col items-center justify-center px-4 md:px-8 py-4">

            {/* --- 区切り線（上） --- */}
            <div className="w-full max-w-3xl border-t border-on-surface/10 mb-4" /> {/* ★ max-w-3xl に変更 */}

            {/* --- VJ情報 (1ライン表示) --- */}
            <div className="flex items-baseline justify-center gap-2 sm:gap-4 flex-nowrap w-full max-w-3xl"> {/* ★ max-w-3xl に変更 */}

                {/* --- 1. 現在のVJ --- */}
                {currentVj ? (
                    <div className="flex items-baseline gap-2 min-w-0"> {/* ★ min-w-0 追加 */}
                        <span className="text-lg sm:text-2xl font-bold truncate max-w-[100px] sm:max-w-xs">{currentVj.name}</span>
                        <span className="text-xl sm:text-3xl font-mono font-bold text-on-surface-variant tabular-nums">{formatVjTime(remainingSeconds)}</span>
                    </div>
                ) : (
                    <span className="text-lg sm:text-2xl font-bold text-on-surface-variant/50">VJ STANDBY</span>
                )}

                {/* --- 2. 区切り --- */}
                {currentVj && nextVj && (
                    <span className="text-2xl text-on-surface-variant/30 mx-2 sm:mx-4">|</span>
                )}

                {/* --- 3. 次のVJ --- */}
                {nextVj ? (
                    <div className="flex items-baseline gap-2 text-left min-w-0"> {/* ★ hidden 削除, min-w-0 追加 */}
                        <span className="text-xs sm:text-sm text-on-surface-variant uppercase font-bold self-center">NEXT VJ</span>
                        <span className="text-sm sm:text-lg font-semibold truncate max-w-[100px] sm:max-w-xs">{nextVj.name}</span>
                        <span className="text-sm sm:text-lg font-mono text-on-surface-variant/70 whitespace-nowrap">{nextVj.startTime}~</span>
                    </div>
                ) : null}
            </div>
        </div>
    );
};


// 
export const LiveView = ({ timetable, vjTimetable, eventConfig, setMode, loadedUrls, timeOffset, isReadOnly, theme, toggleTheme }) => { // 
    const [now, setNow] = useState(new Date(new Date().getTime() + timeOffset));
    const timelineContainerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);

    const [isFullTimelineOpen, setIsFullTimelineOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false); // 
    const [isSettingsOpen, setIsSettingsOpen] = useState(false); // 

    // 
    const [currentData, setCurrentData] = useState(null);

    // 
    const [visibleContent, setVisibleContent] = useState(null);
    // 
    const [isFadingOut, setIsFadingOut] = useState(false);

    // 
    const animationTimerRef = useRef(null);

    // 
    const [timerDisplayMode, setTimerDisplayMode] = useState('currentTime'); // 'currentTime', 'eventRemaining', 'eventElapsed'
    const [toast, setToast] = useState({ message: '', visible: false });
    const toastTimerRef = useRef(null);

    // 
    const [isWakeLockEnabled, setIsWakeLockEnabled] = useState(
        localStorage.getItem('wakeLockEnabled') === 'true'
    );
    const wakeLockRef = useRef(null); // 

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

    // 
    const { eventStartTime, eventEndTime, eventRemainingSeconds, eventElapsedSeconds } = useMemo(() => {
        if (schedule.length === 0) {
            return { eventStartTime: null, eventEndTime: null, eventRemainingSeconds: 0, eventElapsedSeconds: 0 };
        }
        // 
        const startTime = schedule[0].startTime;
        // 
        const endTime = schedule[schedule.length - 1].endTime;

        // 
        const remaining = (endTime.getTime() - now.getTime()) / 1000;
        // 
        const elapsed = (now.getTime() - startTime.getTime()) / 1000;

        return {
            eventStartTime: startTime,
            eventEndTime: endTime,
            eventRemainingSeconds: Math.max(0, remaining),
            eventElapsedSeconds: Math.max(0, elapsed),
        };
    }, [schedule, now]);

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
        const requestWakeLock = async () => {
            if ('wakeLock' in navigator && isWakeLockEnabled) {
                try {
                    wakeLockRef.current = await navigator.wakeLock.request('screen');
                    console.log('Wake Lock is active!');
                } catch (err) {
                    console.error(`${err.name}, ${err.message}`);
                }
            } else {
                console.warn('Wake Lock API is not supported or disabled by user.');
            }
        };

        const releaseWakeLock = () => {
            if (wakeLockRef.current) {
                wakeLockRef.current.release().then(() => {
                    console.log('Wake Lock released');
                    wakeLockRef.current = null;
                });
            }
        };

        requestWakeLock(); // 

        // 
        const handleVisibilityChange = () => {
            if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            releaseWakeLock(); // 
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            // 
            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
            }
        };
    }, [isWakeLockEnabled]); // 
    // 

    // 
    const handleWakeLockToggle = () => {
        const newValue = !isWakeLockEnabled;
        setIsWakeLockEnabled(newValue);
        localStorage.setItem('wakeLockEnabled', newValue);
        if (newValue) {
            showToast('スリープ防止 ON');
        } else {
            showToast('スリープ防止 OFF');
        }
    };

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

    // 
    const formatTime = (seconds) => {
        if (seconds < 0) seconds = 0;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    // 
    const formatDurationHHMMSS = (totalSeconds) => {
        if (totalSeconds < 0) totalSeconds = 0;
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = Math.floor(totalSeconds % 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    // 
    const bgColorStyle = useMemo(() => {
        if (visibleContent?.status !== 'ON AIR' || isFadingOut) {
            return {};
        }
        // 
        const opacity = theme === 'light' ? '66' : '33'; // 
        return {
            background: `radial-gradient(ellipse 80% 60% at 50% 120%, ${visibleContent.color}${opacity}, transparent)`
        };
    }, [visibleContent, isFadingOut, theme]);

    // 
    const showToast = (message) => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
            setToast({ message: '', visible: false }); // 
        }

        // 
        setTimeout(() => {
            setToast({ message, visible: true });
            toastTimerRef.current = setTimeout(() => {
                setToast(prev => ({ ...prev, visible: false }));
                toastTimerRef.current = null;
            }, 2000); // 2
        }, 100); // 
    };

    // 
    const handleTimerClick = () => {
        if (schedule.length === 0) return; // 

        if (timerDisplayMode === 'currentTime') {
            setTimerDisplayMode('eventRemaining');
            showToast('終了まで');
        } else if (timerDisplayMode === 'eventRemaining') {
            setTimerDisplayMode('eventElapsed');
            showToast('経過時間');
        } else {
            setTimerDisplayMode('currentTime');
            showToast('現在時刻');
        }
    };


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
                    {/* */}
                    <h2 className="text-xl sm:text-2xl md:text-3xl text-on-surface-variant font-bold tracking-widest mb-4">UPCOMING</h2>
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold break-words leading-tight">{eventConfig.title}</h1>
                    <p className="text-lg sm:text-2xl md:text-3xl font-semibold tracking-wider font-mono mt-4" style={{ color: dj.color }}>
                        {eventStartTime} - {eventEndTime}
                    </p>
                    <p className="flex flex-col items-center justify-center text-5xl sm:text-6xl md:text-8xl text-on-surface my-12">
                        <span className="text-xl sm:text-3xl md:text-4xl text-on-surface-variant font-sans font-bold mb-2">開始まで</span>
                        <span className="font-mono inline-block text-center w-[5ch]">{formatTime(dj.timeLeft)}</span>
                    </p>
                </main>
            );
        }

        // --- ON AIR ---
        if (content.status === 'ON AIR') {
            const dj = content;
            const isImageReady = !dj.imageUrl || loadedUrls.has(dj.imageUrl);

            // 

            return (
                <main className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">

                    {/* */}
                    {!dj.isBuffer && (
                        <div className={`
                            w-full max-w-[240px] sm:max-w-xs md:max-w-sm aspect-square bg-surface-container rounded-full shadow-2xl overflow-hidden flex-shrink-0 relative
                            transform-gpu
                        `}>
                            <div className={`
                                w-full h-full flex items-center justify-center 
                                transition-opacity duration-300 ease-in-out 
                                ${isImageReady ? 'opacity-100' : 'opacity-100'} 
                            `}>
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
                            {/* */}
                            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold break-words leading-tight mb-2">{dj.name}</h1>

                            {/* */}

                            <p className="text-lg sm:text-2xl md:text-3xl font-semibold tracking-wider font-mono mb-2" style={{ color: dj.color }}>
                                {dj.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {dj.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {dj.isBuffer ? (
                                <p className="flex flex-col items-center justify-center text-5xl sm:text-6xl md:text-8xl text-on-surface my-2">
                                    <span className="text-xl sm:text-3xl md:text-4xl text-on-surface-variant font-sans font-bold mb-1 mt-2">残り</span>
                                    <span className="font-mono inline-block text-center w-[5ch]">{formatTime(dj.timeLeft)}</span>
                                </p>
                            ) : (
                                <p className="flex items-baseline justify-center md:justify-start text-5xl sm:text-6xl md:text-8xl text-on-surface my-1 whitespace-nowrap">
                                    <span className="text-xl sm:text-3xl md:text-4xl text-on-surface-variant mr-3 font-sans font-bold">残り</span>
                                    <span className="font-mono inline-block text-left w-[5ch]">{formatTime(dj.timeLeft)}</span>
                                </p>
                            )}

                            {/* */}
                            <div className={`bg-surface-container rounded-full h-3.5 overflow-hidden w-full mt-2`}>
                                <div className="h-full rounded-full transition-all duration-500 ease-in-out"
                                    style={{ width: `${dj.progress}%`, backgroundColor: dj.color }}></div>
                            </div>
                        </div>
                        {dj.nextDj && (
                            <div className="mt-6 pt-4 border-t border-on-surface-variant/20">
                                <p className="text-sm text-on-surface-variant font-bold tracking-widest mb-1">NEXT UP</p>
                                {/* */}
                                <p className="text-xl sm:text-2xl font-semibold">{dj.nextDj.name} <span className="text-base sm:text-lg font-sans text-on-surface-variant ml-2 font-mono">{dj.nextDj.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ~</span></p>
                            </div>
                        )}
                    </div>
                </main>
            );
        }

        // --- FINISHED ---
        if (content.status === 'FINISHED') {
            {/* */ }
            return (<div className="text-center"><h1 className="text-4xl sm:text-5xl md:text-7xl font-bold">EVENT FINISHED</h1></div>);
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
            {/* */}
            <ToastNotification
                message={toast.message}
                isVisible={toast.visible}
                className="top-32 md:top-24" // 
            />

            {/* */}
            <header className="absolute top-0 left-0 right-0 p-4 md:p-8 z-20 flex flex-wrap justify-between items-center gap-y-2">

                {/* 1. タイトル (PC: order-1, SP: order-1) */}
                <div className="w-auto md:flex-1 flex justify-start order-1">
                    <h1 className="text-xl font-bold text-on-surface-variant tracking-wider truncate max-w-[calc(100vw-120px)] md:max-w-xs">
                        {eventConfig.title}
                    </h1>
                </div>

                {/* 2. 時計 (PC: order-2, SP: order-3 / full-width) */}
                <div className="w-full md:w-auto flex-shrink-0 mx-auto order-3 md:order-2">
                    {/* ★★★ ガタつき防止 (tabular-nums) を追加っす！ ★★★ */}
                    <div
                        className="bg-surface-container/50 dark:bg-black/30 backdrop-blur-sm text-on-surface font-bold py-2 px-4 rounded-full text-xl tracking-wider font-mono text-center min-w-[10ch] tabular-nums cursor-pointer"
                        onClick={handleTimerClick}
                        title="クリックで表示切替"
                    >
                        {/* */}
                        {timerDisplayMode === 'currentTime' && (
                            now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        )}
                        {timerDisplayMode === 'eventRemaining' && (
                            `-${formatDurationHHMMSS(eventRemainingSeconds)}`
                        )}
                        {timerDisplayMode === 'eventElapsed' && (
                            `+${formatDurationHHMMSS(eventElapsedSeconds)}`
                        )}
                    </div>
                </div>

                {/* 3. ハンバーガーボタン (PC: order-3, SP: order-2) */}
                <div className="w-auto md:flex-1 flex justify-end order-2 md:order-3">
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-surface-container/50 backdrop-blur-sm hover:bg-surface-container text-on-surface font-semibold rounded-full transition-colors duration-200"
                    >
                        <MenuIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>
            {/* */}


            {/* */}
            {/* */}
            <div
                className={`
                    fixed top-16 right-4 md:top-24 md:right-8 z-40 bg-surface-container rounded-2xl shadow-2xl w-64 p-4
                    transition-all duration-200 ease-out
                    ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
                `}
                style={{ transformOrigin: 'top right' }} // 
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-on-surface">Menu</h2>
                    <button
                        onClick={() => setIsMenuOpen(false)}
                        className="p-2 -m-2 rounded-full hover:bg-surface-background text-on-surface-variant hover:text-on-surface"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                {/* */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => {
                            setIsFullTimelineOpen(true);
                            setIsMenuOpen(false);
                        }}
                        className="w-full text-left bg-surface-background hover:bg-surface-background/70 text-on-surface font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                    >
                        全体を見る
                    </button>
                    {/* */}
                    <button
                        onClick={() => {
                            setIsSettingsOpen(true);
                            setIsMenuOpen(false);
                        }}
                        className="w-full text-left bg-surface-background hover:bg-surface-background/70 text-on-surface font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                    >
                        <SettingsIcon className="w-5 h-5 text-on-surface-variant" />
                        <span>表示設定</span>
                    </button>
                    {/* */}
                    {!isReadOnly && (
                        <button
                            onClick={() => setMode('edit')}
                            className="w-full text-left bg-surface-background hover:bg-surface-background/70 text-on-surface font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                        >
                            編集モードに戻る
                        </button>
                    )}
                </div>
            </div>

            {/* */}
            <LiveSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                theme={theme}
                toggleTheme={toggleTheme}
                isWakeLockEnabled={isWakeLockEnabled}
                onWakeLockToggle={handleWakeLockToggle}
            />
            {/* */}


            {/* */}
            <div className="absolute top-36 md:top-24 bottom-32 left-0 right-0 px-4 flex items-center justify-center overflow-hidden">
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

            {/* ★★★ VJバーの表示条件に「!isReadOnly」を追加っす！ ★★★ */}
            {eventConfig.vjFeatureEnabled && !isReadOnly && (
                <VjBar vjTimetable={vjTimetable} now={now} />
            )}

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
                            const borderClass = isPlaying ? 'border border-on-surface dark:border-white' : 'border border-on-surface/30 dark:border-white/30';

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