// [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-phase3-dev/src/components/EditorPage.jsx]
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, storage, auth } from '../firebase'; // storage と auth をインポート
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

// 必要なコンポーネントとフックをインポート
import { TimetableEditor } from './TimetableEditor';
import { LiveView } from './LiveView';
import { DevControls } from './DevControls';
import { useImagePreloader } from '../hooks/useImagePreloader';
import { PowerIcon, AlertTriangleIcon } from './common';

// (App.jsxからLoadingScreenを拝借)
const LoadingScreen = ({ text = "読み込み中..." }) => (
    <div className="flex flex-col items-center justify-center h-screen bg-surface-background">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spinner mb-4"></div>
        <p className="text-lg text-on-surface-variant">{text}</p>
    </div>
);

// (App.jsxからgetDefaultEventConfigを拝借)
const getDefaultEventConfig = () => ({
    title: 'DJ Timekeeper Pro',
    startDate: new Date().toISOString().split('T')[0], // 
    startTime: '22:00',
    vjFeatureEnabled: false
});

// ★ EditorPage 本体
export const EditorPage = ({ user, isDevMode, onToggleDevMode, theme, toggleTheme }) => {
    const { eventId } = useParams(); // URLから /edit/:eventId の eventId を取得
    const navigate = useNavigate();
    const dbRef = useRef(db); // 
    const storageRef = useRef(storage); // 

    // ▼▼▼ 旧 App.jsx のロジックをここにお引越し ▼▼▼
    const [mode, setMode] = useState('edit'); // ★ 修正: EditorPage が mode を持つ
    const [timetable, setTimetable] = useState([]);
    const [vjTimetable, setVjTimetable] = useState([]);
    const [eventConfig, setEventConfig] = useState(getDefaultEventConfig());

    // データ読み込み＆権限チェック用
    const [pageStatus, setPageStatus] = useState('loading'); // 'loading', 'ready', 'forbidden', 'not-found'

    const [timeOffset, setTimeOffset] = useState(0);

    // ▼▼▼ 【!!! 追加 !!!】 開発者パネルの「表示/非表示」を管理する state ▼▼▼
    const [isDevPanelOpen, setIsDevPanelOpen] = useState(false); // デフォルトは非表示

    // 画像プリロード
    const imageUrlsToPreload = useMemo(() => timetable.map(dj => dj.imageUrl), [timetable]);
    const { loadedUrls, allLoaded: imagesLoaded } = useImagePreloader(imageUrlsToPreload);

    // タイムテーブルのドキュメントリファレンス
    const docRef = useMemo(() => doc(dbRef.current, 'timetables', eventId), [eventId]);
    // ▲▲▲ お引越しここまで ▲▲▲

    // ▼ 1. データ読み込み ＆ 権限チェック
    useEffect(() => {
        if (!user || !eventId) return; // ユーザーかeventIdが未定なら何もしない

        setPageStatus('loading');

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();

                // ★★★ フェーズ3.3 セキュリティチェック ★★★
                if (data.ownerUid !== user.uid) {
                    // 自分のイベントじゃない！
                    console.warn("アクセス権限がありません (Not the owner)");
                    // ▼▼▼ 【!!! 修正 !!!】 エラー表示ではなく、/live/ にリダイレクト ▼▼▼
                    setPageStatus('forbidden'); // （念のためセット）
                    navigate(`/live/${eventId}`, { replace: true }); // 
                    // ▲▲▲ 【!!! 修正 !!!】 ここまで ▲▲▲
                } else {
                    // 自分のイベントだった
                    setTimetable(data.timetable || []);
                    setVjTimetable(data.vjTimetable || []);
                    setEventConfig(prev => ({ ...prev, ...(data.eventConfig || {}) }));
                    setPageStatus('ready'); // 
                }
            } else {
                console.error("イベントが見つかりません (Not Found)");
                setPageStatus('not-found');
            }
        }, (error) => {
            console.error("イベントの読み込みに失敗:", error);
            setPageStatus('offline'); // 
        });

        return () => unsubscribe();
    }, [user, eventId, docRef, navigate]); // ★ navigate を依存配列に追加

    // ▼ 2. データベースへの自動保存ロジック (変更なし)
    const saveDataToFirestore = useCallback(() => {
        if (pageStatus !== 'ready' || !user) return; // 準備完了＆ログイン中のみ保存

        // ★ 保存先を 'sharedTimetable' から 'timetables/{eventId}' に変更
        const dataToSave = { timetable, vjTimetable, eventConfig };
        // (ownerUid や createdAt は変更しないので、merge: true は不要)
        setDoc(docRef, dataToSave, { merge: true }).catch(error => {
            console.error("Error saving data to Firestore:", error);
            setPageStatus('offline'); // 
        });
    }, [docRef, timetable, vjTimetable, eventConfig, pageStatus, user]);

    // (自動保存useEffect - 変更なし)
    useEffect(() => {
        if (pageStatus !== 'ready') return; // 読み込み中や権限なしの時は保存しない

        const handler = setTimeout(() => {
            saveDataToFirestore();
        }, 1000);
        return () => clearTimeout(handler);
    }, [saveDataToFirestore, pageStatus]);


    // ▼ 3. Liveモードへの切り替え (旧 App.jsx からお引越し)
    const handleSetMode = (newMode) => {
        if (newMode === 'live') {
            if (!imagesLoaded) {
                alert("まだ画像の準備中っす！ちょっと待ってからもう一回押してくださいっす！");
                return;
            }
            // ★ 修正: URL遷移せず、内部の mode を 'live' に変更
            setMode('live');
        } else {
            // ★ 修正: 'edit' に戻る
            setMode('edit');
        }
    };

    // ▼ 4. 開発者モード用ロジック (変更なし)
    const handleTimeJump = (minutes) => {
        const msToAdd = minutes * 60 * 1000;
        setTimeOffset(prevOffset => prevOffset + msToAdd);
    };
    const handleTimeReset = () => setTimeOffset(0);
    const handleToggleVjFeature = () => setEventConfig(prev => ({ ...prev, vjFeatureEnabled: !prev.vjFeatureEnabled }));
    const handleSetStartNow = () => {
        const now = new Date();
        const newStartDate = now.toISOString().split('T')[0];
        const newStartTime = now.toTimeString().slice(0, 5);
        setEventConfig(prev => ({ ...prev, startDate: newStartDate, startTime: newStartTime, }));
        setTimeOffset(0);
    };
    const handleFinishEvent = () => handleTimeJump(1440);
    const [crash, setCrash] = useState(false);
    if (crash) throw new Error('Test Error from DevControls');
    // (ダミーデータはDashboardで作るのでここでは不要)


    // === レンダリング ===

    if (pageStatus === 'loading') {
        return <LoadingScreen text="イベントデータを読み込み中..." />;
    }

    if (pageStatus === 'offline') {
        return (
            <div className="fixed inset-0 bg-amber-500/90 text-white font-bold py-2 px-4 rounded-full shadow-lg flex items-center gap-2 animate-fade-in-up">
                <AlertTriangleIcon className="w-5 h-5" />
                <span>オフラインです。接続を確認してください。</span>
            </div>
        );
    }

    if (pageStatus === 'not-found') {
        return <div className="p-8"><h1>404 - イベントが見つかりません</h1><Link to="/">ダッシュボードに戻る</Link></div>;
    }

    if (pageStatus === 'forbidden') {
        // ★ リダイレクトが実行されるまでの間に一瞬表示されるローディング
        return <LoadingScreen text="閲覧モードにリダイレクト中..." />;
    }

    //
    // pageStatus === 'ready' の場合
    //

    // ▼▼▼ 【!!! 修正 !!!】 mode によって Editor と Live を切り替える ▼▼▼
    return (
        <>
            <Routes>
                {/* --- ルート: / --- */}
                <Route
                    path="/"
                    element={
                        authStatus === 'authed' ? (
                            <DashboardPage user={user} onLogout={handleLogout} />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* --- ログインページ: /login --- */}
                <Route
                    path="/login"
                    element={
                        authStatus === 'authed' ? (
                            <Navigate to="/" replace />
                        ) : (
                            <LoginPage onLoginClick={handleLogin} isLoggingIn={isLoggingIn} />
                        )
                    }
                />

                {/* --- 編集ページ: /edit/:eventId --- */}
                <Route
                    path="/edit/:eventId"
                    element={
                        authStatus === 'authed' ? (
                            <EditorPage
                                user={user}
                                isDevMode={isDevMode}
                                // onToggleDevMode={toggleDevMode} // ★ 修正: 削除
                                theme={theme}
                                toggleTheme={toggleTheme}
                            />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* --- ライブページ: /live/:eventId --- */}
                <Route
                    path="/live/:eventId"
                    element={
                        <LivePage
                            theme={theme}
                            toggleTheme={toggleTheme}
                        />
                    }
                />

                {/* --- 404 Not Found (仮) --- */}
                <Route
                    path="*"
                    element={
                        <div className="p-8">
                            <h1>404 - ページが見つかりません</h1>
                            <Link to="/">ダッシュボードに戻る</Link>
                        </div>
                    }
                />

            </Routes>
        </>
    );
};

export default App;