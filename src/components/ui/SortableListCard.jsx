// [src/components/ui/SortableListCard.jsx]
import React, { useState } from 'react';
import { GripIcon, TrashIcon, CopyIcon, AlertTriangleIcon } from '../common';
import { Input } from './Input';

/**
 * DJ/VJアイテム共通のリストカードコンポーネント
 */
export const SortableListCard = ({
    item,
    isPlaying,
    isDragging,
    onPointerDown,
    onUpdate,
    onRemove,
    onCopy,
    iconNode,
    actionNode,
    labelName = "Name"
}) => {
    const [isHovered, setIsHovered] = useState(false);

    // バリデーションチェック
    const isNameError = !item.name || item.name.trim() === '';
    const isDurationError = item.duration === '' || item.duration === 0; // 0も警告対象にするならこちら

    // ドラッグ中のスタイル
    const draggingClass = isDragging
        ? 'dragging-item shadow-[0_20px_30px_-5px_rgba(0,0,0,0.3)] scale-105 z-50'
        : 'transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)';

    // ボーダー設定
    const borderClass = isPlaying
        ? 'border'
        : 'border border-on-surface/10 dark:border-white/5';

    // 動的スタイル生成
    let dynamicStyle = {
        '--tw-ring-color': isPlaying ? (item.color || 'rgb(var(--color-brand-primary))') : 'transparent'
    };

    if (!isDragging) {
        if (isPlaying) {
            const baseColor = item.color || '#007bff';
            const glowColorHover = `${baseColor}66`;
            const glowColorRest = `${baseColor}40`;

            dynamicStyle = {
                borderColor: baseColor,
                transform: 'translateY(0)',
                boxShadow: isHovered
                    ? `0 20px 30px -5px rgba(0, 0, 0, 0.2), 0 0 35px 5px ${glowColorHover}`
                    : `0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 20px 0px ${glowColorRest}`,
                zIndex: isHovered ? 10 : 1,
            };
        } else {
            dynamicStyle = {
                transform: 'translateY(0)',
                boxShadow: isHovered
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            };
        }
    }

    const handleDurationChange = (e) => {
        const val = e.target.value;
        if (val === '') {
            onUpdate('duration', '');
            return;
        }
        if (val.endsWith('.') || (val.includes('.') && val.endsWith('0'))) {
            onUpdate('duration', val);
        } else {
            onUpdate('duration', parseFloat(val));
        }
    };

    return (
        <div
            className={`
                bg-surface-container rounded-2xl flex items-stretch gap-4 p-4 
                ${borderClass} ${draggingClass}
            `}
            style={dynamicStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* 1. ドラッグハンドル */}
            <div
                className="cursor-grab touch-none p-3 -m-3 flex items-center self-stretch text-on-surface-variant hover:text-on-surface transition-colors"
                onPointerDown={onPointerDown}
            >
                <GripIcon className="w-6 h-6 shrink-0" />
            </div>

            {/* 2. アイコンエリア */}
            <div className="shrink-0 self-center">
                {iconNode || <div className="w-4" />}
            </div>

            {/* 3. 入力フォームエリア */}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex flex-col">
                    <label className="text-xs text-on-surface-variant mb-1 font-bold ml-1">{labelName}</label>
                    {/* ▼▼▼ 修正: error プロップを使用 (メッセージを渡す) ▼▼▼ */}
                    <Input
                        value={item.name}
                        onChange={(e) => onUpdate('name', e.target.value)}
                        className="font-bold text-lg"
                        error={isNameError ? "必須" : null}
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-xs text-on-surface-variant mb-1 font-bold ml-1">Duration (min)</label>
                    {/* ▼▼▼ 修正: error プロップを使用 ▼▼▼ */}
                    <Input
                        type="number"
                        value={item.duration}
                        step="1"
                        min="0"
                        onFocus={(e) => e.target.select()}
                        onChange={handleDurationChange}
                        className="font-mono font-bold text-lg"
                        isError={isDurationError}
                    />
                </div>

                <div className="flex flex-col md:col-span-2">
                    <label className="text-xs text-on-surface-variant mb-1 font-bold ml-1">Time Slot</label>
                    <div className="bg-surface-background/50 p-2 rounded-lg w-full text-center font-semibold text-on-surface-variant font-mono text-sm tracking-wider border border-on-surface/5">
                        <span>{item.startTime}</span>
                        <span className="mx-2 opacity-50">-</span>
                        <span>{item.endTime}</span>
                    </div>
                </div>
            </div>

            {/* 4. アクションエリア */}
            <div className="flex flex-col gap-2 shrink-0 self-stretch justify-center">
                {actionNode}

                {onCopy && (
                    <button
                        onClick={onCopy}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:text-brand-primary hover:bg-surface-background transition-colors active:scale-95"
                        title="複製"
                    >
                        <CopyIcon className="w-5 h-5" />
                    </button>
                )}

                <button
                    onClick={onRemove}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 transition-colors active:scale-95"
                    title="削除"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};