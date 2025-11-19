// [src/components/ui/SortableListCard.jsx]
import React, { useState } from 'react'; // ★ useStateを追加
import { GripIcon, TrashIcon, CopyIcon } from '../common';
import { Input } from './Input'; // ★ Inputをインポート

/**
 * DJ/VJアイテム共通のリストカードコンポーネント
 * * @param {object} item - データオブジェクト (name, duration, color等)
 * @param {boolean} isPlaying - 再生中かどうか（枠線の色に影響）
 * @param {boolean} isDragging - ドラッグ中かどうか（スタイルに影響）
 * @param {function} onPointerDown - ドラッグ開始ハンドラ
 * @param {function} onUpdate - フィールド更新ハンドラ (field, value) => void
 * @param {function} onRemove - 削除ハンドラ
 * @param {function} onCopy - 複製ハンドラ (任意)
 * @param {ReactNode} iconNode - 左側のアイコンエリア（画像など）
 * @param {ReactNode} actionNode - 右側の追加アクションエリア（カラーピッカーなど）
 * @param {string} labelName - 名前入力欄のラベル (例: "DJ Name")
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

    // ドラッグ中のスタイル
    const draggingClass = isDragging
        ? 'dragging-item shadow-[0_20px_30px_-5px_rgba(0,0,0,0.3)] scale-105 z-50'
        : 'transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)';

    // ▼▼▼ ダッシュボードのスタイルを完全移植 ▼▼▼

    // 共通のボーダー設定 (ダッシュボードと同じ)
    // 再生中は色付き、通常時は薄いグレー
    const borderClass = isPlaying
        ? 'border' // 再生中は少し太めに強調
        : 'border border-on-surface/10 dark:border-white/5';

    // 動的スタイルの生成
    let dynamicStyle = {};

    if (!isDragging) {
        if (isPlaying) {
            // 【再生中】: ダッシュボードの "NOW ON AIR" スタイル
            const baseColor = item.color || '#007bff';

            // Hexカラーにアルファ値を付与
            const glowColorHover = `${baseColor}66`; // 40% opacity
            const glowColorRest = `${baseColor}40`;  // 25% opacity

            dynamicStyle = {
                borderColor: baseColor, // ★ボーダーにテーマカラーを適用
                transform: 'translateY(0)',
                // ダッシュボードと同じ Glow Shadow 計算式
                boxShadow: isHovered
                    ? `0 20px 30px -5px rgba(0, 0, 0, 0.2), 0 0 35px 5px ${glowColorHover}`
                    : `0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 20px 0px ${glowColorRest}`,
                zIndex: isHovered ? 10 : 1,
            };
        } else {
            // 【通常時】: ダッシュボードの通常カードスタイル (shadow-lg -> shadow-2xl)
            // Tailwindのクラス値に準拠した値を直接指定してトーンを合わせる
            dynamicStyle = {
                transform: 'translateY(0)',
                // shadow-lg (通常) -> shadow-2xl (ホバー)
                boxShadow: isHovered
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' // shadow-2xl
                    : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // shadow-lg
            };
        }
    }

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
                    <Input
                        value={item.name}
                        onChange={(e) => onUpdate('name', e.target.value)}
                        className="font-bold text-lg"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-xs text-on-surface-variant mb-1 font-bold ml-1">Duration (min)</label>
                    <Input
                        type="number"
                        value={item.duration}
                        step="1"
                        onChange={(e) => onUpdate('duration', parseFloat(e.target.value) || 0)}
                        className="font-mono font-bold"
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