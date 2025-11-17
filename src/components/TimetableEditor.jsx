// [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-phase3-dev/src/components/TimetableEditor.jsx]
import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useTimetable } from '../hooks/useTimetable';
import { ImageEditModal } from './ImageEditModal';
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
    parseTime,
    GripIcon,
    VIVID_COLORS,
    CalendarIcon,
    parseDateTime,
    getTodayDateString
} from './common';


// (VjItem - 変更なし)
const VjItem = memo(({ vj, onPointerDown, onUpdate, onRemove, isDragging, isPlaying }) => {

    const draggingClass = isDragging ? 'dragging-item' : '';
    // ★ 修正: isPlayingに応じたハイライトを追加
    const ringClass = isPlaying ? 'ring-2 shadow-[0_0_12px_var(--tw-ring-color)]' : 'ring-1 ring-zinc-700';

    return (
        <div
            // ★ 修正: ringClass を追加
            className={`bg-surface-container rounded-2xl flex items-stretch gap-4 p-4 ${draggingClass} ${ringClass}`}
            // ★ 修正: style を追加 (ハイライト色をブランドカラーに設定)
            style={{ '--tw-ring-color': isPlaying ? 'rgb(var(--color-brand-primary))' : 'transparent' }}
        >
            {/* (グリップ - 変更なし) */}
            <div
                className="cursor-grab touch-none p-3 -m-3 self-stretch flex items-center"
                onPointerDown={onPointerDown}
            >
                <GripIcon className="w-6 h-6 text-on-surface-variant shrink-0" />
            </div>

            {/* (スペーサー - 変更なし) */}
            <div className="shrink-0 self-center" />

            {/* VJ情報 (グリッドレイアウト - 変更なし) */}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* 1. VJ Name */}
                <div className="flex flex-col">
                    <label className="text-xs text-on-surface-variant mb-1">VJ Name</label>
                    <input type="text" value={vj.name} onChange={(e) => onUpdate('name', e.target.value)} className="bg-surface-background text-on-surface p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>
                {/* 2. Duration */}
                <div className="flex flex-col">
                    <label className="text-xs text-on-surface-variant mb-1">Duration (min)</label>
                    <input type="number" value={vj.duration} step="0.1" onChange={(e) => onUpdate('duration', parseFloat(e.target.value) || 0)} className="bg-surface-background text-on-surface p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-primary font-bold text-base" />
                </div>
                {/* 3. Time Slot (col-span-2) */}
                <div className="flex flex-col md:col-span-2">
                    <label className="text-xs text-on-surface-variant mb-1">Time Slot (Auto)</label>
                    {/* (HTML構造 - 変更なし) */}
                    <div className="bg-surface-background/50 p-2 rounded-lg w-full text-center font-semibold text-on-surface-variant font-mono">
                        <span>{vj.startTime}</span>
                        <span className="mx-2">-</span>
                        <span>{vj.endTime}</span>
                    </div>
                </div>
            </div>

            {/* (スペーサー＆削除ボタン - 変更なし) */}
            <div className="flex flex-col gap-2 shrink-0 self-stretch justify-center">
                {/* DjItemのカラーピッカー(w-9 h-9)用のスペーサー */}
                <div className="w-9 h-9" />
                {/* DjItemのコピーボタン(p-2 + w-5 h-5 -> h-9)用のスペーサー */}
                <div className="w-9 h-9" />
                {/* 削除ボタン本体 (w-9 h-9相当) */}
                <button onClick={onRemove} className="text-on-surface-variant hover:text-red-500 p-2 rounded-full transition-colors"><TrashIcon className="w-5 h-5" /></button>
            </div>
        </div>
    );
});


