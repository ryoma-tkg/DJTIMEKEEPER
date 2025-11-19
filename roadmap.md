# [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-phase3-dev/roadmap.md]
# Roadmap to Release

**Last Updated: 2025-11-19**

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

1.  **Authentication (Google):** (✅ Completed)
    * Replaced anonymous auth with Google Auth.
    * `LoginPage` implementation.

2.  **Data Model Restructuring:** (✅ Completed)
    * Migrated to `timetables` collection with `ownerUid`.

3.  **Routing & Access Control:** (✅ Completed)
    * `react-router-dom` integration.
    * Page separation (`DashboardPage`, `EditorPage`, `LivePage`).
    * Dynamic redirects (`/edit/:eventId` -> `/edit/:eventId/:floorId`).

4.  **Multi-Floor Management:** (✅ Completed)
    * `FloorManagerModal` implementation.
    * LiveView seamless floor switching logic.

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

---

### Phase 4: Communication & Performance Optimization (✅ Completed)
**"Smart & Thrifty" - コスト削減とUX向上の両立**
* ✅ **Storage Cache Strategy:** Added `Cache-Control` (1 year) to uploads.
* ✅ **Firestore Read Optimization:** Implemented dashboard pagination (`limit`) & `persistentLocalCache`.
* ✅ **Code Splitting:** Applied `React.lazy` & `Suspense` for route-based splitting.
* ✅ **Security Hardening:** Strict `firestore.rules` (Validation & List query constraints).

---

### Phase 5: User Management & Personalization (🚧 Current Focus)
**"Identity & Preferences" - ユーザー体験の個別化と基盤強化**

1.  **User Database Architecture:**
    * Firestore `users` コレクションの設計とセキュリティルールの実装。
2.  **Authentication Flow Upgrade:**
    * ログイン時に自動でユーザーデータ（`users/{uid}`）を作成・同期するロジックの実装。
3.  **Enhanced Settings Modal:**
    * **Preferences:** 新規イベント作成時のデフォルト値（開始時間、VJ、フロア構成）をDBに保存・適用。
    * **Account Management:** アカウント削除（退会）機能。全データのクリーンアップ。
    * **App Info:** バージョン情報の表示 (`package.json`参照)。

---

### Phase 6: Release & Monetization (Future)
**Public Launch**

1.  **Public Real-time Page:** `/public/:timetableId` (View-only).
2.  **Pro Features:** Image Export, CSV Import/Export.
3.  **Monetization:** Stripe integration.