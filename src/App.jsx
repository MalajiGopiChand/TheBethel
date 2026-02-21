import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { UserRole } from './types';
import RoleSelection from './pages/auth/RoleSelection';
import TeacherLogin from './pages/auth/TeacherLogin';
import TeacherSignUp from './pages/auth/TeacherSignUp';
import AdminLogin from './pages/auth/AdminLogin';
import ParentLogin from './pages/auth/ParentLogin';
import ParentSignUp from './pages/auth/ParentSignUp';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import ParentDashboard from './pages/parent/ParentDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import HomeworkPage from './pages/teacher/pages/HomeworkPage';
import MessagingPage from './pages/teacher/pages/MessagingPage';
import AttendancePage from './pages/teacher/pages/AttendancePage';
import AttendanceSummaryPage from './pages/teacher/pages/AttendanceSummaryPage';
import DollarsGivingPage from './pages/teacher/pages/DollarsGivingPage';
import AdminVerifyTeachersPage from './pages/admin/pages/AdminVerifyTeachersPage';
import AdminRegisteredParentsPage from './pages/admin/pages/AdminRegisteredParentsPage';
import AdminSendNotificationPage from './pages/admin/pages/AdminSendNotificationPage';
import FinanceManagementPage from './pages/admin/pages/FinanceManagementPage';
import AddStudentPage from './pages/admin/pages/AddStudentPage';
import DeleteStudentPage from './pages/admin/pages/DeleteStudentPage';
import TimetablePage from './pages/admin/pages/TimetablePage';
import SettingsPage from './pages/admin/pages/SettingsPage';
import LeaderboardPage from './pages/teacher/pages/LeaderboardPage';
import AbsentStudentsPage from './pages/teacher/pages/AbsentStudentsPage';
import StudentDetailsPage from './pages/teacher/pages/StudentDetailsPage';
import DownloadRecordsPage from './pages/teacher/pages/DownloadRecordsPage';
import TeacherSchedulePage from './pages/teacher/pages/TeacherSchedulePage';
import OfferingsPage from './pages/teacher/pages/OfferingsPage';
import ParentNotificationPage from './pages/parent/pages/ParentNotificationPage';
import DollarHistoryPage from './pages/teacher/pages/DollarHistoryPage';
import ViewStudentsPage from './pages/teacher/pages/ViewStudentsPage';
import AdminTeacherReportsPage from './pages/admin/pages/AdminTeacherReportsPage';
import TeacherProgressPage from './pages/teacher/pages/TeacherProgressPage';
import TeacherLeaderboardPage from './pages/teacher/pages/TeacherLeaderboardPage';
import TeacherAttendancePage from './pages/teacher/pages/TeacherAttendancePage';
import TeacherProfilePage from './pages/teacher/pages/TeacherProfilePage';
import { Box, CircularProgress } from '@mui/material';

function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <Box
        className="page-shell page-glow-background"
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="page-shell page-glow-background">
    <Routes>
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
                  ? '/teacher/dashboard'
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
        element={currentUser ? <Navigate to="/teacher/dashboard" replace /> : <TeacherLogin />}
      />
      <Route
        path="/auth/teacher/signup"
        element={currentUser ? <Navigate to="/teacher/dashboard" replace /> : <TeacherSignUp />}
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
            ) : (
              <TeacherDashboard />
            )
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
      <Route
        path="/parent/dashboard"
        element={
          currentUser && currentUser.role === UserRole.PARENT ? (
            <ParentDashboard />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
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
        path="/admin/teacher-reports"
        element={
          currentUser && (currentUser.role === UserRole.ADMIN || 
            currentUser.email === 'gop1@gmail.com' || 
            currentUser.email === 'premkumartenali@gmail.com') ? (
            <AdminTeacherReportsPage />
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
            <TeacherProfilePage />
          ) : (
            <Navigate to="/" replace />
          )
        }
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
        path="/parent/notifications"
        element={
          currentUser && currentUser.role === UserRole.PARENT ? (
            <ParentNotificationPage />
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
    </Routes>
    </Box>
  );
}

export default App;

