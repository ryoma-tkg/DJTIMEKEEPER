// [src/hooks/useDragAndDrop.js]
import { useState, useEffect, useRef, useCallback } from 'react';

export const useDragAndDrop = (timetable, setTimetable, recalculateTimes, eventStartTime) => {
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [overIndex, _setOverIndex] = useState(null);
    const [currentY, setCurrentY] = useState(0);

    // アニメーション制御用フラグ
    const [isDropping, setIsDropping] = useState(false);
    const [dropTargetY, setDropTargetY] = useState(null);

    // データ更新中のフリーズ用フラグ
    const [isCommitting, setIsCommitting] = useState(false);

    const listContainerRef = useRef(null);
    const itemHeightRef = useRef(0);
    const dragStartInfoRef = useRef(null);
    const overIndexRef = useRef(null);

    const isDragging = draggedIndex !== null;

    const setOverIndex = (index) => {
        _setOverIndex(index);
        overIndexRef.current = index;
    };

    // クリーンアップ
    useEffect(() => {
        if (!isDragging && !isDropping && !isCommitting) {
            // 全て終わったら完全にリセット
            setDropTargetY(null);
        }
    }, [isDragging, isDropping, isCommitting]);

    const handlePointerDown = useCallback((e, index) => {
        if (isDropping || isCommitting || !e.target.closest('.cursor-grab')) return;

        e.preventDefault();
        document.body.classList.add('dragging-no-select');

        const itemElement = e.target.closest('.dj-list-item');
        if (!itemElement || !listContainerRef.current) return;

        const itemRect = itemElement.getBoundingClientRect();
        itemHeightRef.current = itemRect.height + 16; // gap-4

        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        dragStartInfoRef.current = {
            initialY: clientY,
            itemTop: itemRect.top,
            listTop: listContainerRef.current.getBoundingClientRect().top,
        };

        setDraggedIndex(index);
        setOverIndex(index);
        setCurrentY(clientY);
        // アニメーション関連のリセット
        setDropTargetY(null);
        setIsDropping(false);
    }, [isDropping, isCommitting]);

    useEffect(() => {
        const handlePointerMove = (e) => {
            if (!dragStartInfoRef.current || isDropping || isCommitting) return;

            e.preventDefault();
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
            if (!dragStartInfoRef.current || isDropping || isCommitting) return;

            const currentIndex = draggedIndex;
            const finalOverIndex = overIndexRef.current;
            const itemHeight = itemHeightRef.current;

            // 1. 移動先の座標を計算（シンプル版）
            let targetIndex = finalOverIndex;
            if (currentIndex < finalOverIndex) {
                targetIndex = finalOverIndex - 1;
            }
            const indexDiff = targetIndex - currentIndex;
            const targetTranslateY = indexDiff * itemHeight;

            console.log(`[DnD] Up: Slide to ${targetTranslateY}px (IndexDiff: ${indexDiff})`);

            // 2. 即座にアニメーションを開始（ここが「遅延なし」のポイント）
            setDropTargetY(targetTranslateY);
            setIsDropping(true);
            document.body.classList.remove('dragging-no-select');

            // 3. アニメーション完了まで待ってからデータを更新
            setTimeout(() => {
                // 4. コミット開始：フリーズを有効化
                setIsCommitting(true);
                console.log("[DnD] Committing...");

                // 5. データ更新
                if (currentIndex !== null && finalOverIndex !== null && (currentIndex !== finalOverIndex && currentIndex !== finalOverIndex - 1)) {
                    setTimetable(prevTimetable => {
                        const newTimetable = [...prevTimetable];
                        const [movedItem] = newTimetable.splice(currentIndex, 1);
                        const insertIndex = (currentIndex < finalOverIndex) ? finalOverIndex - 1 : finalOverIndex;
                        newTimetable.splice(insertIndex, 0, movedItem);
                        return recalculateTimes(newTimetable, eventStartTime);
                    });
                }

                // 6. ステートリセット
                setDraggedIndex(null);
                setOverIndex(null);
                setCurrentY(0);
                setIsDropping(false);
                dragStartInfoRef.current = null;
                itemHeightRef.current = 0;

                // 7. コミット終了：レンダリング完了後にフリーズ解除
                // Reactのレンダリングサイクルを考慮して少し待つ
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        setIsCommitting(false);
                        console.log("[DnD] Commit Done.");
                    }, 50);
                });

            }, 200); // transition-duration (200ms)
        };

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
    }, [isDragging, isDropping, isCommitting, draggedIndex, timetable.length, setTimetable, recalculateTimes, eventStartTime]);

    const getDragStyles = (index) => {
        // ▼▼▼ 【重要】 コミット中（データ書き換え時）は全カードのアニメーションを完全停止 ▼▼▼
        if (isCommitting) {
            return {
                transform: 'translateY(0px)',
                transition: 'none', // アニメーションなしで即座にDOM位置へ戻す
                zIndex: index === draggedIndex ? 20 : 'auto'
            };
        }

        // ドロップ中のアニメーション（指定位置へスゥッと移動）
        if (isDropping && index === draggedIndex) {
            return {
                transform: `translateY(${dropTargetY || 0}px)`,
                transition: 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
                zIndex: 50,
                pointerEvents: 'none',
            };
        }

        // ドラッグ中の追従（遅延なし）
        if (index === draggedIndex && !isDropping) {
            if (!dragStartInfoRef.current) return { transform: 'translateY(0px)' };
            const { initialY } = dragStartInfoRef.current;
            const deltaY = currentY - initialY;
            return {
                transform: `translateY(${deltaY}px)`,
                transition: 'none',
                zIndex: 50,
                pointerEvents: 'none',
            };
        }

        // 周囲のカードの回避アニメーション
        let translateY = 0;
        const localOverIndex = overIndexRef.current;

        // isDropping中も、コミットまでは避けた状態を維持する
        if (draggedIndex !== null && localOverIndex !== null) {
            const itemHeight = itemHeightRef.current;
            if (draggedIndex < localOverIndex) {
                if (index > draggedIndex && index < localOverIndex) translateY = -itemHeight;
            } else if (draggedIndex > localOverIndex) {
                if (index >= localOverIndex && index < draggedIndex) translateY = itemHeight;
            }
        }

        return {
            transform: `translateY(${translateY}px)`,
            transition: 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
        };
    };

    return {
        draggedIndex,
        overIndex,
        isDragging,
        isDropping, // コンポーネント側でScale戻しに使うなら必要
        listContainerRef,
        handlePointerDown,
        getDragStyles,
    };
};