import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    PlayIcon, SettingsIcon, PlusIcon, TrashIcon,
    LayersIcon, LogOutIcon, GripIcon, UserIcon,
    VideoIcon, CalendarIcon, CopyIcon,
    Button, Input, ToggleSwitch, CustomTimeInput,
    Label, ClockIcon, MoonIcon, SunIcon, SearchIcon
} from './common';

// --- Design System Definitions (v2.3.3 - Refined Tactile & Visibility) ---

// 1. Buttons (変更なし)
const NewButton = ({
    variant = 'secondary',
    size = 'md',
    children,
    className = '',
    icon: Icon,
    disabled = false
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
        <button disabled={disabled} className={`${base} ${sizeClass} ${styles[variant]} ${className}`}>
            {Icon && <Icon className={iconSvgSizes[size]} />}
            {children}
        </button>
    );
};

// 2. Input Fields (変更なし)
const NewInput = ({ label, placeholder, icon: Icon, value = "" }) => (
    <div className="w-full">
        {label && <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1 font-sans">{label}</label>}
        <div className="relative group">
            {Icon && (
                <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50 group-focus-within:text-brand-primary transition-colors" />
            )}
            <input
                type="text"
                placeholder={placeholder}
                defaultValue={value}
                className={`
                    w-full bg-surface-background text-on-surface
                    ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3.5
                    rounded-xl border border-on-surface/5 dark:border-white/10
                    focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary
                    shadow-inner transition-all duration-200
                    text-base font-medium placeholder-on-surface-variant/30
                `}
            />
        </div>
    </div>
);

// 3. Toggle Switch (視認性強化: Border強化)
const NewToggle = ({ label, checked = false, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-surface-container rounded-2xl border border-on-surface/10 dark:border-white/10 shadow-sm hover:border-on-surface/20 transition-colors">
        <span className="font-bold text-sm text-on-surface font-sans">{label}</span>
        <button
            onClick={() => onChange && onChange(!checked)}
            className={`
                relative w-12 h-7 rounded-full transition-colors duration-300 ease-in-out focus:outline-none
                ${checked ? 'bg-brand-primary shadow-inner' : 'bg-on-surface/20 dark:bg-white/20 shadow-inner'}
            `}
        >
            <span className={`
                absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1)
                ${checked ? 'translate-x-5' : 'translate-x-0'}
            `} />
        </button>
    </div>
);

// 4. DJ/VJ Card (大幅刷新: Layout Redesign)
const NewSortableCard = ({ initialName, initialDuration, time, color, isDragging }) => {
    const [name, setName] = useState(initialName);
    const [duration, setDuration] = useState(initialDuration);

    return (
        <div className={`
            flex items-stretch gap-0 rounded-2xl bg-surface-container
            border border-on-surface/10 dark:border-white/10 overflow-hidden
            transition-all duration-300
            ${isDragging ? 'scale-105 shadow-2xl z-50 ring-2 ring-brand-primary' : 'shadow-sm hover:shadow-md hover:border-on-surface/20'}
        `}>
            {/* 1. Color Indicator & Grip (Large Touch Target) */}
            <div
                className="w-12 flex flex-col items-center justify-center cursor-grab hover:opacity-80 active:opacity-100 transition-opacity"
                style={{ backgroundColor: color }}
                title="Color Label (Drag to sort)"
            >
                <GripIcon className="w-6 h-6 text-white/50" />
            </div>

            {/* 2. Content Area */}
            <div className="flex-grow p-4 flex flex-col justify-center gap-3 min-w-0">

                {/* Top Row: Name (Huge) */}
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="
                        w-full bg-transparent text-xl font-bold text-on-surface
                        border-b border-transparent focus:border-brand-primary
                        px-0 py-0.5
                        focus:outline-none transition-all placeholder-on-surface-variant/30 truncate
                    "
                    placeholder="Artist Name"
                />

                {/* Bottom Row: Duration & Time */}
                <div className="flex items-center gap-4">
                    {/* Duration Input (Prominent) */}
                    <div className="flex items-center gap-2 bg-surface-background rounded-lg px-3 py-1.5 border border-on-surface/5 dark:border-white/5 shadow-inner">
                        <span className="text-xs font-bold text-on-surface-variant uppercase">Time</span>
                        <div className="relative w-16">
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="
                                    w-full bg-transparent text-lg font-mono font-bold text-on-surface
                                    focus:outline-none text-right pr-1
                                    focus:text-brand-primary transition-colors
                                "
                            />
                        </div>
                        <span className="text-xs font-bold text-on-surface-variant">min</span>
                    </div>

                    {/* Time Slot Display */}
                    <div className="text-sm font-mono font-medium text-on-surface-variant flex items-center gap-1.5">
                        <ClockIcon className="w-4 h-4 opacity-60" />
                        {time}
                    </div>
                </div>
            </div>

            {/* 3. Actions (Vertical) */}
            <div className="flex flex-col justify-center gap-2 pr-2 pl-2 border-l border-on-surface/5 dark:border-white/5">
                <button className="p-2 rounded-lg text-on-surface-variant hover:text-brand-primary hover:bg-brand-primary/10 transition-colors">
                    <CopyIcon className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-lg text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 transition-colors">
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

// 5. Dashboard Event Card (変更なし)
const NewEventCard = ({ title, date, floors, isActive }) => (
    <div className={`
        group relative bg-surface-container rounded-3xl p-6
        transition-all duration-300 cursor-pointer overflow-hidden flex flex-col
        hover:-translate-y-1
        ${isActive
            ? 'border-2 border-brand-primary shadow-lg shadow-brand-primary/20'
            : 'border border-on-surface/10 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-on-surface/20'
        }
    `}>
        <div className="flex items-start gap-5 mb-6">
            <div className={`
                flex flex-col items-center justify-center w-16 h-16 rounded-2xl shadow-inner border shrink-0
                ${isActive
                    ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
                    : 'bg-surface-background border-on-surface/5 dark:border-white/10 text-on-surface-variant'
                }
            `}>
                <span className="text-[10px] font-bold tracking-widest uppercase leading-none mb-1 opacity-70">{date.month}</span>
                <span className="text-2xl font-bold leading-none font-mono">{date.day}</span>
            </div>

            <div className="flex-1 min-w-0 pt-1">
                {isActive && (
                    <div className="flex items-center gap-2 mb-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                        </span>
                        <span className="text-[10px] font-bold text-brand-primary tracking-widest uppercase">NOW ON AIR</span>
                    </div>
                )}
                <h3 className="text-lg font-bold truncate mb-1 font-sans text-on-surface">{title}</h3>
                <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                    <LayersIcon className="w-3 h-3" />
                    <span>{floors} Floors</span>
                </div>
            </div>
        </div>

        <div className="mt-auto pt-4 border-t border-on-surface/5 dark:border-white/5 flex justify-between items-center">
            <span className="text-xs font-bold text-on-surface-variant/50 group-hover:text-on-surface-variant transition-colors">Open Editor</span>
            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-all
                ${isActive ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30' : 'bg-surface-background text-on-surface-variant group-hover:bg-on-surface/10 dark:group-hover:bg-white/10'}
            `}>
                <PlayIcon className="w-3 h-3" />
            </div>
        </div>
    </div>
);

// 6. List Item (視認性強化: Border)
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
        <button onClick={onDelete} className="p-2 rounded-full text-on-surface-variant/50 hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
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

// --- Page Layout ---

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

export const UITestPage = ({ theme, toggleTheme }) => {
    // デモ用のトグル状態
    const [demoToggle, setDemoToggle] = useState(true);

    return (
        <div className="min-h-screen bg-surface-background p-6 md:p-12 pb-32 animate-fade-in transition-colors duration-300">
            <div className="max-w-5xl mx-auto">
                <header className="mb-12 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-on-surface mb-2 tracking-tight font-sans">UI Design Catalog</h1>
                        <p className="text-on-surface-variant font-medium font-sans">v2.3.3 | High Visibility & Typography</p>
                    </div>
                    <div className="flex gap-4">
                        {/* Dark Mode Toggle for Testing */}
                        <button onClick={toggleTheme} className="px-4 py-2 bg-surface-container rounded-xl shadow-sm border border-on-surface/10 dark:border-white/10 flex items-center gap-2 hover:bg-surface-background transition-colors">
                            {theme === 'dark' ? <SunIcon className="w-5 h-5 text-brand-primary" /> : <MoonIcon className="w-5 h-5 text-on-surface-variant" />}
                            <span className="text-sm font-bold text-on-surface">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                        </button>
                        <Link to="/" className="px-5 py-2.5 bg-surface-container rounded-xl text-sm font-bold text-on-surface shadow-sm border border-on-surface/10 dark:border-white/10 hover:bg-surface-background hover:shadow-md transition-all font-sans flex items-center">
                            戻る
                        </Link>
                    </div>
                </header>

                {/* 1. Buttons */}
                <Section title="1. Buttons" description="重要度に応じた3つのサイズと、物理的な光の表現。">
                    <Row label="Large (L)">
                        <NewButton size="lg" variant="primary" icon={PlusIcon}>新規イベント作成</NewButton>
                        <NewButton size="lg" variant="secondary">詳細設定</NewButton>
                        <NewButton size="lg" variant="icon" icon={PlayIcon} />
                    </Row>
                    <Row label="Medium (M)">
                        <NewButton size="md" variant="primary">保存する</NewButton>
                        <NewButton size="md" variant="secondary" icon={SettingsIcon}>設定</NewButton>
                        <NewButton size="md" variant="secondary">キャンセル</NewButton>
                        <NewButton size="md" variant="icon" icon={UserIcon} />
                    </Row>
                    <Row label="Small (S)">
                        <NewButton size="sm" variant="primary">保存</NewButton>
                        <NewButton size="sm" variant="secondary">編集</NewButton>
                        <NewButton size="sm" variant="danger" icon={TrashIcon}>削除</NewButton>
                        <NewButton size="sm" variant="icon" icon={SearchIcon} />
                    </Row>
                </Section>

                {/* 2. DJ/VJ Cards */}
                <Section title="2. Sortable Items (DJ/VJ)" description="編集機能を内包した高機能カード。時間設定を強調。">
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

                {/* 3. Dashboard Cards */}
                <Section title="3. Dashboard Cards" description="高コントラストで日付と状態を視認しやすく。">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                        <NewEventCard
                            title="Saturday Night Fever"
                            date={{ month: 'NOV', day: '22' }}
                            floors={2}
                            isActive={false}
                        />
                        <NewEventCard
                            title="Countdown Party 2025"
                            date={{ month: 'DEC', day: '31' }}
                            floors={3}
                            isActive={true}
                        />
                    </div>
                </Section>

                {/* 4. Forms & Modals */}
                <Section title="4. Forms & Lists" description="ダークモードでも視認性の高い境界線と、拡大された時間入力。">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <h3 className="font-bold text-sm text-on-surface-variant uppercase tracking-wider mb-4">Inputs</h3>
                            <NewInput label="イベントタイトル" placeholder="例: Saturday Night Fever" />
                            <NewInput label="検索" placeholder="ユーザー名で検索..." icon={SearchIcon} />
                            <div>
                                <Label>開始時間</Label>
                                <div className="flex items-stretch w-full gap-2">
                                    <button className="flex-1 py-3 rounded-xl bg-surface-container hover:bg-surface-background border border-on-surface/10 dark:border-white/10 text-xs font-bold shadow-sm text-on-surface">-15</button>
                                    <div className="flex-grow relative">
                                        <ClockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
                                        {/* 時間表示を大きく (text-3xl) */}
                                        <div className="bg-surface-background text-on-surface py-3 pl-10 pr-2 w-full rounded-xl border border-on-surface/10 dark:border-white/10 shadow-inner text-center font-mono font-bold text-3xl tracking-widest">
                                            22:00
                                        </div>
                                    </div>
                                    <button className="flex-1 py-3 rounded-xl bg-surface-container hover:bg-surface-background border border-on-surface/10 dark:border-white/10 text-xs font-bold shadow-sm text-on-surface">+15</button>
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
                                <NewToggle label="デモ用トグル" checked={demoToggle} onChange={setDemoToggle} />
                                <div className="pt-2">
                                    <NewTrigger label="DJを追加" icon={PlusIcon} />
                                </div>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* 5. Typography System */}
                <Section title="5. Text Size System" description="階層構造を明確にする文字サイズ定義。">
                    <div className="space-y-6">
                        <div className="border-b border-on-surface/10 pb-4">
                            <div className="text-4xl font-bold text-on-surface mb-2">Display Text</div>
                            <div className="text-xs text-on-surface-variant font-mono">text-4xl / Bold / Page Titles</div>
                        </div>
                        <div className="border-b border-on-surface/10 pb-4">
                            <div className="text-lg font-bold text-on-surface mb-2">Heading Text</div>
                            <div className="text-xs text-on-surface-variant font-mono">text-lg / Bold / Card Titles</div>
                        </div>
                        <div className="border-b border-on-surface/10 pb-4">
                            <div className="text-base font-medium text-on-surface mb-2">Body Text: The quick brown fox jumps over the lazy dog.</div>
                            <div className="text-xs text-on-surface-variant font-mono">text-base / Medium / Content</div>
                        </div>
                        <div className="border-b border-on-surface/10 pb-4">
                            <div className="text-sm font-bold text-on-surface mb-2">Label Text</div>
                            <div className="text-xs text-on-surface-variant font-mono">text-sm / Bold / Inputs & Buttons</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-on-surface-variant mb-2">CAPTION TEXT</div>
                            <div className="text-xs text-on-surface-variant font-mono">text-xs / Bold / Metadata</div>
                        </div>
                    </div>
                </Section>

            </div>
        </div>
    );
};