import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CalendarPage from "./pages/CalendarPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<PrivateRoute />}>
            <Route path="/kalendarz" element={<CalendarPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/kalendarz" replace />} />
          <Route path="*" element={<Navigate to="/kalendarz" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;