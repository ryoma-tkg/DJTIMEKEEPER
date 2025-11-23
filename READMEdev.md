# Technical Stack & Architecture

**Last Updated: 2025-11-24**

## 1. Overview

DJ Timekeeper Pro is a real-time DJ timetable management application built with **React 19** and **Firebase 12**.
It functions as a **multi-tenant, multi-floor web service**, allowing users to manage multiple events securely under their Google account with minimized operational costs and high performance.

## 2. Technology Stack

### Frontend
* **Framework:** React 19.2.0
* **Routing:** React Router DOM 7.9.6
* **Build Tool:** Vite 7.2.2 + SWC
* **Styling:** Tailwind CSS 3.4.18
    * Custom animations (Fade-in-up, Modal-in, Bounce-short)
    * `darkMode: 'class'` strategy
* **Icons:** React Icons 5.5.0

### Backend (BaaS)
* **Service:** Firebase 12.5.0
* **Auth:** Google Authentication (Pop-up flow)
* **Database:** Firestore
    * Real-time listeners (`onSnapshot`)
    * Persistent Local Cache enabled for offline resilience
* **Storage:** Firebase Storage
    * Client-side WebP image compression
    * Cache-Control headers for performance optimization

---

## 3. Project Structure

The project adopts a feature-based page structure managed by `react-router-dom`.

