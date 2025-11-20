// [src/components/ui/Label.jsx]
import React from 'react';

export const Label = ({ children, className = "", htmlFor }) => {
    return (
        <label
            htmlFor={htmlFor}
            className={`
                block text-sm font-bold text-on-surface-variant mb-1.5 ml-1
                ${className}
            `}
        >
            {children}
        </label>
    );
};