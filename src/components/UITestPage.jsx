// [src/components/UITestPage.jsx]
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
    PlayIcon, SettingsIcon, PlusIcon, TrashIcon,
    LayersIcon, GripIcon, UserIcon,
    SearchIcon, ClockIcon, MoonIcon, SunIcon,
    CopyIcon, Label, VideoIcon, CalendarIcon,
    XIcon, LogOutIcon, AlertTriangleIcon
} from './common';

// --- Icons Defined Locally ---
const MoreVerticalIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="12" cy="5" r="1"></circle>
        <circle cx="12" cy="19" r="1"></circle>
    </svg>
);
const PaletteIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
    </svg>
);

// --- Design System Definitions (v4.7.0 - Responsive & Final Polish) ---

// 1. Buttons
const NewButton = ({
    variant = 'secondary',
    size = 'md',
    children,
    className = '',
    icon: Icon,
    disabled = false,
    onClick
}) => {
    const sizes = {
        sm: "text-xs py-2 px-4 min-h-[36px] gap-1.5",
        md: "text-sm py-3 px-6 min-h-[48px] gap-2",
        lg: "text-base py-4 px-8 min-h-[64px] gap-3 tracking-wide"
    };
    const iconSizes = {
        sm: "w-9 h-9 !p-0",
        md: "w-12 h-12 !p-0",
        lg: "w-16 h-16 !p-0"
    };
    const iconSvgSizes = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6"
    };
    const base = `
        font-bold rounded-xl 
        transition-all duration-200 ease-out 
        active:scale-[0.97] transform-gpu
        flex items-center justify-center
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
    `;
    const styles = {
        primary: `
            bg-brand-primary text-white 
            shadow-lg shadow-brand-primary/40
            hover:shadow-xl hover:shadow-brand-primary/50
            hover:-translate-y-0.5 hover:brightness-110
            ring-1 ring-inset ring-white/20
        `,
        secondary: `
            bg-surface-container text-on-surface
            border border-on-surface/10 dark:border-white/10 hover:border-on-surface/20
            shadow-sm hover:shadow-md
            hover:-translate-y-0.5 hover:bg-surface-background
        `,
        icon: `
            rounded-full
            bg-surface-container text-on-surface-variant hover:text-on-surface
            border border-on-surface/10 dark:border-white/10
            shadow-sm hover:shadow-md
            hover:-translate-y-0.5
        `,
        ghost: "text-on-surface-variant hover:bg-on-surface/5 hover:text-on-surface",
        danger: `
            bg-surface-container text-red-500
            border border-red-500/20
            shadow-lg shadow-red-500/10
            hover:bg-red-500/10 hover:border-red-500/30 hover:shadow-red-500/20
        `
    };
    const sizeClass = variant === 'icon' ? iconSizes[size] : sizes[size];
    return (
        <button disabled={disabled} onClick={onClick} className={`${base} ${sizeClass} ${styles[variant]} ${className}`}>
            {Icon && <Icon className={iconSvgSizes[size]} />}
            {children}
        </button>
    );
};

