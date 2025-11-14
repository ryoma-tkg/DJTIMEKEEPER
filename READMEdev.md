# Technical Stack & Architecture

## Overview

DJ Timekeeper Pro is a real-time DJ timetable management application built with React and Firebase. It enables seamless synchronization between an editing interface and a live broadcast view, allowing event organizers to manage DJ schedules with drag-and-drop simplicity while displaying the current and upcoming performers on a big screen.

## Technology Stack

### Frontend
- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.2
- **Compiler**: SWC (via `@vitejs/plugin-react-swc`)
- **Styling**: Tailwind CSS 3.4.18
  - Dark mode and light mode support via CSS variables
  - PostCSS integration for autoprefixing
- **Icons**: React Icons 5.5.0
- **Package Manager**: npm

### Backend (BaaS)
- **Firebase 12.5.0**
  - **Authentication**: Anonymous Authentication
  - **Database**: Firestore (real-time synchronization)
  - **Storage**: Firebase Storage (image upload and management)

### Development Tools
- **Linting**: ESLint 9.39.1 with React plugin support
- **PostCSS**: 8.5.6 (for Tailwind CSS processing)
- **Autoprefixer**: 10.4.22

## Project Structure

```
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
```

## Key Features & Implementation

### 1. Real-time Synchronization
- Firestore enables bidirectional data synchronization between edit mode and live mode
- Changes made in edit mode are instantly reflected in live view without page refresh
- Uses Firestore's real-time listeners for automatic updates

### 2. Drag & Drop Management
- `useDragAndDrop.js` handles reordering of DJ entries
- Supports both mouse and touch interactions for mobile compatibility
- Maintains proper order in Firestore on each change

### 3. Image Processing
- `imageProcessor.js` handles client-side image compression and resizing
- Optimizes images before upload to Firebase Storage
- Reduces bandwidth and improves performance for large image sets
- `useImagePreloader.js` prefetches images for smooth live display

### 4. Responsive Design
- Tailwind CSS utility-first approach ensures mobile and desktop compatibility
- Adaptive layouts for different screen sizes
- Optimized for devices from iPhone SE to large displays

### 5. Dark Mode Support
- Theme preference stored in `localStorage`
- Automatic detection of system theme preference
- CSS variables enable easy theme switching

### 6. WakeLock API Integration
- Prevents device from automatically sleeping during live broadcast
- Essential for unattended large screen displays

## Build & Deployment

### Scripts
```json
{
  "dev": "vite",           // Start development server
  "build": "vite build",   // Build for production
  "lint": "eslint .",      // Run ESLint checks
  "preview": "vite preview" // Preview production build
}
```

### Configuration
- **Vite Config**: `vite.config.js`
  - React SWC plugin for fast compilation
  - Base path set to `/DJTIMEKEEPER/` for GitHub Pages deployment
- **Tailwind Config**: `tailwind.config.js`
  - Configured for dark mode support
  - Custom color scheme for DJ themes
- **ESLint Config**: `eslint.config.js`
  - Enforces React best practices

## Data Model

### Firestore Collection Structure

**`events` collection**
```
{
  id: string,
  title: string,
  startTime: timestamp,
  items: [
    {
      id: string,
      type: "dj" | "buffer",
      name: string,
      duration: number,        // in minutes
      color: string,           // hex color code
      imageUrl: string,        // Firebase Storage URL or external URL
      startTime: timestamp,    // calculated
      endTime: timestamp       // calculated
    }
  ],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Browser Compatibility

- Modern browsers supporting:
  - ES2020+ JavaScript features
  - CSS Grid and Flexbox
  - Firestore database
  - WakeLock API (graceful fallback for older browsers)

## Authentication Flow

1. User accesses the application
2. Firebase Anonymous Authentication automatically signs in the user
3. Edit mode requires no additional authentication (simplified for this use case)
4. Live view URL can be shared publicly without credentials

## Performance Optimizations

1. **Image Compression**: Client-side processing reduces server load
2. **Lazy Loading**: Images are preloaded before live display
3. **Virtual Scrolling**: Timeline view efficiently handles large DJ lists
4. **Firestore Indexing**: Optimized queries for real-time updates
5. **SWC Compilation**: Faster build times compared to traditional Babel

## Environment Setup

### Prerequisites
- Node.js (v16 or higher recommended)
- npm or yarn
- Firebase project with:
  - Firestore database
  - Firebase Storage bucket
  - Anonymous Authentication enabled

### Firebase Configuration
Update `src/firebase.js` with your Firebase project credentials:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Development Workflow

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Access at `http://localhost:5173`
4. Make changes to components and hooks
5. Hot Module Replacement (HMR) updates changes instantly
6. Run linting: `npm run lint`
7. Build for production: `npm run build`

## Future Enhancements

- User authentication with role-based access control
- Multiple event management
- Time offset adjustments during live broadcast
- Sound notifications for next DJ
- Event statistics and analytics
- Integration with DJ hardware for automatic timing
- QR code generation for live view sharing
