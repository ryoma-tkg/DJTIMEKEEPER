Technical Stack & Architecture
Overview
DJ Timekeeper Pro is a real-time DJ timetable management application built with React and Firebase. It enables seamless synchronization between an editing interface and a live broadcast view, allowing event organizers to manage DJ schedules with drag-and-drop simplicity while displaying the current and upcoming performers on a big screen.

Technology Stack
Frontend
Framework: React 19.2.0

Build Tool: Vite 7.2.2

Compiler: SWC (via @vitejs/plugin-react-swc)

Styling: Tailwind CSS 3.4.18

Dark mode and light mode support via CSS variables

PostCSS integration for autoprefixing

Icons: React Icons 5.5.0

Package Manager: npm

Backend (BaaS)
Firebase 12.5.0

Authentication: Anonymous Authentication

Database: Firestore (real-time synchronization)

Storage: Firebase Storage (image upload and management)

Development Tools
Linting: ESLint 9.39.1 with React plugin support

PostCSS: 8.5.6 (for Tailwind CSS processing)

Autoprefixer: 10.4.22

Project Structure
src/
├── App.jsx               # Main application component (Manages state: mode, devMode, timeOffset)
├── App.css               # Global styles
├── index.css             # Base styles
├── main.jsx              # React entry point (with ErrorBoundary)
├── firebase.js           # Firebase configuration and initialization
├── assets/               # Static assets
├── components/           # React components
│   ├── common.jsx        # Shared UI components (buttons, icons, modals, etc.)
│   ├── DevControls.jsx   # Developer Mode panel (time jump, dummy data, etc.)
│   ├── DjItem.jsx        # Individual DJ entry component
│   ├── FullTimelineView.jsx    # Full timetable view modal
│   ├── ImageEditModal.jsx      # Image upload and editing modal
│   ├── LiveView.jsx            # Live broadcast display (handles DJ animation and VJ logic via `VjDisplay`)
│   └── TimetableEditor.jsx     # Main editing interface
├── hooks/                # Custom React hooks
│   ├── useDragAndDrop.js       # Drag & drop functionality
│   ├── useImagePreloader.js    # Image preloading optimization
│   ├── useStorageUpload.js     # Firebase Storage upload handling
│   └── useTimetable.js         # Timetable logic and calculations
└── utils/                # Utility functions
    └── imageProcessor.js       # Image compression and resizing
Key Features & Implementation
Real-time Synchronization: Firestore enables bidirectional data synchronization between edit mode and live mode.

Independent Animation Logic: `LiveView.jsx` handles DJ animation state, while its internal `VjDisplay` component independently handles VJ animation state. This ensures DJ and VJ transitions are decoupled and do not interfere.

Drag & Drop Management: `useDragAndDrop.js` handles reordering of DJ entries.

Developer Mode: A floating panel (`DevControls.jsx`) provides tools for testing, including time jumping, dummy data loading, and event state manipulation, managed by `App.jsx`.

Image Processing: `imageProcessor.js` handles client-side image compression and resizing.

Responsive Design: Tailwind CSS utility-first approach ensures mobile and desktop compatibility.

Dark Mode Support: Theme preference stored in localStorage.

WakeLock API Integration: Prevents device from automatically sleeping during live broadcast.

Accurate Time Calculation: `useTimetable.js` uses a specific `startDate` and `startTime` as a single source of truth, eliminating "day-crossing" bugs and supporting events longer than 24 hours.

Data Model
Firestore Document Structure
The application uses a single-document model for simplicity, ideal for its current "single event" scope. All data for this instance of the app is stored in one document.

Path: `artifacts/{appId}/public/sharedTimetable` (Where `appId` is defined in `src/firebase.js`)

```javascript
// Document content:
{
  // 1. Event Configuration
  "eventConfig": {
    "title": "DJ Timekeeper Pro",
    "startDate": "2025-11-15", // YYYY-MM-DD
    "startTime": "22:00",     // HH:MM
    "vjFeatureEnabled": true
  },

  // 2. DJ Timetable Array
  "timetable": [
    {
      "id": 1731608831234,
      "name": "DJ 1",
      "duration": 60,
      "imageUrl": "https://...",
      "color": "#F97316",
      "isBuffer": false
    },
    // ... other dj items
  ],

  // 3. VJ Timetable Array
  "vjTimetable": [
    {
      "id": 1731608845678,
      "name": "VJ 1",
      "duration": 120
    },
    // ... other vj items
  ]
}