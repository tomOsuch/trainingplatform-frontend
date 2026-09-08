import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CalendarPage from './pages/CalendarPage';
import AppLayout from './components/AppLayout';
import WorkoutLogPage from './pages/WorkoutLogPage';
import ProfilePage from './pages/ProfilePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminRoute from './components/AdminRoute';
import AdminPage from './pages/AdminPage';
import GoalsPage from './pages/GoalsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<PrivateRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/kalendarz" element={<CalendarPage />} />
              <Route path="/dziennik" element={<WorkoutLogPage />} />
              <Route path="/cele" element={<GoalsPage />} />
              <Route path="/profil" element={<ProfilePage />} />
              <Route element={<AdminRoute />}>
                <Route path="/administracja" element={<AdminPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/kalendarz" replace />} />
          <Route path="*" element={<Navigate to="/kalendarz" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
