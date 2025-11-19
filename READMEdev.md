# [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-phase3-dev/READMEdev.md]
# Technical Stack & Architecture

**Last Updated: 2025-11-19**

## 1. Overview

DJ Timekeeper Pro is a real-time DJ timetable management application built with React and Firebase.
It has evolved into a **multi-tenant, multi-floor web service** where users can manage multiple events securely under their Google account.

## 2. Technology Stack

### Frontend
* **Framework:** React 19.2.0
* **Routing:** React Router DOM 7.9.6
* **Build Tool:** Vite 7.2.2 + SWC
* **Styling:** Tailwind CSS 3.4.18 (Custom animations & `darkMode: 'class'`)
* **Icons:** React Icons 5.5.0

### Backend (BaaS)
* **Service:** Firebase 12.5.0
* **Auth:** Google Authentication
* **Database:** Firestore (Real-time sync)
* **Storage:** Firebase Storage (WebP image compression)

---

## 3. Project Structure (Current)

The project adopts a feature-based page structure managed by `react-router-dom`.

```text
src/
├── App.jsx             # Auth Guard, Routing, & Theme Provider
├── main.jsx            # Entry point (BrowserRouter)
├── firebase.js         # Firebase initialization
│
├── components/
│   ├── LoginPage.jsx       # /login
│   ├── DashboardPage.jsx   # / (Event list & Creation)
│   ├── EditorPage.jsx      # /edit/:eventId/:floorId
│   ├── LivePage.jsx        # /live/:eventId/:floorId
│   │
│   ├── TimetableEditor.jsx # Core Editor UI
│   ├── LiveView.jsx        # Core Live UI (Shared by Editor/LivePage)
│   ├── FloorManagerModal.jsx # Floor management UI
│   ├── DevControls.jsx     # Debug panel
│   └── common.jsx          # Shared UI components (Icons, Toggles)
│
├── hooks/
│   ├── useTimetable.js     # Core time calculation logic
│   ├── useDragAndDrop.js   # DnD logic with "Snap" physics
│   ├── useStorageUpload.js # Image upload logic
│   └── useImagePreloader.js
│
└── utils/
    └── imageProcessor.js   # Client-side image compression (WebP)

    4. Key Technical Features
4.1. Robust Drag & Drop (useDragAndDrop.js)
To resolve layout shifts and "flying card" glitches, a specialized logic was implemented:

Immediate Feedback: Visual updates happen instantly on pointerUp.

Commit Freeze: During the Firestore data commit (200ms), all CSS transitions are forcibly disabled (transition: none). This prevents the browser from interpolating between the old DOM position and the new DOM position, eliminating the "jump" effect.

4.2. Seamless Floor Switching (LiveView.jsx)
To achieve TV-broadcast quality transitions between floors:

Fade Out: The main container opacity drops to 0.

Data Swap: Data is swapped while invisible. suppressEntryAnimation flag is set to true.

Fade In: The container fades back in. The flag prevents individual items from triggering their "entry" animations, ensuring a stable frame.

4.3. Multi-Floor Data Model
Firestore Path: timetables/{eventId}

Structure:

JSON

{
  "floors": {
    "floor_123": {
      "name": "Main Floor",
      "order": 0,
      "timetable": [...],
      "vjTimetable": [...]
    },
    "floor_456": { ... }
  }
}
5. Upcoming Refactoring (Phase 3.9)
The next immediate goal is to optimize the codebase without altering the user experience.

Standardization: Consolidate repetitive modal structures (Overlay, Container, Close Button) into a generic BaseModal component.

Cleanup: Remove legacy components and unused icon imports in common.jsx.

Efficiency: Review re-renders and dependency arrays in useEffect / useCallback.



### Phase 3.9: Codebase Refactoring & Optimization (🚧 Next Step)

**コードベースの効率化と保守性向上**

1.  **Modal Standardization (`BaseModal`):** Unify all modal structures (FloorManager, Settings, Setup, Confirm) into a single reusable component.
2.  **List Card Generalization (`SortableListCard`):** Integrate and abstract the logic and UI of `DjItem` and inline `VjItem` into one component, controlling differences via props.
3.  **UI Component Pruning:** Move and categorize common components from `common.jsx` to a new `src/components/ui/` directory.
4.  **Security Enhancement:** Implement strict Firestore rules validation and review client-side data handling for common vulnerabilities (e.g., SSRF, XSS prevention).
5.  **UI Design Polish (Tactile Update):** Review and update existing components (e.g., `CustomTimeInput`, file upload area) to align with the modern "Tactile" design ethos.

---

## 2. リファクタリング作業開始 (Step 1)

それでは、計画の最優先事項である **Step 1: `BaseModal` の作成と適用**から開始します。