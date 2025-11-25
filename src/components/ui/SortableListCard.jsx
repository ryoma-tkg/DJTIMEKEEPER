// [src/components/ui/SortableListCard.jsx]
import React, { useState } from 'react';
import { GripIcon, TrashIcon, CopyIcon, ClockIcon } from '../common';
import { Input } from './Input';

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

    const isNameError = !item.name || item.name.trim() === '';
    const isDurationError = item.duration === '' || item.duration === 0;

    const draggingClass = isDragging
        ? 'dragging-item shadow-[0_20px_30px_-5px_rgba(0,0,0,0.3)] scale-105 z-50'
        : 'transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)';

    const borderClass = isPlaying
        ? 'border-2'
        : 'border border-on-surface/10 dark:border-white/5';

    let dynamicStyle = {};
    if (!isDragging) {
        if (isPlaying) {
            const baseColor = item.color || '#007bff';
            dynamicStyle = {
                borderColor: baseColor,
                boxShadow: isHovered
                    ? `0 15px 25px -5px rgba(0, 0, 0, 0.1), 0 0 20px 0px ${baseColor}40`
                    : `0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 10px 0px ${baseColor}20`,
                backgroundColor: `rgba(var(--color-surface-container), 1)`,
                zIndex: 10
            };
        } else {
            dynamicStyle = {
                borderColor: 'transparent',
                backgroundColor: 'rgb(var(--color-surface-container))'
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
                rounded-2xl flex md:flex-nowrap flex-wrap items-center md:items-stretch gap-3 p-3 md:p-4 relative overflow-visible
                min-h-auto md:min-h-[10.5rem]
                ${borderClass} ${draggingClass}
            `}
            style={dynamicStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* 1. Grip Handle */}
            <div
                className="flex-shrink-0 flex items-center justify-center cursor-grab touch-none text-on-surface-variant/30 hover:text-on-surface-variant -ml-1 px-1 transition-colors"
                onPointerDown={onPointerDown}
                title="ドラッグして並び替え"
            >
                <GripIcon className="w-6 h-6" />
            </div>

            {/* 2. Icon Area */}
            {iconNode && (
                <div className="flex-shrink-0 self-center mr-1">
                    <div className="transition-transform hover:scale-105">
                        {iconNode}
                    </div>
                </div>
            )}

            {/* 4. Actions Sidebar (Mobile: Moved to Top Right visually via order) */}
            <div className="flex-shrink-0 flex flex-row md:flex-col justify-end md:justify-between items-center ml-auto md:ml-0 pl-0 md:pl-3 border-l-0 md:border-l border-on-surface/5 gap-3 md:gap-2 py-1 order-2 md:order-last">
                <div className="flex-shrink-0">
                    {actionNode}
                </div>

                <div className="flex flex-row md:flex-col gap-2 md:gap-1">
                    {onCopy && (
                        <button
                            onClick={onCopy}
                            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:text-brand-primary hover:bg-brand-primary/10 transition-all active:scale-95"
                            title="複製"
                        >
                            <CopyIcon className="w-5 h-5" />
                        </button>
                    )}
                    <button
                        onClick={onRemove}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-95"
                        title="削除"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* 3. Main Content Grid (Mobile: Moved to Bottom via order) */}
            <div className="w-full md:w-auto flex-grow grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto] gap-x-4 gap-y-3 items-center min-w-0 order-3 md:order-auto mt-2 md:mt-0">
                <div className="min-w-0 flex flex-col justify-center col-span-1 md:col-auto">
                    <Input
                        value={item.name}
                        onChange={(e) => onUpdate('name', e.target.value)}
                        placeholder={labelName}
                        className={`font-bold text-lg h-12 ${isNameError ? 'bg-red-500/5' : ''}`}
                        error={isNameError ? "必須" : null}
                        wrapperClassName="w-full"
                    />
                </div>

                <div className="flex items-center h-12 justify-end col-span-1 md:col-auto">
                    {/* ▼▼▼ 【修正】 幅を w-32 (128px) に広げ、ゆとりを持たせる ▼▼▼ */}
                    <div className="w-32 relative h-full">
                        <Input
                            type="number"
                            value={item.duration}
                            step="1"
                            min="0"
                            onChange={handleDurationChange}
                            /* ▼▼▼ 【修正】 pr-10 を追加し、数字が単位に重ならないようにする ▼▼▼ */
                            className="font-mono font-bold text-center h-full text-lg pr-10"
                            wrapperClassName="m-0 h-full"
                            isError={isDurationError}
                            placeholder="0"
                        />
                        {/* ▼▼▼ 【修正】 単位のデザインを「極小・大文字・広め」にしてスタイリッシュに配置 ▼▼▼ */}
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold pointer-events-none">
                            MIN
                        </span>
                    </div>
                </div>

                <div className="col-span-2 md:col-span-2 bg-surface-background/50 rounded-lg border border-on-surface/5 px-4 py-2 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm font-mono font-bold text-on-surface-variant select-none">
                        <ClockIcon className="w-4 h-4 opacity-50" />
                        <div className="flex items-center gap-3">
                            <span>{item.startTime}</span>
                            <span className="text-on-surface-variant/30">→</span>
                            <span>{item.endTime}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};