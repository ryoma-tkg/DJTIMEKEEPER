// [src/components/FloorManagerModal.jsx]
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    PlusIcon,
    TrashIcon,
    GripIcon,
    ConfirmModal,
    BaseModal,
    Input,
    SparklesIcon // ★追加
} from './common';

// (FloorEditItem - Catalog Style)
const FloorEditItem = ({ floor, onNameChange, onDelete, onPointerDown, isDragging, style }) => {
    // デザインカタログ "NewListItem" のスタイルを適用
    const containerClass = `
        flex items-center gap-3 p-3 rounded-xl 
        bg-surface-background border border-on-surface/10 dark:border-white/10 
        hover:border-brand-primary/50 transition-all group shadow-sm
        ${isDragging ? 'shadow-2xl ring-2 ring-brand-primary scale-105 z-50' : ''}
    `;

    return (
        <div className={containerClass} style={style}>
            <div
                className="cursor-grab touch-none text-on-surface-variant/30 hover:text-on-surface-variant p-1"
                onPointerDown={onPointerDown}
            >
                <GripIcon className="w-4 h-4" />
            </div>

            <input
                type="text"
                value={floor.name}
                onChange={(e) => onNameChange(e.target.value)}
                className="flex-grow bg-transparent font-bold text-on-surface focus:outline-none"
                placeholder="フロア名"
            />

            <button
                onClick={onDelete}
                className="p-2 rounded-full text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 transition-colors"
                title="フロアを削除"
            >
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

export const FloorManagerModal = ({ isOpen, onClose, floors, onSaveFloors, maxFloors = 20 }) => {
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

    // ★追加: 制限チェック
    const isLimitReached = sortedFloorArray.length >= maxFloors;

    const handleNameChange = (floorId, newName) => {
        setLocalFloors(prev => ({ ...prev, [floorId]: { ...prev[floorId], name: newName } }));
    };

    const handleAddFloor = () => {
        if (isLimitReached) return;
        const newFloorId = `floor_${Date.now()}`;
        const newOrder = sortedFloorArray.length > 0 ? Math.max(...sortedFloorArray.map(f => f.order || 0)) + 1 : 0;
        setLocalFloors(prev => ({ ...prev, [newFloorId]: { name: `New Floor ${newOrder + 1}`, order: newOrder, timetable: [], vjTimetable: [] } }));
    };

    const handleDeleteClick = (floorId) => {
        if (sortedFloorArray.length <= 1) { alert("最後のフロアは削除できません。"); return; }
        setDeleteId(floorId);
    };

    const executeDelete = () => {
        if (!deleteId) return;
        setLocalFloors(prev => { const newFloors = { ...prev }; delete newFloors[deleteId]; return newFloors; });
        setDeleteId(null);
    };

    const handleSave = () => { onSaveFloors(localFloors); onClose(); };

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

    const setOverIndex = (index) => { _setOverIndex(index); overIndexRef.current = index; };

    useEffect(() => {
        if (isDropping) { const timer = setTimeout(() => setIsDropping(false), 0); return () => clearTimeout(timer); }
    }, [isDropping]);

    const handlePointerDown = useCallback((e, index) => {
        e.preventDefault();
        document.body.classList.add('dragging-no-select');
        const itemElement = e.target.closest('.dj-list-item');
        if (!itemElement || !listContainerRef.current) return;
        const itemRect = itemElement.getBoundingClientRect();
        itemHeightRef.current = itemRect.height + 12; // gap
        const listRect = listContainerRef.current.getBoundingClientRect();
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        dragStartInfoRef.current = { initialY: clientY, itemTop: itemRect.top, listTop: listRect.top };
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
        if (newOverIndex !== overIndexRef.current) { setOverIndex(newOverIndex); }
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
                newSortedArray.forEach((floor, index) => { if (newFloors[floor.id]) { newFloors[floor.id].order = index; } });
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
        if (isDropping) return { transform: 'translateY(0px)', transition: 'none' };
        if (!isDragging || !dragStartInfoRef.current) return { transform: 'translateY(0px)' };
        const itemHeight = itemHeightRef.current;
        if (itemHeight === 0) return { transform: 'translateY(0px)' };
        const { initialY, itemTop, listTop } = dragStartInfoRef.current;
        if (index === draggedIndex) {
            const deltaY = currentY - initialY;
            const initialTranslateY = itemTop - (listTop + (index * itemHeight));
            return { transform: `translateY(${initialTranslateY + deltaY}px)`, transition: 'none', zIndex: 20 };
        }
        let translateY = 0;
        const localOverIndex = overIndexRef.current;
        if (draggedIndex < localOverIndex) { if (index > draggedIndex && index < localOverIndex) translateY = -itemHeight; }
        else if (draggedIndex > localOverIndex) { if (index >= localOverIndex && index < draggedIndex) translateY = itemHeight; }
        return { transform: `translateY(${translateY}px)` };
    };

    const footerContent = (
        <div className="flex justify-end gap-3">
            <button onClick={onClose} className="text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-on-surface/5 px-4 py-2 rounded-xl transition-colors">キャンセル</button>
            <button onClick={handleSave} className="text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary/90 shadow-lg shadow-brand-primary/30 px-6 py-2 rounded-xl transition-all hover:-translate-y-0.5">保存して閉じる</button>
        </div>
    );

    return (
        <>
            <BaseModal
                isOpen={isOpen}
                onClose={onClose}
                title="フロア管理"
                footer={footerContent}
                isScrollable={true}
                contentRef={listContainerRef}
            >
                <div className="space-y-3">
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

                    {/* Catalog "NewTrigger" Style */}
                    <button
                        onClick={handleAddFloor}
                        disabled={isLimitReached}
                        className={`
                            w-full h-14 rounded-xl 
                            border-2 border-dashed border-on-surface/10 dark:border-white/10
                            bg-transparent 
                            transition-all duration-200 active:scale-[0.98]
                            flex items-center justify-center gap-2 group mt-2
                            ${isLimitReached ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-primary/[0.03] hover:border-brand-primary/40 text-on-surface-variant hover:text-brand-primary'}
                        `}
                    >
                        <div className={`w-6 h-6 rounded-full bg-surface-container border border-on-surface/10 dark:border-white/10 flex items-center justify-center shadow-sm transition-colors ${!isLimitReached && 'group-hover:border-brand-primary/30'}`}>
                            <PlusIcon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm tracking-wide font-sans">
                            {isLimitReached ? "追加できません（上限）" : "フロアを追加"}
                        </span>
                    </button>

                    {/* ★追加: 制限時のメッセージ */}
                    {isLimitReached && maxFloors === 1 && (
                        <div className="mt-2 p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-xl flex items-start gap-3">
                            <SparklesIcon className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-brand-primary mb-0.5">Pro Plan Feature</p>
                                <p className="text-[10px] text-on-surface-variant leading-relaxed">
                                    複数フロア機能は現在準備中です。今後のアップデートをお楽しみに！
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </BaseModal>

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