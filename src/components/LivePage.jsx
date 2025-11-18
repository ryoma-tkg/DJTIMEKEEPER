// [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-phase3-dev/src/components/LivePage.jsx]
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// 必要なコンポーネントとフックをインポート
import { LiveView } from './LiveView';
import { useImagePreloader } from '../hooks/useImagePreloader';
import { LoadingScreen } from './common'; // ★ common から拝借

// (デフォルト設定 - 変更なし)
const getDefaultEventConfig = () => ({
    title: 'DJ Timekeeper Pro',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '22:00',
    vjFeatureEnabled: false
});

// ★ LivePage 本体
export const LivePage = ({ theme, toggleTheme }) => {
    // ▼▼▼ 【!!! 修正 !!!】 useParams で floorId も取得 ▼▼▼
    const { eventId, floorId } = useParams(); // URLから /live/:eventId/:floorId を取得
    const navigate = useNavigate();
    const dbRef = useRef(db);

    // ▼▼▼ 【!!! 修正 !!!】 state構造を変更 ▼▼▼
    const [timetable, setTimetable] = useState([]); // 選択中フロアの timetable
    const [vjTimetable, setVjTimetable] = useState([]); // 選択中フロアの vjTimetable
    const [eventConfig, setEventConfig] = useState(getDefaultEventConfig());

    // (共通 state - 変更なし)
    const [pageStatus, setPageStatus] = useState('loading');
    const [timeOffset, setTimeOffset] = useState(0);

    // (画像プリロード - 変更なし)
    const imageUrlsToPreload = useMemo(() => timetable.map(dj => dj.imageUrl), [timetable]);
    const { loadedUrls, allLoaded: imagesLoaded } = useImagePreloader(imageUrlsToPreload);

    // (ドキュメントリファレンス - 変更なし)
    const docRef = useMemo(() => doc(dbRef.current, 'timetables', eventId), [eventId]);


    // ▼ 1. データ読み込み (フロアIDを考慮)
    useEffect(() => {
        if (!eventId || !floorId) return; // ★ floorId がないと何もしない

        setPageStatus('loading');

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();

                // ★ イベント全体の設定をセット
                setEventConfig(prev => ({ ...prev, ...(data.eventConfig || {}) }));

                // ★ 互換性対応: 旧データ (floors がない)
                if (!data.floors && data.timetable) {
                    if (floorId === 'default') {
                        setTimetable(data.timetable || []);
                        setVjTimetable(data.vjTimetable || []);
                        setPageStatus('ready');
                    } else {
                        // default 以外の floorId ならリダイレクト
                        navigate(`/live/${eventId}/default`, { replace: true });
                    }
                }
                // ★ 新データ (floors がある)
                else if (data.floors) {
                    // URLで指定されたフロアIDが存在するかチェック
                    if (data.floors[floorId]) {
                        // 存在したら、そのフロアのデータをセット
                        setTimetable(data.floors[floorId].timetable || []);
                        setVjTimetable(data.floors[floorId].vjTimetable || []);
                        setPageStatus('ready');
                    } else {
                        // 存在しないIDがURLにあれば、最初のフロアにリダイレクト
                        const firstFloorId = Object.keys(data.floors).sort(
                            (a, b) => (data.floors[a].order || 0) - (data.floors[b].order || 0)
                        )[0];
                        if (firstFloorId) {
                            navigate(`/live/${eventId}/${firstFloorId}`, { replace: true });
                        } else {
                            setPageStatus('not-found'); // フロアが1つもない
                        }
                    }
                }
                // データはあるが、timetable も floors もない場合
                else {
                    setPageStatus('not-found');
                }

            } else {
                console.error("イベントが見つかりません (Not Found)");
                setPageStatus('not-found');
            }
        }, (error) => {
            console.error("イベントの読み込みに失敗:", error);
            setPageStatus('offline'); // 
        });

        return () => unsubscribe();
    }, [eventId, floorId, docRef, navigate]); // ★ floorId を依存配列に追加


    // ▼ 2. 編集モードに戻る (変更なし)
    const handleSetMode = (newMode) => {
        if (newMode === 'edit') {
            // ★ floorId も含めて編集ページに戻る
            navigate(`/edit/${eventId}/${floorId}`);
        }
    };

    // === レンダリング ===

    // (ローディング、エラー表示 - 変更なし)
    if (pageStatus === 'loading' || (pageStatus === 'ready' && !imagesLoaded)) {
        return <LoadingScreen text="タイムテーブルを読み込み中..." />;
    }
    if (pageStatus === 'not-found') {
        return <div className="p-8"><h1>404 - イベントまたはフロアが見つかりません</h1></div>;
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
            setMode={handleSetMode}
            loadedUrls={loadedUrls}
            timeOffset={timeOffset}
            isReadOnly={true}
            theme={theme}
            toggleTheme={toggleTheme}
        />
    );
};