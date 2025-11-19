// [src/components/PerformanceMonitor.jsx]
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { XIcon, ResetIcon, TrashIcon } from './common';

export const PerformanceMonitor = ({ onClose }) => {
    const [metrics, setMetrics] = useState({
        fps: 0,
        memory: { used: 0, total: 0, limit: 0 },
        resources: []
    });
    const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'network'

    const frameCount = useRef(0);
    const lastTime = useRef(performance.now());
    const rafId = useRef(null);

    // FPS & Memory Loop
    useEffect(() => {
        const measure = () => {
            const now = performance.now();
            frameCount.current++;

            if (now - lastTime.current >= 1000) {
                const fps = Math.round((frameCount.current * 1000) / (now - lastTime.current));

                // メモリ計測 (Chrome系のみ対応)
                let memory = { used: 0, total: 0, limit: 0 };
                if (performance.memory) {
                    memory = {
                        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
                    };
                }

                setMetrics(prev => ({ ...prev, fps, memory }));

                frameCount.current = 0;
                lastTime.current = now;
            }
            rafId.current = requestAnimationFrame(measure);
        };
        rafId.current = requestAnimationFrame(measure);

        return () => cancelAnimationFrame(rafId.current);
    }, []);

    // Network Observer
    useEffect(() => {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries().map(entry => ({
                name: entry.name,
                type: entry.initiatorType,
                size: entry.transferSize || entry.encodedBodySize || 0, // 0の場合はキャッシュ等の可能性
                duration: entry.duration
            }));

            setMetrics(prev => ({
                ...prev,
                resources: [...prev.resources, ...entries]
            }));
        });

        observer.observe({ entryTypes: ['resource'] });
        return () => observer.disconnect();
    }, []);

    // データ集計
    const networkStats = useMemo(() => {
        const totalSize = metrics.resources.reduce((sum, r) => sum + r.size, 0);
        const totalCount = metrics.resources.length;
        const avgSize = totalCount > 0 ? totalSize / totalCount : 0;

        // 重いリソースランキング (Top 5)
        const ranking = [...metrics.resources]
            .sort((a, b) => b.size - a.size)
            .slice(0, 5);

        return { totalSize, totalCount, avgSize, ranking };
    }, [metrics.resources]);

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getStatusColor = (val, warn, danger) => {
        if (val >= danger) return 'text-red-500';
        if (val >= warn) return 'text-amber-500';
        return 'text-green-500';
    };

    const clearNetworkLogs = () => {
        setMetrics(prev => ({ ...prev, resources: [] }));
        performance.clearResourceTimings();
    };

    return (
        <div className="fixed top-4 left-4 z-[10000] w-80 bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl text-gray-100 font-mono text-xs overflow-hidden animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-gray-800/50 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(metrics.fps, 30, 15)} animate-pulse`} />
                    <span className="font-bold text-sm">System Monitor</span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
                    <XIcon className="w-4 h-4" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700">
                <button
                    onClick={() => setActiveTab('summary')}
                    className={`flex-1 py-2 text-center transition-colors ${activeTab === 'summary' ? 'bg-gray-800 text-brand-primary font-bold' : 'hover:bg-gray-800/50 text-gray-400'}`}
                >
                    Summary
                </button>
                <button
                    onClick={() => setActiveTab('network')}
                    className={`flex-1 py-2 text-center transition-colors ${activeTab === 'network' ? 'bg-gray-800 text-brand-primary font-bold' : 'hover:bg-gray-800/50 text-gray-400'}`}
                >
                    Network
                </button>
            </div>

            {/* Content */}
            <div className="p-3 max-h-[400px] overflow-y-auto custom-scrollbar">

                {activeTab === 'summary' && (
                    <div className="space-y-4">
                        {/* FPS & Memory */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
                                <p className="text-gray-400 mb-1">FPS</p>
                                <p className={`text-xl font-bold ${metrics.fps < 30 ? 'text-red-400' : 'text-green-400'}`}>
                                    {metrics.fps}
                                </p>
                            </div>
                            <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
                                <p className="text-gray-400 mb-1">JS Heap</p>
                                <p className="text-xl font-bold text-blue-400">
                                    {metrics.memory.used}<span className="text-xs text-gray-500 ml-1">MB</span>
                                </p>
                                <div className="w-full bg-gray-700 h-1 mt-1 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-500"
                                        style={{ width: `${(metrics.memory.used / metrics.memory.limit) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Network Summary */}
                        <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-gray-400">Network Transfer</p>
                                <button onClick={clearNetworkLogs} className="text-gray-500 hover:text-red-400"><TrashIcon className="w-3 h-3" /></button>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-xl font-bold text-purple-400">{formatBytes(networkStats.totalSize)}</span>
                                <span className="text-gray-500">{networkStats.totalCount} reqs</span>
                            </div>
                        </div>

                        {/* Heavy Assets Ranking */}
                        <div>
                            <p className="text-gray-400 mb-2 font-bold border-b border-gray-700 pb-1">Heaviest Assets (Top 5)</p>
                            <div className="space-y-1">
                                {networkStats.ranking.length > 0 ? networkStats.ranking.map((r, i) => (
                                    <div key={i} className="flex justify-between items-center text-[10px] group">
                                        <div className="truncate flex-1 pr-2 text-gray-300" title={r.name}>
                                            {r.name.split('/').pop() || r.name.substring(0, 20)}
                                        </div>
                                        <div className="text-yellow-500 font-mono shrink-0">{formatBytes(r.size)}</div>
                                    </div>
                                )) : (
                                    <p className="text-gray-600 italic text-center py-2">No traffic yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'network' && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-gray-400 font-bold">Recent Requests</p>
                            <button onClick={clearNetworkLogs} className="text-xs bg-gray-800 hover:bg-red-900/30 text-gray-400 hover:text-red-400 px-2 py-1 rounded border border-gray-700 transition-colors">Clear</button>
                        </div>
                        {metrics.resources.slice().reverse().slice(0, 20).map((r, i) => (
                            <div key={i} className="bg-gray-800/30 p-2 rounded border border-gray-700/50 flex flex-col gap-1">
                                <div className="flex justify-between items-start">
                                    <span className={`text-[10px] font-bold px-1 rounded ${r.type === 'img' ? 'bg-green-900/50 text-green-400' : r.type === 'fetch' ? 'bg-blue-900/50 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>
                                        {r.type}
                                    </span>
                                    <span className="text-yellow-500 font-mono">{formatBytes(r.size)}</span>
                                </div>
                                <div className="truncate text-gray-300" title={r.name}>
                                    {r.name}
                                </div>
                                <div className="text-right text-gray-600 text-[10px]">
                                    {Math.round(r.duration)}ms
                                </div>
                            </div>
                        ))}
                        {metrics.resources.length === 0 && (
                            <p className="text-gray-600 italic text-center py-4">No requests recorded</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};