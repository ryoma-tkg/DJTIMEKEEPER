// [src/components/SetupPage.jsx]
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth'; // ★追加: Auth情報の更新に必要
import { db, storage } from '../firebase';
import { useStorageUpload } from '../hooks/useStorageUpload';
import {
    Button,
    Input,
    Label,
    Toggle,
    CustomTimeInput,
    UserIcon,
    MoonIcon,
    SunIcon,
    VideoIcon,
    LayersIcon,
    UploadIcon,
    SimpleImage,
    LoadingScreen,
    SparklesIcon
} from './common';

export const SetupPage = ({ user, userProfile, theme, toggleTheme, onComplete }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);

    // フォームの状態
    const [formData, setFormData] = useState({
        displayName: user?.displayName || '',
        photoURL: user?.photoURL || '',
        defaultStartTime: '22:00',
        defaultVjEnabled: false,
        defaultMultiFloor: false,
    });

    // 画像アップロード関連
    const fileInputRef = useRef(null);
    const { isUploading, handleUpload, uploadedUrl } = useStorageUpload(storage);

    // Pro機能判定
    const SUPER_ADMIN_UID = "GLGPpy6IlyWbGw15OwBPzRdCPZI2";
    const isAdmin = user?.uid === SUPER_ADMIN_UID || userProfile?.role === 'admin';
    const isProUser = userProfile?.role === 'pro';
    const canUseProFeatures = isAdmin || isProUser;

    React.useEffect(() => {
        if (uploadedUrl) {
            setFormData(prev => ({ ...prev, photoURL: uploadedUrl }));
        }
    }, [uploadedUrl]);

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleFinish = async () => {
        setIsSaving(true);
        try {
            // ★追加: 1. Firebase Authのプロファイルを更新 (これでアプリ全体のuser情報が即座に変わります)
            if (user) {
                await updateProfile(user, {
                    displayName: formData.displayName,
                    photoURL: formData.photoURL
                }).catch(err => console.error("Auth Profile Update Failed:", err));
            }

            // 2. Firestore (データベース) の更新
            const userRef = doc(db, "users", user.uid);

            await updateDoc(userRef, {
                displayName: formData.displayName,
                photoURL: formData.photoURL,
                isSetupCompleted: true,
                updatedAt: serverTimestamp(),
                preferences: {
                    theme: theme,
                    defaultStartTime: formData.defaultStartTime,
                    defaultVjEnabled: formData.defaultVjEnabled,
                    // 権限がない場合は強制false
                    defaultMultiFloor: canUseProFeatures ? formData.defaultMultiFloor : false
                }
            });

            onComplete();
        } catch (error) {
            console.error("Setup Error:", error);
            alert("設定の保存に失敗しました。");
            setIsSaving(false);
        }
    };

    const StepIndicator = ({ current, total }) => (
        <div className="flex gap-2 mb-8 justify-center">
            {[...Array(total)].map((_, i) => (
                <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i + 1 === current ? 'w-8 bg-brand-primary' : 'w-2 bg-on-surface/10'}`}
                />
            ))}
        </div>
    );

    if (isSaving) return <LoadingScreen text="セットアップを完了中..." />;

    return (
        <div className="min-h-screen bg-surface-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-[60vw] h-[60vw] bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-20%] w-[60vw] h-[60vw] bg-brand-secondary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md animate-fade-in-up z-10">
                <header className="text-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-on-surface mb-2">Welcome to GIG DECK</h1>
                    <p className="text-on-surface-variant text-sm">快適に使うための初期設定を行いましょう</p>
                </header>

                <div className="bg-surface-container/60 backdrop-blur-xl border border-on-surface/10 rounded-3xl p-6 md:p-8 shadow-2xl ring-1 ring-white/5 relative">
                    <StepIndicator current={step} total={2} />

                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-24 h-24 rounded-full bg-surface-background border-2 border-dashed border-on-surface/20 flex items-center justify-center overflow-hidden hover:border-brand-primary transition-colors">
                                        {formData.photoURL ? (
                                            <SimpleImage src={formData.photoURL} className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon className="w-10 h-10 text-on-surface-variant/50" />
                                        )}
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 right-0 bg-brand-primary text-white p-1.5 rounded-full shadow-lg">
                                        <UploadIcon className="w-3 h-3" />
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])}
                                    />
                                </div>
                                <div className="w-full">
                                    <Input
                                        label="表示名 (DJ Name)"
                                        placeholder="あなたのDJ名を入力"
                                        value={formData.displayName}
                                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="pt-4">
                                <Button onClick={handleNext} className="w-full" disabled={!formData.displayName.trim()}>次へ</Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs font-bold text-on-surface-variant mb-2 ml-1">外観モード</div>
                                    <div className="bg-surface-background/50 rounded-xl px-4 py-2 border border-on-surface/5">
                                        <Toggle
                                            checked={theme === 'dark'}
                                            onChange={toggleTheme}
                                            label="ダークモード"
                                            icon={theme === 'dark' ? MoonIcon : SunIcon}
                                            description="暗い場所でも目に優しい配色です"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>イベント開始時間のデフォルト</Label>
                                    <CustomTimeInput
                                        value={formData.defaultStartTime}
                                        onChange={(val) => setFormData({ ...formData, defaultStartTime: val })}
                                    />
                                </div>

                                <div>
                                    <div className="text-xs font-bold text-on-surface-variant mb-2 ml-1">よく使う機能</div>
                                    <div className="bg-surface-background/50 rounded-xl px-4 py-2 space-y-2 border border-on-surface/5">
                                        <Toggle
                                            checked={formData.defaultVjEnabled}
                                            onChange={(val) => setFormData({ ...formData, defaultVjEnabled: val })}
                                            label="VJタイムテーブル"
                                            icon={VideoIcon}
                                        />
                                        <div className="border-t border-on-surface/5" />

                                        <div className={!canUseProFeatures ? "opacity-50 pointer-events-none grayscale relative" : ""}>
                                            <Toggle
                                                checked={formData.defaultMultiFloor}
                                                onChange={(val) => setFormData({ ...formData, defaultMultiFloor: val })}
                                                label="複数フロア機能 (Pro)"
                                                icon={LayersIcon}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {!canUseProFeatures && (
                                    <div className="mt-2 relative overflow-hidden rounded-lg bg-brand-primary/5 border border-brand-primary/20 p-3">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary" />
                                        <div className="flex items-start gap-3">
                                            <SparklesIcon className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-brand-primary mb-0.5">Proプラン機能</p>
                                                <p className="text-[10px] text-on-surface-variant leading-relaxed">
                                                    複数フロア機能を使うにはProプランへのアップグレードが必要です。
                                                    今作ってる最中の機能なので、もう少し待ってね！
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button onClick={handleBack} variant="ghost" className="flex-1">戻る</Button>
                                <Button onClick={handleFinish} variant="primary" className="flex-[2]">始める！</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};