// 2. Input Fields
const NewInput = ({ label, placeholder, icon: Icon, value = "", type = "text" }) => (
    <div className="w-full">
        {label && <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1 font-sans">{label}</label>}
        <div className="relative group">
            {Icon && (
                <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50 group-focus-within:text-brand-primary transition-colors" />
            )}
            <input
                type={type}
                placeholder={placeholder}
                defaultValue={value}
                className={`
                    w-full bg-surface-background text-on-surface
                    ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3.5
                    rounded-xl border border-on-surface/5 dark:border-white/10
                    focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary
                    text-base font-medium placeholder-on-surface-variant/30
                    transition-all duration-200
                    shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.02)]
                `}
            />
        </div>
    </div>
);

// 3. Toggle Switch
const NewToggle = ({ label, checked = false, onChange, icon: Icon, description }) => (
    <div className="flex items-center justify-between py-3 group">
        <div className="flex items-start gap-3">
            {Icon && (
                <div className="mt-0.5 text-on-surface-variant group-hover:text-brand-primary transition-colors">
                    <Icon className="w-5 h-5" />
                </div>
            )}
            <div>
                <div className="font-bold text-sm text-on-surface font-sans">{label}</div>
                {description && <div className="text-xs text-on-surface-variant mt-0.5 font-sans opacity-80">{description}</div>}
            </div>
        </div>
        <button
            onClick={() => onChange && onChange(!checked)}
            className={`
                relative w-11 h-6 rounded-full transition-colors duration-300 ease-in-out focus:outline-none flex-shrink-0 ml-4
                ${checked ? 'bg-brand-primary shadow-inner' : 'bg-on-surface/20 dark:bg-white/20 shadow-inner'}
            `}
        >
            <span className={`
                absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1)
                ${checked ? 'translate-x-5' : 'translate-x-0'}
            `} />
        </button>
    </div>
);

// 4. DJ/VJ Card (★修正: SP対応 & レイアウト改善)
const NewSortableCard = ({ initialName, initialDuration, time, color, isDragging }) => {
    const [name, setName] = useState(initialName);
    const [duration, setDuration] = useState(initialDuration);

    return (
        <div className={`
            group relative p-3 md:p-3 md:pr-4 rounded-2xl bg-surface-container
            border border-on-surface/10 dark:border-white/10 overflow-visible
            transition-all duration-300
            ${isDragging ? 'scale-105 shadow-2xl z-50 ring-2 ring-brand-primary' : 'shadow-sm hover:shadow-md hover:border-on-surface/20'}
        `}>
            {/* --- SP Layout (Stack) --- */}
            <div className="md:hidden flex flex-col gap-3">
                {/* Row 1: Grip, Icon, Actions (Right aligned) */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 cursor-grab touch-none text-on-surface-variant/30 hover:text-on-surface-variant p-2 -ml-2">
                            <GripIcon className="w-5 h-5" />
                        </div>
                        <button
                            className="flex-shrink-0 w-12 h-12 rounded-full bg-surface-background border border-on-surface/10 hover:border-brand-primary transition-colors overflow-hidden relative group/icon shadow-inner"
                            title="アイコンを変更"
                        >
                            <div className="w-full h-full flex items-center justify-center text-on-surface-variant/20 group-hover/icon:text-brand-primary/50">
                                <UserIcon className="w-6 h-6" />
                            </div>
                        </button>
                    </div>
                    {/* SP Actions: Horizontal Layout & No overflow */}
                    <div className="flex items-center gap-3">
                        <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-background transition-all active:scale-95" title="カラーを変更">
                            <div className="w-6 h-6 rounded-full shadow-sm ring-2 ring-white/20 dark:ring-black/20" style={{ backgroundColor: color }}></div>
                        </button>
                        <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant/70 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors active:scale-95" title="複製">
                            <CopyIcon className="w-5 h-5" />
                        </button>
                        <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant/70 hover:text-red-500 hover:bg-red-500/10 transition-colors active:scale-95" title="削除">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Row 2: Name Input (Full Width) */}
                <div>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="
                            w-full bg-surface-background text-lg font-bold text-on-surface
                            rounded-lg px-3 py-2
                            border border-on-surface/5 focus:border-brand-primary/50
                            focus:outline-none focus:ring-2 focus:ring-brand-primary/20
                            transition-all placeholder-on-surface-variant/30 truncate shadow-inner
                        "
                        placeholder="Artist Name"
                    />
                </div>

                {/* Row 3: Time Controls */}
                <div className="flex items-center justify-between gap-3 bg-surface-background/30 rounded-lg p-2 border border-on-surface/5">
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="
                                w-16 bg-surface-background text-base font-mono font-bold text-on-surface
                                rounded-lg px-2
                                border border-on-surface/5 focus:border-brand-primary/50
                                focus:outline-none focus:ring-2 focus:ring-brand-primary/20
                                transition-all 
                                shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.02)]
                                h-10 text-center
                            "
                        />
                        <span className="text-xs font-bold text-on-surface-variant select-none">min</span>
                    </div>
                    <div className="w-px h-5 bg-on-surface/10"></div>
                    <div className="flex items-center gap-1.5 text-sm font-mono font-medium text-on-surface-variant select-none h-10 whitespace-nowrap">
                        <ClockIcon className="w-4 h-4 opacity-60" />
                        {time}
                    </div>
                </div>
            </div>

            {/* --- PC Layout (Flex Row) --- */}
            <div className="hidden md:flex w-full items-center gap-4">
                <div className="flex-shrink-0 cursor-grab touch-none text-on-surface-variant/30 hover:text-on-surface-variant p-2 -ml-2">
                    <GripIcon className="w-5 h-5" />
                </div>
                <button
                    className="flex-shrink-0 w-14 h-14 rounded-full bg-surface-background border border-on-surface/10 hover:border-brand-primary transition-colors overflow-hidden relative group/icon shadow-inner"
                    title="アイコンを変更"
                >
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant/20 group-hover/icon:text-brand-primary/50">
                        <UserIcon className="w-7 h-7" />
                    </div>
                </button>

                {/* Name Input (Expanded: flex-grow-[2]) */}
                <div className="flex-grow-[2] min-w-0">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="
                            w-full bg-surface-background text-lg font-bold text-on-surface
                            rounded-lg px-3 py-1.5
                            border border-on-surface/5 focus:border-brand-primary/50
                            focus:outline-none focus:ring-2 focus:ring-brand-primary/20
                            transition-all placeholder-on-surface-variant/30 truncate shadow-inner
                            h-10
                        "
                        placeholder="Artist Name"
                    />
                </div>

                {/* Time Controls */}
                <div className="flex-shrink-0 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="relative group/duration">
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="
                                    w-16 bg-surface-background text-base font-mono font-bold text-on-surface
                                    rounded-lg px-2
                                    border border-on-surface/5 focus:border-brand-primary/50
                                    focus:outline-none focus:ring-2 focus:ring-brand-primary/20
                                    transition-all 
                                    shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.02)]
                                    h-10 text-center
                                "
                            />
                        </div>
                        <span className="text-xs font-bold text-on-surface-variant select-none">min</span>
                    </div>
                    <div className="w-px h-5 bg-on-surface/10"></div>
                    <div className="flex items-center gap-1.5 text-sm font-mono font-medium text-on-surface-variant select-none h-10 whitespace-nowrap">
                        <ClockIcon className="w-4 h-4 opacity-60" />
                        {time}
                    </div>
                </div>

                {/* Actions (Vertical with more gap) */}
                <div className="flex-shrink-0 flex items-center gap-3 pl-4 border-l border-on-surface/5 dark:border-white/5 h-14">
                    <button
                        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-background transition-all active:scale-95 mr-1"
                        title="カラーを変更"
                    >
                        <div className="w-7 h-7 rounded-full shadow-sm ring-2 ring-white/20 dark:ring-black/20" style={{ backgroundColor: color }}></div>
                    </button>
                    <div className="flex flex-col gap-2 justify-center">
                        <button className="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant/70 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors active:scale-95" title="複製">
                            <CopyIcon className="w-3.5 h-3.5" />
                        </button>
                        <button className="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant/70 hover:text-red-500 hover:bg-red-500/10 transition-colors active:scale-95" title="削除">
                            <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 5. Dashboard Event Card (★修正: 青グラデーション＆Open Editorハイライト)
