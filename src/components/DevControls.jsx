// [src/components/DevControls.jsx]
import React, { useState } from 'react';
import {
    SettingsIcon,
    ResetIcon,
    SparklesIcon,
    VideoIcon,
    ClockIcon,
    SkipForwardIcon,
    BugIcon,
    LogInIcon,
    XIcon,
    TrashIcon,
    LayersIcon,
    VIVID_COLORS,
    parseDateTime // commonからインポート
} from './common';

const DevButton = ({ onClick, children, className = '', title = '', disabled = false, active = false }) => (
    <button
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`
            font-semibold py-2 px-3 rounded-md text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 
            disabled:opacity-50 disabled:cursor-not-allowed active:scale-95
            ${active
                ? 'bg-brand-primary text-white ring-2 ring-brand-primary ring-offset-1 ring-offset-surface-container'
                : 'bg-surface-container hover:bg-surface-background text-on-surface border border-on-surface/10'
            }
            ${className}
        `}
    >
        {children}
    </button>
);

export const DevControls = ({
    location = 'editor',
    onClose,
    onCrashApp,

    // Editor State
    mode,
    setMode,
    timeOffset,
    onTimeJump,
    onTimeReset,
    eventConfig = {},
    timetable = [],
    vjTimetable = [],
    setTimetable,     // ★追加
    setVjTimetable,   // ★追加
    onToggleVjFeature,
    onSetStartNow,
    imagesLoaded,

    // Dashboard Props
    onDeleteAllEvents
}) => {
    const isDashboard = location === 'dashboard';
    const [isDebugLayout, setIsDebugLayout] = useState(false);

    // --- 1. スマートダミーデータ生成 ---
    const handleLoadSmartDummy = () => {
        if (!window.confirm('現在のタイムテーブルを上書きしてダミーデータを生成しますか？')) return;

        const count = 5;
        const duration = 60;
        const newTimetable = [];
        const newVjTimetable = [];

        // DJデータ生成
        for (let i = 0; i < count; i++) {
            newTimetable.push({
                id: Date.now() + i,
                name: `DJ Dummy ${i + 1}`,
                duration: duration,
                color: VIVID_COLORS[Math.floor(Math.random() * VIVID_COLORS.length)],
                imageUrl: `https://picsum.photos/seed/${Date.now() + i}/200`, // ランダム画像
                isBuffer: false
            });
        }

        // VJデータ生成 (機能がONの場合)
        if (eventConfig.vjFeatureEnabled) {
            for (let i = 0; i < count; i++) {
                newVjTimetable.push({
                    id: Date.now() + i + 100,
                    name: `VJ Artist ${i + 1}`,
                    duration: duration
                });
            }
        }

        setTimetable && setTimetable(newTimetable);
        setVjTimetable && setVjTimetable(newVjTimetable);
    };

    // --- 2. 現在のフロアをクリア ---
    const handleClearFloor = () => {
        if (!window.confirm('このフロアのデータを全て削除しますか？')) return;
        setTimetable && setTimetable([]);
        setVjTimetable && setVjTimetable([]);
    };

    // --- 3. 次の転換タイミングへジャンプ ---
    const handleJumpToNextTransition = () => {
        if (!timetable.length || !eventConfig.startDate) return;

        const now = new Date(new Date().getTime() + timeOffset);
        const startTimeDate = parseDateTime(eventConfig.startDate, eventConfig.startTime);

        // スケジュール計算
        let currentEndTime = new Date(startTimeDate);
        let foundTarget = null;

        for (const item of timetable) {
            const duration = parseFloat(item.duration) || 0;
            const itemEndTime = new Date(currentEndTime.getTime() + duration * 60000);

            // 現在時刻より後の終了時刻を見つける
            if (itemEndTime > now) {
                foundTarget = itemEndTime;
                break;
            }
            currentEndTime = itemEndTime;
        }

        if (foundTarget) {
            // 終了の30秒前へ
            const targetTime = foundTarget.getTime() - 30 * 1000;
            const diff = targetTime - new Date().getTime(); // 生の現在時刻との差分
            // onTimeJumpは「分」を受け取る仕様だが、ここでは直接オフセットを計算したい
            // しかし既存のI/Fに合わせて「現在のオフセットとの差分」を分換算で渡すなど工夫が必要
            // ここではシンプルに、親コンポーネントの `setTimeOffset` を直接呼べないので、
            // onTimeJump に「分」を渡す方式を利用する

            const currentOffsetMs = timeOffset;
            const newOffsetMs = targetTime - new Date().getTime();
            const jumpMinutes = (newOffsetMs - currentOffsetMs) / 60000;

            onTimeJump(jumpMinutes);
        } else {
            alert("次の転換ポイントが見つかりませんでした（イベント終了後かも？）");
        }
    };

    // --- 4. レイアウトデバッグ切り替え ---
    const toggleDebugLayout = () => {
        if (isDebugLayout) {
            document.body.classList.remove('debug-layout');
        } else {
            document.body.classList.add('debug-layout');
        }
        setIsDebugLayout(!isDebugLayout);
    };

    // --- 5. ステートログ ---
    const handleLogState = () => {
        console.group("🛠 [DevControls] State Inspection");
        console.log("Location:", location);
        if (!isDashboard) {
            console.log("Event Config:", eventConfig);
            console.log("Timetable (DJ):", timetable);
            console.log("Timetable (VJ):", vjTimetable);
            console.log("Time Offset (ms):", timeOffset);
            const now = new Date(new Date().getTime() + timeOffset);
            console.log("Virtual Now:", now.toLocaleString());
        }
        console.groupEnd();
    };

    return (
        <div className="fixed bottom-4 right-4 z-[9999] bg-surface-container/90 backdrop-blur-xl border border-on-surface/10 rounded-2xl shadow-2xl p-4 text-on-surface text-left w-[300px] animate-fade-in-up overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-on-surface/10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-brand-primary/10 rounded-lg">
                        <SettingsIcon className="w-4 h-4 text-brand-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm leading-none">Developer Tools</h3>
                        <p className="text-[10px] text-on-surface-variant font-mono opacity-70 mt-0.5">for DJ Timekeeper Pro</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-background text-on-surface-variant hover:text-on-surface transition-colors">
                    <XIcon className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-4">

                {/* --- Dashboard Controls --- */}
                {isDashboard && (
                    <div className="grid grid-cols-1 gap-2">
                        <DevButton onClick={onDeleteAllEvents} className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">
                            <TrashIcon className="w-4 h-4" /> 全イベント削除 (Danger)
                        </DevButton>
                    </div>
                )}

                {/* --- Editor Controls --- */}
                {!isDashboard && (
                    <>
                        {/* Mode & Visuals */}
                        <div className="grid grid-cols-2 gap-2">
                            <DevButton
                                onClick={() => setMode(mode === 'live' ? 'edit' : 'live')}
                                disabled={mode !== 'live' && !imagesLoaded}
                                className={mode === 'live' ? 'bg-brand-primary/20 text-brand-primary border-brand-primary/30' : ''}
                            >
                                {mode === 'live' ? 'Edit Mode' : 'Live Mode'}
                            </DevButton>
                            <DevButton onClick={toggleDebugLayout} active={isDebugLayout}>
                                <LayersIcon className="w-4 h-4" /> UI Debug
                            </DevButton>
                        </div>

                        {/* Time Manipulation */}
                        <div className="bg-surface-background/50 rounded-xl p-2 border border-on-surface/5">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Time Travel</span>
                                <span className="font-mono font-bold text-xs tabular-nums text-brand-primary">
                                    {timeOffset ? (timeOffset / 60000).toFixed(1) + ' min' : '±0.0'}
                                </span>
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                                <DevButton onClick={() => onTimeJump(-10)}>-10m</DevButton>
                                <DevButton onClick={() => onTimeJump(10)}>+10m</DevButton>
                                <DevButton onClick={() => onTimeJump(60)}>+1h</DevButton>
                                <DevButton onClick={onTimeReset} className="text-red-400"><ResetIcon className="w-4 h-4" /></DevButton>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <DevButton onClick={onSetStartNow} className="text-[10px]">
                                    <ClockIcon className="w-3 h-3" /> Start Now
                                </DevButton>
                                <DevButton onClick={handleJumpToNextTransition} className="text-[10px]">
                                    <SkipForwardIcon className="w-3 h-3" /> Next DJ -30s
                                </DevButton>
                            </div>
                        </div>

                        {/* Data Manipulation */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Data & Features</p>
                            <div className="grid grid-cols-2 gap-2">
                                <DevButton onClick={handleLoadSmartDummy}>
                                    <SparklesIcon className="w-4 h-4 text-amber-500" /> Smart Data
                                </DevButton>
                                <DevButton onClick={handleClearFloor} className="text-red-400 hover:bg-red-500/10">
                                    <TrashIcon className="w-4 h-4" /> Clear Floor
                                </DevButton>
                                <DevButton onClick={onToggleVjFeature} active={eventConfig?.vjFeatureEnabled}>
                                    <VideoIcon className="w-4 h-4" /> VJ Mode
                                </DevButton>
                                <DevButton onClick={handleLogState}>
                                    <LogInIcon className="w-4 h-4" /> Log State
                                </DevButton>
                            </div>
                        </div>

                        {/* System */}
                        <div className="pt-2 border-t border-on-surface/10">
                            <DevButton onClick={onCrashApp} className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border-transparent">
                                <BugIcon className="w-4 h-4" /> Force Crash (Test ErrorBoundary)
                            </DevButton>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};