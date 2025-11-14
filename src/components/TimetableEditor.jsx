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
    TrashIcon // 
} from './common';

// --- VJタイムテーブルの専用コンポーネント (変更なし) ---
const VjTimetableManager = ({ vjTimetable, setVjTimetable }) => {

    // VJ追加
    const handleAddVj = () => {
        const newVj = {
            id: Date.now(),
            name: `VJ ${vjTimetable.length + 1}`,
            startTime: '22:00',
            endTime: '05:00'
        };
        setVjTimetable(prev => [...prev, newVj]);
    };

    // VJの情報を更新
    const handleUpdateVj = (index, field, value) => {
        setVjTimetable(prev => {
            const newVjList = [...prev];
            newVjList[index] = { ...newVjList[index], [field]: value };
            return newVjList;
        });
    };

    // VJ削除
    const handleRemoveVj = (index) => {
        setVjTimetable(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="w-full flex-shrink-0 space-y-4">
            <h2 className="text-xl font-bold text-on-surface mb-2">VJ タイムテーブル</h2>

            <div className="space-y-4">
                {vjTimetable.map((vj, index) => (
                    <div key={vj.id} className="bg-surface-container rounded-2xl p-4 space-y-3">
                        {/* VJ名 */}
                        <div>
                            <label className="text-xs text-on-surface-variant mb-1 block">VJ Name</label>
                            <input
                                type="text"
                                value={vj.name}
                                onChange={(e) => handleUpdateVj(index, 'name', e.target.value)}
                                className="bg-surface-background text-on-surface p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            />
                        </div>
                        {/* 開始・終了時刻 */}
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-xs text-on-surface-variant mb-1 block">Start Time</label>
                                <input
                                    type="time"
                                    value={vj.startTime}
                                    onChange={(e) => handleUpdateVj(index, 'startTime', e.target.value)}
                                    className="bg-surface-background text-on-surface p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-primary text-center font-mono"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-on-surface-variant mb-1 block">End Time</label>
                                <input
                                    type="time"
                                    value={vj.endTime}
                                    onChange={(e) => handleUpdateVj(index, 'endTime', e.target.value)}
                                    className="bg-surface-background text-on-surface p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-primary text-center font-mono"
                                />
                            </div>
                        </div>
                        {/* 削除ボタン */}
                        <button
                            onClick={() => handleRemoveVj(index)}
                            className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-600 text-sm font-semibold py-1"
                        >
                            <TrashIcon className="w-4 h-4" /> 削除
                        </button>
                    </div>
                ))}
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

    // 
    const {
        schedule,
        eventEndTime,
        currentlyPlayingIndex,
        totalEventDuration,
        recalculateTimes,
        handleEventConfigChange,
        handleUpdate,
        addNewDj,
        executeReset,
        handleRemoveDj,
        handleCopyDj
    } = useTimetable(timetable, eventConfig, setTimetable, setEventConfig, now, setIsResetConfirmOpen);

    // 
    const {
        draggedIndex,
        overIndex,
        isDragging,
        listContainerRef,
        handlePointerDown,
        getDragStyles,
    } = useDragAndDrop(timetable, setTimetable, recalculateTimes, eventConfig.startTime);

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

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto"> {/* ★★★ max-w-7xl から 4xl に戻すっす！ */}
            <ConfirmModal
                isOpen={isResetConfirmOpen}
                title="タイムテーブルをリセット"
                message="すべてのDJと設定が削除されます。この操作は元に戻せません。本当によろしいですか？"
                onConfirm={executeReset}
                onCancel={() => setIsResetConfirmOpen(false)}
            />
            {/* */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                eventConfig={eventConfig}
                handleEventConfigChange={handleEventConfigChange}
                handleShare={handleShare}
                onResetClick={() => {
                    setIsSettingsOpen(false); // 
                    setIsResetConfirmOpen(true); // 
                }}
                theme={theme}
                toggleTheme={toggleTheme}
            />

            {editingDjIndex !== null && (
                <ImageEditModal
                    dj={timetable[editingDjIndex]}
                    onUpdate={(field, value) => handleUpdate(editingDjIndex, field, value)}
                    onClose={() => setEditingDjIndex(null)}
                    storage={storage}
                />
            )}

            {/* */}
            <header className="flex flex-row justify-between items-center mb-4 gap-4">
                {/* */}
                <input
                    type="text"
                    value={eventConfig.title || 'DJ Timekeeper Pro'}
                    onChange={(e) => handleEventConfigChange('title', e.target.value)}
                    className="text-2xl sm:text-3xl font-bold text-brand-secondary tracking-wide bg-transparent focus:outline-none focus:bg-surface-container/50 rounded-lg p-2 flex-1 min-w-0" // 
                    placeholder="イベントタイトル"
                />
                {/* */}
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

            {/* */}
            <div className="mb-6">
                <button onClick={() => timetable.length > 0 && setMode('live')} disabled={timetable.length === 0} className="w-full flex items-center justify-center bg-brand-primary hover:opacity-90 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-full transition-opacity duration-200 shadow-lg">
                    <PlayIcon className="w-5 h-5 mr-2" /><span>Liveモード</span>
                </button>
            </div>


            {/* ★★★ 2カラムレイアウトをやめて、縦積みに戻すっす！ ★★★ */}
            <div className="flex flex-col gap-8">

                {/* --- DJリスト --- */}
                <div className="flex-1 space-y-4">
                    <div className="bg-surface-container rounded-xl p-4">
                        {eventEndTime && (
                            <div className="bg-surface-background text-on-surface-variant font-semibold py-2 px-4 rounded-full text-lg tracking-wider font-mono text-center mb-4 max-w-xs mx-auto">
                                {eventConfig.startTime} - {eventEndTime}
                            </div>
                        )}

                        {totalEventDuration && (
                            <div className="text-center mb-0">
                                <span className="text-xs text-on-surface-variant uppercase">Total DJ Time</span>
                                <p className="text-2xl font-bold text-on-surface">{totalEventDuration}</p>
                            </div>
                        )}
                    </div>

                    {/* ★★★ DJタイムテーブルの見出しを追加っす！ ★★★ */}
                    <h2 className="text-xl font-bold text-on-surface mb-2 mt-4">DJ タイムテーブル</h2>

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
                                        showVjName={false} // 
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

                {/* --- VJリスト --- */}
                {eventConfig.vjFeatureEnabled && (
                    <VjTimetableManager
                        vjTimetable={vjTimetable}
                        setVjTimetable={setVjTimetable}
                    />
                )}
            </div>
            {/* */}
        </div>
    );
};