const NewEventCard = ({ title, date, floors, startTime, isActive }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    // ★修正: アクティブ以外は青色のグラデーション
    const gradientClass = isActive
        ? 'from-red-500/5'
        : 'from-brand-primary/5';

    return (
        <div className={`
            group relative bg-surface-container rounded-3xl p-6
            transition-all duration-300 cursor-pointer overflow-visible flex flex-col
            hover:-translate-y-1
            ${isActive
                ? 'border border-red-500/40 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]'
                : 'border border-on-surface/10 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-on-surface/20'
            }
        `}>
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} to-transparent opacity-0 transition-opacity duration-500 pointer-events-none rounded-3xl ${isActive ? 'opacity-100' : 'group-hover:opacity-100'}`} />

            <div className="absolute top-4 right-4 z-20" ref={menuRef}>
                <button
                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                    className={`
                        w-8 h-8 rounded-full flex items-center justify-center transition-colors
                        ${isMenuOpen ? 'bg-surface-background text-on-surface' : 'text-on-surface-variant/50 hover:text-on-surface hover:bg-surface-background/50'}
                    `}
                >
                    <MoreVerticalIcon className="w-5 h-5" />
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-32 bg-surface-container rounded-xl shadow-xl border border-on-surface/10 overflow-hidden animate-fade-in z-30">
                        <button
                            className="w-full text-left px-4 py-3 text-xs font-bold text-on-surface hover:bg-surface-background flex items-center gap-2"
                            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}
                        >
                            <CopyIcon className="w-3 h-3" /> 複製
                        </button>
                        <button
                            className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}
                        >
                            <TrashIcon className="w-3 h-3" /> 削除
                        </button>
                    </div>
                )}
            </div>

            <div className="flex items-start gap-5 mb-6 flex-grow relative z-0">
                <div className={`
                    flex flex-col items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl shadow-inner border shrink-0 transition-all
                    ${isActive
                        ? 'bg-red-500/5 border-red-500/20 text-red-500'
                        : 'bg-surface-background border-on-surface/5 dark:border-white/10 text-on-surface-variant'
                    }
                `}>
                    <span className="text-[10px] font-bold tracking-widest uppercase leading-none mb-1 opacity-70">{date.month}</span>
                    <span className="text-xl md:text-2xl font-bold leading-none font-mono">{date.day}</span>
                </div>

                <div className="flex-1 min-w-0 pt-1">
                    {isActive && (
                        <div className="flex items-center gap-2 mb-2 animate-fade-in">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <span className="text-[10px] font-bold text-red-500 tracking-widest uppercase">NOW ON AIR</span>
                        </div>
                    )}
                    <h3 className={`text-base md:text-lg font-bold truncate mb-1 font-sans transition-colors ${isActive ? 'text-on-surface' : 'text-on-surface group-hover:text-brand-primary'}`}>{title}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-on-surface-variant">
                        <div className="flex items-center gap-1.5">
                            <LayersIcon className="w-3 h-3" />
                            <span>{floors} Floors</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <ClockIcon className="w-3 h-3" />
                            <span className="font-mono">START {startTime}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-4 border-t border-on-surface/5 dark:border-white/5 flex justify-between items-center relative z-0">
                {/* ★修正: OPEN EDITOR ホバーハイライト */}
                <span className="text-xs font-bold text-on-surface-variant/50 group-hover:text-brand-primary group-hover:opacity-100 transition-all duration-300">Open Editor</span>
                <button
                    className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all
                        ${isActive
                            ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:bg-red-600 hover:shadow-[0_0_20px_rgba(239,68,68,0.7)] border-transparent'
                            : 'bg-surface-background text-on-surface-variant hover:text-brand-primary hover:bg-brand-primary/10 border border-on-surface/5'
                        }
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-on-surface-variant/50'}`}></span>
                    LIVE LINK
                </button>
            </div>
        </div>
    );
};

// 6. List Item (★修正: ゴミ箱を常時表示)
const NewListItem = ({ label, onDelete }) => (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-background border border-on-surface/10 dark:border-white/10 hover:border-brand-primary/50 transition-all group shadow-sm">
        <div className="cursor-grab text-on-surface-variant/30 hover:text-on-surface-variant p-1">
            <GripIcon className="w-4 h-4" />
        </div>
        <input
            type="text"
            defaultValue={label}
            className="flex-grow bg-transparent font-bold text-on-surface focus:outline-none"
        />
        <button onClick={onDelete} className="p-2 rounded-full text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 transition-colors">
            <TrashIcon className="w-4 h-4" />
        </button>
    </div>
);

// 7. Trigger Area (変更なし)
const NewTrigger = ({ label, icon: Icon }) => (
    <button className="
        w-full h-24 rounded-2xl 
        border-2 border-dashed border-on-surface/10 dark:border-white/10
        bg-transparent hover:bg-brand-primary/[0.03] hover:border-brand-primary/40
        text-on-surface-variant hover:text-brand-primary 
        transition-all duration-200 active:scale-[0.98]
        flex flex-col items-center justify-center gap-2 group
    ">
        <div className="w-10 h-10 rounded-full bg-surface-container border border-on-surface/10 dark:border-white/10 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-md group-hover:border-brand-primary/20 transition-all">
            <Icon className="w-5 h-5" />
        </div>
        <span className="font-bold text-sm tracking-wide font-sans">{label}</span>
    </button>
);

// --- Layout Components ---
const PreviewContainer = ({ children, className = "" }) => (
    <div className={`bg-surface-background p-6 rounded-3xl border border-on-surface/5 shadow-inner ${className}`}>
        {children}
    </div>
);

const CategoryHeader = ({ title }) => (
    <h3 className="text-lg font-bold text-on-surface mb-4 border-b border-on-surface/10 pb-2">
        {title}
    </h3>
);

// --- 14. Tactile Spinner (★新規追加) ---
const TactileSpinner = () => (
    <div className="relative w-16 h-16 flex items-center justify-center">
        {/* 外周のレール（彫り込み） */}
        <div className="absolute inset-0 border-4 border-surface-container rounded-full shadow-inner opacity-80"></div>
        {/* 光る実体（回転） */}
        <div className="absolute inset-0 border-4 border-brand-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(var(--color-brand-primary),0.5)]"></div>
        {/* 中心核 */}
        <div className="w-2 h-2 bg-brand-primary rounded-full shadow-[0_0_10px_rgba(var(--color-brand-primary),0.8)] animate-pulse"></div>
    </div>
);

// --- Demo Components for Previews ---

