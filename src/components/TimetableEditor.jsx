import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { processImageForUpload } from '../utils/imageProcessor';
import {
    VIVID_COLORS,
    SimpleImage,
    parseTime,
    CustomTimeInput,
    ConfirmModal,
    PlayIcon,
    PlusIcon,
    TrashIcon,
    GripIcon,
    UserIcon,
    UploadIcon,
    CopyIcon,
    XIcon,
    ResetIcon,
    AlertTriangleIcon
} from './common';

// --- ImageEditModal (変更なし) ---
const ImageEditModal = ({ dj, onUpdate, onClose, storage }) => {
    const [imageUrl, setImageUrl] = useState(dj.imageUrl || '');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !storage) return;
        setIsUploading(true);
        setUploadError(null);
        let processedFileBlob;
        try {
            processedFileBlob = await processImageForUpload(file);
        } catch (processError) {
            console.error("Image processing failed:", processError);
            setUploadError(processError.message || "画像の処理に失敗しました。");
            setIsUploading(false);
            return;
        }
        try {
            const originalName = file.name.replace(/\.[^/.]+$/, "");
            const filePath = `dj_icons/${Date.now()}_${originalName}.jpg`;
            const storageRef = ref(storage, filePath);
            const snapshot = await uploadBytes(storageRef, processedFileBlob);
            const downloadURL = await getDownloadURL(snapshot.ref);
            setImageUrl(downloadURL);
        } catch (error) {
            console.error("Image upload failed:", error);
            setUploadError("アップロードに失敗しました。");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = () => {
        onUpdate('imageUrl', imageUrl);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in-up" onClick={onClose}>
            <div className="bg-surface-container rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">アイコンを設定</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-background"><XIcon className="w-6 h-6" /></button>
                </div>
                <div className="flex items-center justify-center my-6">
                    <div className="w-40 h-40 rounded-full bg-surface-background flex items-center justify-center overflow-hidden">
                        {imageUrl ? <SimpleImage src={imageUrl} className="w-full h-full object-cover" /> : <UserIcon className="w-20 h-20 text-on-surface-variant" />}
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-on-surface-variant mb-1 block">Image URL</label>
                        <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="bg-surface-background text-on-surface p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="https://example.com/image.png" />
                    </div>
                    <div>
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                        <button onClick={() => fileInputRef.current.click()} disabled={isUploading} className="w-full flex items-center justify-center gap-2 bg-surface-background hover:opacity-80 text-on-surface font-semibold py-3 px-4 rounded-lg transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isUploading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span>処理・アップロード中...</span>
                                </>
                            ) : (
                                <>
                                    <UploadIcon className="w-5 h-5" />
                                    <span>ローカルからアップロード</span>
                                </>
                            )}
                        </button>
                        {uploadError && <p className="text-red-400 text-sm mt-2 text-center">{uploadError}</p>}
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="py-2 px-5 rounded-full bg-surface-background text-on-surface font-semibold">キャンセル</button>
                    <button onClick={handleSave} disabled={isUploading} className="py-2 px-5 rounded-full bg-brand-primary text-white font-semibold disabled:opacity-50">保存</button>
                </div>
            </div>
        </div>
    );
};

