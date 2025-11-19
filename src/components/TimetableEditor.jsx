// [src/components/TimetableEditor.jsx]
import React, { useState, useEffect, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useTimetable } from '../hooks/useTimetable';
import { ImageEditModal } from './ImageEditModal';
import { FloorManagerModal } from './FloorManagerModal';
import { DjItem } from './DjItem';
import {
    CustomTimeInput,
    ConfirmModal,
    PlayIcon,
    PlusIcon,
    CopyIcon,
    ResetIcon,
    SettingsIcon,
    XIcon,
    SunIcon,
    MoonIcon,
    TrashIcon,
    GripIcon,
    VIVID_COLORS,
    CalendarIcon,
    parseDateTime,
    getTodayDateString,
    LogOutIcon,
    GodModeIcon,
    ToggleSwitch,
    VideoIcon,
} from './common';

// (VjItem - 変更なし)
const VjItem = memo(({ vj, onPointerDown, onUpdate, onRemove, isDragging, isPlaying }) => {
    const draggingClass = isDragging ? 'dragging-item' : '';
    const ringClass = isPlaying ? 'ring-2 shadow-[0_0_12px_var(--tw-ring-color)]' : 'ring-1 ring-zinc-700';

    return (
        <div
            // ▼▼▼ 【修正】 transition-all duration-200 ease-out を追加 ▼▼▼
            className={`bg-surface-container rounded-2xl flex items-stretch gap-4 p-4 ${draggingClass} ${ringClass} transition-all duration-200 ease-out`}
            style={{ '--tw-ring-color': isPlaying ? 'rgb(var(--color-brand-primary))' : 'transparent' }}
        >
            <div className="cursor-grab touch-none p-3 -m-3 self-stretch flex items-center" onPointerDown={onPointerDown}><GripIcon className="w-6 h-6 text-on-surface-variant shrink-0" /></div>
            {/* ... (以下変更なし) ... */}
            <div className="shrink-0 self-center" />
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex flex-col"><label className="text-xs text-on-surface-variant mb-1">VJ Name</label><input type="text" value={vj.name} onChange={(e) => onUpdate('name', e.target.value)} className="bg-surface-background text-on-surface p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-primary" /></div>
                <div className="flex flex-col"><label className="text-xs text-on-surface-variant mb-1">Duration (min)</label><input type="number" value={vj.duration} step="0.1" onChange={(e) => onUpdate('duration', parseFloat(e.target.value) || 0)} className="bg-surface-background text-on-surface p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-primary font-bold text-base" /></div>
                <div className="flex flex-col md:col-span-2"><label className="text-xs text-on-surface-variant mb-1">Time Slot (Auto)</label><div className="bg-surface-background/50 p-2 rounded-lg w-full text-center font-semibold text-on-surface-variant font-mono"><span>{vj.startTime}</span><span className="mx-2">-</span><span>{vj.endTime}</span></div></div>
            </div>
            <div className="flex flex-col gap-2 shrink-0 self-stretch justify-center"><div className="w-9 h-9" /><div className="w-9 h-9" /><button onClick={onRemove} className="text-on-surface-variant hover:text-red-500 p-2 rounded-full transition-colors"><TrashIcon className="w-5 h-5" /></button></div>
        </div>
    );
});
// (VjTimetableManager - リストコンテナに余白調整を適用)
const VjTimetableManager = ({ vjTimetable, setVjTimetable, eventStartDateStr, eventStartTimeStr, now }) => {
    const { schedule: vjSchedule, eventStartTimeDate: vjEventStartTimeDate, recalculateTimes: recalculateVjTimes, currentlyPlayingIndex: currentlyPlayingVjIndex } = useTimetable(vjTimetable, eventStartDateStr, eventStartTimeStr, now);
    const { draggedIndex: vjDraggedIndex, overIndex: vjOverIndex, isDragging: vjIsDragging, listContainerRef: vjListContainerRef, handlePointerDown: handleVjPointerDown, getDragStyles: getVjDragStyles } = useDragAndDrop(vjTimetable, setVjTimetable, (newTable) => recalculateVjTimes(newTable, vjEventStartTimeDate), [eventStartDateStr, eventStartTimeStr]);

    const handleAddVj = () => { setVjTimetable(prev => recalculateVjTimes([...prev, { id: Date.now(), name: `VJ ${vjTimetable.length + 1}`, duration: 60 }], vjEventStartTimeDate)); };
    const handleUpdateVj = (index, field, value) => { setVjTimetable(prev => { const newVjList = [...prev]; newVjList[index] = { ...newVjList[index], [field]: value }; if (field === 'duration') return recalculateVjTimes(newVjList, vjEventStartTimeDate); return newVjList; }); };
    const handleRemoveVj = (index) => { setVjTimetable(prev => recalculateVjTimes(prev.filter((_, i) => i !== index), vjEventStartTimeDate)); };

    return (
        <div className="w-full space-y-4">
            <h2 className="text-xl font-bold text-on-surface mb-2">VJ タイムテーブル</h2>
            <div
                // ▼▼▼ 【修正】 VJリストにもネガティブマージンとパディングを適用して、シャドウが見切れないようにする ▼▼▼
                className="space-y-4 -mx-4 px-4 py-4 relative z-10"
                ref={vjListContainerRef}
            >
                {vjSchedule.map((vj, index) => (
                    <div key={vj.id} className={`dj-list-item ${vjIsDragging && index === vjOverIndex ? 'drop-indicator-before' : ''}`} style={getVjDragStyles(index)}>
                        <VjItem vj={vj} onPointerDown={(e) => handleVjPointerDown(e, index)} onUpdate={(field, value) => handleUpdateVj(index, field, value)} onRemove={() => handleRemoveVj(index)} isDragging={vjDraggedIndex === index} isPlaying={currentlyPlayingVjIndex === index} />
                    </div>
                ))}

                <div className="pt-2">
                    <button
                        onClick={handleAddVj}
                        className="w-full h-24 rounded-2xl border-2 border-dashed border-surface-container hover:border-brand-primary hover:bg-brand-primary/5 text-on-surface-variant hover:text-brand-primary transition-all duration-200 flex items-center justify-center gap-2 group"
                    >
                        <div className="w-10 h-10 rounded-full bg-surface-container group-hover:bg-brand-primary group-hover:text-white flex items-center justify-center transition-colors">
                            <PlusIcon className="w-6 h-6" />
                        </div>
                        <span className="font-bold">VJを追加</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// (SettingsModal - 変更なし)
const SettingsModal = ({ isOpen, onClose, eventConfig, handleEventConfigChange, handleShare, onResetClick, theme, toggleTheme }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-surface-container rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-modal-in flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-2 flex-shrink-0 relative z-20">
                    <h2 className="text-2xl font-bold">設定</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-background text-on-surface-variant hover:text-on-surface"><XIcon className="w-6 h-6" /></button>
                </div>

                {/* SettingsModal内の修正は前回の回答ですでに提案済みですが、念のためここにも適用状態を含めておきます */}
                <div className="overflow-y-auto flex-grow -mx-6 px-6 py-4 space-y-6 relative z-10 scrollbar-thin scrollbar-thumb-on-surface-variant/20">
                    {/* イベント設定セクション */}
                    <section>
                        <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">イベント情報</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-on-surface-variant mb-1 block font-semibold">タイトル</label>
                                <input type="text" value={eventConfig.title || ''} onChange={(e) => handleEventConfigChange('title', e.target.value)} className="bg-surface-background text-on-surface p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-brand-primary font-semibold" placeholder="イベントタイトル" />
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-on-surface-variant mb-1 block font-semibold">日付</label>
                                    <div className="relative">
                                        <input type="date" value={eventConfig.startDate || ''} onChange={(e) => handleEventConfigChange('startDate', e.target.value)} className="bg-surface-background text-on-surface p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-brand-primary font-mono font-bold text-sm appearance-none" />
                                        <CalendarIcon className="w-4 h-4 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-on-surface-variant mb-1 block font-semibold">開始時間</label>
                                    <CustomTimeInput value={eventConfig.startTime} onChange={(v) => handleEventConfigChange('startTime', v)} />
                                </div>
                            </div>
                        </div>
                    </section>

                    <hr className="border-surface-background" />

                    {/* 機能設定セクション */}
                    <section>
                        <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">機能 & 表示</h3>
                        <div className="bg-surface-background/50 rounded-xl px-4 py-1 space-y-1">
                            <ToggleSwitch
                                checked={eventConfig.vjFeatureEnabled}
                                onChange={() => handleEventConfigChange('vjFeatureEnabled', !eventConfig.vjFeatureEnabled)}
                                label="VJタイムテーブル機能"
                                icon={VideoIcon} // importが必要
                            />
                            <div className="border-t border-surface-container"></div>
                            <ToggleSwitch
                                checked={theme === 'dark'}
                                onChange={toggleTheme}
                                label="ダークモード"
                                icon={theme === 'dark' ? MoonIcon : SunIcon}
                            />
                        </div>
                    </section>

                    <hr className="border-surface-background" />

                    {/* アクションセクション */}
                    <section>
                        <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">アクション</h3>
                        <div className="space-y-3">
                            <button onClick={handleShare} className="w-full flex items-center justify-center gap-2 bg-surface-background hover:bg-surface-background/80 text-on-surface font-bold py-3 px-4 rounded-xl transition-colors">
                                <CopyIcon className="w-5 h-5" /> <span>LiveモードのURLをコピー</span>
                            </button>
                            <button onClick={onResetClick} className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-3 px-4 rounded-xl transition-colors">
                                <ResetIcon className="w-5 h-5" /><span>タイムテーブルをリセット</span>
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

// (formatDateTime - 変更なし)
const formatDateTime = (date) => {
    if (!date || !(date instanceof Date)) return '??:??';
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// (IntegratedFloorTabs - 変更なし)
const IntegratedFloorTabs = ({ floors, currentFloorId, onSelectFloor, onAddClick }) => {
    const sortedFloors = useMemo(() => {
        return Object.entries(floors)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [floors]);

    return (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {sortedFloors.map(floor => {
                const isActive = floor.id === currentFloorId;
                return (
                    <button
                        key={floor.id}
                        onClick={() => onSelectFloor(floor.id)}
                        className={`
                            py-2 px-5 rounded-full font-semibold whitespace-nowrap transition-colors
                            ${isActive
                                ? 'bg-brand-primary text-white shadow-md'
                                : 'bg-surface-container text-on-surface-variant hover:bg-surface-background'
                            }
                        `}
                    >
                        {floor.name}
                    </button>
                );
            })}
            <button
                onClick={onAddClick}
                className="p-2 rounded-full bg-surface-container hover:bg-brand-primary/20 text-on-surface-variant hover:text-brand-primary transition-colors flex-shrink-0"
                title="フロアを追加・編集"
            >
                <PlusIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

// --- Main Component ---
export const TimetableEditor = ({
    eventConfig, setEventConfig,
    timetable, setTimetable,
    vjTimetable, setVjTimetable,
    floors, currentFloorId, onSelectFloor, onFloorsUpdate,
    setMode, storage, timeOffset,
    theme, toggleTheme, imagesLoaded
}) => {

    const [openColorPickerId, setOpenColorPickerId] = useState(null);
    const [editingDjIndex, setEditingDjIndex] = useState(null);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [now, setNow] = useState(new Date(new Date().getTime() + timeOffset));
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isFloorManagerOpen, setIsFloorManagerOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date(new Date().getTime() + timeOffset)), 1000);
        return () => clearInterval(timer);
    }, [timeOffset]);

    const { schedule, eventEndTime, eventStartTimeDate, eventEndTimeDate, currentlyPlayingIndex, totalEventDuration, recalculateTimes } = useTimetable(timetable, eventConfig.startDate, eventConfig.startTime, now);
    const { draggedIndex, overIndex, isDragging, listContainerRef, handlePointerDown, getDragStyles } = useDragAndDrop(timetable, setTimetable, (newTable) => recalculateTimes(newTable, eventStartTimeDate), [eventConfig.startDate, eventConfig.startTime]);

    const handleEventConfigChange = (field, value) => {
        setEventConfig(prev => {
            const newConfig = { ...prev, [field]: value };
            if (field === 'startDate' || field === 'startTime') {
                const newBaseTime = parseDateTime(newConfig.startDate, newConfig.startTime);
                setTimetable(prev => recalculateTimes(prev, newBaseTime));
            }
            return newConfig;
        });
    };

    const handleUpdate = (index, field, value) => {
        setTimetable(prev => {
            const newTimetable = [...prev];
            newTimetable[index] = { ...newTimetable[index], [field]: value };
            if (field === 'duration') return recalculateTimes(newTimetable, eventStartTimeDate);
            return newTimetable;
        });
    };

    const addNewDj = (isBuffer = false) => {
        setTimetable(prev => {
            const lastDj = prev[prev.length - 1];
            const duration = isBuffer ? 5 : (lastDj ? lastDj.duration : 60);
            return recalculateTimes([...prev, { id: Date.now(), name: isBuffer ? 'バッファー' : `DJ ${prev.filter(d => !d.isBuffer).length + 1}`, duration, imageUrl: '', color: VIVID_COLORS[Math.floor(Math.random() * VIVID_COLORS.length)], isBuffer }], eventStartTimeDate);
        });
    };

    const executeReset = () => {
        setTimetable([]); setVjTimetable([]);
        setEventConfig({ title: 'My Awesome Event', startDate: getTodayDateString(), startTime: '22:00', vjFeatureEnabled: false });
        setIsResetConfirmOpen(false);
    };
    const handleRemoveDj = (index) => setTimetable(prev => recalculateTimes(prev.filter((_, i) => i !== index), eventStartTimeDate));
    const handleCopyDj = (index) => setTimetable(prev => recalculateTimes([...prev.slice(0, index + 1), { ...prev[index], id: Date.now() }, ...prev.slice(index + 1)], eventStartTimeDate));
    const handleShare = () => {
        const liveUrl = window.location.href.replace("/edit/", "/live/");
        navigator.clipboard.writeText(liveUrl).then(() => alert('LiveモードのURLをコピーしました！'), () => alert('コピーに失敗しました'));
    };

    const { displayStartTime, displayEndTime } = useMemo(() => ({
        displayStartTime: schedule.length > 0 ? schedule[0].startTimeDate : eventStartTimeDate,
        displayEndTime: schedule.length > 0 ? schedule[schedule.length - 1].endTimeDate : null
    }), [schedule, eventStartTimeDate]);

    const isOldData = !floors || Object.keys(floors).length === 0;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
            <ConfirmModal isOpen={isResetConfirmOpen} title="リセット" message="元に戻せません。よろしいですか？" onConfirm={executeReset} onCancel={() => setIsResetConfirmOpen(false)} />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} eventConfig={eventConfig} handleEventConfigChange={handleEventConfigChange} handleShare={handleShare} onResetClick={() => { setIsSettingsOpen(false); setIsResetConfirmOpen(true); }} theme={theme} toggleTheme={toggleTheme} />

            {!isOldData && <FloorManagerModal isOpen={isFloorManagerOpen} onClose={() => setIsFloorManagerOpen(false)} floors={floors} onSaveFloors={onFloorsUpdate} />}
            {editingDjIndex !== null && <ImageEditModal dj={timetable[editingDjIndex]} onUpdate={(f, v) => handleUpdate(editingDjIndex, f, v)} onClose={() => setEditingDjIndex(null)} storage={storage} />}

            <header className="flex flex-row justify-between items-center mb-6 gap-4">
                <Link to="/" className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-surface-container hover:bg-zinc-700 text-on-surface font-semibold rounded-full transition-colors duration-200" title="ダッシュボードへ戻る">
                    <LogOutIcon className="w-5 h-5 rotate-180" />
                </Link>

                <input type="text" value={eventConfig.title || 'DJ Timekeeper Pro'} onChange={(e) => handleEventConfigChange('title', e.target.value)} className="text-2xl sm:text-3xl font-bold text-brand-secondary tracking-wide bg-transparent focus:outline-none focus:bg-surface-container/50 rounded-lg p-2 flex-1 min-w-0" placeholder="イベントタイトル" />

                <button onClick={() => setIsSettingsOpen(true)} className="flex items-center justify-center gap-2 py-3 px-5 bg-surface-container hover:bg-zinc-700 text-on-surface font-semibold rounded-full transition-colors">
                    <SettingsIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">設定</span>
                </button>
            </header>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button onClick={() => timetable.length > 0 && setMode('live')} disabled={timetable.length === 0 || !imagesLoaded} className="flex-1 flex items-center justify-center bg-brand-primary hover:opacity-90 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-opacity duration-200 shadow-lg">
                    <PlayIcon className="w-5 h-5 mr-2" /><span>{imagesLoaded ? 'Liveモード' : '画像読込中...'}</span>
                </button>

                <div className="bg-surface-container rounded-xl py-2 px-6 flex items-center justify-center gap-4">
                    <div className="text-center">
                        <p className="text-xs text-on-surface-variant font-bold">START - END</p>
                        <p className="text-lg font-mono font-bold">{formatDateTime(displayStartTime).split(' ')[1]} - {displayEndTime ? formatDateTime(displayEndTime).split(' ')[1] : '??:??'}</p>
                    </div>
                    {totalEventDuration && (
                        <div className="text-center pl-4 border-l border-on-surface-variant/20">
                            <p className="text-xs text-on-surface-variant font-bold">TOTAL</p>
                            <p className="text-lg font-bold">{totalEventDuration}</p>
                        </div>
                    )}
                </div>
            </div>

            {!isOldData && (
                <IntegratedFloorTabs
                    floors={floors}
                    currentFloorId={currentFloorId}
                    onSelectFloor={onSelectFloor}
                    onAddClick={() => setIsFloorManagerOpen(true)}
                />
            )}

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:flex-1 space-y-4">
                    <h2 className="text-xl font-bold text-on-surface mb-2">DJ タイムテーブル</h2>
                    <div
                        // ▼▼▼ 【修正】 DJリストにもネガティブマージンとパディングを適用して、シャドウが見切れないようにする ▼▼▼
                        className="space-y-4 -mx-4 px-4 py-4 relative z-10"
                        ref={listContainerRef}
                    >
                        {schedule.map((dj, index) => (
                            <div key={dj.id} className={`dj-list-item ${isDragging && index === overIndex ? 'drop-indicator-before' : ''}`} style={getDragStyles(index)}>
                                <DjItem dj={dj} isPlaying={currentlyPlayingIndex === index} onPointerDown={(e) => handlePointerDown(e, index)} onEditClick={() => setEditingDjIndex(index)} onUpdate={(f, v) => handleUpdate(index, f, v)} onColorPickerToggle={setOpenColorPickerId} onCopy={() => handleCopyDj(index)} onRemove={() => handleRemoveDj(index)} isColorPickerOpen={openColorPickerId === dj.id} openColorPickerId={openColorPickerId} isDragging={draggedIndex === index} />
                            </div>
                        ))}

                        {/* 追加ボタンエリア（プレースホルダー風） */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <button
                                onClick={() => addNewDj(false)}
                                className="w-full h-24 rounded-2xl border-2 border-dashed border-surface-container hover:border-brand-primary hover:bg-brand-primary/5 text-on-surface-variant hover:text-brand-primary transition-all duration-200 flex items-center justify-center gap-2 group"
                            >
                                <div className="w-10 h-10 rounded-full bg-surface-container group-hover:bg-brand-primary group-hover:text-white flex items-center justify-center transition-colors">
                                    <PlusIcon className="w-6 h-6" />
                                </div>
                                <span className="font-bold">DJを追加</span>
                            </button>

                            <button
                                onClick={() => addNewDj(true)}
                                className="w-full h-24 rounded-2xl border-2 border-dashed border-surface-container hover:border-on-surface-variant hover:bg-on-surface-variant/5 text-on-surface-variant hover:text-on-surface transition-all duration-200 flex items-center justify-center gap-2 group"
                            >
                                <div className="w-10 h-10 rounded-full bg-surface-container group-hover:bg-on-surface-variant group-hover:text-surface-background flex items-center justify-center transition-colors">
                                    <GodModeIcon className="w-5 h-5" />
                                </div>
                                <span className="font-bold">バッファーを追加</span>
                            </button>
                        </div>
                    </div>
                </div>
                {eventConfig.vjFeatureEnabled && <div className="w-full lg:w-1/3 lg:max-w-md space-y-4"><VjTimetableManager vjTimetable={vjTimetable} setVjTimetable={setVjTimetable} eventStartDateStr={eventConfig.startDate} eventStartTimeStr={eventConfig.startTime} now={now} /></div>}
            </div>
        </div>
    );
};