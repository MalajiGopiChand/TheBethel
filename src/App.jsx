import SchoolLoader from './components/SchoolLoader';
import { LaunchReady } from './components/AppLaunch';
import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { UserRole } from './types';
const RoleSelection = lazy(() => import('./pages/auth/RoleSelection'));
const TeacherLogin = lazy(() => import('./pages/auth/TeacherLogin'));
const TeacherSignUp = lazy(() => import('./pages/auth/TeacherSignUp'));
const AdminLogin = lazy(() => import('./pages/auth/AdminLogin'));
const ParentLogin = lazy(() => import('./pages/auth/ParentLogin'));
const ParentSignUp = lazy(() => import('./pages/auth/ParentSignUp'));
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
import ParentDashboard, { ParentHome } from './pages/parent/ParentDashboard';
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const HomeworkPage = lazy(() => import('./pages/teacher/pages/HomeworkPage'));
const MessagingPage = lazy(() => import('./pages/teacher/pages/MessagingPage'));
const AttendancePage = lazy(() => import('./pages/teacher/pages/AttendancePage'));
const AttendanceSummaryPage = lazy(() => import('./pages/teacher/pages/AttendanceSummaryPage'));
const DollarsGivingPage = lazy(() => import('./pages/teacher/pages/DollarsGivingPage'));
const AdminVerifyTeachersPage = lazy(() => import('./pages/admin/pages/AdminVerifyTeachersPage'));
const AdminRegisteredParentsPage = lazy(() => import('./pages/admin/pages/AdminRegisteredParentsPage'));
const AdminSendNotificationPage = lazy(() => import('./pages/admin/pages/AdminSendNotificationPage'));
const FinanceManagementPage = lazy(() => import('./pages/admin/pages/FinanceManagementPage'));
const AddStudentPage = lazy(() => import('./pages/admin/pages/AddStudentPage'));
const DeleteStudentPage = lazy(() => import('./pages/admin/pages/DeleteStudentPage'));
const TimetablePage = lazy(() => import('./pages/admin/pages/TimetablePage'));
const SettingsPage = lazy(() => import('./pages/admin/pages/SettingsPage'));
const LeaderboardPage = lazy(() => import('./pages/teacher/pages/LeaderboardPage'));
const AbsentStudentsPage = lazy(() => import('./pages/teacher/pages/AbsentStudentsPage'));
const StudentDetailsPage = lazy(() => import('./pages/teacher/pages/StudentDetailsPage'));
const DownloadRecordsPage = lazy(() => import('./pages/teacher/pages/DownloadRecordsPage'));
const TeacherSchedulePage = lazy(() => import('./pages/teacher/pages/TeacherSchedulePage'));
const OfferingsPage = lazy(() => import('./pages/teacher/pages/OfferingsPage'));
const ParentNotificationPage = lazy(() => import('./pages/parent/pages/ParentNotificationPage'));
const ParentComplaintsPage = lazy(() => import('./pages/parent/pages/ParentComplaintsPage'));
const DollarHistoryPage = lazy(() => import('./pages/teacher/pages/DollarHistoryPage'));
const ViewStudentsPage = lazy(() => import('./pages/teacher/pages/ViewStudentsPage'));
const TeacherProgressPage = lazy(() => import('./pages/teacher/pages/TeacherProgressPage'));
const TeacherLeaderboardPage = lazy(() => import('./pages/teacher/pages/TeacherLeaderboardPage'));
const TeacherAttendancePage = lazy(() => import('./pages/teacher/pages/TeacherAttendancePage'));
const TeacherProfilePage = lazy(() => import('./pages/teacher/pages/TeacherProfilePage'));
const TeacherActivityPage = lazy(() => import('./pages/teacher/pages/TeacherActivityPage'));
const PendingApprovalPage = lazy(() => import('./pages/auth/PendingApprovalPage'));
const AdminComplaintsPage = lazy(() => import('./pages/admin/pages/AdminComplaintsPage'));
const AdminDownloadStudentsPage = lazy(() => import('./pages/admin/pages/AdminDownloadStudentsPage'));
import { Alert, Box, Button, Typography } from '@mui/material';

import PWAInstallPrompt from './components/PWAInstallPrompt';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { isTeacherPendingAccess } from './utils/teacherVerification';

