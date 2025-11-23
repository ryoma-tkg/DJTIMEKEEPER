// [src/components/ImageEditModal.jsx]
import React, { useState, useEffect, useRef } from 'react';
import { useStorageUpload } from '../hooks/useStorageUpload';
import {
    SimpleImage,
    UserIcon,
    UploadIcon,
    BaseModal,
    Button
} from './common';

export const ImageEditModal = ({ dj, onUpdate, onClose, storage }) => {
    // URL入力モード管理やエラー管理のStateを全削除
    const [imageUrl, setImageUrl] = useState(dj.imageUrl || '');
    const fileInputRef = useRef(null);

    const { isUploading, uploadError, uploadedUrl, handleUpload } = useStorageUpload(storage);

    // アップロード完了時にURLを反映
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

    // バリデーション不要（アップロードされたURLは信頼できるため）
    const handleSave = () => {
        onUpdate('imageUrl', imageUrl);
        onClose();
    };

    const footerContent = (
        <div className="flex justify-end gap-3">
            <Button onClick={onClose} variant="ghost">キャンセル</Button>
            <Button onClick={handleSave} disabled={isUploading} variant="primary">
                保存
            </Button>
        </div>
    );

    return (
        <BaseModal
            isOpen={true}
            onClose={onClose}
            title="アイコンを設定"
            footer={footerContent}
            maxWidthClass="max-w-md"
        >
            <div className="flex flex-col items-center">
                {/* プレビューエリア */}
                <div className="flex items-center justify-center my-2 mb-6">
                    <div className="w-40 h-40 rounded-full bg-surface-background flex items-center justify-center overflow-hidden border-4 border-surface-background shadow-inner">
                        {imageUrl ? (
                            <SimpleImage src={imageUrl} className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-20 h-20 text-on-surface-variant" />
                        )}
                    </div>
                </div>

                <div className="space-y-4 w-full">
                    {/* URL入力欄や切り替えボタンを削除し、アップロードボタンのみ配置 */}
                    <div>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <Button
                            onClick={() => fileInputRef.current.click()}
                            disabled={isUploading}
                            variant="dashed" // デザインカタログに合わせたスタイル
                            className="w-full py-4 border-2"
                            icon={isUploading ? null : UploadIcon}
                        >
                            {isUploading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span>処理・アップロード中...</span>
                                </>
                            ) : (
                                <span>画像をアップロード</span>
                            )}
                        </Button>

                        {uploadError && (
                            <p className="text-red-400 text-sm mt-2 text-center">{uploadError}</p>
                        )}

                        {!uploadError && (
                            <p className="text-xs text-on-surface-variant/70 mt-2 text-center">
                                ※ 10MB以下の画像 (JPG, PNG, WebP) に対応っす。<br />
                                自動で軽量化されるので安心っす！
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </BaseModal>
    );
};