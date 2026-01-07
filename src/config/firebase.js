import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration - Using the same project as Android app
const firebaseConfig = {
  apiKey: "AIzaSyBgYxUIvbNp5v2cwQlqA2Us5zMQrEH43cM",
  authDomain: "the-bethel-ams.firebaseapp.com",
  projectId: "the-bethel-ams",
  storageBucket: "the-bethel-ams.firebasestorage.app",
  messagingSenderId: "776104711238",
  appId: "1:776104711238:web:4e44e917db1171460d2647"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

