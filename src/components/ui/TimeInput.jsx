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
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        onChange(`${h}:${m}`);
    };

    // ★追加: 直接入力時のバリデーション
    const handleInputChange = (e) => {
        let val = e.target.value;
        if (!val) return onChange(val);

        const [hStr, mStr] = val.split(':');
        let h = parseInt(hStr, 10);
        let m = parseInt(mStr, 10);

        if (isNaN(h)) h = 0;
        if (isNaN(m)) m = 0;

        // 分が60以上なら補正 (例: 22:99 -> 22:59 または 繰り上げて 23:39 等も可能だが、今回は単純に59に丸めるか入力を受け付けない)
        // ここではブラウザの<input type="time">の挙動に任せつつ、値が飛んできた時にチェックする

        // input type="time" はブラウザによって 60分以上を入力できないように制御されていることが多いが、
        // 万が一入力された場合のガード
        if (m > 59) m = 59;
        if (h > 23) h = 23;

        // 文字列として再構築
        const newH = String(h).padStart(2, '0');
        const newM = String(m).padStart(2, '0');

        // 値が変わっていれば通知
        onChange(`${newH}:${newM}`);
    };

    const buttonClasses = `
        flex-1 py-3 rounded-xl 
        bg-surface-background hover:bg-surface-background/80 active:bg-brand-primary/10 
        border border-on-surface/5 dark:border-white/10
        text-on-surface font-bold text-sm 
        transition-all active:scale-95 shadow-sm 
        flex items-center justify-center cursor-pointer
    `;

    return (
        <div className="flex items-stretch w-full gap-2">
            <button type="button" onClick={() => adjustTime(-15)} className={`${buttonClasses} hidden sm:flex`} title="-15分">-15</button>
            <button type="button" onClick={() => adjustTime(-5)} className={buttonClasses} title="-5分">-5</button>

            <div className="relative flex-grow group">
                <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50 pointer-events-none" />
                <input
                    type="time"
                    value={value}
                    onChange={handleInputChange} // ★変更
                    className="
                        w-full h-full bg-surface-background text-on-surface 
                        py-3 pl-10 pr-2 rounded-xl 
                        border border-on-surface/5 dark:border-white/10
                        focus:outline-none focus:ring-2 focus:ring-brand-primary
                        text-center font-mono font-bold text-lg tracking-widest
                        shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.02)] cursor-pointer
                    "
                />
            </div>

            <button type="button" onClick={() => adjustTime(5)} className={buttonClasses} title="+5分">+5</button>
            <button type="button" onClick={() => adjustTime(15)} className={`${buttonClasses} hidden sm:flex`} title="+15分">+15</button>
        </div>
    );
};