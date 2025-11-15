// --- 設定値 ---
const MAX_DIMENSION = 1024; // 画像の最大幅/高さ (これにリサイズするっす)
const MAX_SIZE_BYTES = 100 * 1024; // 64KB (これ以下を目指すっす)
const MIN_QUALITY = 0.5; // WebPの最低品質 (これ以上は下げない)
const INITIAL_QUALITY = 0.9; // 最初のWebP品質

/**
 * 画像ファイルを読み込み、Imageオブジェクトとして返すっす
 * @param {File} file - 元のファイル
 * @returns {Promise<HTMLImageElement>}
 */
const loadImage = (file) => {
    return new Promise((resolve, reject) => {
        // File オブジェクトを DataURL (base64) に変換
        const reader = new FileReader();
        reader.onload = (event) => {
            // DataURL を <img /> 要素に食わせる
            const img = new Image();
            img.onload = () => resolve(img); // 画像の読み込み完了
            img.onerror = (err) => reject(new Error("画像の読み込みに失敗しました。"));
            img.src = event.target.result;
        };
        reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました。"));
        reader.readAsDataURL(file);
    });
};

/**
 * 画像を指定された最大サイズにリサイズし、canvasに描画するっす
 * @param {HTMLImageElement} img - 読み込んだ画像
 * @returns {HTMLCanvasElement}
 */
const resizeImageToCanvas = (img) => {
    let width = img.width;
    let height = img.height;

    // 最大サイズ (MAX_DIMENSION) を超えないようにアスペクト比を保ってリサイズ
    if (width > height) {
        if (width > MAX_DIMENSION) {
            height = Math.round((height *= MAX_DIMENSION / width));
            width = MAX_DIMENSION;
        }
    } else {
        if (height > MAX_DIMENSION) {
            width = Math.round((width *= MAX_DIMENSION / height));
            height = MAX_DIMENSION;
        }
    }

    // 目に見えない canvas をメモリ上に作成
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    // canvas にリサイズした画像を描画
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    return canvas;
};

/**
 * CanvasからWebPのBlobを非同期で生成するっす (再帰呼び出しで品質調整)
 * @param {HTMLCanvasElement} canvas - 描画済み canvas
 * @param {number} quality - 現在のWebP品質 (0.1 - 1.0)
 * @returns {Promise<Blob>}
 */
const getWebpBlob = (canvas, quality) => {
    return new Promise((resolve) => {
        // canvas の内容を Blob に変換
        canvas.toBlob(
            (blob) => {
                console.log(`[ImageProcessor] WebP Quality: ${quality.toFixed(1)}, Size: ${Math.round(blob.size / 1024)} KB`);

                // 250KB以下になったらOK
                if (blob.size <= MAX_SIZE_BYTES) {
                    resolve(blob);
                }
                // 250KB超過だけど、もう最低品質 (MIN_QUALITY) なら諦めてそれを使う
                else if (quality <= MIN_QUALITY) {
                    console.warn(`[ImageProcessor] 最低品質 (${MIN_QUALITY}) でも ${Math.round(blob.size / 1024)} KB っす...`);
                    resolve(blob);
                }
                // 250KB超過で、まだ品質を下げる余地があるなら
                else {
                    // 0.1 品質を下げて、もう一回自分を呼び出す（再帰）
                    resolve(getWebpBlob(canvas, quality - 0.1));
                }
            },
            'image/webp', // ★ WebP 形式を指定 ★
            quality // 画質を指定
        );
    });
};


/**
 * メイン関数: 画像ファイルをリサイズ＆圧縮して 250KB 以下の WebP Blob に変換するっす
 * @param {File} file - ユーザーがアップロードした元の画像ファイル
 * @returns {Promise<Blob>} 変換後の画像 Blob データ
 */
export const processImageForUpload = async (file) => {
    try {
        // 1. 画像ファイルを読み込む
        const img = await loadImage(file);

        // 2. 2048px の枠内にリサイズして canvas に描画
        const canvas = resizeImageToCanvas(img);

        // 3. 250KB以下になるまで品質を調整しながら WebP Blob を生成
        const processedBlob = await getWebpBlob(canvas, INITIAL_QUALITY);

        return processedBlob;

    } catch (error) {
        console.error("画像処理中にエラー発生っす:", error);
        // エラーが起きても、rejectして呼び出し元 (useStorageUpload.js) に伝えるっす
        throw new Error(`画像処理に失敗しました: ${error.message}`);
    }
};