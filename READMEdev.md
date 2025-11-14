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
├── App.jsx               # Main application component
├── App.css               # Global styles
├── index.css             # Base styles
├── main.jsx              # React entry point
├── firebase.js           # Firebase configuration and initialization
├── assets/               # Static assets
├── components/           # React components
│   ├── common.jsx        # Shared UI components (buttons, modals, etc.)
│   ├── DjItem.jsx        # Individual DJ entry component
│   ├── FullTimelineView.jsx    # Full timetable view modal
│   ├── ImageEditModal.jsx      # Image upload and editing modal
│   ├── LiveView.jsx            # Live broadcast display component
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

Drag & Drop Management: useDragAndDrop.js handles reordering of DJ entries.

Image Processing: imageProcessor.js handles client-side image compression and resizing.

Responsive Design: Tailwind CSS utility-first approach ensures mobile and desktop compatibility.

Dark Mode Support: Theme preference stored in localStorage.

WakeLock API Integration: Prevents device from automatically sleeping during live broadcast.

Accurate Time Calculation: useTimetable.js uses a specific startDate and startTime as a single source of truth, eliminating "day-crossing" bugs and supporting events longer than 24 hours.

Data Model
Firestore Document Structure
The application uses a single-document model for simplicity, ideal for its current "single event" scope. All data for this instance of the app is stored in one document.

Path: artifacts/{appId}/public/sharedTimetable (Where appId is defined in src/firebase.js)

JavaScript

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
Authentication Flow
User accesses the application

Firebase Anonymous Authentication automatically signs in the user.

Edit mode (/) requires no additional authentication.

Live view (/#live) is read-only and can be shared publicly.

Performance Optimizations
Image Compression: Client-side processing reduces server load.

Lazy Loading: Images are preloaded before live display.

SWC Compilation: Faster build times via Vite.

Environment Setup
Prerequisites
Node.js (v20 or higher recommended)

npm

Firebase project with:

Firestore database

Firebase Storage bucket

Anonymous Authentication enabled

Firebase Configuration
Update src/firebase.js with your Firebase project credentials:

JavaScript

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
Development Workflow
Install dependencies: npm install

Start dev server: npm run dev

Access at http://localhost:XXXX

Run linting: npm run lint

Build for production: npm run build

Future Enhancements & Known Issues
See roadmap.md for future enhancements.

Critical Unfixed Issues (for next developer): See the Hand-off Report (dated 2025-11-15) for detailed analysis of the following:

Edit Mode Card Height: DjItem and VjItem components do not align in height in 2-column view due to structural (DOM) differences.

Live Mode VJ Bar: The VjBar component exhibits text jitter, font size inconsistencies, and vertical alignment issues.