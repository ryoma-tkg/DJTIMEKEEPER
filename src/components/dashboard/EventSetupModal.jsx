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
    getTodayDateString,
    SparklesIcon,
    UserIcon,
    InfoIcon,
    DatePickerInput
} from '../common';

// ★ propsに isEditMode, initialData, onUpdate を追加
export const EventSetupModal = ({ isOpen, onClose, onCreate, onUpdate, defaultPreferences, user, userProfile, isEditMode = false, initialData = null }) => {
    const [config, setConfig] = useState({
        title: '',
        startDate: getTodayDateString(),
        startTime: '22:00',
        vjEnabled: false,
        isMultiFloor: false
    });
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

    const SUPER_ADMIN_UID = "GLGPpy6IlyWbGw15OwBPzRdCPZI2";

    const isGuest = user?.isAnonymous;
    const isAdmin = user?.uid === SUPER_ADMIN_UID || userProfile?.role === 'admin';
    const isProUser = userProfile?.role === 'pro';
    const canUseProFeatures = isAdmin || isProUser;

    useEffect(() => {
        if (isOpen) {
            if (isEditMode && initialData) {
                // ★ 編集モード時の初期値セット
                setConfig({
                    title: initialData.eventConfig?.title || '',
                    startDate: initialData.eventConfig?.startDate || getTodayDateString(),
                    startTime: initialData.eventConfig?.startTime || '22:00',
                    vjEnabled: initialData.eventConfig?.vjFeatureEnabled || false,
                    isMultiFloor: initialData.floors && Object.keys(initialData.floors).length > 1
                });
            } else {
                // 新規作成時の初期値セット
                setConfig({
                    title: '',
                    startDate: getTodayDateString(),
                    startTime: defaultPreferences?.defaultStartTime || '22:00',
                    vjEnabled: isGuest ? false : (defaultPreferences?.defaultVjEnabled || false),
                    isMultiFloor: canUseProFeatures ? (defaultPreferences?.defaultMultiFloor || false) : false
                });
            }
            setHasAttemptedSubmit(false);
        }
    }, [isOpen, defaultPreferences, isGuest, canUseProFeatures, isEditMode, initialData]);

    const isTitleError = !config.title || config.title.trim() === '';

    const handleSubmit = () => {
        setHasAttemptedSubmit(true);
        if (isTitleError) return;

        const finalConfig = {
            ...config,
            title: config.title.trim() || 'New Event',
            vjEnabled: isGuest ? false : config.vjEnabled,
            isMultiFloor: canUseProFeatures ? config.isMultiFloor : false
        };

        if (isEditMode) {
            onUpdate(finalConfig);
        } else {
            onCreate(finalConfig);
        }
    };

    const footerContent = (
        <div className="flex justify-end gap-3">
            <Button onClick={onClose} variant="ghost">キャンセル</Button>
            <Button onClick={handleSubmit} variant="primary">
                {isEditMode ? '更新する' : '作成する'}
            </Button>
        </div>
    );

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? "イベント設定の変更" : "新規イベント作成"}
            footer={footerContent}
            isScrollable={true}
            maxWidthClass="max-w-md"
        >
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
                        <div>
                            <DatePickerInput
                                label="開催日"
                                value={config.startDate}
                                onChange={(val) => setConfig({ ...config, startDate: val })}
                            />
                        </div>
                        <div><Label>開始時間</Label><CustomTimeInput value={config.startTime} onChange={(v) => setConfig({ ...config, startTime: v })} /></div>
                    </div>
                </div>

                <div className="pt-2">
                    <div className="text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">オプション設定</div>

                    <div className="bg-surface-background/50 rounded-xl px-4 py-2 space-y-2 border border-on-surface/5">
                        <div className={isGuest ? "opacity-50 pointer-events-none grayscale" : ""}>
                            <Toggle
                                checked={config.vjEnabled}
                                onChange={(val) => setConfig({ ...config, vjEnabled: val })}
                                label={isGuest ? "VJタイムテーブル (登録限定)" : "VJタイムテーブル機能"}
                                icon={VideoIcon}
                                description="VJのタイムテーブルも管理します"
                                disabled={isGuest}
                            />
                        </div>

                        <div className="border-t border-on-surface/5"></div>

                        {/* 編集モードではフロア構成の変更（特に減らす方）は複雑になるため、アラートを出すか無効化する方が安全だが、今回は有効のままにする */}
                        <div className={!canUseProFeatures ? "opacity-50 pointer-events-none grayscale" : ""}>
                            <Toggle
                                checked={config.isMultiFloor}
                                onChange={(val) => setConfig({ ...config, isMultiFloor: val })}
                                label={!canUseProFeatures ? "複数フロア (Pro限定)" : "複数フロアを使用"}
                                icon={LayersIcon}
                                description="メインフロア以外のステージを追加します"
                                disabled={!canUseProFeatures}
                            />
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        {isGuest && (
                            <div className="relative overflow-hidden rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                                <div className="flex items-start gap-3">
                                    <UserIcon className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-amber-500 mb-1">ゲストモードで作成中</p>
                                        <p className="text-xs text-on-surface-variant leading-relaxed">
                                            データは<span className="font-bold text-on-surface">36時間後に自動削除</span>されます。<br />
                                            永続保存するにはログインしてください。
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!canUseProFeatures && !isGuest && (
                            <div className="relative overflow-hidden rounded-lg bg-brand-primary/5 border border-brand-primary/20 p-4">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary" />
                                <div className="flex items-start gap-3">
                                    <SparklesIcon className="w-5 h-5 text-brand-primary mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-brand-primary mb-1">Coming Soon...</p>
                                        <p className="text-xs text-on-surface-variant leading-relaxed">
                                            複数フロア機能は将来のアップデートで提供予定です。<br />
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </BaseModal>
    );
};