// [src/components/FloorManagerModal.jsx]
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    XIcon,
    PlusCircleIcon,
    TrashIcon,
    GripIcon,
    ConfirmModal
} from './common';

// (FloorEditItem - 変更なし)
const FloorEditItem = ({ floor, onNameChange, onDelete, onPointerDown, isDragging, style }) => {
    // ▼▼▼ 【!!! 修正 !!!】 D&D用のクラスを追加 ▼▼▼
    const draggingClass = isDragging ? 'dragging-item' : '';
    const ringClass = isDragging ? 'ring-2 ring-brand-primary shadow-lg' : 'ring-1 ring-zinc-700/50';

    return (
        <div
            className={`flex items-center gap-3 p-3 bg-surface-background rounded-lg ${draggingClass} ${ringClass}`}
            style={style} // D&Dの座標を適用
        >
            {/* ▼▼▼ 【!!! 修正 !!!】 D&Dの起点にする ▼▼▼ */}
            <div
                className="cursor-grab touch-none p-2 -m-2 opacity-100"
                onPointerDown={onPointerDown} // ★ D&D開始イベント
            >
                <GripIcon className="w-5 h-5 text-on-surface-variant" />
            </div>
            {/* ▲▲▲ 修正ここまで ▲▲▲ */}

            <input
                type="text"
                value={floor.name}
                onChange={(e) => onNameChange(e.target.value)}
                className="flex-grow bg-surface-container text-on-surface p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="フロア名"
            />
            <button
                onClick={onDelete}
                className="p-2 rounded-full text-on-surface-variant hover:text-red-500 hover:bg-red-500/10"
                title="フロアを削除"
            >
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
    );
};


