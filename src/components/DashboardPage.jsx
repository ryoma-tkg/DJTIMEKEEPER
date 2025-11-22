// [src/components/DashboardPage.jsx]
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db, storage } from '../firebase';
import { collection, addDoc, deleteDoc, doc, query, where, onSnapshot, Timestamp, writeBatch, orderBy, limit, updateDoc, getDocs, getDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { updateProfile, deleteUser } from 'firebase/auth';
import {
    getTodayDateString,
    PlusIcon,
    SettingsIcon,
    LayersIcon,
    XIcon,
    MoonIcon,
    SunIcon,
    LogOutIcon,
    TrashIcon,
    ConfirmModal,
    PowerIcon,
    CustomTimeInput,
    CalendarIcon,
    VideoIcon,
    BaseModal,
    Button, // 新しいButton
    Input,  // 新しいInput
    Label,  // 新しいLabel
    Badge,  // 新しいBadge
    Toggle, // 新しいToggle
    AlertTriangleIcon,
    UserIcon,
    SearchIcon,
    InfoIcon,
    LoadingScreen as LoadingSpinner,
    APP_VERSION,
    CopyIcon,
    ClockIcon
} from './common';
import { DevControls } from './DevControls';

// --- DashboardSettingsModal (リニューアル) ---
const DashboardSettingsModal = ({ isOpen, onClose, theme, toggleTheme, onLogout, user, userProfile, onViewUser }) => {
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

    const MenuButton = ({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
            <button
                onClick={() => setActiveTab(id)}
                className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-left font-medium text-sm group relative
                    ${isActive
                        ? 'bg-on-surface/5 text-on-surface font-bold'
                        : 'text-on-surface-variant hover:bg-on-surface/5 hover:text-on-surface'
                    }
                `}
            >
                <Icon className={`w-4 h-4 ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`} />
                <span>{label}</span>
            </button>
        );
    };

    // フッターコンテンツ
    const footerContent = (
        <div className="flex justify-end gap-3">
            <Button onClick={onClose} variant="ghost">キャンセル</Button>
            <Button onClick={handleSave} variant="primary" disabled={isSaving || isDeletingAccount}>
                {isSaving ? '保存中...' : '設定を保存'}
            </Button>
        </div>
    );

    return (
        <>
            <BaseModal isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-4xl" isScrollable={false} noPadding={true} hasCloseButton={false} footer={null}>
                <div className="flex flex-col md:flex-row h-[70vh] md:h-[550px]">
                    <aside className="w-full md:w-64 bg-surface-background border-b md:border-b-0 md:border-r border-on-surface/10 flex flex-col flex-shrink-0">
                        <div className="p-4 pt-6 pb-2">
                            <div className="flex items-center gap-3 mb-4 px-2">
                                <div className="w-6 h-6 rounded-full bg-on-surface/10 flex items-center justify-center shrink-0 overflow-hidden">
                                    {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 text-on-surface-variant" />}
                                </div>
                                <span className="text-sm font-bold text-on-surface truncate opacity-80">{user?.displayName || 'User'}</span>
                            </div>
                            <div className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-wider px-2 mb-1">Settings</div>
                        </div>
                        <div className="flex-1 px-3 flex flex-col gap-1 overflow-y-auto">
                            <MenuButton id="account" label="アカウント管理" icon={UserIcon} />
                            <MenuButton id="event" label="イベント初期設定" icon={SettingsIcon} />
                            <MenuButton id="app" label="アプリ設定" icon={SettingsIcon} />

                            {isAdmin && (
                                <>
                                    <div className="my-2 border-t border-on-surface/10 mx-2"></div>
                                    <div className="text-[10px] font-bold text-brand-primary uppercase tracking-wider px-2 mb-1 mt-1">Administrator Menu</div>
                                    <MenuButton id="admin_support" label="ユーザーサポート" icon={SearchIcon} />
                                    {isSuperAdmin && (
                                        <MenuButton id="admin_role" label="管理者権限管理" icon={PowerIcon} />
                                    )}
                                </>
                            )}
                        </div>
                        <div className="p-4 border-t border-on-surface/10">
                            <p className="text-[10px] text-on-surface-variant/40 font-mono text-center">DJ Timekeeper Pro {APP_VERSION}</p>
                        </div>
                    </aside>
                    <main className="flex-1 flex flex-col h-full bg-surface-container relative">
                        <div className="absolute top-4 right-4 z-20">
                            <button onClick={onClose} className="p-2 text-on-surface-variant hover:bg-surface-background hover:text-on-surface rounded-full transition-colors">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 md:p-10 md:pt-12 space-y-10 custom-scrollbar">
                            {activeTab === 'account' && (
                                <div className="animate-fade-in space-y-10">
                                    <section>
                                        <div className="mb-6 pb-2 border-b border-on-surface/5">
                                            <h3 className="text-base font-bold text-on-surface">プロフィール</h3>
                                            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed opacity-80">アプリ内で表示されるあなたの公開情報です。</p>
                                        </div>
                                        <div className="flex items-start gap-6">
                                            <div className="w-20 h-20 rounded-full bg-surface-background border border-on-surface/10 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                                                {user?.photoURL ? <img src={user.photoURL} alt="User" className="w-full h-full object-cover" /> : <UserIcon className="w-10 h-10 text-on-surface-variant/50" />}
                                            </div>
                                            <div className="flex-grow max-w-md space-y-5">
                                                <Input
                                                    label="表示名 (ニックネーム)"
                                                    value={displayName}
                                                    onChange={(e) => setDisplayName(e.target.value)}
                                                    placeholder="DJ Name"
                                                />
                                                <div>
                                                    <Label>メールアドレス</Label>
                                                    <div className="text-sm font-mono text-on-surface-variant border-b border-dashed border-on-surface/20 pb-1 inline-block">{user?.email}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                    <section>
                                        <div className="mb-6 pb-2 border-b border-on-surface/5"><h3 className="text-base font-bold text-on-surface">セッション</h3></div>
                                        <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-background rounded-lg transition-colors border border-on-surface/10">
                                            <LogOutIcon className="w-4 h-4" />
                                            <span>アカウントからログアウト</span>
                                        </button>
                                    </section>
                                    <section>
                                        <div className="mb-4 border-b border-red-500/20 pb-2">
                                            <h3 className="text-base font-bold text-red-500 flex items-center gap-2"><AlertTriangleIcon className="w-4 h-4" /> Danger Zone</h3>
                                        </div>
                                        <div className="p-5 border border-red-500/20 bg-red-500/5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div>
                                                <p className="font-bold text-on-surface text-sm">アカウントを削除する</p>
                                                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed opacity-80">作成したすべてのイベント、アップロードした画像、設定が<br className="hidden sm:block" />完全に削除されます。この操作は取り消せません。</p>
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
                                            <h3 className="text-base font-bold text-on-surface">デフォルトの時間設定</h3>
                                            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed opacity-80">「新規イベント作成」時に自動的にセットされる開始時間を指定します。</p>
                                        </div>
                                        <div className="max-w-xs pl-1">
                                            <Label>開始時間</Label>
                                            <CustomTimeInput value={preferences.defaultStartTime} onChange={(v) => setPreferences(p => ({ ...p, defaultStartTime: v }))} />
                                        </div>
                                    </section>
                                    <section>
                                        <div className="mb-6 pb-2 border-b border-on-surface/5">
                                            <h3 className="text-base font-bold text-on-surface">機能の有効化</h3>
                                            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed opacity-80">イベント作成時に、以下の機能を最初からONにしておくか設定します。</p>
                                        </div>
                                        <div className="space-y-2 max-w-xl pl-1">
                                            <Toggle
                                                checked={preferences.defaultVjEnabled}
                                                onChange={(val) => setPreferences(p => ({ ...p, defaultVjEnabled: val }))}
                                                label="VJタイムテーブル機能"
                                                icon={VideoIcon}
                                                description="DJとは別に、VJ（Visual Jockey）用のタイムテーブルも管理できるようになります。"
                                            />
                                            <div className="border-t border-on-surface/5 my-2"></div>
                                            <Toggle
                                                checked={preferences.defaultMultiFloor}
                                                onChange={(val) => setPreferences(p => ({ ...p, defaultMultiFloor: val }))}
                                                label="複数フロア機能"
                                                icon={LayersIcon}
                                                description="メインフロア以外に、サブフロアやラウンジなど複数のステージを持つイベントを作成する場合にONにします。"
                                            />
                                        </div>
                                    </section>
                                </div>
                            )}
                            {activeTab === 'app' && (
                                <div className="animate-fade-in space-y-10">
                                    <section>
                                        <div className="mb-6 pb-2 border-b border-on-surface/5">
                                            <h3 className="text-base font-bold text-on-surface">表示設定</h3>
                                            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed opacity-80">このデバイスでのアプリの見た目をカスタマイズします。</p>
                                        </div>
                                        <div className="max-w-xl pl-1">
                                            <Toggle
                                                checked={theme === 'dark'}
                                                onChange={toggleTheme}
                                                label="ダークモード"
                                                icon={theme === 'dark' ? MoonIcon : SunIcon}
                                                description="画面の配色を暗いトーンに変更します。"
                                            />
                                            <div className="border-t border-on-surface/5 my-2"></div>
                                            <Toggle
                                                checked={isWakeLockEnabled}
                                                onChange={handleWakeLockToggle}
                                                label="LIVEモードのスリープ防止"
                                                icon={isWakeLockEnabled ? SunIcon : MoonIcon}
                                                description="LIVEモードを表示中、デバイスが自動的にスリープしないようにします。"
                                            />
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'admin_support' && isAdmin && (
                                <div className="animate-fade-in space-y-10">
                                    <section>
                                        <div className="mb-6 pb-2 border-b border-on-surface/5">
                                            <h3 className="text-base font-bold text-on-surface">ユーザーサポート (ダッシュボード閲覧)</h3>
                                            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed opacity-80">ユーザーのEmailまたはUIDで検索し、そのユーザーとしてダッシュボードを表示します。</p>
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

                                            {supportSearchStatus === 'not-found' && (<div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm font-bold flex items-center gap-2"><span>⚠️ ユーザーが見つかりませんでした。</span></div>)}
                                            {supportSearchStatus === 'found' && foundUser && (
                                                <div className="p-4 bg-surface-background border-2 border-brand-primary/30 rounded-xl space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-on-surface/10 overflow-hidden">
                                                            {foundUser.photoURL ? <img src={foundUser.photoURL} className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 m-2 text-on-surface-variant" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-sm text-on-surface">{foundUser.displayName || 'No Name'}</div>
                                                            <div className="text-xs text-on-surface-variant font-mono">{foundUser.email}</div>
                                                        </div>
                                                    </div>
                                                    <Button onClick={() => { onViewUser(foundUser); onClose(); }} variant="primary" className="w-full">
                                                        このユーザーのダッシュボードを見る
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
                                            <h3 className="text-base font-bold text-on-surface">新しい管理者の追加</h3>
                                            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed opacity-80">指定したメールアドレスのユーザーに管理者権限を付与します。</p>
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
                                            <h3 className="text-base font-bold text-on-surface">現在の管理者一覧</h3>
                                            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed opacity-80">現在、管理者権限を持っているユーザーのリストです。</p>
                                        </div>
                                        <div className="max-w-lg space-y-3 pl-1">
                                            {adminList.length > 0 ? (
                                                adminList.map((admin) => (
                                                    <div key={admin.id} className="flex items-center justify-between p-3 bg-surface-background rounded-xl border border-on-surface/10">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-8 h-8 rounded-full bg-on-surface/10 flex items-center justify-center shrink-0 overflow-hidden">
                                                                {admin.photoURL ? <img src={admin.photoURL} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 text-on-surface-variant" />}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-bold text-on-surface truncate flex items-center gap-2">{admin.displayName || 'No Name'} {admin.uid === SUPER_ADMIN_UID && <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded">YOU</span>}</div>
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
                        <div className="p-4 px-8 border-t border-on-surface/5 flex justify-end gap-3 bg-surface-container/95 backdrop-blur-sm z-10 flex-shrink-0">
                            {footerContent}
                        </div>
                    </main>
                </div>
            </BaseModal>
            <ConfirmModal isOpen={isDeleteConfirmOpen} title="アカウント削除の確認" message="【警告】本当にアカウントを削除しますか？ これにより、あなたが作成したすべてのイベント、アップロードした画像、および設定が完全に削除されます。この操作は取り消すことができません。" onConfirm={executeDeleteAccount} onCancel={() => setIsDeleteConfirmOpen(false)} />
        </>
    );
};

const EventSetupModal = ({ isOpen, onClose, onCreate, defaultPreferences }) => {
    const [config, setConfig] = useState({
        title: '',
        startDate: getTodayDateString(),
        startTime: '22:00',
        vjEnabled: false,
        isMultiFloor: false
    });
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setConfig({
                title: '',
                startDate: getTodayDateString(),
                startTime: defaultPreferences?.defaultStartTime || '22:00',
                vjEnabled: defaultPreferences?.defaultVjEnabled || false,
                isMultiFloor: defaultPreferences?.defaultMultiFloor || false
            });
            setHasAttemptedSubmit(false);
        }
    }, [isOpen, defaultPreferences]);

    const isTitleError = !config.title || config.title.trim() === '';

    const handleSubmit = () => {
        setHasAttemptedSubmit(true);
        if (isTitleError) return;
        const finalConfig = { ...config, title: config.title.trim() || 'New Event' };
        onCreate(finalConfig);
    };

    const footerContent = (
        <div className="flex justify-end gap-3">
            <Button onClick={onClose} variant="ghost">キャンセル</Button>
            <Button onClick={handleSubmit} variant="primary">作成する</Button>
        </div>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="新規イベント作成" footer={footerContent} isScrollable={true} maxWidthClass="max-w-md">
            <div className="space-y-6">
                <div className="space-y-4">
                    <Input
                        label="イベント名"
                        value={config.title}
                        onChange={(e) => setConfig({ ...config, title: e.target.value })}
                        placeholder="イベント名を入力..."
                        autoFocus
                        isError={isTitleError}
                        error={hasAttemptedSubmit && isTitleError ? "イベント名を入力してください" : null}
                    />
                    <div className="space-y-3">
                        <div><Label>開催日</Label><Input type="date" value={config.startDate} onChange={(e) => setConfig({ ...config, startDate: e.target.value })} icon={CalendarIcon} className="font-mono text-sm" /></div>
                        <div><Label>開始時間</Label><CustomTimeInput value={config.startTime} onChange={(v) => setConfig({ ...config, startTime: v })} /></div>
                    </div>
                </div>
                <hr className="border-on-surface/10" />
                <div className="space-y-2">
                    <Label>オプション設定</Label>
                    <div className="bg-surface-background/50 rounded-xl px-4 py-2 space-y-2">
                        <Toggle checked={config.vjEnabled} onChange={(val) => setConfig({ ...config, vjEnabled: val })} label="VJタイムテーブル機能" icon={VideoIcon} />
                        <div className="border-t border-on-surface/5"></div>
                        <Toggle checked={config.isMultiFloor} onChange={(val) => setConfig({ ...config, isMultiFloor: val })} label="複数フロアを使用" icon={LayersIcon} />
                    </div>
                    <p className="text-xs text-on-surface-variant/60 px-2">※ 複数フロアをONにすると、初期状態で2つのフロアが作成されます。</p>
                </div>
            </div>
        </BaseModal>
    );
};

const formatDateForIcon = (dateStr) => {
    if (!dateStr) return { month: '---', day: '--' };
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { month: '---', day: '--' };
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return { month: monthNames[date.getMonth()], day: String(date.getDate()).padStart(2, '0') };
};

const isEventActive = (event) => {
    const { startDate, startTime } = event.eventConfig;
    if (!startDate || !startTime) return false;
    const start = new Date(`${startDate}T${startTime}`);
    const now = new Date();
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return now >= start && now < end;
};

// --- Event Card (New Design) ---
const EventCard = ({ event, onDeleteClick, onClick }) => {
    const floorCount = event.floors ? Object.keys(event.floors).length : 0;
    const displayFloors = (floorCount === 0 && event.timetable) ? '1 Floor' : `${floorCount} Floors`;
    const { month, day } = formatDateForIcon(event.eventConfig.startDate);
    const isActive = isEventActive(event);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    const gradientClass = isActive ? 'from-red-500/5' : 'from-brand-primary/5';

    return (
        <div
            onClick={onClick}
            className={`
                group relative bg-surface-container rounded-3xl p-6 
                transition-all duration-300 cursor-pointer overflow-visible flex flex-col h-full
                hover:-translate-y-1
                ${isActive
                    ? 'border border-red-500/40 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]'
                    : 'border border-on-surface/10 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-on-surface/20'
                }
            `}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} to-transparent opacity-0 transition-opacity duration-500 pointer-events-none rounded-3xl ${isActive ? 'opacity-100' : 'group-hover:opacity-100'}`} />

            {/* Menu */}
            <div className="absolute top-4 right-4 z-20" ref={menuRef}>
                <button
                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                    className={`
                        w-8 h-8 rounded-full flex items-center justify-center transition-colors
                        ${isMenuOpen ? 'bg-surface-background text-on-surface' : 'text-on-surface-variant/50 hover:text-on-surface hover:bg-surface-background/50'}
                    `}
                >
                    {/* More Icon Vertical */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-32 bg-surface-container rounded-xl shadow-xl border border-on-surface/10 overflow-hidden animate-fade-in z-30">
                        <button
                            className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                            onClick={(e) => { e.stopPropagation(); onDeleteClick(event.id, event.eventConfig.title); setIsMenuOpen(false); }}
                        >
                            <TrashIcon className="w-3 h-3" /> 削除
                        </button>
                    </div>
                )}
            </div>

            <div className="flex items-start gap-5 mb-6 flex-grow relative z-0">
                <div className={`
                    flex flex-col items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl shadow-inner border shrink-0 transition-all
                    ${isActive
                        ? 'bg-red-500/5 border-red-500/20 text-red-500'
                        : 'bg-surface-background border-on-surface/5 dark:border-white/10 text-on-surface-variant'
                    }
                `}>
                    <span className="text-[10px] font-bold tracking-widest uppercase leading-none mb-1 opacity-70">{month}</span>
                    <span className="text-xl md:text-2xl font-bold leading-none font-mono">{day}</span>
                </div>
                <div className="flex-1 min-w-0 pt-1 flex flex-col">
                    {isActive && (
                        <div className="mb-2">
                            <Badge status="onAir" label="NOW ON AIR" />
                        </div>
                    )}
                    <h3 className={`text-base md:text-lg font-bold truncate mb-1 font-sans transition-colors ${isActive ? 'text-on-surface' : 'text-on-surface group-hover:text-brand-primary'}`}>{event.eventConfig.title || '無題のイベント'}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-on-surface-variant">
                        <div className="flex items-center gap-1.5">
                            <LayersIcon className="w-3 h-3" />
                            <span>{displayFloors}</span>
                        </div>
                        {event.eventConfig.startTime && (
                            <div className="flex items-center gap-1.5">
                                <ClockIcon className="w-3 h-3" />
                                <span className="font-mono">START {event.eventConfig.startTime}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-4 border-t border-on-surface/5 dark:border-white/5 flex justify-between items-center relative z-0">
                <span className="text-xs font-bold text-on-surface-variant/50 group-hover:text-brand-primary group-hover:opacity-100 transition-all duration-300">Open Editor</span>
                <Link to={`/live/${event.id}`} target="_blank" onClick={(e) => e.stopPropagation()}
                    className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all
                        ${isActive
                            ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:bg-red-600 hover:shadow-[0_0_20px_rgba(239,68,68,0.7)] border-transparent'
                            : 'bg-surface-background text-on-surface-variant hover:text-brand-primary hover:bg-brand-primary/10 border border-on-surface/5'
                        }
                    `}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-on-surface-variant/50'}`} />
                    LIVE LINK
                </Link>
            </div>
        </div>
    );
};

export const DashboardPage = ({ user, onLogout, theme, toggleTheme, isDevMode, isPerfMonitorVisible, onTogglePerfMonitor }) => {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    const [viewLimit, setViewLimit] = useState(100);
    const [userProfile, setUserProfile] = useState(null);
    const [viewingTarget, setViewingTarget] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        setIsLoading(true);
        const targetUid = viewingTarget ? viewingTarget.uid : user.uid;
        const q = query(collection(db, "timetables"), where("ownerUid", "==", targetUid), orderBy("createdAt", "desc"), limit(viewLimit));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const userEvents = [];
            querySnapshot.forEach((doc) => { userEvents.push({ id: doc.id, ...doc.data() }); });
            setEvents(userEvents);
            setIsLoading(false);
        }, (error) => {
            console.error("イベント読込エラー:", error);
            if (viewingTarget) alert(`読み込みエラー: ${error.message}\nFirestoreセキュリティルールにより拒否された可能性があります。`);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user, viewLimit, viewingTarget]);

    useEffect(() => {
        if (!user) return;
        const userDocRef = doc(db, "users", user.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => { if (docSnap.exists()) { setUserProfile(docSnap.data()); } });
        return () => unsubscribe();
    }, [user]);

    const { nowEvents, upcomingEvents, pastEvents } = useMemo(() => {
        const now = new Date();
        const nowList = [], upcomingList = [], pastList = [];
        events.forEach(event => {
            const { startDate, startTime } = event.eventConfig || {};
            if (!startDate || !startTime) { pastList.push(event); return; }
            const start = new Date(`${startDate}T${startTime}`);
            const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
            if (now >= start && now < end) nowList.push(event);
            else if (now < start) upcomingList.push(event);
            else pastList.push(event);
        });
        upcomingList.sort((a, b) => new Date(`${a.eventConfig.startDate}T${a.eventConfig.startTime}`) - new Date(`${b.eventConfig.startDate}T${b.eventConfig.startTime}`));
        pastList.sort((a, b) => new Date(`${b.eventConfig.startDate}T${b.eventConfig.startTime}`) - new Date(`${a.eventConfig.startDate}T${a.eventConfig.startTime}`));
        return { nowEvents: nowList, upcomingEvents: upcomingList, pastEvents: pastList };
    }, [events]);

    const handleCreateClick = () => { setIsSetupModalOpen(true); };

    const handleSetupComplete = async (modalConfig) => {
        if (isCreating || !user) return;
        if (viewingTarget) { if (!window.confirm("現在サポートモード中です。新規イベントは「あなた（管理者）」のアカウントで作成されます。よろしいですか？")) return; }
        setIsSetupModalOpen(false); setIsCreating(true);
        try {
            const floorsConfig = {};
            if (modalConfig.isMultiFloor) {
                const mainFloorId = `floor_${Date.now()}_main`; const subFloorId = `floor_${Date.now()}_sub`;
                floorsConfig[mainFloorId] = { name: "Main Floor", order: 0, timetable: [], vjTimetable: [] };
                floorsConfig[subFloorId] = { name: "Sub Floor", order: 1, timetable: [], vjTimetable: [] };
            } else { const defaultFloorId = `floor_${Date.now()}`; floorsConfig[defaultFloorId] = { name: "Main Floor", order: 0, timetable: [], vjTimetable: [] }; }
            const newEventDoc = { ownerUid: user.uid, createdAt: Timestamp.now(), eventConfig: { title: modalConfig.title, startDate: modalConfig.startDate, startTime: modalConfig.startTime, vjFeatureEnabled: modalConfig.vjEnabled }, floors: floorsConfig };
            const docRef = await addDoc(collection(db, "timetables"), newEventDoc);
            navigate(`/edit/${docRef.id}`);
        } catch (error) { console.error("作成失敗:", error); alert("イベントの作成に失敗しました。"); setIsCreating(false); }
    };

    const handleDeleteEvent = async () => {
        if (!deleteTarget) return;
        if (viewingTarget) { alert("サポートモード（閲覧中）のため、イベントの削除はできません。"); setDeleteTarget(null); return; }
        try { await deleteDoc(doc(db, "timetables", deleteTarget.id)); setDeleteTarget(null); } catch (error) { console.error("削除失敗:", error); alert("削除に失敗しました。"); }
    };

    const handleDevDeleteAll = async () => {
        if (!window.confirm("全削除しますか？")) return;
        try { const batch = writeBatch(db); events.forEach(e => batch.delete(doc(db, "timetables", e.id))); await batch.commit(); alert("完了"); } catch (e) { alert("失敗"); }
    };

    const handleViewUser = (targetUser) => {
        if (targetUser.id === user.uid) { setViewingTarget(null); } else { setViewingTarget({ uid: targetUser.id, displayName: targetUser.displayName, email: targetUser.email }); }
    };

    if (isLoading && events.length === 0) return <LoadingSpinner />;

    return (
        <>
            {viewingTarget && (<div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between sticky top-0 z-50 shadow-md"><div className="flex items-center gap-2 text-sm font-bold"><InfoIcon className="w-5 h-5" /><span>閲覧中: {viewingTarget.displayName} ({viewingTarget.email})</span></div><button onClick={() => setViewingTarget(null)} className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-full transition-colors font-bold">終了して戻る</button></div>)}
            <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto pb-32">
                <header className="flex flex-row justify-between items-center mb-12 animate-fade-in-up relative z-30 gap-4">
                    <div className="flex flex-col items-start select-none flex-shrink-0"><h1 className="text-xl md:text-2xl font-bold tracking-widest text-on-surface">DJ TIMEKEEPER <span className="text-brand-primary">PRO</span></h1><span className="text-[10px] font-bold tracking-[0.3em] text-on-surface-variant uppercase">Dashboard</span></div>
                    <div className="flex items-center gap-4 md:gap-6"><div className="relative"><button onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)} className="flex items-center gap-3 group focus:outline-none" title="アカウントメニューを開く">{user?.photoURL ? <img src={user.photoURL} alt="User" className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-surface-container shadow-md group-hover:scale-105 transition-transform group-hover:shadow-lg" /> : <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform group-hover:shadow-lg">{user?.displayName?.[0] || "U"}</div>}</button>{isAccountMenuOpen && (<><div className="fixed inset-0 z-40" onClick={() => setIsAccountMenuOpen(false)} /><div className="absolute top-full right-0 mt-3 w-64 bg-surface-container rounded-2xl shadow-2xl border border-on-surface/10 p-2 z-50 animate-fade-in origin-top-right"><div className="px-4 py-3 border-b border-on-surface/10 mb-2"><p className="font-bold text-sm text-on-surface truncate">{userProfile?.displayName || user?.displayName || 'Guest User'}</p><p className="text-xs text-on-surface-variant truncate opacity-70">{user?.email}</p></div><button onClick={() => { setIsSettingsOpen(true); setIsAccountMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-background transition-colors text-left text-on-surface"><SettingsIcon className="w-5 h-5 text-on-surface-variant" /><span className="font-bold text-sm">アプリ設定</span></button><button onClick={() => { onLogout(); setIsAccountMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors text-left mt-1"><LogOutIcon className="w-5 h-5" /><span className="font-bold text-sm">ログアウト</span></button></div></>)}</div></div>
                </header>

                {events.length > 0 ? (
                    <div className="space-y-12">
                        {nowEvents.length > 0 && (<section className="animate-fade-in-up opacity-0"><div className="flex items-center gap-2 mb-4 text-red-500"><span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span><h2 className="text-lg font-bold tracking-widest">NOW ON AIR</h2></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{nowEvents.map(event => <EventCard key={event.id} event={event} onDeleteClick={(id, title) => setDeleteTarget({ id, title })} onClick={() => navigate(`/edit/${event.id}`)} />)}</div></section>)}
                        {upcomingEvents.length > 0 && (<section className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.1s' }}><h2 className="text-lg font-bold text-on-surface-variant mb-4 tracking-widest flex items-center gap-2"><span className="text-brand-primary">●</span> UPCOMING</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{upcomingEvents.map(event => <EventCard key={event.id} event={event} onDeleteClick={(id, title) => setDeleteTarget({ id, title })} onClick={() => navigate(`/edit/${event.id}`)} />)}</div></section>)}
                        {pastEvents.length > 0 && (<section className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s' }}><h2 className="text-lg font-bold text-on-surface-variant/50 mb-4 tracking-widest">ARCHIVE</h2><div className="transition-opacity duration-300"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{pastEvents.map(event => <EventCard key={event.id} event={event} onDeleteClick={(id, title) => setDeleteTarget({ id, title })} onClick={() => navigate(`/edit/${event.id}`)} />)}</div></div></section>)}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-70"><div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-6"><LayersIcon className="w-10 h-10 text-on-surface-variant" /></div><p className="text-xl font-bold text-on-surface mb-2">イベントがありません</p><p className="text-sm text-on-surface-variant">{viewingTarget ? 'このユーザーはまだイベントを作成していません。' : '右下のボタンから、最初のイベントを作成しましょう！'}</p></div>
                )}

                {/* Floating Action Button (New Design) */}
                <div className="fixed bottom-8 right-8 z-30">
                    <Button
                        onClick={handleCreateClick}
                        disabled={isCreating || !!viewingTarget}
                        variant="primary"
                        size="lg"
                        icon={PlusIcon}
                        className="shadow-2xl"
                    >
                        {isCreating ? '作成中...' : '新規イベント'}
                    </Button>
                </div>

            </div>
            <EventSetupModal isOpen={isSetupModalOpen} onClose={() => setIsSetupModalOpen(false)} onCreate={handleSetupComplete} defaultPreferences={userProfile?.preferences} />
            <DashboardSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} theme={theme} toggleTheme={toggleTheme} onLogout={onLogout} user={user} userProfile={userProfile} onViewUser={handleViewUser} />
            <ConfirmModal isOpen={!!deleteTarget} title="イベントを削除" message={`イベント「${deleteTarget?.title || '無題'}」を削除します。復元はできません。本当によろしいですか？`} onConfirm={handleDeleteEvent} onCancel={() => setDeleteTarget(null)} />
            {isDevMode && (<><button onClick={() => setIsDevPanelOpen(p => !p)} className="fixed bottom-8 left-8 z-[998] w-12 h-12 bg-zinc-800 text-brand-primary border border-brand-primary rounded-full shadow-lg grid place-items-center hover:bg-zinc-700 transition-colors"><PowerIcon className="w-6 h-6" /></button>{isDevPanelOpen && <DevControls location="dashboard" onClose={() => setIsDevPanelOpen(false)} onDeleteAllEvents={handleDevDeleteAll} onCrashApp={() => { throw new Error("Dashboard Crash Test"); }} isPerfMonitorVisible={isPerfMonitorVisible} onTogglePerfMonitor={onTogglePerfMonitor} />}</>)}
        </>
    );
};