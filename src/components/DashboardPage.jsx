// [src/components/DashboardPage.jsx]
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, query, where, onSnapshot, Timestamp, writeBatch } from 'firebase/firestore';
import {
    getTodayDateString,
    PlusIcon,
    SettingsIcon,
    LayersIcon,
    XIcon,
    MoonIcon,
    SunIcon,
    LogOutIcon,
    TrashIcon,
    ConfirmModal,
    PowerIcon
} from './common';
import { DevControls } from './DevControls';

// (ローディング - 変更なし)
const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-screen bg-surface-background">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spinner"></div>
    </div>
);

// ▼ 設定モーダル (新設)
const DashboardSettingsModal = ({ isOpen, onClose, theme, toggleTheme, onLogout }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in-up" onClick={onClose}>
            <div className="bg-surface-container rounded-2xl p-6 w-full max-w-sm shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-background text-on-surface-variant hover:text-on-surface"
                >
                    <XIcon className="w-6 h-6" />
                </button>

                <h2 className="text-xl font-bold mb-6 text-on-surface">アプリ設定</h2>

                <div className="space-y-4">
                    {/* テーマ切替 */}
                    <div className="flex items-center justify-between p-3 bg-surface-background rounded-xl">
                        <label className="text-base text-on-surface font-semibold">テーマ</label>
                        <button
                            onClick={toggleTheme}
                            className="flex items-center gap-2 bg-surface-container hover:opacity-80 text-on-surface-variant font-semibold py-2 px-4 rounded-full transition-colors"
                        >
                            {theme === 'dark' ? (
                                <><MoonIcon className="w-5 h-5" /> <span>ダーク</span></>
                            ) : (
                                <><SunIcon className="w-5 h-5" /> <span>ライト</span></>
                            )}
                        </button>
                    </div>

                    {/* ログアウト */}
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-between p-3 bg-surface-background hover:bg-red-500/10 text-red-400 rounded-xl transition-colors group"
                    >
                        <span className="font-semibold group-hover:text-red-500">ログアウト</span>
                        <LogOutIcon className="w-5 h-5 group-hover:text-red-500" />
                    </button>
                </div>
            </div>
        </div>
    );
};


// ▼ EventCard (改修: 削除ボタン追加, ラベル削除)
const EventCard = ({ event, onDeleteClick }) => {
    const floorCount = event.floors ? Object.keys(event.floors).length : 0;
    // 「旧データ」ラベルは削除し、単にフロア数として扱う
    const displayFloors = (floorCount === 0 && event.timetable)
        ? '1 フロア' // 旧データ互換表示
        : `${floorCount} フロア`;

    return (
        <div className="bg-surface-container rounded-2xl shadow-lg overflow-hidden transition-transform transform hover:scale-[1.02] relative group">
            {/* 削除ボタン (ホバー時またはSPで表示) */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    onDeleteClick(event.id, event.eventConfig.title);
                }}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-red-500 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all z-10"
                title="イベントを削除"
            >
                <TrashIcon className="w-4 h-4" />
            </button>

            <div className="p-6">
                <h3 className="text-xl font-bold truncate mb-2 pr-8">{event.eventConfig.title || '無題のイベント'}</h3>
                <p className="text-sm text-on-surface-variant font-mono mb-4">
                    {event.eventConfig.startDate || '日付未設定'}
                </p>

                <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-4">
                    <LayersIcon className="w-4 h-4" />
                    <span>{displayFloors}</span>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        to={`/edit/${event.id}`}
                        className="flex-1 text-center bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-2 px-4 rounded-full transition-colors"
                    >
                        編集
                    </Link>
                    <Link
                        to={`/live/${event.id}`}
                        target="_blank"
                        className="flex-shrink-0 bg-surface-background hover:bg-surface-background/80 text-on-surface-variant font-bold py-2 px-4 rounded-full transition-colors"
                    >
                        Live
                    </Link>
                </div>
            </div>
        </div>
    );
};


