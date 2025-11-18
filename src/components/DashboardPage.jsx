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
    PowerIcon,
    ToggleSwitch,
    // ▼▼▼ 追加インポート ▼▼▼
    CustomTimeInput,
    CalendarIcon,
    VideoIcon
} from './common';
import { DevControls } from './DevControls';

// (ローディング - 変更なし)
const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-screen bg-surface-background">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spinner"></div>
    </div>
);

// (設定モーダル - 変更なし)
const DashboardSettingsModal = ({ isOpen, onClose, theme, toggleTheme, onLogout }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-surface-container rounded-2xl p-6 w-full max-w-sm shadow-2xl relative animate-modal-in" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-on-surface">アプリ設定</h2>
                    <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-surface-background text-on-surface-variant hover:text-on-surface"><XIcon className="w-6 h-6" /></button>
                </div>
                <div className="space-y-2 -mx-4 px-4 py-2">
                    <div className="bg-surface-background/50 rounded-xl p-2 shadow-sm">
                        <ToggleSwitch
                            checked={theme === 'dark'}
                            onChange={toggleTheme}
                            label="ダークモード"
                            icon={theme === 'dark' ? MoonIcon : SunIcon}
                        />
                    </div>
                    <div className="pt-4">
                        <button onClick={onLogout} className="w-full flex items-center justify-between p-4 bg-surface-background hover:bg-red-500/10 text-red-400 rounded-xl transition-colors group">
                            <span className="font-bold group-hover:text-red-500">ログアウト</span>
                            <LogOutIcon className="w-5 h-5 group-hover:text-red-500" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ▼▼▼ 【新設】 新規イベント作成設定モーダル ▼▼▼
const EventSetupModal = ({ isOpen, onClose, onCreate }) => {
    // 初期ステート
    const [config, setConfig] = useState({
        title: '',
        startDate: getTodayDateString(),
        startTime: '22:00',
        vjEnabled: false,
        isMultiFloor: false
    });

    // モーダルが開くたびにリセット
    useEffect(() => {
        if (isOpen) {
            setConfig({
                title: '',
                startDate: getTodayDateString(),
                startTime: '22:00',
                vjEnabled: false,
                isMultiFloor: false
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        // タイトルが空ならデフォルトを入れる
        const finalConfig = {
            ...config,
            title: config.title.trim() || 'New Event'
        };
        onCreate(finalConfig);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-surface-container rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-modal-in flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>

                {/* ヘッダー */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-on-surface">新規イベント作成</h2>
                    <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-surface-background text-on-surface-variant hover:text-on-surface"><XIcon className="w-6 h-6" /></button>
                </div>

                {/* コンテンツ (スクロール対応) */}
                <div className="flex-grow overflow-y-auto -mx-6 px-6 py-2 space-y-6 scrollbar-thin scrollbar-thumb-on-surface-variant/20">

                    {/* 基本情報 */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-on-surface-variant mb-1 block font-bold">イベント名</label>
                            <input
                                type="text"
                                value={config.title}
                                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                                className="bg-surface-background text-on-surface p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-brand-primary font-bold text-lg placeholder-on-surface-variant/30"
                                placeholder="イベント名を入力..."
                                autoFocus
                            />
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-on-surface-variant mb-1 block font-bold">開催日</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={config.startDate}
                                        onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                                        className="bg-surface-background text-on-surface p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-brand-primary font-mono font-bold text-sm appearance-none cursor-pointer"
                                    />
                                    <CalendarIcon className="w-5 h-5 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-on-surface-variant mb-1 block font-bold">開始時間</label>
                                <CustomTimeInput
                                    value={config.startTime}
                                    onChange={(v) => setConfig({ ...config, startTime: v })}
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-on-surface/10" />

                    {/* 機能設定 */}
                    <div className="space-y-2">
                        <label className="text-xs text-on-surface-variant mb-1 block font-bold">オプション設定</label>
                        <div className="bg-surface-background/50 rounded-xl px-4 py-2 space-y-2">
                            <ToggleSwitch
                                checked={config.vjEnabled}
                                onChange={(val) => setConfig({ ...config, vjEnabled: val })}
                                label="VJタイムテーブル機能"
                                icon={VideoIcon}
                            />
                            <div className="border-t border-on-surface/5"></div>
                            <ToggleSwitch
                                checked={config.isMultiFloor}
                                onChange={(val) => setConfig({ ...config, isMultiFloor: val })}
                                label="複数フロアを使用"
                                icon={LayersIcon}
                            />
                        </div>
                        <p className="text-xs text-on-surface-variant/60 px-2">
                            ※ 複数フロアをONにすると、初期状態で2つのフロアが作成されます。
                        </p>
                    </div>
                </div>

                {/* フッター */}
                <div className="mt-6 pt-4 flex justify-end gap-3 border-t border-on-surface/10">
                    <button onClick={onClose} className="py-3 px-6 rounded-xl bg-surface-background hover:bg-on-surface/5 text-on-surface font-bold transition-colors">
                        キャンセル
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="py-3 px-8 rounded-xl bg-brand-primary hover:opacity-90 text-white font-bold shadow-lg shadow-brand-primary/30 transition-all hover:scale-105 active:scale-95"
                    >
                        作成する
                    </button>
                </div>
            </div>
        </div>
    );
};
// ▲▲▲ 新設ここまで ▲▲▲

// (日付フォーマット - 変更なし)
const formatDateForIcon = (dateStr) => {
    if (!dateStr) return { month: '---', day: '--' };
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { month: '---', day: '--' };
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return { month: monthNames[date.getMonth()], day: String(date.getDate()).padStart(2, '0') };
};

// (開催中判定 - 変更なし)
const isEventActive = (event) => {
    const { startDate, startTime } = event.eventConfig;
    if (!startDate || !startTime) return false;
    const start = new Date(`${startDate}T${startTime}`);
    const now = new Date();
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return now >= start && now < end;
};

// (EventCard - 変更なし)
const EventCard = ({ event, onDeleteClick, onClick }) => {
    const floorCount = event.floors ? Object.keys(event.floors).length : 0;
    const displayFloors = (floorCount === 0 && event.timetable) ? '1 Floor' : `${floorCount} Floors`;
    const { month, day } = formatDateForIcon(event.eventConfig.startDate);
    const isActive = isEventActive(event);
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={isActive ? {
                boxShadow: isHovered
                    ? `0 20px 30px -5px rgb(0 0 0 / 0.2), 0 0 35px 5px rgb(var(--color-brand-primary) / 0.4)`
                    : `0 10px 25px -5px rgb(0 0 0 / 0.1), 0 0 20px 0px rgb(var(--color-brand-primary) / 0.25)`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            } : undefined}
            className={`
                group relative bg-surface-container rounded-3xl p-5 
                transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full
                hover:-translate-y-1 border
                ${isActive ? 'border-brand-primary z-10' : 'border-on-surface/10 dark:border-white/5 shadow-lg hover:shadow-2xl'}
            `}
        >
            <div className={`absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'group-hover:opacity-100'}`} />
            <button
                onClick={(e) => { e.stopPropagation(); onDeleteClick(event.id, event.eventConfig.title); }}
                className="absolute top-4 right-4 p-2 text-on-surface-variant/50 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors z-10"
                title="イベントを削除"
            >
                <TrashIcon className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-5 relative z-0 flex-grow">
                <div className={`flex flex-col items-center justify-center w-16 h-16 bg-surface-background rounded-2xl shadow-inner border flex-shrink-0 ${isActive ? 'border-brand-primary text-brand-primary' : 'border-on-surface/10 dark:border-white/5 text-on-surface'}`}>
                    <span className="text-[10px] font-bold tracking-widest uppercase leading-none mb-1 opacity-80">{month}</span>
                    <span className="text-2xl font-bold leading-none font-mono">{day}</span>
                </div>
                <div className="flex-1 min-w-0 pt-1 flex flex-col">
                    {isActive && (
                        <div className="flex items-center gap-2 mb-2 animate-fade-in">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                            </span>
                            <span className="text-[10px] font-bold text-brand-primary tracking-widest uppercase">NOW ON AIR</span>
                        </div>
                    )}
                    <h3 className={`text-xl font-bold truncate transition-colors mb-2 leading-snug ${isActive ? 'text-brand-primary' : 'text-on-surface group-hover:text-brand-primary'}`}>
                        {event.eventConfig.title || '無題のイベント'}
                    </h3>
                    <div className="flex items-center gap-3 text-xs font-bold text-on-surface-variant">
                        <div className="flex items-center gap-1 bg-surface-background px-2 py-1 rounded-md">
                            <LayersIcon className="w-3 h-3" />
                            <span>{displayFloors}</span>
                        </div>
                        {event.eventConfig.startTime && (<span className="font-mono opacity-70">START {event.eventConfig.startTime}</span>)}
                    </div>
                </div>
            </div>
            <div className="mt-5 pt-4 border-t border-on-surface/10 dark:border-white/5 w-full relative z-0">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface-variant/50 group-hover:text-brand-primary transition-colors">編集モードを開く</span>
                    <Link to={`/live/${event.id}`} target="_blank" onClick={(e) => e.stopPropagation()} className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${isActive ? 'bg-brand-primary text-white shadow-md hover:bg-brand-primary/90' : 'bg-surface-background hover:bg-brand-primary hover:text-white text-on-surface-variant'}`}>
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-red-500'} animate-pulse`} />LIVE LINK
                    </Link>
                </div>
            </div>
        </div>
    );
};

// (DashboardPage - ロジック更新)
export const DashboardPage = ({ user, onLogout, theme, toggleTheme, isDevMode }) => {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // ▼▼▼ 追加ステート ▼▼▼
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
    // ▲▲▲ ここまで ▲▲▲

    const [isCreating, setIsCreating] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        setIsLoading(true);
        const q = query(collection(db, "timetables"), where("ownerUid", "==", user.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const userEvents = [];
            querySnapshot.forEach((doc) => { userEvents.push({ id: doc.id, ...doc.data() }); });
            userEvents.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                return dateB - dateA;
            });
            setEvents(userEvents);
            setIsLoading(false);
        }, (error) => { console.error("イベント読込エラー:", error); setIsLoading(false); });
        return () => unsubscribe();
    }, [user]);

    // ▼▼▼ 【修正】 作成ボタンクリック時はモーダルを開くだけ ▼▼▼
    const handleCreateClick = () => {
        setIsSetupModalOpen(true);
    };

    // ▼▼▼ 【修正】 モーダルからのデータを受け取って作成する処理 ▼▼▼
    const handleSetupComplete = async (modalConfig) => {
        if (isCreating || !user) return;

        setIsSetupModalOpen(false); // モーダルを閉じる
        setIsCreating(true); // ローディング開始

        try {
            // 複数フロア設定に応じた初期フロア構成
            const floorsConfig = {};

            if (modalConfig.isMultiFloor) {
                const mainFloorId = `floor_${Date.now()}_main`;
                const subFloorId = `floor_${Date.now()}_sub`;
                floorsConfig[mainFloorId] = { name: "Main Floor", order: 0, timetable: [], vjTimetable: [] };
                floorsConfig[subFloorId] = { name: "Sub Floor", order: 1, timetable: [], vjTimetable: [] };
            } else {
                const defaultFloorId = `floor_${Date.now()}`;
                floorsConfig[defaultFloorId] = { name: "Main Floor", order: 0, timetable: [], vjTimetable: [] };
            }

            const newEventDoc = {
                ownerUid: user.uid,
                createdAt: Timestamp.now(),
                eventConfig: {
                    title: modalConfig.title,
                    startDate: modalConfig.startDate,
                    startTime: modalConfig.startTime,
                    vjFeatureEnabled: modalConfig.vjEnabled
                },
                floors: floorsConfig
            };

            const docRef = await addDoc(collection(db, "timetables"), newEventDoc);

            // 作成完了後、編集ページへ遷移
            navigate(`/edit/${docRef.id}`);

        } catch (error) {
            console.error("作成失敗:", error);
            alert("イベントの作成に失敗しました。");
            setIsCreating(false);
        }
    };
    // ▲▲▲ 修正ここまで ▲▲▲

    const handleDeleteEvent = async () => {
        if (!deleteTarget) return;
        try { await deleteDoc(doc(db, "timetables", deleteTarget.id)); setDeleteTarget(null); } catch (error) { console.error("削除失敗:", error); alert("削除に失敗しました。"); }
    };

    const handleDevDeleteAll = async () => {
        if (!window.confirm("【警告】本当に全てのイベントを削除しますか？")) return;
        try {
            const batch = writeBatch(db);
            events.forEach(event => { const ref = doc(db, "timetables", event.id); batch.delete(ref); });
            await batch.commit();
            alert("全てのイベントを削除しました。");
        } catch (error) { console.error("一括削除失敗:", error); alert("一括削除に失敗しました。"); }
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <>
            <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto animate-fade-in-up pb-32">

                <header className="flex flex-row justify-between items-center mb-12">
                    <div className="flex items-center gap-4">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="User" className="w-12 h-12 rounded-full border-2 border-surface-container shadow-md" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold text-xl shadow-md">
                                {user?.displayName?.[0] || "U"}
                            </div>
                        )}
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold leading-tight text-on-surface">My Events</h1>
                            <p className="text-sm text-on-surface-variant font-medium">{user?.displayName}</p>
                        </div>
                    </div>
                    <button onClick={() => setIsSettingsOpen(true)} className="bg-surface-container hover:bg-surface-container/80 text-on-surface p-3 rounded-full transition-all hover:rotate-90 shadow-sm" title="設定">
                        <SettingsIcon className="w-6 h-6" />
                    </button>
                </header>

                {events.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map(event => (
                            <EventCard
                                key={event.id}
                                event={event}
                                onDeleteClick={(id, title) => setDeleteTarget({ id, title })}
                                onClick={() => navigate(`/edit/${event.id}`)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-70">
                        <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-6">
                            <LayersIcon className="w-10 h-10 text-on-surface-variant" />
                        </div>
                        <p className="text-xl font-bold text-on-surface mb-2">イベントがありません</p>
                        <p className="text-sm text-on-surface-variant">右下のボタンから、最初のイベントを作成しましょう！</p>
                    </div>
                )}

                {/* フローティング作成ボタン */}
                <button
                    // ▼▼▼ 【修正】 ハンドラを handleCreateClick に変更 ▼▼▼
                    onClick={handleCreateClick}
                    disabled={isCreating}
                    className="fixed bottom-8 right-8 z-30 flex items-center gap-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-4 px-6 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-wait group"
                >
                    <PlusIcon className="w-6 h-6 transition-transform group-hover:rotate-90" />
                    <span className="text-lg pr-1 hidden sm:inline">{isCreating ? '作成中...' : '新規イベント'}</span>
                </button>
            </div>

            {/* ▼▼▼ 追加: 新規作成設定モーダル ▼▼▼ */}
            <EventSetupModal
                isOpen={isSetupModalOpen}
                onClose={() => setIsSetupModalOpen(false)}
                onCreate={handleSetupComplete}
            />

            <DashboardSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} theme={theme} toggleTheme={toggleTheme} onLogout={onLogout} />
            <ConfirmModal isOpen={!!deleteTarget} title="イベントを削除" message={`イベント「${deleteTarget?.title || '無題'}」を削除します。復元はできません。本当によろしいですか？`} onConfirm={handleDeleteEvent} onCancel={() => setDeleteTarget(null)} />

            {isDevMode && (
                <>
                    <button onClick={() => setIsDevPanelOpen(prev => !prev)} className="fixed bottom-8 left-8 z-[998] w-12 h-12 bg-zinc-800 text-brand-primary border border-brand-primary rounded-full shadow-lg grid place-items-center hover:bg-zinc-700 transition-colors">
                        <PowerIcon className="w-6 h-6" />
                    </button>
                    {isDevPanelOpen && <DevControls location="dashboard" onClose={() => setIsDevPanelOpen(false)} onDeleteAllEvents={handleDevDeleteAll} onCrashApp={() => { throw new Error("Dashboard Crash Test"); }} />}
                </>
            )}
        </>
    );
};