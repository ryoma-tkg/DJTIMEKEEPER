// [src/components/DashboardPage.jsx]
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, query, where, onSnapshot, Timestamp, writeBatch, orderBy, limit } from 'firebase/firestore';
import {
    PlusIcon,
    SettingsIcon,
    LayersIcon,
    LogOutIcon,
    PowerIcon,
    Button,
    InfoIcon,
    LoadingScreen as LoadingSpinner,
    ToastNotification,
    TrashIcon,
    AlertTriangleIcon,
    UserIcon,
    PlanTag // ★ 追加: commonからインポート
} from './common';
import { DevControls } from './DevControls';
import { ConfirmModal } from './common';

import { EventCard } from './dashboard/EventCard';
import { EventSetupModal } from './dashboard/EventSetupModal';
import { DashboardSettingsModal } from './dashboard/DashboardSettingsModal';

// ★ 以前定義した const PlanTag = ... は削除してください

export const DashboardPage = ({ user, onLogout, theme, toggleTheme, isDevMode, isPerfMonitorVisible, onTogglePerfMonitor }) => {
    // ... (State定義などは変更なし) ...
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    const [viewLimit, setViewLimit] = useState(100);
    const [userProfile, setUserProfile] = useState(null);
    const [viewingTarget, setViewingTarget] = useState(null);

    const [toast, setToast] = useState({ message: '', visible: false });
    const toastTimerRef = useRef(null);

    const navigate = useNavigate();

    // ゲスト判定
    const isGuest = user?.isAnonymous;

    // ★ planBadge の useMemo も削除してOKです (PlanTag内でロジック完結したため)

    const showToast = (message) => {
        if (toastTimerRef.current) { clearTimeout(toastTimerRef.current); setToast({ message: '', visible: false }); }
        setTimeout(() => { setToast({ message, visible: true }); toastTimerRef.current = setTimeout(() => { setToast(prev => ({ ...prev, visible: false })); toastTimerRef.current = null; }, 3000); }, 100);
    };

    // ... (useEffect や ハンドラ関数は変更なし) ...
    // イベント一覧の読み込み
    useEffect(() => {
        if (!user) return;
        setIsLoading(true);
        const targetUid = viewingTarget ? viewingTarget.uid : user.uid;

        const q = query(
            collection(db, "timetables"),
            where("ownerUid", "==", targetUid),
            orderBy("createdAt", "desc"),
            limit(viewLimit)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const userEvents = [];
            querySnapshot.forEach((doc) => { userEvents.push({ id: doc.id, ...doc.data() }); });
            setEvents(userEvents);
            setIsLoading(false);
        }, (error) => {
            console.error("イベント読込エラー:", error);
            if (viewingTarget) alert(`読み込みエラー: ${error.message}\nFirestoreセキュリティルールにより拒否された可能性があります。`);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user, viewLimit, viewingTarget]);

    // ユーザープロファイルの読み込み
    useEffect(() => {
        if (!user) return;
        const userDocRef = doc(db, "users", user.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => { if (docSnap.exists()) { setUserProfile(docSnap.data()); } });
        return () => unsubscribe();
    }, [user]);

    // ゲスト自動誘導ロジック
    useEffect(() => {
        if (!isLoading && user?.isAnonymous && events.length === 0 && !isCreating && !viewingTarget) {
            const timer = setTimeout(() => { setIsSetupModalOpen(true); }, 500);
            return () => clearTimeout(timer);
        }
    }, [isLoading, user, events.length, isCreating, viewingTarget]);

    const { nowEvents, upcomingEvents, pastEvents } = useMemo(() => {
        const now = new Date();
        const nowList = [], upcomingList = [], pastList = [];
        events.forEach(event => {
            const { startDate, startTime } = event.eventConfig || {};
            if (!startDate || !startTime) { pastList.push(event); return; }
            const start = new Date(`${startDate}T${startTime}`);
            const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
            if (now >= start && now < end) nowList.push(event);
            else if (now < start) upcomingList.push(event);
            else pastList.push(event);
        });
        upcomingList.sort((a, b) => new Date(`${a.eventConfig.startDate}T${a.eventConfig.startTime}`) - new Date(`${b.eventConfig.startDate}T${b.eventConfig.startTime}`));
        pastList.sort((a, b) => new Date(`${b.eventConfig.startDate}T${b.eventConfig.startTime}`) - new Date(`${a.eventConfig.startDate}T${a.eventConfig.startTime}`));
        return { nowEvents: nowList, upcomingEvents: upcomingList, pastEvents: pastList };
    }, [events]);

    const handleCreateClick = () => {
        const role = userProfile?.role || 'free';
        const limit = isGuest ? 1 : (role === 'admin' || role === 'pro' ? Infinity : 3);

        if (events.length >= limit) {
            const message = isGuest
                ? "ゲストはイベントを1つまでしか作成できません。"
                : "Freeプランの上限(3件)に達しました。Proで無制限に！";
            showToast(message);
            return;
        }
        setIsSetupModalOpen(true);
    };

    const handleSetupComplete = async (modalConfig) => {
        if (isCreating || !user) return;
        if (viewingTarget) { if (!window.confirm("現在サポートモード中です。新規イベントは「あなた（管理者）」のアカウントで作成されます。よろしいですか？")) return; }
        setIsSetupModalOpen(false); setIsCreating(true);
        try {
            const floorsConfig = {};
            if (modalConfig.isMultiFloor) {
                const mainFloorId = `floor_${Date.now()}_main`; const subFloorId = `floor_${Date.now()}_sub`;
                floorsConfig[mainFloorId] = { name: "Main Floor", order: 0, timetable: [], vjTimetable: [] };
                floorsConfig[subFloorId] = { name: "Sub Floor", order: 1, timetable: [], vjTimetable: [] };
            } else { const defaultFloorId = `floor_${Date.now()}`; floorsConfig[defaultFloorId] = { name: "Main Floor", order: 0, timetable: [], vjTimetable: [] }; }

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

            if (user.isAnonymous) {
                const expirationDate = new Date();
                expirationDate.setHours(expirationDate.getHours() + 36);
                newEventDoc.expireAt = Timestamp.fromDate(expirationDate);
            }

            const docRef = await addDoc(collection(db, "timetables"), newEventDoc);
            navigate(`/edit/${docRef.id}`);
        } catch (error) { console.error("作成失敗:", error); alert("イベントの作成に失敗しました。"); setIsCreating(false); }
    };

    const handleDeleteEvent = async () => {
        if (!deleteTarget) return;
        if (viewingTarget) { alert("サポートモード（閲覧中）のため、イベントの削除はできません。"); setDeleteTarget(null); return; }
        try { await deleteDoc(doc(db, "timetables", deleteTarget.id)); setDeleteTarget(null); } catch (error) { console.error("削除失敗:", error); alert("削除に失敗しました。"); }
    };

    const handleDevDeleteAll = async () => {
        if (!window.confirm("全削除しますか？")) return;
        try { const batch = writeBatch(db); events.forEach(e => batch.delete(doc(db, "timetables", e.id))); await batch.commit(); alert("完了"); } catch (e) { alert("失敗"); }
    };

    const handleViewUser = (targetUser) => {
        if (targetUser.id === user.uid) { setViewingTarget(null); } else { setViewingTarget({ uid: targetUser.id, displayName: targetUser.displayName, email: targetUser.email }); }
    };

    const handleGuestLogout = () => {
        if (window.confirm("【警告】ゲストモードを終了しますか？\n\n現在のデータはすべて削除され、二度とアクセスできなくなります。\n\nよろしければ「OK」を押してください。")) {
            onLogout();
            setIsAccountMenuOpen(false);
        }
    };

    if (isLoading && events.length === 0) return <LoadingSpinner />;

    return (
        <>
            <ToastNotification message={toast.message} isVisible={toast.visible} className="top-24" />

            {viewingTarget && (<div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between sticky top-0 z-50 shadow-md"><div className="flex items-center gap-2 text-sm font-bold"><InfoIcon className="w-5 h-5" /><span>閲覧中: {viewingTarget.displayName} ({viewingTarget.email})</span></div><button onClick={() => setViewingTarget(null)} className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-full transition-colors font-bold">終了して戻る</button></div>)}
            <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto pb-32">
                <header className="flex flex-row justify-between items-center mb-12 animate-fade-in-up relative z-30 gap-4">
                    <div className="flex flex-col items-start select-none flex-shrink-0"><h1 className="text-xl md:text-2xl font-bold tracking-widest text-on-surface">DJ TIMEKEEPER <span className="text-brand-primary">PRO</span></h1><span className="text-[10px] font-bold tracking-[0.3em] text-on-surface-variant uppercase">Dashboard</span></div>
                    <div className="flex items-center gap-3 md:gap-5">

                        {/* ▼▼▼ 修正: PlanTag を使用 ▼▼▼ */}
                        <div className="hidden sp:block">
                            <PlanTag role={userProfile?.role} isGuest={isGuest} />
                        </div>

                        <div className="relative">
                            <button onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)} className="flex items-center gap-3 group focus:outline-none" title="アカウントメニューを開く">
                                {user?.photoURL ?
                                    <img src={user.photoURL} alt="User" className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-surface-container shadow-md group-hover:scale-105 transition-transform group-hover:shadow-lg object-cover" />
                                    : <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform group-hover:shadow-lg ${isGuest ? 'bg-amber-500' : 'bg-brand-primary'}`}>{user?.displayName?.[0] || "U"}</div>
                                }
                            </button>

                            {isAccountMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsAccountMenuOpen(false)} />
                                    <div className="absolute top-full right-0 mt-3 w-72 bg-surface-container rounded-2xl shadow-2xl border border-on-surface/10 p-2 z-50 animate-fade-in origin-top-right">
                                        <div className="px-4 py-3 border-b border-on-surface/10 mb-2">
                                            <div className="flex items-center justify-between mb-1">
                                                {/* 極小画面向けプラン表示 */}
                                                <div className="sp:hidden mb-1">
                                                    <PlanTag role={userProfile?.role} isGuest={isGuest} />
                                                </div>
                                            </div>
                                            <p className="font-bold text-sm text-on-surface truncate flex items-center gap-2">
                                                {isGuest && <AlertTriangleIcon className="w-4 h-4 text-amber-500" />}
                                                {userProfile?.displayName || user?.displayName || 'Guest User'}
                                            </p>
                                            <p className="text-xs text-on-surface-variant truncate opacity-70">{isGuest ? 'ゲストモード利用中' : user?.email}</p>
                                        </div>

                                        <button onClick={() => { setIsSettingsOpen(true); setIsAccountMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-background transition-colors text-left text-on-surface">
                                            <SettingsIcon className="w-5 h-5 text-on-surface-variant" />
                                            <span className="font-bold text-sm">アプリ設定</span>
                                        </button>

                                        {isGuest ? (
                                            <button onClick={handleGuestLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-colors text-left mt-2 border border-red-500/10">
                                                <TrashIcon className="w-5 h-5" />
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm">ゲストを終了</span>
                                                    <span className="text-[10px] opacity-80">※データは削除されます</span>
                                                </div>
                                            </button>
                                        ) : (
                                            <button onClick={() => { onLogout(); setIsAccountMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors text-left mt-1">
                                                <LogOutIcon className="w-5 h-5" />
                                                <span className="font-bold text-sm">ログアウト</span>
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>
                {/* ... (以下のイベント一覧表示部分は変更なし) ... */}
                {events.length > 0 ? (
                    <div className="space-y-12">
                        {nowEvents.length > 0 && (<section className="animate-fade-in-up opacity-0"><div className="flex items-center gap-2 mb-4 text-red-500"><span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span><h2 className="text-lg font-bold tracking-widest">NOW ON AIR</h2></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{nowEvents.map(event => <EventCard key={event.id} event={event} onDeleteClick={(id, title) => setDeleteTarget({ id, title })} onClick={() => navigate(`/edit/${event.id}`)} />)}</div></section>)}
                        {upcomingEvents.length > 0 && (<section className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.1s' }}><h2 className="text-lg font-bold text-on-surface-variant mb-4 tracking-widest flex items-center gap-2"><span className="text-brand-primary">●</span> UPCOMING</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{upcomingEvents.map(event => <EventCard key={event.id} event={event} onDeleteClick={(id, title) => setDeleteTarget({ id, title })} onClick={() => navigate(`/edit/${event.id}`)} />)}</div></section>)}
                        {pastEvents.length > 0 && (<section className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s' }}><h2 className="text-lg font-bold text-on-surface-variant/50 mb-4 tracking-widest">ARCHIVE</h2><div className="transition-opacity duration-300"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{pastEvents.map(event => <EventCard key={event.id} event={event} onDeleteClick={(id, title) => setDeleteTarget({ id, title })} onClick={() => navigate(`/edit/${event.id}`)} />)}</div></div></section>)}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-70"><div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-6"><LayersIcon className="w-10 h-10 text-on-surface-variant" /></div><p className="text-xl font-bold text-on-surface mb-2">イベントがありません</p><p className="text-sm text-on-surface-variant">{viewingTarget ? 'このユーザーはまだイベントを作成していません。' : '右下のボタンから、最初のイベントを作成しましょう！'}</p></div>
                )}

                <div className="fixed bottom-8 right-8 z-30">
                    <Button onClick={handleCreateClick} disabled={isCreating || !!viewingTarget} variant="primary" size="lg" icon={PlusIcon} className="shadow-2xl">{isCreating ? '作成中...' : '新規イベント'}</Button>
                </div>

            </div>
            <EventSetupModal isOpen={isSetupModalOpen} onClose={() => setIsSetupModalOpen(false)} onCreate={handleSetupComplete} defaultPreferences={userProfile?.preferences} user={user} userProfile={userProfile} />
            <DashboardSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} theme={theme} toggleTheme={toggleTheme} onLogout={onLogout} user={user} userProfile={userProfile} onViewUser={handleViewUser} />
            <ConfirmModal isOpen={!!deleteTarget} title="イベントを削除" message={`イベント「${deleteTarget?.title || '無題'}」を削除します。復元はできません。本当によろしいですか？`} onConfirm={handleDeleteEvent} onCancel={() => setDeleteTarget(null)} />
            {isDevMode && (<><button onClick={() => setIsDevPanelOpen(p => !p)} className="fixed bottom-8 left-8 z-[998] w-12 h-12 bg-zinc-800 text-brand-primary border border-brand-primary rounded-full shadow-lg grid place-items-center hover:bg-zinc-700 transition-colors"><PowerIcon className="w-6 h-6" /></button>{isDevPanelOpen && <DevControls location="dashboard" onClose={() => setIsDevPanelOpen(false)} onDeleteAllEvents={handleDevDeleteAll} onCrashApp={() => { throw new Error("Dashboard Crash Test"); }} isPerfMonitorVisible={isPerfMonitorVisible} onTogglePerfMonitor={onTogglePerfMonitor} />}</>)}
        </>
    );
};