const CreateEventModalPreview = () => (
    <div className="bg-surface-container rounded-2xl w-full max-w-md shadow-2xl border border-on-surface/10 flex flex-col mx-auto overflow-hidden">
        <header className="flex justify-between items-center p-6 pb-4 border-b border-on-surface/5">
            <h2 className="text-xl font-bold text-on-surface">新規イベント作成</h2>
            <button className="p-2 rounded-full hover:bg-surface-background text-on-surface-variant hover:text-on-surface transition-colors -mr-2"><XIcon className="w-5 h-5" /></button>
        </header>
        <div className="p-6 space-y-6">
            <div className="space-y-5">
                <div>
                    <Label>イベント名</Label>
                    <NewInput placeholder="イベント名を入力..." value="Saturday Night Fever" />
                </div>
                <div className="space-y-4">
                    <div><Label>開催日</Label><NewInput type="date" value="2025-11-22" icon={CalendarIcon} /></div>
                    <div>
                        <Label>開始時間</Label>
                        <div className="flex items-stretch w-full gap-2">
                            <button className="flex-1 py-3 rounded-xl bg-surface-background hover:bg-surface-background/80 border border-on-surface/10 dark:border-white/10 text-base font-bold shadow-sm text-on-surface active:scale-95 transition-transform">-15</button>
                            <div className="flex-grow relative group">
                                <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50 pointer-events-none" />
                                <div className="bg-surface-background text-on-surface py-3 pl-10 pr-2 w-full h-full rounded-xl border border-on-surface/5 dark:border-white/10 shadow-inner flex items-center justify-center">
                                    <span className="font-mono font-bold text-xl tracking-widest">22:00</span>
                                </div>
                            </div>
                            <button className="flex-1 py-3 rounded-xl bg-surface-background hover:bg-surface-background/80 border border-on-surface/10 dark:border-white/10 text-base font-bold shadow-sm text-on-surface active:scale-95 transition-transform">+15</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-2">
                <div className="text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">オプション設定</div>
                <div className="divide-y divide-on-surface/5 border-t border-b border-on-surface/5">
                    <NewToggle label="VJタイムテーブル機能" icon={VideoIcon} description="VJのタイムテーブルも管理します" />
                    <NewToggle label="複数フロアを使用" icon={LayersIcon} description="メインフロア以外のステージを追加します" />
                </div>
            </div>
        </div>
        <div className="p-6 pt-4 bg-surface-background/30 border-t border-on-surface/5 flex justify-end gap-3">
            <NewButton variant="ghost" size="md">キャンセル</NewButton>
            <NewButton variant="primary" size="md">作成する</NewButton>
        </div>
    </div>
);

const FloorManagerModalPreview = () => (
    <div className="bg-surface-container rounded-2xl w-full max-w-md shadow-2xl border border-on-surface/10 flex flex-col mx-auto overflow-hidden">
        <header className="flex justify-between items-center p-6 pb-4 border-b border-on-surface/5">
            <h2 className="text-xl font-bold text-on-surface">フロア管理</h2>
            <button className="p-2 rounded-full hover:bg-surface-background text-on-surface-variant hover:text-on-surface transition-colors -mr-2"><XIcon className="w-5 h-5" /></button>
        </header>
        <div className="p-6 space-y-3">
            <NewListItem label="Main Floor" onDelete={() => { }} />
            <NewListItem label="Sub Floor" onDelete={() => { }} />
            <NewListItem label="Lounge" onDelete={() => { }} />

            <button className="w-full h-14 rounded-xl border-2 border-dashed border-on-surface/10 hover:border-brand-primary hover:bg-brand-primary/5 text-on-surface-variant hover:text-brand-primary transition-all duration-200 flex items-center justify-center gap-2 group mt-2">
                <div className="w-6 h-6 rounded-full bg-surface-background border border-on-surface/10 flex items-center justify-center shadow-sm group-hover:border-brand-primary/30">
                    <PlusIcon className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm">フロアを追加</span>
            </button>
        </div>
        <div className="p-6 pt-4 bg-surface-background/30 border-t border-on-surface/5 flex justify-end gap-3">
            <NewButton variant="ghost" size="md">キャンセル</NewButton>
            <NewButton variant="primary" size="md">保存して閉じる</NewButton>
        </div>
    </div>
);

// ★修正: Dashboard Settings Modal (SP最適化 - 上下分割 & メニューグリッド)
const DashboardSettingsModalPreview = () => (
    <div className="bg-surface-container rounded-2xl w-full max-w-4xl shadow-2xl border border-on-surface/10 flex flex-col md:flex-row mx-auto overflow-hidden h-auto md:h-[550px] relative">
        <button className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-background text-on-surface-variant hover:text-on-surface transition-colors z-10">
            <XIcon className="w-5 h-5" />
        </button>
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-surface-background border-b md:border-b-0 md:border-r border-on-surface/5 flex flex-col p-6 flex-shrink-0">
            <div className="flex items-center gap-3 mb-6 md:mb-8 px-2">
                <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold text-lg">U</div>
                <span className="font-bold text-sm">User Name</span>
            </div>
            {/* Menu List (SP: Grid, PC: Stack) */}
            <div className="grid grid-cols-2 md:flex md:flex-col gap-2">
                <button className="flex items-center gap-2 md:gap-3 text-left px-3 py-3 rounded-lg bg-on-surface/5 font-bold text-xs md:text-sm text-on-surface justify-center md:justify-start">
                    <UserIcon className="w-4 h-4" />
                    アカウント
                </button>
                <button className="flex items-center gap-2 md:gap-3 text-left px-3 py-3 rounded-lg text-on-surface-variant hover:bg-on-surface/5 text-xs md:text-sm transition-colors justify-center md:justify-start">
                    <SettingsIcon className="w-4 h-4" />
                    初期設定
                </button>
                <button className="flex items-center gap-2 md:gap-3 text-left px-3 py-3 rounded-lg text-on-surface-variant hover:bg-on-surface/5 text-xs md:text-sm transition-colors justify-center md:justify-start">
                    <SettingsIcon className="w-4 h-4" />
                    アプリ設定
                </button>
            </div>
            <div className="hidden md:block mt-auto pt-4 border-t border-on-surface/10">
                <p className="text-[10px] text-on-surface-variant/50 text-center">DJ Timekeeper Pro v3.3.0</p>
            </div>
        </aside>
        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 h-[400px] md:h-auto">
            <div className="p-5 md:p-10 flex-1 overflow-y-auto custom-scrollbar">
                <div className="space-y-8 md:space-y-10">
                    <section>
                        <h3 className="text-lg font-bold text-on-surface mb-1">プロフィール</h3>
                        <p className="text-xs text-on-surface-variant mb-6 opacity-80">アプリ内で表示されるあなたの公開情報です。</p>
                        <div className="space-y-5">
                            <div>
                                <Label>表示名</Label>
                                <NewInput value="DJ Takuya" />
                            </div>
                            <div>
                                <Label>メールアドレス</Label>
                                <div className="text-sm font-mono text-on-surface-variant border-b border-dashed border-on-surface/20 pb-1 inline-block">user@example.com</div>
                            </div>
                        </div>
                    </section>
                    <section>
                        <h3 className="text-lg font-bold text-on-surface mb-4 border-b border-on-surface/5 pb-2">セッション</h3>
                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-background rounded-lg transition-colors border border-on-surface/10">
                            <LogOutIcon className="w-4 h-4" />
                            <span>アカウントからログアウト</span>
                        </button>
                    </section>
                    <section>
                        <div className="mb-4 border-b border-red-500/20 pb-2">
                            <h3 className="text-base font-bold text-red-500 flex items-center gap-2"><AlertTriangleIcon className="w-4 h-4" /> Danger Zone</h3>
                        </div>
                        <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                            <div>
                                <p className="font-bold text-on-surface text-sm">アカウントを削除する</p>
                                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed opacity-80">全てのデータが削除されます。<br />この操作は取り消せません。</p>
                            </div>
                            <NewButton variant="danger" size="sm">削除する</NewButton>
                        </div>
                    </section>
                </div>
            </div>
            <div className="p-4 md:p-6 border-t border-on-surface/5 bg-surface-background/30 flex justify-end gap-3">
                <NewButton variant="ghost" size="sm">キャンセル</NewButton>
                <NewButton variant="primary" size="sm">設定を保存</NewButton>
            </div>
        </main>
    </div>
);

