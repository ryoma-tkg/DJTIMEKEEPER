// [src/components/LivePage.jsx]
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

import { LiveView } from './LiveView';
import { useImagePreloader } from '../hooks/useImagePreloader';
import { LoadingScreen } from './common';

const getDefaultEventConfig = () => ({
    title: 'DJ Timekeeper Pro',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '22:00',
    vjFeatureEnabled: false
});

export const LivePage = ({ theme, toggleTheme }) => {
    const { eventId, floorId } = useParams();
    const navigate = useNavigate();
    const dbRef = useRef(db);

    const [eventData, setEventData] = useState(null);
    const [eventConfig, setEventConfig] = useState(getDefaultEventConfig());
    const [floors, setFloors] = useState({}); // ★重要: ここがデータを受け取る

    const [timetable, setTimetable] = useState([]);
    const [vjTimetable, setVjTimetable] = useState([]);
    const [pageStatus, setPageStatus] = useState('loading');
    const [timeOffset, setTimeOffset] = useState(0);

    const imageUrlsToPreload = useMemo(() => timetable.map(dj => dj.imageUrl), [timetable]);
    const { loadedUrls, allLoaded: imagesLoaded } = useImagePreloader(imageUrlsToPreload);
    const docRef = useMemo(() => doc(dbRef.current, 'timetables', eventId), [eventId]);

    useEffect(() => {
        if (!eventId || !floorId) return;

        setPageStatus('loading');
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();

                // ★★★ 診断ログ 1: Firestoreの生データ ★★★
                console.log("📊 [LivePage] Firestore Raw Data:", data);
                console.log("📊 [LivePage] data.floors:", data.floors);

                setEventData(data);
                setEventConfig(prev => ({ ...prev, ...(data.eventConfig || {}) }));

                // データをセット
                const newFloors = data.floors || {};
                setFloors(newFloors);

                // 旧データ互換処理
                if (!data.floors && data.timetable) {
                    console.log("⚠️ [LivePage] Detected Legacy Data format");
                    if (floorId === 'default') {
                        setTimetable(data.timetable || []);
                        setVjTimetable(data.vjTimetable || []);
                        setFloors({ 'default': { name: 'Main Floor', order: 0, timetable: data.timetable, vjTimetable: data.vjTimetable } });
                        setPageStatus('ready');
                    } else {
                        navigate(`/live/${eventId}/default`, { replace: true });
                    }
                }
                // 新データ処理
                else if (data.floors) {
                    console.log("✅ [LivePage] Detected Multi-Floor Data format");
                    if (data.floors[floorId]) {
                        setTimetable(data.floors[floorId].timetable || []);
                        setVjTimetable(data.floors[floorId].vjTimetable || []);
                        setPageStatus('ready');
                    } else {
                        // 存在しないIDなら先頭へ
                        const firstFloorId = Object.keys(data.floors).sort(
                            (a, b) => (data.floors[a].order || 0) - (data.floors[b].order || 0)
                        )[0];
                        if (firstFloorId) {
                            console.log(`🔄 [LivePage] Redirecting to first floor: ${firstFloorId}`);
                            navigate(`/live/${eventId}/${firstFloorId}`, { replace: true });
                        } else {
                            setPageStatus('not-found');
                        }
                    }
                } else {
                    console.error("❌ [LivePage] No valid data found (No floors, No legacy timetable)");
                    setPageStatus('not-found');
                }
            } else {
                console.error("❌ [LivePage] Document does not exist");
                setPageStatus('not-found');
            }
        }, (error) => {
            console.error("❌ [LivePage] Error:", error);
            setPageStatus('offline');
        });

        return () => unsubscribe();
    }, [eventId, floorId, docRef, navigate]);

    const handleSelectFloor = (newFloorId) => {
        if (newFloorId !== floorId) {
            navigate(`/live/${eventId}/${newFloorId}`);
        }
    };

    const handleSetMode = (newMode) => {
        if (newMode === 'edit') {
            navigate(`/edit/${eventId}/${floorId}`);
        }
    };

    if (pageStatus === 'loading' || (pageStatus === 'ready' && !imagesLoaded)) {
        return <LoadingScreen text="読み込み中..." />;
    }
    if (pageStatus === 'not-found') return <div className="p-8">404 - Not Found</div>;
    if (pageStatus === 'offline') return <div className="p-8">接続エラー</div>;

    // ★★★ 診断ログ 2: LiveViewに渡す直前のfloors ★★★
    // console.log("🚀 [LivePage] Passing floors to LiveView:", floors);

    return (
        <LiveView
            timetable={timetable}
            vjTimetable={vjTimetable}
            eventConfig={eventConfig}
            floors={floors}           // ★ここが空だとタブが出ない
            currentFloorId={floorId}
            setMode={handleSetMode}
            onSelectFloor={handleSelectFloor}
            loadedUrls={loadedUrls}
            timeOffset={timeOffset}
            isReadOnly={true}
            theme={theme}
            toggleTheme={toggleTheme}
        />
    );
};