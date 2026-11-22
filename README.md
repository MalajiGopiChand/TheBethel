# ProjectB - School Management Web Application

A comprehensive school management web application built with **React**, **JavaScript**, and **Firebase**. This web app is a complete clone of the ProjectB Android app, providing the same functionality with a beautiful Material Design UI that matches the Android experience.

## 🎨 Features

This web application includes **ALL** features from the Android app:

### 🔐 Authentication
- **Teacher Sign Up / Sign In** - Teachers can create accounts and login
- **Parent Sign Up / Sign In** - Parents register using student roll numbers
- **Role-based Access Control** - Separate dashboards for teachers and parents
- **Student Roll Number Verification** - Parents must provide valid student roll numbers

### 👨‍🏫 Teacher Features

#### Dashboard (Home Tab)
- **Overview Statistics** - Total students, attendance percentage, dollars given
- **Today's Attendance Card** - Beautiful gradient card showing present/absent counts
- **Announcements** - Real-time announcements with expandable cards
- **Top Performers Podium** - Visual podium showing top 3 students
- **Quick Actions Grid** - Colorful gradient action buttons matching Android UI:
  - Live Chat
  - Mark Attendance
  - Homework
  - Give Dollars
  - View Students
  - Leaderboard

#### Attendance Tab
- Mark attendance for all students
- View attendance summary
- Track attendance streaks
- View absent students

#### Rewards Tab
- Give dollar points to students
- View dollar history
- Track total rewards given

#### Students Tab
- Add new students (Admin only)
- View all students with search
- Edit student information (Admin only)
- Delete students (Admin only)
- View student details

#### Teachers Tab (Verified teachers only)
- Schedules/Timetable
- Teacher Progress
- Staff Attendance

#### Additional Features
- **Homework Management** - Create, edit, delete, and assign homework
- **Live Chat/Messaging** - WhatsApp-like chat interface with edit/delete
- **Leaderboard** - View student rankings by points or attendance

### 👨‍👩‍👧 Parent Features
- **Dashboard** - View child's information and statistics
- **Attendance View** - See attendance percentage and history
- **Dollar Points** - Track child's rewards
- **Homework** - View assigned homework
- **Leaderboard** - View child's ranking
- **Profile** - View detailed student information

## 🛠️ Tech Stack

- **React 18** with JavaScript
- **Material-UI (MUI)** - Material Design 3 components
- **Firebase** - Authentication, Firestore, Storage
- **React Router** - Client-side routing
- **Vite** - Fast build tool
- **date-fns** - Date formatting

## 🎨 UI Design

The website UI matches the Android app's Material Design 3:
- **Gradient Cards** - Beautiful gradient backgrounds matching Android
- **Action Grids** - Colorful action buttons with gradient backgrounds
- **Modern Cards** - Rounded corners, shadows, and proper spacing
- **Bottom Navigation** - Matches Android bottom navigation
- **Color Scheme** - Same color palette as Android app
- **Typography** - Material Design typography scale

## 📋 Setup Instructions

### 1. Install Dependencies

```bash
cd website
npm install
```

### 2. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **the-bethel-ams**
3. Add a Web app (if not already added)
4. Copy the Firebase configuration
5. Update `website/src/config/firebase.js` with your config

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

Production files will be in the `dist` folder.

## 🗄️ Database

This web app uses the **same Firebase Firestore database** as the Android app, ensuring data synchronization between web and mobile.

## 📁 Project Structure

```
website/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ActionGrid.jsx   # Action grid with gradients
│   │   ├── AttendanceCard.jsx
│   │   ├── PodiumSection.jsx
│   │   └── AnnouncementsSection.jsx
│   ├── pages/
│   │   ├── auth/            # Authentication pages
│   │   ├── teacher/         # Teacher pages
│   │   │   ├── components/  # Tab components
│   │   │   └── pages/       # Full page components
│   │   └── parent/          # Parent pages
│   ├── contexts/            # React contexts
│   ├── types/               # User role constants
│   ├── utils/               # Utilities
│   └── config/              # Firebase config
└── ...
```

## 🚀 Features Implemented

✅ All authentication flows  
✅ Teacher dashboard with all tabs  
✅ Parent dashboard  
✅ Attendance management  
✅ Rewards system  
✅ Student management  
✅ Homework management  
✅ Messaging/Chat  
✅ Leaderboard  
✅ Announcements  
✅ Material Design UI matching Android  

## 📝 Notes

- The web app connects to the same Firebase database as the Android app
- All features from the Android app are implemented in the web version
- UI design closely matches the Android Material Design 3
- Responsive design works on desktop, tablet, and mobile browsers

## 🤝 License

Part of the ProjectB school management system.
