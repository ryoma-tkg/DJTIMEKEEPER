// [src/components/ui/Button.jsx]
import React from 'react';

// 基本スタイル: 共通の挙動（トランジション、押し込み効果、無効化状態）
const baseStyles = `
    font-bold rounded-xl 
    transition-all duration-200 ease-out 
    active:scale-[0.97] transform-gpu
    flex items-center justify-center gap-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
`;

// バリエーション定義
const variants = {
    // Primary: 発光するブランドカラー
    primary: `
        bg-brand-primary text-white 
        shadow-lg shadow-brand-primary/40
        hover:shadow-xl hover:shadow-brand-primary/50
        hover:-translate-y-0.5 hover:brightness-110
        ring-1 ring-inset ring-white/20
    `,
    // Secondary: 物理的なカードのような質感
    secondary: `
        bg-surface-container text-on-surface
        border border-on-surface/10 dark:border-white/10 hover:border-on-surface/20
        shadow-sm hover:shadow-md
        hover:-translate-y-0.5 hover:bg-surface-background
    `,
    // Danger: 破壊的アクション用
    danger: `
        bg-surface-container text-red-500
        border border-red-500/20
        shadow-lg shadow-red-500/10
        hover:bg-red-500/10 hover:border-red-500/30 hover:shadow-red-500/20
    `,
    // Ghost: 背景なし、ホバーで浮き出る
    ghost: "text-on-surface-variant hover:bg-on-surface/5 hover:text-on-surface",

    // Icon: 丸型アイコンボタン
    icon: `
        rounded-full
        bg-surface-container text-on-surface-variant hover:text-on-surface
        border border-on-surface/10 dark:border-white/10
        shadow-sm hover:shadow-md
        hover:-translate-y-0.5
    `,
    // Dashed: 追加ボタンなど (互換性のため維持)
    dashed: "border-2 border-dashed border-on-surface/10 hover:border-brand-primary hover:bg-brand-primary/5 text-on-surface-variant hover:text-brand-primary"
};

// サイズ定義
const sizes = {
    sm: "text-xs py-2 px-4 min-h-[36px]",
    md: "text-sm py-3 px-6 min-h-[48px]",
    lg: "text-base py-4 px-8 min-h-[64px] tracking-wide",
    icon: "w-12 h-12 !p-0" // Iconバリアント用デフォルト
};

// アイコンサイズ定義
const iconSvgSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    icon: "w-5 h-5"
};

export const Button = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    type = 'button',
    title,
    icon: Icon
}) => {
    // variantがiconの場合はsizeを強制的に調整、それ以外はpropsに従う
    const sizeClass = variant === 'icon' ? sizes.icon : (sizes[size] || sizes.md);
    const variantClass = variants[variant] || variants.primary;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`${baseStyles} ${variantClass} ${sizeClass} ${className}`}
        >
            {Icon && <Icon className={iconSvgSizes[size] || "w-5 h-5"} />}
            {children}
        </button>
    );
};