// (VjTimetableManager - 変更なし)
const VjTimetableManager = ({ vjTimetable, setVjTimetable, eventStartDateStr, eventStartTimeStr, now }) => {

    const {
        schedule: vjSchedule,
        eventStartTimeDate: vjEventStartTimeDate,
        recalculateTimes: recalculateVjTimes,
        currentlyPlayingIndex: currentlyPlayingVjIndex
    } = useTimetable(vjTimetable, eventStartDateStr, eventStartTimeStr, now);

    const {
        draggedIndex: vjDraggedIndex,
        overIndex: vjOverIndex,
        isDragging: vjIsDragging,
        listContainerRef: vjListContainerRef,
        handlePointerDown: handleVjPointerDown,
        getDragStyles: getVjDragStyles,
    } = useDragAndDrop(vjTimetable, setVjTimetable, (newTable) => recalculateVjTimes(newTable, vjEventStartTimeDate), [eventStartDateStr, eventStartTimeStr]);

    const handleAddVj = () => {
        const newVj = { id: Date.now(), name: `VJ ${vjTimetable.length + 1}`, duration: 60 };
        setVjTimetable(prev => recalculateVjTimes([...prev, newVj], vjEventStartTimeDate));
    };
    const handleUpdateVj = (index, field, value) => {
        setVjTimetable(prev => {
            const newVjList = [...prev];
            newVjList[index] = { ...newVjList[index], [field]: value };
            if (field === 'duration') {
                return recalculateVjTimes(newVjList, vjEventStartTimeDate);
            }
            return newVjList;
        });
    };
    const handleRemoveVj = (index) => {
        setVjTimetable(prev =>
            recalculateVjTimes(prev.filter((_, i) => i !== index), vjEventStartTimeDate)
        );
    };

    return (
        <div className="w-full space-y-4">
            <h2 className="text-xl font-bold text-on-surface mb-2">VJ タイムテーブル</h2>
            <div className="space-y-4" ref={vjListContainerRef}>
                {vjSchedule.map((vj, index) => {
                    let dropIndicatorClass = '';
                    if (vjIsDragging) {
                        if (index === vjOverIndex) {
                            dropIndicatorClass = 'drop-indicator-before';
                        }
                        if (vjOverIndex === vjTimetable.length && index === vjTimetable.length - 1) {
                            dropIndicatorClass = 'drop-indicator-after';
                        }
                    }
                    return (
                        <div
                            key={vj.id}
                            data-vj-index={index}
                            className={`dj-list-item ${dropIndicatorClass}`}
                            style={getVjDragStyles(index)}
                        >
                            <VjItem
                                vj={vj}
                                onPointerDown={(e) => handleVjPointerDown(e, index)}
                                onUpdate={(field, value) => handleUpdateVj(index, field, value)}
                                onRemove={() => handleRemoveVj(index)}
                                isDragging={vjDraggedIndex === index}
                                isPlaying={currentlyPlayingVjIndex === index}
                            />
                        </div>
                    );
                })}
            </div>
            <button
                onClick={handleAddVj}
                className="w-full flex items-center justify-center bg-surface-container hover:opacity-90 text-on-surface-variant font-bold py-3 px-4 rounded-full transition-opacity duration-200"
            >
                <PlusIcon className="w-5 h-5 mr-2" /><span>VJを追加</span>
            </button>
        </div>
    );
};