function App() {
  const { currentUser, loading, sessionError, retrySession, logout } = useAuth();
  const location = useLocation();

  // Add error boundary for routing issues in PWA mode
  useEffect(() => {
    // Handle PWA routing issues - only redirect if we're sure user is not authenticated
    if (!loading && !currentUser) {
      const path = window.location.pathname;
      // Only redirect if on a protected route
      if (path.startsWith('/teacher/') || path.startsWith('/admin/') || path.startsWith('/parent/')) {
        // Use navigate instead of window.location to avoid full page reload
        // This will be handled by the route guards below
      }
    }
  }, [currentUser, loading]);

  if (loading) {
    return (
      <Box
        className="page-shell page-glow-background"
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <SchoolLoader role={currentUser?.role} />
      </Box>
    );
  }

  if (sessionError) return <Box className="page-shell page-glow-background" sx={{ display: 'grid', placeItems: 'center', p: 3 }}><Box sx={{ maxWidth: 480 }}><LaunchReady /><Typography variant="h5" sx={{ mb: 2 }}>Reconnect to your account</Typography><Alert severity="warning">{sessionError}</Alert><Button variant="contained" onClick={retrySession} sx={{ mt: 2 }}>Retry connection</Button><Button onClick={() => logout()} sx={{ mt: 2 }}>Sign out</Button></Box></Box>;

  // Guard every teacher URL, including direct links and bookmarked pages.
  if (isTeacherPendingAccess(currentUser) &&
      location.pathname.startsWith('/teacher/') &&
      location.pathname !== '/teacher/pending-approval') {
    return <Navigate to="/teacher/pending-approval" replace />;
  }

  return (
    <Box className="page-shell page-glow-background">

      <PWAInstallPrompt />
      <Suspense fallback={<Box sx={{ display: "grid", placeItems: "center", minHeight: "55vh" }}><SchoolLoader role={currentUser?.role} /></Box>}><LaunchReady /><Routes>
      <Route
        path="/"
        element={
          currentUser ? (
            <Navigate
              to={
                currentUser.role === UserRole.ADMIN || 
                currentUser.email === 'gop1@gmail.com' || 
                currentUser.email === 'premkumartenali@gmail.com'
                  ? '/admin/dashboard'
                  : currentUser.role === UserRole.TEACHER
                  ? (isTeacherPendingAccess(currentUser) ? '/teacher/pending-approval' : '/teacher/dashboard')
                  : '/parent/dashboard'
              }
              replace
            />
          ) : (
            <RoleSelection />
          )
        }
      />
      <Route
        path="/auth/teacher/login"
        element={currentUser ? (isTeacherPendingAccess(currentUser) ? <Navigate to="/teacher/pending-approval" replace /> : <Navigate to="/teacher/dashboard" replace />) : <TeacherLogin />}
      />
      <Route
        path="/auth/teacher/signup"
        element={currentUser ? (isTeacherPendingAccess(currentUser) ? <Navigate to="/teacher/pending-approval" replace /> : <Navigate to="/teacher/dashboard" replace />) : <TeacherSignUp />}
      />
      
      <Route
        path="/auth/admin/login"
        element={currentUser ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />}
      />
      <Route
        path="/auth/parent/login"
        element={currentUser ? <Navigate to="/parent/dashboard" replace /> : <ParentLogin />}
      />
      <Route
        path="/auth/parent/signup"
        element={currentUser ? <Navigate to="/parent/dashboard" replace /> : <ParentSignUp />}
      />
      <Route
        path="/teacher/dashboard"
        element={
          currentUser && (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN) ? (
            currentUser.role === UserRole.ADMIN || 
            currentUser.email === 'gop1@gmail.com' || 
            currentUser.email === 'premkumartenali@gmail.com' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : isTeacherPendingAccess(currentUser) ? (
              <Navigate to="/teacher/pending-approval" replace />
            ) : (
              <TeacherDashboard />
            )
          ) : loading ? (
            <Box
              className="page-shell page-glow-background"
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="100vh"
            >
              <SchoolLoader role={currentUser?.role} />
            </Box>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/teacher/pending-approval"
        element={
          currentUser && currentUser.role === UserRole.TEACHER ? (
            <PendingApprovalPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          currentUser && (currentUser.role === UserRole.ADMIN || 
            currentUser.email === 'gop1@gmail.com' || 
            currentUser.email === 'premkumartenali@gmail.com') ? (
            <AdminDashboard />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="/parent" element={currentUser?.role === UserRole.PARENT
        ? <ParentDashboard key={JSON.stringify([currentUser.uid, currentUser.studentId])} />
        : <Navigate to="/" replace />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ParentHome />} />
        <Route path="notifications" element={<ParentNotificationPage />} />
        <Route path="child" element={<StudentDetailsPage />} />
        <Route path="complaints" element={<ParentComplaintsPage />} />
      </Route>
      <Route
        path="/teacher/homework"
        element={
          currentUser && (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN) ? (
            <HomeworkPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/teacher/messaging"
        element={
          currentUser && (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN || 
            currentUser.email === 'gop1@gmail.com' || 
            currentUser.email === 'premkumartenali@gmail.com') ? (
            <MessagingPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/teacher/attendance"
        element={
          currentUser && (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN) ? (
            <AttendancePage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/teacher/dollars-giving"
        element={
          currentUser && (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN) ? (
            <DollarsGivingPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/teacher/rewards"
        element={
          currentUser && (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN) ? (
            <DollarsGivingPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/teacher/students"
        element={
          currentUser && (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN) ? (
            <ViewStudentsPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/teacher/view-students"
        element={
          currentUser && (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN) ? (
            <ViewStudentsPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/admin/verify-teachers"
        element={
          currentUser && (currentUser.role === UserRole.ADMIN || 
            currentUser.email === 'gop1@gmail.com' || 
            currentUser.email === 'premkumartenali@gmail.com') ? (
            <AdminVerifyTeachersPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/admin/registered-parents"
        element={
          currentUser && (currentUser.role === UserRole.ADMIN || 
            currentUser.email === 'gop1@gmail.com' || 
            currentUser.email === 'premkumartenali@gmail.com') ? (
            <AdminRegisteredParentsPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/admin/notifications"
        element={
          currentUser && (currentUser.role === UserRole.ADMIN || 
            currentUser.email === 'gop1@gmail.com' || 
            currentUser.email === 'premkumartenali@gmail.com') ? (
            <AdminSendNotificationPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/admin/finance"
        element={
          currentUser && (currentUser.role === UserRole.ADMIN || 
            currentUser.email === 'gop1@gmail.com' || 
            currentUser.email === 'premkumartenali@gmail.com') ? (
            <FinanceManagementPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/admin/add-student"
        element={
          currentUser && (currentUser.role === UserRole.ADMIN || 
            currentUser.email === 'gop1@gmail.com' || 
            currentUser.email === 'premkumartenali@gmail.com') ? (
            <AddStudentPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      
      <Route
        path="/admin/delete-student"
        element={
          currentUser && (currentUser.role === UserRole.ADMIN || 
            currentUser.email === 'gop1@gmail.com' || 
            currentUser.email === 'premkumartenali@gmail.com') ? (
            <DeleteStudentPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/admin/timetable"
        element={
          currentUser && (currentUser.role === UserRole.ADMIN || 
            currentUser.email === 'gop1@gmail.com' || 
            currentUser.email === 'premkumartenali@gmail.com') ? (
            <TimetablePage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/admin/settings"
        element={
          currentUser && (currentUser.role === UserRole.ADMIN || 
            currentUser.email === 'gop1@gmail.com' || 
            currentUser.email === 'premkumartenali@gmail.com') ? (
            <SettingsPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/teacher/leaderboard"
        element={
          currentUser ? (
            <LeaderboardPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/admin/leaderboard"
        element={
          currentUser ? (
            <LeaderboardPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/teacher/student-leaderboard"
        element={
          currentUser ? (
            <LeaderboardPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/teacher/absent-students"
        element={
          currentUser && (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN) ? (
            <AbsentStudentsPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/teacher/student-details"
        element={
          currentUser && (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN) ? (
            <StudentDetailsPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/teacher/download-records"
        element={
          currentUser && (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN) ? (
            <DownloadRecordsPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/teacher/progress"
        element={
          currentUser && (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN) ? (
            <TeacherProgressPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/teacher/teacher-progress"
        element={
          currentUser && (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN) ? (
            <TeacherProgressPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/teacher/report-submission"
        element={
          currentUser && (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN) ? (
            <TeacherAttendancePage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/teacher/profile"
        element={
          currentUser && (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN) ? (
            <TeacherActivityPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/teacher/profile/edit"
        element={currentUser?.role === UserRole.TEACHER ? <TeacherProfilePage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/admin/teacher-progress/:teacherId"
        element={currentUser && (currentUser.role === UserRole.ADMIN || ['gop1@gmail.com', 'premkumartenali@gmail.com'].includes(currentUser.email)) ? <TeacherActivityPage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/teacher/teacher-leaderboard"
        element={
          currentUser && (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN) ? (
            <TeacherLeaderboardPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/teacher/schedule"
        element={
          currentUser && (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN) ? (
            <TeacherSchedulePage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/teacher/attendance-summary"
        element={
          currentUser && (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN) ? (
            <AttendanceSummaryPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/teacher/view-records"
        element={
          currentUser && (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN) ? (
            <Navigate to="/teacher/download-records" replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/teacher/dollar-history"
        element={
          currentUser && (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN) ? (
            <DollarHistoryPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/admin/complaints"
        element={
          currentUser && (currentUser.role === UserRole.ADMIN || 
            currentUser.email === 'gop1@gmail.com' || 
            currentUser.email === 'premkumartenali@gmail.com') ? (
            <AdminComplaintsPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/admin/download-students"
        element={
          currentUser && (currentUser.role === UserRole.ADMIN || 
            currentUser.email === 'gop1@gmail.com' || 
            currentUser.email === 'premkumartenali@gmail.com') ? (
            <AdminDownloadStudentsPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/teacher/offerings"
        element={
          currentUser && (currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN) ? (
            <OfferingsPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></Suspense>
    <SpeedInsights />
    </Box>
  );
}

export default App;

