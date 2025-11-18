// [NEW FILE: src/components/FloorManagerModal.jsx]
import React, { useState, useEffect, useMemo } from 'react';
import {
    XIcon,
    PlusCircleIcon,
    TrashIcon,
    GripIcon,
    ConfirmModal
} from './common';

// 1フロア分の編集UI
const FloorEditItem = ({ floor, onNameChange, onDelete }) => {
    return (
        <div className="flex items-center gap-3 p-3 bg-surface-background rounded-lg">
            {/* (将来的なD&D用のグリップ) */}
            <div className="cursor-not-allowed touch-none p-2 -m-2 opacity-50">
                <GripIcon className="w-5 h-5 text-on-surface-variant" />
            </div>

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

// モーダル本体
export const FloorManagerModal = ({ isOpen, onClose, floors, onSaveFloors }) => {
    // 編集中のフロア状態をローカルで持つ
    const [localFloors, setLocalFloors] = useState({});
    // 削除確認モーダル用
    const [deleteId, setDeleteId] = useState(null); // 削除対象のフロアID

    // 1. モーダルが開いた時、渡された `floors` プロパティをローカルstateにコピーする
    useEffect(() => {
        if (isOpen) {
            setLocalFloors(floors || {});
        }
    }, [isOpen, floors]);

    // 2. 編集用のフロア配列を order 順にソートしてメモ化
    const sortedFloorArray = useMemo(() => {
        return Object.entries(localFloors)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [localFloors]);

    // 3. フロア名が変更されたときのハンドラ
    const handleNameChange = (floorId, newName) => {
        setLocalFloors(prev => ({
            ...prev,
            [floorId]: {
                ...prev[floorId],
                name: newName
            }
        }));
    };

    // 4. 新しいフロアを追加
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

    // 5. 削除ボタンが押されたとき (確認モーダルを開く)
    const handleDeleteClick = (floorId) => {
        if (sortedFloorArray.length <= 1) {
            alert("最後のフロアは削除できません。");
            return;
        }
        setDeleteId(floorId);
    };

    // 6. 削除を「実行」
    const executeDelete = () => {
        if (!deleteId) return;

        setLocalFloors(prev => {
            const newFloors = { ...prev };
            delete newFloors[deleteId];
            return newFloors;
        });
        setDeleteId(null); // 確認モーダルを閉じる
    };

    // 7. 保存ボタン (親の EditorPage に変更を通知)
    const handleSave = () => {
        // (onSaveFloors は EditorPage の handleFloorsUpdate)
        onSaveFloors(localFloors);
        onClose(); // モーダルを閉じる
    };


    if (!isOpen) return null;

    return (
        <>
            {/* メインモーダル */}
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in-up" onClick={onClose}>
                <div className="bg-surface-container rounded-2xl p-6 w-full max-w-md shadow-2xl relative flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>

                    {/* ヘッダー */}
                    <div className="flex justify-between items-center mb-6 flex-shrink-0">
                        <h2 className="text-2xl font-bold">フロア管理</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-surface-background text-on-surface-variant hover:text-on-surface"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* フロアリスト (スクロール可能) */}
                    <div className="space-y-3 overflow-y-auto pr-2 flex-grow">
                        {sortedFloorArray.map(floor => (
                            <FloorEditItem
                                key={floor.id}
                                floor={floor}
                                onNameChange={(newName) => handleNameChange(floor.id, newName)}
                                onDelete={() => handleDeleteClick(floor.id)}
                            />
                        ))}
                    </div>

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