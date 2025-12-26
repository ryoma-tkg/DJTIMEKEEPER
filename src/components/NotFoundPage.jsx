// [src/components/NotFoundPage.jsx]
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, AlertTriangleIcon, LogInIcon, LayersIcon } from './common';

export const NotFoundPage = ({ user }) => {
    const navigate = useNavigate();
    const isLoggedIn = !!user;

    return (
        <div className="min-h-screen bg-surface-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* 背景装飾 (Loginページ等と共通の雰囲気) */}
            <div className="absolute top-[-20%] right-[-20%] w-[60vw] h-[60vw] bg-brand-primary/5 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[-20%] left-[-20%] w-[60vw] h-[60vw] bg-brand-secondary/5 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '10s' }} />

            <div className="w-full max-w-md animate-fade-in-up z-10 relative text-center">

                {/* 404 アイコンエリア */}
                <div className="mb-8 relative inline-block">
                    <div className="text-[8rem] font-black text-on-surface/5 leading-none select-none font-mono">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center mt-1">
                        <div className="w-20 h-20 rounded-3xl bg-surface-container shadow-2xl border border-on-surface/10 flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500">
                            <AlertTriangleIcon className="w-10 h-10 text-brand-primary" />
                        </div>
                    </div>
                </div>

                {/* メインコンテンツ */}
                <div className="bg-surface-container/60 backdrop-blur-xl border border-on-surface/10 rounded-3xl p-8 shadow-2xl ring-1 ring-white/5 space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-on-surface mb-2">Page Not Found</h1>
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                            お探しのページが見つかりませんでした。<br />
                            削除されたか、URLが間違っている可能性があります。
                        </p>
                    </div>

                    <div className="pt-2">
                        {isLoggedIn ? (
                            <Button
                                onClick={() => navigate('/')}
                                variant="primary"
                                size="lg"
                                className="w-full justify-center shadow-lg hover:shadow-xl"
                                icon={LayersIcon}
                            >
                                ダッシュボードに戻る
                            </Button>
                        ) : (
                            <Button
                                onClick={() => navigate('/login')}
                                variant="primary"
                                size="lg"
                                className="w-full justify-center shadow-lg hover:shadow-xl"
                                icon={LogInIcon}
                            >
                                ログイン画面に戻る
                            </Button>
                        )}
                    </div>
                </div>

                <p className="mt-8 text-[10px] text-on-surface-variant/40 font-mono tracking-wide">
                    GIG DECK SYSTEM
                </p>
            </div>
        </div>
    );
};