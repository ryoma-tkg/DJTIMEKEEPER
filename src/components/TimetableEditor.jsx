// src/components/TimetableEditor.jsx

import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { processImageForUpload } from '../utils/imageProcessor';
import {
    VIVID_COLORS,
    SimpleImage,
    parseTime, // ★ common.jsx から parseTime をインポート
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
} from './common'; // ★ common.jsx から全部インポート

// --- ImageEditModal (変更なし) ---
const ImageEditModal = ({ dj, onUpdate, onClose, storage }) => {
    const [imageUrl, setImageUrl] = useState(dj.imageUrl || '');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const fileInputRef = useRef(null);

    // ★ 1. URL入力欄の表示/非表示を管理する state を追加
    const [isUrlInputVisible, setIsUrlInputVisible] = useState(false);

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

                {/* ★★★ ここからレイアウト変更っす！ ★★★ */}
                <div className="space-y-4">

                    {/* ★ 2. URL入力欄を isUrlInputVisible で囲む */}
                    {isUrlInputVisible && (
                        <div className="animate-fade-in-up"> {/* ふわっと表示 */}
                            <label className="text-sm text-on-surface-variant mb-1 block">Image URL</label>
                            <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="bg-surface-background text-on-surface p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="https://example.com/image.png" />
                        </div>
                    )}

                    {/* ★ アップロードボタンは常時表示 */}
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

                    {/* ★ 3. 「URLで設定」ボタンを追加 (URL入力欄が表示されてない時だけ) */}
                    {!isUrlInputVisible && (
                        <div>
                            <button
                                onClick={() => setIsUrlInputVisible(true)}
                                className="w-full flex items-center justify-center gap-2 bg-surface-background/50 hover:bg-surface-background/80 text-on-surface-variant font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                            >
                                <span>URLで設定する</span>
                            </button>
                        </div>
                    )}
                </div>
                {/* ★★★ レイアウト変更ここまで ★★★ */}

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="py-2 px-5 rounded-full bg-surface-background text-on-surface font-semibold">キャンセル</button>
                    <button onClick={handleSave} disabled={isUploading} className="py-2 px-5 rounded-full bg-brand-primary text-white font-semibold disabled:opacity-50">保存</button>
                </div>
            </div>
        </div>
    );
};

// --- DjItem (★ p-3 -m-3 の修正を適用済み) ---
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
            {/* ★★★ ここが掴み判定を広げた修正っす！ ★★★ */}
            <div
                className="cursor-grab touch-none p-3 -m-3"
                onPointerDown={onPointerDown}
            >
                <GripIcon className="w-6 h-6 text-on-surface-variant shrink-0" />
            </div>
            {/* ★★★ 修正ここまで ★★★ */}

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

