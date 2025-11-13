import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
// ★★★ firebase のコア機能だけ残す ★★★
import {
    auth, db, storage, appId,
    signInAnonymously, onAuthStateChanged,
    doc, onSnapshot, setDoc,
} from './firebase';

// ★★★ 新しいコンポーネントをインポート ★★★
import { TimetableEditor } from './components/TimetableEditor';
import { SimpleImage, UserIcon, AlertTriangleIcon, parseTime } from './components/common';


// ★★★ App.jsx に残すコンポーネント (LiveView とその仲間たち) ★★★

const BackgroundImage = memo(() => {
    return null;
});

const useImagePreloader = (urls) => {
    const [loadedUrls, setLoadedUrls] = useState(new Set());
    // 依存配列用に、URLリストを文字列化
    const urlsKey = JSON.stringify(urls);

    useEffect(() => {
        let isCancelled = false;
        // urlsKey からURLリストを復元（これが「最新」のリスト）
        const filteredUrls = JSON.parse(urlsKey);

        // ★ 1. (クリーンアップ)
        // まず、新しいURLリスト (filteredUrls) に存在しない
        // 古いURLを現在のState (loadedUrls) から安全に削除する
        setLoadedUrls(prevSet => {
            const newSet = new Set();
            let changed = false;

            prevSet.forEach(url => {
                if (filteredUrls.includes(url)) {
                    newSet.add(url);
                } else {
                    changed = true; // 削除されたURLがあった
                }
            });

            // 削除されたURLがなく、サイズも同じなら (追加もなかった)
            if (!changed && prevSet.size === filteredUrls.length) {
                return prevSet; // Stateの参照を変えない（不要な再レンダリング防止）
            }
            return newSet;
        });

        // ★ 2. ロード処理 (filteredUrls 全てに対して)
        const loadImages = async () => {
            try {
                await Promise.all(
                    filteredUrls.map(url => {
                        // urlがnullやundefinedでないことを確認
                        if (!url) {
                            return Promise.resolve();
                        }

                        return new Promise((resolve) => {
                            const img = new Image();
                            img.src = url;
                            img.onload = () => {
                                if (!isCancelled) {
                                    // ★ 3. (最重要) 
                                    // ロード完了時に関数型更新で「追加」する
                                    // これが並行処理でStateを安全に更新する唯一の方法っす
                                    setLoadedUrls(prevSet => {
                                        // 既に (クリーンアップ後のSetに) あれば何もしない
                                        if (prevSet.has(url)) return prevSet;

                                        // 破壊的変更をせず、新しいSetを返す
                                        const updatedSet = new Set(prevSet);
                                        updatedSet.add(url);
                                        return updatedSet;
                                    });
                                }
                                resolve();
                            };
                            img.onerror = () => {
                                // ロード失敗しても次へ (コンソールには出しておく)
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

        loadImages(); // 非同期で実行開始

        return () => { isCancelled = true; };
    }, [urlsKey]); // urlsKey (文字列) に依存

    const allLoaded = urls.filter(Boolean).every(url => loadedUrls.has(url));
    return { loadedUrls, allLoaded };
};

const LiveView = ({ timetable, eventConfig, setMode, loadedUrls, timeOffset, isReadOnly }) => {
    const [now, setNow] = useState(new Date(new Date().getTime() + timeOffset));
    const timelineContainerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);

    // 毎秒更新される「最新の」状態データ
    const [currentData, setCurrentData] = useState(null);

    // 実際に表示するDJのデータ
    const [visibleContent, setVisibleContent] = useState(null);
    // 今、フェードアウト中かっすか？
    const [isFadingOut, setIsFadingOut] = useState(false);

    // アニメーションタイマー
    const animationTimerRef = useRef(null);

    const schedule = useMemo(() => {
        if (timetable.length === 0) return [];
        const scheduleData = [];
        let lastEndTime = parseTime(eventConfig.startTime); // ★ common.jsx からインポート
        for (const dj of timetable) {
            const startTime = new Date(lastEndTime);
            const durationMinutes = parseFloat(dj.duration) || 0;
            const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
            scheduleData.push({ ...dj, startTime, endTime });
            lastEndTime = endTime;
        }
        return scheduleData;
    }, [timetable, eventConfig.startTime]);

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

    // 毎秒実行: 「今」の状態を計算
    useEffect(() => {
        const currentIndex = schedule.findIndex(dj => now >= dj.startTime && now < dj.endTime);

        let newContentData = null;

        if (currentIndex !== -1) {
            // --- ON AIR ---
            const dj = schedule[currentIndex];
            const nextDj = (currentIndex < schedule.length - 1) ? schedule[currentIndex + 1] : null;
            const total = (dj.endTime - dj.startTime) / 1000;
            const remainingMs = (dj.endTime - now);
            const remainingSeconds = Math.floor(remainingMs / 1000);
            const visualProgress = (remainingSeconds <= 0 && remainingMs > -1000)
                ? 100 // 見た目上、100%にする
                : (total > 0 ? ((total - (remainingMs / 1000)) / total) * 100 : 0); // それ以外は元の計算

            newContentData = {
                ...dj,
                status: 'ON AIR',
                timeLeft: remainingSeconds,
                progress: visualProgress,
                // progress: total > 0 ? ((total - (remainingMs / 1000)) / total) * 100 : 0, // ★ こっちは古いロジックなので削除
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
        setCurrentData(newContentData); // 毎秒の計算結果はこっちに保存

    }, [now, schedule]);

    // アニメーションロジック
    useEffect(() => {
        // 初回マウント時
        if (!visibleContent && currentData) {
            setVisibleContent(currentData); // アニメーションなしで即時セット
            return;
        }
        // DJ切り替え時
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
            // DJが同じで、情報（残り時間など）だけ更新される場合
            else if (currentData.animationKey === visibleContent.animationKey && !isFadingOut) {
                setVisibleContent(currentData); // そのまま最新情報に更新
            }
        }
    }, [currentData, visibleContent]);


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
        ? { background: `radial-gradient(ellipse 80% 60% at 50% 110%, ${visibleContent.color}33, transparent)` }
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
            const isImageReady = !dj.imageUrl || dj.isBuffer || loadedUrls.has(dj.imageUrl);

            return (
                <main className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-8">
                    {!dj.isBuffer && (
                        <div className={`
                            w-full max-w-sm sm:max-w-md aspect-square bg-surface-container rounded-full shadow-2xl overflow-hidden flex-shrink-0 relative
                            transform-gpu
                        `}>
                            <div className={`
                                w-full h-full flex items-center justify-center 
                                transition-opacity duration-300 ease-in-out 
                                ${dj.imageUrl && isImageReady ? 'opacity-100' : 'opacity-100'} 
                            `}>
                                {dj.imageUrl && isImageReady ? (
                                    <SimpleImage src={dj.imageUrl} className="w-full h-full object-cover" /> // ★ common.jsx からインポート
                                ) : (
                                    <UserIcon className="w-1/2 h-1/2 text-on-surface-variant" /> // ★ common.jsx からインポート
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
                                <p className="text-2xl font-semibold">{dj.nextDj.name} <span className="text-lg font-sans text-on-surface-variant ml-2 font-mono">{dj.nextDj.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -</span></p>
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

    return (
        <div className="fixed inset-0" style={bgColorStyle}>
            {/* Header */}
            <header className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 w-max flex flex-col items-center space-y-2 z-20">
                <h1 className="text-xl font-bold text-on-surface-variant tracking-wider">{eventConfig.title}</h1>
                <div className="bg-black/30 backdrop-blur-sm text-on-surface font-bold py-2 px-4 rounded-full text-2xl tracking-wider font-mono text-center w-[10ch]">
                    {now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
            </header>

            {/* Edit Button (hidden if read-only) */}
            {!isReadOnly && (
                <button onClick={() => setMode('edit')} className="absolute top-4 md:top-8 right-4 flex items-center bg-surface-container hover:opacity-90 text-white font-bold py-2 px-4 rounded-full transition-opacity duration-200 text-sm z-20">編集</button>
            )}

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
                        className="flex h-full items-center space-x-6 px-0 py-2 will-change-transform"
                        style={{
                            transform: timelineTransform,
                            transition: 'transform 0.4s ease-in-out'
                        }}
                    >
                        {schedule.map((dj, index) => (
                            <div
                                key={dj.id}
                                className={`
                                        shrink-0 w-64 h-24 bg-surface-container/40 backdrop-blur-sm rounded-2xl p-4 flex items-center 
                                        border border-white/50 
                                        ${dj.isBuffer ? 'justify-center' : 'space-x-6'} 
                                       
                                        ${(currentData?.status === 'ON AIR' && dj.id === currentData.id) ? 'opacity-100 scale-100' : 'opacity-60 scale-90'}
                                        transition-[opacity,transform] duration-1000 ease-in-out
                                        will-change-[opacity,transform]
                                      `}
                            >
                                {!dj.isBuffer && (
                                    <div className="ml-2 w-14 h-14 rounded-full bg-surface-container flex-shrink-0 flex items-center justify-center overflow-hidden">
                                        {dj.imageUrl ? <SimpleImage src={dj.imageUrl} className="w-full h-full object-cover" /> : <UserIcon className="w-8 h-8 text-on-surface-variant" />}
                                    </div>
                                )}
                                <div className="overflow-hidden flex flex-col justify-center">
                                    <p className={`text-lg font-bold truncate w-full ${dj.isBuffer ? 'text-center' : 'text-left'}`}>{dj.name}</p>
                                    <p className={`text-sm font-mono text-on-surface-variant ${dj.isBuffer ? 'text-center' : 'text-left'}`}>{dj.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ★★★ メインの App コンポーネント (スリム化) ★★★
const App = () => {
    const [mode, setMode] = useState('edit');
    const [timetable, setTimetable] = useState([]);
    const [eventConfig, setEventConfig] = useState({ title: 'DJ Timekeeper Pro', startTime: '22:00' });
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [appStatus, setAppStatus] = useState('connecting');
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const dbRef = useRef(null);
    const storageRef = useRef(null); // ★ storage の Ref は App.jsx で持つ
    const [timeOffset, setTimeOffset] = useState(0);
    const [isReadOnly, setIsReadOnly] = useState(false);

    const imageUrlsToPreload = useMemo(() => timetable.map(dj => dj.imageUrl), [timetable]);
    const { loadedUrls, allLoaded: imagesLoaded } = useImagePreloader(imageUrlsToPreload);

    // 時刻同期ロジック (変更なし)
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

    // 起動時ロジック (ローディング制御変更)
    useEffect(() => {
        if (window.location.hash === '#live') {
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
            storageRef.current = storage; // ★ storage の実体を Ref に保存

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

    // データ購読ロジック (ローディング制御変更)
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
            // ★★★ データ読み込み完了！ここでローディングを解除するっす！ ★★★
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

    // データ保存ロジック (isReadOnly / isInitialLoading 対応)
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

    // モード切り替えハンドラ (isReadOnly / imagesLoaded 対応)
    const handleSetMode = (newMode) => {
        if (isReadOnly && newMode === 'edit') {
            console.warn("閲覧専用モードのため、編集モードには戻れません。");
            return;
        }
        if (newMode === 'live' && !imagesLoaded) {
            alert("まだ画像の準備中っす！ちょっと待ってからもう一回押してくださいっす！");
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

    // メインの描画切り替え
    switch (appStatus) {
        case 'connecting':
            return <div className="flex items-center justify-center h-screen"><p className="text-2xl">Connecting...</p></div>;

        case 'config_error':
            return (
                <div className="flex items-center justify-center h-screen p-8 text-center bg-surface-background text-on-surface">
                    <div className="bg-surface-container p-8 rounded-2xl shadow-2xl max-w-2xl">
                        <h1 className="text-2xl font-bold text-red-400 mb-4">Firebaseの設定が必要です</h1>
                        <p className="text-on-surface-variant mb-6">
                            このアプリを動作させるには、<code>src/firebase.js</code> ファイル内の <code>firebaseConfig</code> オブジェクトを、ご自身のFirebaseプロジェクトのものに置き換える必要があります。
                        </p>
                        <code className="bg-surface-background text-left p-4 rounded-lg block overflow-x-auto text-sm">
                            <pre className="whitespace-pre-wrap">
                                {`// src/firebase.js内のこの部分を書き換えてください
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
                    </div>
                </div>
            );

        case 'offline':
        case 'online':
            return (
                <>
                    {appStatus === 'offline' && (
                        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500/90 text-white font-bold py-2 px-4 rounded-full shadow-lg flex items-center gap-2 animate-fade-in-up">
                            <AlertTriangleIcon className="w-5 h-5" />
                            <span>オフラインモード (データは保存・共有されません)</span>
                        </div>
                    )}

                    {/* ★★★ ここが最終的な切り替えっす！ ★★★ */}
                    {mode === 'edit' && !isReadOnly ?
                        // TimetableEditor に App が持つ state や関数を props で渡す
                        <TimetableEditor
                            eventConfig={eventConfig}
                            setEventConfig={setEventConfig}
                            timetable={timetable}
                            setTimetable={setTimetable}
                            setMode={handleSetMode}
                            storage={storageRef.current} // ★ storage の実体を渡す
                            timeOffset={timeOffset}
                        /> :
                        // LiveView にも App が持つ state や関数を props で渡す
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