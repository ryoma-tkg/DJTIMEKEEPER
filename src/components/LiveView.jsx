// [src/components/LiveView.jsx]
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTimetable } from '../hooks/useTimetable';
import {
    SimpleImage,
    UserIcon,
    MenuIcon,
    XIcon,
    InfoIcon,
    ToastNotification,
    SettingsIcon,
    MoonIcon,
    SunIcon,
    LayersIcon,
    LogOutIcon,
    ToggleSwitch,
    parseDateTime // 追加
} from './common';
import { FullTimelineView } from './FullTimelineView';
import { BaseModal } from './ui/BaseModal'; // BaseModalを使用

// --- サブコンポーネント: マルチビュー用カード ---
const MiniFloorCard = ({ floorId, floorData, eventConfig, now, onClick }) => {
    const {
        schedule,
        currentlyPlayingIndex,
        eventStatus
    } = useTimetable(floorData.timetable, eventConfig.startDate, eventConfig.startTime, now);

    let currentDj = null;
    let statusText = '';
    let statusColor = 'text-on-surface-variant';

    if (eventStatus === 'ON_AIR_BLOCK' && currentlyPlayingIndex !== -1) {
        currentDj = schedule[currentlyPlayingIndex];
        statusText = 'ON AIR';
        statusColor = 'text-red-500 animate-pulse';
    } else if (eventStatus === 'UPCOMING') {
        currentDj = schedule.length > 0 ? schedule[0] : null;
        statusText = 'UPCOMING';
        statusColor = 'text-brand-primary';
    } else if (eventStatus === 'FINISHED') {
        statusText = 'FINISHED';
    } else {
        statusText = 'STANDBY';
    }

    let timeDisplay = '--:--';
    if (currentDj) {
        const nowTime = now.getTime();
        const targetTime = eventStatus === 'UPCOMING' ? currentDj.startTimeDate.getTime() : currentDj.endTimeDate.getTime();
        const diffSec = Math.floor((targetTime - nowTime) / 1000);

        if (diffSec >= 0) {
            const h = Math.floor(diffSec / 3600);
            const m = Math.floor((diffSec % 3600) / 60);
            const s = diffSec % 60;
            timeDisplay = h > 0
                ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
                : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
    }

    return (
        <div
            onClick={() => onClick(floorId)}
            className="bg-surface-container rounded-2xl p-4 shadow-lg cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden group"
        >
            <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: currentDj?.color || 'transparent' }} />
            <div className="pl-3">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg truncate">{floorData.name}</h3>
                    <span className={`text-xs font-bold tracking-wider ${statusColor}`}>{statusText}</span>
                </div>
                {currentDj ? (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-background shrink-0 overflow-hidden flex items-center justify-center">
                            {currentDj.imageUrl ? (<SimpleImage src={currentDj.imageUrl} className="w-full h-full object-cover" />) : (<UserIcon className="w-5 h-5 text-on-surface-variant" />)}
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-base truncate">{currentDj.name}</p>
                            <p className="font-mono text-sm text-on-surface-variant">{eventStatus === 'UPCOMING' ? '開始まで ' : '残り '} <span className="font-bold text-on-surface">{timeDisplay}</span></p>
                        </div>
                    </div>
                ) : (
                    <div className="h-10 flex items-center text-sm text-on-surface-variant">情報なし</div>
                )}
            </div>
        </div>
    );
};

// --- サブコンポーネント: 設定モーダル (BaseModal化) ---
const LiveSettingsModal = ({ isOpen, onClose, theme, toggleTheme, isWakeLockEnabled, onWakeLockToggle }) => {
    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="設定"
            maxWidthClass="max-w-md"
        >
            <div className="space-y-6">
                <section>
                    <div className="bg-surface-background/50 rounded-xl px-4 py-1 space-y-1">
                        <ToggleSwitch
                            checked={theme === 'dark'}
                            onChange={toggleTheme}
                            label="ダークモード"
                            icon={theme === 'dark' ? MoonIcon : SunIcon}
                        />
                        <div className="border-t border-surface-container"></div>
                        <ToggleSwitch
                            checked={isWakeLockEnabled}
                            onChange={onWakeLockToggle}
                            label="画面のスリープ防止"
                            icon={isWakeLockEnabled ? SunIcon : MoonIcon}
                        />
                    </div>
                    <p className="text-xs text-on-surface-variant mt-2 px-2">
                        ※ スリープ防止機能は、ブラウザや端末の設定によっては動作しない場合があります。
                    </p>
                </section>
            </div>
        </BaseModal>
    );
};

