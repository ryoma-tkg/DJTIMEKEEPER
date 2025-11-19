// [src/hooks/useStorageUpload.js]
import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { processImageForUpload } from '../utils/imageProcessor';

export const useStorageUpload = (storage) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [uploadedUrl, setUploadedUrl] = useState(null);

    const handleUpload = async (file) => {
        if (!file || !storage) return;

        setIsUploading(true);
        setUploadError(null);
        setUploadedUrl(null);

        let processedFileBlob;
        try {
            // 1. 画像の圧縮・WebP変換処理
            processedFileBlob = await processImageForUpload(file);
        } catch (processError) {
            console.error("Image processing failed:", processError);
            setUploadError(processError.message || "画像の処理に失敗しました。");
            setIsUploading(false);
            return;
        }

        try {
            // 2. ファイルパスの生成
            const originalName = file.name.replace(/\.[^/.]+$/, "");
            const filePath = `dj_icons/${Date.now()}_${originalName}.webp`;
            const storageRef = ref(storage, filePath);

            // ▼▼▼ 【修正】 メタデータを設定してキャッシュを有効化 ▼▼▼
            const metadata = {
                cacheControl: 'public, max-age=31536000', // 1年間キャッシュする
                contentType: 'image/webp', // 明示的にWebPを指定
            };

            // 3. アップロード実行 (metadataを追加)
            const snapshot = await uploadBytes(storageRef, processedFileBlob, metadata);

            // 4. URL取得
            const downloadURL = await getDownloadURL(snapshot.ref);
            setUploadedUrl(downloadURL);

        } catch (error) {
            console.error("Image upload failed:", error);
            setUploadError("アップロードに失敗しました。");
        } finally {
            setIsUploading(false);
        }
    };

    return {
        isUploading,
        uploadError,
        uploadedUrl,
        handleUpload,
    };
};