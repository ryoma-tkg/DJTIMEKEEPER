// [src/components/ui/SortableListCard.jsx]
import React, { useState } from 'react';
import { GripIcon, TrashIcon, CopyIcon, ClockIcon } from '../common';
import { Input } from './Input';

/**
 * DJ/VJアイテム共通のリストカードコンポーネント (Tactile Design v3.1)
 * Mobile: Stack Layout (Header[Actions] / Body[Name] / Footer[Time])
 * Desktop: Row Layout (Grip / Icon / Name[Flex] / Time / Actions[Vertical])
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
    actionNode, // カラーピッカー等のカスタムアクション
    labelName = "Name"
}) => {
    const [isHovered, setIsHovered] = useState(false);

    // バリデーション
    const isNameError = !item.name || item.name.trim() === '';

    // ドラッグ中のスタイル (Lift up)
    const draggingClass = isDragging
        ? 'dragging-item shadow-2xl scale-105 z-50 ring-2 ring-brand-primary'
        : 'shadow-sm hover:shadow-md hover:border-on-surface/20 transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)';

    // ON AIR / 通常時のボーダーと影
    let dynamicStyle = {};
    if (!isDragging) {
        if (isPlaying) {
            const baseColor = item.color || '#007bff';
            dynamicStyle = {
                borderColor: baseColor,
                boxShadow: isHovered
                    ? `0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 20px 0px ${baseColor}40` // Glow effect
                    : `0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 10px 0px ${baseColor}20`
            };
        } else {
            dynamicStyle = {
                borderColor: 'transparent' // 通常はボーダー透明（bg-surface-containerが背景）
            };
        }
    }

    const handleDurationChange = (e) => {
        const val = e.target.value;
        if (val === '') { onUpdate('duration', ''); return; }
        if (val.endsWith('.') || (val.includes('.') && val.endsWith('0'))) {
            onUpdate('duration', val);
        } else {
            onUpdate('duration', parseFloat(val));
        }
    };

    return (
        <div
            className={`
                group relative bg-surface-container rounded-2xl 
                border border-on-surface/10 dark:border-white/5
                p-3 md:p-3 md:pr-4 overflow-visible
                ${draggingClass}
            `}
            style={dynamicStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* --- Mobile Layout (Stack) --- */}
            <div className="md:hidden flex flex-col gap-3">
                {/* Row 1: Header (Grip, Icon, Actions) */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="flex-shrink-0 cursor-grab touch-none text-on-surface-variant/30 hover:text-on-surface-variant p-2 -ml-2"
                            onPointerDown={onPointerDown}
                        >
                            <GripIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-shrink-0">
                            {iconNode}
                        </div>
                    </div>

                    {/* Actions (Horizontal) */}
                    <div className="flex items-center gap-3">
                        {actionNode}
                        {onCopy && (
                            <button onClick={onCopy} className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant/70 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors active:scale-95">
                                <CopyIcon className="w-5 h-5" />
                            </button>
                        )}
                        <button onClick={onRemove} className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant/70 hover:text-red-500 hover:bg-red-500/10 transition-colors active:scale-95">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Row 2: Name Input (Full Width) */}
                <div>
                    <Input
                        value={item.name}
                        onChange={(e) => onUpdate('name', e.target.value)}
                        placeholder={labelName}
                        className="font-bold text-lg"
                        isError={isNameError}
                    />
                </div>

                {/* Row 3: Time Controls (Footer) */}
                <div className="flex items-center justify-between gap-3 bg-surface-background/50 rounded-xl p-2 border border-on-surface/5">
                    <div className="flex items-center gap-2">
                        <div className="w-20">
                            <Input
                                type="number"
                                value={item.duration}
                                step="1"
                                min="0"
                                onChange={handleDurationChange}
                                className="font-mono font-bold text-center h-10"
                                wrapperClassName="m-0"
                            />
                        </div>
                        <span className="text-xs font-bold text-on-surface-variant select-none">min</span>
                    </div>
                    <div className="w-px h-5 bg-on-surface/10"></div>
                    <div className="flex items-center gap-1.5 text-sm font-mono font-medium text-on-surface-variant select-none h-10 whitespace-nowrap">
                        <ClockIcon className="w-4 h-4 opacity-60" />
                        <span>{item.startTime} - {item.endTime}</span>
                    </div>
                </div>
            </div>

            {/* --- Desktop Layout (Row) --- */}
            <div className="hidden md:flex w-full items-center gap-4">
                {/* Left: Grip & Icon */}
                <div
                    className="flex-shrink-0 cursor-grab touch-none text-on-surface-variant/30 hover:text-on-surface-variant p-2 -ml-2"
                    onPointerDown={onPointerDown}
                >
                    <GripIcon className="w-5 h-5" />
                </div>
                <div className="flex-shrink-0">
                    {iconNode}
                </div>

                {/* Center: Name (Flexible) */}
                <div className="flex-grow-[2] min-w-0">
                    <Input
                        value={item.name}
                        onChange={(e) => onUpdate('name', e.target.value)}
                        placeholder={labelName}
                        className="font-bold text-lg h-12"
                        isError={isNameError}
                    />
                </div>

                {/* Right: Time & Actions */}
                <div className="flex-shrink-0 flex items-center gap-6">
                    {/* Time Controls */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-20">
                                <Input
                                    type="number"
                                    value={item.duration}
                                    step="1"
                                    min="0"
                                    onChange={handleDurationChange}
                                    className="font-mono font-bold text-center h-10"
                                />
                            </div>
                            <span className="text-xs font-bold text-on-surface-variant select-none">min</span>
                        </div>
                        <div className="w-px h-8 bg-on-surface/10"></div>
                        <div className="flex flex-col items-center justify-center text-xs font-mono font-bold text-on-surface-variant select-none w-24">
                            <span>{item.startTime}</span>
                            <span className="opacity-50 text-[10px]">to</span>
                            <span>{item.endTime}</span>
                        </div>
                    </div>

                    {/* Actions (Vertical Divider + Buttons) */}
                    <div className="flex-shrink-0 flex items-center gap-3 pl-4 border-l border-on-surface/5 h-14">
                        <div className="flex flex-col gap-2 justify-center items-center">
                            {actionNode} {/* Color Picker */}
                        </div>
                        <div className="flex flex-col gap-1 justify-center">
                            {onCopy && (
                                <button onClick={onCopy} className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant/70 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors active:scale-95" title="複製">
                                    <CopyIcon className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <button onClick={onRemove} className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant/70 hover:text-red-500 hover:bg-red-500/10 transition-colors active:scale-95" title="削除">
                                <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};