// --- サブコンポーネント: VJ表示 ---
const VjDisplay = ({ vjTimetable, eventConfig, now, djEventStatus, suppressAnimation }) => {
    const [currentVjData, setCurrentVjData] = useState(null);
    const [visibleVjContent, setVisibleVjContent] = useState(null);
    const [isVjFadingOut, setIsVjFadingOut] = useState(false);
    const vjAnimationTimerRef = useRef(null);
    const displayedVjKeysRef = useRef(new Set());

    const { schedule: vjSchedule, eventStatus: vjEventStatus, currentlyPlayingIndex: currentlyPlayingVjIndex } = useTimetable(vjTimetable, eventConfig.startDate, eventConfig.startTime, now);

    const { currentVj, nextVj, vjRemainingSeconds } = useMemo(() => {
        const nowTime = now.getTime();
        if (currentlyPlayingVjIndex === -1) {
            if (vjEventStatus === 'ON_AIR_BLOCK' && vjSchedule.length > 0) {
                const upcomingVj = vjSchedule.find(vj => nowTime < vj.startTimeDate.getTime());
                return { currentVj: null, nextVj: upcomingVj || null, vjRemainingSeconds: 0 };
            }
            return { currentVj: null, nextVj: null, vjRemainingSeconds: 0 };
        }
        const vj = vjSchedule[currentlyPlayingVjIndex];
        const nextVj = (currentlyPlayingVjIndex < vjSchedule.length - 1) ? vjSchedule[currentlyPlayingVjIndex + 1] : null;
        const remainingMs = (vj.endTimeDate.getTime() - nowTime);
        return { currentVj: vj, nextVj: nextVj, vjRemainingSeconds: Math.floor(remainingMs / 1000) };
    }, [currentlyPlayingVjIndex, vjSchedule, vjEventStatus, now]);

    const formatVjTime = (seconds) => {
        if (seconds < 0) seconds = 0;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return { h: String(h).padStart(2, '0'), m: String(m).padStart(2, '0'), s: String(s).padStart(2, '0'), isZeroHour: h === 0 };
    };

    useEffect(() => {
        let newVjData = null;
        if (djEventStatus === 'STANDBY' || djEventStatus === 'FINISHED') newVjData = null;
        else if (vjEventStatus === 'UPCOMING') {
            const nextVj = (vjSchedule.length > 0) ? vjSchedule[0] : null;
            newVjData = { status: 'UPCOMING', nextVj: nextVj, animationKey: 'vj-upcoming' };
        } else if (vjEventStatus === 'ON_AIR_BLOCK') {
            newVjData = { status: 'ON AIR', currentVj: currentVj, nextVj: nextVj, vjRemainingSeconds: vjRemainingSeconds, animationKey: `vj-${currentVj?.id || 'standby'}` };
        } else {
            newVjData = { status: 'FINISHED', animationKey: 'vj-finished' };
        }
        setCurrentVjData(newVjData);
    }, [djEventStatus, vjEventStatus, currentVj, nextVj, vjRemainingSeconds, vjSchedule]);

    useEffect(() => {
        if (suppressAnimation) {
            setVisibleVjContent(currentVjData);
            setIsVjFadingOut(false);
            if (vjAnimationTimerRef.current) clearTimeout(vjAnimationTimerRef.current);
            return;
        }

        if (!visibleVjContent) {
            setVisibleVjContent(currentVjData);
            return;
        }

        if (currentVjData && visibleVjContent) {
            if (currentVjData.animationKey !== visibleVjContent.animationKey) {
                if (vjAnimationTimerRef.current) clearTimeout(vjAnimationTimerRef.current);
                setIsVjFadingOut(true);
                vjAnimationTimerRef.current = setTimeout(() => {
                    setVisibleVjContent(currentVjData);
                    setIsVjFadingOut(false);
                    vjAnimationTimerRef.current = null;
                }, 400);
            } else if (currentVjData.animationKey === visibleVjContent.animationKey && !isVjFadingOut) {
                setVisibleVjContent(currentVjData);
            }
        } else if (!currentVjData && visibleVjContent) {
            if (!isVjFadingOut) {
                setIsVjFadingOut(true);
                vjAnimationTimerRef.current = setTimeout(() => {
                    setVisibleVjContent(null);
                    setIsVjFadingOut(false);
                }, 400);
            }
        }
    }, [currentVjData, visibleVjContent, isVjFadingOut, suppressAnimation]);

    useEffect(() => {
        if (visibleVjContent?.animationKey) {
            const key = visibleVjContent.animationKey;
            if (suppressAnimation) {
                displayedVjKeysRef.current.add(key);
            } else {
                const timer = setTimeout(() => {
                    displayedVjKeysRef.current.add(key);
                }, 500);
                return () => clearTimeout(timer);
            }
        }
    }, [visibleVjContent, suppressAnimation]);

    const renderVjContent = (content) => {
        if (!content) return null;
        if (content.status === 'ON AIR') {
            const timeParts = formatVjTime(content.vjRemainingSeconds);
            return (
                <div className="w-full max-w-3xl mt-4 md:mt-8">
                    <div className="w-full max-w-3xl border-t border-on-surface/10 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center w-full max-w-3xl gap-2 md:gap-4">
                        <div className="flex items-center gap-4 md:gap-6 min-w-0 justify-center md:justify-end">
                            {content.currentVj ? (
                                <>
                                    <span className="flex-shrink truncate text-center md:text-right text-lg sm:text-2xl font-bold max-w-[calc(100%-10ch)]">{content.currentVj.name}</span>
                                    <span className="inline-block w-[8ch] flex-shrink-0 text-right md:text-left text-lg sm:text-2xl font-mono font-bold text-on-surface-variant tabular-nums">
                                        <span className={timeParts.isZeroHour ? 'opacity-50' : ''}>{timeParts.h}:</span><span>{timeParts.m}:{timeParts.s}</span>
                                    </span>
                                </>
                            ) : (content.nextVj ? <span className="text-lg sm:text-2xl font-bold text-on-surface-variant/50">VJ STANDBY</span> : null)}
                        </div>
                        <div className="text-center hidden md:block"><span className="text-2xl text-on-surface-variant/30 mx-0 sm:mx-0"></span></div>
                        <div className="hidden md:flex items-center gap-3 text-left min-w-0 justify-start ml-4 md:ml-12">
                            {content.nextVj ? (<><span className="text-base sm:text-lg text-on-surface-variant uppercase font-bold tracking-widest self-center">NEXT VJ</span><span className="text-base sm:text-lg font-semibold truncate max-w-[80px] sm:max-w-xs">{content.nextVj.name}</span><span className="text-base sm:text-lg text-on-surface-variant font-mono whitespace-nowrap">{content.nextVj.startTime}~</span></>) : null}
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const isAlreadyDisplayed = displayedVjKeysRef.current.has(visibleVjContent?.animationKey);
    const animationClass = isVjFadingOut
        ? 'animate-fade-out-down'
        : (suppressAnimation || isAlreadyDisplayed ? '' : 'animate-fade-in-up');

    return (
        <div className={`absolute left-0 right-0 w-full z-10 flex flex-col items-center justify-center px-4 md:px-8 py-4 bottom-4 md:bottom-32 min-h-[6rem] md:min-h-[8rem] transition-opacity duration-500`}>
            <div key={visibleVjContent?.animationKey} className={`w-full flex flex-col items-center will-change-[transform,opacity] ${animationClass}`}>
                {renderVjContent(visibleVjContent)}
            </div>
        </div>
    );
};


// --- Main LiveView Component ---
export const LiveView = ({ timetable, vjTimetable, eventConfig, floors, currentFloorId, setMode, onSelectFloor, loadedUrls, timeOffset, isReadOnly, theme, toggleTheme, eventId, isPreview = false }) => {
    const [now, setNow] = useState(new Date(new Date().getTime() + timeOffset));
    const timelineContainerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);

    const [isFullTimelineOpen, setIsFullTimelineOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [viewMode, setViewMode] = useState('single');

    const [currentDjData, setCurrentDjData] = useState(null);
    const [visibleDjContent, setVisibleDjContent] = useState(null);
    const [isDjFadingOut, setIsDjFadingOut] = useState(false);
    const djAnimationTimerRef = useRef(null);

    const [suppressEntryAnimation, setSuppressEntryAnimation] = useState(false);
    const displayedDjKeysRef = useRef(new Set());

    const [timerDisplayMode, setTimerDisplayMode] = useState('currentTime');
    const [toast, setToast] = useState({ message: '', visible: false });
    const toastTimerRef = useRef(null);
    const [isWakeLockEnabled, setIsWakeLockEnabled] = useState(localStorage.getItem('wakeLockEnabled') === 'true');
    const wakeLockRef = useRef(null);

    const [bg1Style, setBg1Style] = useState({ opacity: 0, transition: 'opacity 1.0s ease-in-out' });
    const [bg2Style, setBg2Style] = useState({ opacity: 0, transition: 'opacity 1.0s ease-in-out' });
    const isBg1ActiveRef = useRef(true);

    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const controlsTimeoutRef = useRef(null);

    const [displayFloorId, setDisplayFloorId] = useState(currentFloorId);
    const [mainOpacity, setMainOpacity] = useState(1);

    const [visualTimetable, setVisualTimetable] = useState(timetable);
    const [visualVjTimetable, setVisualVjTimetable] = useState(vjTimetable);

    // フロア切り替えロジック
    useEffect(() => {
        if (currentFloorId !== displayFloorId) {
            setSuppressEntryAnimation(true);
            setMainOpacity(0);

            const timer = setTimeout(() => {
                setDisplayFloorId(currentFloorId);
                setVisualTimetable(timetable);
                setVisualVjTimetable(vjTimetable);

                requestAnimationFrame(() => {
                    setMainOpacity(1);
                    setTimeout(() => {
                        setSuppressEntryAnimation(false);
                    }, 500);
                });
            }, 500);

            return () => clearTimeout(timer);
        } else {
            setVisualTimetable(timetable);
            setVisualVjTimetable(vjTimetable);
        }
    }, [currentFloorId, timetable, vjTimetable, displayFloorId]);

    const { schedule, eventStartTimeDate, eventEndTimeDate, eventStatus, currentlyPlayingIndex, eventRemainingSeconds, eventElapsedSeconds } = useTimetable(visualTimetable, eventConfig.startDate, eventConfig.startTime, now);
    const { schedule: vjSchedule, eventStatus: vjEventStatus } = useTimetable(visualVjTimetable, eventConfig.startDate, eventConfig.startTime, now);

    const hasVjData = visualVjTimetable && visualVjTimetable.length > 0;
    const isVjActive = eventConfig.vjFeatureEnabled && hasVjData && eventStatus === 'ON_AIR_BLOCK';

    // ★★★ 修正: sortedFloors の定義をここに記述 (ReferenceError修正) ★★★
    const sortedFloors = useMemo(() => {
        if (!floors) return [];
        return Object.entries(floors)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [floors]);

    // ★★★ 追加: 全フロア終了判定ロジック ★★★
    const isAllFloorsFinished = useMemo(() => {
        if (!floors || Object.keys(floors).length === 0) return eventStatus === 'FINISHED';

        const nowTime = now.getTime();
        const startDateTime = parseDateTime(eventConfig.startDate, eventConfig.startTime);

        return Object.values(floors).every(floor => {
            const fTimetable = floor.timetable || [];
            if (fTimetable.length === 0) return true;

            // そのフロアの合計時間を計算
            const totalDurationMinutes = fTimetable.reduce((acc, item) => acc + (parseFloat(item.duration) || 0), 0);
            // 終了時刻を算出
            const floorEndTime = new Date(startDateTime.getTime() + totalDurationMinutes * 60000);

            return nowTime >= floorEndTime.getTime();
        });
    }, [floors, eventConfig, now, eventStatus]);

    // ヘッダー自動非表示
    useEffect(() => {
        const showControls = () => {
            setIsControlsVisible(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => {
                setIsControlsVisible(false);
            }, 3000);
        };
        window.addEventListener('mousemove', showControls);
        window.addEventListener('touchstart', showControls);
        showControls();
        return () => {
            window.removeEventListener('mousemove', showControls);
            window.removeEventListener('touchstart', showControls);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date(new Date().getTime() + timeOffset)), 1000);
        const updateWidth = () => { if (timelineContainerRef.current) setContainerWidth(timelineContainerRef.current.offsetWidth); };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => { clearInterval(timer); window.removeEventListener('resize', updateWidth); };
    }, [timeOffset]);

    // DJデータ生成
    useEffect(() => {
        const currentIndex = currentlyPlayingIndex;
        let newDjData = null;
        const nowTime = new Date(now).getTime();

        switch (eventStatus) {
            case 'ON_AIR_BLOCK':
                if (currentIndex !== -1) {
                    const dj = schedule[currentIndex];
                    const nextDj = (currentIndex < schedule.length - 1) ? schedule[currentIndex + 1] : null;
                    const total = (dj.endTimeDate.getTime() - dj.startTimeDate.getTime()) / 1000;
                    const remainingMs = (dj.endTimeDate.getTime() - nowTime);
                    const remainingSeconds = Math.floor(remainingMs / 1000);
                    const visualProgress = (remainingSeconds <= 0 && remainingMs > -1000) ? 100 : (total > 0 ? ((total - (remainingMs / 1000)) / total) * 100 : 0);
                    newDjData = { ...dj, status: 'ON AIR', timeLeft: remainingSeconds, progress: visualProgress, nextDj: nextDj, animationKey: dj.id };
                } else {
                    const upcomingDj = schedule.find(dj => nowTime < dj.startTimeDate.getTime());
                    if (upcomingDj) {
                        const remainingMs = (upcomingDj.startTimeDate.getTime() - nowTime);
                        const remainingSeconds = Math.ceil(remainingMs / 1000);
                        newDjData = { ...upcomingDj, status: 'UPCOMING', timeLeft: remainingSeconds, progress: 0, nextDj: upcomingDj, animationKey: `upcoming-${upcomingDj.id}` };
                    } else {
                        newDjData = { id: 'finished', status: 'FINISHED', animationKey: 'finished' };
                    }
                }
                break;
            case 'UPCOMING':
                {
                    const upcomingDj = schedule.length > 0 ? schedule[0] : null;
                    if (upcomingDj) {
                        const remainingMs = (upcomingDj.startTimeDate.getTime() - nowTime);
                        const remainingSeconds = Math.ceil(remainingMs / 1000);
                        newDjData = { ...upcomingDj, status: 'UPCOMING', timeLeft: remainingSeconds, progress: 0, nextDj: upcomingDj, animationKey: `upcoming-${upcomingDj.id}` };
                    } else {
                        const remainingMs = (eventStartTimeDate.getTime() - nowTime);
                        const remainingSeconds = Math.ceil(remainingMs / 1000);
                        newDjData = { id: 'empty', status: 'UPCOMING', animationKey: 'empty', timeLeft: remainingSeconds, progress: 0, nextDj: null };
                    }
                }
                break;
            case 'FINISHED':
                newDjData = { id: 'finished', status: 'FINISHED', animationKey: 'finished' };
                break;
            case 'STANDBY':
            default:
                newDjData = { id: 'standby', status: 'STANDBY', animationKey: 'standby' };
                break;
        }
        setCurrentDjData(newDjData);
    }, [now, schedule, currentlyPlayingIndex, eventStatus, eventStartTimeDate]);

    // DJコンテンツのアニメーション制御
    useEffect(() => {
        if (suppressEntryAnimation) {
            setVisibleDjContent(currentDjData);
            setIsDjFadingOut(false);
            if (djAnimationTimerRef.current) clearTimeout(djAnimationTimerRef.current);
            return;
        }

        if (!visibleDjContent) { setVisibleDjContent(currentDjData); return; }

        if (currentDjData && visibleDjContent) {
            if (currentDjData.animationKey !== visibleDjContent.animationKey) {
                if (djAnimationTimerRef.current) clearTimeout(djAnimationTimerRef.current);
                setIsDjFadingOut(true);
                djAnimationTimerRef.current = setTimeout(() => {
                    setVisibleDjContent(currentDjData);
                    setIsDjFadingOut(false);
                    djAnimationTimerRef.current = null;
                }, 400);
            } else if (currentDjData.animationKey === visibleDjContent.animationKey && !isDjFadingOut) {
                setVisibleDjContent(currentDjData);
            }
        }
    }, [currentDjData, visibleDjContent, isDjFadingOut, suppressEntryAnimation]);

    useEffect(() => {
        if (visibleDjContent?.animationKey) {
            const key = visibleDjContent.animationKey;
            if (suppressEntryAnimation) {
                displayedDjKeysRef.current.add(key);
            } else {
                const timer = setTimeout(() => {
                    displayedDjKeysRef.current.add(key);
                }, 500);
                return () => clearTimeout(timer);
            }
        }
    }, [visibleDjContent, suppressEntryAnimation]);

    useEffect(() => {
        const requestWakeLock = async () => {
            if ('wakeLock' in navigator && isWakeLockEnabled) {
                try { wakeLockRef.current = await navigator.wakeLock.request('screen'); } catch (err) { console.error(err); }
            }
        };
        const releaseWakeLock = () => { if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; } };
        requestWakeLock();
        const handleVisibilityChange = () => { if (wakeLockRef.current !== null && document.visibilityState === 'visible') requestWakeLock(); };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => { releaseWakeLock(); document.removeEventListener('visibilitychange', handleVisibilityChange); if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
    }, [isWakeLockEnabled]);

    const handleWakeLockToggle = () => {
        const newValue = !isWakeLockEnabled;
        setIsWakeLockEnabled(newValue);
        localStorage.setItem('wakeLockEnabled', newValue);
        showToast(newValue ? 'スリープ防止 ON' : 'スリープ防止 OFF');
    };

    const timelineTransform = useMemo(() => {
        if (schedule.length === 0 || containerWidth === 0) return 'translateX(0px)';
        const itemWidthSP = 160; const gapSP = 16; const stepSP = itemWidthSP + gapSP;
        const itemWidthMD = 256; const gapMD = 24; const stepMD = itemWidthMD + gapMD;
        const isMobile = containerWidth < 768;
        const itemWidth = isMobile ? itemWidthSP : itemWidthMD;
        const step = isMobile ? stepSP : stepMD;
        const centerScreenOffset = containerWidth / 2;
        const centerItemOffset = itemWidth / 2;
        const targetId = visibleDjContent?.id;
        let targetIndex = schedule.findIndex(dj => dj.id === targetId);
        if (targetIndex === -1) { if (visibleDjContent?.status === 'FINISHED' || visibleDjContent?.status === 'STANDBY') targetIndex = schedule.length - 1; else targetIndex = 0; }
        const finalX = centerScreenOffset - centerItemOffset - (targetIndex * step);
        return `translateX(${finalX}px)`;
    }, [visibleDjContent, containerWidth, schedule]);

    const formatTime = (seconds) => {
        if (seconds < 0) seconds = 0;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const formatDurationHHMMSS = (totalSeconds) => {
        if (totalSeconds < 0) totalSeconds = 0;
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = Math.floor(totalSeconds % 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const currentBgColor = useMemo(() => {
        if (viewMode === 'multi') return '#000000';
        if (visibleDjContent?.status !== 'ON AIR' || isDjFadingOut) return null;
        return visibleDjContent.color;
    }, [visibleDjContent, isDjFadingOut, viewMode]);

    useEffect(() => {
        const getGradient = (c) => {
            if (!c) return 'transparent';
            const opacity = theme === 'light' ? '66' : '33';
            return `radial-gradient(ellipse 80% 60% at 50% 120%, ${c}${opacity}, transparent)`;
        };
        const newGradient = getGradient(currentBgColor);
        const transitionStyle = 'opacity 1.0s ease-in-out';
        if (isBg1ActiveRef.current) { setBg1Style(prev => ({ ...prev, opacity: 0, transition: transitionStyle })); setBg2Style(prev => ({ ...prev, background: newGradient, opacity: 1, transition: transitionStyle })); } else { setBg2Style(prev => ({ ...prev, opacity: 0, transition: transitionStyle })); setBg1Style(prev => ({ ...prev, background: newGradient, opacity: 1, transition: transitionStyle })); }
        isBg1ActiveRef.current = !isBg1ActiveRef.current;
    }, [currentBgColor, theme]);

    const showToast = (message) => {
        if (toastTimerRef.current) { clearTimeout(toastTimerRef.current); setToast({ message: '', visible: false }); }
        setTimeout(() => { setToast({ message, visible: true }); toastTimerRef.current = setTimeout(() => { setToast(prev => ({ ...prev, visible: false })); toastTimerRef.current = null; }, 2000); }, 100);
    };

    const handleTimerClick = () => {
        if (schedule.length === 0 && eventStatus !== 'UPCOMING') return;
        if (timerDisplayMode === 'currentTime') { setTimerDisplayMode('eventRemaining'); showToast('終了まで'); } else if (timerDisplayMode === 'eventRemaining') { setTimerDisplayMode('eventElapsed'); showToast('経過時間'); } else { setTimerDisplayMode('currentTime'); showToast('現在時刻'); }
    };

    const renderDjContent = (content) => {
        if (!content) return null;
        if (content.status === 'UPCOMING') {
            const dj = content;
            const eventStartTimeStr = eventStartTimeDate.toTimeString().slice(0, 5);
            const eventEndTimeStr = eventEndTimeDate.toTimeString().slice(0, 5);
            const displayColor = schedule.length > 0 && dj.color ? dj.color : '#888888';
            const eventTitle = eventConfig.title || "イベント待機中";
            const nextDj = dj.nextDj;
            const nextDjStartTimeStr = nextDj ? nextDj.startTimeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            const nextVj = (vjSchedule.length > 0 && (vjEventStatus === 'UPCOMING' || vjEventStatus === 'ON_AIR_BLOCK')) ? vjSchedule[0] : null;
            const nextVjStartTimeStr = nextVj ? nextVj.startTimeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

            return (
                <div className="flex flex-col items-center justify-center w-full">
                    <main className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center text-center">
                        <h2 className="text-xl sm:text-2xl md:text-3xl text-on-surface-variant font-bold tracking-widest mb-4">UPCOMING</h2>
                        <h1 className="text-4xl sp:text-5xl sm:text-6xl md:text-7xl font-bold break-words leading-tight">{eventTitle}</h1>
                        {schedule.length > 0 && (<p className="text-lg sm:text-2xl md:text-3xl font-semibold tracking-wider font-mono mt-4" style={{ color: displayColor }}>{eventStartTimeStr} - {eventEndTimeStr}</p>)}
                        <p className="flex flex-col items-center justify-center text-5xl sp:text-6xl sm:text-7xl md:text-8xl text-on-surface my-8"><span className="text-lg sp:text-2xl sm:text-3xl md:text-4xl text-on-surface-variant font-sans font-bold mb-2">開始まで</span><span className="font-mono inline-block text-center w-[5ch]">{formatTime(dj.timeLeft)}</span></p>
                    </main>
                    {(nextDj || (eventConfig.vjFeatureEnabled && hasVjData && nextVj)) && (
                        <div className="w-full max-w-3xl mt-0">
                            <div className="w-full max-w-3xl border-t border-on-surface/10 mb-4" />
                            <div className="flex flex-col items-center justify-center gap-4">
                                {nextDj && (<div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4"><span className="text-lg sm:text-2xl font-bold text-on-surface-variant/50">DJ STANDBY</span><div className="h-6 w-px bg-on-surface/30 hidden sm:block"></div><div className="flex items-center gap-3"><span className="text-base sm:text-lg text-on-surface-variant uppercase font-bold tracking-widest">NEXT DJ</span><span className="text-base sm:text-lg font-semibold truncate max-w-[150px] sm:max-w-xs">{nextDj.name}</span><span className="text-base sm:text-lg text-on-surface-variant font-mono whitespace-nowrap">{nextDjStartTimeStr}~</span></div></div>)}
                                {eventConfig.vjFeatureEnabled && hasVjData && nextVj && (<div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4"><span className="text-lg sm:text-2xl font-bold text-on-surface-variant/50">VJ STANDBY</span><div className="h-6 w-px bg-on-surface/30 hidden sm:block"></div><div className="flex items-center gap-3"><span className="text-base sm:text-lg text-on-surface-variant uppercase font-bold tracking-widest">NEXT VJ</span><span className="text-base sm:text-lg font-semibold truncate max-w-[150px] sm:max-w-xs">{nextVj.name}</span><span className="text-base sm:text-lg text-on-surface-variant font-mono whitespace-nowrap">{nextVjStartTimeStr}~</span></div></div>)}
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        if (content.status === 'ON AIR') {
            const dj = content;
            const isImageReady = !dj.imageUrl || loadedUrls.has(dj.imageUrl);
            return (
                <main className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
                    {!dj.isBuffer && (
                        <div className={`w-full max-w-[12rem] sp:max-w-[14rem] sm:max-w-[16rem] md:max-w-sm aspect-square bg-surface-container rounded-full shadow-2xl overflow-hidden flex-shrink-0 relative transform-gpu flex items-center justify-center transition-opacity duration-300 ease-in-out ${isImageReady ? 'opacity-100' : 'opacity-100'}`}>
                            {dj.imageUrl && isImageReady ? (<SimpleImage src={dj.imageUrl} className="w-full h-full object-cover" />) : (<UserIcon className="w-1/2 h-1/2 text-on-surface-variant" />)}
                            {dj.imageUrl && !isImageReady && (<div className={`absolute inset-0 flex items-center justify-center bg-surface-container opacity-100`}><div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spinner"></div></div>)}
                        </div>
                    )}
                    <div className={`flex flex-col ${dj.isBuffer ? 'items-center text-center' : 'text-center md:text-left'}`}>
                        <div className="flex flex-col">
                            <h1 className="text-3xl sp:text-4xl sm:text-5xl md:text-7xl font-bold break-words leading-tight mb-2">{dj.name}</h1>
                            <p className="text-base sm:text-2xl md:text-3xl font-semibold tracking-wider font-mono mb-2" style={{ color: dj.color }}>{dj.startTimeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {dj.endTimeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            {dj.isBuffer ? (
                                <p className="flex flex-col items-center justify-center text-4xl sp:text-5xl sm:text-6xl md:text-8xl text-on-surface my-2"><span className="text-lg sp:text-2xl sm:text-3xl md:text-4xl text-on-surface-variant font-sans font-bold mb-1 mt-2">残り</span><span className="font-mono inline-block text-center w-[5ch]">{formatTime(dj.timeLeft)}</span></p>
                            ) : (
                                <p className="flex items-baseline justify-center md:justify-start text-4xl sp:text-5xl sm:text-6xl md:text-8xl text-on-surface my-1 whitespace-nowrap"><span className="text-lg sp:text-2xl sm:text-3xl md:text-4xl text-on-surface-variant mr-3 font-sans font-bold">残り</span><span className="font-mono inline-block text-left w-[5ch]">{formatTime(dj.timeLeft)}</span></p>
                            )}
                            <div className={`bg-surface-container rounded-full h-3.5 overflow-hidden w-full mt-2`}><div className="h-full rounded-full transition-all duration-500 ease-in-out" style={{ width: `${dj.progress}%`, backgroundColor: dj.color }}></div></div>
                        </div>
                        {dj.nextDj && (<div className="mt-6 pt-4 border-t border-on-surface-variant/20"><p className="text-sm text-on-surface-variant font-bold tracking-widest mb-1">NEXT UP</p><p className="text-xl sm:text-2xl font-semibold">{dj.nextDj.name}<span className="text-base sm:text-lg font-sans text-on-surface-variant ml-2 font-mono">{dj.nextDj.startTimeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ~</span></p></div>)}
                    </div>
                </main>
            );
        }
        if (content.status === 'FINISHED') {
            // ▼▼▼ 【修正】 終了メッセージの出し分け ▼▼▼
            return (
                <div className="text-center animate-fade-in-up">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold">
                        {isAllFloorsFinished ? 'EVENT FINISHED' : 'FLOOR FINISHED'}
                    </h1>
                </div>
            );
        }
        if (content.status === 'STANDBY') {
            const eventTitle = eventConfig.title || "DJ Timekeeper Pro";
            return (<div className="text-center"><h2 className="text-xl sm:text-2xl md:text-3xl text-on-surface-variant font-bold tracking-widest mb-4">STANDBY</h2><h1 className="text-4xl sp:text-5xl sm:text-6xl md:text-7xl font-bold break-words leading-tight">{eventTitle}</h1></div>);
        }
        return null;
    };

    const scheduleForModal = useMemo(() => schedule.map(dj => ({ ...dj, startTime: dj.startTimeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), endTime: dj.endTimeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), startTimeDate: dj.startTimeDate.toISOString(), endTimeDate: dj.endTimeDate.toISOString() })), [schedule]);

    const isAlreadyDisplayed = displayedDjKeysRef.current.has(visibleDjContent?.animationKey);
    const djAnimationClass = isDjFadingOut
        ? 'animate-fade-out-down'
        : (suppressEntryAnimation || isAlreadyDisplayed ? '' : 'animate-fade-in-up');

    // ▼▼▼ 【修正】 レイアウト調整（VJなし時の位置調整） ▼▼▼
    const contentPositionClass = isVjActive
        ? 'bottom-24 md:bottom-56'
        : 'bottom-24 pb-20';

    return (
        <div className="fixed inset-0">
            <div className="absolute inset-0 will-change-[opacity]" style={bg1Style} />
            <div className="absolute inset-0 will-change-[opacity]" style={bg2Style} />

            <ToastNotification message={toast.message} isVisible={toast.visible} className="top-32 md:top-24" />

            {/* ヘッダー */}
            <header
                className="absolute top-0 left-0 right-0 p-4 md:p-8 z-20 flex flex-col gap-2"
            >
                {/* タイトル・時計・メニュー */}
                <div
                    className={`flex flex-wrap justify-between items-center gap-y-0 md:gap-y-2 transition-opacity duration-500 ${isControlsVisible ? 'opacity-100' : 'opacity-50'}`}
                >
                    <div className="w-auto md:flex-1 flex flex-row items-center gap-4 order-1">
                        {!isReadOnly && (
                            <button
                                onClick={() => {
                                    if (isPreview) {
                                        setMode('edit');
                                    }
                                }}
                                className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-surface-container/50 backdrop-blur-sm hover:bg-surface-container text-on-surface font-semibold rounded-full shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 hover:-translate-y-0.5"
                            >
                                {isPreview ? (
                                    <LogOutIcon className="w-5 h-5 rotate-180" />
                                ) : (
                                    eventId ? (
                                        <Link to={`/edit/${eventId}/${currentFloorId}`} className="flex items-center justify-center w-full h-full"><LogOutIcon className="w-5 h-5 rotate-180" /></Link>
                                    ) : (
                                        <Link to="/" className="flex items-center justify-center w-full h-full"><LogOutIcon className="w-5 h-5 rotate-180" /></Link>
                                    )
                                )}
                            </button>
                        )}
                        <h1 className="text-xl md:text-2xl font-bold text-on-surface-variant tracking-wider truncate max-w-[calc(100vw-120px)] md:max-w-xs opacity-70">
                            {eventConfig.title}
                        </h1>
                    </div>

                    <div className="w-full md:w-auto flex-shrink-0 mx-auto order-3 md:order-2">
                        <div className="bg-surface-container/50 dark:bg-black/30 backdrop-blur-sm text-on-surface font-bold py-2 px-4 rounded-full text-xl tracking-wider font-mono text-center min-w-[10ch] tabular-nums cursor-pointer active:scale-95 transition-transform" onClick={handleTimerClick} title="クリックで表示切替">
                            {timerDisplayMode === 'currentTime' && (now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))}
                            {timerDisplayMode === 'eventRemaining' && (`-${formatDurationHHMMSS(eventRemainingSeconds)}`)}
                            {timerDisplayMode === 'eventElapsed' && (`+${formatDurationHHMMSS(eventElapsedSeconds)}`)}
                        </div>
                    </div>
                    <div className="w-auto md:flex-1 flex justify-end order-2 md:order-3">
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-surface-container/50 backdrop-blur-sm hover:bg-surface-container text-on-surface font-semibold rounded-full shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 hover:-translate-y-0.5"
                        >
                            <MenuIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {sortedFloors.length > 1 && (
                    <div className={`flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar justify-center mt-4 transition-opacity duration-500 ${isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        {sortedFloors.map(floor => (
                            <button
                                key={floor.id}
                                onClick={() => { onSelectFloor(floor.id); setViewMode('single'); }}
                                className={`
                                    px-4 py-1.5 rounded-full font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2
                                    ${(viewMode === 'single' && floor.id === displayFloorId)
                                        ? 'bg-on-surface-variant text-surface-background shadow-md'
                                        : 'bg-surface-container/50 hover:bg-surface-container text-on-surface-variant hover:text-on-surface backdrop-blur-sm'
                                    }
                                `}
                            >
                                <LayersIcon className="w-3 h-3" />
                                {floor.name}
                            </button>
                        ))}

                        {sortedFloors.length > 1 && (
                            <button
                                onClick={() => setViewMode('multi')}
                                className={`
                                    px-4 py-1.5 rounded-full font-bold text-sm whitespace-nowrap transition-colors flex items-center gap-2
                                    ${viewMode === 'multi'
                                        ? 'bg-on-surface-variant text-surface-background shadow-md'
                                        : 'bg-surface-container/50 hover:bg-surface-container text-on-surface-variant hover:text-on-surface backdrop-blur-sm'
                                    }
                                `}
                            >
                                <span className="text-xs">田</span>
                                <span>Multi View</span>
                            </button>
                        )}
                    </div>
                )}
            </header>

            {/* メニュー */}
            <div className={`fixed top-16 right-4 md:top-24 md:right-8 z-40 bg-surface-container rounded-2xl shadow-2xl w-72 p-4 transition-all duration-200 ease-out ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`} style={{ transformOrigin: 'top right' }}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-on-surface">Menu</h2>
                    <button onClick={() => setIsMenuOpen(false)} className="p-2 -m-2 rounded-full hover:bg-surface-background text-on-surface-variant hover:text-on-surface"><XIcon className="w-5 h-5" /></button>
                </div>
                <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                    <button onClick={() => { setIsFullTimelineOpen(true); setIsMenuOpen(false); }} className="w-full text-left bg-surface-background hover:bg-surface-background/70 text-on-surface font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={schedule.length === 0}>全体を見る</button>
                    {!isReadOnly && (<button onClick={() => setMode('edit')} className="w-full text-left bg-brand-primary/20 hover:bg-brand-primary/30 text-brand-primary font-semibold py-3 px-4 rounded-lg transition-colors duration-200">編集モードに戻る</button>)}
                    <button onClick={() => { setIsSettingsOpen(true); setIsMenuOpen(false); }} className="w-full text-left bg-surface-background hover:bg-surface-background/70 text-on-surface font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"><SettingsIcon className="w-5 h-5 text-on-surface-variant" /><span>表示設定</span></button>
                </div>
            </div>

            <LiveSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} theme={theme} toggleTheme={toggleTheme} isWakeLockEnabled={isWakeLockEnabled} onWakeLockToggle={handleWakeLockToggle} />

            {viewMode === 'single' ? (
                <div className="w-full h-full transition-opacity duration-500 ease-in-out" style={{ opacity: mainOpacity }}>
                    {/* コンテンツ表示エリア */}
                    <div className={`absolute top-36 md:top-40 left-0 right-0 px-4 flex items-center justify-center overflow-hidden transition-all duration-500 ease-in-out ${contentPositionClass}`}>
                        <div className="w-full h-full overflow-y-auto flex items-center justify-center relative">
                            {visibleDjContent && (
                                <div key={visibleDjContent.animationKey} className={`w-full absolute inset-0 p-4 flex items-center justify-center will-change-[transform,opacity] ${djAnimationClass}`}>
                                    {renderDjContent(visibleDjContent)}
                                </div>
                            )}
                        </div>
                    </div>

                    {isVjActive && (
                        <VjDisplay
                            vjTimetable={visualVjTimetable}
                            eventConfig={eventConfig}
                            now={now}
                            djEventStatus={eventStatus}
                            suppressAnimation={suppressEntryAnimation}
                        />
                    )}

                    {schedule.length > 0 && eventStatus !== 'STANDBY' && (
                        <div ref={timelineContainerRef} className="absolute bottom-0 left-0 right-0 w-full shrink-0 overflow-hidden mask-gradient z-10 pb-4 hidden md:block h-20 md:h-32">
                            <div className="flex h-full items-center space-x-4 md:space-x-6 px-4 py-2 will-change-transform" style={{ transform: timelineTransform, transition: 'transform 0.4s ease-in-out' }}>
                                {schedule.map((dj, index) => {
                                    const isPlaying = currentlyPlayingIndex === index;
                                    const borderClass = isPlaying ? 'border border-on-surface dark:border-white' : 'border border-on-surface/30 dark:border-white/30';
                                    const isActive = isPlaying || (eventStatus === 'ON_AIR_BLOCK' && currentlyPlayingIndex === -1 && index === 0);
                                    return (
                                        <div key={dj.id} className={`shrink-0 w-40 md:w-64 h-16 md:h-24 bg-surface-container/40 backdrop-blur-sm rounded-2xl p-3 md:p-4 flex items-center ${borderClass} ${dj.isBuffer ? 'justify-center' : 'space-x-2 md:space-x-6'} ${isActive ? 'opacity-100 scale-100' : 'opacity-60 scale-90'} transition-all duration-1000 ease-in-out will-change-[opacity,transform,border]`}>
                                            {dj.imageUrl ? (<div className="w-8 h-8 md:w-14 md:h-14 rounded-full bg-surface-container flex-shrink-0 grid place-items-center overflow-hidden"><SimpleImage src={dj.imageUrl} className="w-full h-full object-cover" /></div>) : !dj.isBuffer ? (<div className="w-8 h-8 md:w-14 md:h-14 rounded-full bg-surface-container flex-shrink-0 grid place-items-center overflow-hidden"><UserIcon className="w-5 h-5 md:w-8 md:h-8 text-on-surface-variant" /></div>) : null}
                                            <div className="overflow-hidden flex flex-col justify-center"><p className={`text-sm md:text-lg font-bold truncate w-full ${dj.isBuffer ? 'text-center' : 'text-left'}`}>{dj.name}</p><p className={`text-xs md:text-sm font-mono text-on-surface-variant ${dj.isBuffer ? 'text-center' : 'text-left'}`}>{dj.startTimeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="absolute top-36 bottom-0 left-0 right-0 p-4 overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
                        {sortedFloors.map(floor => (
                            <MiniFloorCard
                                key={floor.id}
                                floorId={floor.id}
                                floorData={floor}
                                eventConfig={eventConfig}
                                now={now}
                                onClick={(fid) => { onSelectFloor(fid); setViewMode('single'); }}
                            />
                        ))}
                    </div>
                </div>
            )}

            <FullTimelineView isOpen={isFullTimelineOpen} onClose={() => setIsFullTimelineOpen(false)} schedule={scheduleForModal} now={now} currentlyPlayingIndex={currentlyPlayingIndex} />
        </div>
    );
};