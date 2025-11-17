// [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-phase3-dev/src/components/LivePage.jsx]
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// 必要なコンポーネントとフックをインポート
import { LiveView } from './LiveView';
import { useImagePreloader } from '../hooks/useImagePreloader';

// (ローディング)
const LoadingScreen = ({ text = "読み込み中..." }) => (
    <div className="flex flex-col items-center justify-center h-screen bg-surface-background">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spinner mb-4"></div>
        <p className="text-lg text-on-surface-variant">{text}</p>
    </div>
);

// (デフォルト設定)
const getDefaultEventConfig = () => ({
    title: 'DJ Timekeeper Pro',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '22:00',
    vjFeatureEnabled: false
});

// ★ LivePage 本体
export const LivePage = ({ theme, toggleTheme }) => {
    const { eventId } = useParams(); // URLから /live/:eventId の eventId を取得
    const navigate = useNavigate();
    const dbRef = useRef(db);

    // ▼▼▼ 閲覧に必要な state のみ ▼▼▼
    const [timetable, setTimetable] = useState([]);
    const [vjTimetable, setVjTimetable] = useState([]);
    const [eventConfig, setEventConfig] = useState(getDefaultEventConfig());
    const [pageStatus, setPageStatus] = useState('loading'); // 'loading', 'ready', 'not-found'
    const [timeOffset, setTimeOffset] = useState(0); // (DevModeがないので常に0だが、将来のために残す)

    // 画像プリロード
    const imageUrlsToPreload = useMemo(() => timetable.map(dj => dj.imageUrl), [timetable]);
    const { loadedUrls, allLoaded: imagesLoaded } = useImagePreloader(imageUrlsToPreload);

    // タイムテーブルのドキュメントリファレンス
    const docRef = useMemo(() => doc(dbRef.current, 'timetables', eventId), [eventId]);

    // ▼ 1. データ読み込み (セキュリティチェックなし)
    useEffect(() => {
        if (!eventId) return;

        setPageStatus('loading');

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setTimetable(data.timetable || []);
                setVjTimetable(data.vjTimetable || []);
                setEventConfig(prev => ({ ...prev, ...(data.eventConfig || {}) }));
                setPageStatus('ready');
            } else {
                console.error("イベントが見つかりません (Not Found)");
                setPageStatus('not-found');
            }
        }, (error) => {
            console.error("イベントの読み込みに失敗:", error);
            setPageStatus('offline'); // 
        });

        return () => unsubscribe();
    }, [eventId, docRef]);

    // ▼ 2. 編集モードに戻る (isReadOnly=true なので実質オーナーのみ)
    const handleSetMode = (newMode) => {
        if (newMode === 'edit') {
            navigate(`/edit/${eventId}`);
        }
    };

    // === レンダリング ===

    if (pageStatus === 'loading' || (pageStatus === 'ready' && !imagesLoaded)) {
        return <LoadingScreen text="タイムテーブルを読み込み中..." />;
    }

    if (pageStatus === 'not-found') {
        return <div className="p-8"><h1>404 - イベントが見つかりません</h1></div>;
    }

    if (pageStatus === 'offline') {
        return <div className="p-8"><h1>接続エラー</h1><p>オフラインのため、タイムテーブルを表示できません。</p></div>;
    }

    //
    // pageStatus === 'ready'
    //
    return (
        <LiveView
            timetable={timetable}
            vjTimetable={vjTimetable}
            eventConfig={eventConfig}
            setMode={handleSetMode} // 
            loadedUrls={loadedUrls}
            timeOffset={timeOffset}
            isReadOnly={true} // ★ LivePage は常に ReadOnly
            theme={theme}
            toggleTheme={toggleTheme}
        />
    );
};