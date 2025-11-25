// [src/components/LoginPage.jsx]
import React from 'react';
import { GoogleIcon, UserIcon, InfoIcon, Button } from './common';

export const LoginPage = ({ onLoginClick, onGuestClick, isLoggingIn }) => {
    return (
        <div className="min-h-screen bg-surface-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* 背景装飾 (Ambient Light) */}
            <div className="absolute top-[-20%] left-[-20%] w-[70vw] h-[70vw] bg-brand-primary/5 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute bottom-[-20%] right-[-20%] w-[70vw] h-[70vw] bg-brand-secondary/5 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '7s' }} />

            <div className="w-full max-w-md flex flex-col items-center animate-fade-in-up z-10 relative">
                {/* ロゴ・タイトルエリア */}
                <header className="mb-10 text-center select-none">
                    <div className="inline-block relative mb-4">
                        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-on-surface to-on-surface-variant tracking-tighter drop-shadow-sm leading-none">
                            GIG DECK
                        </h1>
                    </div>
                </header>

                {/* アクションカード */}
                <main className="w-full px-4">
                    <div className="bg-surface-container/60 backdrop-blur-xl border border-on-surface/10 rounded-3xl p-6 md:p-8 shadow-2xl ring-1 ring-white/5 space-y-6">

                        <div className="space-y-3">
                            <p className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wider text-center">
                                Start with Account
                            </p>
                            <Button
                                onClick={onLoginClick}
                                disabled={isLoggingIn}
                                variant="secondary"
                                size="lg"
                                className="w-full justify-center bg-white dark:bg-zinc-800 text-on-surface border-transparent shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                icon={GoogleIcon}
                            >
                                Googleでログイン
                            </Button>
                        </div>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-on-surface/10"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-3 bg-surface-container text-on-surface-variant/40 font-bold tracking-widest">OR</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Button
                                onClick={onGuestClick}
                                disabled={isLoggingIn}
                                variant="ghost"
                                size="lg"
                                className="w-full justify-center border-2 border-dashed border-on-surface/10 hover:border-brand-primary/30 hover:bg-brand-primary/5 text-on-surface-variant"
                                icon={UserIcon}
                            >
                                ゲストとして利用
                            </Button>
                        </div>
                    </div>
                </main>

                {/* フッター注釈: 幅を合わせるために max-w-sm を削除し px-4 に変更 */}
                <footer className="mt-8 w-full px-4">
                    <div className="flex flex-col gap-2 text-left bg-surface-container/40 p-4 rounded-2xl border border-on-surface/5">
                        <div className="flex items-center gap-2 text-brand-primary">
                            <InfoIcon className="w-4 h-4 shrink-0" />
                            <span className="text-xs font-bold">推奨: Googleログイン</span>
                        </div>
                        <p className="text-[10px] text-on-surface-variant leading-relaxed pl-6">
                            画像のアップロードやデータの無期限保存が可能になります。<br />
                            <span className="opacity-70">※ゲスト利用のデータは36時間後に削除されます。</span>
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
};