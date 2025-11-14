import { useMemo, useCallback } from 'react'; // ★ useCallback をインポート
import { parseDateTime } from '../components/common'; // ★ parseDateTime をインポート

// ★★★ シグネチャ（引数）は変更なし ★★★
export const useTimetable = (timetable, eventStartDateStr, eventStartTimeStr, now) => {

    // 1. ★★★ イベントの基点となる「単一の」Dateオブジェクト (変更なし) ★★★
    const eventStartTimeDate = useMemo(() => {
        return parseDateTime(eventStartDateStr, eventStartTimeStr);
    }, [eventStartDateStr, eventStartTimeStr]);


    // 2. ★★★ 状態判定ロジックに「3時間バッファー」を導入 ★★★
    const {
        schedule,
        eventEndTimeDate,
        eventStatus,
        currentlyPlayingIndex,
        totalEventDurationMs
    } = useMemo(() => {

        // (A) 合計時間を計算 (ミリ秒)
        const totalMs = timetable.reduce((sum, dj) => {
            return sum + (parseFloat(dj.duration) || 0) * 60 * 1000;
        }, 0);

        if (totalMs === 0) {
            // タイムテーブルが空の場合
            const nowTime = new Date(now).getTime();
            const startTimeMs = eventStartTimeDate.getTime();
            const upcomingBufferMs = 3 * 60 * 60 * 1000; // 3時間

            let status = 'STANDBY';
            if (nowTime < (startTimeMs - upcomingBufferMs)) {
                status = 'STANDBY';
            } else if (nowTime < startTimeMs) {
                status = 'UPCOMING';
            } else {
                status = 'FINISHED'; // 開始時刻を過ぎたらもう FINISHED 扱い
            }

            return {
                schedule: [],
                eventEndTimeDate: new Date(eventStartTimeDate.getTime()), // 終了時刻＝開始時刻
                eventStatus: status,
                currentlyPlayingIndex: -1,
                totalEventDurationMs: 0,
            };
        }

        // (B) イベントの「絶対的な」終了時刻を計算
        const endTimeDate = new Date(eventStartTimeDate.getTime() + totalMs);

        // (C) スケジュール配列を計算 (recalculateTimes と同じロジック)
        const calculatedSchedule = [];
        let lastEndTime = new Date(eventStartTimeDate.getTime()); // 基点時刻からスタート

        for (let i = 0; i < timetable.length; i++) {
            const currentItem = { ...timetable[i] };
            const currentStartTime = new Date(lastEndTime);
            const durationMinutes = parseFloat(currentItem.duration) || 0;
            const currentEndTime = new Date(currentStartTime.getTime() + durationMinutes * 60 * 1000);

            calculatedSchedule.push({
                ...currentItem,
                startTime: currentStartTime.toTimeString().slice(0, 5),
                endTime: currentEndTime.toTimeString().slice(0, 5),
                startTimeDate: currentStartTime,
                endTimeDate: currentEndTime,
            });
            lastEndTime = currentEndTime;
        }

        // (D) ★★★ 現在の状態と再生中インデックスを計算 (ロジック修正) ★★★
        const nowTime = new Date(now).getTime();
        const startTimeMs = eventStartTimeDate.getTime();
        const upcomingBufferMs = 3 * 60 * 60 * 1000; // 3時間

        let status = 'STANDBY'; // デフォルト
        let playingIndex = -1;

        if (nowTime < (startTimeMs - upcomingBufferMs)) {
            status = 'STANDBY'; // 3時間以上前
        } else if (nowTime < startTimeMs) {
            status = 'UPCOMING'; // 3時間前から開始まで
        } else if (nowTime >= endTimeDate.getTime()) {
            status = 'FINISHED'; // 終了
        } else {
            // イベント開催期間中
            status = 'ON_AIR_BLOCK';
            playingIndex = calculatedSchedule.findIndex(item => {
                const startTime = item.startTimeDate.getTime();
                const endTime = item.endTimeDate.getTime();
                return nowTime >= startTime && nowTime < endTime;
            });
        }

        return {
            schedule: calculatedSchedule,
            eventEndTimeDate: endTimeDate,
            eventStatus: status,
            currentlyPlayingIndex: playingIndex,
            totalEventDurationMs: totalMs,
        };

    }, [timetable, eventStartTimeDate, now]); // ★ 依存配列は変更なし


    // 3. (変更なし) D&Dや更新で使えるように外に出しておく
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


    // 4. (変更なし) トータル時間 (HH:MM表示用)
    const totalEventDuration = useMemo(() => {
        const totalMinutes = totalEventDurationMs / 60 / 1000;

        if (totalMinutes === 0) return null;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);

        if (hours > 0) {
            return `${hours}時間 ${minutes}分`;
        } else {
            return `${minutes}分`;
        }
    }, [totalEventDurationMs]);

    // 5. (変更なし) イベントの残り時間と経過時間 (LiveView用)
    const { eventRemainingSeconds, eventElapsedSeconds } = useMemo(() => {
        const nowTime = new Date(now).getTime();

        const remaining = (eventEndTimeDate.getTime() - nowTime) / 1000;
        const elapsed = (nowTime - eventStartTimeDate.getTime()) / 1000;

        return {
            eventRemainingSeconds: Math.max(0, remaining),
            eventElapsedSeconds: Math.max(0, elapsed),
        };
    }, [now, eventStartTimeDate, eventEndTimeDate]);


    return {
        schedule, // (C)
        eventEndTime: eventEndTimeDate.toTimeString().slice(0, 5),
        eventEndTimeDate, // (B)
        eventStartTimeDate, // (A)
        eventStatus, // (D)
        currentlyPlayingIndex, // (D)
        totalEventDuration, // (4)
        recalculateTimes, // (3)
        // (5) LiveViewで使うために追加
        eventRemainingSeconds,
        eventElapsedSeconds,
    };
};