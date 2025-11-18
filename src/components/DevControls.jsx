// [src/components/DevControls.jsx]
import React from 'react';
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
    TrashIcon
} from './common';

const DevButton = ({ onClick, children, className = '', title = '', disabled = false }) => (
    <button
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`bg-surface-container hover:bg-surface-background text-on-surface font-semibold py-2 px-3 rounded-md text-xs transition-colors shadow-lg flex items-center justify-center gap-1.5 ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
        {children}
    </button>
);

export const DevControls = ({
    // 共通
    location = 'editor', // 'editor' | 'dashboard'
    onClose,
    onCrashApp,

    // Editor用 (デフォルト値を {} に設定し、undefinedエラーを回避)
    mode,
    setMode,
    timeOffset,
    onTimeJump,
    onTimeReset,
    eventConfig = {}, // ★ここが重要：デフォルト値を空オブジェクトにする
    timetable,
    vjTimetable,
    onToggleVjFeature,
    onLoadDummyData,
    onSetStartNow,
    onFinishEvent,
    imagesLoaded,

    // Dashboard用
    onDeleteAllEvents
}) => {

    const isDashboard = location === 'dashboard';

    const handleLogState = () => {
        console.log("--- [DevMode] State Log ---");
        if (isDashboard) {
            console.log("Location: Dashboard");
        } else {
            console.log("Location: Editor");
            console.log("Event Config:", eventConfig);
            console.log("Timetable:", timetable);
            console.log("VJ Timetable:", vjTimetable);
            console.log("Time Offset:", timeOffset);
        }
        console.log("---------------------------");
    };

    return (
        <div className="fixed bottom-4 right-4 z-[999] bg-surface-container/80 backdrop-blur-md border border-on-surface/10 rounded-xl shadow-2xl p-3 text-on-surface text-left w-[280px] animate-fade-in-up">

            <div className="flex items-center justify-between gap-2 mb-2 border-b border-on-surface/10 pb-2">
                <div className="flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4 text-brand-primary" />
                    <h3 className="font-bold text-sm text-brand-primary">開発者パネル</h3>
                </div>
                <button
                    onClick={onClose}
                    title="閉じる"
                    className="p-1 -m-1 rounded-full hover:bg-surface-background text-on-surface-variant hover:text-on-surface"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-3 gap-2">

                {/* --- Dashboard 専用コントロール --- */}
                {isDashboard && (
                    <>
                        <DevButton
                            onClick={onDeleteAllEvents}
                            title="自分が作成したすべてのイベントを削除します"
                            className="col-span-3 bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        >
                            <TrashIcon className="w-4 h-4" /> 全イベント削除
                        </DevButton>
                    </>
                )}

                {/* --- Editor 専用コントロール --- */}
                {!isDashboard && (
                    <>
                        <DevButton
                            onClick={() => setMode(mode === 'live' ? 'edit' : 'live')}
                            disabled={mode !== 'live' && !imagesLoaded}
                            className="col-span-3 bg-brand-primary/20 text-brand-primary hover:bg-brand-primary/30"
                        >
                            {mode === 'live' ? '編集モードへ' : (imagesLoaded ? 'Liveモードへ' : '画像読込中...')}
                        </DevButton>

                        <div className="col-span-3 text-center bg-surface-background rounded-md py-1.5 px-2">
                            <p className="text-xs text-on-surface-variant">時間オフセット</p>
                            <p className="font-mono font-bold text-sm tabular-nums">
                                {timeOffset ? (timeOffset / (1000 * 60)).toFixed(1) : '0.0'} min
                            </p>
                        </div>

                        <DevButton onClick={() => onTimeJump && onTimeJump(-10)}>-10m</DevButton>
                        <DevButton onClick={() => onTimeJump && onTimeJump(10)}>+10m</DevButton>
                        <DevButton onClick={() => onTimeJump && onTimeJump(60)}>+60m</DevButton>

                        <DevButton onClick={onLoadDummyData} className="col-span-2">
                            <SparklesIcon className="w-4 h-4" /> ダミー読込
                        </DevButton>

                        {/* eventConfig が存在し、かつ vjFeatureEnabled が true の時だけ色を変える */}
                        <DevButton onClick={onToggleVjFeature} className={(eventConfig && eventConfig.vjFeatureEnabled) ? 'text-brand-primary' : ''}>
                            <VideoIcon className="w-4 h-4" /> VJ
                        </DevButton>

                        <DevButton onClick={onSetStartNow}><ClockIcon className="w-4 h-4" /> 今ｽﾀｰﾄ</DevButton>
                        <DevButton onClick={onFinishEvent}><SkipForwardIcon className="w-4 h-4" /> 強制終了</DevButton>
                        <DevButton onClick={onTimeReset} className="text-red-400 hover:bg-red-500/20">
                            <ResetIcon className="w-4 h-4" />
                        </DevButton>
                    </>
                )}

                {/* --- 共通コントロール --- */}
                <DevButton onClick={handleLogState} className="col-span-2">
                    <LogInIcon className="w-4 h-4" /> ステート記録
                </DevButton>
                <DevButton onClick={onCrashApp} className="text-red-400 hover:bg-red-500/20">
                    <BugIcon className="w-4 h-4" /> ｸﾗｯｼｭ
                </DevButton>

            </div>
        </div>
    );
};