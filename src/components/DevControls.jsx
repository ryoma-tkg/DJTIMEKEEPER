import React from 'react';
// ▼▼▼ 【修正】 XIcon をインポート ▼▼▼
import {
    PlayIcon,
    SettingsIcon,
    ResetIcon,
    SparklesIcon,
    VideoIcon,
    ClockIcon,
    SkipForwardIcon,
    BugIcon,
    LogInIcon,
    XIcon
} from './common';

// (DevButton - 変更なし)
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
    mode,
    setMode,
    timeOffset,
    onTimeJump,
    onTimeReset,

    // 
    eventConfig,
    timetable,
    vjTimetable,
    onToggleVjFeature,
    onLoadDummyData,
    onSetStartNow,
    onFinishEvent,
    onCrashApp,

    imagesLoaded,
    onToggleDevMode // ★【追加】
}) => {
    // 
    const isLive = mode === 'live';

    // 
    const offsetInMinutes = (timeOffset / (1000 * 60)).toFixed(1);

    // 
    const handleLogState = () => {
        console.log("--- [DevMode] Current State Log ---");
        console.log("Event Config:", eventConfig);
        console.log("Timetable (DJs):", timetable);
        console.log("VJ Timetable:", vjTimetable);
        console.log("Time Offset (ms):", timeOffset);
        console.log("-------------------------------------");
    };

    return (
        <div className="fixed bottom-4 right-4 z-[999] bg-surface-container/80 backdrop-blur-md border border-on-surface/10 rounded-xl shadow-2xl p-3 text-on-surface text-left w-[280px] animate-fade-in-up">

            {/* ▼▼▼ 【修正】 ヘッダーに「閉じるボタン」を追加 ▼▼▼ */}
            <div className="flex items-center justify-between gap-2 mb-2 border-b border-on-surface/10 pb-2">
                <div className="flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4 text-brand-primary" />
                    <h3 className="font-bold text-sm text-brand-primary">開発者パネル</h3>
                </div>
                <button
                    onClick={onClose} // ★【追加】
                    title="開発者モードを閉じる"
                    className="p-1 -m-1 rounded-full hover:bg-surface-background text-on-surface-variant hover:text-on-surface"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
            {/* ▲▲▲ 【修正】 ここまで ▲▲▲ */}


            <div className="grid grid-cols-3 gap-2">
                {/* (モード切替ボタン - 変更なし) */}
                <DevButton
                    onClick={() => setMode(isLive ? 'edit' : 'live')}
                    disabled={!isLive && !imagesLoaded} // 
                    className="col-span-3 bg-brand-primary/20 text-brand-primary hover:bg-brand-primary/30"
                >
                    {isLive ? '編集モードへ' : (imagesLoaded ? 'Liveモードへ' : '画像読込中...')}
                </DevButton>

                {/* (時間表示 - 変更なし) */}
                <div className="col-span-3 text-center bg-surface-background rounded-md py-1.5 px-2">
                    <p className="text-xs text-on-surface-variant">時間オフセット (ジャンプ)</p>
                    <p className="font-mono font-bold text-sm tabular-nums">
                        {offsetInMinutes} min
                    </p>
                </div>

                {/* (時間操作 - 変更なし) */}
                <DevButton onClick={() => onTimeJump(-10)} title="-10分">-10m</DevButton>
                <DevButton onClick={() => onTimeJump(10)} title="+10分">+10m</DevButton>
                <DevButton onClick={() => onTimeJump(60)} title="+60分">+60m</DevButton>

                {/* (アプリ機能ショートカット - 変更なし) */}
                <DevButton
                    onClick={onLoadDummyData}
                    title="ダミーのDJ/VJデータを読み込み、開始時刻を「今」にセットします"
                    className="col-span-2"
                >
                    <SparklesIcon className="w-4 h-4" /> ダミー読込
                </DevButton>
                <DevButton
                    onClick={onToggleVjFeature}
                    title="VJ機能のON/OFFを切替えます"
                    className={eventConfig.vjFeatureEnabled ? 'text-brand-primary' : ''}
                >
                    <VideoIcon className="w-4 h-4" /> VJ
                </DevButton>

                <DevButton
                    onClick={onSetStartNow}
                    title="イベント開始時刻を「今」にセットします"
                >
                    <ClockIcon className="w-4 h-4" /> 今ｽﾀｰﾄ
                </DevButton>
                <DevButton
                    onClick={onFinishEvent}
                    title="イベントを強制的に終了させます（+24hジャンプ）"
                >
                    <SkipForwardIcon className="w-4 h-4" /> 強制終了
                </DevButton>
                <DevButton
                    onClick={onTimeReset}
                    title="時間ジャンプをリセットします"
                    className="text-red-400 hover:bg-red-500/20"
                >
                    <ResetIcon className="w-4 h-4" />
                </DevButton>

                {/* (提案機能 - 変更なし) */}
                <DevButton
                    onClick={handleLogState}
                    title="現在の全ステートをコンソールに表示します"
                    className="col-span-2"
                >
                    <LogInIcon className="w-4 h-4" /> ステート記録
                </DevButton>
                <DevButton
                    onClick={onCrashApp}
                    title="エラー境界（ErrorBoundary）のテスト"
                    className="text-red-400 hover:bg-red-500/20"
                >
                    <BugIcon className="w-4 h-4" /> ｸﾗｯｼｭ
                </DevButton>

            </div>
        </div>
    );
};