// --- DjItem (変更なし) ---
const DjItem = memo(({ dj, isPlaying, onPointerDown, onEditClick, onUpdate, onColorPickerToggle, onCopy, onRemove, isColorPickerOpen, openColorPickerId, isDragging }) => {
    const colorPickerRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            const target = event.target;
            if (isColorPickerOpen && colorPickerRef.current && !colorPickerRef.current.contains(target) && !target.closest(`[data-color-picker-trigger="${dj.id}"]`)) {
                onColorPickerToggle(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isColorPickerOpen, dj.id, onColorPickerToggle]);
    const ringClass = isPlaying ? 'ring-2 shadow-[0_0_12px_var(--tw-ring-color)]' : 'ring-1 ring-zinc-700';
    const draggingClass = isDragging ? 'dragging-item' : '';
    return (
        <div
            className={`bg-surface-container rounded-2xl flex items-center gap-4 p-4 ${ringClass} ${draggingClass}`}
            style={{ '--tw-ring-color': isPlaying ? dj.color : 'transparent' }}
        >
            <div className="cursor-grab touch-none" onPointerDown={onPointerDown}>
                <GripIcon className="w-6 h-6 text-on-surface-variant shrink-0" />
            </div>
            <button
                onClick={() => onEditClick()}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-16 h-16 rounded-full bg-surface-background flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-surface-background hover:ring-brand-primary transition-all"
            >
                {dj.imageUrl ? <SimpleImage src={dj.imageUrl} className="w-full h-full object-cover" /> : <UserIcon className="w-8 h-8 text-on-surface-variant" />}
            </button>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex flex-col">
                    <label className="text-xs text-on-surface-variant mb-1">{dj.isBuffer ? 'Title' : 'DJ Name'}</label>
                    <input type="text" value={dj.name} onChange={(e) => onUpdate('name', e.target.value)} className="bg-surface-background text-on-surface p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs text-on-surface-variant mb-1">Time Slot</label>
                    <div className="bg-surface-background/50 p-2 rounded-lg w-full text-center font-semibold text-on-surface-variant font-mono">
                        <span>{dj.startTime}</span>
                        <span className="mx-2">-</span>
                        <span>{dj.endTime}</span>
                    </div>
                </div>
                <div className="flex flex-col md:col-span-2">
                    <label className="text-xs text-on-surface-variant mb-1">Duration (min)</label>
                    <input type="number" value={dj.duration} step="0.1" onChange={(e) => onUpdate('duration', parseFloat(e.target.value) || 0)} className="bg-surface-background text-on-surface p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-primary font-bold text-base" />
                </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0 self-center">
                <div className="relative" ref={colorPickerRef}>
                    <button type="button" data-color-picker-trigger={dj.id} onClick={() => onColorPickerToggle(dj.id === openColorPickerId ? null : dj.id)} className="w-9 h-9 rounded-full ring-2 ring-on-surface-variant" style={{ backgroundColor: dj.color }} />
                    {isColorPickerOpen && (
                        <div className="absolute w-40 bottom-full mb-2 right-0 bg-surface-background p-2 rounded-lg shadow-2xl grid grid-cols-4 gap-2 z-10">
                            {VIVID_COLORS.map(color => (<button key={color} type="button" onClick={() => { onUpdate('color', color); onColorPickerToggle(null); }} className="w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none ring-1 ring-black/20" style={{ backgroundColor: color }} />))}
                        </div>
                    )}
                </div>
                <button onClick={onCopy} className="text-on-surface-variant hover:text-brand-primary p-2 rounded-full transition-colors"><CopyIcon className="w-5 h-5" /></button>
                <button onClick={onRemove} className="text-on-surface-variant hover:text-red-500 p-2 rounded-full transition-colors"><TrashIcon className="w-5 h-5" /></button>
            </div>
        </div>
    );
});