// (SettingsModal)
const SettingsModal = ({
    isOpen,
    onClose,
    eventConfig,
    handleEventConfigChange,
    handleShare, // ★ 修正: handleShare を props で受け取る
    onResetClick,
    theme,
    toggleTheme
}) => {
    if (!isOpen) return null;

    // (ThemeToggle - 変更なし)
    const ThemeToggle = () => (
        <div className="flex items-center justify-between">
            <label className="text-base text-on-surface">テーマ</label>
            <button
                onClick={toggleTheme}
                className="flex items-center gap-2 bg-surface-background hover:opacity-80 text-on-surface-variant font-semibold py-2 px-4 rounded-full"
            >
                {theme === 'dark' ? (
                    <><MoonIcon className="w-5 h-5" /> <span>ダーク</span></>
                ) : (
                    <><SunIcon className="w-5 h-5" /> <span>ライト</span></>
                )}
            </button>
        </div>
    );
    // (VjFeatureToggle - 変更なし)
    const VjFeatureToggle = () => (
        <div className="flex items-center justify-between">
            <label className="text-base text-on-surface">VJタイムテーブル機能</label>
            <button
                onClick={() => handleEventConfigChange('vjFeatureEnabled', !eventConfig.vjFeatureEnabled)}
                className={`w-14 h-8 rounded-full flex items-center p-1 transition-colors ${eventConfig.vjFeatureEnabled ? 'bg-brand-primary justify-end' : 'bg-surface-background justify-start'}`}
            >
                <span className="w-6 h-6 rounded-full bg-white shadow-md block" />
            </button>
        </div>
    );


    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in-up" onClick={onClose}>
            <div className="bg-surface-container rounded-2xl p-6 w-full max-w-md shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-background text-on-surface-variant hover:text-on-surface"
                >
                    <XIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold mb-6">設定</h2>

                {/* --- 1. イベント設定 (変更なし) --- */}
                <div className="pb-6 mb-6 border-b border-surface-background dark:border-zinc-700/50">
                    <h3 className="text-lg font-bold text-on-surface mb-4">イベント設定</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-on-surface-variant mb-1 block">イベントタイトル</label>
                            <input
                                type="text"
                                value={eventConfig.title || ''}
                                onChange={(e) => handleEventConfigChange('title', e.target.value)}
                                className="bg-surface-background text-on-surface p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                placeholder="イベントタイトル"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-on-surface-variant mb-1 block">イベント開始日</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={eventConfig.startDate || ''}
                                    onChange={(e) => handleEventConfigChange('startDate', e.target.value)}
                                    className="bg-surface-background text-on-surface p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-primary font-mono font-bold text-base appearance-none pr-10"
                                />
                                <CalendarIcon className="w-5 h-5 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-on-surface-variant mb-1 block">イベント開始時間</label>
                            <CustomTimeInput
                                value={eventConfig.startTime}
                                onChange={(v) => handleEventConfigChange('startTime', v)}
                            />
                        </div>
                        <VjFeatureToggle />
                    </div>
                </div>

                {/* --- 2. アプリ設定 (変更なし) --- */}
                <div className="pb-6 mb-6 border-b border-surface-background dark:border-zinc-700/50">
                    <h3 className="text-lg font-bold text-on-surface mb-4">アプリ設定</h3>
                    <div className="space-y-4">
                        <ThemeToggle />
                        <div className="flex items-center justify-between">
                            <label className="text-base text-on-surface">Liveモード共有</label>
                            <button
                                onClick={handleShare} // ★ 修正: propsのhandleShareを使う
                                className="flex items-center gap-2 bg-surface-background hover:opacity-80 text-on-surface-variant font-semibold py-2 px-4 rounded-full"
                            >
                                <CopyIcon className="w-5 h-5" /> <span>URLをコピー</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- 3. 危険ゾーン (変更なし) --- */}
                <div>
                    <h3 className="text-lg font-bold text-red-400 mb-4">危険ゾーン</h3>
                    <button
                        onClick={onResetClick}
                        className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                    >
                        <ResetIcon className="w-5 h-5" />
                        <span>タイムテーブルをリセット</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
// ★★★ SettingsModal ここまで ★★★

