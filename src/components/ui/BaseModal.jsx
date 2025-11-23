// [src/components/ui/BaseModal.jsx]
import React from 'react';
import { XIcon } from '../common'; // Iconはcommonから

/**
 * 共通モーダルコンポーネント (Tactile Design v3.1)
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
    contentRef
}) => {
    if (!isOpen) return null;

    const containerClasses = isScrollable
        ? "flex flex-col max-h-[90vh]"
        : "flex flex-col";

    const paddingClass = noPadding ? "p-0" : "p-6";

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            {/* Backdrop with blur */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Modal Panel */}
            <div
                className={`
                    relative z-10 w-full ${maxWidthClass} 
                    bg-surface-container rounded-2xl shadow-2xl 
                    ${paddingClass} ${containerClasses} 
                    animate-modal-in overflow-hidden
                `}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                {(title || hasCloseButton) && (
                    <header className={`flex justify-between items-center ${title ? 'mb-6' : 'mb-0'} flex-shrink-0 relative z-20 ${noPadding ? 'p-6 pb-0' : ''}`}>
                        {title && <h2 className="text-xl font-bold text-on-surface tracking-wide">{title}</h2>}

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

                {/* Content */}
                <div
                    ref={contentRef}
                    className={`
                        relative z-10
                        ${isScrollable && !noPadding ? "flex-grow overflow-y-auto -mx-6 px-6 custom-scrollbar" : "w-full"}
                        ${isScrollable && noPadding ? "flex-grow overflow-y-auto custom-scrollbar" : ""}
                    `}
                >
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className={`mt-6 pt-6 border-t border-on-surface/10 flex-shrink-0 ${noPadding ? 'mx-6 mb-6' : ''}`}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};