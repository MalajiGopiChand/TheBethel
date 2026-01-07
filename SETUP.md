# Quick Setup Guide

## Step 1: Install Dependencies

```bash
cd website
npm install
```

## Step 2: Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **the-bethel-ams**
3. Click the gear icon → **Project settings**
4. Scroll down to **"Your apps"** section
5. Click **"Add app"** → Select **Web** (</> icon)
6. Register your app (you can use any app nickname)
7. Copy the Firebase configuration object that appears

8. Open `website/src/config/firebase.ts` and replace the `firebaseConfig` object with your configuration:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 3: Run the Application

```bash
npm run dev
```

The app will open at `http://localhost:5173` (or another port if 5173 is busy).

## Step 4: Test the Application

1. You should see the role selection screen
2. Try signing up as a teacher or parent
3. Note: Parent signup requires a valid student roll number that exists in the database

## Common Issues

### Firebase Initialization Error
- Make sure you've added a Web app in Firebase Console
- Verify your Firebase config values are correct
- Check that your Firebase project has Firestore and Authentication enabled

### Authentication Errors
- Verify Email/Password authentication is enabled in Firebase Console
- Go to: Authentication → Sign-in method → Enable Email/Password

### Firestore Permission Errors
- Check Firestore security rules in Firebase Console
- Make sure authenticated users have read/write access as needed

## Building for Production

```bash
npm run build
```

The production files will be in the `dist` folder, ready to deploy to any static hosting service (Firebase Hosting, Vercel, Netlify, etc.).

