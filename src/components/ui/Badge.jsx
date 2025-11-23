// [src/components/ui/Badge.jsx]
import React from 'react';

export const Badge = ({ status, label, className = '' }) => {
    const styles = {
        onAir: "bg-surface-container border border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]",
        upcoming: "bg-brand-primary/10 text-brand-primary border border-brand-primary/20",
        finished: "bg-on-surface/5 text-on-surface-variant border border-on-surface/10",
        standby: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
        default: "bg-surface-container text-on-surface border border-on-surface/10"
    };

    const selectedStyle = styles[status] || styles.default;
    const isPulse = status === 'onAir';

    return (
        <span className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border
            ${selectedStyle}
            ${className}
        `}>
            <span className={`w-1.5 h-1.5 rounded-full ${isPulse ? 'bg-current animate-ping' : 'bg-current'}`}></span>
            {label}
        </span>
    );
};