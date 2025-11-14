import React, { useState, useEffect, useRef } from 'react';
import { useStorageUpload } from '../hooks/useStorageUpload';
import { SimpleImage, UserIcon, UploadIcon, XIcon } from './common';

export const ImageEditModal = ({ dj, onUpdate, onClose, storage }) => {
    const [imageUrl, setImageUrl] = useState(dj.imageUrl || '');
    const fileInputRef = useRef(null);
    const [isUrlInputVisible, setIsUrlInputVisible] = useState(false);

    // 
    const { isUploading, uploadError, uploadedUrl, handleUpload } = useStorageUpload(storage);

    // 
    useEffect(() => {
        if (uploadedUrl) {
            setImageUrl(uploadedUrl); // 
        }
    }, [uploadedUrl]);

    // 
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            handleUpload(file); // 
        }
    };

    const handleSave = () => {
        onUpdate('imageUrl', imageUrl);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in-up" onClick={onClose}>
            <div className="bg-surface-container rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">アイコンを設定</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-background"><XIcon className="w-6 h-6" /></button>
                </div>
                <div className="flex items-center justify-center my-6">
                    <div className="w-40 h-40 rounded-full bg-surface-background flex items-center justify-center overflow-hidden">
                        {imageUrl ? <SimpleImage src={imageUrl} className="w-full h-full object-cover" /> : <UserIcon className="w-20 h-20 text-on-surface-variant" />}
                    </div>
                </div>

                <div className="space-y-4">
                    {isUrlInputVisible && (
                        <div className="animate-fade-in-up">
                            <label className="text-sm text-on-surface-variant mb-1 block">Image URL</label>
                            <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="bg-surface-background text-on-surface p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="https://example.com/image.png" />
                        </div>
                    )}
                    <div>
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                        <button onClick={() => fileInputRef.current.click()} disabled={isUploading} className="w-full flex items-center justify-center gap-2 bg-surface-background hover:opacity-80 text-on-surface font-semibold py-3 px-4 rounded-lg transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
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

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="py-2 px-5 rounded-full bg-surface-background text-on-surface font-semibold">キャンセル</button>
                    <button onClick={handleSave} disabled={isUploading} className="py-2 px-5 rounded-full bg-brand-primary text-white font-semibold disabled:opacity-50">保存</button>
                </div>
            </div>
        </div>
    );
};