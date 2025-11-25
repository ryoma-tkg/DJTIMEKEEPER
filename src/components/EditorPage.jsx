// [src/components/EditorPage.jsx]
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { db, storage } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

import { TimetableEditor } from './TimetableEditor';
import { LiveView } from './LiveView';
import { DevControls } from './DevControls';
import { useImagePreloader } from '../hooks/useImagePreloader';
import {
    PowerIcon,
    LoadingScreen,
    Button,
    ResetIcon,
    ToastNotification
} from './common';

const getDefaultEventConfig = () => ({
    title: 'EVENT NAME',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '22:00',
    vjFeatureEnabled: false
});

// ★変更: userProfile を受け取る
export const EditorPage = ({ user, userProfile, isDevMode, onToggleDevMode, theme, toggleTheme, isPerfMonitorVisible, onTogglePerfMonitor }) => {
    const { eventId, floorId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const dbRef = useRef(db);
    const storageRef = useRef(storage);

    const [eventData, setEventData] = useState(null);
    const [eventConfig, setEventConfig] = useState(getDefaultEventConfig());
    const [floors, setFloors] = useState({});
    const currentFloorId = floorId;
    const [timetable, setTimetable] = useState([]);
    const [vjTimetable, setVjTimetable] = useState([]);

    const [mode, setMode] = useState(location.hash === '#live' ? 'live' : 'edit');
    const [pageStatus, setPageStatus] = useState('loading');
    const [timeOffset, setTimeOffset] = useState(0);
    const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState({ message: '', visible: false });

    const autoSaveTimerRef = useRef(null);
    const hasUnsavedChangesRef = useRef(false);
    const isProgrammaticUpdate = useRef(true);

    const imageUrlsToPreload = useMemo(() => timetable.map(dj => dj.imageUrl), [timetable]);
    const { loadedUrls, allLoaded: imagesLoaded } = useImagePreloader(imageUrlsToPreload);
    const docRef = useMemo(() => doc(dbRef.current, 'timetables', eventId), [eventId]);

    // ★追加: 権限判定とフロア数上限の設定
    const SUPER_ADMIN_UID = "GLGPpy6IlyWbGw15OwBPzRdCPZI2";
    const isAdmin = user?.uid === SUPER_ADMIN_UID || userProfile?.role === 'admin';
    const isProUser = userProfile?.role === 'pro';
    const canUseProFeatures = isAdmin || isProUser;
    // Freeプランは1フロアまで、Pro/Adminは20フロアまで
    const maxFloors = canUseProFeatures ? 20 : 1;

    const showToast = (message) => {
        setToast({ message, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    const saveDataToFirestore = useCallback(async (isSilent = false) => {
        if (pageStatus !== 'ready' || !user || !currentFloorId) return;

        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

        setIsSaving(true);
        try {
            if (eventData && !eventData.floors && eventData.timetable) {
                await setDoc(docRef, { eventConfig, timetable, vjTimetable }, { merge: true });
            } else if (eventData && eventData.floors) {
                const updates = {
                    eventConfig,
                    [`floors.${currentFloorId}.timetable`]: timetable,
                    [`floors.${currentFloorId}.vjTimetable`]: vjTimetable,
                };
                await updateDoc(docRef, updates);
            }

            setHasUnsavedChanges(false);
            hasUnsavedChangesRef.current = false;

            if (!isSilent) showToast("保存しました");
        } catch (error) {
            console.error("❌ Save failed:", error);
            showToast("保存に失敗しました: " + error.code);
        } finally {
            setIsSaving(false);
        }
    }, [docRef, eventConfig, timetable, vjTimetable, pageStatus, user, currentFloorId, eventData]);

    const latestSaveDataRef = useRef(saveDataToFirestore);
    useEffect(() => {
        latestSaveDataRef.current = saveDataToFirestore;
    }, [saveDataToFirestore]);

    const markAsDirty = useCallback(() => {
        if (isProgrammaticUpdate.current) return;
        setHasUnsavedChanges(true);
        hasUnsavedChangesRef.current = true;
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }
        autoSaveTimerRef.current = setTimeout(() => {
            latestSaveDataRef.current(true);
        }, 20000);
    }, []);

    const handleEventConfigChange = (newValOrFunc) => {
        setEventConfig(prev => {
            const next = typeof newValOrFunc === 'function' ? newValOrFunc(prev) : newValOrFunc;
            return next;
        });
        markAsDirty();
    };
    const handleTimetableChange = (newValOrFunc) => {
        setTimetable(prev => {
            const next = typeof newValOrFunc === 'function' ? newValOrFunc(prev) : newValOrFunc;
            return next;
        });
        markAsDirty();
    };
    const handleVjTimetableChange = (newValOrFunc) => {
        setVjTimetable(prev => {
            const next = typeof newValOrFunc === 'function' ? newValOrFunc(prev) : newValOrFunc;
            return next;
        });
        markAsDirty();
    };

    useEffect(() => {
        setMode(location.hash === '#live' ? 'live' : 'edit');
    }, [location.hash]);

    const handleSetMode = (newMode) => {
        if (hasUnsavedChanges) saveDataToFirestore(true);
        if (newMode === 'live') {
            navigate('#live');
        } else {
            if (window.history.length > 1) navigate(-1);
            else navigate(location.pathname, { replace: true });
        }
    };

    // --- データ読み込み ---
    useEffect(() => {
        if (!user || !eventId) return;
        if (!eventData) setPageStatus('loading');

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.ownerUid !== user.uid && !isDevMode) {
                    navigate(`/live/${eventId}`, { replace: true });
                    return;
                }

                if (!hasUnsavedChangesRef.current) {
                    isProgrammaticUpdate.current = true;

                    setEventData(data);
                    setEventConfig(prev => ({ ...prev, ...(data.eventConfig || {}) }));
                    setFloors(data.floors || {});

                    if (!data.floors && data.timetable) {
                        if (currentFloorId === 'default') {
                            setTimetable(data.timetable || []);
                            setVjTimetable(data.vjTimetable || []);
                            setFloors({ 'default': { name: 'Timetable', order: 0, timetable: data.timetable, vjTimetable: data.vjTimetable } });
                        } else {
                            navigate(`/edit/${eventId}/default`, { replace: true });
                        }
                    } else if (data.floors) {
                        if (data.floors[currentFloorId]) {
                            setTimetable(data.floors[currentFloorId].timetable || []);
                            setVjTimetable(data.floors[currentFloorId].vjTimetable || []);
                        } else {
                            const sortedFloorIds = Object.keys(data.floors).sort((a, b) => (data.floors[a].order || 0) - (data.floors[b].order || 0));
                            const firstFloorId = sortedFloorIds[0];

                            if (firstFloorId && !data.floors[currentFloorId]) {
                                navigate(`/edit/${eventId}/${firstFloorId}`, { replace: true });
                            }
                        }
                    }
                    setPageStatus('ready');
                    setTimeout(() => { isProgrammaticUpdate.current = false; }, 100);
                }
            } else {
                setPageStatus('not-found');
            }
        }, (error) => {
            console.error(error);
            setPageStatus('offline');
        });
        return () => unsubscribe();
    }, [user, eventId, docRef, navigate, isDevMode, currentFloorId]);

    // --- フロア切り替え時のデータ更新 ---
    useEffect(() => {
        if (!hasUnsavedChangesRef.current && eventData) {
            isProgrammaticUpdate.current = true;
            if (eventData.floors && eventData.floors[currentFloorId]) {
                setTimetable(eventData.floors[currentFloorId].timetable || []);
                setVjTimetable(eventData.floors[currentFloorId].vjTimetable || []);
            } else {
                setTimetable([]);
                setVjTimetable([]);
            }
            setTimeout(() => { isProgrammaticUpdate.current = false; }, 100);
        }
    }, [currentFloorId, eventData]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    useEffect(() => {
        return () => {
            if (hasUnsavedChangesRef.current) {
                latestSaveDataRef.current(true);
            }
        };
    }, []);

    const handleManualSave = () => {
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        saveDataToFirestore();
    };

    const handleFloorsUpdate = async (newFloorsMap) => {
        if (pageStatus !== 'ready' || !user) return;

        if (newFloorsMap[currentFloorId]) {
            newFloorsMap[currentFloorId] = {
                ...newFloorsMap[currentFloorId],
                timetable: timetable,
                vjTimetable: vjTimetable
            };
        }

        try {
            await updateDoc(docRef, { floors: newFloorsMap });
            setHasUnsavedChanges(false);
            hasUnsavedChangesRef.current = false;
        } catch (error) {
            console.error(error);
            setPageStatus('offline');
        }
    };

    const handleSelectFloor = async (newFloorId) => {
        if (hasUnsavedChanges) {
            await saveDataToFirestore(true);
        }
        if (newFloorId !== currentFloorId) {
            navigate({ pathname: `/edit/${eventId}/${newFloorId}`, hash: location.hash }, { replace: true });
        }
    };

    const handleTimeJump = (m) => setTimeOffset(p => p + m * 60 * 1000);
    const handleTimeReset = () => setTimeOffset(0);
    const handleToggleVj = () => handleEventConfigChange(p => ({ ...p, vjFeatureEnabled: !p.vjFeatureEnabled }));
    const handleSetStartNow = () => {
        const now = new Date();
        handleEventConfigChange(p => ({ ...p, startDate: now.toISOString().split('T')[0], startTime: now.toTimeString().slice(0, 5) }));
        setTimeOffset(0);
    };

    if (pageStatus === 'loading') return <LoadingScreen text="読み込み中..." />;
    if (pageStatus === 'offline') return <div className="p-8">接続エラー</div>;
    if (pageStatus === 'not-found') return <div className="p-8">404 - Not Found<Link to="/">Dashboard</Link></div>;

    return (
        <>
            <ToastNotification message={toast.message} isVisible={toast.visible} className="top-24" />

            {mode === 'edit' ? (
                <>
                    <TimetableEditor
                        user={user}
                        eventConfig={eventConfig}
                        setEventConfig={handleEventConfigChange}
                        timetable={timetable}
                        setTimetable={handleTimetableChange}
                        vjTimetable={vjTimetable}
                        setVjTimetable={handleVjTimetableChange}
                        floors={floors}
                        currentFloorId={currentFloorId}
                        onSelectFloor={handleSelectFloor}
                        onFloorsUpdate={handleFloorsUpdate}
                        setMode={handleSetMode}
                        storage={storageRef.current}
                        timeOffset={timeOffset}
                        theme={theme}
                        toggleTheme={toggleTheme}
                        imagesLoaded={imagesLoaded}
                        expireAt={eventData?.expireAt}
                        // ★追加: maxFloorsを渡す
                        maxFloors={maxFloors}
                    />

                    <div
                        className={`
                            fixed bottom-8 right-8 z-40 
                            flex flex-col items-stretch gap-1 
                            transition-all duration-300 
                            ${hasUnsavedChanges ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}
                        `}
                    >
                        <div className="bg-surface-container text-on-surface text-xs font-bold px-3 py-2 rounded-xl shadow-lg border border-on-surface/10 text-center animate-bounce-short mb-1">
                            20秒後に自動保存します
                        </div>
                        <Button
                            onClick={handleManualSave}
                            variant="primary"
                            size="lg"
                            icon={ResetIcon}
                            className={`shadow-2xl w-full ${isSaving ? 'opacity-80 cursor-wait' : ''}`}
                            disabled={isSaving}
                        >
                            {isSaving ? '保存中...' : '更新を反映'}
                        </Button>
                        <p className="text-[10px] text-on-surface-variant/70 text-center font-bold px-1 mt-0.5" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                            ※画面を離れる際も自動保存します
                        </p>
                    </div>
                </>
            ) : (
                <LiveView
                    timetable={timetable}
                    vjTimetable={vjTimetable}
                    eventConfig={eventConfig}
                    floors={floors}
                    currentFloorId={currentFloorId}
                    onSelectFloor={handleSelectFloor}
                    setMode={handleSetMode}
                    loadedUrls={loadedUrls}
                    timeOffset={timeOffset}
                    isReadOnly={false}
                    theme={theme}
                    toggleTheme={toggleTheme}
                    eventId={eventId}
                    isPreview={true}
                />
            )}

            {isDevMode && (
                <>
                    <button onClick={() => setIsDevPanelOpen(p => !p)} className="fixed bottom-4 left-4 z-[9999] w-12 h-12 bg-brand-primary text-white rounded-full shadow-lg grid place-items-center hover:bg-brand-primary/80 transition-colors" style={{ isolation: 'isolate' }}>
                        <PowerIcon className="w-6 h-6" />
                    </button>
                    {isDevPanelOpen && (
                        <div className="fixed bottom-4 right-4 z-[9999]" style={{ isolation: 'isolate' }}>
                            <DevControls
                                location="editor"
                                mode={mode}
                                setMode={handleSetMode}
                                timeOffset={timeOffset}
                                onTimeJump={handleTimeJump}
                                onTimeReset={handleTimeReset}
                                eventConfig={eventConfig}
                                timetable={timetable}
                                vjTimetable={vjTimetable}
                                setTimetable={handleTimetableChange}
                                setVjTimetable={handleVjTimetableChange}
                                onToggleVjFeature={handleToggleVj}
                                onLoadDummyData={null}
                                onSetStartNow={handleSetStartNow}
                                onFinishEvent={() => handleTimeJump(1440)}
                                onCrashApp={() => { throw new Error('Test'); }}
                                imagesLoaded={imagesLoaded}
                                onClose={() => setIsDevPanelOpen(false)}
                                isPerfMonitorVisible={isPerfMonitorVisible}
                                onTogglePerfMonitor={onTogglePerfMonitor}
                            />
                        </div>
                    )}
                </>
            )}
        </>
    );
};

export default EditorPage;