// [src/components/ui/Toggle.jsx]
import React from 'react';

export const ToggleSwitch = ({ checked, onChange, label, icon: Icon, disabled = false }) => (
    <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
            {Icon && (
                <div className="p-2 rounded-full bg-surface-container text-on-surface-variant">
                    <Icon className="w-5 h-5" />
                </div>
            )}
            <span className="font-bold text-on-surface">{label}</span>
        </div>
        <button
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            className={`
                relative w-12 h-7 rounded-full transition-colors duration-300 ease-in-out focus:outline-none
                ${checked ? 'bg-brand-primary' : 'bg-zinc-300 dark:bg-zinc-600'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            <span
                className={`
                    absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out
                    ${checked ? 'translate-x-5' : 'translate-x-0'}
                `}
            />
        </button>
    </div>
);