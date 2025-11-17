# [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-phase3-dev/READMEdev.md]
# Technical Stack & Architecture (Phase 3)

**Last Updated: 2025-11-18**

## 1. Overview

DJ Timekeeper Pro is a real-time DJ timetable management application built with React and Firebase.

This document outlines the **Phase 3 architecture**, which marks a fundamental shift from a single-event, anonymous-access application to a **multi-tenant, authenticated web service**. Users can now manage multiple distinct events under their own Google account.

## 2. Technology Stack

### Frontend
* **Framework:** React 19.2.0
* **Routing:** React Router DOM 7.9.6 (for URL-based page navigation)
* **Build Tool:** Vite 7.2.2
* **Compiler:** SWC (via `@vitejs/plugin-react-swc`)
* **Styling:** Tailwind CSS 3.4.18 (with `darkMode: 'class'`)
* **Icons:** React Icons 5.5.0

### Backend (BaaS)
* **Service:** Firebase 12.5.0
* **Authentication:** Google Authentication (via `signInWithPopup`)
* **Database:** Firestore (for real-time data synchronization)
* **Storage:** Firebase Storage (for user image uploads)

---

## 3. Project Structure (Phase 3)

The introduction of `react-router-dom` has reorganized the component structure into a "page"-based architecture.

src/ ├── App.jsx # Auth Guard & Top-level Routes definition ├── main.jsx # React entry point (contains <BrowserRouter>) ├── firebase.js # Firebase config (loads from import.meta.env) │ ├── components/ │ ├── LoginPage.jsx # Login screen ( /login ) │ ├── DashboardPage.jsx # Event list ( / ) │ ├── EditorPage.jsx # Edit + Live Preview ( /edit/:eventId ) │ ├── LivePage.jsx # Read-only Live view ( /live/:eventId ) │ │ │ ├── TimetableEditor.jsx # Core editing UI (called by EditorPage) │ ├── LiveView.jsx # Core live UI (called by EditorPage/LivePage) │ ├── DevControls.jsx # Developer panel (called by EditorPage) │ └── common.jsx # Shared UI (Icons, Modals, Buttons) │ ├── hooks/ │ ├── useTimetable.js # Core time calculation logic │ ├── useDragAndDrop.js # D&D reordering logic │ ├── useStorageUpload.js # Firebase Storage upload logic │ └── useImagePreloader.js # Image preloading for LiveView │ └── utils/ └── imageProcessor.js # Client-side image compression

---

## 4. GitHub Repository & DevOps Setup

The repository is configured with two primary CI/CD pipelines for staging and production, each tied to a specific branch.

### 4.1. Branching Strategy

* `main`: This is the **production** branch. A push to `main` triggers the `deploy.yml` workflow, building the app and deploying it to GitHub Pages.
* `phase3-dev`: This is the **staging** and primary development branch. A push to `phase3-dev` triggers the `firebase-hosting-preview.yml` workflow, deploying the app to a temporary Firebase Hosting preview channel.

### 4.2. CI/CD Workflows

#### `firebase-hosting-preview.yml` (Staging)
This workflow handles the deployment of the `phase3-dev` branch to Firebase Hosting.
* **Trigger:** `push` to `phase3-dev`.
* **Build Config:** The app is built using `npm run build`. The `vite.config.js` specifies `base: '/'`, which is required for Firebase Hosting's root-level serving.
* **Environment Secrets:** This is the crucial step. The `Build Vite app` step includes an `env:` block. This block injects GitHub Actions Secrets (e.g., `secrets.VITE_FIREBASE_API_KEY`) into the build process, making them available to `src/firebase.js` via `import.meta.env`.
* **Deployment:** Uses the `FirebaseExtended/action-hosting-deploy` action. It authenticates using the `FIREBASE_SERVICE_ACCOUNT_...` secret (an Admin SDK key) to gain permission to upload the built files (`/dist`) to a preview channel.

#### `deploy.yml` (Production)
This workflow handles the deployment of the `main` branch to GitHub Pages.
* **Trigger:** `push` to `main`.
* **Build Config:** This workflow *modifies* `vite.config.js` at build time using `sed` to change `base: '/'` to `base: '/DJTIMEKEEPER/'`. This is necessary because the app is served from a subdirectory on GitHub Pages.
* **Deployment:** Uploads the modified `/dist` folder as a Pages artifact, which is then deployed.
* **Note:** This workflow *lacks* the `env:` block for Firebase keys. If the `main` branch uses the same `src/firebase.js` logic, its deployment will fail with an `invalid-api-key` error. This must be addressed before merging `phase3-dev` to `main`.

---

## 5. Application Architecture (Phase 3)

The app is no longer a single component but a router-controlled multi-page application.

### 5.1. Routing & Page Components

The core routing logic is defined in `src/App.jsx`. `src/main.jsx` simply wraps the `<App />` component in `<BrowserRouter>`.

* **`src/App.jsx` (Auth Guard & Router):**
    * This component acts as the application's main "gatekeeper."
    * It uses `onAuthStateChanged` to track auth state (`loading`, `authed`, `no-auth`).
    * It renders the `<Routes>` element, directing users based on their auth status.
    * It also manages app-wide state like `theme` and `isDevMode` (enabled via a hardcoded Admin UID check).

* **Page Routes:**
    * `/login`: Renders `<LoginPage />`. If the user is already authenticated, they are redirected to `/`.
    * `/`: Renders `<DashboardPage />` (if authenticated). This is the user's event list. If not authenticated, they are redirected to `/login`.
    * `/edit/:eventId`: Renders `<EditorPage />` (if authenticated). This is the main workspace for a specific event. It receives the `user` object to perform an internal ownership check.
    * `/live/:eventId`: Renders `<LivePage />` (publicly accessible). This is the read-only, full-screen live view for an event. It does *not* require authentication.