// --- Page Layout Helper ---
const Section = ({ title, description, children }) => (
    <div className="mb-16">
        <div className="mb-6">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-3 font-sans">
                <span className="w-1.5 h-6 bg-brand-primary rounded-full"></span>
                {title}
            </h2>
            <p className="text-sm text-on-surface-variant mt-1 ml-4.5 font-sans">{description}</p>
        </div>
        <div className="p-8 rounded-3xl bg-surface-background/50 border border-dashed border-on-surface/10 dark:border-white/10 space-y-8">
            {children}
        </div>
    </div>
);

const Row = ({ label, children }) => (
    <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-6 items-center">
        <div className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider font-sans">{label}</div>
        <div className="flex flex-wrap gap-4 items-center">{children}</div>
    </div>
);

// --- Spacing Visualizer ---
const SpacingBlock = ({ label, sizeClass }) => (
    <div className="flex flex-col gap-2">
        <div className={`bg-brand-primary/20 border border-brand-primary/50 rounded-lg flex items-center justify-center text-xs font-mono text-brand-primary ${sizeClass}`}>
            Space
        </div>
        <span className="text-xs text-on-surface-variant font-mono">{label}</span>
    </div>
);

// --- New Components for Sections 9-12 ---

// 9. Tabs (★修正: 影切れ防止)
const NewTabs = ({ items, activeId, onChange }) => (
    // p-4, -mx-4 で影の領域を確保
    <div className="flex items-center gap-2 overflow-x-auto p-4 no-scrollbar -mx-4">
        {items.map(item => {
            const isActive = item.id === activeId;
            return (
                <button
                    key={item.id}
                    onClick={() => onChange(item.id)}
                    className={`
                        px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all duration-200
                        ${isActive
                            ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30 hover:-translate-y-0.5'
                            : 'bg-surface-container hover:bg-surface-container/80 text-on-surface-variant hover:text-on-surface shadow-sm border border-on-surface/5'
                        }
                    `}
                >
                    {item.label}
                </button>
            );
        })}
    </div>
);

// 10. Status Badge (★修正: ON AIRを赤枠+発光+赤文字に変更)
const NewBadge = ({ status, label }) => {
    const styles = {
        onAir: "bg-surface-container border border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]",
        upcoming: "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
        finished: "bg-on-surface/5 text-on-surface-variant border-on-surface/10",
        standby: "bg-amber-500/10 text-amber-500 border-amber-500/20"
    };

    return (
        <span className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border
            ${styles[status] || styles.standby}
        `}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'onAir' ? 'bg-current animate-ping' : 'bg-current'}`}></span>
            {label}
        </span>
    );
};

// 11. Empty State (★修正: 透明度を削除し、ボタンをくっきりと表示)
const NewEmptyState = ({ icon: Icon, title, description, action }) => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4 shadow-sm border border-on-surface/5">
            <Icon className="w-8 h-8 text-on-surface-variant" />
        </div>
        <h3 className="text-lg font-bold text-on-surface mb-1">{title}</h3>
        <p className="text-sm text-on-surface-variant max-w-xs mx-auto leading-relaxed mb-6">{description}</p>
        {action && action}
    </div>
);

// 12. Color Picker
const NewColorPicker = ({ colors, selectedColor, onSelect }) => (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 p-2">
        {colors.map(color => (
            <button
                key={color}
                onClick={() => onSelect(color)}
                className={`
                    w-10 h-10 rounded-full transition-all duration-200 relative group
                    ${selectedColor === color ? 'scale-110 shadow-lg ring-2 ring-offset-2 ring-brand-primary ring-offset-surface-container' : 'hover:scale-105 hover:shadow-md'}
                `}
                style={{ backgroundColor: color }}
                title={color}
            >
                {selectedColor === color && (
                    <span className="absolute inset-0 flex items-center justify-center text-white/90 drop-shadow-md">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </span>
                )}
            </button>
        ))}
    </div>
);

const VIVID_COLORS_SAMPLE = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16',
    '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6',
    '#D946EF', '#F43F5E', '#64748B', '#1E293B'
];