// ★★★ TimetableEditor (D&Dロジック 根本修正版) ★★★
export const TimetableEditor = ({ eventConfig, setEventConfig, timetable, setTimetable, setMode, storage, timeOffset }) => {

    // --- ( 既存の State ) ---
    const [openColorPickerId, setOpenColorPickerId] = useState(null);
    const [editingDjIndex, setEditingDjIndex] = useState(null);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [now, setNow] = useState(new Date(new Date().getTime() + timeOffset));
    const [isDropping, setIsDropping] = useState(false); // 

    // --- ( D&D State ) ---
    const [draggedIndex, setDraggedIndex] = useState(null); // 
    const [overIndex, _setOverIndex] = useState(null); // 
    const [currentY, setCurrentY] = useState(0); // 

    // --- ( D&D Ref ) ---
    const listContainerRef = useRef(null); // 
    const itemHeightRef = useRef(0); // 
    const dragStartInfoRef = useRef(null); // ★ state だったのを ref に変更
    const overIndexRef = useRef(null); // 

    // --- ( D&D 派生 State ) ---
    const isDragging = draggedIndex !== null; // 

    // --- ( 既存の Ref Setter ) ---
    const setOverIndex = (index) => {
        _setOverIndex(index);
        overIndexRef.current = index;
    };

    // --- ( 既存の useEffects ... isDropping, now ) ---
    useEffect(() => {
        if (isDropping) {
            const timer = setTimeout(() => setIsDropping(false), 0);
            return () => clearTimeout(timer);
        }
    }, [isDropping]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date(new Date().getTime() + timeOffset)), 1000);
        return () => clearInterval(timer);
    }, [timeOffset]);

    // --- ( ★ 既存の useMemos, CRUD関数 を useMemo でラップ ) ---
    // (stale closure を防ぐため、useEffect の依存配列を安定させる)
    const { schedule, eventEndTime, currentlyPlayingIndex, recalculateTimes, handleEventConfigChange, handleUpdate, addNewDj, executeReset, handleRemoveDj, handleCopyDj } = useMemo(() => {

        // ★ common.jsx からインポートしたので、ここのローカル定義は削除！
        // const parseTime = (timeStr) => { ... };

        const recalculateTimes = (timetableData, eventStartTime) => {
            if (!timetableData || timetableData.length === 0) return [];
            const recalculated = [];
            let lastEndTime = parseTime(eventStartTime); // ★ common の parseTime を使う
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
        };

        const schedule = recalculateTimes(timetable, eventConfig.startTime);
        const eventEndTime = schedule.length > 0 ? schedule[schedule.length - 1].endTime : null;

        // ★ now を Date オブジェクトとして渡す
        const nowTime = new Date(now);
        const currentlyPlayingIndex = schedule.findIndex(dj => {
            const startTime = parseTime(dj.startTime);
            const endTime = parseTime(dj.endTime);
            // 終了時刻が日をまたぐ場合の考慮 (例: 23:00 - 01:00)
            if (endTime < startTime) {
                // now が startTime 以降、または 00:00 以降 endTime 未満
                return (nowTime >= startTime) || (nowTime < endTime);
            }
            // 日をまたがない場合
            return nowTime >= startTime && nowTime < endTime;
        });

        const handleEventConfigChange = (field, value) => {
            setEventConfig(prevConfig => {
                const newConfig = { ...prevConfig, [field]: value };
                if (field === 'startTime') {
                    setTimetable(prevTimetable => recalculateTimes(prevTimetable, value));
                }
                return newConfig;
            });
        };

        const handleUpdate = (index, field, value) => {
            setTimetable(prevTimetable => {
                const newTimetable = [...prevTimetable];
                newTimetable[index] = { ...newTimetable[index], [field]: value };
                if (field === 'duration') {
                    return recalculateTimes(newTimetable, eventConfig.startTime);
                }
                return newTimetable;
            });
        };

        const addNewDj = (isBuffer = false) => {
            setTimetable(prevTimetable => {
                const lastDj = prevTimetable[prevTimetable.length - 1];
                const duration = isBuffer ? 5 : (lastDj ? lastDj.duration : 60);
                const newDjData = { id: Date.now(), name: isBuffer ? 'バッファー' : `DJ ${prevTimetable.filter(d => !d.isBuffer).length + 1}`, duration: duration, imageUrl: '', color: VIVID_COLORS[Math.floor(Math.random() * VIVID_COLORS.length)], isBuffer, };
                return recalculateTimes([...prevTimetable, newDjData], eventConfig.startTime);
            });
        };

        const executeReset = () => {
            setTimetable([]);
            setEventConfig({ title: 'My Awesome Event', startTime: '22:00' });
            setIsResetConfirmOpen(false);
        };

        const handleRemoveDj = (index) => setTimetable(prevTimetable => recalculateTimes(prevTimetable.filter((_, i) => i !== index), eventConfig.startTime));

        const handleCopyDj = (index) => {
            setTimetable(prevTimetable => {
                const djToCopy = { ...prevTimetable[index], id: Date.now() };
                const newTimetable = [...prevTimetable.slice(0, index + 1), djToCopy, ...prevTimetable.slice(index + 1)];
                return recalculateTimes(newTimetable, eventConfig.startTime);
            });
        };

        return { schedule, eventEndTime, currentlyPlayingIndex, recalculateTimes, handleEventConfigChange, handleUpdate, addNewDj, executeReset, handleRemoveDj, handleCopyDj };

    }, [timetable, eventConfig.startTime, now, setEventConfig, setTimetable, setIsResetConfirmOpen]);


    // ★★★ D&Dロジック (useEffectベースに修正) ★★★

    // --- ( 1. 掴んだ瞬間の処理 ) ---
    const handlePointerDown = useCallback((e, index) => {
        if (!e.target.closest('.cursor-grab')) {
            return;
        }
        e.preventDefault(); // ★ preventDefault はここ！
        document.body.classList.add('dragging-no-select');

        const itemElement = e.target.closest('.dj-list-item');
        if (!itemElement || !listContainerRef.current) return;

        const itemRect = itemElement.getBoundingClientRect();
        itemHeightRef.current = itemRect.height + 16; // space-y-4 (1rem)

        const listRect = listContainerRef.current.getBoundingClientRect();
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // ★ Ref に座標情報を保存
        dragStartInfoRef.current = {
            initialY: clientY,
            itemTop: itemRect.top,
            listTop: listRect.top,
        };

        // ★ State を更新してドラッグ開始
        setDraggedIndex(index);
        setOverIndex(index);
        setCurrentY(clientY);

    }, []); // 


    // ★★★ メインの Effect (リスナーの登録・解除) ★★★
    useEffect(() => {

        // --- ( 2. 動かしてる時の処理 ) ---
        const handlePointerMove = (e) => {
            if (!dragStartInfoRef.current) return;

            // ★ passive: false のため、ここで preventDefault
            e.preventDefault();

            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            setCurrentY(clientY); // Y座標を state にセット（追従スタイル用）

            const { listTop } = dragStartInfoRef.current;
            const itemHeight = itemHeightRef.current;
            if (itemHeight === 0) return;

            const relativeY = clientY - listTop;
            let newOverIndex = Math.floor((relativeY + (itemHeight / 2)) / itemHeight);

            // ★ timetable.length が古い可能性があるので、ref経由ではなく直接 timetable を参照
            newOverIndex = Math.max(0, Math.min(timetable.length, newOverIndex));

            if (newOverIndex !== overIndexRef.current) {
                setOverIndex(newOverIndex); // 挿入ラインの state をセット
            }
        };

        // --- ( 3. 離した時の処理 ) ---
        const handlePointerUp = () => {
            if (!dragStartInfoRef.current) return;

            setIsDropping(true); // スナップバック防止用
            document.body.classList.remove('dragging-no-select');

            const finalOverIndex = overIndexRef.current;

            // ★ draggedIndex (state) をここで読む
            if (draggedIndex !== null && finalOverIndex !== null && (draggedIndex !== finalOverIndex && draggedIndex !== finalOverIndex - 1)) {
                setTimetable(prevTimetable => {
                    const newTimetable = [...prevTimetable];
                    const [movedItem] = newTimetable.splice(draggedIndex, 1);

                    // ★ 挿入位置の計算を修正
                    const targetIndex = finalOverIndex > draggedIndex ? finalOverIndex - 1 : finalOverIndex;

                    newTimetable.splice(targetIndex, 0, movedItem);
                    // ★ recalculateTimes (memoized) を呼ぶ
                    return recalculateTimes(newTimetable, eventConfig.startTime);
                });
            }

            // ★ 全ての D&D state と ref をリセット
            setDraggedIndex(null);
            setOverIndex(null);
            setCurrentY(0);
            dragStartInfoRef.current = null;
            itemHeightRef.current = 0;
            // overIndexRef.current は setOverIndex(null) でリセットされる
        };

        // --- ( リスナー登録・解除 ) ---
        if (isDragging) {
            // ★ isDragging (state) が true になったらリスナーを登録
            window.addEventListener('pointermove', handlePointerMove, { passive: false });
            window.addEventListener('touchmove', handlePointerMove, { passive: false });
            window.addEventListener('pointerup', handlePointerUp);
            window.addEventListener('touchend', handlePointerUp);

            return () => {
                // ★ isDragging が false になったらリスナーを解除
                window.removeEventListener('pointermove', handlePointerMove, { passive: false });
                window.removeEventListener('touchmove', handlePointerMove, { passive: false });
                window.removeEventListener('pointerup', handlePointerUp);
                window.removeEventListener('touchend', handlePointerUp);
            };
        }
        // ★ 依存配列 ★
    }, [isDragging, timetable.length, setOverIndex, setIsDropping, setTimetable, recalculateTimes, eventConfig.startTime, draggedIndex]);


    // --- ( 4. スタイルを計算する処理 ) ---
    const getDragStyles = (index) => {
        if (isDropping) {
            return { transform: 'translateY(0px)', transition: 'none' };
        }
        if (!isDragging || !dragStartInfoRef.current) {
            return { transform: 'translateY(0px)' };
        }

        const itemHeight = itemHeightRef.current;
        if (itemHeight === 0) return { transform: 'translateY(0px)' };

        const { initialY, itemTop, listTop } = dragStartInfoRef.current;

        // 1. 掴んでいるアイテム (指に追従)
        if (index === draggedIndex) {
            const deltaY = currentY - initialY;
            // ★ initialTranslateY の計算を修正
            const initialTranslateY = itemTop - (listTop + (index * itemHeight));

            return {
                transform: `translateY(${initialTranslateY + deltaY}px)`,
                transition: 'none',
                zIndex: 20,
            };
        }

        // 2. 掴んでない他のアイテム（押し出される）
        let translateY = 0;

        // ★ overIndex (state) を参照
        if (draggedIndex < overIndex) {
            // 掴んだのが「下」に移動中
            if (index > draggedIndex && index < overIndex) {
                translateY = -itemHeight;
            }
        } else if (draggedIndex > overIndex) {
            // 掴んだのが「上」に移動中
            if (index >= overIndex && index < draggedIndex) {
                translateY = itemHeight;
            }
        }

        return {
            transform: `translateY(${translateY}px)`,
            // zIndex: 1 (dj-list-item のデフォルト)
        };
    };

    // --- ( 5. JSX (描画) ) ---
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
                {schedule.map((dj, index) => { // ★ schedule を map して計算済みの時刻を表示
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
                                dj={dj} // ★ schedule から渡す
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

            {/* --- (フッターボタンも変更なし) --- */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button onClick={() => addNewDj(false)} className="w-full flex items-center justify-center bg-brand-primary hover:opacity-90 text-white font-bold py-3 px-4 rounded-full transition-opacity duration-200"><PlusIcon className="w-5 h-5 mr-2" /><span>DJを追加</span></button>
                <button onClick={() => addNewDj(true)} className="w-full flex items-center justify-center bg-surface-container hover:opacity-90 text-on-surface-variant font-bold py-3 px-4 rounded-full transition-opacity duration-200"><PlusIcon className="w-5 h-5 mr-2" /><span>バッファーを追加</span></button>
            </div>
        </div>
    );
};