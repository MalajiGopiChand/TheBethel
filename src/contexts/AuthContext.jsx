import { unregisterPushTokenForUser } from '../services/notificationService';
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, query, where, getDocs, collection } from "../services/notifyingFirestore";
import { auth, db } from '../config/firebase';
import { UserRole } from '../types';
import { mapTeacherDocToCurrentUser } from '../utils/teacherVerification';

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
  const signupInProgress = useRef(false);

  const [sessionError, setSessionError] = useState('');
  const [sessionRetry, setSessionRetry] = useState(0);
  useEffect(() => {
    let disposed = false;
    let generation = 0;
    const unsubscribe = onAuthStateChanged(auth, async user => {
      const request = ++generation;
      setFirebaseUser(user);
      if (signupInProgress.current) return;
      setLoading(true);
      setSessionError('');
      const isCurrent = () => !disposed && request === generation;
      let timeout;
      try {
        if (!user) { setCurrentUser(null); return; }
        if (['gop1@gmail.com', 'premkumartenali@gmail.com'].includes(user.email?.toLowerCase())) {
          setCurrentUser({ uid: user.uid, name: user.displayName || 'Admin', email: user.email, phone: '', role: UserRole.ADMIN });
          return;
        }
        const profile = await Promise.race([
          (async () => {
            const teacher = await getDoc(doc(db, 'teachers', user.uid));
            if (teacher.exists()) return mapTeacherDocToCurrentUser(teacher.data(), user);
            const parent = await getDoc(doc(db, 'parents', user.uid));
            if (parent.exists()) {
              const data = parent.data();
              return { ...data, uid: user.uid, role: data.role || UserRole.PARENT, email: data.email || user.email || '', name: data.name || user.displayName || 'Parent' };
            }
            throw new Error('Your account profile is unavailable. Contact the administrator or retry.');
          })(),
          new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Restoring your session is taking too long. Check your connection and retry.')), 15000); }),
        ]);
        if (isCurrent()) setCurrentUser(profile);
      } catch (err) {
        if (isCurrent()) {
          setCurrentUser(null);
          setSessionError(err.message || 'Could not restore your session. Please retry.');
        }
      } finally {
        clearTimeout(timeout);
        if (isCurrent()) setLoading(false);
      }
    });
    return () => { disposed = true; generation++; unsubscribe(); };
  }, [sessionRetry]);

  const signUp = async (
    name,
    email,
    password,
    phone,
    role,
    studentName,
    studentRollNumber
  ) => {
    let createdUser = null;
    let profileWriteStarted = false;
    try {
      setError(null);
      if (![UserRole.PARENT, UserRole.TEACHER].includes(role)) {
        throw new Error('Choose a parent or teacher account.');
      }
      if (role === UserRole.PARENT && (!studentName?.trim() || !studentRollNumber?.trim())) {
        throw new Error('Enter the student name and roll number.');
      }
      signupInProgress.current = true;
      
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      createdUser = user;

      // Update display name
      await updateProfile(user, { displayName: name });

      // For parents, verify student exists (Now authenticated)
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

      if (role === UserRole.TEACHER) {
        userData.isVerified = false;
        userData.isApproved = false;
        userData.approvalState = 'pending';
      }

      const collectionName = role === UserRole.TEACHER ? 'teachers' : 'parents';
      profileWriteStarted = true;
      await setDoc(doc(db, collectionName, user.uid), userData);

      if (role === UserRole.TEACHER) {
        const created = await getDoc(doc(db, 'teachers', user.uid));
        if (!created.exists()) {
          throw new Error('Could not save teacher profile. Check Firestore rules and network.');
        }
      }

      // Manually set currentUser to trigger immediate routing
      setCurrentUser(
        role === UserRole.TEACHER ? mapTeacherDocToCurrentUser(userData, user) : userData
      );

      return { status: 'success' };
    } catch (err) {
      let message = err.message || 'Sign up failed';
      // Only remove a newly created account before any profile write was attempted.
      // A failed network response after setDoc may still represent a saved profile.
      if (createdUser && !profileWriteStarted) {
        try {
          await deleteUser(createdUser);
        } catch (cleanupError) {
          console.error('Could not clean up incomplete signup:', cleanupError);
          message += ' Account cleanup failed. Contact the administrator before registering again.';
        }
      }
      if (createdUser) {
        if (profileWriteStarted) {
          message += ' Your account was created. Try signing in; if your profile is unavailable, contact the administrator.';
        }
        await firebaseSignOut(auth).catch(() => {});
        setCurrentUser(null);
        setFirebaseUser(null);
      }
      setError(message);
      throw err;
    } finally {
      signupInProgress.current = false;
      setLoading(false);
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
      await unregisterPushTokenForUser().catch(error => console.warn('Could not unregister device notifications:', error.code));
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

  /** Re-load teachers/parents profile from Firestore (e.g. after admin verification). */
  const refreshUserProfile = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (user.email === 'gop1@gmail.com' || user.email === 'premkumartenali@gmail.com') {
      setCurrentUser({
        uid: user.uid,
        name: 'Admin',
        email: user.email || '',
        phone: '',
        role: UserRole.ADMIN
      });
      return;
    }

    try {
      const teacherDoc = await getDoc(doc(db, 'teachers', user.uid));
      if (teacherDoc.exists()) {
        setCurrentUser(mapTeacherDocToCurrentUser(teacherDoc.data(), user));
        return;
      }
      const parentDoc = await getDoc(doc(db, 'parents', user.uid));
      if (parentDoc.exists()) {
        const parentData = parentDoc.data();
        setCurrentUser({
          ...parentData,
          uid: user.uid,
          role: parentData.role || UserRole.PARENT,
          email: parentData.email || user.email || '',
          name: parentData.name || user.displayName || 'Parent'
        });
      }
    } catch (e) {
      console.error('refreshUserProfile:', e);
    }
  }, []);

  const value = {
    currentUser,
    sessionError,
    retrySession: () => setSessionRetry(value => value + 1),
    firebaseUser,
    loading,
    signUp,
    login,
    logout,
    resetPassword,
    refreshUserProfile,
    error,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