export const DashboardPage = ({ user, onLogout, theme, toggleTheme, isDevMode }) => {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // UI State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // { id, title }
    const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);

    const navigate = useNavigate();

    // 1. イベント一覧取得
    useEffect(() => {
        if (!user) return;
        setIsLoading(true);
        const q = query(collection(db, "timetables"), where("ownerUid", "==", user.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const userEvents = [];
            querySnapshot.forEach((doc) => {
                userEvents.push({ id: doc.id, ...doc.data() });
            });
            // 作成日順(新しい順)にソート推奨だが、今回はそのまま
            setEvents(userEvents);
            setIsLoading(false);
        }, (error) => {
            console.error("イベント読込エラー:", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    // 2. イベント作成
    const handleCreateNewEvent = async () => {
        if (isCreating || !user) return;
        setIsCreating(true);
        try {
            const defaultFloorId = `floor_${Date.now()}`;
            const newEventDoc = {
                ownerUid: user.uid,
                createdAt: Timestamp.now(),
                eventConfig: {
                    title: 'My New Event',
                    startDate: getTodayDateString(),
                    startTime: '22:00',
                    vjFeatureEnabled: false
                },
                floors: {
                    [defaultFloorId]: {
                        name: "MAIN STAGE",
                        order: 0,
                        timetable: [],
                        vjTimetable: []
                    }
                }
            };
            const docRef = await addDoc(collection(db, "timetables"), newEventDoc);
            navigate(`/edit/${docRef.id}`);
        } catch (error) {
            console.error("作成失敗:", error);
            alert("イベントの作成に失敗しました。");
            setIsCreating(false);
        }
    };

    // 3. イベント削除
    const handleDeleteEvent = async () => {
        if (!deleteTarget) return;
        try {
            await deleteDoc(doc(db, "timetables", deleteTarget.id));
            setDeleteTarget(null);
        } catch (error) {
            console.error("削除失敗:", error);
            alert("削除に失敗しました。");
        }
    };

    // 4. [Dev] 全イベント削除
    const handleDevDeleteAll = async () => {
        if (!window.confirm("【警告】本当に全てのイベントを削除しますか？この操作は取り消せません。")) return;
        try {
            const batch = writeBatch(db);
            events.forEach(event => {
                const ref = doc(db, "timetables", event.id);
                batch.delete(ref);
            });
            await batch.commit();
            alert("全てのイベントを削除しました。");
        } catch (error) {
            console.error("一括削除失敗:", error);
            alert("一括削除に失敗しました。");
        }
    };


    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto animate-fade-in-up">

            {/* --- ヘッダー --- */}
            <header className="flex flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                    {user?.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-surface-container" />
                    ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold">
                            {user?.displayName?.[0] || "U"}
                        </div>
                    )}
                    <div className="flex flex-col">
                        <h1 className="text-lg sm:text-2xl font-bold leading-tight">マイページ</h1>
                        <p className="text-xs sm:text-sm text-on-surface-variant truncate max-w-[150px] sm:max-w-xs">
                            {user?.displayName}
                        </p>
                    </div>
                </div>

                {/* 設定ボタン */}
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="bg-surface-container hover:bg-surface-container/80 text-on-surface p-3 rounded-full transition-colors shadow-sm"
                    title="設定"
                >
                    <SettingsIcon className="w-6 h-6" />
                </button>
            </header>


            {/* --- イベント作成ボタン --- */}
            <div className="mb-8">
                <button
                    onClick={handleCreateNewEvent}
                    disabled={isCreating}
                    className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:opacity-90 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-wait"
                >
                    <PlusIcon className="w-6 h-6" />
                    <span className="text-lg">{isCreating ? 'イベントを作成中...' : '新しいイベントを作成'}</span>
                </button>
            </div>


            {/* --- イベント一覧 --- */}
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-on-surface">イベント一覧</h2>
                <span className="text-sm text-on-surface-variant font-mono">{events.length} 件</span>
            </div>

            {events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                    {events.map(event => (
                        <EventCard
                            key={event.id}
                            event={event}
                            onDeleteClick={(id, title) => setDeleteTarget({ id, title })}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center bg-surface-container/50 border-2 border-dashed border-surface-container p-12 rounded-3xl">
                    <p className="text-lg text-on-surface-variant font-bold mb-2">イベントがありません</p>
                    <p className="text-sm text-on-surface-variant/70">
                        上のボタンから、最初のイベントを作成してみましょう！
                    </p>
                </div>
            )}


            {/* --- モーダル類 --- */}
            <DashboardSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                theme={theme}
                toggleTheme={toggleTheme}
                onLogout={onLogout}
            />

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="イベントを削除"
                message={`イベント「${deleteTarget?.title || '無題'}」を削除します。復元はできません。本当によろしいですか？`}
                onConfirm={handleDeleteEvent}
                onCancel={() => setDeleteTarget(null)}
            />

            {/* --- 開発者モード --- */}
            {isDevMode && (
                <>
                    <button
                        onClick={() => setIsDevPanelOpen(prev => !prev)}
                        className="fixed bottom-4 left-4 z-[998] w-12 h-12 bg-zinc-800 text-brand-primary border border-brand-primary rounded-full shadow-lg grid place-items-center hover:bg-zinc-700 transition-colors"
                        title="開発者パネル"
                    >
                        <PowerIcon className="w-6 h-6" />
                    </button>
                    {isDevPanelOpen && (
                        <DevControls
                            location="dashboard"
                            onClose={() => setIsDevPanelOpen(false)}
                            onDeleteAllEvents={handleDevDeleteAll}
                            onCrashApp={() => { throw new Error("Dashboard Crash Test"); }}
                        />
                    )}
                </>
            )}
        </div>
    );
};