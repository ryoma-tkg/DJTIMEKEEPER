// [src/components/ui/Toggle.jsx]
import React from 'react';

export const Toggle = ({
    checked,
    onChange,
    label,
    icon: Icon,
    description,
    disabled = false
}) => (
    <div className="flex items-center justify-between py-3 group w-full">
        <div className="flex items-start gap-3">
            {Icon && (
                <div className={`mt-0.5 transition-colors ${checked ? 'text-brand-primary' : 'text-on-surface-variant group-hover:text-brand-primary'}`}>
                    <Icon className="w-5 h-5" />
                </div>
            )}
            <div>
                <div className={`font-bold text-sm font-sans transition-colors ${checked ? 'text-on-surface' : 'text-on-surface'}`}>
                    {label}
                </div>
                {description && (
                    <div className="text-xs text-on-surface-variant mt-0.5 font-sans opacity-80">
                        {description}
                    </div>
                )}
            </div>
        </div>
        <button
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            className={`
                relative w-11 h-6 rounded-full transition-colors duration-300 ease-in-out focus:outline-none flex-shrink-0 ml-4
                ${checked ? 'bg-brand-primary shadow-inner' : 'bg-on-surface/20 dark:bg-white/20 shadow-inner'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            <span
                className={`
                    absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1)
                    ${checked ? 'translate-x-5' : 'translate-x-0'}
                `}
            />
        </button>
    </div>
);

// 互換性のためにエイリアスとしてもエクスポート
export const ToggleSwitch = Toggle;