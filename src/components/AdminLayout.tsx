import { NavLink, Outlet } from 'react-router-dom';
import styles from '../styles/AdminLayout.module.scss';

const TABS = [
  { to: 'kategorie', label: 'Kategorie' },
  { to: 'uzytkownicy', label: 'Użytkownicy' },
  { to: 'zaproszenia', label: 'Zaproszenia' },
];

function AdminLayout() {
  return (
    <div className={styles.page}>
      <h1>Administracja</h1>

      <nav className={styles.tabs} aria-label="Sekcje panelu administratora">
        {TABS.map(({ to, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? styles.tabActive : styles.tab)}>
            {label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}

export default AdminLayout;
