import { useMemo } from 'react';
import { parseTime, VIVID_COLORS } from '../components/common';

export const useTimetable = (timetable, eventConfig, setTimetable, setEventConfig, now, setIsResetConfirmOpen) => {

    const { schedule, eventEndTime, currentlyPlayingIndex, recalculateTimes, handleUpdate, addNewDj, executeReset, handleRemoveDj, handleCopyDj } = useMemo(() => {

        const recalculateTimes = (timetableData, eventStartTime) => {
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
        };

        const schedule = recalculateTimes(timetable, eventConfig.startTime);
        const eventEndTime = schedule.length > 0 ? schedule[schedule.length - 1].endTime : null;

        const nowTime = new Date(now);
        const currentlyPlayingIndex = schedule.findIndex(dj => {
            const startTime = parseTime(dj.startTime);
            const endTime = parseTime(dj.endTime);
            if (endTime < startTime) {
                return (nowTime >= startTime) || (nowTime < endTime);
            }
            return nowTime >= startTime && nowTime < endTime;
        });

        const handleUpdate = (index, field, value) => {
            setTimetable(prevTimetable => {
                const newTimetable = [...prevTimetable];
                newTimetable[index] = { ...newTimetable[index], [field]: value };
                if (field === 'duration') {
                    return recalculateTimes(newTimetable, eventConfig.startTime);
                }
                return newTimetable;
            });
        };

        const addNewDj = (isBuffer = false) => {
            setTimetable(prevTimetable => {
                const lastDj = prevTimetable[prevTimetable.length - 1];
                const duration = isBuffer ? 5 : (lastDj ? lastDj.duration : 60);
                const newDjData = { id: Date.now(), name: isBuffer ? 'バッファー' : `DJ ${prevTimetable.filter(d => !d.isBuffer).length + 1}`, duration: duration, imageUrl: '', color: VIVID_COLORS[Math.floor(Math.random() * VIVID_COLORS.length)], isBuffer, };
                return recalculateTimes([...prevTimetable, newDjData], eventConfig.startTime);
            });
        };

        const executeReset = () => {
            setTimetable([]);
            setEventConfig({ title: 'My Awesome Event', startTime: '22:00' });
            setIsResetConfirmOpen(false);
        };

        const handleRemoveDj = (index) => setTimetable(prevTimetable => recalculateTimes(prevTimetable.filter((_, i) => i !== index), eventConfig.startTime));

        const handleCopyDj = (index) => {
            setTimetable(prevTimetable => {
                const djToCopy = { ...prevTimetable[index], id: Date.now() };
                const newTimetable = [...prevTimetable.slice(0, index + 1), djToCopy, ...prevTimetable.slice(index + 1)];
                return recalculateTimes(newTimetable, eventConfig.startTime);
            });
        };

        return { schedule, eventEndTime, currentlyPlayingIndex, recalculateTimes, handleUpdate, addNewDj, executeReset, handleRemoveDj, handleCopyDj };

    }, [timetable, eventConfig.startTime, now, setEventConfig, setTimetable, setIsResetConfirmOpen]);

    // 合計時間の計算ロジックもこっちに持ってきたっす！
    const totalEventDuration = useMemo(() => {
        const totalMinutes = timetable.reduce((sum, dj) => {
            return sum + (parseFloat(dj.duration) || 0);
        }, 0);

        if (totalMinutes === 0) return null;

        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);

        if (hours > 0) {
            return `${hours}時間 ${minutes}分`;
        } else {
            return `${minutes}分`;
        }
    }, [timetable]);

    // イベント開始時間ハンドラもこっちに移動っす！
    const handleEventConfigChange = (field, value) => {
        setEventConfig(prevConfig => {
            const newConfig = { ...prevConfig, [field]: value };
            if (field === 'startTime') {
                setTimetable(prevTimetable => recalculateTimes(prevTimetable, value));
            }
            return newConfig;
        });
    };

    return {
        schedule,
        eventEndTime,
        currentlyPlayingIndex,
        totalEventDuration,
        recalculateTimes, // D&Dフックで使うためにこれも返すっす
        handleEventConfigChange,
        handleUpdate,
        addNewDj,
        executeReset,
        handleRemoveDj,
        handleCopyDj
    };
};