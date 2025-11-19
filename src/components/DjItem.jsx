// [src/components/DjItem.jsx]
import React, { memo, useEffect, useRef } from 'react';
import {
    VIVID_COLORS,
    SimpleImage,
    UserIcon,
} from './common';
// ▼▼▼ 追加: 共通カードコンポーネント ▼▼▼
import { SortableListCard } from './ui/SortableListCard';

export const DjItem = memo(({ dj, isPlaying, onPointerDown, onEditClick, onUpdate, onColorPickerToggle, onCopy, onRemove, isColorPickerOpen, openColorPickerId, isDragging }) => {
    const colorPickerRef = useRef(null);

    // カラーピッカーの外側クリック検知
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

    // アイコンノード (画像 or プレースホルダー)
    const iconNode = (
        <button
            onClick={() => onEditClick()}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-16 h-16 rounded-full bg-surface-background flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-surface-background hover:ring-brand-primary transition-all shadow-sm group"
            title="画像を変更"
        >
            {dj.imageUrl ? (
                <SimpleImage src={dj.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
            ) : !dj.isBuffer ? (
                <UserIcon className="w-8 h-8 text-on-surface-variant group-hover:text-brand-primary transition-colors" />
            ) : (
                <span className="text-xs font-bold text-on-surface-variant">Buffer</span>
            )}
        </button>
    );

    // アクションノード (カラーピッカー)
    const actionNode = (
        <div className="relative flex justify-center" ref={colorPickerRef}>
            <button
                type="button"
                data-color-picker-trigger={dj.id}
                onClick={() => onColorPickerToggle(dj.id === openColorPickerId ? null : dj.id)}
                className="w-9 h-9 rounded-full ring-2 ring-surface-background hover:ring-on-surface-variant transition-all shadow-sm"
                style={{ backgroundColor: dj.color }}
                title="カラー変更"
            />
            {isColorPickerOpen && (
                <div className="absolute w-40 bottom-full mb-2 right-0 bg-surface-background p-2 rounded-xl shadow-2xl grid grid-cols-4 gap-2 z-50 border border-on-surface/10 animate-fade-in">
                    {VIVID_COLORS.map(color => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => { onUpdate('color', color); onColorPickerToggle(null); }}
                            className="w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none ring-1 ring-black/10"
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <SortableListCard
            item={dj}
            isPlaying={isPlaying}
            isDragging={isDragging}
            onPointerDown={onPointerDown}
            onUpdate={onUpdate}
            onRemove={onRemove}
            onCopy={onCopy}
            iconNode={iconNode}
            actionNode={actionNode}
            labelName={dj.isBuffer ? "Title" : "DJ Name"}
        />
    );
});