// [src/components/ui/DatePickerInput.jsx]
import React, { forwardRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ja } from 'date-fns/locale/ja';
import { Input } from './Input';
import { CalendarIcon } from '../common';

registerLocale('ja', ja);

// react-datepicker に渡すカスタムインプット
const CustomInput = forwardRef(({ value, onClick, className, ...props }, ref) => (
    <div
        className="relative w-full group cursor-pointer"
        onClick={onClick}
        ref={ref}
    >
        {/* 入力欄: 完全に読み取り専用にし、ポインターイベントを無効化して親divのクリックを優先 */}
        <Input
            {...props}
            value={value}
            readOnly={true} // キーボード入力禁止
            className={`w-full cursor-pointer pointer-events-none ${className}`} // pointer-events-noneで入力を無視し、親のonClickを発火させる
            wrapperClassName="w-full"
            icon={CalendarIcon}
            tabIndex={-1} // タブフォーカス除外
        />
        {/* ホバーエフェクト用オーバーレイ */}
        <div className="absolute inset-0 rounded-xl group-hover:bg-on-surface/5 transition-colors pointer-events-none" />
    </div>
));

CustomInput.displayName = 'CustomInput';

export const DatePickerInput = ({ value, onChange, label, className = "", ...props }) => {
    // 値の変換処理
    const selectedDate = value ? new Date(value) : new Date();

    const handleChange = (date) => {
        if (!date) return;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        onChange(`${year}-${month}-${day}`);
    };

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-bold text-on-surface-variant mb-1.5 ml-1">
                    {label}
                </label>
            )}

            {/* --- PC用 (カレンダー) --- */}
            <div className="hidden md:block w-full">
                <DatePicker
                    selected={selectedDate}
                    onChange={handleChange}
                    dateFormat="yyyy-MM-dd"
                    locale="ja"
                    customInput={<CustomInput />}
                    calendarStartDay={0} // ★ここを修正: 0 (日曜始まり) に変更
                    showPopperArrow={false}

                    wrapperClassName="w-full block"
                    popperClassName="gig-deck-datepicker"
                    portalId="root"
                    popperProps={{
                        strategy: 'fixed'
                    }}
                    {...props}
                />
            </div>

            {/* --- SP用 (ネイティブ) --- */}
            <div className="block md:hidden w-full">
                <Input
                    type="date"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    icon={CalendarIcon}
                    className="font-mono text-sm w-full"
                    wrapperClassName="w-full"
                    {...props}
                />
            </div>
        </div>
    );
};