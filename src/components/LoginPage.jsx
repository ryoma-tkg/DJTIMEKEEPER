// [src/components/LoginPage.jsx]
import React from 'react';
import { GoogleIcon, UserIcon } from './common'; // UserIconを利用

// Googleログインボタン
const GoogleLoginButton = ({ onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`
            flex items-center justify-center gap-4 w-full max-w-sm px-6 py-4 
            bg-surface-container hover:bg-white/90 dark:hover:bg-zinc-700 
            text-on-surface font-bold rounded-full shadow-lg
            transition-all duration-200 
            transform hover:scale-105
            disabled:opacity-50 disabled:cursor-wait
        `}
    >
        <GoogleIcon className="w-6 h-6" />
        <span>Googleでログイン</span>
    </button>
);

// ゲストログインボタン
const GuestLoginButton = ({ onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`
            flex items-center justify-center gap-4 w-full max-w-sm px-6 py-4 
            bg-surface-background border-2 border-on-surface/10 hover:border-brand-primary/50 hover:bg-surface-container
            text-on-surface-variant hover:text-brand-primary font-bold rounded-full shadow-sm
            transition-all duration-200 
            active:scale-95
            disabled:opacity-50 disabled:cursor-wait
        `}
    >
        <UserIcon className="w-6 h-6" />
        <span>ゲストとして利用 (登録なし)</span>
    </button>
);

export const LoginPage = ({ onLoginClick, onGuestClick, isLoggingIn }) => {
    return (
        <div className="fixed inset-0 bg-surface-background flex flex-col items-center justify-center p-4 text-center animate-fade-in-up">
            <header className="mb-12">
                <h1 className="text-4xl sp:text-5xl font-bold text-brand-primary mb-2">
                    DJ Timekeeper Pro
                </h1>
                <p className="text-lg text-on-surface-variant">
                    リアルタイムDJタイムテーブル管理アプリ
                </p>
            </header>

            <main className="w-full flex flex-col items-center gap-4">
                <GoogleLoginButton onClick={onLoginClick} disabled={isLoggingIn} />

                <div className="relative w-full max-w-xs flex items-center py-2">
                    <div className="flex-grow border-t border-on-surface/10"></div>
                    <span className="flex-shrink-0 mx-4 text-xs text-on-surface-variant/50 font-bold">OR</span>
                    <div className="flex-grow border-t border-on-surface/10"></div>
                </div>

                <GuestLoginButton onClick={onGuestClick} disabled={isLoggingIn} />
            </main>

            <footer className="absolute bottom-8 text-on-surface-variant/50 text-xs max-w-md leading-relaxed">
                <p>
                    Googleログイン推奨: 画像アップロード・データ無期限保存が可能になります。<br />
                    ゲスト利用の場合、データは36時間後に削除されます。
                </p>
            </footer>
        </div>
    );
};