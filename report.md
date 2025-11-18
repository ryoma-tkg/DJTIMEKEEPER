Handover Report: DJ Timekeeper Pro
Date: November 18, 2025 Status: Phase 3.Y Complete (UI/UX Refinement & Critical Fixes) Next Phase: Phase 4 (Release & Pro Features)

1. Project Overview
DJ Timekeeper Pro is a real-time timetable management application for DJ/VJ events. It features a dual-interface system:

Editor Mode: For organizers to create schedules via drag-and-drop.

Live Mode: A full-screen, auto-updating display for the venue.

The project has recently transitioned from a single-page app to a multi-tenant web service using Firebase Authentication and Firestore.

2. Technology Stack
Frontend: React 19, Vite 7, Tailwind CSS 3.4.

Backend: Firebase (Authentication, Firestore, Storage).

Routing: React Router DOM 7.

Key Libraries: react-icons, react-beautiful-dnd (custom hook implementation).

Recent Changes (Phase 3.Y - UI Polish)
The following refinements were applied to improve the user experience in both Editor and Live modes.

3.1. Live View Enhancements (src/components/LiveView.jsx)
Header Behavior: Separated the event title/clock from the floor tabs. The header now dims but remains visible, while floor tabs auto-hide when inactive.

Navigation: Added a "Back" button that intelligently routes users based on their context (Editor Preview vs. Public Viewer).

Floor Transitions: Implemented a smooth fade-out/fade-in animation sequence during floor switching to prevent layout shifts and "flickering" of VJ elements.

Status Display: Added a "FLOOR FINISHED" state when all performances on a specific floor have ended.

Visual Tweaks: Increased event title size and adjusted highlight colors for better visibility.

3.2. Critical Bug Fixes
Ghost Floor Issue (src/components/EditorPage.jsx): Fixed a bug where deleting a floor caused a render crash or displayed an empty "ghost" floor. Added a guard clause to redirect to a valid floor if the current one is missing.

Preview Mode Fix: Fixed an issue where opening "Live Mode" from the Editor resulted in a blank screen and a broken back button. Data is now correctly passed to the preview component.

Loading State (src/components/LivePage.jsx): Removed the intrusive loading spinner during floor switching to ensure a seamless visual experience.

VJ Display Logic: Fixed a crash (ReferenceError) that occurred when the VJ feature was enabled but the VJ timetable was empty.

4. Project Structure
The project follows a feature-based component structure.

Plaintext

src/
├── App.jsx                 # Main Router & Auth Guard
├── firebase.js             # Firebase initialization & Config
├── main.jsx                # Entry point
├── components/
│   ├── common.jsx          # Shared UI (Icons, Modals, Buttons)
│   ├── DashboardPage.jsx   # User's Event List (Home /)
│   ├── EditorPage.jsx      # Event Logic Controller (/edit/:id)
│   ├── TimetableEditor.jsx # Drag-and-Drop Editor UI
│   ├── LivePage.jsx        # Public Viewer Controller (/live/:id)
│   ├── LiveView.jsx        # The core "On Air" display component
│   ├── FloorManagerModal.jsx # UI for managing multiple floors
│   └── DevControls.jsx     # Debugging tools (Admin only)
├── hooks/
│   ├── useTimetable.js     # Core logic for time calculations
│   ├── useDragAndDrop.js   # Custom D&D logic
│   └── useStorageUpload.js # Image compression & upload
└── utils/
    └── imageProcessor.js   # Client-side WebP conversion logic
5. Data Flow Architecture
Multi-Floor Model:

Data is stored in Firestore under timetables/{eventId}.

The structure uses a floors map: { "floor_id": { name: "Main", timetable: [...] } }.

EditorPage fetches this data and distributes it to TimetableEditor (for writing) and LiveView (for previewing).

Real-time Sync:

onSnapshot listeners in EditorPage and LivePage ensure that any change in the database is instantly reflected on all connected clients.

6. Next Steps (Phase 4)
Image Export: Implement html2canvas to allow users to download their timetables as images for social media.

Production Build: Verify vite.config.js settings for the final deployment target (GitHub Pages vs. Firebase Hosting).

Release: Final testing and public launch.