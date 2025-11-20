import React, { useState, useEffect, useRef } from 'react';
import { useStorageUpload } from '../hooks/useStorageUpload';
// ▼▼▼ 【修正】 すべて ./common から一括インポート（重複を防ぐ） ▼▼▼
import {
    SimpleImage,
    UserIcon,
    UploadIcon,
    BaseModal, // commonからインポート
    Label,     // commonからインポート
    Input      // commonからインポート
} from './common';

export const ImageEditModal = ({ dj, onUpdate, onClose, storage }) => {
    const [imageUrl, setImageUrl] = useState(dj.imageUrl || '');
    const fileInputRef = useRef(null);
    const [isUrlInputVisible, setIsUrlInputVisible] = useState(false);

    const { isUploading, uploadError, uploadedUrl, handleUpload } = useStorageUpload(storage);

    useEffect(() => {
        if (uploadedUrl) {
            setImageUrl(uploadedUrl);
        }
    }, [uploadedUrl]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            handleUpload(file);
        }
    };

    const handleSave = () => {
        onUpdate('imageUrl', imageUrl);
        onClose();
    };

    // フッターコンテンツ (保存・キャンセル)
    const footerContent = (
        <div className="flex justify-end gap-3">
            <button onClick={onClose} className="py-2 px-5 rounded-full bg-surface-background text-on-surface font-semibold hover:bg-on-surface/5 transition-colors">キャンセル</button>
            <button onClick={handleSave} disabled={isUploading} className="py-2 px-5 rounded-full bg-brand-primary text-white font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg">保存</button>
        </div>
    );

    return (
        <BaseModal
            isOpen={true} // 親で制御されているため常にtrue
            onClose={onClose}
            title="アイコンを設定"
            footer={footerContent}
            maxWidthClass="max-w-md"
        >
            <div className="flex flex-col items-center">
                {/* プレビューエリア */}
                <div className="flex items-center justify-center my-2 mb-6">
                    <div className="w-40 h-40 rounded-full bg-surface-background flex items-center justify-center overflow-hidden border-4 border-surface-background shadow-inner">
                        {imageUrl ? <SimpleImage src={imageUrl} className="w-full h-full object-cover" /> : <UserIcon className="w-20 h-20 text-on-surface-variant" />}
                    </div>
                </div>

                <div className="space-y-4 w-full">
                    {isUrlInputVisible && (
                        <div className="animate-fade-in-up">
                            {/* ▼▼▼ 修正: Label と Input を使用 ▼▼▼ */}
                            <Label>Image URL</Label>
                            {/* ▼▼▼ 必要であれば error プロップを利用 (今回は必須ではないのでnullでもOK) ▼▼▼ */}
                            <Input
                                type="text"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://example.com/image.png"
                            // error={imageUrl === '' ? "入力してください" : null} // 必要なら
                            />
                        </div>
                    )}
                    <div>
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                        <button onClick={() => fileInputRef.current.click()} disabled={isUploading} className="w-full flex items-center justify-center gap-2 bg-surface-background hover:opacity-80 text-on-surface font-semibold py-3 px-4 rounded-lg transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-dashed border-on-surface/10 hover:border-brand-primary/50">
                            {isUploading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span>処理・アップロード中...</span>
                                </>
                            ) : (
                                <>
                                    <UploadIcon className="w-5 h-5" />
                                    <span>ローカルからアップロード</span>
                                </>
                            )}
                        </button>
                        {uploadError && <p className="text-red-400 text-sm mt-2 text-center">{uploadError}</p>}
                        {!uploadError && (
                            <p className="text-xs text-on-surface-variant/70 mt-2 text-center">
                                ※ CMYKカラーのJPEGをアップすると、色が変になる場合があるっす！
                                <br />
                                その時は、RGBのJPEGかPNGで試してみてほしいっす！
                            </p>
                        )}
                    </div>
                    {!isUrlInputVisible && (
                        <div>
                            <button
                                onClick={() => setIsUrlInputVisible(true)}
                                className="w-full flex items-center justify-center gap-2 bg-surface-background/50 hover:bg-surface-background/80 text-on-surface-variant font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                            >
                                <span>URLで設定する</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </BaseModal>
    );
};