// src/components/PrivateRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PrivateRoute() {
  const { isAuthenticated } = useAuth();

  // Outlet = "wyrenderuj zagnieżdżoną trasę" — dzięki temu jeden
  // PrivateRoute chroni wszystkie trasy włożone do środka
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default PrivateRoute;