// --- Demo Components for Previews ---
const DemoModal = ({ onClose }) => {
    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-surface-container rounded-2xl w-full max-w-md shadow-2xl relative animate-modal-in flex flex-col max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-6 pb-0 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-on-surface">新規イベント作成</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-background text-on-surface-variant hover:text-on-surface transition-colors -mr-2"><XIcon className="w-6 h-6" /></button>
                </header>
                <div className="p-6 space-y-6 overflow-y-auto">
                    <div className="space-y-4">
                        <div>
                            <Label>イベント名</Label>
                            <NewInput placeholder="イベント名を入力..." autoFocus />
                        </div>
                        <div className="space-y-3">
                            <div><Label>開催日</Label><NewInput type="date" value="2025-11-22" icon={CalendarIcon} /></div>
                            <div>
                                <Label>開始時間</Label>
                                <div className="flex items-stretch w-full gap-2">
                                    <button className="flex-1 py-3 rounded-xl bg-surface-container hover:bg-surface-background border border-on-surface/10 dark:border-white/10 text-base font-bold shadow-sm text-on-surface active:scale-95 transition-transform">-15</button>
                                    <div className="flex-grow relative group">
                                        <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50 pointer-events-none" />
                                        <div className="bg-surface-background text-on-surface py-3 pl-10 pr-2 w-full h-full rounded-xl border border-on-surface/5 dark:border-white/10 shadow-inner flex items-center justify-center">
                                            <span className="font-mono font-bold text-xl tracking-widest">22:00</span>
                                        </div>
                                    </div>
                                    <button className="flex-1 py-3 rounded-xl bg-surface-container hover:bg-surface-background border border-on-surface/10 dark:border-white/10 text-base font-bold shadow-sm text-on-surface active:scale-95 transition-transform">+15</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <hr className="border-on-surface/10" />
                    <div className="space-y-2">
                        <Label>オプション設定</Label>
                        <div className="bg-surface-background/50 rounded-xl px-4 py-2 space-y-2">
                            <NewToggle label="VJタイムテーブル機能" icon={VideoIcon} />
                            <div className="border-t border-on-surface/5"></div>
                            <NewToggle label="複数フロアを使用" icon={LayersIcon} />
                        </div>
                    </div>
                </div>
                <div className="p-6 pt-0 flex justify-end gap-3 flex-shrink-0">
                    <NewButton variant="ghost" onClick={onClose} size="md">キャンセル</NewButton>
                    <NewButton variant="primary" onClick={onClose} size="md">作成する</NewButton>
                </div>
            </div>
        </div>,
        document.body
    );
};

