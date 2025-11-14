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
            // 1. 
            processedFileBlob = await processImageForUpload(file);
        } catch (processError) {
            console.error("Image processing failed:", processError);
            setUploadError(processError.message || "画像の処理に失敗しました。");
            setIsUploading(false);
            return;
        }

        try {
            // 2. 
            const originalName = file.name.replace(/\.[^/.]+$/, "");
            const filePath = `dj_icons/${Date.now()}_${originalName}.jpg`;
            const storageRef = ref(storage, filePath);

            // 3. 
            const snapshot = await uploadBytes(storageRef, processedFileBlob);

            // 4. 
            const downloadURL = await getDownloadURL(snapshot.ref);
            setUploadedUrl(downloadURL); // 

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
        handleUpload, // 
    };
};