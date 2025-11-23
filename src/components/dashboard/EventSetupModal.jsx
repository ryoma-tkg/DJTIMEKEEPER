// [src/components/dashboard/EventSetupModal.jsx]
import React, { useState, useEffect } from 'react';
import {
    CalendarIcon,
    VideoIcon,
    LayersIcon,
    BaseModal,
    Button,
    Input,
    Label,
    Toggle,
    CustomTimeInput,
    getTodayDateString
} from '../common';

export const EventSetupModal = ({ isOpen, onClose, onCreate, defaultPreferences }) => {
    const [config, setConfig] = useState({
        title: '',
        startDate: getTodayDateString(),
        startTime: '22:00',
        vjEnabled: false,
        isMultiFloor: false
    });
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setConfig({
                title: '',
                startDate: getTodayDateString(),
                startTime: defaultPreferences?.defaultStartTime || '22:00',
                vjEnabled: defaultPreferences?.defaultVjEnabled || false,
                isMultiFloor: defaultPreferences?.defaultMultiFloor || false
            });
            setHasAttemptedSubmit(false);
        }
    }, [isOpen, defaultPreferences]);

    const isTitleError = !config.title || config.title.trim() === '';

    const handleSubmit = () => {
        setHasAttemptedSubmit(true);
        if (isTitleError) return;
        const finalConfig = { ...config, title: config.title.trim() || 'New Event' };
        onCreate(finalConfig);
    };

    const footerContent = (
        <div className="flex justify-end gap-3">
            <Button onClick={onClose} variant="ghost">キャンセル</Button>
            <Button onClick={handleSubmit} variant="primary">作成する</Button>
        </div>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="新規イベント作成" footer={footerContent} isScrollable={true} maxWidthClass="max-w-md">
            <div className="space-y-6">
                <div className="space-y-4">
                    <Input
                        label="イベント名"
                        value={config.title}
                        onChange={(e) => setConfig({ ...config, title: e.target.value })}
                        placeholder="イベント名を入力..."
                        autoFocus
                        isError={isTitleError}
                        error={hasAttemptedSubmit && isTitleError ? "イベント名を入力してください" : null}
                    />
                    <div className="space-y-3">
                        <div><Label>開催日</Label><Input type="date" value={config.startDate} onChange={(e) => setConfig({ ...config, startDate: e.target.value })} icon={CalendarIcon} className="font-mono text-sm" /></div>
                        <div><Label>開始時間</Label><CustomTimeInput value={config.startTime} onChange={(v) => setConfig({ ...config, startTime: v })} /></div>
                    </div>
                </div>

                {/* Catalog Design Option Settings (Rounded Gray Box) */}
                <div className="pt-2">
                    <div className="text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">オプション設定</div>
                    <div className="bg-surface-background/50 rounded-xl px-4 py-2 space-y-2 border border-on-surface/5">
                        <Toggle checked={config.vjEnabled} onChange={(val) => setConfig({ ...config, vjEnabled: val })} label="VJタイムテーブル機能" icon={VideoIcon} description="VJのタイムテーブルも管理します" />
                        <div className="border-t border-on-surface/5"></div>
                        <Toggle checked={config.isMultiFloor} onChange={(val) => setConfig({ ...config, isMultiFloor: val })} label="複数フロアを使用" icon={LayersIcon} description="メインフロア以外のステージを追加します" />
                    </div>
                    <p className="text-[12px] text-on-surface-variant/60 pl-2 mt-2 pb-1">
                        ※ 複数フロアをONにすると、初期状態で2つのフロアが作成されます。
                    </p>
                </div>
            </div>
        </BaseModal>
    );
};