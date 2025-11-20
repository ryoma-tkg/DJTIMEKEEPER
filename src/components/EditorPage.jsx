// [src/components/EditorPage.jsx]
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, storage } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

import { TimetableEditor } from './TimetableEditor';
import { LiveView } from './LiveView';
import { DevControls } from './DevControls';
import { useImagePreloader } from '../hooks/useImagePreloader';
import { PowerIcon, LoadingScreen } from './common';

// デフォルト設定
const getDefaultEventConfig = () => ({
    title: 'DJ Timekeeper Pro',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '22:00',
    vjFeatureEnabled: false
});

// ▼▼▼ isPerfMonitorVisible, onTogglePerfMonitor を props に追加 ▼▼▼
export const EditorPage = ({ user, isDevMode, onToggleDevMode, theme, toggleTheme, isPerfMonitorVisible, onTogglePerfMonitor }) => {
    const { eventId, floorId } = useParams();
    const navigate = useNavigate();
    const dbRef = useRef(db);
    const storageRef = useRef(storage);

    // state
    const [eventData, setEventData] = useState(null);
    const [eventConfig, setEventConfig] = useState(getDefaultEventConfig());
    const [floors, setFloors] = useState({});

    // 現在選択中のフロア情報
    const [currentFloorId, setCurrentFloorId] = useState(floorId);
    const [timetable, setTimetable] = useState([]);
    const [vjTimetable, setVjTimetable] = useState([]);

    const [mode, setMode] = useState('edit');
    const [pageStatus, setPageStatus] = useState('loading');
    const [timeOffset, setTimeOffset] = useState(0);
    const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);

    const imageUrlsToPreload = useMemo(() => timetable.map(dj => dj.imageUrl), [timetable]);
    const { loadedUrls, allLoaded: imagesLoaded } = useImagePreloader(imageUrlsToPreload);
    const docRef = useMemo(() => doc(dbRef.current, 'timetables', eventId), [eventId]);

    // 1. データ読み込み
    useEffect(() => {
        if (!user || !eventId) return;
        if (!eventData) {
            setPageStatus('loading');
        }

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.ownerUid !== user.uid) {
                    navigate(`/live/${eventId}`, { replace: true });
                    return;
                }
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
                }
                else if (data.floors) {
                    if (data.floors[currentFloorId]) {
                        setTimetable(data.floors[currentFloorId].timetable || []);
                        setVjTimetable(data.floors[currentFloorId].vjTimetable || []);
                    } else {
                        const firstFloorId = Object.keys(data.floors).sort(
                            (a, b) => (data.floors[a].order || 0) - (data.floors[b].order || 0)
                        )[0];
                        if (firstFloorId) {
                            navigate(`/edit/${eventId}/${firstFloorId}`, { replace: true });
                        }
                    }
                }
                setPageStatus('ready');
            } else {
                setPageStatus('not-found');
            }
        }, (error) => {
            console.error(error);
            setPageStatus('offline');
        });
        return () => unsubscribe();
    }, [user, eventId, docRef, navigate]);

    // URL同期 & データ更新
    useEffect(() => {
        setCurrentFloorId(floorId);
        if (eventData && eventData.floors && eventData.floors[floorId]) {
            setTimetable(eventData.floors[floorId].timetable || []);
            setVjTimetable(eventData.floors[floorId].vjTimetable || []);
        } else if (eventData && eventData.timetable && floorId === 'default') {
            setTimetable(eventData.timetable || []);
            setVjTimetable(eventData.vjTimetable || []);
        }
    }, [floorId, eventData]);

    // 保存ロジック
    const saveDataToFirestore = useCallback(() => {
        if (pageStatus !== 'ready' || !user || !currentFloorId) return;
        if (eventData && !eventData.floors && eventData.timetable) {
            setDoc(docRef, { eventConfig, timetable, vjTimetable }, { merge: true });
        } else if (eventData && eventData.floors) {
            const updates = {
                eventConfig,
                [`floors.${currentFloorId}.timetable`]: timetable,
                [`floors.${currentFloorId}.vjTimetable`]: vjTimetable,
            };
            updateDoc(docRef, updates);
        }
    }, [docRef, eventConfig, timetable, vjTimetable, pageStatus, user, currentFloorId, eventData]);

    useEffect(() => {
        if (pageStatus !== 'ready') return;
        const handler = setTimeout(() => saveDataToFirestore(), 1000);
        return () => clearTimeout(handler);
    }, [saveDataToFirestore]);

    const handleFloorsUpdate = async (newFloorsMap) => {
        if (pageStatus !== 'ready' || !user) return;
        if (eventData && !eventData.floors) return;
        try {
            await updateDoc(docRef, { floors: newFloorsMap });
        } catch (error) {
            console.error(error);
            setPageStatus('offline');
        }
    };

    const handleSetMode = (newMode) => {
        setMode(newMode);
    };

    const handleSelectFloor = (newFloorId) => {
        if (newFloorId !== currentFloorId) {
            navigate(`/edit/${eventId}/${newFloorId}`);
        }
    };

    const handleTimeJump = (m) => setTimeOffset(p => p + m * 60 * 1000);
    const handleTimeReset = () => setTimeOffset(0);
    const handleToggleVj = () => setEventConfig(p => ({ ...p, vjFeatureEnabled: !p.vjFeatureEnabled }));
    const handleSetStartNow = () => {
        const now = new Date();
        setEventConfig(p => ({ ...p, startDate: now.toISOString().split('T')[0], startTime: now.toTimeString().slice(0, 5) }));
        setTimeOffset(0);
    };

    if (pageStatus === 'loading') return <LoadingScreen text="読み込み中..." />;
    if (pageStatus === 'offline') return <div className="p-8">接続エラー</div>;
    if (pageStatus === 'not-found') return <div className="p-8">404 - Not Found<Link to="/">Dashboard</Link></div>;

    return (
        <>
            {mode === 'edit' ? (
                <TimetableEditor
                    eventConfig={eventConfig}
                    setEventConfig={setEventConfig}
                    timetable={timetable}
                    setTimetable={setTimetable}
                    vjTimetable={vjTimetable}
                    setVjTimetable={setVjTimetable}
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
                />
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
                    <button
                        onClick={() => setIsDevPanelOpen(p => !p)}
                        className="fixed bottom-4 left-4 z-[9999] w-12 h-12 bg-brand-primary text-white rounded-full shadow-lg grid place-items-center hover:bg-brand-primary/80 transition-colors"
                        style={{ isolation: 'isolate' }}
                    >
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
                                setTimetable={setTimetable}
                                setVjTimetable={setVjTimetable}
                                onToggleVjFeature={handleToggleVj}
                                onLoadDummyData={null}
                                onSetStartNow={handleSetStartNow}
                                onFinishEvent={() => handleTimeJump(1440)}
                                onCrashApp={() => { throw new Error('Test'); }}
                                imagesLoaded={imagesLoaded}
                                onClose={() => setIsDevPanelOpen(false)}
                                // ▼▼▼ 追加: モニター制御を渡す ▼▼▼
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