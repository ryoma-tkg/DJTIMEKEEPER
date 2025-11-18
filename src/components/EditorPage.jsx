// [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-phase3-dev/src/components/EditorPage.jsx]
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, storage } from '../firebase'; // auth は user prop 経由なので削除
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'; // ★ updateDoc をインポート

// 必要なコンポーネントとフックをインポート
import { TimetableEditor } from './TimetableEditor';
import { LiveView } from './LiveView';
import { DevControls } from './DevControls';
import { useImagePreloader } from '../hooks/useImagePreloader';
import { PowerIcon, AlertTriangleIcon, LayersIcon, LoadingScreen } from './common'; // ★ LoadingScreen を common から拝借

// (getDefaultEventConfig - 変更なし)
const getDefaultEventConfig = () => ({
    title: 'DJ Timekeeper Pro',
    startDate: new Date().toISOString().split('T')[0], // 
    startTime: '22:00',
    vjFeatureEnabled: false
});

// ▼▼▼ 【!!! 新設 !!!】 フロアタブUI ▼▼▼
const FloorTabs = ({ floors, activeFloorId, onSelectFloor }) => {
    const sortedFloors = useMemo(() => {
        return Object.entries(floors)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [floors]);

    return (
        <div className="flex items-center gap-2 mb-6 border-b border-surface-container overflow-x-auto pb-2">
            {sortedFloors.map(floor => {
                const isActive = floor.id === activeFloorId;
                return (
                    <button
                        key={floor.id}
                        onClick={() => onSelectFloor(floor.id)}
                        className={`
                            py-2 px-5 rounded-full font-semibold whitespace-nowrap
                            ${isActive
                                ? 'bg-brand-primary text-white'
                                : 'bg-surface-container text-on-surface-variant hover:bg-surface-background'
                            }
                        `}
                    >
                        {floor.name}
                    </button>
                );
            })}
        </div>
    );
};
// ▲▲▲ 【!!! 新設 !!!】 フロアタブUIここまで ▲▲▲

// ★ EditorPage 本体
export const EditorPage = ({ user, isDevMode, onToggleDevMode, theme, toggleTheme }) => {
    // ▼▼▼ 【!!! 修正 !!!】 useParams で floorId も取得 ▼▼▼
    const { eventId, floorId } = useParams(); // URLから /edit/:eventId/:floorId を取得
    const navigate = useNavigate();
    const dbRef = useRef(db);
    const storageRef = useRef(storage);

    // ▼▼▼ 【!!! 修正 !!!】 stateの構造を変更 ▼▼▼
    // イベント全体のデータ
    const [eventData, setEventData] = useState(null); // Firestoreドキュメント全体を保持
    const [eventConfig, setEventConfig] = useState(getDefaultEventConfig());
    const [floors, setFloors] = useState({}); // 

    // 現在選択中のフロアのデータ
    const [currentFloorId, setCurrentFloorId] = useState(floorId);
    const [timetable, setTimetable] = useState([]); // 選択中フロアの timetable
    const [vjTimetable, setVjTimetable] = useState([]); // 選択中フロアの vjTimetable

    // (旧 state は削除)
    // const [timetable, setTimetable] = useState([]);
    // const [vjTimetable, setVjTimetable] = useState([]);

    // (共通 state - 変更なし)
    const [mode, setMode] = useState('edit');
    const [pageStatus, setPageStatus] = useState('loading');
    const [timeOffset, setTimeOffset] = useState(0);
    const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);

    // (画像プリロード - 変更なし)
    const imageUrlsToPreload = useMemo(() => timetable.map(dj => dj.imageUrl), [timetable]);
    const { loadedUrls, allLoaded: imagesLoaded } = useImagePreloader(imageUrlsToPreload);

    // (ドキュメントリファレンス - 変更なし)
    const docRef = useMemo(() => doc(dbRef.current, 'timetables', eventId), [eventId]);
    // ▲▲▲ 【!!! 修正 !!!】 state構造の変更ここまで ▲▲▲


    // ▼ 1. データ読み込み ＆ 権限チェック ＆ フロア切り替え
    useEffect(() => {
        if (!user || !eventId) return;

        setPageStatus('loading');

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();

                // ★ セキュリティチェック (変更なし)
                if (data.ownerUid !== user.uid) {
                    console.warn("アクセス権限がありません (Not the owner)");
                    setPageStatus('forbidden');
                    navigate(`/live/${eventId}`, { replace: true });
                    return; // 
                }

                // ★ イベント全体のデータを state に保存
                setEventData(data); // ドキュメント全体
                setEventConfig(prev => ({ ...prev, ...(data.eventConfig || {}) }));
                setFloors(data.floors || {}); // 

                // ★ 互換性対応: 旧データ (floors がない)
                if (!data.floors && data.timetable) {
                    if (currentFloorId === 'default') {
                        setTimetable(data.timetable || []);
                        setVjTimetable(data.vjTimetable || []);
                        setFloors({ 'default': { name: 'Timetable', order: 0, timetable: data.timetable, vjTimetable: data.vjTimetable } });
                    } else {
                        // URL が /edit/.../default 以外ならリダイレクト
                        navigate(`/edit/${eventId}/default`, { replace: true });
                    }
                }
                // ★ 新データ (floors がある)
                else if (data.floors) {
                    // URLで指定されたフロアID (currentFloorId) が存在するかチェック
                    if (data.floors[currentFloorId]) {
                        // 存在したら、そのフロアのデータをセット
                        setTimetable(data.floors[currentFloorId].timetable || []);
                        setVjTimetable(data.floors[currentFloorId].vjTimetable || []);
                    } else {
                        // 存在しないIDがURLにあれば、最初のフロアにリダイレクト
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
                console.error("イベントが見つかりません (Not Found)");
                setPageStatus('not-found');
            }
        }, (error) => {
            console.error("イベントの読み込みに失敗:", error);
            setPageStatus('offline'); // 
        });

        return () => unsubscribe();
    }, [user, eventId, docRef, navigate]); // ★ currentFloorId は依存配列から除外 (onSnapshot内で処理)

    // ▼ 1.5. URLのフロアIDが変わったら、表示するフロアを切り替える
    useEffect(() => {
        // URLの :floorId が変わったら、currentFloorId state を更新
        setCurrentFloorId(floorId);

        // すでに読み込み済みの eventData から、新しいフロアのデータをセット
        if (eventData && eventData.floors && eventData.floors[floorId]) {
            setTimetable(eventData.floors[floorId].timetable || []);
            setVjTimetable(eventData.floors[floorId].vjTimetable || []);
        }
        // 旧データの場合
        else if (eventData && eventData.timetable && floorId === 'default') {
            setTimetable(eventData.timetable || []);
            setVjTimetable(eventData.vjTimetable || []);
        }
    }, [floorId, eventData]); // ★ floorId (URL) と eventData (DB) の変更を監視


    // ▼ 2. データベースへの自動保存ロジック (★ floors マップ対応)
    const saveDataToFirestore = useCallback(() => {
        if (pageStatus !== 'ready' || !user || !currentFloorId) return;

        // ★ 旧データ (floors がない) への書き込み
        if (eventData && !eventData.floors && eventData.timetable) {
            const dataToSave = {
                eventConfig,
                timetable, // 
                vjTimetable // 
            };
            setDoc(docRef, dataToSave, { merge: true }).catch(error => {
                console.error("Error saving old data:", error);
                setPageStatus('offline');
            });
        }
        // ★ 新データ (floors がある) への書き込み
        else if (eventData && eventData.floors) {
            // updateDoc を使い、eventConfig と floors.{floorId} だけをピンポイント更新
            const updates = {
                eventConfig,
                [`floors.${currentFloorId}.timetable`]: timetable,
                [`floors.${currentFloorId}.vjTimetable`]: vjTimetable,
                // (フロア名変更もここで行うが、それはTimetableEditor側で実装)
            };
            updateDoc(docRef, updates).catch(error => {
                console.error("Error saving floor data:", error);
                setPageStatus('offline');
            });
        }

    }, [docRef, eventConfig, timetable, vjTimetable, pageStatus, user, currentFloorId, eventData]); // ★ 依存関係に注意

    // (自動保存useEffect - 変更なし)
    useEffect(() => {
        if (pageStatus !== 'ready') return;
        const handler = setTimeout(() => {
            saveDataToFirestore();
        }, 1000);
        return () => clearTimeout(handler);
    }, [saveDataToFirestore]);

    const handleFloorsUpdate = async (newFloorsMap) => {
        if (pageStatus !== 'ready' || !user) {
            alert("エラー: ログインされていません。");
            return;
        }
        // 旧データの場合は何もしない
        if (eventData && !eventData.floors) {
            alert("旧データのフロア編集はできません。");
            return;
        }

        try {
            // ドキュメント全体の floors フィールドを
            // 新しいフロアマップで上書きする
            await updateDoc(docRef, {
                floors: newFloorsMap
            });
            // (onSnapshotが自動でローカルの state を更新する)
        } catch (error) {
            console.error("フロアの更新に失敗:", error);
            alert("フロアの更新に失敗しました。");
            setPageStatus('offline');
        }
    };

    // ▼ 3. Liveモードへの切り替え (変更なし)
    const handleSetMode = (newMode) => {
        if (newMode === 'live') {
            if (!imagesLoaded) {
                alert("まだ画像の準備中っす！ちょっと待ってからもう一回押してくださいっす！");
                return;
            }
            setMode('live');
        } else {
            setMode('edit');
        }
    };

    // ▼ 3.5. フロアタブ切り替え
    const handleSelectFloor = (newFloorId) => {
        if (newFloorId !== currentFloorId) {
            // URL を /edit/:eventId/:newFloorId に変更する
            navigate(`/edit/${eventId}/${newFloorId}`);
            // 実際の state 切り替えは、上記の useEffect [floorId, eventData] が担当する
        }
    };


    // ▼ 4. 開発者モード用ロジック (変更なし)
    const handleTimeJump = (minutes) => { /* ... */
        const msToAdd = minutes * 60 * 1000;
        setTimeOffset(prevOffset => prevOffset + msToAdd);
    };
    const handleTimeReset = () => setTimeOffset(0);
    const handleToggleVjFeature = () => setEventConfig(prev => ({ ...prev, vjFeatureEnabled: !prev.vjFeatureEnabled }));
    const handleSetStartNow = () => { /* ... */
        const now = new Date();
        const newStartDate = now.toISOString().split('T')[0];
        const newStartTime = now.toTimeString().slice(0, 5);
        setEventConfig(prev => ({ ...prev, startDate: newStartDate, startTime: newStartTime, }));
        setTimeOffset(0);
    };
    const handleFinishEvent = () => handleTimeJump(1440);
    const [crash, setCrash] = useState(false);
    if (crash) throw new Error('Test Error from DevControls');


    // === レンダリング ===

    // (ローディング、エラー表示 - 変更なし)
    if (pageStatus === 'loading') {
        return <LoadingScreen text="イベントデータを読み込み中..." />;
    }
    if (pageStatus === 'offline') {
        return (<div className="fixed ...">...</div>); // 
    }
    if (pageStatus === 'not-found') {
        return <div className="p-8"><h1>404 - イベントが見つかりません</h1><Link to="/">ダッシュボードに戻る</Link></div>;
    }
    if (pageStatus === 'forbidden') {
        return <LoadingScreen text="閲覧モードにリダイレクト中..." />;
    }

    //
    // pageStatus === 'ready' の場合
    //

    // ▼▼▼ 【!!! 修正 !!!】 本来の return 文 (FloorTabs を追加) ▼▼▼
    return (
        <>
            {mode === 'edit' ? (
                <>
                    {/* ★ フロアタブを追加 ★ */}
                    <div className="p-4 md:p-8 max-w-7xl mx-auto">
                        <FloorTabs
                            floors={floors}
                            activeFloorId={currentFloorId}
                            onSelectFloor={handleSelectFloor}
                        />
                    </div>

                    <TimetableEditor
                        // (イベント全体の設定)
                        eventConfig={eventConfig}
                        setEventConfig={setEventConfig}
                        // (選択中フロアのTT)
                        timetable={timetable}
                        setTimetable={setTimetable}
                        vjTimetable={vjTimetable}
                        setVjTimetable={setVjTimetable}
                        // ★★★ 【!!! 追加 !!!】 フロア管理用の props ★★★
                        floors={floors}
                        onFloorsUpdate={handleFloorsUpdate}
                        // (その他 - 変更なし)
                        setMode={handleSetMode}
                        storage={storageRef.current}
                        timeOffset={timeOffset}
                        theme={theme}
                        toggleTheme={toggleTheme}
                        imagesLoaded={imagesLoaded}
                    />
                </>
            ) : (
                <LiveView
                    // (選択中フロアのTT)
                    timetable={timetable}
                    vjTimetable={vjTimetable}
                    // (イベント全体の設定)
                    eventConfig={eventConfig}
                    // (その他 - 変更なし)
                    setMode={handleSetMode}
                    loadedUrls={loadedUrls}
                    timeOffset={timeOffset}
                    isReadOnly={false}
                    theme={theme}
                    toggleTheme={toggleTheme}
                />
            )}

            {/* (開発者モード用 - 変更なし) */}
            {isDevMode && (
                <>
                    <button
                        onClick={() => setIsDevPanelOpen(prev => !prev)}
                        className="fixed bottom-4 left-4 z-[998] w-12 h-12 bg-brand-primary text-white rounded-full shadow-lg grid place-items-center"
                        title="開発者パネルを開く"
                    >
                        <PowerIcon className="w-6 h-6" />
                    </button>
                    {isDevPanelOpen && (
                        <DevControls
                            mode={mode}
                            setMode={handleSetMode}
                            timeOffset={timeOffset}
                            onTimeJump={handleTimeJump}
                            onTimeReset={handleTimeReset}
                            eventConfig={eventConfig}
                            timetable={timetable} // 
                            vjTimetable={vjTimetable} // 
                            onToggleVjFeature={handleToggleVjFeature}
                            onLoadDummyData={() => alert("ダミーデータはダッシュボードで作成してください")}
                            onSetStartNow={handleSetStartNow}
                            onFinishEvent={handleFinishEvent}
                            onCrashApp={() => setCrash(true)}
                            imagesLoaded={imagesLoaded}
                            onClose={() => setIsDevPanelOpen(false)}
                        />
                    )}
                </>
            )}
        </>
    );
};

export default EditorPage;