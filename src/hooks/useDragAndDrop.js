import { useState, useEffect, useRef, useCallback } from 'react';

export const useDragAndDrop = (timetable, setTimetable, recalculateTimes, eventStartTime) => {
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

    // ドロップ後のちらつき防止用
    useEffect(() => {
        if (isDropping) {
            const timer = setTimeout(() => setIsDropping(false), 0);
            return () => clearTimeout(timer);
        }
    }, [isDropping]);

    const handlePointerDown = useCallback((e, index) => {
        if (!e.target.closest('.cursor-grab')) {
            return;
        }
        e.preventDefault();
        document.body.classList.add('dragging-no-select');

        const itemElement = e.target.closest('.dj-list-item');
        if (!itemElement || !listContainerRef.current) return;

        const itemRect = itemElement.getBoundingClientRect();
        itemHeightRef.current = itemRect.height + 16; // gap-4 (1rem = 16px) を考慮

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

    }, []); // 依存配列は空のままでOKっす

    useEffect(() => {
        const handlePointerMove = (e) => {
            if (!dragStartInfoRef.current) return;

            e.preventDefault(); // スマホでのスクロール誤爆防止

            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            setCurrentY(clientY);

            const { listTop } = dragStartInfoRef.current;
            const itemHeight = itemHeightRef.current;
            if (itemHeight === 0) return;

            const relativeY = clientY - listTop;
            let newOverIndex = Math.floor((relativeY + (itemHeight / 2)) / itemHeight);

            newOverIndex = Math.max(0, Math.min(timetable.length, newOverIndex));

            if (newOverIndex !== overIndexRef.current) {
                setOverIndex(newOverIndex);
            }
        };

        const handlePointerUp = () => {
            if (!dragStartInfoRef.current) return;

            setIsDropping(true);
            document.body.classList.remove('dragging-no-select');

            const finalOverIndex = overIndexRef.current;

            if (draggedIndex !== null && finalOverIndex !== null && (draggedIndex !== finalOverIndex && draggedIndex !== finalOverIndex - 1)) {
                setTimetable(prevTimetable => {
                    const newTimetable = [...prevTimetable];
                    const [movedItem] = newTimetable.splice(draggedIndex, 1);

                    const targetIndex = finalOverIndex > draggedIndex ? finalOverIndex - 1 : finalOverIndex;

                    newTimetable.splice(targetIndex, 0, movedItem);
                    // D&D完了時に時間も再計算
                    return recalculateTimes(newTimetable, eventStartTime);
                });
            }

            setDraggedIndex(null);
            setOverIndex(null);
            setCurrentY(0);
            dragStartInfoRef.current = null;
            itemHeightRef.current = 0;
        };

        if (isDragging) {
            window.addEventListener('pointermove', handlePointerMove, { passive: false });
            window.addEventListener('touchmove', handlePointerMove, { passive: false });
            window.addEventListener('pointerup', handlePointerUp);
            window.addEventListener('touchend', handlePointerUp);

            return () => {
                window.removeEventListener('pointermove', handlePointerMove, { passive: false });
                window.removeEventListener('touchmove', handlePointerMove, { passive: false });
                window.removeEventListener('pointerup', handlePointerUp);
                window.removeEventListener('touchend', handlePointerUp);
            };
        }
    }, [isDragging, timetable.length, setTimetable, recalculateTimes, eventStartTime, draggedIndex]); // 必要な依存関係を追加

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
        const localOverIndex = overIndexRef.current; // refから最新の値を取得

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

    return {
        draggedIndex,
        overIndex,
        isDragging,
        listContainerRef,
        handlePointerDown,
        getDragStyles,
    };
};