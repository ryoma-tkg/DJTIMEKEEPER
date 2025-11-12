import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
// さっき作った firebase.js から必要なものをインポート
import {
    auth, db, storage, appId,
    signInAnonymously, onAuthStateChanged,
    doc, onSnapshot, setDoc,
    ref, uploadBytes, getDownloadURL
} from './firebase';

//const { useState, useEffect, useCallback, useMemo, useRef, memo } = React;

const VIVID_COLORS = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899'
];

// --- Icon Components ---
const PlayIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>);
const PlusIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>);
const TrashIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const GripIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>);
const UserIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const UploadIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>);
const CopyIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>);
const XIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const ResetIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 2v6h6" /><path d="M21 12A9 9 0 0 0 6 5.3L3 8" /><path d="M21 22v-6h-6" /><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" /></svg>);
const AlertTriangleIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>);
const GodModeIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>);

const SimpleImage = memo(({ src, className, alt = "" }) => {
    if (!src) return null;
    return <img src={src} alt={alt} className={className} />;
});

const parseTime = (timeStr) => {
    const date = new Date();
    if (!timeStr) return date;
    const [hours, minutes] = timeStr.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    return date;
};

const CustomTimeInput = ({ value, onChange }) => {
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

const ImageEditModal = ({ dj, onUpdate, onClose, storage }) => {
    const [imageUrl, setImageUrl] = useState(dj.imageUrl || '');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !storage) return;

        setIsUploading(true);
        setUploadError(null);

        try {
            //const { ref, uploadBytes, getDownloadURL } = window.firebase;
            const filePath = `dj_icons/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, filePath);

            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            setImageUrl(downloadURL);
        } catch (error) {
            console.error("Image upload failed:", error);
            setUploadError("アップロードに失敗しました。");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = () => {
        onUpdate('imageUrl', imageUrl);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in-up" onClick={onClose}>
            <div className="bg-surface-container rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">アイコンを設定</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-background"><XIcon className="w-6 h-6" /></button>
                </div>
                <div className="flex items-center justify-center my-6">
                    <div className="w-40 h-40 rounded-full bg-surface-background flex items-center justify-center overflow-hidden">
                        {imageUrl ? <SimpleImage src={imageUrl} className="w-full h-full object-cover" /> : <UserIcon className="w-20 h-20 text-on-surface-variant" />}
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-on-surface-variant mb-1 block">Image URL</label>
                        <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="bg-surface-background text-on-surface p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="https://example.com/image.png" />
                    </div>
                    <div>
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                        <button onClick={() => fileInputRef.current.click()} disabled={isUploading} className="w-full flex items-center justify-center gap-2 bg-surface-background hover:opacity-80 text-on-surface font-semibold py-3 px-4 rounded-lg transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isUploading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span>アップロード中...</span>
                                </>
                            ) : (
                                <>
                                    <UploadIcon className="w-5 h-5" />
                                    <span>ローカルからアップロード</span>
                                </>
                            )}
                        </button>
                        {uploadError && <p className="text-red-400 text-sm mt-2 text-center">{uploadError}</p>}
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="py-2 px-5 rounded-full bg-surface-background text-on-surface font-semibold">キャンセル</button>
                    <button onClick={handleSave} disabled={isUploading} className="py-2 px-5 rounded-full bg-brand-primary text-white font-semibold disabled:opacity-50">保存</button>
                </div>
            </div>
        </div>
    );
};

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
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

const DjItem = memo(({ dj, isPlaying, onPointerDown, onEditClick, onUpdate, onColorPickerToggle, onCopy, onRemove, isColorPickerOpen, openColorPickerId }) => {
    const colorPickerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const target = event.target;
            if (isColorPickerOpen && colorPickerRef.current && !colorPickerRef.current.contains(target) && !target.closest(`[data-color-picker-trigger="${dj.id}"]`)) {
                onColorPickerToggle(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isColorPickerOpen, dj.id, onColorPickerToggle]);

    const ringClass = isPlaying ? 'ring-2 shadow-[0_0_12px_var(--tw-ring-color)]' : 'ring-1 ring-zinc-700';

    return (
        <div
            className={`bg-surface-container rounded-2xl flex items-center gap-4 p-4 ${ringClass}`}
            style={{ '--tw-ring-color': isPlaying ? dj.color : 'transparent' }}
        >
            <div className="cursor-grab touch-none" onPointerDown={onPointerDown}>
                <GripIcon className="w-6 h-6 text-on-surface-variant shrink-0" />
            </div>
            <button
                onClick={() => onEditClick()}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-16 h-16 rounded-full bg-surface-background flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-surface-background hover:ring-brand-primary transition-all"
            >
                {dj.imageUrl ? <SimpleImage src={dj.imageUrl} className="w-full h-full object-cover" /> : <UserIcon className="w-8 h-8 text-on-surface-variant" />}
            </button>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex flex-col">
                    <label className="text-xs text-on-surface-variant mb-1">{dj.isBuffer ? 'Title' : 'DJ Name'}</label>
                    <input type="text" value={dj.name} onChange={(e) => onUpdate('name', e.target.value)} className="bg-surface-background text-on-surface p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs text-on-surface-variant mb-1">Time Slot</label>
                    <div className="bg-surface-background/50 p-2 rounded-lg w-full text-center font-semibold text-on-surface-variant font-mono">
                        <span>{dj.startTime}</span>
                        <span className="mx-2">-</span>
                        <span>{dj.endTime}</span>
                    </div>
                </div>
                <div className="flex flex-col md:col-span-2">
                    <label className="text-xs text-on-surface-variant mb-1">Duration (min)</label>
                    <input type="number" value={dj.duration} step="0.1" onChange={(e) => onUpdate('duration', parseFloat(e.target.value) || 0)} className="bg-surface-background text-on-surface p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-primary font-bold text-base" />
                </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0 self-center">
                <div className="relative" ref={colorPickerRef}>
                    <button type="button" data-color-picker-trigger={dj.id} onClick={() => onColorPickerToggle(dj.id === openColorPickerId ? null : dj.id)} className="w-9 h-9 rounded-full ring-2 ring-on-surface-variant" style={{ backgroundColor: dj.color }} />
                    {isColorPickerOpen && (
                        <div className="absolute w-40 bottom-full mb-2 right-0 bg-surface-background p-2 rounded-lg shadow-2xl grid grid-cols-4 gap-2 z-10">
                            {VIVID_COLORS.map(color => (<button key={color} type="button" onClick={() => { onUpdate('color', color); onColorPickerToggle(null); }} className="w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none ring-1 ring-black/20" style={{ backgroundColor: color }} />))}
                        </div>
                    )}
                </div>
                <button onClick={onCopy} className="text-on-surface-variant hover:text-brand-primary p-2 rounded-full transition-colors"><CopyIcon className="w-5 h-5" /></button>
                <button onClick={onRemove} className="text-on-surface-variant hover:text-red-500 p-2 rounded-full transition-colors"><TrashIcon className="w-5 h-5" /></button>
            </div>
        </div>
    );
});

const TimetableEditor = ({ eventConfig, setEventConfig, timetable, setTimetable, setMode, storage }) => {
    const [openColorPickerId, setOpenColorPickerId] = useState(null);
    const [editingDjIndex, setEditingDjIndex] = useState(null);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [now, setNow] = useState(new Date());
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [isGodMode, setIsGodMode] = useState(false);
    const originalTimetableRef = useRef(null);

    const dragStateRef = useRef({
        draggedIndex: null,
        isDragging: false,
        timetable: timetable
    });

    useEffect(() => {
        dragStateRef.current.draggedIndex = draggedIndex;
        dragStateRef.current.timetable = timetable;
    }, [draggedIndex, timetable]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const schedule = useMemo(() => {
        if (timetable.length === 0) return [];
        const scheduleData = [];
        let lastEndTime = parseTime(eventConfig.startTime);
        for (const dj of timetable) {
            const startTime = new Date(lastEndTime);
            const durationMinutes = parseFloat(dj.duration) || 0;
            const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
            scheduleData.push({ ...dj, startTime, endTime });
            lastEndTime = endTime;
        }
        return scheduleData;
    }, [timetable, eventConfig.startTime]);

    const eventEndTime = useMemo(() => {
        if (schedule.length === 0) return null;
        return schedule[schedule.length - 1].endTime.toTimeString().slice(0, 5);
    }, [schedule]);

    const currentlyPlayingIndex = useMemo(() => schedule.findIndex(dj => now >= dj.startTime && now < dj.endTime), [now, schedule]);

    const recalculateTimes = useCallback((timetableData, eventStartTime) => {
        if (!timetableData || timetableData.length === 0) return [];
        const recalculated = [];
        let lastEndTime = parseTime(eventStartTime);
        for (let i = 0; i < timetableData.length; i++) {
            const currentDjData = { ...timetableData[i] };
            const currentStartTime = new Date(lastEndTime);
            const durationMinutes = parseFloat(currentDjData.duration) || 0;
            const currentEndTime = new Date(currentStartTime.getTime() + durationMinutes * 60 * 1000);
            recalculated.push({
                ...currentDjData,
                startTime: currentStartTime.toTimeString().slice(0, 5),
                endTime: currentEndTime.toTimeString().slice(0, 5),
            });
            lastEndTime = currentEndTime;
        }
        return recalculated;
    }, []);

    const handleEventConfigChange = useCallback((field, value) => {
        setEventConfig(prevConfig => {
            const newConfig = { ...prevConfig, [field]: value };
            if (field === 'startTime') {
                setTimetable(prevTimetable => recalculateTimes(prevTimetable, value));
            }
            return newConfig;
        });
    }, [recalculateTimes, setTimetable, setEventConfig]);

    const handleUpdate = useCallback((index, field, value) => {
        setTimetable(prevTimetable => {
            const newTimetable = [...prevTimetable];
            newTimetable[index] = { ...newTimetable[index], [field]: value };
            if (field === 'duration') {
                return recalculateTimes(newTimetable, eventConfig.startTime);
            }
            return newTimetable;
        });
    }, [eventConfig.startTime, recalculateTimes, setTimetable]);

    const addNewDj = useCallback((isBuffer = false) => {
        setTimetable(prevTimetable => {
            const lastDj = prevTimetable[prevTimetable.length - 1];
            const duration = isBuffer ? 5 : (lastDj ? lastDj.duration : 60);
            const newDjData = { id: Date.now(), name: isBuffer ? 'バッファー' : `DJ ${prevTimetable.filter(d => !d.isBuffer).length + 1}`, duration: duration, imageUrl: '', color: VIVID_COLORS[Math.floor(Math.random() * VIVID_COLORS.length)], isBuffer, };
            return recalculateTimes([...prevTimetable, newDjData], eventConfig.startTime);
        });
    }, [eventConfig.startTime, recalculateTimes, setTimetable]);

    const executeReset = useCallback(() => {
        setTimetable([]);
        setEventConfig({ title: 'My Awesome Event', startTime: '22:00' });
        setIsResetConfirmOpen(false);
    }, [setTimetable, setEventConfig]);

    const handleRemoveDj = useCallback((index) => setTimetable(prevTimetable => recalculateTimes(prevTimetable.filter((_, i) => i !== index), eventConfig.startTime)), [eventConfig.startTime, recalculateTimes, setTimetable]);

    const handleCopyDj = useCallback((index) => {
        setTimetable(prevTimetable => {
            const djToCopy = { ...prevTimetable[index], id: Date.now() };
            const newTimetable = [...prevTimetable.slice(0, index + 1), djToCopy, ...prevTimetable.slice(index + 1)];
            return recalculateTimes(newTimetable, eventConfig.startTime);
        });
    }, [eventConfig.startTime, recalculateTimes, setTimetable]);

    const handlePointerMove = useCallback((e) => {
        if (!dragStateRef.current.isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const targetEl = document.elementFromPoint(clientX, clientY)?.closest('[data-dj-index]');
        if (!targetEl) return;
        const targetIndex = parseInt(targetEl.dataset.djIndex, 10);
        const currentIndex = dragStateRef.current.draggedIndex;
        if (!isNaN(targetIndex) && targetIndex !== currentIndex) {
            const newTimetable = [...dragStateRef.current.timetable];
            const [movedItem] = newTimetable.splice(currentIndex, 1);
            newTimetable.splice(targetIndex, 0, movedItem);
            dragStateRef.current.draggedIndex = targetIndex;
            setDraggedIndex(targetIndex);
            setTimetable(newTimetable);
        }
    }, [setTimetable]);

    const handlePointerUp = useCallback(() => {
        if (!dragStateRef.current.isDragging) return;
        dragStateRef.current.isDragging = false;
        setTimetable(currentTimetable => recalculateTimes(currentTimetable, eventConfig.startTime));
        setDraggedIndex(null);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('touchmove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('touchend', handlePointerUp);
    }, [eventConfig.startTime, recalculateTimes, setTimetable, handlePointerMove]);

    const handlePointerDown = useCallback((e, index) => {
        // e.preventDefault(); // This can prevent scrolling on touch devices. Let's be more specific.
        if (e.target.closest('.cursor-grab')) {
            e.preventDefault();
        }
        setDraggedIndex(index);
        dragStateRef.current.isDragging = true;
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('touchmove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('touchend', handlePointerUp);
    }, [handlePointerMove, handlePointerUp]);

    const toggleGodMode = () => {
        setIsGodMode(prev => {
            const nextState = !prev;
            if (nextState) {
                originalTimetableRef.current = timetable.map(t => ({ ...t }));
                const godModeTimetable = timetable.map(dj => ({ ...dj, duration: 10 / 60 }));
                setTimetable(recalculateTimes(godModeTimetable, eventConfig.startTime));
            } else {
                if (originalTimetableRef.current) {
                    setTimetable(recalculateTimes(originalTimetableRef.current, eventConfig.startTime));
                    originalTimetableRef.current = null;
                }
            }
            return nextState;
        });
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <ConfirmModal
                isOpen={isResetConfirmOpen}
                title="タイムテーブルをリセット"
                message="すべてのDJと設定が削除されます。この操作は元に戻せません。本当によろしいですか？"
                onConfirm={executeReset}
                onCancel={() => setIsResetConfirmOpen(false)}
            />
            {editingDjIndex !== null && (
                <ImageEditModal
                    dj={timetable[editingDjIndex]}
                    onUpdate={(field, value) => handleUpdate(editingDjIndex, field, value)}
                    onClose={() => setEditingDjIndex(null)}
                    storage={storage}
                />
            )}
            <header className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                <input
                    type="text"
                    value={eventConfig.title || 'DJ Timekeeper Pro'}
                    onChange={(e) => handleEventConfigChange('title', e.target.value)}
                    className="text-3xl font-bold text-brand-secondary tracking-wide bg-transparent focus:outline-none focus:bg-surface-container/50 rounded-lg p-2 w-full sm:w-auto"
                    placeholder="イベントタイトル"
                />
                <div className="flex gap-2 w-full sm:w-auto self-center">
                    <button onClick={toggleGodMode} title="GOD Mode" className={`flex items-center justify-center p-3.5 rounded-full transition-colors ${isGodMode ? 'bg-yellow-500/30 text-yellow-400' : 'bg-surface-container text-on-surface-variant hover:bg-zinc-600'}`}>
                        <GodModeIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsResetConfirmOpen(true)} title="すべてリセット" className="flex items-center justify-center p-3.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-full transition-colors">
                        <ResetIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => timetable.length > 0 && setMode('live')} disabled={timetable.length === 0} className="w-full flex items-center justify-center bg-brand-primary hover:opacity-90 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-full transition-opacity duration-200 shadow-lg">
                        <PlayIcon className="w-5 h-5 mr-2" /><span>Liveモード</span>
                    </button>
                </div>
            </header>
            <div className="bg-surface-container/50 rounded-xl p-4 mb-8">
                {eventEndTime && (
                    <div className="bg-surface-container/50 text-on-surface-variant font-semibold py-2 px-4 rounded-full text-lg tracking-wider font-mono text-center mb-4 max-w-xs mx-auto">
                        {eventConfig.startTime} - {eventEndTime}
                    </div>
                )}
                <label className="text-xs text-on-surface-variant tracking-wider mb-2 text-center block">イベント開始時間を設定</label>
                <div className="w-full max-w-xs mx-auto">
                    <CustomTimeInput value={eventConfig.startTime} onChange={(v) => handleEventConfigChange('startTime', v)} />
                </div>
            </div>

            <div className="space-y-4">
                {timetable.map((dj, index) => (
                    <div
                        key={dj.id}
                        data-dj-index={index}
                        className={`transition-transform duration-300 ease-in-out ${draggedIndex === index ? 'dragging-item' : ''}`}
                    >
                        <DjItem
                            dj={dj}
                            isPlaying={currentlyPlayingIndex === index}
                            onPointerDown={(e) => handlePointerDown(e, index)}
                            onEditClick={() => setEditingDjIndex(index)}
                            onUpdate={(field, value) => handleUpdate(index, field, value)}
                            onColorPickerToggle={setOpenColorPickerId}
                            onCopy={() => handleCopyDj(index)}
                            onRemove={() => handleRemoveDj(index)}
                            isColorPickerOpen={openColorPickerId === dj.id}
                            openColorPickerId={openColorPickerId}
                        />
                    </div>
                ))}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button onClick={() => addNewDj(false)} className="w-full flex items-center justify-center bg-brand-primary hover:opacity-90 text-white font-bold py-3 px-4 rounded-full transition-opacity duration-200"><PlusIcon className="w-5 h-5 mr-2" /><span>DJを追加</span></button>
                <button onClick={() => addNewDj(true)} className="w-full flex items-center justify-center bg-surface-container hover:opacity-90 text-on-surface-variant font-bold py-3 px-4 rounded-full transition-opacity duration-200"><PlusIcon className="w-5 h-5 mr-2" /><span>バッファーを追加</span></button>
            </div>
        </div>
    );
};

// BackgroundImage コンポーネント (3回目修正のまま)
const BackgroundImage = memo(({ dj, isFadingOut, isReady }) => {
    const shouldRender = dj && dj.imageUrl && !dj.isBuffer;
    if (!shouldRender) return null;

    let animationClass = '';
    if (isFadingOut) {
        animationClass = 'animate-fade-out';
    } else if (isReady) {
        animationClass = 'animate-fade-in';
    } else {
        animationClass = 'opacity-0'; // ロード中は透明
    }

    return (
        <div key={dj.id} className={`absolute inset-0 -z-20 ${animationClass}`}>
            <div className="absolute inset-0 overflow-hidden">
                <img
                    src={dj.imageUrl}
                    className="w-full h-full object-cover scale-110 opacity-35 blur-xl"
                />
            </div>
        </div>
    );
});

const useImagePreloader = (urls) => {
    const [loadedUrls, setLoadedUrls] = useState(new Set());
    // 依存配列用に、URLリストを文字列化
    const urlsKey = JSON.stringify(urls);

    useEffect(() => {
        let isCancelled = false;
        const loadImages = async () => {
            const filteredUrls = urls.filter(Boolean);
            if (filteredUrls.length === 0) {
                setLoadedUrls(new Set()); // 空の Set
                return;
            }

            // 既存のロード済みSetをコピー
            const newLoadedUrls = new Set(loadedUrls);
            let needsUpdate = false; // Set の更新が必要か

            try {
                await Promise.all(
                    filteredUrls.map(url => {
                        if (newLoadedUrls.has(url)) {
                            return Promise.resolve(); // 既にロード済み
                        }
                        needsUpdate = true; // 新しいロードが必要

                        // 新しい画像をロード
                        return new Promise((resolve) => {
                            const img = new Image();
                            img.src = url;
                            img.onload = () => {
                                if (!isCancelled) {
                                    newLoadedUrls.add(url); // ロード成功
                                }
                                resolve();
                            };
                            img.onerror = resolve; // 失敗しても次へ
                        });
                    })
                );

                if (!isCancelled && needsUpdate) {
                    console.log('[useImagePreloader] Images loaded:', newLoadedUrls);
                    setLoadedUrls(newLoadedUrls); // 新しい Set で更新
                }

            } catch (error) {
                console.error("Failed to preload images", error);
            }
        };

        loadImages();

        return () => { isCancelled = true; };
    }, [urlsKey]); // urlsKey (文字列) に依存

    // 全てのURLがロードされたかどうかの boolean も返す
    const allLoaded = urls.filter(Boolean).every(url => loadedUrls.has(url));

    return { loadedUrls, allLoaded };
};

const LiveView = ({ timetable, eventConfig, setMode, loadedUrls }) => {
    const [now, setNow] = useState(new Date());
    const timelineContainerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);

    // 毎秒更新される「最新の」状態データ
    const [currentData, setCurrentData] = useState(null);

    // 背景画像用のステート
    const [backgroundDj, setBackgroundDj] = useState(null);
    const [fadingOutBgDj, setFadingOutBgDj] = useState(null);

    // 背景がロード済みかどうかのステート (3回目修正のまま)
    const [isBackgroundReady, setIsBackgroundReady] = useState(false);

    // メインコンテンツ表示用のステート
    const [visibleContent, setVisibleContent] = useState(null); // 表示するコンテンツ
    const [fadingOutContent, setFadingOutContent] = useState(null); // 消えていくコンテンツ

    // 「今表示されている内容」を Ref で管理
    const displayedContentRef = useRef(null);
    // アニメーションのタイマーを Ref で管理
    const animationTimerRef = useRef(null);

    // ★★★ ここから追加っす！ ★★★
    // アイコンを遅れてフェードインさせるためのステート
    const [isIconVisible, setIsIconVisible] = useState(false);
    // アイコン用フェードインタイマーのRef
    const iconFadeInTimerRef = useRef(null);
    // ★★★ ここまで追加っす！ ★★★

    const schedule = useMemo(() => {
        if (timetable.length === 0) return [];
        const scheduleData = [];
        let lastEndTime = parseTime(eventConfig.startTime);
        for (const dj of timetable) {
            const startTime = new Date(lastEndTime);
            const durationMinutes = parseFloat(dj.duration) || 0;
            const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
            scheduleData.push({ ...dj, startTime, endTime });
            lastEndTime = endTime;
        }
        return scheduleData;
    }, [timetable, eventConfig.startTime]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        const updateWidth = () => {
            if (timelineContainerRef.current) setContainerWidth(timelineContainerRef.current.offsetWidth);
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => {
            clearInterval(timer);
            window.removeEventListener('resize', updateWidth);
        };
    }, []);

    // 毎秒実行: 「今」の状態を計算
    useEffect(() => {
        const currentIndex = schedule.findIndex(dj => now >= dj.startTime && now < dj.endTime);

        let newContentData = null;

        if (currentIndex !== -1) {
            // --- ON AIR ---
            const dj = schedule[currentIndex];
            const nextDj = (currentIndex < schedule.length - 1) ? schedule[currentIndex + 1] : null;
            const total = (dj.endTime - dj.startTime) / 1000;
            const remainingMs = (dj.endTime - now);
            const remainingSeconds = Math.ceil(remainingMs / 1000);

            newContentData = {
                ...dj,
                status: 'ON AIR',
                timeLeft: remainingSeconds,
                progress: total > 0 ? ((total - (remainingMs / 1000)) / total) * 100 : 0,
                nextDj: nextDj
            };

        } else {
            const upcomingDj = schedule.find(dj => now < dj.startTime);
            if (upcomingDj) {
                // --- UPCOMING ---
                const remainingMs = (upcomingDj.startTime - now);
                const remainingSeconds = Math.ceil(remainingMs / 1000);

                newContentData = {
                    ...upcomingDj,
                    status: 'UPCOMING',
                    timeLeft: remainingSeconds,
                    progress: 0,
                    nextDj: schedule[0]
                };
            } else {
                // --- FINISHED ---
                newContentData = {
                    id: 'finished',
                    status: 'FINISHED'
                };
            }
        }

        setCurrentData(newContentData);

    }, [now, schedule]);


    // 背景画像の切り替えロジック (3回目修正のまま)
    useEffect(() => {
        const newBgCandidate = (currentData?.status === 'ON AIR' && currentData.imageUrl && !currentData.isBuffer) ? currentData : null;

        if (backgroundDj?.id === newBgCandidate?.id) {
            const newIsReady = newBgCandidate ? loadedUrls.has(newBgCandidate.imageUrl) : false;
            if (isBackgroundReady !== newIsReady) {
                setIsBackgroundReady(newIsReady);
            }
            return;
        }

        const FADE_DURATION = 3000;
        const delay = backgroundDj ? FADE_DURATION : 0;

        setFadingOutBgDj(backgroundDj);
        setBackgroundDj(null);
        setIsBackgroundReady(false);

        if (newBgCandidate) {
            const timer = setTimeout(() => {
                setFadingOutBgDj(null);
                setBackgroundDj(newBgCandidate);
                setIsBackgroundReady(loadedUrls.has(newBgCandidate.imageUrl));
            }, delay);

            return () => clearTimeout(timer);

        } else {
            const timer = setTimeout(() => {
                setFadingOutBgDj(null);
            }, delay);

            return () => clearTimeout(timer);
        }

    }, [currentData, backgroundDj, loadedUrls, isBackgroundReady]);


    // メインコンテンツの切り替えロジック (3回目修正のまま)
    useEffect(() => {
        const newContent = currentData;
        if (!newContent) return; // データがなければ何もしない

        const oldContent = displayedContentRef.current;

        // (A) DJが同じで、情報（残り時間など）だけ更新される場合
        if (oldContent?.id === newContent.id) {
            setVisibleContent(newContent); // ★ タイマーが動くように毎秒更新
            displayedContentRef.current = newContent;
            return; // これ以上のアニメーション処理は不要
        }

        // (B) DJが切り替わった場合 (クロスフェード処理)
        // console.log(`[LiveView] DJ CHANGE: YES (From ${oldContent?.id} to ${newContent.id})`);

        // 既存のアニメーションタイマーをクリア
        if (animationTimerRef.current) {
            clearTimeout(animationTimerRef.current);
        }

        // ★★★ ここから追加っす！ ★★★
        // アイコンの表示ステートをリセット
        setIsIconVisible(false);
        // console.log('[LiveView] 1. Set isIconVisible: false');
        // 既存のアイコンフェードインチューマーがあればクリア
        if (iconFadeInTimerRef.current) {
            clearTimeout(iconFadeInTimerRef.current);
            iconFadeInTimerRef.current = null;
        }
        // ★★★ ここまで追加っす！ ★★★

        const CONTENT_FADE_OUT_DURATION = 500; // 0.5s

        // 1. 古いコンテンツを「消える用」にセット
        setFadingOutContent(oldContent);

        // 2. 新しいコンテンツを「入る用」にセット
        setVisibleContent(newContent);
        displayedContentRef.current = newContent;

        // 3. 0.5秒後に古いDOMを消す
        const fadeOutTimer = setTimeout(() => {
            setFadingOutContent(null);
            animationTimerRef.current = null;
        }, CONTENT_FADE_OUT_DURATION);

        animationTimerRef.current = fadeOutTimer;

    }, [currentData]); // ★★★ 依存配列は [currentData] だけにするっす！

    // ★★★ ここから追加っす！ ★★★
    // 新しいコンテンツ（visibleContent）が表示されたら、
    // わずかに遅れてアイコン（isIconVisible）をフェードインさせる
    useEffect(() => {
        // console.log(`[LiveView] 2. visibleContent changed to: ${visibleContent?.id}`);
        // 既存のタイマーがあればクリア
        if (iconFadeInTimerRef.current) {
            clearTimeout(iconFadeInTimerRef.current);
        }

        if (visibleContent && visibleContent.status === 'ON AIR' && !visibleContent.isBuffer) {
            // メインのアニメーション(fade-in-up)が始まってからアイコンをフェードインさせる
            // 50ms (0.05秒) のディレイ
            iconFadeInTimerRef.current = setTimeout(() => {
                // console.log(`[LiveView] 4. Timer Fired! Setting isIconVisible: true (DJ: ${visibleContent.id})`);
                setIsIconVisible(true);
            }, 50);
            // console.log('[LiveView] 3. Setting icon timer (50ms)...');

        } else if (visibleContent) {
            // ON AIR 以外 (バッファ、UPCOMING, FINISHED) の場合は、ディレイなしで即時表示
            // console.log(`[LiveView] 3. (No timer) Setting isIconVisible: true (for ${visibleContent.id})`);
            setIsIconVisible(true);
        }

        // クリーンアップ
        return () => {
            if (iconFadeInTimerRef.current) {
                clearTimeout(iconFadeInTimerRef.current);
                iconFadeInTimerRef.current = null;
            }
        };
    }, [visibleContent]); // visibleContent が変わるたびに実行
    // ★★★ ここまで追加っす！ ★★★


    const timelineTransform = useMemo(() => {
        if (schedule.length === 0 || containerWidth === 0) return 'translateX(0px)';
        const itemWidth = 256, gap = 24, step = itemWidth + gap;
        const centerScreenOffset = containerWidth / 2, centerItemOffset = itemWidth / 2;

        let targetIndex = schedule.findIndex(dj => dj.id === currentData?.id);
        if (targetIndex === -1) {
            if (currentData?.status === 'FINISHED') targetIndex = schedule.length - 1;
            else targetIndex = 0;
        }

        const finalX = centerScreenOffset - centerItemOffset - (targetIndex * step);
        return `translateX(${finalX}px)`;
    }, [currentData, containerWidth, schedule]);

    const formatTime = (seconds) => {
        if (seconds < 0) seconds = 0;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const bgColorStyle = (currentData?.status === 'ON AIR') ? { background: `radial-gradient(ellipse 80% 60% at 50% 120%, ${currentData.color}33, transparent)` } : {};

    // ★★★ 修正箇所 ★★★
    // renderContent 関数
    const renderContent = (content, mode) => { // ★★★ mode 引数を追加っす！
        if (!content) return null;

        // ... (UPCOMING の部分は変更なし) ...

        // ON AIR の場合
        if (content.status === 'ON AIR') {
            const dj = content;
            const isImageReady = !dj.imageUrl || dj.isBuffer || loadedUrls.has(dj.imageUrl);

            // ★★★ 修正っす！ ★★★
            const isFadingIn = mode === 'FADE_IN'; // FADE_IN モードか判定

            // ★★★ ログっす！ ★★★
            // console.log(
            //     `%c[renderContent] ${mode}`, 'font-weight: bold;',
            //     `DJ: ${dj.id}, isIconVisible: ${isIconVisible}, isImageReady: ${isImageReady}`
            // );

            return (
                <main className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-8">
                    {!dj.isBuffer && (
                        // ★★★ 修正っす！ ★★★
                        // FADE_IN の時だけ isIconVisible のロジックを適用する
                        // FADE_OUT の時は isIconVisible を無視して opacity-100 にする
                        <div className={`
                            w-full max-w-sm sm:max-w-md aspect-square bg-surface-container rounded-full shadow-2xl overflow-hidden flex-shrink-0 relative
                            will-change-opacity
                            ${isFadingIn
                                ? `transition-opacity duration-500 ease-in-out ${isIconVisible ? 'opacity-100' : 'opacity-0'}`
                                : 'opacity-100' // FADE_OUT時は常に表示
                            }
                        `}>

                            {/* ★★★ 修正後（中身） ★★★ */}
                            {/* レイヤー1（中身）: transition-opacity を削除！ */}
                            <div className={`
                                w-full h-full flex items-center justify-center 
                                will-change-opacity
                                ${isImageReady ? 'opacity-100' : 'opacity-0'}
                            `}>
                                {dj.imageUrl ? (
                                    <SimpleImage src={dj.imageUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-1/2 h-1/2 text-on-surface-variant" />
                                )}
                            </div>

                            {/* ★★★ 修正後（スピナー） ★★★ */}
                            {/* レイヤー2（スピナー）: transition-opacity を削除！ */}
                            {dj.imageUrl && (
                                <div className={`
                                    absolute inset-0 flex items-center justify-center 
                                    will-change-opacity 
                                    ${!isImageReady ? 'opacity-100' : 'opacity-0'}
                                `}>
                                    <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spinner"></div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className={`flex flex-col ${dj.isBuffer ? 'items-center text-center' : 'text-center md:text-left'}`}>
                        <div className="flex flex-col space-y-3">
                            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold break-words leading-tight">{dj.name}</h1>

                            <p className="text-2xl md:text-3xl font-semibold tracking-wider font-mono" style={{ color: dj.color }}>
                                {dj.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {dj.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>

                            <p className="flex items-baseline justify-center md:justify-start text-6xl sm:text-7xl md:text-8xl text-on-surface my-2 whitespace-nowrap">
                                <span className="text-3xl sm:text-4xl text-on-surface-variant mr-4 font-sans font-bold">残り</span>
                                <span className="font-mono inline-block text-left w-[5ch]">{formatTime(dj.timeLeft)}</span>
                            </p>

                            <div className={`bg-surface-container rounded-full h-3.5 overflow-hidden w-full`}>
                                <div className="h-full rounded-full transition-all duration-500 ease-linear" style={{ width: `${dj.progress}%`, backgroundColor: dj.color }}></div>
                            </div>
                        </div>
                        {dj.nextDj && (
                            <div className="mt-8 pt-6 border-t border-on-surface-variant/20">
                                <p className="text-sm text-on-surface-variant font-bold tracking-widest mb-1">NEXT UP</p>
                                <p className="text-2xl font-semibold">{dj.nextDj.name} <span className="text-lg font-sans text-on-surface-variant ml-2 font-mono">{dj.nextDj.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ~</span></p>
                            </div>
                        )}
                    </div>
                </main>
            );
        }

        // FINISHED の場合
        if (content.status === 'FINISHED') {
            return (<div className="text-center"><h1 className="text-5xl md:text-7xl font-bold">EVENT FINISHED</h1></div>);
        }

        return null;
    };

    return (
        <div className="fixed inset-0" style={bgColorStyle}>

            {/* 背景画像はコメントアウトしたままっす */}
            {/* {fadingOutBgDj && <BackgroundImage key={fadingOutBgDj.id} dj={fadingOutBgDj} isFadingOut={true} isReady={true} />} */}
            {/* {backgroundDj && <BackgroundImage key={backgroundDj.id} dj={backgroundDj} isFadingOut={false} isReady={isBackgroundReady} />} */}

            {/* ヘッダーと編集ボタン */}
            <header className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 w-max flex flex-col items-center space-y-2 z-20">
                <h1 className="text-xl font-bold text-on-surface-variant tracking-wider">{eventConfig.title}</h1>
                <div className="bg-black/30 backdrop-blur-sm text-on-surface font-bold py-2 px-4 rounded-full text-2xl tracking-wider font-mono text-center w-[10ch]">
                    {now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
            </header>
            <button onClick={() => setMode('edit')} className="absolute top-4 md:top-8 right-4 flex items-center bg-surface-container hover:opacity-90 text-white font-bold py-2 px-4 rounded-full transition-opacity duration-200 text-sm z-20">編集</button>


            {/* メインコンテンツエリア */}
            <div className="absolute top-24 bottom-32 left-0 right-0 px-4 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full overflow-y-auto flex items-center justify-center relative">

                    {/* 消えていくコンテンツ (手前) */}
                    {fadingOutContent && (
                        <div
                            key={`fadeout-${fadingOutContent.id}`}
                            className="w-full animate-fade-out-down absolute inset-0 p-4 flex items-center justify-center z-10 will-change-[transform,opacity]"
                        >
                            {renderContent(fadingOutContent, 'FADE_OUT')} {/* ★★★ mode引数を渡すっす！ ★★★ */}
                        </div>
                    )}

                    {/* 表示されるコンテンツ (奥) */}
                    {visibleContent && (
                        <div
                            key={visibleContent.id}
                            className="w-full animate-fade-in-up absolute inset-0 p-4 flex items-center justify-center z-0 will-change-[transform,opacity]"
                        >
                            {renderContent(visibleContent, 'FADE_IN')} {/* ★★★ mode引数を渡すっす！ ★★★ */}
                        </div>
                    )}

                </div>
            </div>

            {/* 下部タイムライン */}
            {currentData?.status !== 'FINISHED' && (
                <div ref={timelineContainerRef} className="absolute bottom-0 left-0 right-0 w-full shrink-0 overflow-hidden mask-gradient z-10 pb-4 h-32">
                    <div
                        className="flex h-full items-center space-x-6 px-4 py-2 will-change-transform"
                        style={{
                            transform: timelineTransform,
                            transition: 'transform 1.0s ease-in-out'
                        }}
                    >
                        {schedule.map((dj, index) => (
                            <div
                                key={dj.id}
                                className={`
                                        shrink-0 w-64 h-24 bg-surface-container/40 backdrop-blur-sm rounded-2xl p-4 flex items-center 
                                        border border-white/30 
                                        ${dj.isBuffer ? 'justify-center' : 'space-x-6'} 
                                       
                                        ${(currentData?.status === 'ON AIR' && dj.id === currentData.id) ? 'opacity-100 scale-100' : 'opacity-60 scale-90'}
                                        transition-[opacity,transform] duration-1000 ease-in-out
                                        will-change-[opacity,transform]
                                      `}
                            >
                                {!dj.isBuffer && (
                                    <div className="w-14 h-14 rounded-full bg-surface-container flex-shrink-0 flex items-center justify-center overflow-hidden">
                                        {dj.imageUrl ? <SimpleImage src={dj.imageUrl} className="w-full h-full object-cover" /> : <UserIcon className="w-8 h-8 text-on-surface-variant" />}
                                    </div>
                                )}
                                <div className="overflow-hidden flex flex-col justify-center">
                                    <p className={`text-lg font-bold truncate w-full ${dj.isBuffer ? 'text-center' : 'text-left'}`}>{dj.name}</p>
                                    <p className={`text-sm font-mono text-on-surface-variant ${dj.isBuffer ? 'text-center' : 'text-left'}`}>{dj.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const App = () => {
    const [mode, setMode] = useState('edit');
    const [timetable, setTimetable] = useState([]);
    const [eventConfig, setEventConfig] = useState({ title: 'DJ Timekeeper Pro', startTime: '22:00' });
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [appStatus, setAppStatus] = useState('connecting'); // 'connecting', 'online', 'offline', 'config_error'
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const dbRef = useRef(null);
    const storageRef = useRef(null);

    const imageUrlsToPreload = useMemo(() => timetable.map(dj => dj.imageUrl), [timetable]);
    const { loadedUrls, allLoaded: imagesLoaded } = useImagePreloader(imageUrlsToPreload);
    //const imagesLoaded = useImagePreloader(imageUrlsToPreload);

    useEffect(() => {
        setTimeout(() => setIsInitialLoading(false), 2000);
        /*
        if (!window.firebaseConfig.apiKey || window.firebaseConfig.apiKey.includes("AIzaSy...")) {
            setAppStatus('config_error');
            return;
        }*/

        //const { initializeApp, getAuth, onAuthStateChanged, signInAnonymously, getFirestore, getStorage } = window.firebase;

        const connectionTimeout = setTimeout(() => {
            if (appStatus === 'connecting') {
                console.warn("Connection to Firebase timed out. Entering offline mode.");
                setAppStatus('offline');
            }
        }, 5000);

        try {
            // firebase.js から import した実体を Ref にセット
            dbRef.current = db;
            storageRef.current = storage;

            // import した auth を使って、認証状態を監視
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    clearTimeout(connectionTimeout);
                    setIsAuthenticated(true);
                    setAppStatus('online');
                } else {
                    // ユーザーがいなかったら匿名ログイン
                    await signInAnonymously(auth);
                }
            });
        } catch (e) {
            console.error("Firebase services setup failed:", e);
            clearTimeout(connectionTimeout);
            setAppStatus('offline');
        }

        return () => clearTimeout(connectionTimeout);
    }, []);

    useEffect(() => {
        if (appStatus !== 'online' || !isAuthenticated || !dbRef.current) return;

        //const { doc, onSnapshot } = window.firebase;
        const docRef = doc(dbRef.current, 'artifacts', appId, 'public', 'sharedTimetable');

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setTimetable(data.timetable || []);
                setEventConfig(data.eventConfig || { title: 'DJ Timekeeper Pro', startTime: '22:00' });
            } else {
                console.log("No shared document! Creating initial data.");
            }
        }, (error) => {
            console.error("Firestore snapshot error:", error);
            setAppStatus('offline');
        });

        return () => unsubscribe();
    }, [isAuthenticated, appStatus]);



    const saveDataToFirestore = useCallback(() => {
        if (appStatus !== 'online' || !isAuthenticated || !dbRef.current) return;

        //const { doc, setDoc } = window.firebase;
        const docRef = doc(dbRef.current, 'artifacts', appId, 'public', 'sharedTimetable');
        const dataToSave = { timetable, eventConfig };
        setDoc(docRef, dataToSave, { merge: true }).catch(error => {
            console.error("Error saving data to Firestore:", error);
        });
    }, [timetable, eventConfig, isAuthenticated, appStatus]);

    useEffect(() => {
        if (appStatus === 'online' && !isInitialLoading) {
            const handler = setTimeout(() => {
                saveDataToFirestore();
            }, 1000);
            return () => clearTimeout(handler);
        }
    }, [timetable, eventConfig, saveDataToFirestore, appStatus, isInitialLoading]);

    const handleSetMode = (newMode) => {
        if (newMode === 'live' && !imagesLoaded) {
            console.warn("Images not fully preloaded. Waiting...");
            alert("まだ画像の準備中っす！ちょっと待ってからもう一回押してくださいっす！");
            return;
        }
        setMode(newMode);
    };

    //const isLoading = isInitialLoading || (mode === 'live' && !imagesLoaded);
    const isLoading = isInitialLoading;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-surface-background">
                <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spinner mb-4"></div>
                <p className="text-lg text-on-surface-variant">
                    {isInitialLoading ? "Loading Timetable..." : "Preparing Live Mode..."}
                </p>
            </div>
        );
    }

    switch (appStatus) {
        case 'connecting':
            return <div className="flex items-center justify-center h-screen"><p className="text-2xl">Connecting...</p></div>;

        case 'config_error':
            return (
                <div className="flex items-center justify-center h-screen p-8 text-center bg-surface-background text-on-surface">
                    <div className="bg-surface-container p-8 rounded-2xl shadow-2xl max-w-2xl">
                        <h1 className="text-2xl font-bold text-red-400 mb-4">Firebaseの設定が必要です</h1>
                        <p className="text-on-surface-variant mb-6">
                            このアプリを動作させるには、<code>index.html</code> ファイル内の <code>firebaseConfig</code> オブジェクトを、ご自身のFirebaseプロジェクトのものに置き換える必要があります。
                        </p>
                        <code className="bg-surface-background text-left p-4 rounded-lg block overflow-x-auto text-sm">
                            <pre className="whitespace-pre-wrap">
                                {`// index.html内のこの部分を書き換えてください
const firebaseConfig = {
  apiKey: "ご自身のAPIキー",
  authDomain: "your-project.firebaseapp.com",
  // ...
};`}
                            </pre>
                        </code>
                        <p className="text-on-surface-variant mt-6 text-sm">
                            Firebaseコンソールでプロジェクトを作成し、ウェブアプリの設定画面から <code>firebaseConfig</code> をコピーして貼り付けてください。
                        </p>
                    </div>
                </div>
            );

        case 'offline':
        case 'online':
            return (
                <>
                    {appStatus === 'offline' && (
                        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500/90 text-white font-bold py-2 px-4 rounded-full shadow-lg flex items-center gap-2 animate-fade-in-up">
                            <AlertTriangleIcon className="w-5 h-5" />
                            <span>オフラインモード (データは保存・共有されません)</span>
                        </div>
                    )}
                    {mode === 'edit' ?
                        <TimetableEditor {...{ eventConfig, setEventConfig, timetable, setTimetable, setMode: handleSetMode, storage: storageRef.current }} /> :
                        // LiveView に loadedUrls を渡す
                        <LiveView {...{ timetable, eventConfig, setMode: handleSetMode, loadedUrls }} />
                    }
                </>
            );

        default:
            return <div className="flex items-center justify-center h-screen"><p className="text-2xl">Loading...</p></div>;
    }
};

export default App;