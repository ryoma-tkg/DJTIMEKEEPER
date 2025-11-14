import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useTimetable } from '../hooks/useTimetable';
import { ImageEditModal } from './ImageEditModal'; // 
import { DjItem } from './DjItem'; // 
import {
    CustomTimeInput,
    ConfirmModal,
    PlayIcon,
    PlusIcon,
    CopyIcon,
    ResetIcon,
    SettingsIcon, // 
    XIcon, // 
    SunIcon, // 
    MoonIcon, // 
    TrashIcon, // 
    parseTime, // 
    GripIcon, // 
    VIVID_COLORS // 
} from './common';


// ★★★ VJリストのアイテム (先輩の要望通り UI 修正) ★★★
const VjItem = memo(({ vj, onPointerDown, onUpdate, onRemove, isDragging }) => {
    const draggingClass = isDragging ? 'dragging-item' : '';

    return (
        <div
            // ★ 枠線 (ring-1 ring-zinc-700) を削除
            className={`bg-surface-container rounded-2xl flex items-center gap-4 p-4 ${draggingClass}`}
        >
            {/* D&Dハンドル */}
            <div
                className="cursor-grab touch-none p-3 -m-3"
                onPointerDown={onPointerDown}
            >
                <GripIcon className="w-6 h-6 text-on-surface-variant shrink-0" />
            </div>

            {/* VJ情報 (名前・時間) */}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* VJ名 */}
                <div className="flex flex-col">
                    <label className="text-xs text-on-surface-variant mb-1">VJ Name</label>
                    <input type="text" value={vj.name} onChange={(e) => onUpdate('name', e.target.value)} className="bg-surface-background text-on-surface p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>

                {/* 持ち時間 */}
                <div className="flex flex-col">
                    <label className="text-xs text-on-surface-variant mb-1">Duration (min)</label>
                    <input type="number" value={vj.duration} step="0.1" onChange={(e) => onUpdate('duration', parseFloat(e.target.value) || 0)} className="bg-surface-background text-on-surface p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-primary font-bold text-base" />
                </div>

                {/* 自動計算された時間 (表示のみ) */}
                <div className="flex flex-col md:col-span-2">
                    <label className="text-xs text-on-surface-variant mb-1">Time Slot (Auto)</label>
                    <div className="bg-surface-background/50 p-2 rounded-lg w-full text-center font-semibold text-on-surface-variant font-mono">
                        {/* ★ 日付なしの HH:MM - HH:MM に戻す */}
                        <div className="flex flex-row justify-center items-center text-sm">
                            <span>{vj.startTime}</span>
                            <span className="mx-2">-</span>
                            <span>{vj.endTime}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 削除ボタン */}
            <div className="flex flex-col gap-2 shrink-0 self-center">
                <button onClick={onRemove} className="text-on-surface-variant hover:text-red-500 p-2 rounded-full transition-colors"><TrashIcon className="w-5 h-5" /></button>
            </div>
        </div>
    );
});
// ★★★ VJアイテム ここまで ★★★


