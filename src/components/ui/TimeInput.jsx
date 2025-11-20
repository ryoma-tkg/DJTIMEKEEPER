// [src/components/ui/TimeInput.jsx]
import React from 'react';
import { ClockIcon } from '../common';

const parseTime = (timeStr) => {
    const date = new Date();
    if (!timeStr) return date;
    const [hours, minutes] = timeStr.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    return date;
};

export const CustomTimeInput = ({ value, onChange }) => {
    const adjustTime = (minutes) => {
        const date = parseTime(value);
        date.setMinutes(date.getMinutes() + minutes);
        onChange(date.toTimeString().slice(0, 5));
    };

    // ボタンのスタイル (変更なし)
    const buttonClasses = "flex-1 py-3 rounded-xl bg-surface-background hover:bg-surface-background/80 active:bg-brand-primary/10 text-on-surface font-bold text-sm transition-all active:scale-95 shadow-sm border border-on-surface/5 flex items-center justify-center";

    return (
        // ▼▼▼ 【修正】 背景色、ボーダー、パディングを削除して「受け皿」を消しました ▼▼▼
        <div className="flex items-stretch w-full gap-2">
            <button type="button" onClick={() => adjustTime(-15)} className={`${buttonClasses} hidden sm:flex`} title="-15分">-15</button>
            <button type="button" onClick={() => adjustTime(-5)} className={buttonClasses} title="-5分">-5</button>

            {/* 真ん中の入力欄 (変更なし) */}
            <div className="relative flex-grow group">
                <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50 pointer-events-none" />
                <input
                    type="time"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="bg-surface-background text-on-surface py-3 pl-10 pr-2 w-full h-full rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary text-center font-mono font-bold text-lg shadow-inner cursor-pointer tracking-widest border border-on-surface/5"
                />
            </div>

            <button type="button" onClick={() => adjustTime(5)} className={buttonClasses} title="+5分">+5</button>
            <button type="button" onClick={() => adjustTime(15)} className={`${buttonClasses} hidden sm:flex`} title="+15分">+15</button>
        </div>
    );
};