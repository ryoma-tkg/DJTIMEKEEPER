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
    SettingsIcon // Adminアイコン用
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

    // ★ 権限の厳格な分離 ★
    const isGuest = user?.isAnonymous;
    const isAdmin = userProfile?.role === 'admin'; // 管理者 (DevMenuあり)
    const isProUser = userProfile?.role === 'pro'; // Proユーザー (DevMenuなし)

    // 「Pro機能を使える人」 = Admin または Proユーザー
    const canUseProFeatures = isAdmin || isProUser;

    useEffect(() => {
        if (isOpen) {
            setConfig({
                title: '',
                startDate: getTodayDateString(),
                startTime: defaultPreferences?.defaultStartTime || '22:00',
                vjEnabled: isGuest ? false : (defaultPreferences?.defaultVjEnabled || false),
                isMultiFloor: defaultPreferences?.defaultMultiFloor || false
            });
            setHasAttemptedSubmit(false);
        }
    }, [isOpen, defaultPreferences, isGuest]);

    const isTitleError = !config.title || config.title.trim() === '';

    const handleSubmit = () => {
        setHasAttemptedSubmit(true);
        if (isTitleError) return;

        const finalConfig = {
            ...config,
            title: config.title.trim() || 'New Event',
            vjEnabled: isGuest ? false : config.vjEnabled,
            // Pro機能権限チェック
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
                    <div className="bg-surface-background/50 rounded-xl px-4 py-2 space-y-2 border border-on-surface/5">
                        {/* VJ機能 */}
                        <div className={isGuest ? "opacity-50 pointer-events-none grayscale" : ""}>
                            <Toggle
                                checked={config.vjEnabled}
                                onChange={(val) => setConfig({ ...config, vjEnabled: val })}
                                label={isGuest ? "VJタイムテーブル (登録限定)" : "VJタイムテーブル機能"}
                                icon={VideoIcon}
                                description={isGuest ? "ゲストは利用できません" : "VJのタイムテーブルも管理します"}
                                disabled={isGuest}
                            />
                        </div>

                        <div className="border-t border-on-surface/5"></div>

                        {/* マルチフロア: canUseProFeatures (Admin/Pro) のみ */}
                        <div className={!canUseProFeatures ? "opacity-50 pointer-events-none grayscale" : ""}>
                            <Toggle
                                checked={config.isMultiFloor}
                                onChange={(val) => setConfig({ ...config, isMultiFloor: val })}
                                label={!canUseProFeatures ? "複数フロア (Pro限定)" : "複数フロアを使用"}
                                icon={LayersIcon}
                                description={!canUseProFeatures ? "Proプランへのアップグレードが必要です" : "メインフロア以外のステージを追加します"}
                                disabled={!canUseProFeatures}
                            />
                        </div>
                    </div>

                    {/* プラン案内メッセージ */}
                    <div className="mt-4">
                        {isGuest ? (
                            <div className="p-3 bg-brand-primary/5 rounded-lg border border-brand-primary/10">
                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                    <span className="font-bold text-brand-primary flex items-center gap-1"><UserIcon className="w-3 h-3" /> ゲストモード:</span>
                                    データは<span className="font-bold">36時間後</span>に削除されます。<br />
                                    ログインすると制限が解除されます。
                                </p>
                            </div>
                        ) : !canUseProFeatures ? (
                            <div className="p-3 bg-surface-background rounded-lg border border-on-surface/10">
                                <p className="text-xs text-on-surface-variant leading-relaxed flex items-start gap-2">
                                    <SparklesIcon className="w-4 h-4 text-brand-primary shrink-0" />
                                    <span>
                                        <span className="font-bold text-on-surface">Proプラン機能:</span><br />
                                        複数フロア管理はPro限定です。
                                    </span>
                                </p>
                            </div>
                        ) : isAdmin ? (
                            <div className="p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                                <p className="text-xs text-zinc-300 leading-relaxed flex items-center gap-2">
                                    <SettingsIcon className="w-4 h-4 text-brand-primary" />
                                    <span>
                                        <span className="font-bold text-white">Administrator:</span> 全機能にアクセス可能です。
                                    </span>
                                </p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </BaseModal>
    );
};