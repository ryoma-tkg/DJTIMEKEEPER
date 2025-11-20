// [src/components/DashboardPage.jsx]
import React, { useState, useEffect, useMemo } from 'react';
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
    ToggleSwitch,
    CustomTimeInput,
    CalendarIcon,
    VideoIcon,
    BaseModal,
    Button,
    Input,
    Label,
    AlertTriangleIcon,
    UserIcon,
    SearchIcon,
    InfoIcon,
    LoadingScreen as LoadingSpinner,
    APP_VERSION
} from './common';
import { DevControls } from './DevControls';

// --- DashboardSettingsModal (サポートモード検索機能を追加) ---
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

    const SectionHeader = ({ title, description }) => (
        <div className="mb-6 pb-2 border-b border-on-surface/5">
            <h3 className="text-base font-bold text-on-surface">{title}</h3>
            {description && <p className="text-xs text-on-surface-variant mt-1 leading-relaxed opacity-80">{description}</p>}
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
                                        <SectionHeader title="プロフィール" description="アプリ内で表示されるあなたの公開情報です。" />
                                        <div className="flex items-start gap-6">
                                            <div className="w-20 h-20 rounded-full bg-surface-background border border-on-surface/10 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                                                {user?.photoURL ? <img src={user.photoURL} alt="User" className="w-full h-full object-cover" /> : <UserIcon className="w-10 h-10 text-on-surface-variant/50" />}
                                            </div>
                                            <div className="flex-grow max-w-md space-y-5">
                                                <div>
                                                    <Label>表示名 (ニックネーム)</Label>
                                                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="DJ Name" />
                                                    <p className="text-xs text-on-surface-variant mt-1.5">イベント作成者として表示される名前です。</p>
                                                </div>
                                                <div>
                                                    <Label>メールアドレス</Label>
                                                    <div className="text-sm font-mono text-on-surface-variant border-b border-dashed border-on-surface/20 pb-1 inline-block">{user?.email}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                    <section>
                                        <SectionHeader title="セッション" />
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
                                        <SectionHeader title="デフォルトの時間設定" description="「新規イベント作成」時に自動的にセットされる開始時間を指定します。" />
                                        <div className="max-w-xs pl-1">
                                            <Label>開始時間</Label>
                                            <CustomTimeInput value={preferences.defaultStartTime} onChange={(v) => setPreferences(p => ({ ...p, defaultStartTime: v }))} />
                                        </div>
                                    </section>
                                    <section>
                                        <SectionHeader title="機能の有効化" description="イベント作成時に、以下の機能を最初からONにしておくか設定します。" />
                                        <div className="space-y-4 max-w-xl pl-1">
                                            <div className="flex items-start justify-between gap-4 p-3 hover:bg-surface-background rounded-lg transition-colors">
                                                <div>
                                                    <div className="font-bold text-sm text-on-surface flex items-center gap-2"><VideoIcon className="w-4 h-4 text-brand-primary" />VJタイムテーブル機能</div>
                                                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">DJとは別に、VJ（Visual Jockey）用のタイムテーブルも管理できるようになります。</p>
                                                </div>
                                                <ToggleSwitch checked={preferences.defaultVjEnabled} onChange={(val) => setPreferences(p => ({ ...p, defaultVjEnabled: val }))} />
                                            </div>
                                            <div className="border-t border-on-surface/5 my-2"></div>
                                            <div className="flex items-start justify-between gap-4 p-3 hover:bg-surface-background rounded-lg transition-colors">
                                                <div>
                                                    <div className="font-bold text-sm text-on-surface flex items-center gap-2"><LayersIcon className="w-4 h-4 text-brand-primary" />複数フロア機能</div>
                                                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">メインフロア以外に、サブフロアやラウンジなど複数のステージを持つイベントを作成する場合にONにします。</p>
                                                </div>
                                                <ToggleSwitch checked={preferences.defaultMultiFloor} onChange={(val) => setPreferences(p => ({ ...p, defaultMultiFloor: val }))} />
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}
                            {activeTab === 'app' && (
                                <div className="animate-fade-in space-y-10">
                                    <section>
                                        <SectionHeader title="表示設定" description="このデバイスでのアプリの見た目をカスタマイズします。" />
                                        <div className="max-w-xl pl-1">
                                            <div className="flex items-center justify-between p-3 hover:bg-surface-background rounded-lg transition-colors">
                                                <div>
                                                    <div className="font-bold text-sm text-on-surface flex items-center gap-2">
                                                        {theme === 'dark' ? <MoonIcon className="w-4 h-4 text-brand-primary" /> : <SunIcon className="w-4 h-4 text-brand-primary" />}ダークモード
                                                    </div>
                                                    <p className="text-xs text-on-surface-variant mt-1">画面の配色を暗いトーンに変更します。</p>
                                                </div>
                                                <ToggleSwitch checked={theme === 'dark'} onChange={toggleTheme} />
                                            </div>
                                            <div className="border-t border-on-surface/5 my-2"></div>
                                            <div className="flex items-center justify-between p-3 hover:bg-surface-background rounded-lg transition-colors">
                                                <div>
                                                    <div className="font-bold text-sm text-on-surface flex items-center gap-2">
                                                        {isWakeLockEnabled ? <SunIcon className="w-4 h-4 text-brand-primary" /> : <MoonIcon className="w-4 h-4 text-on-surface-variant" />}LIVEモードのスリープ防止
                                                    </div>
                                                    <p className="text-xs text-on-surface-variant mt-1">LIVEモードを表示中、デバイスが自動的にスリープしないようにします。</p>
                                                </div>
                                                <ToggleSwitch checked={isWakeLockEnabled} onChange={handleWakeLockToggle} />
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'admin_support' && isAdmin && (
                                <div className="animate-fade-in space-y-10">
                                    <section>
                                        <SectionHeader title="ユーザーサポート (ダッシュボード閲覧)" description="ユーザーのEmailまたはUIDで検索し、そのユーザーとしてダッシュボードを表示します。" />
                                        <div className="max-w-md space-y-4 pl-1">
                                            <div>
                                                <Label>ユーザーのEmail / UID</Label>
                                                <div className="flex gap-2">
                                                    <Input value={supportSearchEmail} onChange={(e) => { setSupportSearchEmail(e.target.value); setSupportSearchStatus(''); }} placeholder="user@example.com" />
                                                    <Button onClick={handleSupportSearch} disabled={!supportSearchEmail || supportSearchStatus === 'searching'} className="flex-shrink-0" variant="secondary">
                                                        <SearchIcon className="w-4 h-4" />
                                                        {supportSearchStatus === 'searching' ? '検索中...' : '検索'}
                                                    </Button>
                                                </div>
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
                                        <SectionHeader title="新しい管理者の追加" description="指定したメールアドレスのユーザーに管理者権限を付与します。" />
                                        <div className="max-w-md space-y-4 pl-1">
                                            <div>
                                                <Label>対象ユーザーのメールアドレス</Label>
                                                <div className="flex gap-2">
                                                    <Input value={targetEmail} onChange={(e) => { setTargetEmail(e.target.value); setAdminSearchStatus(''); }} placeholder="admin@example.com" />
                                                    <Button onClick={handleGrantAdmin} disabled={!targetEmail || adminSearchStatus === 'searching'} className="flex-shrink-0">{adminSearchStatus === 'searching' ? '検索中...' : '権限を付与'}</Button>
                                                </div>
                                            </div>
                                            {adminSearchStatus === 'success' && (<div className="p-3 bg-green-500/10 text-green-500 rounded-lg text-sm font-bold flex items-center gap-2"><span>✅ 権限を付与しました！</span></div>)}
                                            {adminSearchStatus === 'not-found' && (<div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm font-bold flex items-center gap-2"><span>⚠️ ユーザーが見つかりませんでした。</span></div>)}
                                            {adminSearchStatus === 'already-admin' && (<div className="p-3 bg-brand-primary/10 text-brand-primary rounded-lg text-sm font-bold flex items-center gap-2"><span>ℹ️ このユーザーは既に管理者です。</span></div>)}
                                            {adminSearchStatus === 'error' && (<div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm font-bold flex items-center gap-2"><span>❌ エラーが発生しました。</span></div>)}
                                        </div>
                                    </section>
                                    <section>
                                        <SectionHeader title="現在の管理者一覧" description="現在、管理者権限を持っているユーザーのリストです。" />
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
                            <Button onClick={onClose} variant="ghost">キャンセル</Button>
                            <Button onClick={handleSave} variant="primary" disabled={isSaving || isDeletingAccount} className="min-w-[100px] shadow-lg shadow-brand-primary/20">{isSaving ? '保存中...' : '設定を保存'}</Button>
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
                    <div>
                        <Label>イベント名</Label>
                        <Input
                            value={config.title}
                            onChange={(e) => setConfig({ ...config, title: e.target.value })}
                            placeholder="イベント名を入力..."
                            autoFocus
                            isError={isTitleError}
                            error={hasAttemptedSubmit && isTitleError ? "イベント名を入力してください" : null}
                        />
                    </div>
                    <div className="space-y-3">
                        <div><Label>開催日</Label><Input type="date" value={config.startDate} onChange={(e) => setConfig({ ...config, startDate: e.target.value })} icon={CalendarIcon} className="font-mono text-sm" /></div>
                        <div><Label>開始時間</Label><CustomTimeInput value={config.startTime} onChange={(v) => setConfig({ ...config, startTime: v })} /></div>
                    </div>
                </div>
                <hr className="border-on-surface/10" />
                <div className="space-y-2">
                    <Label>オプション設定</Label>
                    <div className="bg-surface-background/50 rounded-xl px-4 py-2 space-y-2">
                        <ToggleSwitch checked={config.vjEnabled} onChange={(val) => setConfig({ ...config, vjEnabled: val })} label="VJタイムテーブル機能" icon={VideoIcon} />
                        <div className="border-t border-on-surface/5"></div>
                        <ToggleSwitch checked={config.isMultiFloor} onChange={(val) => setConfig({ ...config, isMultiFloor: val })} label="複数フロアを使用" icon={LayersIcon} />
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

const EventCard = ({ event, onDeleteClick, onClick }) => {
    const floorCount = event.floors ? Object.keys(event.floors).length : 0;
    const displayFloors = (floorCount === 0 && event.timetable) ? '1 Floor' : `${floorCount} Floors`;
    const { month, day } = formatDateForIcon(event.eventConfig.startDate);
    const isActive = isEventActive(event);
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={isActive ? {
                boxShadow: isHovered
                    ? `0 20px 30px -5px rgb(0 0 0 / 0.2), 0 0 35px 5px rgb(var(--color-brand-primary) / 0.4)`
                    : `0 10px 25px -5px rgb(0 0 0 / 0.1), 0 0 20px 0px rgb(var(--color-brand-primary) / 0.25)`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            } : undefined}
            className={`
                group relative bg-surface-container rounded-3xl p-5 
                transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full
                hover:-translate-y-1 border
                ${isActive ? 'border-brand-primary z-10' : 'border-on-surface/10 dark:border-white/5 shadow-lg hover:shadow-2xl'}
            `}
        >
            <div className={`absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'group-hover:opacity-100'}`} />
            <button onClick={(e) => { e.stopPropagation(); onDeleteClick(event.id, event.eventConfig.title); }} className="absolute top-4 right-4 p-2 text-on-surface-variant/50 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors z-10" title="イベントを削除"><TrashIcon className="w-5 h-5" /></button>

            <div className="flex items-start gap-5 relative z-0 flex-grow">
                <div className={`flex flex-col items-center justify-center w-16 h-16 bg-surface-background rounded-2xl shadow-inner border flex-shrink-0 ${isActive ? 'border-brand-primary text-brand-primary' : 'border-on-surface/10 dark:border-white/5 text-on-surface'}`}>
                    <span className="text-[10px] font-bold tracking-widest uppercase leading-none mb-1 opacity-80">{month}</span>
                    <span className="text-2xl font-bold leading-none font-mono">{day}</span>
                </div>
                <div className="flex-1 min-w-0 pt-1 flex flex-col">
                    {isActive && (
                        <div className="flex items-center gap-2 mb-2 animate-fade-in">
                            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span></span>
                            <span className="text-[10px] font-bold text-brand-primary tracking-widest uppercase">NOW ON AIR</span>
                        </div>
                    )}
                    <h3 className={`text-xl font-bold truncate transition-colors mb-2 leading-snug ${isActive ? 'text-brand-primary' : 'text-on-surface group-hover:text-brand-primary'}`}>{event.eventConfig.title || '無題のイベント'}</h3>
                    <div className="flex items-center gap-3 text-xs font-bold text-on-surface-variant">
                        <div className="flex items-center gap-1 bg-surface-background px-2 py-1 rounded-md"><LayersIcon className="w-3 h-3" /><span>{displayFloors}</span></div>
                        {event.eventConfig.startTime && (<span className="font-mono opacity-70">START {event.eventConfig.startTime}</span>)}
                    </div>
                </div>
            </div>
            <div className="mt-5 pt-4 border-t border-on-surface/10 dark:border-white/5 w-full relative z-0">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface-variant/50 group-hover:text-brand-primary transition-colors">編集モードを開く</span>
                    <Link to={`/live/${event.id}`} target="_blank" onClick={(e) => e.stopPropagation()} className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${isActive ? 'bg-brand-primary text-white shadow-md hover:bg-brand-primary/90' : 'bg-surface-background hover:bg-brand-primary hover:text-white text-on-surface-variant'}`}><span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-red-500'} animate-pulse`} />LIVE LINK</Link>
                </div>
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

                {/* ▼▼▼ 修正: 淡い光エフェクト (shadow-[0_0_15px...]) を追加 ▼▼▼ */}
                <button onClick={handleCreateClick} disabled={isCreating || !!viewingTarget} className="fixed bottom-8 right-8 z-30 flex items-center gap-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-4 px-6 rounded-full shadow-2xl shadow-[0_0_15px_rgba(var(--color-brand-primary),0.5)] transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-wait group hover:shadow-[0_0_25px_rgba(var(--color-brand-primary),0.7)]">
                    <PlusIcon className="w-6 h-6 transition-transform group-hover:rotate-90" />
                    <span className="text-lg pr-1 hidden sm:inline">{isCreating ? '作成中...' : '新規イベント'}</span>
                </button>
                {/* ▲▲▲ 修正ここまで ▲▲▲ */}

            </div>
            <EventSetupModal isOpen={isSetupModalOpen} onClose={() => setIsSetupModalOpen(false)} onCreate={handleSetupComplete} defaultPreferences={userProfile?.preferences} />
            <DashboardSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} theme={theme} toggleTheme={toggleTheme} onLogout={onLogout} user={user} userProfile={userProfile} onViewUser={handleViewUser} />
            <ConfirmModal isOpen={!!deleteTarget} title="イベントを削除" message={`イベント「${deleteTarget?.title || '無題'}」を削除します。復元はできません。本当によろしいですか？`} onConfirm={handleDeleteEvent} onCancel={() => setDeleteTarget(null)} />
            {isDevMode && (<><button onClick={() => setIsDevPanelOpen(p => !p)} className="fixed bottom-8 left-8 z-[998] w-12 h-12 bg-zinc-800 text-brand-primary border border-brand-primary rounded-full shadow-lg grid place-items-center hover:bg-zinc-700 transition-colors"><PowerIcon className="w-6 h-6" /></button>{isDevPanelOpen && <DevControls location="dashboard" onClose={() => setIsDevPanelOpen(false)} onDeleteAllEvents={handleDevDeleteAll} onCrashApp={() => { throw new Error("Dashboard Crash Test"); }} isPerfMonitorVisible={isPerfMonitorVisible} onTogglePerfMonitor={onTogglePerfMonitor} />}</>)}
        </>
    );
};