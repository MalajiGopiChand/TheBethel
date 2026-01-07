import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, query, where, getDocs, collection } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UserRole } from '../types';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        // Check if admin
        if (user.email === 'gop1@gmail.com' || user.email === 'premkumartenali@gmail.com') {
          setCurrentUser({
            uid: user.uid,
            name: 'Admin',
            email: user.email || '',
            phone: '',
            role: UserRole.ADMIN
          });
          setLoading(false);
          return;
        }

        // Try to fetch user from Firestore
        try {
          // Try teachers collection first
          const teacherDoc = await getDoc(doc(db, 'teachers', user.uid));
          if (teacherDoc.exists()) {
            setCurrentUser({ ...teacherDoc.data(), uid: user.uid });
            setLoading(false);
            return;
          }

          // Try parents collection
          const parentDoc = await getDoc(doc(db, 'parents', user.uid));
          if (parentDoc.exists()) {
            setCurrentUser({ ...parentDoc.data(), uid: user.uid });
            setLoading(false);
            return;
          }

          // User not found in Firestore
          setCurrentUser(null);
        } catch (err) {
          console.error('Error fetching user:', err);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (
    name,
    email,
    password,
    phone,
    role,
    studentName,
    studentRollNumber
  ) => {
    try {
      setError(null);
      
      // For parents, verify student exists
      if (role === UserRole.PARENT && studentRollNumber) {
        const studentsQuery = query(
          collection(db, 'students'),
          where('studentId', '==', studentRollNumber.trim())
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        
        if (studentsSnapshot.empty) {
          throw new Error('Student roll number not found. Please check with teacher.');
        }
      }

      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, { displayName: name });

      // Create user document in Firestore
      const userData = {
        uid: user.uid,
        name,
        email,
        phone,
        role
      };

      if (role === UserRole.PARENT && studentName && studentRollNumber) {
        userData.studentName = studentName;
        userData.studentId = studentRollNumber.trim();
      }

      const collectionName = role === UserRole.TEACHER ? 'teachers' : 'parents';
      await setDoc(doc(db, collectionName, user.uid), userData);

      // User will be set by auth state listener
    } catch (err) {
      setError(err.message || 'Sign up failed');
      throw err;
    }
  };

  const login = async (email, password, role) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
      // User will be set by auth state listener
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
    } catch (err) {
      setError(err.message || 'Logout failed');
      throw err;
    }
  };

  const resetPassword = async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err.message || 'Password reset failed');
      throw err;
    }
  };

  const clearError = () => setError(null);

  const value = {
    currentUser,
    firebaseUser,
    loading,
    signUp,
    login,
    logout,
    resetPassword,
    error,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

