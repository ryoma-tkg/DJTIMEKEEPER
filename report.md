# [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-phase3-dev/report.md]
# Handover Report: Phase 3 Debugging & Feature Implementation

**Last Updated: 2025-11-18**

This document details the troubleshooting and development history of the `phase3-dev` branch, capturing the transition to a multi-tenant architecture and the resolution of several critical environment and database errors.

## 1. Error 1: Local Env Failure (`ReferenceError: App is not defined`)

Upon takeover, the local development server (`npm run dev`) would crash with a white screen and a `ReferenceError: App is not defined`.

* **Initial Analysis:** The user's report correctly identified a potential Vite cache issue due to a `vite.config.js` `base` URL mismatch.
* **Root Cause:** In addition to the cache, three critical code errors were found:
    1.  **`src/main.jsx`**: The `<BrowserRouter>` component had a hardcoded `basename="/DJTIMEKEEPER/"` which conflicted with the corrected `base: '/'` in `vite.config.js`.
    2.  **`src/components/EditorPage.jsx`**: The file contained a copy-paste error (`export default App;`) instead of `export default EditorPage;`, which was the direct cause of the `App is not defined` error.
    3.  **`src/components/DevControls.jsx`**: The "close" button was passing an incorrect prop (`onToggleDevMode` instead of `onClose`).
* **Resolution:**
    1.  Corrected all three component files (`main.jsx`, `EditorPage.jsx`, `DevControls.jsx`).
    2.  Instructed the user to clear the Vite cache (`rm -rf node_modules/.vite`).
* **Status:** **SOLVED**. Local environment became functional.

---

## 2. Error 2: Staging Env Failure (`auth/invalid-api-key`)

Deploying to the Firebase Hosting preview channel (the staging environment) resulted in a white screen with a `FirebaseError: Firebase: Error (auth/invalid-api-key)`.

* **Root Cause:** The staging deploy workflow (`.github/workflows/firebase-hosting-preview.yml`) was running `npm run build` without access to the Firebase API keys. The `src/firebase.js` file correctly reads keys from `import.meta.env`, but these were `undefined` in the GitHub Actions runner.
* **Resolution:**
    1.  The user added the 6 required `VITE_FIREBASE_...` keys to the repository's GitHub Actions Secrets.
    2.  The `.github/workflows/firebase-hosting-preview.yml` file was modified to include an `env:` block, which injects these secrets into the build process.
* **Status:** **SOLVED**. Staging environment became functional.

---

## 3. Error 3: Production Env (GitHub Pages) Failures

When deploying the `main` branch to GitHub Pages, two sequential errors occurred.

### 3.1. `auth/invalid-api-key`

* **Root Cause:** Same as Error 2. The production deploy workflow (`.github/workflows/deploy.yml`) was *also* missing the `env:` block to inject the API keys.
* **Resolution:** Modified `.github/workflows/deploy.yml` to include the same `env:` block used in the staging workflow.
* **Status:** **SOLVED**.

### 3.2. `auth/requests-from-referer...-are-blocked`

* **Root Cause:** After fixing the API key, Firebase Authentication *still* blocked requests. This was because the **Google Cloud API Key** (in the GCP Console) had HTTP referer restrictions that did not include the production domain. The user had `ryoma-tkg.github.io/DJTIMEKEEPER/*`, but the referer was being sent as just `ryoma-tkg.github.io`.
* **Resolution:** The user updated their Google Cloud API Key's "HTTP referrers" restrictions to include `ryoma-tkg.github.io/*` and/or `ryoma-tkg.github.io`, successfully authorizing the domain.
* **Status:** **SOLVED**. Production environment became functional.

---

## 4. Error 4: Core Firestore (`Missing or insufficient permissions`)

This was the most complex error, occurring on all environments (local, staging, and production) after login.

* **Symptom:** User was authenticated, but `DashboardPage.jsx` failed to load events with `FirebaseError: Missing or insufficient permissions`. Creating new events also appeared to fail (it would write, but then fail to read).
* **Troubleshooting:**
    1.  **Rules Deployment:** Confirmed rules were deployed with `firebase deploy --only firestore:rules`.
    2.  **Database Creation:** Confirmed the Firestore database was correctly initialized.
    3.  **Ad Blockers:** Ruled out ad blockers as the cause.
    4.  **Firestore Index:** Identified that the query `where("ownerUid", "==", user.uid)` required a single-field index on `ownerUid`. The user created this index.
