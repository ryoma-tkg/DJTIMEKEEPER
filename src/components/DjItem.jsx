import React, { memo, useEffect, useRef } from 'react';
import {
    VIVID_COLORS,
    SimpleImage,
    TrashIcon,
    GripIcon,
    UserIcon,
    CopyIcon,
} from './common';

export const DjItem = memo(({ dj, isPlaying, onPointerDown, onEditClick, onUpdate, onColorPickerToggle, onCopy, onRemove, isColorPickerOpen, openColorPickerId, isDragging }) => {
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
            <div
                className="cursor-grab touch-none p-3 -m-3"
                onPointerDown={onPointerDown}
            >
                <GripIcon className="w-6 h-6 text-on-surface-variant shrink-0" />
            </div>

            <button
                onClick={() => onEditClick()}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-16 h-16 rounded-full bg-surface-background flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-surface-background hover:ring-brand-primary transition-all"
            >
                {/* */}
                {dj.imageUrl ? (
                    <SimpleImage src={dj.imageUrl} className="w-full h-full object-cover" />
                ) : !dj.isBuffer ? ( // 
                    <UserIcon className="w-8 h-8 text-on-surface-variant" />
                ) : null}
            </button>

            {/* */}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* */}
                <div className="flex flex-col">
                    <label className="text-xs text-on-surface-variant mb-1">{dj.isBuffer ? 'Title' : 'DJ Name'}</label>
                    <input type="text" value={dj.name} onChange={(e) => onUpdate('name', e.target.value)} className="bg-surface-background text-on-surface p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>
                {/* */}
                <div className="flex flex-col">
                    <label className="text-xs text-on-surface-variant mb-1">Time Slot</label>
                    <div className="bg-surface-background/50 p-2 rounded-lg w-full text-center font-semibold text-on-surface-variant font-mono">
                        <span>{dj.startTime}</span>
                        <span className="mx-2">-</span>
                        <span>{dj.endTime}</span>
                    </div>
                </div>
                {/* */}
                <div className="flex flex-col col-span-1 md:col-span-2">
                    <label className="text-xs text-on-surface-variant mb-1">Duration (min)</label>
                    <input type="number" value={dj.duration} step="0.1" onChange={(e) => onUpdate('duration', parseFloat(e.target.value) || 0)} className="bg-surface-background text-on-surface p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-primary font-bold text-base" />
                </div>
            </div>
            {/* */}

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