// ▼▼▼ 【!!! 修正 !!!】 D&Dロジックをモーダル本体に追加 ▼▼▼
export const FloorManagerModal = ({ isOpen, onClose, floors, onSaveFloors }) => {
    // 編集中のフロア状態
    const [localFloors, setLocalFloors] = useState({});
    // 削除確認モーダル用
    const [deleteId, setDeleteId] = useState(null);

    // 1. モーダルが開いた時、渡された `floors` プロパティをローカルstateにコピーする
    useEffect(() => {
        if (isOpen) {
            setLocalFloors(floors || {});
        }
    }, [isOpen, floors]);

    // 2. 編集用のフロア配列を order 順にソートしてメモ化
    // (useMemo の中身は変更なし)
    const sortedFloorArray = useMemo(() => {
        return Object.entries(localFloors)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [localFloors]);

    // 3. フロア名が変更されたときのハンドラ (変更なし)
    const handleNameChange = (floorId, newName) => {
        setLocalFloors(prev => ({
            ...prev,
            [floorId]: {
                ...prev[floorId],
                name: newName
            }
        }));
    };

    // 4. 新しいフロアを追加 (変更なし)
    const handleAddFloor = () => {
        const newFloorId = `floor_${Date.now()}`;
        const newOrder = sortedFloorArray.length > 0
            ? Math.max(...sortedFloorArray.map(f => f.order || 0)) + 1
            : 0;

        setLocalFloors(prev => ({
            ...prev,
            [newFloorId]: {
                name: `New Floor ${newOrder + 1}`,
                order: newOrder,
                timetable: [],
                vjTimetable: []
            }
        }));
    };

    // 5. 削除ボタン (変更なし)
    const handleDeleteClick = (floorId) => {
        if (sortedFloorArray.length <= 1) {
            alert("最後のフロアは削除できません。");
            return;
        }
        setDeleteId(floorId);
    };

    // 6. 削除を実行 (変更なし)
    const executeDelete = () => {
        if (!deleteId) return;
        setLocalFloors(prev => {
            const newFloors = { ...prev };
            delete newFloors[deleteId];
            return newFloors;
        });
        setDeleteId(null);
    };

    // 7. 保存ボタン
    const handleSave = () => {
        // ★ D&Dによって `order` が更新された localFloors を保存する
        onSaveFloors(localFloors);
        onClose();
    };

    // --- ▼▼▼ ここからD&Dロジック ▼▼▼ ---

    const [draggedIndex, setDraggedIndex] = useState(null);
    const [overIndex, _setOverIndex] = useState(null);
    const [currentY, setCurrentY] = useState(0);
    const [isDropping, setIsDropping] = useState(false);

    const listContainerRef = useRef(null);
    const itemHeightRef = useRef(0);
    const dragStartInfoRef = useRef(null);
    const overIndexRef = useRef(null);
    const isDragging = draggedIndex !== null;

    const setOverIndex = (index) => {
        _setOverIndex(index);
        overIndexRef.current = index;
    };

    // ドロップ後のちらつき防止用 (変更なし)
    useEffect(() => {
        if (isDropping) {
            const timer = setTimeout(() => setIsDropping(false), 0);
            return () => clearTimeout(timer);
        }
    }, [isDropping]);

    // (D&D) 1. ドラッグ開始
    const handlePointerDown = useCallback((e, index) => {
        e.preventDefault();
        document.body.classList.add('dragging-no-select');

        const itemElement = e.target.closest('.dj-list-item'); // (親コンポーネントのクラス名だが、ここではアイテムの高さを取るために流用)
        if (!itemElement || !listContainerRef.current) return;

        const itemRect = itemElement.getBoundingClientRect();
        itemHeightRef.current = itemRect.height + 12; // gap-3 (0.75rem = 12px) を考慮

        const listRect = listContainerRef.current.getBoundingClientRect();
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        dragStartInfoRef.current = {
            initialY: clientY,
            itemTop: itemRect.top,
            listTop: listRect.top,
        };

        setDraggedIndex(index);
        setOverIndex(index);
        setCurrentY(clientY);

    }, []); // 依存配列なし

    // (D&D) 2. ドラッグ中 (移動)
    const handlePointerMove = useCallback((e) => {
        if (!dragStartInfoRef.current || !isDragging) return;
        e.preventDefault();

        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        setCurrentY(clientY);

        const { listTop } = dragStartInfoRef.current;
        const itemHeight = itemHeightRef.current;
        if (itemHeight === 0) return;

        // リストの上端からの相対Y座標を計算
        const relativeY = clientY - listTop;
        // どのインデックスの上にいるか計算 (アイテムの半分の高さで判定)
        let newOverIndex = Math.floor((relativeY + (itemHeight / 2)) / itemHeight);
        newOverIndex = Math.max(0, Math.min(sortedFloorArray.length, newOverIndex));

        if (newOverIndex !== overIndexRef.current) {
            setOverIndex(newOverIndex);
        }
    }, [isDragging, sortedFloorArray.length]); // 依存配列に注意

    // (D&D) 3. ドロップ (並び替え実行)
    const handlePointerUp = useCallback(() => {
        if (!dragStartInfoRef.current || !isDragging) return;

        setIsDropping(true); // ちらつき防止フラグ
        document.body.classList.remove('dragging-no-select');

        const finalOverIndex = overIndexRef.current;
        const finalDraggedIndex = draggedIndex;

        // 位置が変わった場合のみ並び替えを実行
        if (finalDraggedIndex !== null && finalOverIndex !== null && (finalDraggedIndex !== finalOverIndex && finalDraggedIndex !== finalOverIndex - 1)) {

            // 1. 現在のソート済み配列をコピー
            const newSortedArray = [...sortedFloorArray];

            // 2. アイテムを移動
            const [movedItem] = newSortedArray.splice(finalDraggedIndex, 1);
            const targetIndex = finalOverIndex > finalDraggedIndex ? finalOverIndex - 1 : finalOverIndex;
            newSortedArray.splice(targetIndex, 0, movedItem);

            // 3. ★★★ ここが重要 ★★★
            // 新しい配列の順序 (index) を、localFloors の `order` プロパティに書き戻す
            setLocalFloors(prevFloors => {
                const newFloors = { ...prevFloors };
                newSortedArray.forEach((floor, index) => {
                    if (newFloors[floor.id]) {
                        newFloors[floor.id].order = index; // order を 0, 1, 2... と振り直す
                    }
                });
                return newFloors;
            });
        }

        // D&Dステートをリセット
        setDraggedIndex(null);
        setOverIndex(null);
        setCurrentY(0);
        dragStartInfoRef.current = null;
        itemHeightRef.current = 0;

    }, [isDragging, draggedIndex, sortedFloorArray]); // 依存配列に注意

    // (D&D) 4. イベントリスナーの登録・解除
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('pointermove', handlePointerMove, { passive: false });
            window.addEventListener('touchmove', handlePointerMove, { passive: false });
            window.addEventListener('pointerup', handlePointerUp);
            window.addEventListener('touchend', handlePointerUp);

            return () => {
                window.removeEventListener('pointermove', handlePointerMove);
                window.removeEventListener('touchmove', handlePointerMove);
                window.removeEventListener('pointerup', handlePointerUp);
                window.removeEventListener('touchend', handlePointerUp);
            };
        }
    }, [isDragging, handlePointerMove, handlePointerUp]);

    // (D&D) 5. 各アイテムのスタイル（Y座標）を計算
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

        // 1. ドラッグ中のアイテム
        if (index === draggedIndex) {
            const deltaY = currentY - initialY;
            const initialTranslateY = itemTop - (listTop + (index * itemHeight)); // 
            return {
                transform: `translateY(${initialTranslateY + deltaY}px)`,
                transition: 'none',
                zIndex: 20,
            };
        }

        // 2. 他
        let translateY = 0;
        const localOverIndex = overIndexRef.current;

        if (draggedIndex < localOverIndex) { // 下に移動中
            if (index > draggedIndex && index < localOverIndex) {
                translateY = -itemHeight; // 上に詰める
            }
        } else if (draggedIndex > localOverIndex) { // 上に移動中
            if (index >= localOverIndex && index < draggedIndex) {
                translateY = itemHeight; // 下にずらす
            }
        }

        return {
            transform: `translateY(${translateY}px)`,
        };
    };

    // --- ▲▲▲ D&Dロジックここまで ▲▲▲ ---


    if (!isOpen) return null;

    return (
        <>
            {/* メインモーダル */}
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in-up" onClick={onClose}>
                <div className="bg-surface-container rounded-2xl p-6 w-full max-w-md shadow-2xl relative flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>

                    {/* ヘッダー (変更なし) */}
                    <div className="flex justify-between items-center mb-6 flex-shrink-0">
                        <h2 className="text-2xl font-bold">フロア管理</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-surface-background text-on-surface-variant hover:text-on-surface"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* ▼▼▼ 【!!! 修正 !!!】 D&D用のラッパーを追加 ▼▼▼ */}
                    <div
                        className="space-y-3 overflow-y-auto pr-2 flex-grow"
                        ref={listContainerRef} // ★ D&Dのコンテナとして参照
                    >
                        {sortedFloorArray.map((floor, index) => (
                            <div
                                key={floor.id}
                                className="dj-list-item" // ★ D&Dの高さ計算やスタイル適用のためにクラス名を付与
                                style={getDragStyles(index)} // ★ Y座標を適用
                            >
                                <FloorEditItem
                                    floor={floor}
                                    onNameChange={(newName) => handleNameChange(floor.id, newName)}
                                    onDelete={() => handleDeleteClick(floor.id)}
                                    onPointerDown={(e) => handlePointerDown(e, index)} // ★ D&D開始
                                    isDragging={draggedIndex === index}
                                />
                            </div>
                        ))}
                    </div>
                    {/* ▲▲▲ 修正ここまで ▲▲▲ */}

                    {/* フッター (ボタン類) */}
                    <div className="mt-6 pt-6 border-t border-surface-background flex-shrink-0">
                        <button
                            onClick={handleAddFloor}
                            className="w-full flex items-center justify-center gap-2 bg-surface-background hover:opacity-80 text-on-surface font-semibold py-3 px-4 rounded-lg transition-colors duration-200 mb-4"
                        >
                            <PlusCircleIcon className="w-5 h-5" />
                            <span>フロアを追加</span>
                        </button>
                        <div className="flex justify-end gap-3">
                            <button onClick={onClose} className="py-2 px-5 rounded-full bg-surface-background text-on-surface font-semibold">
                                キャンセル
                            </button>
                            <button onClick={handleSave} className="py-2 px-5 rounded-full bg-brand-primary text-white font-semibold">
                                保存して閉じる
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 削除確認モーダル (変更なし) */}
            <ConfirmModal
                isOpen={!!deleteId}
                title="フロアを削除"
                message={`フロア「${localFloors[deleteId]?.name}」を削除します。このフロアのタイムテーブルはすべて失われます。本当によろしいですか？`}
                onConfirm={executeDelete}
                onCancel={() => setDeleteId(null)}
            />
        </>
    );
};