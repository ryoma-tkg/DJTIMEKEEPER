import React, { memo } from 'react';

// ★★★ App.jsx から移動してきた定数 ★★★
export const VIVID_COLORS = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899'
];

// ★★★ App.jsx から移動してきたアイコン群 ★★★
export const PlayIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>);
export const PlusIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>);
export const TrashIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
export const GripIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>);
export const UserIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
export const UploadIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>);
export const CopyIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>);
export const XIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
export const ResetIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 2v6h6" /><path d="M21 12A9 9 0 0 0 6 5.3L3 8" /><path d="M21 22v-6h-6" /><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" /></svg>);
export const AlertTriangleIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>);
export const GodModeIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>);

// ★★★ App.jsx から移動してきた SimpleImage ★★★
export const SimpleImage = memo(({ src, className, alt = "" }) => {
    if (!src) return null;
    return <img src={src} alt={alt} className={className} />;
});

// ★★★ App.jsx から移動してきた parseTime ★★★
export const parseTime = (timeStr) => {
    const date = new Date();
    if (!timeStr) return date;
    const [hours, minutes] = timeStr.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    return date;
};

// ★★★ App.jsx から移動してきた CustomTimeInput ★★★
export const CustomTimeInput = ({ value, onChange }) => {
    const adjustTime = (minutes) => {
        const date = parseTime(value);
        date.setMinutes(date.getMinutes() + minutes);
        onChange(date.toTimeString().slice(0, 5));
    };
    const buttonClasses = "px-3 py-3 rounded-lg bg-surface-background hover:bg-zinc-700 text-sm font-semibold w-12";
    return (
        <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => adjustTime(-15)} className={buttonClasses}>-15</button>
            <button type="button" onClick={() => adjustTime(-5)} className={buttonClasses}>-5</button>
            <input type="time" value={value} onChange={(e) => onChange(e.target.value)} className="bg-surface-background text-on-surface p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-primary text-center font-mono font-bold text-base" />
            <button type="button" onClick={() => adjustTime(5)} className={buttonClasses}>+5</button>
            <button type="button" onClick={() => adjustTime(15)} className={buttonClasses}>+15</button>
        </div>
    );
};

// ★★★ App.jsx から移動してきた ConfirmModal ★★★
export const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in-up">
            <div className="bg-surface-container rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start gap-4">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangleIcon className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="mt-0 text-left">
                        <h3 className="text-lg leading-6 font-bold text-on-surface">{title}</h3>
                        <div className="mt-2">
                            <p className="text-sm text-on-surface-variant">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    <button onClick={onConfirm} className="w-full inline-flex justify-center rounded-full border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:w-auto sm:text-sm">
                        リセット実行
                    </button>
                    <button onClick={onCancel} className="mt-3 w-full inline-flex justify-center rounded-full border border-zinc-600 shadow-sm px-4 py-2 bg-surface-background text-base font-medium text-on-surface hover:bg-zinc-700 sm:mt-0 sm:w-auto sm:text-sm">
                        キャンセル
                    </button>
                </div>
            </div>
        </div>
    );
};