import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminRoute() {
    const { user } = useAuth();
    return user?.role === "ADMIN" ? <Outlet /> : <Navigate to="/kalendarz" replace />;
}

export default AdminRoute;