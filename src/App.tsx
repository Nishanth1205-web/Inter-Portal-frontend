import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { QuestionBankPage } from './pages/QuestionBankPage';
import { TestManagementPage } from './pages/TestManagementPage';
import { LearningMaterialsPage } from './pages/LearningMaterialsPage';
import { StudentAssessmentPage } from './pages/StudentAssessmentPage';
import { ExamRoomPage } from './pages/ExamRoomPage';
import { StudentLearningPage } from './pages/StudentLearningPage';
import { EvaluationsPage } from './pages/EvaluationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { AcademicsPage } from './pages/AcademicsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Dedicated Fullscreen Exam Room (No Sidebar Layout) */}
          <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
            <Route path="/assessment/:testId" element={<ExamRoomPage />} />
            <Route path="/assessment/:testId/result" element={<ExamRoomPage />} />
          </Route>

          {/* Authenticated Application Layout with Sidebar and Topbar */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Student Portal Pages */}
              <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
                <Route path="/student/assessments" element={<StudentAssessmentPage />} />
                <Route path="/student/learning" element={<StudentLearningPage />} />
              </Route>

              {/* Faculty & Instructor Pages */}
              <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']} />}>
                <Route path="/questions" element={<QuestionBankPage />} />
                <Route path="/tests" element={<TestManagementPage />} />
                <Route path="/materials" element={<LearningMaterialsPage />} />
                <Route path="/evaluations" element={<EvaluationsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Route>

              {/* Super Admin Only Pages */}
              <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
                <Route path="/users" element={<UserManagementPage />} />
                <Route path="/academics" element={<AcademicsPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