// ★★★ TimetableEditor (D&Dロジック 根本修正) ★★★
export const TimetableEditor = ({ eventConfig, setEventConfig, timetable, setTimetable, setMode, storage, timeOffset }) => {
    const [openColorPickerId, setOpenColorPickerId] = useState(null);
    const [editingDjIndex, setEditingDjIndex] = useState(null);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [now, setNow] = useState(new Date(new Date().getTime() + timeOffset));

    // ★★★ D&Dロジック修正 (State と Ref) ★★★
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [overIndex, _setOverIndex] = useState(null); // 挿入スロット(ラインの位置)
    const [dragStartInfo, setDragStartInfo] = useState(null); // 掴んだ瞬間の情報
    const [currentY, setCurrentY] = useState(0); // 現在のカーソルのY座標

    const listContainerRef = useRef(null); // リストDOM
    const itemHeightRef = useRef(0); // アイテムの高さ（マージン込）

    // ★ overIndex を Ref にも保存（stale closure 対策）
    const overIndexRef = useRef(null);
    const setOverIndex = (index) => {
        _setOverIndex(index);
        overIndexRef.current = index;
    };

    const isDragging = draggedIndex !== null;

    // --- (時間計算系は変更なし) ---
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date(new Date().getTime() + timeOffset)), 1000);
        return () => clearInterval(timer);
    }, [timeOffset]);

    const schedule = useMemo(() => {
        if (timetable.length === 0) return [];
        const scheduleData = [];
        let lastEndTime = parseTime(eventConfig.startTime);
        for (const dj of timetable) {
            const startTime = new Date(lastEndTime);
            const durationMinutes = parseFloat(dj.duration) || 0;
            const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
            scheduleData.push({ ...dj, startTime, endTime });
            lastEndTime = endTime;
        }
        return scheduleData;
    }, [timetable, eventConfig.startTime]);

    const eventEndTime = useMemo(() => {
        if (schedule.length === 0) return null;
        return schedule[schedule.length - 1].endTime.toTimeString().slice(0, 5);
    }, [schedule]);

    const currentlyPlayingIndex = useMemo(() => schedule.findIndex(dj => now >= dj.startTime && now < dj.endTime), [now, schedule]);

    const recalculateTimes = useCallback((timetableData, eventStartTime) => {
        if (!timetableData || timetableData.length === 0) return [];
        const recalculated = [];
        let lastEndTime = parseTime(eventStartTime);
        for (let i = 0; i < timetableData.length; i++) {
            const currentDjData = { ...timetableData[i] };
            const currentStartTime = new Date(lastEndTime);
            const durationMinutes = parseFloat(currentDjData.duration) || 0;
            const currentEndTime = new Date(currentStartTime.getTime() + durationMinutes * 60 * 1000);
            recalculated.push({
                ...currentDjData,
                startTime: currentStartTime.toTimeString().slice(0, 5),
                endTime: currentEndTime.toTimeString().slice(0, 5),
            });
            lastEndTime = currentEndTime;
        }
        return recalculated;
    }, []);

    // --- (CRUD操作系も変更なし) ---
    const handleEventConfigChange = useCallback((field, value) => {
        setEventConfig(prevConfig => {
            const newConfig = { ...prevConfig, [field]: value };
            if (field === 'startTime') {
                setTimetable(prevTimetable => recalculateTimes(prevTimetable, value));
            }
            return newConfig;
        });
    }, [recalculateTimes, setTimetable, setEventConfig]);

    const handleUpdate = useCallback((index, field, value) => {
        setTimetable(prevTimetable => {
            const newTimetable = [...prevTimetable];
            newTimetable[index] = { ...newTimetable[index], [field]: value };
            if (field === 'duration') {
                return recalculateTimes(newTimetable, eventConfig.startTime);
            }
            return newTimetable;
        });
    }, [eventConfig.startTime, recalculateTimes, setTimetable]);

    const addNewDj = useCallback((isBuffer = false) => {
        setTimetable(prevTimetable => {
            const lastDj = prevTimetable[prevTimetable.length - 1];
            const duration = isBuffer ? 5 : (lastDj ? lastDj.duration : 60);
            const newDjData = { id: Date.now(), name: isBuffer ? 'バッファー' : `DJ ${prevTimetable.filter(d => !d.isBuffer).length + 1}`, duration: duration, imageUrl: '', color: VIVID_COLORS[Math.floor(Math.random() * VIVID_COLORS.length)], isBuffer, };
            return recalculateTimes([...prevTimetable, newDjData], eventConfig.startTime);
        });
    }, [eventConfig.startTime, recalculateTimes, setTimetable]);

    const executeReset = useCallback(() => {
        setTimetable([]);
        setEventConfig({ title: 'My Awesome Event', startTime: '22:00' });
        setIsResetConfirmOpen(false);
    }, [setTimetable, setEventConfig]);

    const handleRemoveDj = useCallback((index) => setTimetable(prevTimetable => recalculateTimes(prevTimetable.filter((_, i) => i !== index), eventConfig.startTime)), [eventConfig.startTime, recalculateTimes, setTimetable]);

    const handleCopyDj = useCallback((index) => {
        setTimetable(prevTimetable => {
            const djToCopy = { ...prevTimetable[index], id: Date.now() };
            const newTimetable = [...prevTimetable.slice(0, index + 1), djToCopy, ...prevTimetable.slice(index + 1)];
            return recalculateTimes(newTimetable, eventConfig.startTime);
        });
    }, [eventConfig.startTime, recalculateTimes, setTimetable]);

    // ★★★ D&Dロジック (全体見直し) ★★★

    // --- ( 2. 動かしてる時の処理 ) ---
    const handlePointerMove = useCallback((e) => {
        if (!dragStartInfo) return;

        // ★ スクロールと文字選択を止める
        e.preventDefault();

        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        setCurrentY(clientY); // 現在のY座標を更新 (これで掴んだ要素が追従する)

        const { listTop } = dragStartInfo;
        const itemHeight = itemHeightRef.current;
        if (itemHeight === 0) return;

        // リストの上端から、今カーソルがある位置までの相対Y座標 (ビューポート基準)
        const relativeY = clientY - listTop;
        // どのインデックススロットの上にいるか (アイテムの真ん中を基準)
        let newOverIndex = Math.floor((relativeY + (itemHeight / 2)) / itemHeight);

        // 範囲外にいかないように丸める (0 〜 timetable.length の間)
        newOverIndex = Math.max(0, Math.min(timetable.length, newOverIndex));

        // 変更があった時だけ state (と ref) を更新
        if (newOverIndex !== overIndexRef.current) {
            setOverIndex(newOverIndex);
        }

    }, [dragStartInfo, timetable.length]); // ★ 依存配列は dragStartInfo だけでOK

    // --- ( 3. 離した時の処理 ) ---
    const handlePointerUp = useCallback(() => {
        if (!dragStartInfo) return; // 掴んでなかったら即終了

        // ★ 文字選択禁止を解除
        document.body.classList.remove('dragging-no-select');

        // ★★★ Stale Closure 対策！ Ref から最新の挿入位置を取得 ★★★
        const finalOverIndex = overIndexRef.current;

        // ★ draggedIndex は state から取ってきてもOK (downの瞬間にセットされてるから)
        if (draggedIndex !== null && finalOverIndex !== null && draggedIndex !== finalOverIndex) {
            // ★ state を更新して、並び替えを確定させる
            setTimetable(prevTimetable => {
                const newTimetable = [...prevTimetable];
                const [movedItem] = newTimetable.splice(draggedIndex, 1);

                // 挿入先のインデックスを計算
                // (下に動かした場合、抜き取った分インデックスが1つズレるため)
                const targetIndex = finalOverIndex > draggedIndex ? finalOverIndex - 1 : finalOverIndex;

                newTimetable.splice(targetIndex, 0, movedItem);

                return recalculateTimes(newTimetable, eventConfig.startTime);
            });
        }

        // 全てのD&Dステートをリセット
        setDraggedIndex(null);
        setOverIndex(null); // ( _setOverIndex と overIndexRef.current の両方をリセット)
        setDragStartInfo(null);
        setCurrentY(0);
        itemHeightRef.current = 0; // アイテム高さもリセット

        // イベントリスナーを解除
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('touchmove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('touchend', handlePointerUp);

    }, [dragStartInfo, draggedIndex, eventConfig.startTime, recalculateTimes, setTimetable, handlePointerMove]); // ★ 依存配列を修正

    // --- ( 1. 掴んだ瞬間の処理 ) ---
    const handlePointerDown = useCallback((e, index) => {
        if (!e.target.closest('.cursor-grab')) {
            return; // グリップ以外は無視
        }
        // e.preventDefault(); // passive:false のため move 側で実行

        // ★ 文字選択モードになるのを防ぐ
        document.body.classList.add('dragging-no-select');

        const itemElement = e.target.closest('.dj-list-item');
        if (!itemElement || !listContainerRef.current) return;

        // ★ アイテムの高さをRefに保存 (space-y-4 の 16px も足す)
        const itemRect = itemElement.getBoundingClientRect();
        itemHeightRef.current = itemRect.height + 16;

        const listRect = listContainerRef.current.getBoundingClientRect();
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // D&Dの基準情報をセット
        setDraggedIndex(index);
        setOverIndex(index); // ( _setOverIndex と overIndexRef.current の両方をセット)
        setCurrentY(clientY);

        setDragStartInfo({
            initialY: clientY, // 掴んだ瞬間のビューポートY
            itemTop: itemRect.top, // 掴んだアイテムの初期ビューポートY
            listTop: listRect.top, // リスト全体の初期ビューポートY
        });

        // ★ passive: false を指定して、スクロールとD&Dを両立
        window.addEventListener('pointermove', handlePointerMove, { passive: false });
        window.addEventListener('touchmove', handlePointerMove, { passive: false });
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('touchend', handlePointerUp);

    }, [handlePointerMove, handlePointerUp]); // ★ 依存配列を修正

    // --- ( 4. スタイルを計算する処理 ) ---
    const getDragStyles = (index) => {
        if (!isDragging || !dragStartInfo) return { transform: 'translateY(0px)' };

        const itemHeight = itemHeightRef.current;
        if (itemHeight === 0) return { transform: 'translateY(0px)' };

        const { initialY, itemTop } = dragStartInfo;

        // 1. 掴んでいるアイテム (指に追従)
        if (index === draggedIndex) {
            const deltaY = currentY - initialY; // 掴んだ場所からの移動量
            // 本来のY座標と、掴んだアイテムの初期Y座標の差分
            const initialTranslateY = itemTop - (dragStartInfo.listTop + (index * itemHeight));

            return {
                transform: `translateY(${initialTranslateY + deltaY}px)`,
                transition: 'none', // 追従中はアニメーションしない
                zIndex: 20,
            };
        }

        // 2. 掴んでない他のアイテム（押し出される）
        let translateY = 0;

        // ★ overIndex は state から読む (CSSの押し出しアニメ用)
        if (draggedIndex < overIndex) {
            // 掴んだのが「下」に移動中
            // 範囲：(掴んだ位置 + 1) 〜 (挿入位置 - 1)
            if (index > draggedIndex && index < overIndex) {
                translateY = -itemHeight; // 上に詰める
            }
        } else if (draggedIndex > overIndex) {
            // 掴んだのが「上」に移動中
            // 範囲：(挿入位置) 〜 (掴んだ位置 - 1)
            if (index >= overIndex && index < draggedIndex) {
                translateY = itemHeight; // 下に開ける
            }
        }

        return {
            transform: `translateY(${translateY}px)`,
            // zIndex: 1 (dj-list-item のデフォルト)
        };
    };

    // --- ( 共有ボタン ) ---
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

    // --- ( 5. JSX (描画) ) ---
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
            {/* --- (ヘッダー部分は変更なし) --- */}
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
            {/* --- (イベント開始時間も変更なし) --- */}
            <div className="bg-surface-container/50 rounded-xl p-4 mb-8">
                {eventEndTime && (
                    <div className="bg-surface-container/50 text-on-surface-variant font-semibold py-2 px-4 rounded-full text-lg tracking-wider font-mono text-center mb-4 max-w-xs mx-auto">
                        {eventConfig.startTime} - {eventEndTime}
                    </div>
                )}
                <label className="text-xs text-on-surface-variant tracking-wider mb-2 text-center block">イベント開始時間を設定</label>
                <div className="w-full max-w-xs mx-auto">
                    <CustomTimeInput value={eventConfig.startTime} onChange={(v) => handleEventConfigChange('startTime', v)} />
                </div>
            </div>

            {/* ★ リストのラッパーに ref を設定 */}
            <div className="space-y-4" ref={listContainerRef}>
                {timetable.map((dj, index) => {
                    // ★★★ 挿入ガイドのロジック (クリーンアップ) ★★★
                    let dropIndicatorClass = '';
                    if (isDragging) {
                        // 挿入スロット(overIndex)が「今見てるアイテム(index)」の位置なら
                        if (index === overIndex) {
                            dropIndicatorClass = 'drop-indicator-before';
                        }
                        // 挿入スロットが「一番最後」で、今見てるアイテムが「リストの最後」なら
                        if (overIndex === timetable.length && index === timetable.length - 1) {
                            dropIndicatorClass = 'drop-indicator-after';
                        }
                    }

                    return (
                        <div
                            key={dj.id}
                            data-dj-index={index}
                            className={`dj-list-item ${dropIndicatorClass}`}
                            style={getDragStyles(index)} // ★ CSS transform を適用
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

            {/* ★ 一番下に追加するガイドラインは、 `map` の外だと `space-y-4` が効かないので、
                最後の要素の `drop-indicator-after` で処理するのが正解っす！
                なのでここのダミー要素は削除！
            */}

            {/* --- (フッターボタンも変更なし) --- */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button onClick={() => addNewDj(false)} className="w-full flex items-center justify-center bg-brand-primary hover:opacity-90 text-white font-bold py-3 px-4 rounded-full transition-opacity duration-200"><PlusIcon className="w-5 h-5 mr-2" /><span>DJを追加</span></button>
                <button onClick={() => addNewDj(true)} className="w-full flex items-center justify-center bg-surface-container hover:opacity-90 text-on-surface-variant font-bold py-3 px-4 rounded-full transition-opacity duration-200"><PlusIcon className="w-5 h-5 mr-2" /><span>バッファーを追加</span></button>
            </div>
        </div>
    );
};