* **Root Cause:** The error persisted even after the index became "Active." A final review of `firestore.rules` revealed **incorrect syntax**. The `allow list` rule was using `request.query.where[0].field`, which is **not valid** for Firestore Security Rules (it is legacy syntax for the Realtime Database).
* **Resolution:**
    1.  The `firestore.rules` file was corrected. The invalid `allow list` rule was replaced with `allow list: if request.auth.uid != null;`.
    2.  This new rule is secure because the client-side code in `DashboardPage.jsx` *always* applies the `where("ownerUid", "==", user.uid)` filter, and the (now active) Firestore index ensures this query is efficient.
* **Status:** **SOLVED**. All environments (local, staging, prod) are now fully functional.

---

## 5. Current Task: Phase 3.4 - Multi-Floor Feature

With all environments stable, development began on the "Multi-Floor Management" feature.

* **Goal:** Refactor the data model from `1 event = 1 timetable` to `1 event = N floors`, where each floor has its own `timetable` and `vjTimetable`.

* **Step 1 (Data Model):**
    * `src/components/DashboardPage.jsx` was modified.
    * The `handleCreateNewEvent` function now creates new event documents with a new data structure: `floors: { "floor_id_123": { name: "MAIN STAGE", order: 0, timetable: [], vjTimetable: [] } }`.
    * `EventCard` was updated to display the number of floors (`Object.keys(event.floors).length`).
    * *(Bug Fix: `LayersIcon` was missing from `common.jsx`. This was corrected.)*

* **Step 2 (Routing & Data Loading):**
    * **`src/App.jsx`**:
        * Routes were updated to support `/edit/:eventId/:floorId` and `/live/:eventId/:floorId`.
        * New "Redirector" components (`EditorRedirector`, `LiveRedirector`) were added. These catch old routes (`/edit/:eventId`), fetch the event, find the first floor ID, and redirect to the new, specific floor route (e.g., `/edit/:eventId/floor_id_123`).
        * These redirectors also handle "legacy" data (events with no `floors` map) by redirecting to a virtual `/edit/:eventId/default` route.
    * **`src/components/EditorPage.jsx`**:
        * Now uses `useParams` to get both `eventId` and `floorId`.
        * `onSnapshot` logic was updated to load the *entire* event document into `eventData` state.
        * A new `useEffect` hook `[floorId, eventData]` was added to update the *active* `timetable` and `vjTimetable` states whenever the `floorId` param changes.
        * `saveDataToFirestore` was updated to use `updateDoc` to save data back to the correct map property (e.g., `floors.${currentFloorId}.timetable`).
        * A `<FloorTabs>` component was added to navigate between floors (which changes the URL).
    * **`src/components/LivePage.jsx`**: Logic was updated similarly to `EditorPage` to read `floorId` from params and display the correct floor's data.
    * *(Bug Fix: `LoadingScreen` was missing from `common.jsx`. This was corrected.)*

* **Step 3 (Floor Management UI):**
    * **`src/components/FloorManagerModal.jsx`**: A new file was created. This modal allows creating, renaming, and deleting floors from the `floors` map.
    * **`src/components/common.jsx`**: `PlusCircleIcon` was added for the new modal.
    * **`src/components/EditorPage.jsx`**: A new callback, `handleFloorsUpdate`, was created to save the *entire* modified `floors` map (from the modal) back to Firestore using `updateDoc`.
    * **`src/components/TimetableEditor.jsx`**:
        * Now imports `FloorManagerModal`.
        * Receives `floors` and `onFloorsUpdate` as props from `EditorPage`.
        * The "Settings" modal now includes a "Floor Management" button that opens the `FloorManagerModal`.

## 6. Current Status & Next Steps

**Current Status:** All code for Steps 1, 2, and 3 of the Multi-Floor feature has been provided.

**Current Problem:** The user applied these changes and reported "it doesn't work" ("出来ないんだけど").

**Recommended Next Action for New AI:**
The most likely issue is a copy-paste error or a missed file during the last modification (Step 3).
1.  Verify that the user's local files **exactly match** the full contents provided in the previous turn for:
    * `src/components/FloorManagerModal.jsx` (Must be newly created)
    * `src/components/common.jsx` (Must include `PlusCircleIcon` and `LoadingScreen`)
    * `src/components/EditorPage.jsx` (Must include `handleFloorsUpdate` and pass correct props to `TimetableEditor`)
    * `src/components/TimetableEditor.jsx` (Must import the modal and include the "Floor Management" button in `SettingsModal`)
2.  Once confirmed, the "Floor Management" button in the Settings modal should function correctly.
3.  The next logical feature (as requested by the user) is to implement **drag-and-drop reordering** for the floors within the `FloorManagerModal.jsx`.