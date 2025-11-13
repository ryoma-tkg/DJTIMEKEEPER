import React, { useState, useEffect } from 'react';
import { SimpleImage, UserIcon, GodModeIcon, XIcon } from './common';

// 
// 
const TimelineItem = ({ dj, isPlaying, isFinished, progress }) => {

    // 
    const itemOpacity = isFinished ? 'opacity-50' : 'opacity-100';
    // 
    const playingBg = isPlaying ? 'bg-surface-container' : 'bg-surface-container/50';

    return (
        <div
            className={`
                flex items-center gap-4 p-4 rounded-2xl relative overflow-hidden
                ${playingBg} ${itemOpacity} transition-opacity duration-300
            `}
        >
            {/* */}
            <div
                className="absolute left-0 top-0 bottom-0 rounded-l-2xl"
                style={{
                    width: `${progress}%`,
                    backgroundColor: dj.color, // 
                    opacity: isPlaying ? 0.5 : 0.3
                }}
            />

            {/* ★★★ ここからアイコンロジックを修正っす！ ★★★ */}
            <div className="w-12 h-12 rounded-full bg-surface-background flex items-center justify-center overflow-hidden shrink-0 z-10">
                {dj.imageUrl ? (
                    <SimpleImage src={dj.imageUrl} className="w-full h-full object-cover" />
                ) : dj.isBuffer ? (
                    // 
                    <GodModeIcon className="w-6 h-6 text-on-surface-variant" />
                ) : (
                    // 
                    <UserIcon className="w-6 h-6 text-on-surface-variant" />
                )}
            </div>
            {/* ★★★ 修正ここまで ★★★ */}

            {/* */}
            <div className="flex-grow z-10">
                <p
                    className={`font-bold ${isPlaying ? '' : 'text-on-surface'}`}
                    style={isPlaying ? { color: dj.color } : {}} // 
                >
                    {dj.name}
                </p>
                <p className="font-mono text-sm text-on-surface-variant">
                    {dj.startTime} - {dj.endTime}
                </p>
            </div>
            {/* */}
            {isPlaying && (
                <div
                    className="z-10 text-xs font-bold uppercase"
                    style={{ color: dj.color }} // 
                >
                    On Air
                </div>
            )}
        </div>
    );
};


// 
export const FullTimelineView = ({ isOpen, onClose, schedule, now, currentlyPlayingIndex }) => {

    // 
    const [isRendered, setIsRendered] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // 
    useEffect(() => {
        if (isOpen) {
            setIsRendered(true); // 
            setIsClosing(false);   // 
        } else if (isRendered) { // 
            setIsClosing(true);    // 
        }
    }, [isOpen, isRendered]);

    // 
    useEffect(() => {
        if (isClosing) {
            const timer = setTimeout(() => {
                setIsRendered(false); // 
            }, 400); // 
            return () => clearTimeout(timer);
        }
    }, [isClosing]);


    // 
    const calculateProgress = (dj) => {
        const startTime = new Date(dj.startTimeDate); // 
        const endTime = new Date(dj.endTimeDate);   // 
        const total = (endTime - startTime) / 1000;
        const elapsed = (now - startTime) / 1000;

        if (total <= 0) return 0;
        return Math.max(0, Math.min(100, (elapsed / total) * 100));
    };

    // 
    const handleClose = () => {
        onClose(); // 
    };

    // 
    if (!isRendered) return null;

    return (
        // 
        <div
            className={`
                fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4
                ${isClosing ? 'animate-fade-out-down' : 'animate-fade-in-up'} 
            `}
            onClick={handleClose} // 
        >
            <div
                className="bg-surface-background rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* */}
                <header className="flex justify-between items-center p-4 border-b border-surface-container">
                    <h2 className="text-xl font-bold text-on-surface">Timeline</h2>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-surface-container">
                        <XIcon className="w-6 h-6 text-on-surface-variant" />
                    </button>
                </header>

                {/* */}
                <div className="overflow-y-auto p-4 space-y-3">
                    {schedule.map((dj, index) => {
                        // 
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
            </div>
        </div>
    );
};