// [src/components/ui/Input.jsx]
import React from 'react';
import { AlertTriangleIcon } from '../common'; // アイコンはcommonから取得

export const Input = ({
    type = "text",
    value,
    onChange,
    placeholder,
    className = "",
    wrapperClassName = "",
    icon: Icon,
    autoFocus = false,
    step,
    min,
    max,
    error = null,
    isError = false,
    label, // 新機能: ラベルをコンポーネント内で描画
    ...props
}) => {
    const hasError = !!error || isError;

    // エラー時のスタイル
    const errorStyle = "border-red-500/50 bg-red-500/10 focus:ring-red-500 focus:border-red-500 text-red-500 placeholder-red-500/50";

    // 通常時のスタイル (Recessed design: 窪み表現)
    const normalStyle = `
        bg-surface-background text-on-surface
        border border-on-surface/5 dark:border-white/10
        focus:border-brand-primary
        placeholder-on-surface-variant/30
        shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.02)]
    `;

    return (
        <div className={`w-full ${wrapperClassName}`}>
            {label && (
                <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1 font-sans">
                    {label}
                </label>
            )}

            <div className="relative group w-full">
                {Icon && (
                    <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors ${hasError ? 'text-red-500' : 'text-on-surface-variant/50 group-focus-within:text-brand-primary'}`} />
                )}

                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    step={step}
                    min={min}
                    max={max}
                    {...props}
                    className={`
                        w-full py-3.5 ${Icon ? 'pl-12' : 'pl-4'} pr-4
                        rounded-xl border
                        focus:outline-none focus:ring-2 focus:ring-brand-primary/50
                        text-base font-medium
                        transition-all duration-200 ease-out
                        ${hasError ? errorStyle : normalStyle}
                        ${className}
                    `}
                />

                {/* エラーメッセージ (吹き出し表示) */}
                {error && (
                    <div className="absolute top-full left-0 mt-1 z-10 pointer-events-none animate-fade-in">
                        <div className="flex items-center gap-1 text-red-500 bg-surface-container/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-lg border border-red-500/20">
                            <AlertTriangleIcon className="w-3 h-3" />
                            <span className="text-[10px] font-bold whitespace-nowrap">{error}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};