### 5.2. Page Component Logic

* **`<DashboardPage />`:**
    * Fetches all documents from the `timetables` collection `where("ownerUid", "==", user.uid)`.
    * Handles creation of new event documents via `addDoc`.

* **`<EditorPage />`:**
    * The most complex page, inheriting all logic from the old `App.jsx`.
    * It fetches the single document `timetables/{eventId}`.
    * **Security Check:** It immediately compares `data.ownerUid` with the `user.uid` prop. If they do not match, it redirects the user to `/live/:eventId`.
    * Manages all event state (`timetable`, `eventConfig`, etc.) and saves changes back to Firestore using `setDoc`.
    * Manages an internal `mode` state ('edit' or 'live') to toggle between `<TimetableEditor />` and `<LiveView />` (as a preview).
    * Renders `<DevControls />` if `isDevMode` is true.

* **`<LivePage />`:**
    * A lightweight, read-only version.
    * It fetches `timetables/{eventId}` using `onSnapshot` for real-time updates.
    * It performs **no** ownership check.
    * It only renders the `<LiveView />` component and passes data to it.

---

## 6. Backend Architecture (Phase 3)

### 6.1. Authentication
* **Provider:** `GoogleAuthProvider`.
* **Flow:** The `user.uid` from a successful Google login is the central pillar of the new architecture. It is used as the foreign key (`ownerUid`) in all Firestore documents.

### 6.2. Data Model (Firestore)
* The old single-document model (`artifacts/{appId}/...`) is **deprecated**.
* **Collection:** `timetables`.
* **Document Schema:** `timetables/{eventId}`
    ```javascript
    {
      // 1. Metadata (For Ownership & Querying)
      "ownerUid": "GLGPpy6IlyWbGw15OwBPzRdCPZI2", // (string) The user.uid of the creator
      "createdAt": Timestamp, // (Timestamp) Server timestamp of creation

      // 2. Event Configuration
      "eventConfig": { // (map)
        "title": "My New Event",
        "startDate": "2025-11-18",
        "startTime": "22:00",
        "vjFeatureEnabled": false
      },

      // 3. Timetables (Arrays of maps)
      "timetable": [
        { "id": 123, "name": "DJ 1", "duration": 60, "imageUrl": "...", "color": "..." },
        { "id": 124, "name": "DJ 2", "duration": 60, ... }
      ],
      "vjTimetable": [
        { "id": 901, "name": "VJ A", "duration": 120 }
      ]
    }
    ```

### 6.3. Security Rules (`firestore.rules`)
The rules are designed to enforce the multi-tenant architecture.

* **`match /timetables/{eventId}`:**
    * `allow get: if true;`
        * **Purpose:** Allows public, unauthenticated read access for a single document.
        * **Used by:** `<LivePage />` (`/live/:eventId`) to get event data.
    * `allow list: if request.auth.uid != null;`
        * **Purpose:** Allows an authenticated user to perform *queries* against the collection.
        * **Used by:** `<DashboardPage />` (`/`). The client's query (`where("ownerUid", "==", user.uid)`), combined with the Firestore Index, ensures they *only* get their own documents.
    * `allow create: if request.auth.uid != null && request.resource.data.ownerUid == request.auth.uid;`
        * **Purpose:** Allows an authenticated user to create a new document, but only if they set the `ownerUid` field to their own ID.
        * **Used by:** `<DashboardPage />` ("Create New Event").
    * `allow update, delete: if request.auth.uid != null && resource.data.ownerUid == request.auth.uid;`
        * **Purpose:** Allows an authenticated user to modify or delete an *existing* document, but only if the `ownerUid` *already stored* in the database matches their ID.
        * **Used by:** `<EditorPage />` (for saving timetable changes).

### 6.4. Storage (Firebase Storage)
* **Path:** `dj_icons/{timestamp}_{original_name}.webp`.
* **Client-Side Processing:** Before any file is uploaded, the `useStorageUpload` hook calls `processImageForUpload`. This utility:
    1.  Resizes the image to a max dimension of 1024px.
    2.  Converts the image to `image/webp` format.
    3.  Recursively lowers the WebP quality until the file size is under `100KB` (or hits a minimum quality of `0.5`).
* **Upload:** The processed `.webp` blob is then uploaded by `uploadBytes`.

---

## 7. Core Logic (Custom Hooks)

* **`useTimetable.js`:** This is the core logic "brain" of the application.
    * **Input:** `timetable` array, `eventStartDateStr`, `eventStartTimeStr`, and `now` (a ticking Date object).
    * **Logic:** It first establishes a single, absolute `eventStartTimeDate` object using `parseDateTime`.
    * It calculates the absolute `startTimeDate` and `endTimeDate` for every item in the `timetable`.
    * **Output:** It returns the `eventStatus` ('STANDBY', 'UPCOMING', 'ON_AIR_BLOCK', 'FINISHED'), the `currentlyPlayingIndex`, and the full `schedule` array enriched with `Date` objects.

* **`useDragAndDrop.js`:** Manages pointer events (`onPointerDown`, `onPointerMove`, `onPointerUp`) to calculate and apply `translateY` transforms for list reordering, triggering a `recalculateTimes` on drop.

* **`useImagePreloader.js`:** Receives a list of image URLs. It pre-fetches them and stores loaded URLs in a `Set`. This is used by `<LiveView>` to prevent image "pop-in" during DJ transitions.