// (formatDateTime - 変更なし)
const formatDateTime = (date) => {
    if (!date || !(date instanceof Date)) return '??:??';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}/${m}/${d} ${h}:${min}`;
};


// --- ★★★ TimetableEditor (★ 共有ロジックを修正) ★★★
export const TimetableEditor = ({
    eventConfig, setEventConfig,
    timetable, setTimetable,
    vjTimetable, setVjTimetable,
    setMode, storage, timeOffset,
    theme, toggleTheme, imagesLoaded
}) => {

    const [openColorPickerId, setOpenColorPickerId] = useState(null);
    const [editingDjIndex, setEditingDjIndex] = useState(null);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [now, setNow] = useState(new Date(new Date().getTime() + timeOffset));
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // (useEffect now - 変更なし)
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date(new Date().getTime() + timeOffset)), 1000);
        return () => clearInterval(timer);
    }, [timeOffset]);


    // (useTimetable, useDragAndDrop, handleEventConfigChange, handleUpdate, addNewDj, executeReset, handleRemoveDj, handleCopyDj - すべて変更なし)
    // ... (中略) ...

    // 1. DJ用のロジックフック (変更なし)
    const {
        schedule,
        eventEndTime,
        eventStartTimeDate,
        eventEndTimeDate,
        currentlyPlayingIndex,
        totalEventDuration,
        recalculateTimes,
    } = useTimetable(timetable, eventConfig.startDate, eventConfig.startTime, now);

    // 2. DJ用のD&Dフック (変更なし)
    const {
        draggedIndex,
        overIndex,
        isDragging,
        listContainerRef,
        handlePointerDown,
        getDragStyles,
    } = useDragAndDrop(timetable, setTimetable, (newTable) => recalculateTimes(newTable, eventStartTimeDate), [eventConfig.startDate, eventConfig.startTime]);

    // 3. ★ イベント設定変更 (変更なし)
    const handleEventConfigChange = (field, value) => {
        setEventConfig(prevConfig => {
            const newConfig = { ...prevConfig, [field]: value };
            if (field === 'startDate' || field === 'startTime') {
                const newBaseTime = parseDateTime(newConfig.startDate, newConfig.startTime);
                setTimetable(prevTimetable => recalculateTimes(prevTimetable, newBaseTime));
            }
            return newConfig;
        });
    };

    // 4. DJアイテムの更新 (変更なし)
    const handleUpdate = (index, field, value) => {
        setTimetable(prevTimetable => {
            const newTimetable = [...prevTimetable];
            newTimetable[index] = { ...newTimetable[index], [field]: value };
            if (field === 'duration') {
                return recalculateTimes(newTimetable, eventStartTimeDate);
            }
            return newTimetable;
        });
    };

    // 5. DJの追加 (変更なし)
    const addNewDj = (isBuffer = false) => {
        setTimetable(prevTimetable => {
            const lastDj = prevTimetable[prevTimetable.length - 1];
            const duration = isBuffer ? 5 : (lastDj ? lastDj.duration : 60);
            const newDjData = {
                id: Date.now(),
                name: isBuffer ? 'バッファー' : `DJ ${prevTimetable.filter(d => !d.isBuffer).length + 1}`,
                duration: duration,
                imageUrl: '',
                color: VIVID_COLORS[Math.floor(Math.random() * VIVID_COLORS.length)],
                isBuffer,
            };
            return recalculateTimes([...prevTimetable, newDjData], eventStartTimeDate);
        });
    };

    // 6. ★ リセット (変更なし)
    const executeReset = () => {
        setTimetable([]);
        setVjTimetable([]);
        setEventConfig({
            title: 'My Awesome Event',
            startDate: getTodayDateString(),
            startTime: '22:00',
            vjFeatureEnabled: false
        });
        setIsResetConfirmOpen(false);
    };

    // 7. DJの削除 (変更なし)
    const handleRemoveDj = (index) => setTimetable(prevTimetable => recalculateTimes(prevTimetable.filter((_, i) => i !== index), eventStartTimeDate));

    // 8. DJのコピー (変更なし)
    const handleCopyDj = (index) => {
        setTimetable(prevTimetable => {
            const djToCopy = { ...prevTimetable[index], id: Date.now() };
            const newTimetable = [...prevTimetable.slice(0, index + 1), djToCopy, ...prevTimetable.slice(index + 1)];
            return recalculateTimes(newTimetable, eventStartTimeDate);
        });
    };

    // ▼▼▼ 【!!! 修正 !!!】 共有URLのロジックを変更 ▼▼▼
    const handleShare = () => {
        // 現在のURL (例: .../edit/aK4xLp...) から、/edit/ を /live/ に置き換える
        const liveUrl = window.location.href.replace("/edit/", "/live/");

        try {
            navigator.clipboard.writeText(liveUrl).then(() => {
                alert('Liveモード（閲覧用）のURLをコピーしました！\n' + liveUrl);
            }, () => {
                alert('コピーに失敗しました...。');
            });
        } catch (err) {
            console.error('クリップボードのコピーに失敗:', err);
            alert('コピーに失敗しました...');
        }
    };
    // ▲▲▲ 【!!! 修正 !!!】 ここまで ▲▲▲


    // (インフォメーション表示用 - 変更なし)
    const { displayStartTime, displayEndTime } = useMemo(() => {
        if (schedule.length > 0) {
            return {
                displayStartTime: schedule[0].startTimeDate,
                displayEndTime: schedule[schedule.length - 1].endTimeDate
            };
        }
        return {
            displayStartTime: eventStartTimeDate,
            displayEndTime: null
        };
    }, [schedule, eventStartTimeDate]);


    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* (Modal呼び出し - 変更なし) */}
            <ConfirmModal
                isOpen={isResetConfirmOpen}
                title="タイムテーブルをリセット"
                message="すべてのDJと設定が削除されます。この操作は元に戻せません。本当によろしいですか？"
                onConfirm={executeReset}
                onCancel={() => setIsResetConfirmOpen(false)}
            />
            {/* ▼▼▼ 【!!! 修正 !!!】 Modalに handleShare を渡す ▼▼▼ */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                eventConfig={eventConfig}
                handleEventConfigChange={handleEventConfigChange}
                handleShare={handleShare} // ★ 修正
                onResetClick={() => {
                    setIsSettingsOpen(false);
                    setIsResetConfirmOpen(true);
                }}
                theme={theme}
                toggleTheme={toggleTheme}
            />
            {/* ▲▲▲ 【!!! 修正 !!!】 ここまで ▲▲▲ */}

            {/* (ImageEditModal - 変更なし) */}
            {editingDjIndex !== null && (
                <ImageEditModal
                    dj={timetable[editingDjIndex]}
                    onUpdate={(field, value) => handleUpdate(editingDjIndex, field, value)}
                    onClose={() => setEditingDjIndex(null)}
                    storage={storage}
                />
            )}


            {/* (ヘッダー - 変更なし) */}
            <header className="flex flex-row justify-between items-center mb-4 gap-4">
                <input
                    type="text"
                    value={eventConfig.title || 'DJ Timekeeper Pro'}
                    onChange={(e) => handleEventConfigChange('title', e.target.value)}
                    className="text-2xl sm:text-3xl font-bold text-brand-secondary tracking-wide bg-transparent focus:outline-none focus:bg-surface-container/50 rounded-lg p-2 flex-1 min-w-0"
                    placeholder="イベントタイトル"
                />
                <div className="flex-shrink-0">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        title="設定"
                        className="flex items-center justify-center gap-2 py-3 px-5 bg-surface-container hover:bg-zinc-700 text-on-surface font-semibold rounded-full transition-colors"
                    >
                        <SettingsIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">設定</span>
                    </button>
                </div>
            </header>


            {/* ▼▼▼ 【!!! 修正 !!!】 Liveモードボタンのロジック変更 ▼▼▼ */}
            <div className="mb-6">
                <button
                    onClick={() => timetable.length > 0 && setMode('live')} // ★ 修正: setMode('live') に変更
                    disabled={timetable.length === 0 || !imagesLoaded}
                    className="w-full flex items-center justify-center bg-brand-primary hover:opacity-90 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-full transition-opacity duration-200 shadow-lg"
                >
                    <PlayIcon className="w-5 h-5 mr-2" />
                    <span>{imagesLoaded ? 'Liveモード' : '画像読込中...'}</span>
                </button>
            </div>
            {/* ▲▲▲ 【!!! 修正 !!!】 ここまで ▲▲▲ */}


            {/* (インフォメーション - 変更なし) */}
            <div className="bg-surface-container rounded-xl p-4 mb-8">
                <div className="bg-surface-background text-on-surface-variant font-semibold py-2 px-4 rounded-full text-sm sm:text-lg tracking-wider font-mono text-center mb-4 max-w-full mx-auto">
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-3">
                        <span>{formatDateTime(displayStartTime)}</span>
                        <span>-</span>
                        {displayEndTime ? (
                            <span>{formatDateTime(displayEndTime)}</span>
                        ) : (
                            <span>??/?? ??:??</span>
                        )}
                    </div>
                </div>
                {totalEventDuration && (
                    <div className="text-center mb-0">
                        <span className="text-xs text-on-surface-variant uppercase">Total DJ Time</span>
                        <p className="text-2xl font-bold text-on-surface">{totalEventDuration}</p>
                    </div>
                )}
            </div>

            {/* (2カラムレイアウト - 変更なし) */}
            <div className="flex flex-col lg:flex-row gap-8">

                {/* --- ★ 左カラム (DJリスト) ★ --- */}
                <div className="w-full lg:flex-1 space-y-4">
                    <h2 className="text-xl font-bold text-on-surface mb-2">DJ タイムテーブル</h2>

                    <div className="space-y-4" ref={listContainerRef}>
                        {schedule.map((dj, index) => {
                            let dropIndicatorClass = '';
                            if (isDragging) {
                                if (index === overIndex) {
                                    dropIndicatorClass = 'drop-indicator-before';
                                }
                                if (overIndex === timetable.length && index === timetable.length - 1) {
                                    dropIndicatorClass = 'drop-indicator-after';
                                }
                            }
                            return (
                                <div
                                    key={dj.id}
                                    data-dj-index={index}
                                    className={`dj-list-item ${dropIndicatorClass}`}
                                    style={getDragStyles(index)}
                                >
                                    <DjItem
                                        dj={dj}
                                        isPlaying={currentlyPlayingIndex === index}
                                        onPointerDown={(e) => handlePointerDown(e, index)}
                                        onEditClick={() => setEditingDjIndex(index)}
                                        onUpdate={(field, value) => handleUpdate(index, field, value)}
                                        onColorPickerToggle={setOpenColorPickerId}
                                        onCopy={() => handleCopyDj(index)}
                                        onRemove={() => handleRemoveDj(index)}
                                        isColorPickerOpen={openColorPickerId === dj.id}
                                        openColorPickerId={openColorPickerId}
                                        isDragging={draggedIndex === index}
                                        showVjName={false}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-4">
                        <button onClick={() => addNewDj(false)} className="w-full flex items-center justify-center bg-brand-primary hover:opacity-90 text-white font-bold py-3 px-4 rounded-full transition-opacity duration-200"><PlusIcon className="w-5 h-5 mr-2" /><span>DJを追加</span></button>
                        <button onClick={() => addNewDj(true)} className="w-full flex items-center justify-center bg-surface-container hover:opacity-90 text-on-surface-variant font-bold py-3 px-4 rounded-full transition-opacity duration-200"><PlusIcon className="w-5 h-5 mr-2" /><span>バッファーを追加</span></button>
                    </div>
                </div>

                {/* --- ★ 右カラム (VJリスト) ★ --- */}
                {eventConfig.vjFeatureEnabled && (
                    <div className="w-full lg:w-1/3 lg:max-w-md space-y-4">
                        {/* ★ (変更なし) */}
                        <VjTimetableManager
                            vjTimetable={vjTimetable}
                            setVjTimetable={setVjTimetable}
                            eventStartDateStr={eventConfig.startDate}
                            eventStartTimeStr={eventConfig.startTime}
                            now={now}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};