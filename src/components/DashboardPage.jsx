// [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-phase3-dev/src/components/DashboardPage.jsx]
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
// ▼▼▼ 【修正】 必要なアイコンを追加 ▼▼▼
import { getTodayDateString, PlusIcon, SettingsIcon, CopyIcon, TrashIcon, LayersIcon } from './common';

// (ローディング)
const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-screen bg-surface-background">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spinner"></div>
    </div>
);

// ▼▼▼ 【!!! 修正 !!!】 EventCard を「フロア数」表示に対応 ▼▼▼
const EventCard = ({ event }) => {

    // データの互換性対応
    // (新データ構造: floors があるか？)
    const floorCount = event.floors ? Object.keys(event.floors).length : 0;
    // (旧データ構造: timetable があるか？)
    const isOldData = !event.floors && event.timetable;

    let displayTitle = event.eventConfig.title || '無題のイベント';
    let displayFloors = `${floorCount} フロア`;

    if (isOldData) {
        displayFloors = '旧データ (1フロア)';
    } else if (floorCount === 0) {
        displayFloors = 'フロア未設定';
    }

    return (
        <div className="bg-surface-container rounded-2xl shadow-lg overflow-hidden transition-transform transform hover:scale-[1.02]">
            <div className="p-6">
                <h3 className="text-xl font-bold truncate mb-2">{displayTitle}</h3>
                <p className="text-sm text-on-surface-variant font-mono mb-4">
                    {event.eventConfig.startDate || '日付未設定'}
                </p>

                {/* フロア数表示 */}
                <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-4">
                    <LayersIcon className="w-4 h-4" />
                    <span>{displayFloors}</span>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        to={`/edit/${event.id}`}
                        className="flex-1 text-center bg-brand-primary text-white font-bold py-2 px-4 rounded-full"
                    >
                        編集
                    </Link>
                    <Link
                        to={`/live/${event.id}`}
                        target="_blank" // Liveは別タブで開く
                        className="flex-shrink-0 bg-surface-background text-on-surface-variant font-bold py-2 px-4 rounded-full"
                    >
                        Live
                    </Link>
                </div>
            </div>
        </div>
    );
};
// ▲▲▲ 【!!! 修正 !!!】 EventCard ここまで ▲▲▲


// (ダッシュボード本体)
export const DashboardPage = ({ user, onLogout }) => {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const navigate = useNavigate();

    // 1. (変更なし) 自分がオーナー(ownerUid)のイベントだけをFirestoreからリアルタイム取得
    useEffect(() => {
        if (!user) return;

        setIsLoading(true);
        const q = query(
            collection(db, "timetables"),
            where("ownerUid", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const userEvents = [];
            querySnapshot.forEach((doc) => {
                userEvents.push({ id: doc.id, ...doc.data() });
            });
            setEvents(userEvents);
            setIsLoading(false);
        }, (error) => {
            console.error("イベントの読み込みに失敗:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // ▼▼▼ 【!!! 修正 !!!】 新しいイベントのデータ構造を変更 ▼▼▼
    const handleCreateNewEvent = async () => {
        if (isCreating || !user) return;
        setIsCreating(true);

        try {
            // これが「1イベント＝複数フロア」の新しいデータ構造
            const defaultFloorId = `floor_${Date.now()}`; // 
            const newEventDoc = {
                ownerUid: user.uid,
                createdAt: Timestamp.now(),
                eventConfig: {
                    title: 'My New Multi-Floor Event',
                    startDate: getTodayDateString(),
                    startTime: '22:00',
                    vjFeatureEnabled: false
                },

                // ★ timetable: [] と vjTimetable: [] を廃止

                // ★ 代わりに floors マップを新設
                floors: {
                    [defaultFloorId]: {
                        name: "MAIN STAGE", // 最初のデフォルトフロア名
                        order: 0,          // フロアの並び順
                        timetable: [],     // このフロアのDJリスト
                        vjTimetable: []    // このフロアのVJリスト
                    }
                }
            };

            // 'timetables' コレクションに新しいドキュメントを追加
            const docRef = await addDoc(collection(db, "timetables"), newEventDoc);

            // 作成したら、すぐにそのイベントの編集ページに飛ぶ
            // ★ リンク先は /edit/:eventId のまま (EditorPage側でフロアを自動選択させる)
            navigate(`/edit/${docRef.id}`);

        } catch (error) {
            console.error("新規イベントの作成に失敗:", error);
            alert("イベントの作成に失敗しました。");
            setIsCreating(false);
        }
    };
    // ▲▲▲ 【!!! 修正 !!!】 新規イベント作成ロジックここまで ▲▲▲


    // (ローディング表示 - 変更なし)
    if (isLoading) {
        return <LoadingSpinner />;
    }

    // (JSX - 変更なし)
    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in-up">
            {/* ヘッダー */}
            <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <img src={user.photoURL} alt={user.displayName} className="w-12 h-12 rounded-full" />
                    <div>
                        <h1 className="text-2xl font-bold">マイページ</h1>
                        <p className="text-sm text-on-surface-variant">{user.displayName} さん</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onLogout}
                        className="bg-surface-container text-on-surface font-semibold py-2 px-4 rounded-full"
                    >
                        ログアウト
                    </button>
                </div>
            </header>

            {/* イベント作成ボタン */}
            <div className="mb-8">
                <button
                    onClick={handleCreateNewEvent}
                    disabled={isCreating}
                    className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:opacity-90 text-white font-bold py-4 px-6 rounded-full transition-opacity duration-200 shadow-lg disabled:opacity-50"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>{isCreating ? '作成中...' : '新しいイベントを作成する'}</span>
                </button>
            </div>

            {/* イベント一覧 */}
            <h2 className="text-xl font-bold mb-4">イベント一覧</h2>
            {events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            ) : (
                <div className="text-center bg-surface-container p-8 rounded-2xl">
                    <p className="text-lg text-on-surface-variant">イベントがありません。</p>
                    <p className="text-on-surface-variant">上のボタンから新しいイベントを作成してください！</p>
                </div>
            )}
        </div>
    );
};