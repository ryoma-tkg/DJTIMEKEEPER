// [src/components/PerformanceMonitor.jsx]
import React, { useState, useEffect, useMemo, useRef } from 'react';
// DownloadIcon がなければ UploadIcon(rotate) で代用するロジックを入れています
import { XIcon, ResetIcon, TrashIcon, UploadIcon, DownloadIcon } from './common';

export const PerformanceMonitor = ({ visible, onClose }) => {
    const [metrics, setMetrics] = useState({
        fps: 60,
        memory: { used: 0, total: 0, limit: 0 },
        resources: [],
        domNodes: 0,
        longTasks: 0,
        connection: { type: 'unknown', downlink: 0, rtt: 0 }
    });
    const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'network' | 'logs'
    const [logs, setLogs] = useState([]);

    const frameCount = useRef(0);
    const lastTime = useRef(performance.now());
    const rafId = useRef(null);

    // ★追加: 平均FPS計算用の履歴
    const fpsHistory = useRef([]);

    // ログ記録ヘルパー
    const logEvent = (type, message, level = 'info') => {
        const timestamp = new Date().toISOString();
        setLogs(prev => {
            // 重複ログの防止
            const lastLog = prev[prev.length - 1];
            if (lastLog && lastLog.message === message && lastLog.type === type) return prev;
            return [...prev, { timestamp, type, message, level }];
        });
    };

    // 1. メイン計測ループ (FPS, Memory, DOM, Connection)
    useEffect(() => {
        const measure = () => {
            const now = performance.now();
            frameCount.current++;

            if (now - lastTime.current >= 1000) {
                const fps = Math.round((frameCount.current * 1000) / (now - lastTime.current));

                // 履歴に追加
                fpsHistory.current.push(fps);
                if (fpsHistory.current.length > 600) fpsHistory.current.shift(); // 直近10分程度を保持

                // メモリ (Chrome系のみ)
                let memory = { used: 0, total: 0, limit: 0 };
                if (performance.memory) {
                    memory = {
                        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
                    };
                }

                // DOMノード数
                const domNodes = document.getElementsByTagName('*').length;

                // 回線情報
                const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                const connection = conn ? {
                    type: conn.effectiveType || 'unknown',
                    downlink: conn.downlink || 0,
                    rtt: conn.rtt || 0
                } : { type: 'unknown', downlink: 0, rtt: 0 };

                setMetrics(prev => ({ ...prev, fps, memory, domNodes, connection }));

                // Threshold Checks
                if (fps < 30) logEvent('FPS', `Low FPS: ${fps}`, 'danger');
                else if (fps < 45) logEvent('FPS', `FPS Drop: ${fps}`, 'warning');

                if (memory.limit > 0) {
                    const memUsage = (memory.used / memory.limit) * 100;
                    if (memUsage > 80) logEvent('Memory', `Critical Usage: ${memUsage.toFixed(1)}%`, 'danger');
                    else if (memUsage > 60) logEvent('Memory', `High Usage: ${memUsage.toFixed(1)}%`, 'warning');
                }

                if (domNodes > 3000) logEvent('DOM', `Many Nodes: ${domNodes}`, 'warning');

                frameCount.current = 0;
                lastTime.current = now;
            }
            rafId.current = requestAnimationFrame(measure);
        };
        rafId.current = requestAnimationFrame(measure);

        return () => cancelAnimationFrame(rafId.current);
    }, []);

    // 2. Observer (Network & Long Tasks)
    useEffect(() => {
        // Network
        const netObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries().map(entry => ({
                name: entry.name,
                type: entry.initiatorType,
                size: entry.transferSize || entry.encodedBodySize || 0,
                duration: entry.duration
            }));

            setMetrics(prev => ({
                ...prev,
                resources: [...prev.resources, ...entries]
            }));

            entries.forEach(entry => {
                if (entry.size > 1024 * 1024) {
                    const name = entry.name.split('/').pop() || 'Asset';
                    logEvent('Network', `Heavy: ${name} (${(entry.size / 1024 / 1024).toFixed(2)} MB)`, 'warning');
                }
            });
        });
        netObserver.observe({ entryTypes: ['resource'] });

        // Long Tasks (Lag)
        let taskObserver;
        try {
            taskObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                setMetrics(prev => ({ ...prev, longTasks: prev.longTasks + entries.length }));
                entries.forEach(entry => {
                    if (entry.duration > 200) {
                        logEvent('Lag', `Freeze detected: ${Math.round(entry.duration)}ms`, 'danger');
                    }
                });
            });
            taskObserver.observe({ entryTypes: ['longtask'] });
        } catch (e) {
            console.warn("Long Task API not supported");
        }

        return () => {
            netObserver.disconnect();
            if (taskObserver) taskObserver.disconnect();
        };
    }, []);

    // Stats Calculation
    const networkStats = useMemo(() => {
        const totalSize = metrics.resources.reduce((sum, r) => sum + r.size, 0);
        const totalCount = metrics.resources.length;
        const ranking = [...metrics.resources].sort((a, b) => b.size - a.size).slice(0, 5);
        return { totalSize, totalCount, ranking };
    }, [metrics.resources]);

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getStatusColor = (val, warn, danger, reverse = false) => {
        if (reverse) { // FPS (Low is bad)
            if (val <= danger) return 'text-red-500 font-bold';
            if (val <= warn) return 'text-amber-500 font-bold';
            return 'text-green-500';
        }
        // Others (High is bad)
        if (val >= danger) return 'text-red-500 font-bold';
        if (val >= warn) return 'text-amber-500 font-bold';
        return 'text-green-500';
    };

    const clearNetworkLogs = () => {
        setMetrics(prev => ({ ...prev, resources: [] }));
        performance.clearResourceTimings();
    };

    // ★追加: 詳細なログ書き出し機能
    const saveLogs = () => {
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-');

        // 平均FPSの計算
        const avgFps = fpsHistory.current.length > 0
            ? Math.round(fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length)
            : 0;

        // ヘッダー情報 (環境情報)
        let logContent = `DJ TIMEKEEPER PRO - PERFORMANCE REPORT\n`;
        logContent += `========================================\n`;
        logContent += `Generated: ${now.toLocaleString()}\n`;
        logContent += `User Agent: ${navigator.userAgent}\n`;
        logContent += `Screen: ${window.innerWidth}x${window.innerHeight} (Pixel Ratio: ${window.devicePixelRatio})\n\n`;

        // スナップショット (現在の状態)
        logContent += `[BASIC METRICS]\n`;
        logContent += `Current FPS: ${metrics.fps}\n`;
        logContent += `Average FPS: ${avgFps} (Sampled over ${fpsHistory.current.length} sec)\n`;
        logContent += `JS Heap: ${metrics.memory.used} MB / ${metrics.memory.limit} MB\n`;
        logContent += `DOM Nodes: ${metrics.domNodes}\n`;
        logContent += `Long Tasks (Freeze > 50ms): ${metrics.longTasks} events\n`;
        logContent += `Connection: ${metrics.connection.type} (${metrics.connection.downlink}Mbps, RTT: ${metrics.connection.rtt}ms)\n\n`;

        // ネットワーク概要
        logContent += `[NETWORK OVERVIEW]\n`;
        logContent += `Total Transfer: ${formatBytes(networkStats.totalSize)}\n`;
        logContent += `Request Count: ${networkStats.totalCount}\n\n`;

        // ネットワーク詳細 (全リクエスト)
        logContent += `[NETWORK DETAILS (All Requests)]\n`;
        logContent += `Format: [Type] Name (Size) - Duration\n`;
        logContent += `----------------------------------------\n`;
        if (metrics.resources.length === 0) {
            logContent += `(No network requests recorded)\n`;
        } else {
            metrics.resources.forEach((r, i) => {
                const name = r.name.length > 100 ? r.name.substring(0, 97) + '...' : r.name;
                logContent += `${i + 1}. [${r.type}] ${name} (${formatBytes(r.size)}) - ${Math.round(r.duration)}ms\n`;
            });
        }
        logContent += `\n`;

        // イベントログ
        logContent += `[SYSTEM LOGS]\n`;
        if (logs.length === 0) logContent += "(No warnings or errors recorded)\n";
        logs.forEach(l => {
            logContent += `[${l.timestamp.split('T')[1].slice(0, 8)}] [${l.level.toUpperCase()}] [${l.type}] ${l.message}\n`;
        });

        // ファイル保存処理
        const blob = new Blob([logContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `djt-perf-${timestamp}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Downloadアイコンのフォールバック (DownloadIconがあればそれを、なければUploadIconを回転)
    const DLIcon = DownloadIcon || (() => <UploadIcon className="w-4 h-4 rotate-180" />);

    return (
        // 非表示時は hidden クラスを付与 (Unmountさせない)
        <div className={`fixed top-4 left-4 z-[10000] w-80 bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl text-gray-100 font-mono text-xs overflow-hidden animate-fade-in-up ${visible ? '' : 'hidden'}`}>

            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-gray-800/50 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(metrics.fps, 45, 30, true)} animate-pulse`} />
                    <span className="font-bold text-sm">System Monitor</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={saveLogs} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-brand-primary transition-colors" title="Save Report">
                        <DLIcon className="w-4 h-4" />
                    </button>
                    <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors">
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700">
                {['summary', 'network', 'logs'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-center transition-colors capitalize ${activeTab === tab ? 'bg-gray-800 text-brand-primary font-bold' : 'hover:bg-gray-800/50 text-gray-400'}`}>{tab}</button>
                ))}
            </div>

            {/* Content */}
            <div className="p-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {activeTab === 'summary' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
                                <p className="text-gray-400 mb-1">FPS (Avg/Curr)</p>
                                <div className="flex items-baseline gap-2">
                                    <p className={`text-xl font-bold ${getStatusColor(metrics.fps, 45, 30, true)}`}>{metrics.fps}</p>
                                    <span className="text-gray-500">/ {fpsHistory.current.length > 0 ? Math.round(fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length) : 0}</span>
                                </div>
                            </div>
                            <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
                                <p className="text-gray-400 mb-1">JS Heap</p>
                                <p className={`text-xl font-bold ${getStatusColor(metrics.memory.used, 100, 200)}`}>{metrics.memory.used}<span className="text-xs text-gray-500 ml-1">MB</span></p>
                                <div className="w-full bg-gray-700 h-1 mt-1 rounded-full overflow-hidden"><div className={`h-full transition-all duration-500 ${metrics.memory.used / metrics.memory.limit > 0.8 ? 'bg-red-500' : metrics.memory.used / metrics.memory.limit > 0.6 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${(metrics.memory.used / metrics.memory.limit) * 100}%` }} /></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
                                <p className="text-gray-400 mb-1">DOM Nodes</p>
                                <p className={`text-lg font-bold ${getStatusColor(metrics.domNodes, 2000, 4000)}`}>{metrics.domNodes}</p>
                            </div>
                            <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
                                <p className="text-gray-400 mb-1">Lag (Long Tasks)</p>
                                <p className={`text-lg font-bold ${metrics.longTasks > 0 ? 'text-amber-500' : 'text-green-500'}`}>{metrics.longTasks}</p>
                            </div>
                        </div>
                        <div className="bg-gray-800/30 px-2 py-1 rounded border border-gray-700 flex justify-between items-center text-[10px] text-gray-400">
                            <span>Net: <span className="text-gray-200 font-bold uppercase">{metrics.connection.type}</span></span>
                            <span>{metrics.connection.downlink}Mbps</span>
                        </div>
                        <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
                            <div className="flex justify-between items-center mb-2"><p className="text-gray-400">Total Transfer</p></div>
                            <div className="flex justify-between items-baseline"><span className={`text-xl font-bold ${getStatusColor(networkStats.totalSize, 5 * 1024 * 1024, 15 * 1024 * 1024)}`}>{formatBytes(networkStats.totalSize)}</span><span className="text-gray-500">{networkStats.totalCount} reqs</span></div>
                        </div>
                    </div>
                )}
                {activeTab === 'network' && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center mb-2"><p className="text-gray-400 font-bold">Recent Requests</p><button onClick={clearNetworkLogs} className="text-xs bg-gray-800 hover:bg-red-900/30 text-gray-400 hover:text-red-400 px-2 py-1 rounded border border-gray-700 transition-colors">Clear</button></div>
                        {metrics.resources.slice().reverse().slice(0, 20).map((r, i) => (
                            <div key={i} className="bg-gray-800/30 p-2 rounded border border-gray-700/50 flex flex-col gap-1">
                                <div className="flex justify-between items-start"><span className={`text-[10px] font-bold px-1 rounded uppercase ${r.type.includes('img') || r.type === 'image' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'}`}>{r.type}</span><span className="text-yellow-500 font-mono">{formatBytes(r.size)}</span></div>
                                <div className="truncate text-gray-300 text-[10px]" title={r.name}>{r.name.split('/').pop() || r.name}</div>
                                <div className="text-right text-gray-600 text-[10px]">{Math.round(r.duration)}ms</div>
                            </div>
                        ))}
                        {metrics.resources.length === 0 && <p className="text-gray-600 italic text-center py-4">No requests recorded</p>}
                    </div>
                )}
                {activeTab === 'logs' && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center mb-2"><p className="text-gray-400 font-bold">Event Logs</p><button onClick={() => setLogs([])} className="text-xs bg-gray-800 hover:bg-red-900/30 text-gray-400 hover:text-red-400 px-2 py-1 rounded border border-gray-700 transition-colors">Clear</button></div>
                        <div className="space-y-1">
                            {logs.slice().reverse().map((log, i) => (
                                <div key={i} className={`text-[10px] p-2 rounded border ${log.level === 'danger' ? 'bg-red-900/20 border-red-900/50 text-red-200' : log.level === 'warning' ? 'bg-amber-900/20 border-amber-900/50 text-amber-200' : 'bg-gray-800/50 border-gray-700 text-gray-300'}`}>
                                    <div className="flex justify-between opacity-70 mb-1"><span className="font-bold uppercase">{log.type}</span><span>{new Date(log.timestamp).toLocaleTimeString()}</span></div>
                                    <div className="break-all">{log.message}</div>
                                </div>
                            ))}
                            {logs.length === 0 && <p className="text-gray-600 italic text-center py-4">No events recorded</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};