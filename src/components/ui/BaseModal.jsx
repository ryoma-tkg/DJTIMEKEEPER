// [src/components/ui/BaseModal.jsx]
import React from 'react';
import { XIcon } from '../common'; // Iconはcommonから

/**
 * 共通モーダルコンポーネント (Tactile Design v3.1)
 * SP: Bottom Sheet or Full Screen
 * PC: Centered Modal
 */
export const BaseModal = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    maxWidthClass = 'max-w-md',
    hasCloseButton = true,
    isScrollable = false,
    noPadding = false,
    contentRef,
    isMobileFullScreen = false
}) => {
    if (!isOpen) return null;

    // SPでは画面いっぱい使いすぎないように max-h-[85vh] などを設定
    // isMobileFullScreen の場合は h-full
    const mobileHeightClass = isMobileFullScreen ? "h-full max-h-none" : "max-h-[85vh]";

    const containerClasses = isScrollable
        ? `flex flex-col ${mobileHeightClass} md:max-h-[90vh]`
        : "flex flex-col"; // Scrollableでない場合も flex-col は維持

    const paddingClass = noPadding ? "p-0" : "p-5 md:p-6";

    // SPでの形状
    const mobileShapeClass = isMobileFullScreen
        ? "rounded-none w-full h-full"
        : "rounded-t-2xl rounded-b-none w-full";

    return (
        <div
            className={`
                fixed inset-0 z-[9999] flex 
                ${isMobileFullScreen ? 'items-end' : 'items-end'} md:items-center 
                justify-center 
                ${isMobileFullScreen ? 'p-0' : 'p-0'} md:p-4 
                animate-fade-in
            `}
            onClick={onClose}
        >
            {/* Backdrop with blur */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Modal Panel */}
            <div
                className={`
                    relative z-10 
                    bg-surface-container shadow-2xl 
                    
                    ${/* SP/PC 形状切り替え */ ''}
                    ${mobileShapeClass} md:rounded-2xl 
                    
                    ${/* デフォルトは h-auto だが、maxWidthClass で上書き可能にするため削除 or 後ろに配置しない */ ''}
                    md:w-full
                    
                    ${paddingClass} ${containerClasses} 
                    
                    animate-slide-up md:animate-modal-in
                    
                    overflow-hidden
                    
                    ${/* ▼▼▼ 重要: maxWidthClass を最後に配置し、サイズ指定を優先させる ▼▼▼ */ ''}
                    ${maxWidthClass}
                `}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                {(title || hasCloseButton) && (
                    <header className={`flex justify-between items-center ${title ? 'mb-4 md:mb-6' : 'mb-0'} flex-shrink-0 relative z-20 ${noPadding ? 'p-5 md:p-6 pb-0' : ''}`}>
                        {title && <h2 className="text-lg md:text-xl font-bold text-on-surface tracking-wide">{title}</h2>}

                        {hasCloseButton && (
                            <button
                                onClick={onClose}
                                className={`
                                    p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-background 
                                    transition-colors duration-200 active:scale-95
                                    ${!title ? 'ml-auto -mr-2' : '-mr-2'}
                                `}
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        )}
                    </header>
                )}

                {/* Content Wrapper */}
                <div
                    ref={contentRef}
                    /* ▼▼▼ 重要: ここに h-full / flex-1 がないと、中身が親の高さを埋め尽くせない ▼▼▼ */
                    className={`
                        relative z-10
                        ${isScrollable && !noPadding ? "flex-grow overflow-y-auto -mx-5 px-5 md:-mx-6 md:px-6 custom-scrollbar" : ""}
                        ${isScrollable && noPadding ? "flex-grow overflow-y-auto custom-scrollbar" : ""}
                        ${!isScrollable ? "h-full flex flex-col" : ""} 
                    `}
                >
                    {/* !isScrollable の時、flex-col + h-full にして children に高さを渡す */}
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className={`mt-4 md:mt-6 pt-4 md:pt-6 border-t border-on-surface/10 flex-shrink-0 ${noPadding ? 'mx-5 mb-5 md:mx-6 md:mb-6' : ''}`}>
                        {footer}
                    </div>
                )}

                {!isMobileFullScreen && <div className="h-safe-area-bottom md:hidden"></div>}
            </div>
        </div>
    );
};