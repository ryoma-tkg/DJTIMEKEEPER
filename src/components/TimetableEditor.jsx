import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useTimetable } from '../hooks/useTimetable';
import { ImageEditModal } from './ImageEditModal'; // ★★★ インポート
import { DjItem } from './DjItem'; // ★★★ インポート
import {
    CustomTimeInput,
    ConfirmModal,
    PlayIcon,
    PlusIcon,
    CopyIcon,
    ResetIcon,
} from './common';

// --- ImageEditModal (
// ★★★ 
// ★★★ 
// ★★★ 
// ★★★ 
// ★★★ 

// --- DjItem (
// ★★★ 
// ★★★ 
// ★★★ 
// ★★★ 
// ★★★ 

// --- TimetableEditor (
export const TimetableEditor = ({ eventConfig, setEventConfig, timetable, setTimetable, setMode, storage, timeOffset }) => {

    const [openColorPickerId, setOpenColorPickerId] = useState(null);
    const [editingDjIndex, setEditingDjIndex] = useState(null);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [now, setNow] = useState(new Date(new Date().getTime() + timeOffset));

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
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <ConfirmModal
                isOpen={isResetConfirmOpen}
                title="タイムテーブルをリセット"
                message="すべてのDJと設定が削除されます。この操作は元に戻せません。本当によろしいですか？"
                onConfirm={executeReset}
                onCancel={() => setIsResetConfirmOpen(false)}
            />
            {editingDjIndex !== null && (
                <ImageEditModal
                    dj={timetable[editingDjIndex]}
                    onUpdate={(field, value) => handleUpdate(editingDjIndex, field, value)}
                    onClose={() => setEditingDjIndex(null)}
                    storage={storage}
                />
            )}

            <header className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                <input
                    type="text"
                    value={eventConfig.title || 'DJ Timekeeper Pro'}
                    onChange={(e) => handleEventConfigChange('title', e.target.value)}
                    className="text-3xl font-bold text-brand-secondary tracking-wide bg-transparent focus:outline-none focus:bg-surface-container/50 rounded-lg p-2 w-full sm:w-auto"
                    placeholder="イベントタイトル"
                />
                <div className="flex gap-2 w-full sm:w-auto self-center">
                    <button onClick={handleShare} title="Liveモード専用URLをコピー" className="flex items-center justify-center p-3.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-full transition-colors">
                        <CopyIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsResetConfirmOpen(true)} title="すべてリセット" className="flex items-center justify-center p-3.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-full transition-colors">
                        <ResetIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => timetable.length > 0 && setMode('live')} disabled={timetable.length === 0} className="w-full flex items-center justify-center bg-brand-primary hover:opacity-90 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-full transition-opacity duration-200 shadow-lg">
                        <PlayIcon className="w-5 h-5 mr-2" /><span>Liveモード</span>
                    </button>
                </div>
            </header>

            <div className="bg-surface-container/50 rounded-xl p-4 mb-8">
                {eventEndTime && (
                    <div className="bg-surface-container/50 text-on-surface-variant font-semibold py-2 px-4 rounded-full text-lg tracking-wider font-mono text-center mb-4 max-w-xs mx-auto">
                        {eventConfig.startTime} - {eventEndTime}
                    </div>
                )}

                {totalEventDuration && (
                    <div className="text-center mb-4">
                        <span className="text-xs text-on-surface-variant uppercase">Total Time</span>
                        <p className="text-2xl font-bold text-on-surface">{totalEventDuration}</p>
                    </div>
                )}

                <label className="text-xs text-on-surface-variant tracking-wider mb-2 text-center block">イベント開始時間を設定</label>
                <div className="w-full max-w-xs mx-auto">
                    <CustomTimeInput value={eventConfig.startTime} onChange={(v) => handleEventConfigChange('startTime', v)} />
                </div>
            </div>

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
    );
};