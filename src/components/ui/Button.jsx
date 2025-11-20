// [src/components/ui/Button.jsx]
import React from 'react';

const baseStyles = "font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

const variants = {
    primary: "bg-brand-primary hover:opacity-90 text-white shadow-lg shadow-brand-primary/30",
    secondary: "bg-surface-background hover:bg-on-surface/5 text-on-surface border border-on-surface/5",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-500",
    ghost: "hover:bg-on-surface/5 text-on-surface-variant hover:text-on-surface",
    dashed: "border-2 border-dashed border-on-surface/10 hover:border-brand-primary hover:bg-brand-primary/5 text-on-surface-variant hover:text-brand-primary"
};

const sizes = {
    sm: "py-1.5 px-3 text-xs",
    md: "py-2 px-4 text-sm",
    lg: "py-3 px-6 text-base",
    icon: "p-2 aspect-square"
};

export const Button = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    type = 'button',
    title
}) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        >
            {children}
        </button>
    );
};