// [src/components/TimetableEditor.jsx]
import React, { useState, useEffect, useMemo, memo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useTimetable } from '../hooks/useTimetable';
import { ImageEditModal } from './ImageEditModal';
import { FloorManagerModal } from './FloorManagerModal';
import { DjItem } from './DjItem';

import {
    // UI Components
    BaseModal,
    Input,
    Button,
    Toggle,
    Label,
    CustomTimeInput,
    SortableListCard,

    // Icons & Utils
    ConfirmModal,
    PlayIcon,
    PlusIcon,
    CopyIcon,
    ResetIcon,
    SettingsIcon,
    LogOutIcon,
    GodModeIcon,
    VideoIcon,
    CalendarIcon,
    ToastNotification,
    AlertTriangleIcon,
    MoonIcon,

    // Constants & Helpers
    VIVID_COLORS,
    parseDateTime,
    getTodayDateString
} from './common';

// --- VjItem (New SortableListCard) ---
const VjItem = memo(({ vj, onPointerDown, onUpdate, onRemove, isDragging, isPlaying }) => {
    return (
        <SortableListCard
            item={vj}
            isPlaying={isPlaying}
            isDragging={isDragging}
            onPointerDown={onPointerDown}
            onUpdate={onUpdate}
            onRemove={onRemove}
            labelName="VJ Name"
        />
    );
});

