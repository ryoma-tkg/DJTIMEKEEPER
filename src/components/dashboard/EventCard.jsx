// [src/components/dashboard/EventCard.jsx]
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    LayersIcon,
    ClockIcon,
    Badge,
    TrashIcon
} from '../common';

// ヘルパー関数
const formatDateForIcon = (dateStr) => {
    if (!dateStr) return { month: '---', day: '--' };
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { month: '---', day: '--' };
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return { month: monthNames[date.getMonth()], day: String(date.getDate()).padStart(2, '0') };
};

const isEventActive = (event) => {
    const { startDate, startTime } = event.eventConfig;
    if (!startDate || !startTime) return false;
    const start = new Date(`${startDate}T${startTime}`);
    const now = new Date();
    // 簡易的に24時間イベントと仮定
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return now >= start && now < end;
};

export const EventCard = ({ event, onDeleteClick, onClick }) => {
    const floorCount = event.floors ? Object.keys(event.floors).length : 0;
    const displayFloors = (floorCount === 0 && event.timetable) ? '1 Floor' : `${floorCount} Floors`;
    const { month, day } = formatDateForIcon(event.eventConfig.startDate);
    const isActive = isEventActive(event);
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

    const gradientClass = isActive ? 'from-red-500/5' : 'from-brand-primary/5';
    const title = event.eventConfig.title || 'No Title';
    const startTime = event.eventConfig.startTime || '--:--';

    return (
        <div
            onClick={onClick}
            className={`
                group relative bg-surface-container rounded-3xl p-6 
                transition-all duration-300 cursor-pointer overflow-visible flex flex-col h-full
                hover:-translate-y-1
                ${isActive
                    ? 'border border-red-500/40 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]'
                    : 'border border-on-surface/10 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-on-surface/20'
                }
            `}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} to-transparent opacity-0 transition-opacity duration-500 pointer-events-none rounded-3xl ${isActive ? 'opacity-100' : 'group-hover:opacity-100'}`} />

            {/* Menu */}
            <div className="absolute top-4 right-4 z-20" ref={menuRef}>
                <button
                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                    className={`
                        w-8 h-8 rounded-full flex items-center justify-center transition-colors
                        ${isMenuOpen ? 'bg-surface-background text-on-surface' : 'text-on-surface-variant/50 hover:text-on-surface hover:bg-surface-background/50'}
                    `}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-32 bg-surface-container rounded-xl shadow-xl border border-on-surface/10 overflow-hidden animate-fade-in z-30">
                        <button
                            className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                            onClick={(e) => { e.stopPropagation(); onDeleteClick(event.id, event.eventConfig.title); setIsMenuOpen(false); }}
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
                    <span className="text-[10px] font-bold tracking-widest uppercase leading-none mb-1 opacity-70">{month}</span>
                    <span className="text-xl md:text-2xl font-bold leading-none font-mono">{day}</span>
                </div>
                <div className="flex-1 min-w-0 pt-1 flex flex-col">
                    {isActive && (
                        <div className="mb-2">
                            <Badge status="onAir" label="NOW ON AIR" />
                        </div>
                    )}
                    <h3 className={`text-base md:text-lg font-bold truncate mb-1 font-sans transition-colors ${isActive ? 'text-on-surface' : 'text-on-surface group-hover:text-brand-primary'}`}>{title}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-on-surface-variant">
                        <div className="flex items-center gap-1.5">
                            <LayersIcon className="w-3 h-3" />
                            <span>{displayFloors}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <ClockIcon className="w-3 h-3" />
                            <span className="font-mono">START {startTime}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-4 border-t border-on-surface/5 dark:border-white/5 flex justify-between items-center relative z-0">
                <span className="text-xs font-bold text-on-surface-variant/50 group-hover:text-brand-primary group-hover:opacity-100 transition-all duration-300">Open Editor</span>
                <Link to={`/live/${event.id}`} target="_blank" onClick={(e) => e.stopPropagation()}
                    className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all
                        ${isActive
                            ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:bg-red-600 hover:shadow-[0_0_20px_rgba(239,68,68,0.7)] border-transparent'
                            : 'bg-surface-background text-on-surface-variant hover:text-brand-primary hover:bg-brand-primary/10 border border-on-surface/5'
                        }
                    `}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-on-surface-variant/50'}`} />
                    LIVE LINK
                </Link>
            </div>
        </div>
    );
};