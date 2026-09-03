import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/PrivateRoute.module.scss';

function PrivateRoute() {
  const { isAuthenticated, restoring } = useAuth();

  if (restoring) {
    return <p className={styles.restoring}>Ładowanie…</p>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default PrivateRoute;
