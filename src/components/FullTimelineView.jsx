// [src/components/FullTimelineView.jsx]
import React from 'react';
import { SimpleImage, UserIcon, GodModeIcon } from './common';
import { BaseModal } from './ui/BaseModal';

// タイムラインアイテム
const TimelineItem = ({ dj, isPlaying, isFinished, progress }) => {
    const itemOpacity = isFinished ? 'opacity-50' : 'opacity-100';
    const playingBg = isPlaying ? 'bg-surface-container' : 'bg-surface-container/50';

    return (
        <div
            className={`
                flex items-center gap-4 p-4 rounded-2xl relative overflow-hidden
                ${playingBg} ${itemOpacity} transition-opacity duration-300
                border border-on-surface/10 {/* ▼▼▼ 追加: 境界線を追加 ▼▼▼ */}
            `}
        >
            {/* ... (中身は変更なし) ... */}
            <div
                className="absolute left-0 top-0 bottom-0 rounded-l-2xl"
                style={{
                    width: `${progress}%`,
                    backgroundColor: dj.color,
                    opacity: isPlaying ? 0.5 : 0.3
                }}
            />

            <div className="w-12 h-12 rounded-full bg-surface-background flex items-center justify-center overflow-hidden shrink-0 z-10">
                {dj.imageUrl ? (
                    <SimpleImage src={dj.imageUrl} className="w-full h-full object-cover" />
                ) : dj.isBuffer ? (
                    <GodModeIcon className="w-6 h-6 text-on-surface-variant" />
                ) : (
                    <UserIcon className="w-6 h-6 text-on-surface-variant" />
                )}
            </div>

            <div className="flex-grow z-10">
                <p
                    className={`font-bold ${isPlaying ? '' : 'text-on-surface'}`}
                    style={isPlaying ? { color: dj.color } : {}}
                >
                    {dj.name}
                </p>
                <p className="font-mono text-sm text-on-surface-variant">
                    {dj.startTime} - {dj.endTime}
                </p>
            </div>

            {isPlaying && (
                <div
                    className="z-10 text-xs font-bold uppercase"
                    style={{ color: dj.color }}
                >
                    On Air
                </div>
            )}
        </div>
    );
};

// ... (FullTimelineView 本体は変更なし) ...
export const FullTimelineView = ({ isOpen, onClose, schedule, now, currentlyPlayingIndex }) => {
    // ... (変更なし)
    const calculateProgress = (dj) => {
        const startTime = new Date(dj.startTimeDate);
        const endTime = new Date(dj.endTimeDate);
        const total = (endTime - startTime) / 1000;
        const elapsed = (now - startTime) / 1000;

        if (total <= 0) return 0;
        return Math.max(0, Math.min(100, (elapsed / total) * 100));
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Timeline"
            isScrollable={true}
            maxWidthClass="max-w-2xl"
        >
            <div className="space-y-3">
                {schedule.map((dj, index) => {
                    const isFinished = now > new Date(dj.endTimeDate) && index !== currentlyPlayingIndex;
                    const isPlaying = index === currentlyPlayingIndex;
                    const progress = isFinished ? 100 : (isPlaying ? calculateProgress(dj) : 0);

                    return (
                        <TimelineItem
                            key={dj.id}
                            dj={dj}
                            isPlaying={isPlaying}
                            isFinished={isFinished}
                            progress={progress}
                        />
                    );
                })}
            </div>
        </BaseModal>
    );
};