export const UITestPage = ({ theme, toggleTheme }) => {
    const [activeTab, setActiveTab] = useState('floor1');
    const [selectedColor, setSelectedColor] = useState(VIVID_COLORS_SAMPLE[6]);
    const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

    const timeBtnClass = "flex-1 py-3 rounded-xl bg-surface-container hover:bg-surface-background border border-on-surface/10 dark:border-white/10 text-base font-bold shadow-sm text-on-surface active:scale-95 transition-transform";

    return (
        <div className="min-h-screen bg-surface-background p-6 md:p-12 pb-32 animate-fade-in transition-colors duration-300">
            <div className="max-w-5xl mx-auto">
                <header className="mb-12 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-on-surface mb-2 tracking-tight font-sans">UI Design Catalog</h1>
                        <p className="text-on-surface-variant font-medium font-sans">v4.7.0 | Responsive & Final Polish</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={toggleTheme} className="px-4 py-2 bg-surface-container rounded-xl shadow-sm border border-on-surface/10 dark:border-white/10 flex items-center gap-2 hover:bg-surface-background transition-colors">
                            {theme === 'dark' ? <SunIcon className="w-5 h-5 text-brand-primary" /> : <MoonIcon className="w-5 h-5 text-on-surface-variant" />}
                            <span className="text-sm font-bold text-on-surface">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                        </button>
                        <Link to="/" className="px-5 py-2.5 bg-surface-container rounded-xl text-sm font-bold text-on-surface shadow-sm border border-on-surface/10 dark:border-white/10 hover:bg-surface-background hover:shadow-md transition-all font-sans flex items-center">
                            戻る
                        </Link>
                    </div>
                </header>

                {/* 1. Text Size System */}
                <Section title="1. Text Size System" description="階層構造を明確にする文字サイズ定義。">
                    <div className="space-y-6">
                        <div className="border-b border-on-surface/10 pb-4">
                            <div className="text-3xl font-bold text-on-surface mb-2">Display Text</div>
                            <div className="text-xs text-on-surface-variant font-mono">text-3xl / Bold / Page Titles</div>
                        </div>
                        <div className="border-b border-on-surface/10 pb-4">
                            <div className="text-2xl font-bold text-on-surface mb-2">Section Heading</div>
                            <div className="text-xs text-on-surface-variant font-mono">text-2xl / Bold / Major Sections</div>
                        </div>
                        <div className="border-b border-on-surface/10 pb-4">
                            <div className="text-lg font-bold text-on-surface mb-2">Card Heading</div>
                            <div className="text-xs text-on-surface-variant font-mono">text-lg / Bold / Item Titles</div>
                        </div>
                        <div className="border-b border-on-surface/10 pb-4">
                            <div className="text-base font-medium text-on-surface mb-2">Body Text: The quick brown fox jumps over the lazy dog.</div>
                            <div className="text-xs text-on-surface-variant font-mono">text-base / Medium / Content</div>
                        </div>
                        <div>
                            <div className="text-sm font-bold text-on-surface-variant mb-2">LABEL / CAPTION</div>
                            <div className="text-xs text-on-surface-variant font-mono">text-sm / Bold / Metadata & Inputs</div>
                        </div>
                    </div>
                </Section>

                {/* 2. Forms & Lists */}
                <Section title="2. Forms & Lists" description="視認性の高い入力フォームと、押しやすい時間調整ボタン。">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <h3 className="font-bold text-sm text-on-surface-variant uppercase tracking-wider mb-4">Inputs</h3>
                            <NewInput label="イベントタイトル" placeholder="例: Saturday Night Fever" />
                            <NewInput label="検索" placeholder="ユーザー名で検索..." icon={SearchIcon} />

                            <div>
                                <Label>開始時間</Label>
                                <div className="flex items-stretch w-full gap-2">
                                    <button className={timeBtnClass}>-15</button>
                                    <div className="flex-grow relative group">
                                        <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50 pointer-events-none" />
                                        <div className="bg-surface-background text-on-surface py-3 pl-10 pr-2 w-full h-full rounded-xl border border-on-surface/5 dark:border-white/10 shadow-inner flex items-center justify-center">
                                            <span className="font-mono font-bold text-xl tracking-widest">22:00</span>
                                        </div>
                                    </div>
                                    <button className={timeBtnClass}>+15</button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="font-bold text-sm text-on-surface-variant uppercase tracking-wider mb-4">Lists & Toggles</h3>
                            <div className="space-y-2">
                                <NewListItem label="Main Floor" onDelete={() => { }} />
                                <NewListItem label="Sub Floor" onDelete={() => { }} />
                            </div>
                            <div className="pt-4 space-y-4">
                                <NewToggle label="VJタイムテーブル機能" checked={true} onChange={() => { }} />
                                <div className="pt-2">
                                    <NewTrigger label="DJを追加" icon={PlusIcon} />
                                </div>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* 3. Sortable Items (DJ/VJ) - SP最適化済み */}
                <Section title="3. Sortable Items (DJ/VJ)" description="モバイルでは2段組みになり、入力エリアを確保するレスポンシブデザイン。">
                    <div className="space-y-4 max-w-2xl">
                        <NewSortableCard
                            initialName="DJ TAKUYA"
                            initialDuration={60}
                            time="22:00 - 23:00"
                            color="#3B82F6"
                            isDragging={false}
                        />
                        <NewSortableCard
                            initialName="DJ YUI (Dragging)"
                            initialDuration={45}
                            time="23:00 - 23:45"
                            color="#EC4899"
                            isDragging={true}
                        />
                    </div>
                </Section>

                {/* 4. Buttons */}
                <Section title="4. Buttons" description="物理的な押し心地を表現したボタンスタイル。">
                    <Row label="Large (L)">
                        <NewButton size="lg" variant="primary" icon={PlusIcon}>新規イベント作成</NewButton>
                        <NewButton size="lg" variant="secondary">詳細設定</NewButton>
                        <NewButton size="lg" variant="icon" icon={PlayIcon} />
                    </Row>
                    <Row label="Medium (M)">
                        <NewButton size="md" variant="primary">保存する</NewButton>
                        <NewButton size="md" variant="secondary" icon={SettingsIcon}>設定</NewButton>
                        <NewButton size="md" variant="danger" icon={TrashIcon}>削除</NewButton>
                    </Row>
                    <Row label="Small (S)">
                        <NewButton size="sm" variant="primary">保存</NewButton>
                        <NewButton size="sm" variant="secondary">編集</NewButton>
                        <NewButton size="sm" variant="danger" icon={TrashIcon}>削除</NewButton>
                    </Row>
                </Section>

                {/* 5. Dashboard Cards */}
                <Section title="5. Dashboard Cards" description="開始時間を追加し、情報を充実させたイベントカード。">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                        <NewEventCard
                            title="Saturday Night Fever"
                            date={{ month: 'NOV', day: '22' }}
                            floors={2}
                            startTime="22:00"
                            isActive={false}
                        />
                        <NewEventCard
                            title="Countdown Party 2025"
                            date={{ month: 'DEC', day: '31' }}
                            floors={3}
                            startTime="20:00"
                            isActive={true}
                        />
                    </div>
                </Section>

                {/* 6. Screen Previews */}
                <Section title="6. Screen Previews" description="実際の画面構成におけるUIパーツの見え方を確認。">
                    {/* Dashboard Preview */}
                    <div className="mb-12">
                        <CategoryHeader title="Dashboard View" />
                        <PreviewContainer>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                                <NewEventCard title="Saturday Night Fever" date={{ month: 'NOV', day: '22' }} floors={2} startTime="22:00" isActive={false} />
                                <NewEventCard title="Countdown Party 2025" date={{ month: 'DEC', day: '31' }} floors={3} startTime="20:00" isActive={true} />
                                <button className="flex items-center justify-center gap-2 h-full min-h-[180px] rounded-3xl border-2 border-dashed border-on-surface/10 text-on-surface-variant hover:text-brand-primary hover:bg-brand-primary/5 hover:border-brand-primary/30 transition-all">
                                    <PlusIcon className="w-8 h-8" />
                                    <span className="font-bold">新規作成</span>
                                </button>
                            </div>
                        </PreviewContainer>
                    </div>

                    {/* Editor Preview */}
                    <div className="mb-12">
                        <CategoryHeader title="Editor View" />
                        <PreviewContainer className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-on-surface">Main Floor</h2>
                                <div className="flex gap-2">
                                    <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded">TOTAL: 3h 00m</span>
                                </div>
                            </div>
                            <NewSortableCard initialName="DJ TAKUYA" initialDuration={60} time="22:00 - 23:00" color="#3B82F6" isDragging={false} />
                            <NewSortableCard initialName="DJ YUI" initialDuration={60} time="23:00 - 00:00" color="#EC4899" isDragging={false} />
                            <NewSortableCard initialName="GUEST DJ" initialDuration={60} time="00:00 - 01:00" color="#F59E0B" isDragging={false} />
                            <NewTrigger label="DJを追加" icon={PlusIcon} />
                        </PreviewContainer>
                    </div>

                    {/* Modal Previews */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                        <div>
                            <CategoryHeader title="Modal View: Create Event" />
                            <div className="flex justify-center py-8 bg-black/5 rounded-3xl border border-dashed border-on-surface/10">
                                <CreateEventModalPreview />
                            </div>
                        </div>
                        <div>
                            <CategoryHeader title="Modal View: Floor Manager" />
                            <div className="flex justify-center py-8 bg-black/5 rounded-3xl border border-dashed border-on-surface/10">
                                <FloorManagerModalPreview />
                            </div>
                        </div>
                        <div className="xl:col-span-2">
                            <CategoryHeader title="Modal View: Dashboard Settings" />
                            <div className="flex justify-center py-8 bg-black/5 rounded-3xl border border-dashed border-on-surface/10">
                                <DashboardSettingsModalPreview />
                            </div>
                        </div>
                    </div>
                    {/* Demo Modal Trigger */}
                    <div className="mt-8 text-center">
                        <NewButton variant="primary" size="md" onClick={() => setIsDemoModalOpen(true)}>Open Demo Modal (Portal)</NewButton>
                    </div>
                </Section>

                {/* 7. Layout Rules */}
                <Section title="7. Layout Rules" description="レイアウトを一貫させるためのコンポーネントとルール。">
                    <div className="grid grid-cols-1 gap-8">
                        <div>
                            <h4 className="text-sm font-bold text-on-surface mb-2">1. Preview Container (Content Wrapper)</h4>
                            <p className="text-xs text-on-surface-variant mb-3">DashboardやEditorなどのメインコンテンツを囲む、凹み表現のあるコンテナ。</p>
                            <PreviewContainer>
                                <div className="h-12 flex items-center justify-center text-on-surface-variant font-mono">Inner Content Area</div>
                            </PreviewContainer>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-on-surface mb-2">2. Category Header (Section Title)</h4>
                            <p className="text-xs text-on-surface-variant mb-3">ページ内の大きなセクションを区切るための見出し。</p>
                            <CategoryHeader title="Section Title Example" />
                        </div>
                    </div>
                </Section>

                {/* 8. Spacing Rules */}
                <Section title="8. Spacing Rules" description="UIの呼吸を整えるための余白ルール。">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <h4 className="text-sm font-bold text-on-surface mb-4">Small (Gap)</h4>
                            <div className="space-y-4">
                                <SpacingBlock label="gap-1 (4px): アイコンとテキスト" sizeClass="w-4 h-4" />
                                <SpacingBlock label="gap-2 (8px): ボタン内の要素" sizeClass="w-8 h-8" />
                                <SpacingBlock label="gap-3 (12px): リストアイテム間" sizeClass="w-12 h-12" />
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-on-surface mb-4">Medium (Padding)</h4>
                            <div className="space-y-4">
                                <SpacingBlock label="p-3 (12px): リストアイテム内部" sizeClass="w-12 h-12" />
                                <SpacingBlock label="p-4 (16px): カード内部" sizeClass="w-16 h-16" />
                                <SpacingBlock label="p-6 (24px): モーダル/コンテナ内部" sizeClass="w-24 h-24" />
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-on-surface mb-4">Large (Layout)</h4>
                            <div className="space-y-4">
                                <SpacingBlock label="gap-6 (24px): グリッド間隔" sizeClass="w-24 h-24" />
                                <SpacingBlock label="mb-12 (48px): セクション間隔" sizeClass="w-32 h-12" />
                            </div>
                        </div>
                    </div>
                </Section>

                {/* 9. Tabs & Navigation */}
                <Section title="9. Tabs & Navigation" description="直感的なフロア切り替えやナビゲーション。">
                    <NewTabs
                        items={[
                            { id: 'floor1', label: 'Main Floor' },
                            { id: 'floor2', label: 'Sub Floor' },
                            { id: 'floor3', label: 'Lounge' }
                        ]}
                        activeId={activeTab}
                        onChange={setActiveTab}
                    />
                </Section>

                {/* 10. Status Badges (★修正: 変更反映済み) */}
                <Section title="10. Status Badges" description="イベントの状態を一目で伝えるバッジ。">
                    <div className="flex flex-wrap gap-4">
                        <NewBadge status="onAir" label="ON AIR" />
                        <NewBadge status="upcoming" label="UPCOMING" />
                        <NewBadge status="finished" label="FINISHED" />
                        <NewBadge status="standby" label="STANDBY" />
                    </div>
                </Section>

                {/* 11. Empty States (★修正: 透過度削除) */}
                <Section title="11. Empty States" description="データがない時のプレースホルダー。">
                    <PreviewContainer>
                        <NewEmptyState
                            icon={LayersIcon}
                            title="イベントがありません"
                            description="右下のボタンから、最初のイベントを作成しましょう！"
                            action={
                                <NewButton variant="primary" size="md" icon={PlusIcon}>新規作成</NewButton>
                            }
                        />
                    </PreviewContainer>
                </Section>

                {/* 12. Color Picker */}
                <Section title="12. Color Picker" description="DJのイメージカラーを選択するパレット。">
                    <div className="max-w-md">
                        <div className="flex items-center gap-2 mb-2">
                            <PaletteIcon className="w-4 h-4 text-on-surface-variant" />
                            <span className="text-sm font-bold text-on-surface">Theme Color</span>
                        </div>
                        <NewColorPicker
                            colors={VIVID_COLORS_SAMPLE}
                            selectedColor={selectedColor}
                            onSelect={setSelectedColor}
                        />
                    </div>
                </Section>

                {/* 13. Layout & Gutters (★新規追加) */}
                <Section title="13. Layout & Gutters" description="サイト全体のラッパーとマージンルール（レスポンシブ対応）。">
                    <div className="space-y-8">
                        <div>
                            <h4 className="text-sm font-bold text-on-surface mb-4">Global Page Wrapper</h4>
                            <div className="bg-black/20 p-4 rounded-lg border border-on-surface/10 text-xs font-mono overflow-x-auto text-on-surface">
                                {`<div className="min-h-screen bg-surface-background p-4 md:p-8 max-w-7xl mx-auto pb-32">`}
                            </div>
                            <div className="mt-4 grid grid-cols-1 gap-4">
                                <div className="border border-dashed border-brand-primary/50 bg-brand-primary/5 p-4 rounded-lg text-center relative">
                                    <span className="text-brand-primary font-bold text-xs block mb-2">max-w-7xl (1280px) mx-auto</span>
                                    <div className="border border-dashed border-red-500/50 bg-red-500/5 p-4 rounded mx-4 md:mx-8 relative">
                                        <span className="text-red-500 font-bold text-xs">p-4 (Mobile) / p-8 (Tablet+)</span>
                                        <div className="bg-surface-container h-20 rounded shadow-sm border border-on-surface/10 flex items-center justify-center mt-2">
                                            <span className="text-on-surface-variant font-bold">Content Area</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* 14. Tactile Spinner (★新規追加) */}
                <Section title="14. Tactile Spinner" description="物理的な質量と発光を感じさせるローディングアニメーション。">
                    <div className="flex items-center justify-center p-12 bg-surface-background/50 rounded-3xl">
                        <TactileSpinner />
                    </div>
                </Section>

            </div>
            {isDemoModalOpen && <DemoModal onClose={() => setIsDemoModalOpen(false)} />}
        </div>
    );
};