// [src/components/ImageEditModal.jsx]
import React, { useState, useEffect, useRef } from 'react';
import { useStorageUpload } from '../hooks/useStorageUpload';
import {
    SimpleImage,
    UserIcon,
    UploadIcon,
    BaseModal,
    Label,
    Input,
    Button
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
                        {imageUrl ? <SimpleImage src={imageUrl} className="w-full h-full object-cover" /> : <UserIcon className="w-20 h-20 text-on-surface-variant" />}
                    </div>
                </div>

                <div className="space-y-4 w-full">
                    {isUrlInputVisible && (
                        <div className="animate-fade-in-up">
                            <Input
                                label="Image URL"
                                type="text"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://example.com/image.png"
                            />
                        </div>
                    )}
                    <div>
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                        <Button
                            onClick={() => fileInputRef.current.click()}
                            disabled={isUploading}
                            variant="dashed"
                            className="w-full py-4 border-2"
                            icon={isUploading ? null : UploadIcon}
                        >
                            {isUploading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span>処理・アップロード中...</span>
                                </>
                            ) : (
                                <span>ローカルからアップロード</span>
                            )}
                        </Button>

                        {uploadError && <p className="text-red-400 text-sm mt-2 text-center">{uploadError}</p>}
                        {!uploadError && (
                            <p className="text-xs text-on-surface-variant/70 mt-2 text-center">
                                ※ CMYKカラーのJPEGをアップすると、色が変になる場合があるっす！<br />
                                その時は、RGBのJPEGかPNGで試してみてほしいっす！
                            </p>
                        )}
                    </div>
                    {!isUrlInputVisible && (
                        <div>
                            <Button
                                onClick={() => setIsUrlInputVisible(true)}
                                variant="ghost"
                                className="w-full"
                            >
                                URLで設定する
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </BaseModal>
    );
};