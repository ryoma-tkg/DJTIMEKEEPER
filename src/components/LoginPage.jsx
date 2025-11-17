// [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-phase3-dev/src/components/LoginPage.jsx]
import React from 'react';
import { GoogleIcon } from './common';

// GoogleログインボタンのUI
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

// ログインページ全体のレイアウト
export const LoginPage = ({ onLoginClick, isLoggingIn }) => {
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

            <main className="w-full flex flex-col items-center gap-6">
                <GoogleLoginButton onClick={onLoginClick} disabled={isLoggingIn} />
            </main>

            <footer className="absolute bottom-8 text-on-surface-variant/50 text-sm">
                <p>
                    ログインすることで、タイムテーブルの作成・編集が可能になります。
                </p>
            </footer>
        </div>
    );
};