// [src/components/ui/BaseModal.jsx]
import React from 'react';

// 閉じるアイコン
const CloseIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

/**
 * 共通モーダルコンポーネント (v2)
 * * @param {boolean} isOpen - モーダルの表示状態
 * @param {function} onClose - 閉じる処理
 * @param {string} title - ヘッダータイトル
 * @param {ReactNode} children - メインコンテンツ
 * @param {ReactNode} footer - フッターコンテンツ（ボタン等）。スクロール領域の外に固定されます。
 * @param {string} maxWidthClass - コンテナの最大幅 (例: 'max-w-md')
 * @param {boolean} hasCloseButton - 閉じるボタンの表示有無
 * @param {boolean} isScrollable - コンテンツをスクロール可能にするか
 * @param {React.RefObject} contentRef - スクロールコンテナへのRef（D&D計算用など）
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
    noPadding = false, // ▼▼▼ 追加: パディングを無効化するオプション ▼▼▼
    contentRef
}) => {
    if (!isOpen) return null;

    const containerClasses = isScrollable
        ? "flex flex-col max-h-[90vh]"
        : "flex flex-col";

    // noPaddingがtrueなら p-0、そうでなければ p-6
    const paddingClass = noPadding ? "p-0" : "p-6";

    return (
        <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                // ▼▼▼ overflow-hidden を追加して、中身が角丸からはみ出ないようにする ▼▼▼
                className={`bg-surface-container rounded-2xl ${paddingClass} w-full ${maxWidthClass} shadow-2xl relative animate-modal-in ${containerClasses} overflow-hidden`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ヘッダー (noPadding時はマージン調整が必要だが、今回はDashboard側でヘッダーを使わないため簡易実装) */}
                {(title || hasCloseButton) && (
                    <header className={`flex justify-between items-center ${title ? 'mb-6' : 'mb-0'} flex-shrink-0 relative z-20 ${noPadding ? 'p-6 pb-0' : ''}`}>
                        {title && <h2 className="text-2xl font-bold text-on-surface">{title}</h2>}

                        {hasCloseButton && (
                            <button
                                onClick={onClose}
                                className={`p-2 rounded-full hover:bg-surface-background text-on-surface-variant hover:text-on-surface transition-colors ${!title ? 'ml-auto -mr-2' : '-mr-2'}`}
                            >
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        )}
                    </header>
                )}

                {/* コンテンツエリア */}
                <div
                    ref={contentRef}
                    className={`
                        relative z-10
                        ${isScrollable && !noPadding ? "flex-grow overflow-y-auto -mx-6 px-6 pt-0 pb-2 space-y-6 scrollbar-thin scrollbar-thumb-on-surface-variant/20" : "w-full"}
                        ${isScrollable && noPadding ? "flex-grow overflow-y-auto scrollbar-thin" : ""}
                    `}
                >
                    {children}
                </div>

                {/* フッターエリア (固定) */}
                {footer && (
                    <div className={`mt-6 pt-6 border-t border-on-surface/10 flex-shrink-0 ${noPadding ? 'mx-6 mb-6' : ''}`}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};