// [src/components/dashboard/DashboardSettingsModal.jsx]
import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase'; // パス調整: components/dashboard/ -> ../../firebase
import { collection, doc, query, where, updateDoc, getDocs, getDoc, writeBatch } from 'firebase/firestore';
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
    LayersIcon
} from '../common'; // パス調整: components/dashboard/ -> ../common

export const DashboardSettingsModal = ({ isOpen, onClose, theme, toggleTheme, onLogout, user, userProfile, onViewUser }) => {
    const [activeTab, setActiveTab] = useState('account');
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [preferences, setPreferences] = useState({
        defaultStartTime: '22:00',
        defaultVjEnabled: false,
        defaultMultiFloor: false,
        ...userProfile?.preferences
    });

    // 管理者追加用
    const [targetEmail, setTargetEmail] = useState('');
    const [adminSearchStatus, setAdminSearchStatus] = useState('');

    // サポートモード用
    const [supportSearchEmail, setSupportSearchEmail] = useState('');
    const [supportSearchStatus, setSupportSearchStatus] = useState('');
    const [foundUser, setFoundUser] = useState(null);

    const [adminList, setAdminList] = useState([]);
    const [isWakeLockEnabled, setIsWakeLockEnabled] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const SUPER_ADMIN_UID = "GLGPpy6IlyWbGw15OwBPzRdCPZI2";
    const isSuperAdmin = user?.uid === SUPER_ADMIN_UID;
    const isAdmin = isSuperAdmin || userProfile?.role === 'admin';

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
            setActiveTab('account');
            setTargetEmail('');
            setAdminSearchStatus('');
            setSupportSearchEmail('');
            setSupportSearchStatus('idle');
            setFoundUser(null);
        }
    }, [isOpen, user, userProfile]);

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
                    preferences: preferences
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

    const fetchAdminList = async () => {
        if (!isSuperAdmin && userProfile?.role !== 'admin') return;
        try {
            const q = query(collection(db, "users"), where("role", "==", "admin"));
            const querySnapshot = await getDocs(q);
            const admins = [];
            querySnapshot.forEach((doc) => {
                admins.push({ id: doc.id, ...doc.data() });
            });
            setAdminList(admins);
        } catch (error) {
            console.error("管理者リスト取得エラー:", error);
        }
    };

    useEffect(() => {
        if (activeTab === 'admin_role') {
            fetchAdminList();
        }
    }, [activeTab]);

    const handleGrantAdmin = async () => {
        if (!targetEmail) return;
        setAdminSearchStatus('searching');
        try {
            const q = query(collection(db, "users"), where("email", "==", targetEmail));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                setAdminSearchStatus('not-found');
                return;
            }
            const updates = [];
            querySnapshot.forEach((docSnap) => {
                const userData = docSnap.data();
                if (userData.role === 'admin') {
                    setAdminSearchStatus('already-admin');
                } else {
                    updates.push(updateDoc(docSnap.ref, { role: 'admin' }));
                }
            });
            if (updates.length > 0) {
                await Promise.all(updates);
                setAdminSearchStatus('success');
                fetchAdminList();
                setTargetEmail('');
            }
        } catch (error) {
            console.error("管理者付与エラー:", error);
            setAdminSearchStatus('error');
        }
    };

    const handleRemoveAdmin = async (targetUid, targetName) => {
        if (targetUid === SUPER_ADMIN_UID) {
            alert("自分自身の権限は削除できません。");
            return;
        }
        if (!window.confirm(`「${targetName || 'このユーザー'}」から管理者権限を剥奪しますか？`)) return;
        try {
            const userRef = doc(db, "users", targetUid);
            await updateDoc(userRef, { role: 'free' });
            fetchAdminList();
        } catch (error) {
            console.error("権限削除エラー:", error);
            alert("権限の変更に失敗しました。");
        }
    };

    const executeDeleteAccount = async () => {
        setIsDeleteConfirmOpen(false);
        setIsDeletingAccount(true);
        try {
            const q = query(collection(db, "timetables"), where("ownerUid", "==", user.uid));
            const querySnapshot = await getDocs(q);
            const deleteStoragePromises = [];
            const batch = writeBatch(db);
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
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
                        deleteStoragePromises.push(deleteObject(imgRef).catch(e => console.warn("Image delete ignored:", e)));
                    }
                });
                batch.delete(docSnap.ref);
            });
            batch.delete(doc(db, "users", user.uid));
            await Promise.all(deleteStoragePromises);
            await batch.commit();
            await deleteUser(user);
            alert("アカウント削除が完了しました。");
        } catch (error) {
            console.error("Account deletion error:", error);
            if (error.code === 'auth/requires-recent-login') {
                alert("セキュリティ保護のため、再ログインが必要です。\n一度ログアウトしてから再度ログインし、直後に削除操作を行ってください。");
                onLogout();
            } else {
                alert(`アカウントの削除に失敗しました: ${error.message}`);
            }
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const handleSupportSearch = async () => {
        if (!supportSearchEmail) return;
        setSupportSearchStatus('searching');
        setFoundUser(null);
        try {
            const q = query(collection(db, "users"), where("email", "==", supportSearchEmail));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docSnap = querySnapshot.docs[0];
                setFoundUser({ id: docSnap.id, ...docSnap.data() });
                setSupportSearchStatus('found');
            } else {
                try {
                    const docRef = doc(db, "users", supportSearchEmail);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setFoundUser({ id: docSnap.id, ...docSnap.data() });
                        setSupportSearchStatus('found');
                    } else {
                        setSupportSearchStatus('not-found');
                    }
                } catch (e) {
                    setSupportSearchStatus('not-found');
                }
            }
        } catch (error) {
            console.error("ユーザー検索エラー:", error);
            setSupportSearchStatus('error');
        }
    };

    // Menu Button Component
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
        <BaseModal isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-4xl" isScrollable={false} noPadding={true} hasCloseButton={false} footer={null}>
            <div className="flex flex-col md:flex-row h-[80vh] md:h-[550px] relative">
                {/* SP Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-background text-on-surface-variant hover:text-on-surface transition-colors z-50 md:hidden">
                    <XIcon className="w-5 h-5" />
                </button>

                {/* Sidebar */}
                <aside className="w-full md:w-64 bg-surface-background border-b md:border-b-0 md:border-r border-on-surface/5 flex flex-col flex-shrink-0">
                    <div className="p-4 md:px-3 md:pt-6 pb-2">
                        <div className="flex items-center gap-3 mb-4 md:mb-6 px-2">
                            <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
                                {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover rounded-full" /> : (user?.displayName?.[0] || "U")}
                            </div>
                            <span className="font-bold text-sm text-on-surface truncate">{user?.displayName || 'User Name'}</span>
                        </div>
                        <div className="hidden md:block text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-wider px-2 mb-1">Settings</div>
                    </div>

                    {/* Menu List (SP: Grid, PC: Stack) */}
                    <div className="px-3 pb-4 md:pb-0 flex-1 overflow-y-auto no-scrollbar">
                        <div className="grid grid-cols-2 md:flex md:flex-col gap-2">
                            <MenuButton id="account" label="アカウント" icon={UserIcon} />
                            <MenuButton id="event" label="初期設定" icon={SettingsIcon} />
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
                        <p className="text-[10px] text-on-surface-variant/50 font-mono text-center">DJ Timekeeper Pro {APP_VERSION}</p>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-w-0 h-full bg-surface-container relative">
                    <div className="hidden md:block absolute top-4 right-4 z-20">
                        <button onClick={onClose} className="p-2 text-on-surface-variant hover:bg-surface-background hover:text-on-surface rounded-full transition-colors">
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 md:p-10 space-y-8 md:space-y-10 custom-scrollbar">
                        {activeTab === 'account' && (
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

                        {activeTab === 'event' && (
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
                                        <Toggle
                                            checked={preferences.defaultMultiFloor}
                                            onChange={(val) => setPreferences(p => ({ ...p, defaultMultiFloor: val }))}
                                            label="複数フロア機能"
                                            icon={LayersIcon}
                                            description="メインフロア以外のステージを追加します"
                                        />
                                    </div>
                                </section>
                            </div>
                        )}

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

                        {activeTab === 'admin_support' && isAdmin && (
                            <div className="animate-fade-in space-y-10">
                                <section>
                                    <div className="mb-6 pb-2 border-b border-on-surface/5">
                                        <h3 className="text-lg font-bold text-on-surface mb-1">ユーザーサポート</h3>
                                        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed opacity-80">ユーザーのEmailまたはUIDで検索し、ダッシュボードを閲覧します。</p>
                                    </div>
                                    <div className="max-w-md space-y-4 pl-1">
                                        <Input
                                            label="ユーザーのEmail / UID"
                                            value={supportSearchEmail}
                                            onChange={(e) => { setSupportSearchEmail(e.target.value); setSupportSearchStatus(''); }}
                                            placeholder="user@example.com"
                                        />
                                        <div className="flex justify-end">
                                            <Button onClick={handleSupportSearch} disabled={!supportSearchEmail || supportSearchStatus === 'searching'} variant="secondary" icon={SearchIcon}>
                                                {supportSearchStatus === 'searching' ? '検索中...' : '検索'}
                                            </Button>
                                        </div>

                                        {supportSearchStatus === 'not-found' && (<div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-500/20"><span>⚠️ ユーザーが見つかりませんでした。</span></div>)}
                                        {supportSearchStatus === 'found' && foundUser && (
                                            <div className="p-4 bg-surface-background border border-on-surface/10 dark:border-white/10 rounded-xl shadow-sm space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-on-surface/10 overflow-hidden border border-on-surface/10">
                                                        {foundUser.photoURL ? <img src={foundUser.photoURL} className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 m-3 text-on-surface-variant" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-base text-on-surface">{foundUser.displayName || 'No Name'}</div>
                                                        <div className="text-xs text-on-surface-variant font-mono">{foundUser.email}</div>
                                                    </div>
                                                </div>
                                                <Button onClick={() => { onViewUser(foundUser); onClose(); }} variant="primary" className="w-full">
                                                    ダッシュボードを見る
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'admin_role' && isSuperAdmin && (
                            <div className="animate-fade-in space-y-10">
                                <section>
                                    <div className="mb-6 pb-2 border-b border-on-surface/5">
                                        <h3 className="text-lg font-bold text-on-surface mb-1">管理者権限の管理</h3>
                                    </div>
                                    <div className="max-w-md space-y-4 pl-1">
                                        <Input
                                            label="対象ユーザーのメールアドレス"
                                            value={targetEmail}
                                            onChange={(e) => { setTargetEmail(e.target.value); setAdminSearchStatus(''); }}
                                            placeholder="admin@example.com"
                                        />
                                        <div className="flex justify-end">
                                            <Button onClick={handleGrantAdmin} disabled={!targetEmail || adminSearchStatus === 'searching'}>
                                                {adminSearchStatus === 'searching' ? '検索中...' : '権限を付与'}
                                            </Button>
                                        </div>
                                        {adminSearchStatus === 'success' && (<div className="p-3 bg-green-500/10 text-green-500 rounded-lg text-sm font-bold flex items-center gap-2"><span>✅ 権限を付与しました！</span></div>)}
                                        {adminSearchStatus === 'not-found' && (<div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm font-bold flex items-center gap-2"><span>⚠️ ユーザーが見つかりませんでした。</span></div>)}
                                        {adminSearchStatus === 'already-admin' && (<div className="p-3 bg-brand-primary/10 text-brand-primary rounded-lg text-sm font-bold flex items-center gap-2"><span>ℹ️ このユーザーは既に管理者です。</span></div>)}
                                        {adminSearchStatus === 'error' && (<div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm font-bold flex items-center gap-2"><span>❌ エラーが発生しました。</span></div>)}
                                    </div>
                                </section>
                                <section>
                                    <div className="mb-6 pb-2 border-b border-on-surface/5">
                                        <h3 className="text-lg font-bold text-on-surface mb-1">現在の管理者一覧</h3>
                                    </div>
                                    <div className="max-w-lg space-y-3 pl-1">
                                        {adminList.length > 0 ? (
                                            adminList.map((admin) => (
                                                <div key={admin.id} className="flex items-center justify-between p-3 bg-surface-background rounded-xl border border-on-surface/10 shadow-sm">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-10 h-10 rounded-full bg-on-surface/10 flex items-center justify-center shrink-0 overflow-hidden border border-on-surface/5">
                                                            {admin.photoURL ? <img src={admin.photoURL} className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 text-on-surface-variant" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-bold text-on-surface truncate flex items-center gap-2">{admin.displayName || 'No Name'} {admin.uid === SUPER_ADMIN_UID && <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded border border-brand-primary/20">YOU</span>}</div>
                                                            <div className="text-xs text-on-surface-variant truncate font-mono opacity-70">{admin.email}</div>
                                                        </div>
                                                    </div>
                                                    {admin.uid !== SUPER_ADMIN_UID && (
                                                        <button onClick={() => handleRemoveAdmin(admin.id, admin.displayName)} className="p-2 text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="管理者権限を剥奪"><XIcon className="w-4 h-4" /></button>
                                                    )}
                                                </div>
                                            ))
                                        ) : (<p className="text-sm text-on-surface-variant p-2">読み込み中、または管理者がいません。</p>)}
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>

                    <div className="p-4 md:p-6 border-t border-on-surface/5 bg-surface-background/30 flex justify-end gap-3 z-10 flex-shrink-0">
                        <Button onClick={onClose} variant="ghost" size="sm">キャンセル</Button>
                        <Button onClick={handleSave} variant="primary" size="sm" disabled={isSaving || isDeletingAccount}>{isSaving ? '保存中...' : '設定を保存'}</Button>
                    </div>
                </main>
            </div>
        </BaseModal>
    );
};