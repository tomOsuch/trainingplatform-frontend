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
import AdminInvitationsPage from './pages/AdminInvitationsPage';
import GoalsPage from './pages/GoalsPage';
import StatisticsPage from './pages/StatisticsPage';
import AdminLayout from './components/AdminLayout';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import AdminUsersPage from './pages/AdminUsersPage';
import TemplatesPage from './pages/TemplatesPage';
import CooperationPage from './pages/CooperationPage';

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
              <Route path="/szablony" element={<TemplatesPage />} />
              <Route path="/dziennik" element={<WorkoutLogPage />} />
              <Route path="/cele" element={<GoalsPage />} />
              <Route path="/statystyki" element={<StatisticsPage />} />
              <Route path="/wspolpraca" element={<CooperationPage />} />
              <Route path="/wspolpraca/zaproszenia" element={<Navigate to="/wspolpraca" replace />} />
              <Route path="/profil" element={<ProfilePage />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="/admin/kategorie" replace />} />
                  <Route path="kategorie" element={<AdminCategoriesPage />} />
                  <Route path="uzytkownicy" element={<AdminUsersPage />} />
                  <Route path="zaproszenia" element={<AdminInvitationsPage/>} />
                </Route>
                <Route path="/administracja" element={<Navigate to="/admin/zaproszenia" replace />} />
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
