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

### Phase 3.9: Codebase Refactoring & Optimization (🚧 Next Step)
Streamlining the code for maintainability without altering behavior.

1.  **Modal Standardization (`BaseModal`):** Unify all modal structures (FloorManager, Settings, Setup, Confirm) into a single reusable component.
2.  **List Card Generalization (`SortableListCard`):** Integrate and abstract the logic and UI of `DjItem` and inline `VjItem` into one component, controlling differences via props.
3.  **UI Component Pruning:** Move and categorize common components from `common.jsx` to a new `src/components/ui/` directory.
4.  **Security Enhancement:** Implement strict Firestore rules validation and review client-side data handling for common vulnerabilities (e.g., SSRF, XSS prevention).
5.  **UI Design Polish (Tactile Update):** Review and update existing components (e.g., `CustomTimeInput`, file upload area) to align with the modern "Tactile" design ethos.

---

### Phase 4: Release & Pro Features (Future)
Monetization and public release.

1.  **Public Real-time Page:** `/public/:timetableId` (View-only, auto-updating).
2.  **Monetization:** Stripe integration for Pro plans.
3.  **Pro Features:**
    * Image Export (`html2canvas`).
    * CSV Import/Export.
    * Preset saving.