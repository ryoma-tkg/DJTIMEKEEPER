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
    const draggingClass = isDragging ? 'dragging-item z-50' : '';
    const containerStyle = isDragging
        ? 'bg-surface-container shadow-[0_5px_10px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.05)] ring-2 ring-brand-primary scale-105'
        : 'bg-surface-background/50 hover:bg-surface-background border border-transparent hover:border-on-surface/10';

    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${containerStyle} ${draggingClass}`}
            style={style}
        >
            <div
                className="cursor-grab touch-none p-2 -m-2 text-on-surface-variant hover:text-on-surface transition-colors"
                onPointerDown={onPointerDown}
            >
                <GripIcon className="w-5 h-5" />
            </div>

            <input
                type="text"
                value={floor.name}
                onChange={(e) => onNameChange(e.target.value)}
                className="flex-grow bg-transparent text-on-surface p-2 rounded-lg focus:outline-none focus:bg-surface-background focus:ring-2 focus:ring-brand-primary font-semibold transition-all"
                placeholder="フロア名"
            />
            <button
                onClick={onDelete}
                className="p-2 rounded-full text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 transition-colors"
                title="フロアを削除"
            >
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
    );
};


export const FloorManagerModal = ({ isOpen, onClose, floors, onSaveFloors }) => {
    const [localFloors, setLocalFloors] = useState({});
    const [deleteId, setDeleteId] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setLocalFloors(floors || {});
        }
    }, [isOpen, floors]);

    const sortedFloorArray = useMemo(() => {
        return Object.entries(localFloors)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [localFloors]);

    const handleNameChange = (floorId, newName) => {
        setLocalFloors(prev => ({
            ...prev,
            [floorId]: {
                ...prev[floorId],
                name: newName
            }
        }));
    };

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

    const handleDeleteClick = (floorId) => {
        if (sortedFloorArray.length <= 1) {
            alert("最後のフロアは削除できません。");
            return;
        }
        setDeleteId(floorId);
    };

    const executeDelete = () => {
        if (!deleteId) return;
        setLocalFloors(prev => {
            const newFloors = { ...prev };
            delete newFloors[deleteId];
            return newFloors;
        });
        setDeleteId(null);
    };

    const handleSave = () => {
        onSaveFloors(localFloors);
        onClose();
    };

    // --- D&Dロジック (変更なし) ---
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

    useEffect(() => {
        if (isDropping) {
            const timer = setTimeout(() => setIsDropping(false), 0);
            return () => clearTimeout(timer);
        }
    }, [isDropping]);

    const handlePointerDown = useCallback((e, index) => {
        e.preventDefault();
        document.body.classList.add('dragging-no-select');

        const itemElement = e.target.closest('.dj-list-item');
        if (!itemElement || !listContainerRef.current) return;

        const itemRect = itemElement.getBoundingClientRect();
        itemHeightRef.current = itemRect.height + 12;

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

    }, []);

    const handlePointerMove = useCallback((e) => {
        if (!dragStartInfoRef.current || !isDragging) return;
        e.preventDefault();

        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        setCurrentY(clientY);

        const { listTop } = dragStartInfoRef.current;
        const itemHeight = itemHeightRef.current;
        if (itemHeight === 0) return;

        const relativeY = clientY - listTop;
        let newOverIndex = Math.floor((relativeY + (itemHeight / 2)) / itemHeight);
        newOverIndex = Math.max(0, Math.min(sortedFloorArray.length, newOverIndex));

        if (newOverIndex !== overIndexRef.current) {
            setOverIndex(newOverIndex);
        }
    }, [isDragging, sortedFloorArray.length]);

    const handlePointerUp = useCallback(() => {
        if (!dragStartInfoRef.current || !isDragging) return;

        setIsDropping(true);
        document.body.classList.remove('dragging-no-select');

        const finalOverIndex = overIndexRef.current;
        const finalDraggedIndex = draggedIndex;

        if (finalDraggedIndex !== null && finalOverIndex !== null && (finalDraggedIndex !== finalOverIndex && finalDraggedIndex !== finalOverIndex - 1)) {
            const newSortedArray = [...sortedFloorArray];
            const [movedItem] = newSortedArray.splice(finalDraggedIndex, 1);
            const targetIndex = finalOverIndex > finalDraggedIndex ? finalOverIndex - 1 : finalOverIndex;
            newSortedArray.splice(targetIndex, 0, movedItem);

            setLocalFloors(prevFloors => {
                const newFloors = { ...prevFloors };
                newSortedArray.forEach((floor, index) => {
                    if (newFloors[floor.id]) {
                        newFloors[floor.id].order = index;
                    }
                });
                return newFloors;
            });
        }

        setDraggedIndex(null);
        setOverIndex(null);
        setCurrentY(0);
        dragStartInfoRef.current = null;
        itemHeightRef.current = 0;

    }, [isDragging, draggedIndex, sortedFloorArray]);

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

        if (index === draggedIndex) {
            const deltaY = currentY - initialY;
            const initialTranslateY = itemTop - (listTop + (index * itemHeight));
            return {
                transform: `translateY(${initialTranslateY + deltaY}px)`,
                transition: 'none',
                zIndex: 20,
            };
        }

        let translateY = 0;
        const localOverIndex = overIndexRef.current;

        if (draggedIndex < localOverIndex) {
            if (index > draggedIndex && index < localOverIndex) {
                translateY = -itemHeight;
            }
        } else if (draggedIndex > localOverIndex) {
            if (index >= localOverIndex && index < draggedIndex) {
                translateY = itemHeight;
            }
        }

        return {
            transform: `translateY(${translateY}px)`,
        };
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
                <div className="bg-surface-container rounded-2xl p-6 w-full max-w-md shadow-2xl relative flex flex-col max-h-[80vh] animate-modal-in" onClick={(e) => e.stopPropagation()}>

                    {/* ヘッダー */}
                    <div className="flex justify-between items-center mb-6 flex-shrink-0">
                        <h2 className="text-2xl font-bold text-on-surface">フロア管理</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-surface-background text-on-surface-variant hover:text-on-surface transition-colors"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* リストコンテナ */}
                    <div
                        // ▼▼▼ 【修正】 パディング(p-4)で影の領域を確保し、ネガティブマージン(-mx-4)で幅を広げる ▼▼▼
                        className="relative z-10 space-y-3 overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-on-surface-variant/20 p-4 -mx-4"
                        ref={listContainerRef}
                    >
                        {sortedFloorArray.map((floor, index) => (
                            <div
                                key={floor.id}
                                className="dj-list-item"
                                style={getDragStyles(index)}
                            >
                                <FloorEditItem
                                    floor={floor}
                                    onNameChange={(newName) => handleNameChange(floor.id, newName)}
                                    onDelete={() => handleDeleteClick(floor.id)}
                                    onPointerDown={(e) => handlePointerDown(e, index)}
                                    isDragging={draggedIndex === index}
                                />
                            </div>
                        ))}

                        <button
                            onClick={handleAddFloor}
                            className="w-full h-16 rounded-xl border-2 border-dashed border-on-surface/10 hover:border-brand-primary hover:bg-brand-primary/5 text-on-surface-variant hover:text-brand-primary transition-all duration-200 flex items-center justify-center gap-2 group mt-2"
                        >
                            <div className="w-8 h-8 rounded-full bg-surface-background group-hover:bg-brand-primary group-hover:text-white flex items-center justify-center transition-colors shadow-sm">
                                <PlusCircleIcon className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-sm">フロアを追加</span>
                        </button>
                    </div>

                    {/* フッター */}
                    <div className="mt-6 pt-6 border-t border-on-surface/10 flex-shrink-0 flex justify-end gap-3">
                        <button onClick={onClose} className="py-2 px-5 rounded-full bg-surface-background hover:bg-on-surface/5 text-on-surface font-semibold transition-colors">
                            キャンセル
                        </button>
                        <button onClick={handleSave} className="py-2 px-6 rounded-full bg-brand-primary hover:opacity-90 text-white font-bold shadow-lg shadow-brand-primary/30 transition-all hover:-translate-y-0.5">
                            保存して閉じる
                        </button>
                    </div>
                </div>
            </div>

            {/* 削除確認モーダル */}
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