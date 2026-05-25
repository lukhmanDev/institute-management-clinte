import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminOnlyRoute from "./components/auth/AdminOnlyRoute";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import TeacherDashboard from "./pages/dashboards/TeacherDashboard";
import LibraryDashboard from "./pages/dashboards/LibraryDashboard";
import Students from "./pages/Students";
import Fees from "./pages/Fees";
import Teachers from "./pages/Teachers";
import Exams from "./pages/Exams";
import Reports from "./pages/Reports";
import Association from "./pages/Association";
import Council from "./pages/Council";
import StudentProfile from "./pages/StudentProfile";
import Remarks from "./pages/Remarks";
import Notifications from "./pages/Notifications";
import Classes from "./pages/Classes";
import Subjects from "./pages/Subjects";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import LibraryPage from "./pages/Library";
import Login from "./pages/Login";

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route path="/dashboard/student" element={<StudentDashboard />} />
              <Route path="/dashboard/teacher" element={<TeacherDashboard />} />
              <Route path="/dashboard/library" element={<LibraryDashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/students" element={<Students />} />
              <Route path="/students/:id" element={<StudentProfile />} />
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/fees" element={<Fees />} />
              <Route path="/classes" element={<Classes />} />
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/attendance" element={<Classes />} />
              <Route path="/exams" element={<Exams />} />
              <Route path="/remarks" element={<Remarks />} />
              <Route path="/association" element={<Association />} />
              <Route path="/council" element={<Council />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route
                path="/settings"
                element={
                  <AdminOnlyRoute>
                    <Settings />
                  </AdminOnlyRoute>
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
