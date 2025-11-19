// [src/components/ui/Input.jsx]
import React from 'react';

export const Input = ({
    type = "text",
    value,
    onChange,
    placeholder,
    className = "",
    icon: Icon,
    autoFocus = false,
    step,
    min,
    max,
    ...props
}) => {
    return (
        <div className={`relative w-full ${className}`}>
            {Icon && (
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant pointer-events-none" />
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
                    focus:outline-none focus:ring-2 focus:ring-brand-primary 
                    font-bold text-base placeholder-on-surface-variant/30
                    transition-all duration-200 ease-out shadow-sm
                    border border-transparent focus:border-brand-primary/20
                `}
            />
        </div>
    );
};