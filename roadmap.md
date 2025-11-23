# Roadmap to Release

**Last Updated: 2025-11-23**

## 🚀 Milestones

### Phase 1: Refactoring & Bug Fixes (✅ Completed)
Initial stabilization of the single-event application.
* ✅ UI/UX improvements (Mobile layout, Header).
* ✅ Logic separation (Custom hooks).
* ✅ Component separation.
* ✅ Core bug fixes (Time calculation).

### Phase 2: Feature Expansion (✅ Completed)
Enhancing usability as a single-event app.
* ✅ Live Mode Timer Toggle.
* ✅ Settings Modal (Editor).
* ✅ Viewer Settings (Live Mode).
* ✅ VJ Name Field.

### Phase 2.5: Core Logic Overhaul (✅ Completed)
Fundamental fix for time calculation logic.
* ✅ "Event Start Date" introduction.
* ✅ Support for 24h+ events.
* ✅ Explicit `STANDBY` logic (3 hours prior).

### Phase 2.6: UI/UX Polish (✅ Completed)
Elevating the look and feel to a professional standard.
* ✅ Live Mode VJ Bar UI/UX.
* ✅ UPCOMING Display layout fixes.
* ✅ Editor Mode auto-height cards.

### Phase 2.7: Live Mode Animation Separation (✅ Completed)
Decoupling DJ and VJ animations.
* ✅ `VjDisplay` component separation.
* ✅ Independent fade-in/out logic.

### Phase 2.8: Developer Mode (✅ Completed)
Accelerating testing and debugging.
* ✅ Floating DevControls panel.
* ✅ Time jump, Dummy data load, Crash test.

### Phase 2.85: Smartphone UI Polish (✅ Completed)
Optimization for modern mobile devices.
* ✅ `sp:` breakpoint (390px).
* ✅ Live Mode font/icon sizing adjustment.
* ✅ Cross-fade background animation.

### Phase 3: Web Service Architecture (✅ Completed)
Transition to a multi-tenant, multi-floor SaaS platform.
* ✅ **Authentication (Google):** Replaced anonymous auth with Google Auth.
* ✅ **Data Model Restructuring:** Migrated to `timetables` collection with `ownerUid`.
* ✅ **Routing & Access Control:** `react-router-dom` integration.
* ✅ **Multi-Floor Management:** `FloorManagerModal` implementation.

### Phase 3.5: UI/UX Overhaul & Polish (✅ Completed)
Comprehensive design update focusing on "Tactile Feel" and "Modern Professional" aesthetics.
* ✅ **Dashboard:** Event cards with "Glow" effects and depth.
* ✅ **Editor:** Intuitive drag-and-drop with "Snap" physics (no flying glitches).
* ✅ **Animation:** Unified `cubic-bezier` physics and specialized transition logic.
* ✅ **Setup Flow:** New "Event Setup Modal" for granular creation settings.

### Phase 3.9: Codebase Refactoring & Optimization (✅ Completed)
* ✅ **Modal Standardization (`BaseModal`)**
* ✅ **List Card Generalization (`SortableListCard`)**
* ✅ **UI Component Pruning**
* ✅ **Security Enhancement (`firestore.rules`)**
* ✅ **UI Design Polish**

### Phase 4: Communication & Performance Optimization (✅ Completed)
**"Smart & Thrifty" - コスト削減とUX向上の両立**
* ✅ **Storage Cache Strategy:** Added `Cache-Control` (1 year) to uploads.
* ✅ **Firestore Read Optimization:** Implemented dashboard pagination (`limit`) & `persistentLocalCache`.
* ✅ **Code Splitting:** Applied `React.lazy` & `Suspense` for route-based splitting.
* ✅ **Security Hardening:** Strict `firestore.rules` (Validation & List query constraints).

### Phase 5: User Management & Personalization (✅ Completed)
**"Identity & Preferences" - ユーザー体験の個別化と基盤強化**
* ✅ **User Database Architecture:** `users` collection setup & security rules.
* ✅ **Authentication Flow Upgrade:** Automatic user profile creation/sync on login.
* ✅ **Enhanced Settings Modal:** Default preferences (start time, VJ, floors), account deletion.

### Phase 5.5: Admin Tools & UX Improvements (✅ Completed)
**"Professional Control" - 管理機能の強化とUXの洗練**
* ✅ **Admin Support Mode:** Administrators can search and access other users' dashboards for support.
* ✅ **Performance Monitor:** Real-time tracking of FPS, Memory, Network, and DOM nodes with detailed logging.
* ✅ **Dashboard UI Overhaul:** Replaced FAB with inline "Create Event" card and header actions for better usability.
* ✅ **Navigation Logic:** Improved browser-back behavior for seamless transitions between Dashboard, Edit, and Live modes.

---

### Phase 6: UI Renovation & Refactoring (🚀 Current Focus)
**"The Digital Instrument" - 完全に統一されたデザインシステムへの移行**

1.  **フェーズ 1: 足場固め (Foundation)**
    * `tailwind.config.js` の更新 (カラー、アニメーション、SPブレイクポイントの確定)
    * `index.css` の整備 (グローバル変数、スクロールバーユーティリティ)
2.  **フェーズ 2: 原子コンポーネントの昇格 (Atoms)**
    * `src/components/ui/` 配下のコンポーネント（Button, Input, Toggle, Badge）を最新デザインに刷新
3.  **フェーズ 3: 複合コンポーネントの再構築 (Molecules)**
    * `SortableListCard` のレスポンシブ対応・デザインリファクタリング
    * `BaseModal` のアニメーション調整
    * `TimeInput` の刷新
4.  **フェーズ 4: ページへの適用 (Integration)**
    * Dashboard, Editor, LiveView への新コンポーネント適用
5.  **フェーズ 5: お掃除 (Cleanup)**
    * `UITestPage.jsx` の削除
    * 不要なCSS/コンポーネントの削除

---

### Phase 7: Release & Monetization (Future)
**Public Launch**

1.  **Public Real-time Page:** `/public/:timetableId` (View-only).
2.  **Pro Features:** CSV Import/Export.
3.  **Monetization:** Stripe integration.
4.  **Image Export:** Implement one-click image download of the timetable using `html2canvas`.


### Future Ideas & Candidates (💡 New!)
**次期開発候補・ユーザー要望**
* **Co-Editing (共同編集):** イベント単位で他のユーザーを招待し、複数人でリアルタイムにタイムテーブルを編集できる機能。
* **Venue Info (会場登録):** イベント名の下に会場名や場所情報を登録・表示できる機能。