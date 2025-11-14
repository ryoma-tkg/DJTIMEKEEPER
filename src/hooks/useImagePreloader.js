import { useState, useEffect } from 'react';

export const useImagePreloader = (urls) => {
    const [loadedUrls, setLoadedUrls] = useState(new Set());
    // 
    const urlsKey = JSON.stringify(urls);

    useEffect(() => {
        let isCancelled = false;
        // 
        const filteredUrls = JSON.parse(urlsKey);

        // 
        // 
        setLoadedUrls(prevSet => {
            const newSet = new Set();
            let changed = false;

            prevSet.forEach(url => {
                if (filteredUrls.includes(url)) {
                    newSet.add(url);
                } else {
                    changed = true; // 
                }
            });

            // 
            if (!changed && prevSet.size === filteredUrls.length) {
                return prevSet; // 
            }
            return newSet;
        });

        // 
        const loadImages = async () => {
            try {
                await Promise.all(
                    filteredUrls.map(url => {
                        // 
                        if (!url) {
                            return Promise.resolve();
                        }

                        return new Promise((resolve) => {
                            const img = new Image();
                            img.src = url;
                            img.onload = () => {
                                if (!isCancelled) {
                                    // 
                                    // 
                                    setLoadedUrls(prevSet => {
                                        // 
                                        if (prevSet.has(url)) return prevSet;

                                        // 
                                        const updatedSet = new Set(prevSet);
                                        updatedSet.add(url);
                                        return updatedSet;
                                    });
                                }
                                resolve();
                            };
                            img.onerror = () => {
                                // 
                                console.warn(`[useImagePreloader] Failed to load image: ${url}`);
                                resolve();
                            };
                        });
                    })
                );
            } catch (error) {
                if (!isCancelled) console.error("Failed to preload images", error);
            }
        };

        loadImages(); // 

        return () => { isCancelled = true; };
    }, [urlsKey]); // 

    const allLoaded = urls.filter(Boolean).every(url => loadedUrls.has(url));
    return { loadedUrls, allLoaded };
};