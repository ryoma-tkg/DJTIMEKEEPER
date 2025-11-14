import { useMemo } from 'react';
import { parseTime } from '../components/common';

// ★★★ LiveView.jsx とロジックを完全に統一っす！ ★★★
export const useTimetable = (timetable, eventStartTimeStr, now) => {

    // 1. LiveView と同じロジックで「有効な」イベントの開始/終了時刻と状態を判定
    const { activeStartTime, eventEndTimeDate, eventStatus } = useMemo(() => {
        if (timetable.length === 0) {
            const startTime = parseTime(eventStartTimeStr);
            return {
                activeStartTime: startTime, // 基点時刻
                eventEndTimeDate: startTime, // 終了時刻
                eventStatus: 'UPCOMING', // 状態
            };
        }

        const nowTime = new Date(now).getTime();

        const totalDurationMs = timetable.reduce((sum, dj) => {
            return sum + (parseFloat(dj.duration) || 0) * 60 * 1000;
        }, 0);

        const startTimeToday = parseTime(eventStartTimeStr);
        const endTimeToday = new Date(startTimeToday.getTime() + totalDurationMs);

        const startTimeYesterday = new Date(startTimeToday.getTime() - 24 * 60 * 60 * 1000);
        const endTimeYesterday = new Date(endTimeToday.getTime() - 24 * 60 * 60 * 1000);

        const bufferMs = 3 * 60 * 60 * 1000;

        let activeStartTime = startTimeToday;
        let status = 'STANDBY';

        if (nowTime >= startTimeYesterday.getTime() && nowTime < endTimeYesterday.getTime()) {
            activeStartTime = startTimeYesterday;
            status = 'ON_AIR_BLOCK';
        } else if (nowTime >= endTimeYesterday.getTime() && nowTime < (endTimeYesterday.getTime() + bufferMs)) {
            activeStartTime = startTimeYesterday;
            status = 'FINISHED';
        } else if (nowTime >= (startTimeToday.getTime() - bufferMs) && nowTime < startTimeToday.getTime()) {
            activeStartTime = startTimeToday;
            status = 'UPCOMING';
        } else if (nowTime >= startTimeToday.getTime() && nowTime < endTimeToday.getTime()) {
            activeStartTime = startTimeToday;
            status = 'ON_AIR_BLOCK';
        } else if (nowTime < startTimeYesterday.getTime() - bufferMs) {
            activeStartTime = startTimeYesterday;
            status = 'STANDBY';
        } else if (nowTime > endTimeToday.getTime()) {
            activeStartTime = startTimeToday;
            status = 'FINISHED';
        } else {
            activeStartTime = startTimeToday;
            status = 'STANDBY';
        }

        return {
            activeStartTime: activeStartTime,
            eventEndTimeDate: new Date(activeStartTime.getTime() + totalDurationMs),
            eventStatus: status,
        };

    }, [timetable, eventStartTimeStr, now]);


    // 2. `recalculateTimes` 関数を useMemo の外に出す (D&Dや更新で使えるように)
    // この関数は「基点時刻」を引数に取る純粋な計算機にするっす
    const recalculateTimes = useCallback((timetableData, baseStartTimeDate) => {
        if (!timetableData || timetableData.length === 0) return [];
        const recalculated = [];
        let lastEndTime = baseStartTimeDate; // ★ Date オブジェクトをそのまま使う

        for (let i = 0; i < timetableData.length; i++) {
            const currentItem = { ...timetableData[i] };
            const currentStartTime = new Date(lastEndTime);
            const durationMinutes = parseFloat(currentItem.duration) || 0;
            const currentEndTime = new Date(currentStartTime.getTime() + durationMinutes * 60 * 1000);

            recalculated.push({
                ...currentItem,
                startTime: currentStartTime.toTimeString().slice(0, 5),
                endTime: currentEndTime.toTimeString().slice(0, 5),
                startTimeDate: currentStartTime,
                endTimeDate: currentEndTime,
            });

            lastEndTime = currentEndTime;
        }
        return recalculated;
    }, []); // 依存配列なし

    // 3. schedule と currentlyPlayingIndex を `activeStartTime` を使って計算
    const { schedule, currentlyPlayingIndex } = useMemo(() => {
        // ★ `activeStartTime` を基点にスケジュールを計算
        const calculatedSchedule = recalculateTimes(timetable, activeStartTime);

        // ★ `now` と `eventStatus` を使って再生中インデックスを計算
        let playingIndex = -1;
        if (eventStatus === 'ON_AIR_BLOCK') {
            const nowTime = new Date(now).getTime();
            playingIndex = calculatedSchedule.findIndex(item => {
                const startTime = item.startTimeDate.getTime();
                const endTime = item.endTimeDate.getTime();
                return nowTime >= startTime && nowTime < endTime;
            });
        }

        return { schedule: calculatedSchedule, currentlyPlayingIndex: playingIndex };

    }, [timetable, activeStartTime, eventStatus, now, recalculateTimes]);


    // 4. トータル時間
    const totalEventDuration = useMemo(() => {
        const totalMinutes = timetable.reduce((sum, item) => {
            return sum + (parseFloat(item.duration) || 0);
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

    return {
        schedule,
        eventEndTime: eventEndTimeDate ? eventEndTimeDate.toTimeString().slice(0, 5) : null,
        eventEndTimeDate: eventEndTimeDate, // ★ Date オブジェクトも渡す
        eventStartTimeDate: activeStartTime, // ★ Date オブジェクトを渡す
        currentlyPlayingIndex,
        totalEventDuration,
        recalculateTimes, // ★ 外に出した関数を渡す
    };
};