// --- VjTimetableManager ---
const VjTimetableManager = ({ vjTimetable, setVjTimetable, eventStartDateStr, eventStartTimeStr, now, eventTotalMinutes, onShowToast }) => {
    const { schedule: vjSchedule, eventStartTimeDate: vjEventStartTimeDate, recalculateTimes: recalculateVjTimes, currentlyPlayingIndex: currentlyPlayingVjIndex } = useTimetable(vjTimetable, eventStartDateStr, eventStartTimeStr, now);
    const { draggedIndex: vjDraggedIndex, overIndex: vjOverIndex, isDragging: vjIsDragging, listContainerRef: vjListContainerRef, handlePointerDown: handleVjPointerDown, getDragStyles: getVjDragStyles } = useDragAndDrop(vjTimetable, setVjTimetable, (newTable) => recalculateVjTimes(newTable, vjEventStartTimeDate), [eventStartDateStr, eventStartTimeStr]);

    const handleAddVj = () => {
        setVjTimetable(prev => {
            const currentTotal = prev.reduce((acc, item) => acc + (parseFloat(item.duration) || 0), 0);
            const remaining = Math.max(0, eventTotalMinutes - currentTotal);
            const DEFAULT_DURATION = 45;
            let newDuration = DEFAULT_DURATION;
            if (remaining < DEFAULT_DURATION) {
                newDuration = remaining;
                if (newDuration < DEFAULT_DURATION) onShowToast(`イベント終了に合わせて ${newDuration}分 に調整しました`);
            }
            return recalculateVjTimes([...prev, { id: Date.now(), name: `VJ ${prev.length + 1}`, duration: newDuration }], vjEventStartTimeDate);
        });
    };

    const handleUpdateVj = (index, field, value) => {
        setVjTimetable(prev => {
            const newVjList = [...prev];
            if (field === 'duration') {
                const othersTotal = newVjList.reduce((acc, item, i) => i === index ? acc : acc + (parseFloat(item.duration) || 0), 0);
                const maxAllowed = Math.max(0, eventTotalMinutes - othersTotal);
                if (value > maxAllowed) { value = maxAllowed; onShowToast(`イベント時間を超えないよう ${value}分 に制限しました`); }
            }
            newVjList[index] = { ...newVjList[index], [field]: value };
            if (field === 'duration') return recalculateVjTimes(newVjList, vjEventStartTimeDate);
            return newVjList;
        });
    };

    const handleRemoveVj = (index) => { setVjTimetable(prev => recalculateVjTimes(prev.filter((_, i) => i !== index), vjEventStartTimeDate)); };

    return (
        <div className="w-full space-y-4">
            <h2 className="text-lg font-bold text-on-surface mb-2 pl-1">VJ タイムテーブル</h2>
            <div className="space-y-3 relative z-10" ref={vjListContainerRef}>
                {vjSchedule.map((vj, index) => (
                    <div key={vj.id} className="dj-list-item" style={getVjDragStyles(index)}>
                        <VjItem vj={vj} onPointerDown={(e) => handleVjPointerDown(e, index)} onUpdate={(field, value) => handleUpdateVj(index, field, value)} onRemove={() => handleRemoveVj(index)} isDragging={vjDraggedIndex === index} isPlaying={currentlyPlayingVjIndex === index} />
                    </div>
                ))}
                <div className="pt-2">
                    {/* Catalog "NewTrigger" Style (Fully matched with DJ button) */}
                    <button
                        onClick={handleAddVj}
                        className="
                            w-full h-24 rounded-2xl 
                            border-2 border-dashed border-on-surface/10 dark:border-white/10
                            bg-transparent hover:bg-brand-primary/[0.03] hover:border-brand-primary/40
                            text-on-surface-variant hover:text-brand-primary 
                            transition-all duration-200 active:scale-[0.98]
                            flex flex-col items-center justify-center gap-2 group
                        "
                    >
                        <div className="w-10 h-10 rounded-full bg-surface-container border border-on-surface/10 dark:border-white/10 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-md group-hover:border-brand-primary/20 transition-all">
                            <PlusIcon className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-sm tracking-wide font-sans">VJを追加</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- SettingsModal (Using BaseModal) ---
const SettingsModal = ({ isOpen, onClose, eventConfig, handleEventConfigChange, handleShare, onResetClick, theme, toggleTheme }) => {
    const isTitleError = !eventConfig.title || eventConfig.title.trim() === '';

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="設定" isScrollable={true} maxWidthClass="max-w-md">
            <div className="space-y-6">
                <section>
                    <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">イベント情報</h3>
                    <div className="space-y-3">
                        <Input value={eventConfig.title || ''} onChange={(e) => handleEventConfigChange('title', e.target.value)} label="タイトル" placeholder="イベントタイトル" isError={isTitleError} error={isTitleError ? "必須" : null} />
                        <div className="space-y-3">
                            <div><Label>日付</Label><Input type="date" value={eventConfig.startDate || ''} onChange={(e) => handleEventConfigChange('startDate', e.target.value)} icon={CalendarIcon} className="font-mono" /></div>
                            <div><Label>開始時間</Label><CustomTimeInput value={eventConfig.startTime} onChange={(v) => handleEventConfigChange('startTime', v)} /></div>
                        </div>
                    </div>
                </section>
                <hr className="border-surface-background" />
                <section>
                    <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">機能 & 表示</h3>
                    <div className="bg-surface-background/50 rounded-xl px-4 py-1 space-y-1">
                        <Toggle checked={eventConfig.vjFeatureEnabled} onChange={() => handleEventConfigChange('vjFeatureEnabled', !eventConfig.vjFeatureEnabled)} label="VJタイムテーブル機能" icon={VideoIcon} />
                        <div className="border-t border-surface-container"></div>
                        <Toggle checked={theme === 'dark'} onChange={toggleTheme} label="ダークモード" icon={theme === 'dark' ? MoonIcon : SunIcon} />
                    </div>
                </section>
                <hr className="border-surface-background" />
                <section>
                    <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">アクション</h3>
                    <div className="space-y-3">
                        <Button onClick={handleShare} variant="secondary" className="w-full justify-center" icon={CopyIcon}>LiveモードのURLをコピー</Button>
                        <Button onClick={onResetClick} variant="danger" className="w-full justify-center" icon={ResetIcon}>タイムテーブルをリセット</Button>
                    </div>
                </section>
            </div>
        </BaseModal>
    );
};

const IntegratedFloorTabs = ({ floors, currentFloorId, onSelectFloor, onAddClick }) => {
    const sortedFloors = useMemo(() => Object.entries(floors).map(([id, data]) => ({ id, ...data })).sort((a, b) => (a.order || 0) - (b.order || 0)), [floors]);
    return (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
            {sortedFloors.map(floor => (
                <button key={floor.id} onClick={() => onSelectFloor(floor.id)} className={`py-2 px-5 rounded-full font-semibold whitespace-nowrap transition-colors ${floor.id === currentFloorId ? 'bg-brand-primary text-white shadow-md' : 'bg-surface-container text-on-surface-variant hover:bg-surface-background'}`}>{floor.name}</button>
            ))}
            <button onClick={onAddClick} className="p-2 rounded-full bg-surface-container hover:bg-brand-primary/20 text-on-surface-variant hover:text-brand-primary transition-colors flex-shrink-0" title="フロアを追加・編集"><PlusIcon className="w-5 h-5" /></button>
        </div>
    );
};

// --- Main Component ---
export const TimetableEditor = ({ eventConfig, setEventConfig, timetable, setTimetable, vjTimetable, setVjTimetable, floors, currentFloorId, onSelectFloor, onFloorsUpdate, setMode, storage, timeOffset, theme, toggleTheme, imagesLoaded }) => {
    const [openColorPickerId, setOpenColorPickerId] = useState(null);
    const [editingDjIndex, setEditingDjIndex] = useState(null);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [now, setNow] = useState(new Date(new Date().getTime() + timeOffset));
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isFloorManagerOpen, setIsFloorManagerOpen] = useState(false);
    const [toast, setToast] = useState({ message: '', visible: false });
    const toastTimerRef = useRef(null);

    useEffect(() => { const timer = setInterval(() => setNow(new Date(new Date().getTime() + timeOffset)), 1000); return () => clearInterval(timer); }, [timeOffset]);

    const { schedule, eventEndTime, eventStartTimeDate, eventEndTimeDate, currentlyPlayingIndex, totalEventDuration, recalculateTimes } = useTimetable(timetable, eventConfig.startDate, eventConfig.startTime, now);
    const eventTotalMinutes = useMemo(() => timetable.reduce((sum, dj) => sum + (parseFloat(dj.duration) || 0), 0), [timetable]);
    const { draggedIndex, overIndex, isDragging, listContainerRef, handlePointerDown, getDragStyles } = useDragAndDrop(timetable, setTimetable, (newTable) => recalculateTimes(newTable, eventStartTimeDate), [eventConfig.startDate, eventConfig.startTime]);

    const showToast = (message) => {
        if (toastTimerRef.current) { clearTimeout(toastTimerRef.current); setToast({ message: '', visible: false }); }
        setTimeout(() => { setToast({ message, visible: true }); toastTimerRef.current = setTimeout(() => { setToast(prev => ({ ...prev, visible: false })); toastTimerRef.current = null; }, 3000); }, 100);
    };

    const handleEventConfigChange = (field, value) => {
        setEventConfig(prev => { const newConfig = { ...prev, [field]: value }; if (field === 'startDate' || field === 'startTime') { const newBaseTime = parseDateTime(newConfig.startDate, newConfig.startTime); setTimetable(prev => recalculateTimes(prev, newBaseTime)); } return newConfig; });
    };

    const handleUpdate = (index, field, value) => {
        setTimetable(prev => { const newTimetable = [...prev]; newTimetable[index] = { ...newTimetable[index], [field]: value }; if (field === 'duration') return recalculateTimes(newTimetable, eventStartTimeDate); return newTimetable; });
    };

    const addNewDj = (isBuffer = false) => {
        setTimetable(prev => { const lastDj = prev[prev.length - 1]; const duration = isBuffer ? 5 : (lastDj ? lastDj.duration : 45); return recalculateTimes([...prev, { id: Date.now(), name: isBuffer ? 'バッファー' : `DJ ${prev.filter(d => !d.isBuffer).length + 1}`, duration, imageUrl: '', color: VIVID_COLORS[Math.floor(Math.random() * VIVID_COLORS.length)], isBuffer }], eventStartTimeDate); });
    };

    const executeReset = () => { setTimetable([]); setVjTimetable([]); setEventConfig({ title: 'My Awesome Event', startDate: getTodayDateString(), startTime: '22:00', vjFeatureEnabled: false }); setIsResetConfirmOpen(false); };
    const handleRemoveDj = (index) => setTimetable(prev => recalculateTimes(prev.filter((_, i) => i !== index), eventStartTimeDate));
    const handleCopyDj = (index) => setTimetable(prev => recalculateTimes([...prev.slice(0, index + 1), { ...prev[index], id: Date.now() }, ...prev.slice(index + 1)], eventStartTimeDate));
    const handleShare = () => { const liveUrl = window.location.href.replace("/edit/", "/live/"); navigator.clipboard.writeText(liveUrl).then(() => alert('LiveモードのURLをコピーしました！'), () => alert('コピーに失敗しました')); };

    const { displayStartTime, displayEndTime } = useMemo(() => ({ displayStartTime: schedule.length > 0 ? schedule[0].startTimeDate : eventStartTimeDate, displayEndTime: schedule.length > 0 ? schedule[schedule.length - 1].endTimeDate : null }), [schedule, eventStartTimeDate]);
    const isOldData = !floors || Object.keys(floors).length === 0;

    return (
        <>
            <ToastNotification message={toast.message} isVisible={toast.visible} className="top-24" />
            <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen animate-fade-in-up">
                <header className="flex flex-row justify-between items-center mb-6 gap-4">
                    <Link to="/" className="flex-shrink-0"><Button variant="secondary" size="icon" icon={LogOutIcon} className="rotate-180 rounded-full" /></Link>
                    <input type="text" value={eventConfig.title || 'DJ Timekeeper Pro'} onChange={(e) => handleEventConfigChange('title', e.target.value)} className="text-2xl sm:text-3xl font-bold text-brand-secondary tracking-wide bg-transparent focus:outline-none focus:bg-surface-container/50 rounded-lg p-2 flex-1 min-w-0" placeholder="イベントタイトル" />
                    <Button onClick={() => setIsSettingsOpen(true)} variant="secondary" icon={SettingsIcon} className="hidden sm:flex">イベントの設定</Button>
                    <Button onClick={() => setIsSettingsOpen(true)} variant="secondary" size="icon" icon={SettingsIcon} className="sm:hidden rounded-full" />
                </header>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <Button onClick={() => timetable.length > 0 && setMode('live')} disabled={timetable.length === 0 || !imagesLoaded} variant="primary" size="lg" className="flex-1" icon={PlayIcon}>{imagesLoaded ? 'Liveモード' : '画像読込中...'}</Button>
                    <div className="bg-surface-container rounded-xl py-2 px-6 flex items-center justify-center gap-4 shadow-sm border border-on-surface/5">
                        <div className="text-center"><p className="text-xs text-on-surface-variant font-bold">START - END</p><p className="text-lg font-mono font-bold">{displayStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {displayEndTime ? displayEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '??:??'}</p></div>
                        {totalEventDuration && (<div className="text-center pl-4 border-l border-on-surface-variant/20"><p className="text-xs text-on-surface-variant font-bold">TOTAL</p><p className="text-lg font-bold">{totalEventDuration}</p></div>)}
                    </div>
                </div>

                {!isOldData && <IntegratedFloorTabs floors={floors} currentFloorId={currentFloorId} onSelectFloor={onSelectFloor} onAddClick={() => setIsFloorManagerOpen(true)} />}

                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="w-full lg:flex-1 space-y-4">
                        <h2 className="text-lg font-bold text-on-surface mb-2 pl-1">DJ タイムテーブル</h2>
                        <div className="space-y-3 relative z-10" ref={listContainerRef}>
                            {schedule.map((dj, index) => (
                                <div key={dj.id} className="dj-list-item" style={getDragStyles(index)}>
                                    <DjItem dj={dj} isPlaying={currentlyPlayingIndex === index} onPointerDown={(e) => handlePointerDown(e, index)} onEditClick={() => setEditingDjIndex(index)} onUpdate={(f, v) => handleUpdate(index, f, v)} onColorPickerToggle={setOpenColorPickerId} onCopy={() => handleCopyDj(index)} onRemove={() => handleRemoveDj(index)} isColorPickerOpen={openColorPickerId === dj.id} openColorPickerId={openColorPickerId} isDragging={draggedIndex === index} />
                                </div>
                            ))}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                {/* Catalog "NewTrigger" Style */}
                                <button
                                    onClick={() => addNewDj(false)}
                                    className="
                                        w-full h-24 rounded-2xl 
                                        border-2 border-dashed border-on-surface/10 dark:border-white/10
                                        bg-transparent hover:bg-brand-primary/[0.03] hover:border-brand-primary/40
                                        text-on-surface-variant hover:text-brand-primary 
                                        transition-all duration-200 active:scale-[0.98]
                                        flex flex-col items-center justify-center gap-2 group
                                    "
                                >
                                    <div className="w-10 h-10 rounded-full bg-surface-container border border-on-surface/10 dark:border-white/10 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-md group-hover:border-brand-primary/20 transition-all">
                                        <PlusIcon className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-sm tracking-wide font-sans">DJを追加</span>
                                </button>

                                <button
                                    onClick={() => addNewDj(true)}
                                    className="
                                        w-full h-24 rounded-2xl 
                                        border-2 border-dashed border-on-surface/10 dark:border-white/10
                                        bg-transparent hover:bg-on-surface/[0.03] hover:border-on-surface/40
                                        text-on-surface-variant hover:text-on-surface 
                                        transition-all duration-200 active:scale-[0.98]
                                        flex flex-col items-center justify-center gap-2 group
                                    "
                                >
                                    <div className="w-10 h-10 rounded-full bg-surface-container border border-on-surface/10 dark:border-white/10 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all">
                                        <GodModeIcon className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-sm tracking-wide font-sans">バッファーを追加</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    {eventConfig.vjFeatureEnabled && <div className="w-full lg:w-1/3 lg:max-w-md space-y-4"><VjTimetableManager vjTimetable={vjTimetable} setVjTimetable={setVjTimetable} eventStartDateStr={eventConfig.startDate} eventStartTimeStr={eventConfig.startTime} now={now} eventTotalMinutes={eventTotalMinutes} onShowToast={showToast} /></div>}
                </div>
            </div>

            <ConfirmModal isOpen={isResetConfirmOpen} title="リセット" message="元に戻せません。よろしいですか？" onConfirm={executeReset} onCancel={() => setIsResetConfirmOpen(false)} />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} eventConfig={eventConfig} handleEventConfigChange={handleEventConfigChange} handleShare={handleShare} onResetClick={() => { setIsSettingsOpen(false); setIsResetConfirmOpen(true); }} theme={theme} toggleTheme={toggleTheme} />
            {!isOldData && <FloorManagerModal isOpen={isFloorManagerOpen} onClose={() => setIsFloorManagerOpen(false)} floors={floors} onSaveFloors={onFloorsUpdate} />}
            {editingDjIndex !== null && <ImageEditModal dj={timetable[editingDjIndex]} onUpdate={(f, v) => handleUpdate(editingDjIndex, f, v)} onClose={() => setEditingDjIndex(null)} storage={storage} />}
        </>
    );
};