```text
src/
├── App.jsx             # Auth Guard, Routing, & Theme Provider
├── main.jsx            # Entry point (BrowserRouter, ErrorBoundary)
├── firebase.js         # Firebase initialization (Persistent Cache Enabled)
│
├── components/
│   ├── LoginPage.jsx       # /login (Google Auth)
│   ├── DashboardPage.jsx   # / (Event list, Create Event, Settings)
│   ├── EditorPage.jsx      # /edit/:eventId/:floorId (Core Logic Container)
│   ├── LivePage.jsx        # /live/:eventId/:floorId (Public View)
│   │
│   ├── TimetableEditor.jsx # Editor UI (DnD List, Inputs)
│   ├── LiveView.jsx        # Live UI (Shared by Editor/LivePage)
│   ├── FloorManagerModal.jsx # Floor management (Add/Edit/Sort)
│   ├── DevControls.jsx     # Debug panel (Time Travel, Crash Test)
│   └── common.jsx          # Shared UI components (Buttons, Icons, Modals)
│
├── hooks/
│   ├── useTimetable.js     # Core time calculation logic
│   ├── useDragAndDrop.js   # DnD logic with "Snap" physics
│   ├── useStorageUpload.js # Image upload logic
│   └── useImagePreloader.js # Image caching logic
│
└── utils/
    └── imageProcessor.js   # Client-side image compression (WebP)
4. Key Technical Features
4.1. Hybrid Save Architecture (Cost & UX Optimization)
To balance the "Real-time feel" with "Firestore Cost Reduction" and "Data Safety," a sophisticated Hybrid Save System was implemented in EditorPage.jsx.

Active Change Detection (Strict Mode):

Instead of passive useEffect monitoring (which causes loops), we use an active markAsDirty() function.

Programmatic Update Guard: A useRef flag (isProgrammaticUpdate) strictly prevents infinite loops or accidental saves when data is loaded from Firestore or when switching floors.

Delayed Auto-Save (20s Debounce):

User changes are NOT sent to Firestore immediately.

A 20-second timer starts after the last user interaction.

This aggregates multiple small edits (e.g., fixing a typo, dragging 3 cards) into a single write operation, drastically reducing Write costs.

Manual "Update" Button (Immediate Sync):

A floating button appears only when changes are detected (hasUnsavedChanges).

Users can press this to immediately sync data to the Live View, overriding the timer.

Visual Feedback: The button uses a "spinning arrow" icon and changes color to indicate pending changes.

Safety Nets (Data Integrity):

Unload Protection: The browser warns users if they try to close the tab with unsaved changes (beforeunload event).

Internal Navigation Save: Navigating within the app (e.g., back to Dashboard, switching floors) triggers a forced save before unmounting.

4.2. Robust Drag & Drop
To resolve layout shifts and "flying card" glitches, a specialized logic was implemented in useDragAndDrop.js:

Immediate Feedback: Visual updates happen instantly on pointerUp via CSS transforms, ensuring 60fps performance.

Commit Freeze: During the data commit phase (approx. 200ms), CSS transitions are temporarily disabled. This prevents the browser from interpolating between the old and new DOM positions, eliminating the visual "jump" effect.

4.3. Users Collection (users/{uid})
Stores user profile and application preferences. Automatically synced on login.

JSON

{
  "uid": "string (Auth UID)",
  "email": "string",
  "displayName": "string",
  "photoURL": "string",
  "role": "free" | "admin",
  "createdAt": "timestamp",
  "lastLoginAt": "timestamp",
  "preferences": {
    "defaultStartTime": "22:00",
    "defaultVjEnabled": false,
    "defaultMultiFloor": false,
    "theme": "dark"
  }
}
4.4. Multi-Floor Data Model
Firestore Path: timetables/{eventId} Data is consolidated into a single document per event to minimize Read costs.

JSON

{
  "ownerUid": "string",
  "eventConfig": {
    "title": "Event Name",
    "startDate": "YYYY-MM-DD",
    "startTime": "HH:mm",
    "vjFeatureEnabled": boolean
  },
  "floors": {
    "floor_123": {
      "name": "Main Floor",
      "order": 0,
      "timetable": [ ... ],
      "vjTimetable": [ ... ]
    },
    "floor_456": { ... }
  }
}
5. Security & Performance
5.1. Firestore Security Rules
Strict Validation: Only the ownerUid can write to their timetables.

Admin Access: Users with role: 'admin' can read/write other users' data for support purposes.

Data Integrity: New event creation requires specific fields (eventConfig, createdAt) to prevent malformed data.

5.2. Client-Side Performance
Image Compression:

Images are resized (max 1024px) and converted to WebP format (< 100KB) before upload.

Uploads include Cache-Control: public, max-age=31536000 headers to leverage CDN caching.

Performance Monitor:

Built-in tool (FPS, Memory, Network, DOM Nodes) accessible via DevControls.

Logs long-tasks (>50ms) to detect UI freezes.

Lazy Loading:

Route-based code splitting using React.lazy and Suspense.

6. Developer Tools
The application includes a hidden Developer Mode enabled for specific User IDs.

Time Travel: Simulate event progression by offsetting the internal clock.

Dummy Data: Generate smart test data for DJs and VJs with one click.

Crash Test: Force an error to test the ErrorBoundary.

Monitor: Toggle the Performance Monitor overlay.

## 7. Design System (v3.1)

**Concept: "The Tactile Instrument"**
The UI is designed to mimic a physical instrument, providing weighted and responsive feedback for every interaction to ensure confidence during live performances.

### 7.1. Core Principles
* **Mobile-First Strategy:**
    * Default styles target standard mobile devices.
    * A custom `sp:` breakpoint (`390px`) is configured in `tailwind.config.js` to optimize layouts for modern smartphones (e.g., iPhone 14 Pro).
* **Tactile Physics:**
    * **Active State:** Interactive elements shrink (`scale-95`) on click/touch to simulate physical key depression.
    * **Lift State:** Draggable cards scale up (`1.05`) and increase shadow depth (`shadow-2xl`) to simulate being lifted off the surface.
* **Motion:**
    * All major transitions use a custom **"Snap" curve** (`cubic-bezier(0.16, 1, 0.3, 1)`) for a snappy, professional feel.

### 7.2. Visual Language
* **Typography:**
    * **Headings & UI:** `Montserrat` (Geometric, Bold)
    * **Body & Japanese:** `IBM Plex Sans JP` (Highly legible)
    * **Numbers & Time:** `Orbitron` (Monospaced, Sci-Fi aesthetic)
* **Elevation & Depth:**
    * **Recessed:** Inputs and time displays use `shadow-inner` to appear sunken.
    * **Emissive:** Primary actions feature a colored "Glow" shadow (`shadow-brand-primary/40`) to stand out in dark environments.
* **Theme Engine:**
    * Colors are defined as **RGB variables** in `index.css` (e.g., `--color-brand-primary`) to allow alpha-transparency manipulation in Tailwind classes (e.g., `bg-brand-primary/20`).