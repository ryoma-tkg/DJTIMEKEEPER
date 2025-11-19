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

### Phase 4: Communication & Performance Optimization (🚧 New Focus)
**"Smart & Thrifty" - コスト削減とUX向上の両立**

1.  **Storage Cache Strategy:**
    * 画像アップロード時に `Cache-Control` ヘッダーを付与し、ブラウザキャッシュを最大限活用（Firebase Storage転送量削減）。
2.  **Firestore Read Optimization:**
    * ダッシュボードのイベント取得に `limit()` とページネーション（または「もっと見る」）を導入し、無駄な読み取りを削減。
    * `enableIndexedDbPersistence` を有効化し、オフラインキャッシュを活用して再訪時の読み取り回数を削減。
3.  **Code Splitting (Lazy Loading):**
    * `React.lazy` と `Suspense` を導入し、初期ロード時のバンドルサイズを削減（Hosting転送量削減＆高速化）。
4.  **Write Frequency Review:**
    * 編集画面のデバウンス処理（自動保存の間隔）の最適化と、保存ステータス（「保存中...」「保存完了」）の可視化。

---

### Phase 5: Release & Pro Features (Future)
**Monetization and Public Release**

1.  **Public Real-time Page:** `/public/:timetableId` (View-only).
2.  **Monetization:** Stripe integration.
3.  **Pro Features:** Image Export, CSV Import/Export.