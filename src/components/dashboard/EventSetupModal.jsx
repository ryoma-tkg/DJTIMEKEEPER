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
    InfoIcon // 追加
} from '../common';

export const EventSetupModal = ({ isOpen, onClose, onCreate, defaultPreferences, user, userProfile }) => {
    const [config, setConfig] = useState({
        title: '',
        startDate: getTodayDateString(),
        startTime: '22:00',
        vjEnabled: false,
        isMultiFloor: false
    });
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

    const SUPER_ADMIN_UID = "GLGPpy6IlyWbGw15OwBPzRdCPZI2";

    // 権限判定
    const isGuest = user?.isAnonymous;
    const isAdmin = user?.uid === SUPER_ADMIN_UID || userProfile?.role === 'admin';
    const isProUser = userProfile?.role === 'pro';
    const canUseProFeatures = isAdmin || isProUser;

    useEffect(() => {
        if (isOpen) {
            setConfig({
                title: '',
                startDate: getTodayDateString(),
                startTime: defaultPreferences?.defaultStartTime || '22:00',
                // 権限がない場合は強制OFF、ある場合はデフォルト設定に従う
                vjEnabled: isGuest ? false : (defaultPreferences?.defaultVjEnabled || false),
                isMultiFloor: canUseProFeatures ? (defaultPreferences?.defaultMultiFloor || false) : false
            });
            setHasAttemptedSubmit(false);
        }
    }, [isOpen, defaultPreferences, isGuest, canUseProFeatures]);

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

                <div className="pt-2">
                    <div className="text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">オプション設定</div>

                    {/* 設定エリア */}
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

                        <div className={!canUseProFeatures ? "opacity-50 pointer-events-none grayscale" : ""}>
                            <Toggle
                                checked={config.isMultiFloor}
                                onChange={(val) => setConfig({ ...config, isMultiFloor: val })}
                                label={!canUseProFeatures ? "複数フロア (Pro限定)" : "複数フロアを使用"}
                                icon={LayersIcon}
                                description="メインフロア以外のステージを追加します"
                                disabled={!canUseProFeatures} // Admin/Proなら disabled=false なのでON/OFF可能
                            />
                        </div>
                    </div>

                    {/* アラートエリア (Admin/Pro以外に表示) */}
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
                                        {/* ★変更: 文言を「Coming Soon」に */}
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

const handleDateChange = (e) => {
    let val = e.target.value;
    if (!val) {
        setConfig({ ...config, startDate: val });
        return;
    }

    // 年が4桁を超えているかチェック (yyyy-mm-dd)
    const parts = val.split('-');
    if (parts[0] && parts[0].length > 4) {
        // 4桁に切り詰め
        parts[0] = parts[0].substring(0, 4);
        val = parts.join('-');
    }

    // 念のため max="9999-12-31" を超えていないかチェック
    if (val > '9999-12-31') {
        val = '9999-12-31';
    }

    setConfig({ ...config, startDate: val });
};