// [src/components/dashboard/DashboardSettingsModal.jsx]
import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { collection, doc, query, where, updateDoc, getDocs, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { updateProfile, deleteUser } from 'firebase/auth';
import {
    SettingsIcon,
    XIcon,
    MoonIcon,
    SunIcon,
    LogOutIcon,
    PowerIcon,
    CustomTimeInput,
    VideoIcon,
    BaseModal,
    Button,
    Input,
    Label,
    Toggle,
    AlertTriangleIcon,
    UserIcon,
    SearchIcon,
    APP_VERSION,
    LayersIcon,
    PlanTag,
    ConfirmModal, // ★追加: 削除確認用モーダル
    SparklesIcon // ★追加: Pro機能アイコン
} from '../common';

export const DashboardSettingsModal = ({ isOpen, onClose, theme, toggleTheme, onLogout, user, userProfile, onViewUser }) => {
    const isGuest = user?.isAnonymous;
    const [activeTab, setActiveTab] = useState(isGuest ? 'app' : 'account');
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [preferences, setPreferences] = useState({
        defaultStartTime: '22:00',
        defaultVjEnabled: false,
        defaultMultiFloor: false,
        ...userProfile?.preferences
    });

    const [targetEmail, setTargetEmail] = useState('');
    const [adminSearchStatus, setAdminSearchStatus] = useState('');
    const [targetUserForRole, setTargetUserForRole] = useState(null);

    const [supportSearchEmail, setSupportSearchEmail] = useState('');
    const [supportSearchStatus, setSupportSearchStatus] = useState('');
    const [foundUser, setFoundUser] = useState(null);

    const [privilegedUsers, setPrivilegedUsers] = useState([]);
    const [isWakeLockEnabled, setIsWakeLockEnabled] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // アカウント削除用
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    const SUPER_ADMIN_UID = "GLGPpy6IlyWbGw15OwBPzRdCPZI2";
    const isSuperAdmin = user?.uid === SUPER_ADMIN_UID;
    const isAdmin = isSuperAdmin || userProfile?.role === 'admin';
    // ★追加: Pro機能判定
    const isProUser = userProfile?.role === 'pro';
    const canUseProFeatures = isAdmin || isProUser;

    useEffect(() => {
        if (isOpen) {
            setDisplayName(user?.displayName || '');
            setPreferences({
                defaultStartTime: '22:00',
                defaultVjEnabled: false,
                defaultMultiFloor: false,
                ...userProfile?.preferences
            });
            setIsWakeLockEnabled(localStorage.getItem('wakeLockEnabled') === 'true');
            setActiveTab(isGuest ? 'app' : 'account');

            setTargetEmail('');
            setAdminSearchStatus('');
            setTargetUserForRole(null);
            setSupportSearchEmail('');
            setSupportSearchStatus('idle');
            setFoundUser(null);
        }
    }, [isOpen, user, userProfile, isGuest]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (user && displayName !== user.displayName) {
                await updateProfile(user, { displayName: displayName });
            }
            if (user) {
                const userRef = doc(db, "users", user.uid);
                await updateDoc(userRef, {
                    displayName: displayName,
                    // 権限がない場合は強制的にfalseにする（念のため）
                    preferences: {
                        ...preferences,
                        defaultMultiFloor: canUseProFeatures ? preferences.defaultMultiFloor : false
                    }
                });
            }
            onClose();
        } catch (error) {
            console.error("設定保存エラー:", error);
            alert("設定の保存に失敗しました。");
        } finally {
            setIsSaving(false);
        }
    };

    const handleWakeLockToggle = (val) => {
        setIsWakeLockEnabled(val);
        localStorage.setItem('wakeLockEnabled', val);
    };

    // ... (管理者機能関連のコードは変更なし、省略) ...
    // 「手動付与された」ユーザーのみをフィルタリングして取得
    const fetchPrivilegedUsers = async () => {
        if (!isSuperAdmin && userProfile?.role !== 'admin') return;
        try {
            const q = query(collection(db, "users"), where("role", "in", ["admin", "pro"]));
            const querySnapshot = await getDocs(q);
            const users = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.isManuallyGranted === true) {
                    users.push({ id: doc.id, ...data });
                }
            });
            users.sort((a, b) => {
                if (a.role === 'admin' && b.role !== 'admin') return -1;
                if (a.role !== 'admin' && b.role === 'admin') return 1;
                return 0;
            });
            setPrivilegedUsers(users);
        } catch (error) {
            console.error("権限ユーザーリスト取得エラー:", error);
        }
    };
    useEffect(() => { if (activeTab === 'admin_role') fetchPrivilegedUsers(); }, [activeTab]);
    const handleSearchForRole = async () => { /* 省略 */ };
    const handleChangeRole = async (newRole) => { /* 省略 */ };
    const handleRemoveAdmin = async (targetUid, targetName) => { /* 省略 */ };
    const handleSupportSearch = async () => { /* 省略 */ };

    // --- アカウント削除実行 ---
    const executeDeleteAccount = async () => {
        setIsDeleteConfirmOpen(false);
        setIsDeletingAccount(true);
        try {
            // 1. 削除対象の収集
            const q = query(collection(db, "timetables"), where("ownerUid", "==", user.uid));
            const querySnapshot = await getDocs(q);

            const batch = writeBatch(db);
            const deleteStoragePromises = [];

            // 2. タイムテーブルと画像の削除準備
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();

                // 画像URLの収集
                const allTimetables = [];
                if (data.timetable) allTimetables.push(data.timetable);
                if (data.floors) {
                    Object.values(data.floors).forEach(f => {
                        if (f.timetable) allTimetables.push(f.timetable);
                    });
                }
                allTimetables.flat().forEach(item => {
                    if (item.imageUrl && item.imageUrl.includes("firebasestorage")) {
                        const imgRef = ref(storage, item.imageUrl);
                        deleteStoragePromises.push(deleteObject(imgRef).catch(() => { }));
                    }
                });

                // Firestoreドキュメント削除をバッチに追加
                batch.delete(docSnap.ref);
            });

            // 3. ユーザーデータの削除をバッチに追加
            batch.delete(doc(db, "users", user.uid));

            // 4. 画像削除の実行 (非同期)
            await Promise.all(deleteStoragePromises);

            // 5. Firestore一括削除の実行
            await batch.commit();

            // 6. Authアカウントの削除
            await deleteUser(user);

            alert("アカウント削除が完了しました。ご利用ありがとうございました。");
            onLogout();

        } catch (error) {
            console.error("Account deletion error:", error);
            if (error.code === 'auth/requires-recent-login') {
                alert("セキュリティ保護のため、再ログインが必要です。\n\n一度ログアウトします。再度ログインした後、もう一度「アカウント削除」を実行してください。");
                onLogout();
            } else {
                alert(`アカウントの削除に失敗しました: ${error.message}`);
            }
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const MenuButton = ({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
            <button
                onClick={() => setActiveTab(id)}
                className={`
                    flex items-center gap-2 md:gap-3 text-left px-3 py-3 rounded-lg text-xs md:text-sm transition-all justify-center md:justify-start
                    ${isActive
                        ? 'bg-on-surface/5 text-on-surface font-bold'
                        : 'text-on-surface-variant hover:bg-on-surface/5 hover:text-on-surface'
                    }
                `}
            >
                <Icon className={`w-4 h-4 ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`} />
                <span className="hidden md:inline">{label}</span>
                <span className="md:hidden">{label.split('設定')[0]}</span>
            </button>
        );
    };

    return (
        <>
            <BaseModal
                isOpen={isOpen}
                onClose={onClose}
                maxWidthClass="md:max-w-4xl md:max-h-[90vh] h-full md:h-auto"
                isScrollable={false}
                noPadding={true}
                hasCloseButton={false}
                footer={null}
                isMobileFullScreen={true}
            >
                <div className="flex flex-col md:flex-row h-full md:h-[550px] relative overflow-hidden">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-background text-on-surface-variant hover:text-on-surface transition-colors z-50 md:hidden">
                        <XIcon className="w-5 h-5" />
                    </button>

                    <aside className="w-full md:w-64 bg-surface-background border-b md:border-b-0 md:border-r border-on-surface/5 flex flex-col flex-shrink-0 z-10">
                        {/* ... (サイドバー内容は変更なし) ... */}
                        <div className="p-4 md:px-3 md:pt-6 pb-2">
                            <div className="flex items-center gap-3 mb-4 md:mb-6 px-2">
                                <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
                                    {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover rounded-full" /> : (user?.displayName?.[0] || "U")}
                                </div>
                                <span className="font-bold text-sm text-on-surface truncate">{isGuest ? 'Guest User' : (user?.displayName || 'User Name')}</span>
                            </div>
                            {!isGuest && <div className="hidden md:block text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-wider px-2 mb-1">Settings</div>}
                        </div>

                        <div className="px-3 pb-4 md:pb-0 flex-1 overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-2 md:flex md:flex-col gap-2">
                                {!isGuest && (
                                    <>
                                        <MenuButton id="account" label="アカウント" icon={UserIcon} />
                                        <MenuButton id="event" label="初期設定" icon={SettingsIcon} />
                                    </>
                                )}
                                <MenuButton id="app" label="アプリ設定" icon={SettingsIcon} />
                                {isAdmin && (
                                    <>
                                        <div className="hidden md:block my-2 border-t border-on-surface/10 mx-2"></div>
                                        <div className="hidden md:block text-[10px] font-bold text-brand-primary uppercase tracking-wider px-2 mb-1 mt-1">Administrator</div>
                                        <MenuButton id="admin_support" label="サポート" icon={SearchIcon} />
                                        {isSuperAdmin && (
                                            <MenuButton id="admin_role" label="権限管理" icon={PowerIcon} />
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="hidden md:block mt-auto pt-4 border-t border-on-surface/10 p-4">
                            <p className="text-[10px] text-on-surface-variant/50 font-mono text-center">GIG DECK {APP_VERSION}</p>
                        </div>
                    </aside>

                    <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-surface-container relative">
                        {/* ... (メインエリアの閉じるボタン) ... */}
                        <div className="hidden md:block absolute top-4 right-4 z-20">
                            <button onClick={onClose} className="p-2 text-on-surface-variant hover:bg-surface-background hover:text-on-surface rounded-full transition-colors">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 md:p-10 space-y-8 md:space-y-10 custom-scrollbar">
                            {/* アカウント設定タブ */}
                            {activeTab === 'account' && !isGuest && (
                                <div className="animate-fade-in space-y-8">
                                    <section>
                                        <h3 className="text-lg font-bold text-on-surface mb-1">プロフィール</h3>
                                        <p className="text-xs text-on-surface-variant mb-6 opacity-80">アプリ内で表示されるあなたの公開情報です。</p>
                                        <div className="space-y-5">
                                            <div>
                                                <Label>表示名</Label>
                                                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="DJ Name" />
                                            </div>
                                            <div>
                                                <Label>メールアドレス</Label>
                                                <div className="text-sm font-mono text-on-surface-variant border-b border-dashed border-on-surface/20 pb-1 inline-block">{user?.email}</div>
                                            </div>
                                        </div>
                                    </section>
                                    <section>
                                        <div className="mb-6 pb-2 border-b border-on-surface/5">
                                            <h3 className="text-lg font-bold text-on-surface mb-1">セッション</h3>
                                            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed opacity-80">この端末でのログイン状態を管理します。</p>
                                        </div>
                                        <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-background rounded-lg transition-colors border border-on-surface/10">
                                            <LogOutIcon className="w-4 h-4" />
                                            <span>アカウントからログアウト</span>
                                        </button>
                                    </section>
                                    <section>
                                        <div className="mb-4 border-b border-red-500/20 pb-2">
                                            <h3 className="text-base font-bold text-red-500 flex items-center gap-2"><AlertTriangleIcon className="w-4 h-4" /> Danger Zone</h3>
                                        </div>
                                        <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                            <div>
                                                <p className="font-bold text-on-surface text-sm">アカウントを削除する</p>
                                                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed opacity-80">全てのデータが削除されます。<br className="hidden sm:block" />この操作は取り消せません。</p>
                                            </div>
                                            <Button onClick={() => setIsDeleteConfirmOpen(true)} variant="danger" size="sm" disabled={isDeletingAccount}>{isDeletingAccount ? '処理中...' : '削除する'}</Button>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* イベント初期設定タブ */}
                            {activeTab === 'event' && !isGuest && (
                                <div className="animate-fade-in space-y-10">
                                    <section>
                                        <div className="mb-6 pb-2 border-b border-on-surface/5">
                                            <h3 className="text-lg font-bold text-on-surface mb-1">デフォルトの時間設定</h3>
                                            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed opacity-80">新規イベント作成時に、デフォルトで入力される開始時間です。</p>
                                        </div>
                                        <div className="max-w-xs pl-1">
                                            <Label>開始時間</Label>
                                            <CustomTimeInput value={preferences.defaultStartTime} onChange={(v) => setPreferences(p => ({ ...p, defaultStartTime: v }))} />
                                        </div>
                                    </section>
                                    <section>
                                        <div className="mb-6 pb-2 border-b border-on-surface/5">
                                            <h3 className="text-lg font-bold text-on-surface mb-1">機能の有効化</h3>
                                            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed opacity-80">新規イベント作成時に、デフォルトで有効にする機能を選択します。</p>
                                        </div>
                                        <div className="bg-surface-background/50 rounded-xl px-4 py-2 space-y-2 border border-on-surface/5">
                                            <Toggle
                                                checked={preferences.defaultVjEnabled}
                                                onChange={(val) => setPreferences(p => ({ ...p, defaultVjEnabled: val }))}
                                                label="VJタイムテーブル機能"
                                                icon={VideoIcon}
                                                description="VJのタイムテーブルも管理します"
                                            />
                                            <div className="border-t border-on-surface/5"></div>

                                            {/* ▼▼▼ 修正: 複数フロア機能をグレーアウト＆案内追加 ▼▼▼ */}
                                            <div className={!canUseProFeatures ? "opacity-50 pointer-events-none grayscale relative" : ""}>
                                                <Toggle
                                                    checked={preferences.defaultMultiFloor}
                                                    onChange={(val) => setPreferences(p => ({ ...p, defaultMultiFloor: val }))}
                                                    label={!canUseProFeatures ? "複数フロア機能 (Pro限定)" : "複数フロア機能"}
                                                    icon={LayersIcon}
                                                    description="メインフロア以外のステージを追加します"
                                                    disabled={!canUseProFeatures}
                                                />
                                            </div>
                                        </div>

                                        {/* Pro機能制限の案内 */}
                                        {!canUseProFeatures && (
                                            <div className="mt-4 relative overflow-hidden rounded-lg bg-brand-primary/5 border border-brand-primary/20 p-4">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary" />
                                                <div className="flex items-start gap-3">
                                                    <SparklesIcon className="w-5 h-5 text-brand-primary mt-0.5 shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-bold text-brand-primary mb-1">Proプラン機能</p>
                                                        <p className="text-xs text-on-surface-variant leading-relaxed">
                                                            複数フロア管理機能はProプラン限定です。<br />
                                                            <span className="opacity-70">アップグレードすると制限が解除されます。</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </section>
                                </div>
                            )}

                            {/* アプリ設定タブ (変更なし) */}
                            {activeTab === 'app' && (
                                <div className="animate-fade-in space-y-10">
                                    <section>
                                        <div className="mb-6 pb-2 border-b border-on-surface/5">
                                            <h3 className="text-lg font-bold text-on-surface mb-1">表示設定</h3>
                                            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed opacity-80">アプリ全体の表示設定です。この設定はブラウザに保存されます。</p>
                                        </div>
                                        <div className="bg-surface-background/50 rounded-xl px-4 py-2 space-y-2 border border-on-surface/5">
                                            <Toggle
                                                checked={theme === 'dark'}
                                                onChange={toggleTheme}
                                                label="ダークモード"
                                                icon={theme === 'dark' ? MoonIcon : SunIcon}
                                                description="画面を暗くし、暗所での視認性を高めます"
                                            />
                                            <div className="border-t border-on-surface/5"></div>
                                            <Toggle
                                                checked={isWakeLockEnabled}
                                                onChange={handleWakeLockToggle}
                                                label="LIVEモードのスリープ防止"
                                                icon={isWakeLockEnabled ? SunIcon : MoonIcon}
                                                description="Liveモード中、画面が自動で消灯しないようにします"
                                            />
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* ... (管理者機能タブは変更なし、省略) ... */}
                            {activeTab === 'admin_support' && isAdmin && (
                                <div className="animate-fade-in space-y-10">
                                    <section>
                                        <div className="mb-6 pb-2 border-b border-on-surface/5"><h3 className="text-lg font-bold text-on-surface mb-1">ユーザーサポート</h3><p className="text-xs text-on-surface-variant mt-1 leading-relaxed opacity-80">ユーザーのEmailまたはUIDで検索し、ダッシュボードを閲覧します。</p></div>
                                        <div className="max-w-md space-y-4 pl-1"><Input label="ユーザーのEmail / UID" value={supportSearchEmail} onChange={(e) => { setSupportSearchEmail(e.target.value); setSupportSearchStatus(''); }} placeholder="user@example.com" /><div className="flex justify-end"><Button onClick={handleSupportSearch} disabled={!supportSearchEmail || supportSearchStatus === 'searching'} variant="secondary" icon={SearchIcon}>{supportSearchStatus === 'searching' ? '検索中...' : '検索'}</Button></div>{supportSearchStatus === 'not-found' && (<div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-500/20"><span>⚠️ ユーザーが見つかりませんでした。</span></div>)}{supportSearchStatus === 'found' && foundUser && (<div className="p-4 bg-surface-background border border-on-surface/10 dark:border-white/10 rounded-xl shadow-sm space-y-4"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-on-surface/10 overflow-hidden border border-on-surface/10">{foundUser.photoURL ? <img src={foundUser.photoURL} className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 m-3 text-on-surface-variant" />}</div><div><div className="font-bold text-base text-on-surface">{foundUser.displayName || 'No Name'}</div><div className="text-xs text-on-surface-variant font-mono">{foundUser.email}</div></div></div><Button onClick={() => { onViewUser(foundUser); onClose(); }} variant="primary" className="w-full">ダッシュボードを見る</Button></div>)}</div>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'admin_role' && isSuperAdmin && (
                                <div className="animate-fade-in space-y-10">
                                    <section>
                                        <div className="mb-6 pb-2 border-b border-on-surface/5"><h3 className="text-lg font-bold text-on-surface mb-1">権限・プラン管理</h3><p className="text-xs text-on-surface-variant mt-1 leading-relaxed opacity-80">ユーザーに管理者権限やProプランを付与します。</p></div>
                                        <div className="max-w-md space-y-4 pl-1"><Input label="対象ユーザーのメールアドレス" value={targetEmail} onChange={(e) => { setTargetEmail(e.target.value); setAdminSearchStatus(''); setTargetUserForRole(null); }} placeholder="user@example.com" /><div className="flex justify-end"><Button onClick={handleSearchForRole} disabled={!targetEmail || adminSearchStatus === 'searching'} icon={SearchIcon}>{adminSearchStatus === 'searching' ? '検索中...' : 'ユーザーを検索'}</Button></div>{adminSearchStatus === 'not-found' && (<div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm font-bold flex items-center gap-2"><span>⚠️ ユーザーが見つかりませんでした。</span></div>)}{adminSearchStatus === 'found' && targetUserForRole && (<div className="p-4 bg-surface-background border-2 border-brand-primary/20 rounded-xl space-y-4 animate-fade-in"><div className="flex justify-between items-start"><div><div className="text-xs text-on-surface-variant font-bold mb-1">TARGET USER</div><div className="font-bold text-lg">{targetUserForRole.displayName || 'No Name'}</div><div className="font-mono text-xs opacity-70 mb-2">{targetUserForRole.email}</div><div className="flex items-center gap-2"><span className="text-xs font-bold text-on-surface-variant">現在の権限:</span><PlanTag role={targetUserForRole.role} /></div></div></div><div className="border-t border-on-surface/10 my-2"></div><div className="space-y-2"><div className="text-xs font-bold text-on-surface-variant">変更する権限を選択:</div><div className="grid grid-cols-3 gap-2"><button onClick={() => handleChangeRole('free')} disabled={targetUserForRole.role === 'free' || (!targetUserForRole.role && 'free' === 'free')} className="py-2 px-1 rounded-lg text-xs font-bold border border-blue-500/20 bg-blue-500/5 text-blue-600 hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors uppercase tracking-wider font-sans">Free</button><button onClick={() => handleChangeRole('pro')} disabled={targetUserForRole.role === 'pro'} className="py-2 px-1 rounded-lg text-xs font-bold border border-amber-500/20 bg-amber-500/5 text-amber-600 hover:bg-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors uppercase tracking-wider font-sans">PRO</button><button onClick={() => handleChangeRole('admin')} disabled={targetUserForRole.role === 'admin'} className="py-2 px-1 rounded-lg text-xs font-bold border border-purple-500/20 bg-purple-500/5 text-purple-600 hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors uppercase tracking-wider font-sans">ADMIN</button></div></div></div>)}</div>
                                    </section>
                                    <section>
                                        <div className="mb-6 pb-2 border-b border-on-surface/5"><h3 className="text-lg font-bold text-on-surface mb-1">手動付与ユーザー一覧</h3><p className="text-xs text-on-surface-variant mt-1 opacity-70">この画面から手動で権限を付与されたユーザーのみ表示されます。</p></div>
                                        <div className="max-w-lg space-y-3 pl-1">{privilegedUsers.length > 0 ? (privilegedUsers.map((pUser) => (<div key={pUser.id} className="flex items-center justify-between p-3 bg-surface-background rounded-xl border border-on-surface/10 shadow-sm"><div className="flex items-center gap-3 min-w-0"><div className="w-10 h-10 rounded-full bg-on-surface/10 flex items-center justify-center shrink-0 overflow-hidden border border-on-surface/5">{pUser.photoURL ? <img src={pUser.photoURL} className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 text-on-surface-variant" />}</div><div className="min-w-0"><div className="text-sm font-bold text-on-surface truncate flex items-center gap-2">{pUser.displayName || 'No Name'}{pUser.uid === SUPER_ADMIN_UID && <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded border border-brand-primary/20">YOU</span>}</div><div className="flex items-center gap-2 mt-1"><PlanTag role={pUser.role} className="scale-90 origin-left" /><div className="text-xs text-on-surface-variant truncate font-mono opacity-70">{pUser.email}</div></div></div></div>{pUser.uid !== SUPER_ADMIN_UID && (<button onClick={() => handleRemoveAdmin(pUser.id, pUser.displayName)} className="p-2 text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="権限を剥奪(Free化)"><XIcon className="w-4 h-4" /></button>)}</div>))) : (<p className="text-sm text-on-surface-variant p-2">手動付与された権限ユーザーはいません。</p>)}</div>
                                    </section>
                                </div>
                            )}
                        </div>

                        <div className="p-4 md:p-6 border-t border-on-surface/5 bg-surface-container flex justify-end gap-3 z-20 flex-shrink-0">
                            <Button onClick={onClose} variant="ghost" size="sm">キャンセル</Button>
                            <Button onClick={handleSave} variant="primary" size="sm" disabled={isSaving || isDeletingAccount}>{isSaving ? '保存中...' : '設定を保存'}</Button>
                        </div>
                    </main>
                </div>
            </BaseModal>

            {/* ▼▼▼ 追加: 削除確認モーダルがレンダリングされるように修正 ▼▼▼ */}
            <ConfirmModal
                isOpen={isDeleteConfirmOpen}
                title="アカウントを削除"
                message="本当にアカウントを削除しますか？ 作成した全てのイベントデータも削除され、元に戻すことはできません。"
                onConfirm={executeDeleteAccount}
                onCancel={() => setIsDeleteConfirmOpen(false)}
            />
        </>
    );
};