// ★★★ VJタイムテーブル管理 (ロジックフックの変更に対応) ★★★
const VjTimetableManager = ({ vjTimetable, setVjTimetable, eventStartTimeStr, now }) => {

    // 1. VJ用のロジックフックを呼び出し (now を渡す)
    const {
        schedule: vjSchedule, // VJのスケジュール (Dateオブジェクトなど計算済み)
        eventStartTimeDate: vjEventStartTimeDate, // ★ VJの基点となる Date
        recalculateTimes: recalculateVjTimes // VJの時間再計算関数
    } = useTimetable(vjTimetable, eventStartTimeStr, now);

    // 2. VJ用のD&Dフックを呼び出し
    const {
        draggedIndex: vjDraggedIndex,
        overIndex: vjOverIndex,
        isDragging: vjIsDragging,
        listContainerRef: vjListContainerRef,
        handlePointerDown: handleVjPointerDown,
        getDragStyles: getVjDragStyles,
        // ★ recalculateTimes が基点時刻を要求するようになったので、D&Dフックの呼び出し方を修正
    } = useDragAndDrop(vjTimetable, setVjTimetable, (newTable) => recalculateVjTimes(newTable, vjEventStartTimeDate), eventStartTimeStr);


    // VJ追加 (duration で追加)
    const handleAddVj = () => {
        const newVj = {
            id: Date.now(),
            name: `VJ ${vjTimetable.length + 1}`,
            duration: 60,
        };
        // ★ 基点時刻 (vjEventStartTimeDate) を使って再計算
        setVjTimetable(prev => recalculateVjTimes([...prev, newVj], vjEventStartTimeDate));
    };

    // VJの情報更新
    const handleUpdateVj = (index, field, value) => {
        setVjTimetable(prev => {
            const newVjList = [...prev];
            newVjList[index] = { ...newVjList[index], [field]: value };
            if (field === 'duration') {
                // ★ 基点時刻 (vjEventStartTimeDate) を使って再計算
                return recalculateVjTimes(newVjList, vjEventStartTimeDate);
            }
            return newVjList;
        });
    };

    // VJ削除
    const handleRemoveVj = (index) => {
        setVjTimetable(prev =>
            // ★ 基点時刻 (vjEventStartTimeDate) を使って再計算
            recalculateVjTimes(prev.filter((_, i) => i !== index), vjEventStartTimeDate)
        );
    };

    return (
        <div className="w-full space-y-4">
            <h2 className="text-xl font-bold text-on-surface mb-2">VJ タイムテーブル</h2>

            {/* VJリスト (D&D対応) */}
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
                            className={`dj-list-item ${dropIndicatorClass}`} // dj-list-item を流用
                            style={getVjDragStyles(index)}
                        >
                            <VjItem
                                vj={vj} // 計算済みのスケジュールを渡す
                                onPointerDown={(e) => handleVjPointerDown(e, index)}
                                onUpdate={(field, value) => handleUpdateVj(index, field, value)}
                                onRemove={() => handleRemoveVj(index)}
                                isDragging={vjDraggedIndex === index}
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
// ★★★ VJマネージャー ここまで ★★★


// --- SettingsModal (変更なし) ---
const SettingsModal = ({
    isOpen,
    onClose,
    eventConfig,
    handleEventConfigChange,
    handleShare,
    onResetClick,
    theme,
    toggleTheme
}) => {
    if (!isOpen) return null;

    // 
    const ThemeToggle = () => (
        <div className="flex items-center justify-between">
            <label className="text-base text-on-surface">テーマ</label>
            <button
                onClick={toggleTheme}
                className="flex items-center gap-2 bg-surface-background hover:opacity-80 text-on-surface-variant font-semibold py-2 px-4 rounded-full"
            >
                {theme === 'dark' ? (
                    <>
                        <MoonIcon className="w-5 h-5" /> <span>ダーク</span>
                    </>
                ) : (
                    <>
                        <SunIcon className="w-5 h-5" /> <span>ライト</span>
                    </>
                )}
            </button>
        </div>
    );

    // 
    const VjFeatureToggle = () => (
        <div className="flex items-center justify-between">
            <label className="text-base text-on-surface">VJタイムテーブル機能</label>
            <button
                onClick={() => handleEventConfigChange('vjFeatureEnabled', !eventConfig.vjFeatureEnabled)}
                className={`w-14 h-8 rounded-full flex items-center p-1 transition-colors ${eventConfig.vjFeatureEnabled ? 'bg-brand-primary justify-end' : 'bg-surface-background justify-start'
                    }`}
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

                {/* --- 1. --- */}
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-on-surface-variant tracking-wider uppercase mb-3">イベント設定</h3>
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
                            <label className="text-xs text-on-surface-variant mb-1 block">イベント開始時間</label>
                            <CustomTimeInput
                                value={eventConfig.startTime}
                                onChange={(v) => handleEventConfigChange('startTime', v)}
                            />
                        </div>

                        {/* */}
                        <VjFeatureToggle />
                    </div>
                </div>

                {/* --- 2. --- */}
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-on-surface-variant tracking-wider uppercase mb-3">アプリ設定</h3>
                    <div className="space-y-4">
                        <ThemeToggle />
                        <div className="flex items-center justify-between">
                            <label className="text-base text-on-surface">Liveモード共有</label>
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-2 bg-surface-background hover:opacity-80 text-on-surface-variant font-semibold py-2 px-4 rounded-full"
                            >
                                <CopyIcon className="w-5 h-5" /> <span>URLをコピー</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- 3. --- */}
                <div>
                    <h3 className="text-sm font-bold text-red-400 tracking-wider uppercase mb-3">危険ゾーン</h3>
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
// 

// (日付フォーマット関数 - 変更なし)
const formatDateTime = (date) => {
    if (!date || !(date instanceof Date)) return '??:??';

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');

    return `${y}/${m}/${d} ${h}:${min}`;
};


// --- TimetableEditor (
// 
export const TimetableEditor = ({ eventConfig, setEventConfig, timetable, setTimetable, vjTimetable, setVjTimetable, setMode, storage, timeOffset, theme, toggleTheme }) => {

    const [openColorPickerId, setOpenColorPickerId] = useState(null);
    const [editingDjIndex, setEditingDjIndex] = useState(null);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [now, setNow] = useState(new Date(new Date().getTime() + timeOffset));
    const [isSettingsOpen, setIsSettingsOpen] = useState(false); // 

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date(new Date().getTime() + timeOffset)), 1000);
        return () => clearInterval(timer);
    }, [timeOffset]);


    // 1. DJ用のロジックフック (now を渡す)
    const {
        schedule,
        eventEndTime,
        eventStartTimeDate, // ★ 基点となる Date
        eventEndTimeDate,   // ★ 終了の Date
        currentlyPlayingIndex,
        totalEventDuration,
        recalculateTimes,
    } = useTimetable(timetable, eventConfig.startTime, now); // ★ now を渡す

    // 2. DJ用のD&Dフック (recalculateTimes の呼び出し方を修正)
    const {
        draggedIndex,
        overIndex,
        isDragging,
        listContainerRef,
        handlePointerDown,
        getDragStyles,
    } = useDragAndDrop(timetable, setTimetable, (newTable) => recalculateTimes(newTable, eventStartTimeDate), eventConfig.startTime);

    // 3. イベント設定変更
    const handleEventConfigChange = (field, value) => {
        setEventConfig(prevConfig => {
            const newConfig = { ...prevConfig, [field]: value };
            if (field === 'startTime') {
                // ★ startTime (HH:MM) が変わった場合、
                // recalculateTimes は「基点時刻(Date)」を要求するので、
                // ここでは parseTime で "今日" の Date を暫定的に渡す
                // (次の now の更新で useTimetable が正しい基点時刻に補正してくれる)
                setTimetable(prevTimetable => recalculateTimes(prevTimetable, parseTime(value)));
            }
            return newConfig;
        });
    };

    // 4. DJアイテムの更新
    const handleUpdate = (index, field, value) => {
        setTimetable(prevTimetable => {
            const newTimetable = [...prevTimetable];
            newTimetable[index] = { ...newTimetable[index], [field]: value };
            if (field === 'duration') {
                // ★ 基点時刻 (eventStartTimeDate) を使って再計算
                return recalculateTimes(newTimetable, eventStartTimeDate);
            }
            return newTimetable;
        });
    };

    // 5. DJの追加
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
            // ★ 基点時刻 (eventStartTimeDate) を使って再計算
            return recalculateTimes([...prevTimetable, newDjData], eventStartTimeDate);
        });
    };

    // 6. リセット
    const executeReset = () => {
        setTimetable([]);
        setVjTimetable([]);
        setEventConfig({ title: 'My Awesome Event', startTime: '22:00', vjFeatureEnabled: false });
        setIsResetConfirmOpen(false);
    };

    // 7. DJの削除
    const handleRemoveDj = (index) => setTimetable(prevTimetable => recalculateTimes(prevTimetable.filter((_, i) => i !== index), eventStartTimeDate));

    // 8. DJのコピー
    const handleCopyDj = (index) => {
        setTimetable(prevTimetable => {
            const djToCopy = { ...prevTimetable[index], id: Date.now() };
            const newTimetable = [...prevTimetable.slice(0, index + 1), djToCopy, ...prevTimetable.slice(index + 1)];
            return recalculateTimes(newTimetable, eventStartTimeDate);
        });
    };


    const handleShare = () => {
        const baseUrl = window.location.href.replace(/#.*$/, '');
        const url = baseUrl + '#live';
        try {
            navigator.clipboard.writeText(url).then(() => {
                alert('Liveモード専用URLをクリップボードにコピーしました！');
            }, () => {
                alert('コピーに失敗しました...。');
            });
        } catch (err) {
            console.error('クリップボードのコピーに失敗:', err);
            alert('コピーに失敗しました...');
        }
    };

    // ★★★ インフォメーション表示用 (useTimetable から eventStartTimeDate をもらう) ★★★
    const { displayStartTime, displayEndTime } = useMemo(() => {
        if (schedule.length > 0) {
            return {
                displayStartTime: schedule[0].startTimeDate,
                displayEndTime: schedule[schedule.length - 1].endTimeDate
            };
        }
        // ★ スケジュールが空の場合も、useTimetable が計算した基点時刻 (activeStartTime) を使う
        return {
            displayStartTime: eventStartTimeDate,
            displayEndTime: null
        };
    }, [schedule, eventStartTimeDate]); // ★ 依存配列を修正
    // ★★★ 修正ここまで ★★★


    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <ConfirmModal
                isOpen={isResetConfirmOpen}
                title="タイムテーブルをリセット"
                message="すべてのDJと設定が削除されます。この操作は元に戻せません。本当によろしいですか？"
                onConfirm={executeReset}
                onCancel={() => setIsResetConfirmOpen(false)}
            />

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                eventConfig={eventConfig}
                handleEventConfigChange={handleEventConfigChange} // ★ こっちの関数を渡す
                handleShare={handleShare}
                onResetClick={() => {
                    setIsSettingsOpen(false);
                    setIsResetConfirmOpen(true);
                }}
                theme={theme}
                toggleTheme={toggleTheme}
            />

            {editingDjIndex !== null && (
                <ImageEditModal
                    dj={timetable[editingDjIndex]}
                    onUpdate={(field, value) => handleUpdate(editingDjIndex, field, value)} // ★ こっちの関数を渡す
                    onClose={() => setEditingDjIndex(null)}
                    storage={storage}
                />
            )}


            <header className="flex flex-row justify-between items-center mb-4 gap-4">

                <input
                    type="text"
                    value={eventConfig.title || 'DJ Timekeeper Pro'}
                    onChange={(e) => handleEventConfigChange('title', e.target.value)} // ★ こっちの関数を渡す
                    className="text-2xl sm:text-3xl font-bold text-brand-secondary tracking-wide bg-transparent focus:outline-none focus:bg-surface-container/50 rounded-lg p-2 flex-1 min-w-0"
                    placeholder="イベントタイトル"
                />

                <div className="flex-shrink-0">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        title="設定"
                        className="flex items-center justify-center p-3.5 bg-surface-container/50 text-on-surface-variant hover:bg-surface-container hover:text-on-surface rounded-full transition-colors"
                    >
                        <SettingsIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>


            <div className="mb-6">
                <button onClick={() => timetable.length > 0 && setMode('live')} disabled={timetable.length === 0} className="w-full flex items-center justify-center bg-brand-primary hover:opacity-90 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-full transition-opacity duration-200 shadow-lg">
                    <PlayIcon className="w-5 h-5 mr-2" /><span>Liveモード</span>
                </button>
            </div>


            {/* ★★★ 1. インフォメーション (表示ロジックは変更なし) ★★★ */}
            <div className="bg-surface-container rounded-xl p-4 mb-8">
                <div className="bg-surface-background text-on-surface-variant font-semibold py-2 px-4 rounded-full text-sm sm:text-lg tracking-wider font-mono text-center mb-4 max-w-full mx-auto">
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-3">
                        {/* ★ useMemo から来た displayStartTime を使う */}
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

            {/* 2. 2カラムレイアウト (変更なし) */}
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
                                        onUpdate={(field, value) => handleUpdate(index, field, value)} // ★ こっちの関数
                                        onColorPickerToggle={setOpenColorPickerId}
                                        onCopy={() => handleCopyDj(index)} // ★ こっちの関数
                                        onRemove={() => handleRemoveDj(index)} // ★ こっちの関数
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
                        {/* ★ 新しくなった VjTimetableManager を呼び出す */}
                        <VjTimetableManager
                            vjTimetable={vjTimetable}
                            setVjTimetable={setVjTimetable}
                            eventStartTimeStr={eventConfig.startTime} // ★ DJの開始時刻(HH:MM)を渡す
                            now={now} // ★ 現在時刻を渡す
                        />
                    </div>
                )}
            </div>
        </div>
    );
};