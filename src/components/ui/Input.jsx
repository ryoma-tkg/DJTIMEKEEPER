// [src/components/ui/Input.jsx]
import React from 'react';
import { AlertTriangleIcon } from '../common'; // アイコンが必要ならインポート

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
    error = null, // ▼▼▼ 変更: booleanではなくエラーメッセージ(文字列)またはnullを受け取る ▼▼▼
    ...props
}) => {
    // エラーがあるかどうか
    const hasError = !!error;

    // エラー時のスタイル定義
    const errorStyle = "border-red-500/50 bg-red-500/10 focus:ring-red-500 focus:border-red-500 text-red-500 placeholder-red-500/50";
    // 通常時のスタイル定義
    const normalStyle = "border-transparent focus:border-brand-primary/20";

    return (
        <div className={`relative w-full group ${wrapperClassName}`}>
            {Icon && (
                <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors ${hasError ? 'text-red-500' : 'text-on-surface-variant'}`} />
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
                    bg-surface-background text-on-surface 
                    py-3 ${Icon ? 'pl-10' : 'pl-4'} pr-4 
                    rounded-xl w-full 
                    focus:outline-none focus:ring-2 
                    font-bold text-base placeholder-on-surface-variant/30
                    transition-all duration-200 ease-out shadow-sm
                    border
                    ${hasError ? errorStyle : normalStyle}
                    ${className}
                `}
            />

            {/* ▼▼▼ エラーメッセージ (絶対配置で浮かせる) ▼▼▼ */}
            {/* heightに影響を与えず、入力欄の下にフワッと出す */}
            {hasError && (
                <div className="absolute top-full left-0 mt-1 z-10 pointer-events-none animate-fade-in">
                    <div className="flex items-center gap-1 text-red-500 bg-surface-container/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-lg border border-red-500/20">
                        <AlertTriangleIcon className="w-3 h-3" />
                        <span className="text-[10px] font-bold whitespace-nowrap">{error}</span>
                    </div>
                </div>
            )}
        </div>
    );
};