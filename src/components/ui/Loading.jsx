// [src/components/ui/Loading.jsx]
import React from 'react';

export const LoadingScreen = ({ text = "読み込み中..." }) => (
    <div className="flex flex-col items-center justify-center h-screen bg-surface-background">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spinner mb-4"></div>
        <p className="text-lg text-on-surface-variant font-bold tracking-wider animate-pulse">{text}</p>
    </div>
);