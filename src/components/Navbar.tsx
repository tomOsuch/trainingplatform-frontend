import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Navbar.module.scss';

function NavbarArt() {
  // grafika w proporcjach paska (szeroka i niska), a nie baneru karty
  return (
    <svg className={styles.art} viewBox="0 0 1600 60" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <circle cx="300" cy="6" r="34" fill="#3b82f6" opacity="0.5" />
      <circle cx="1380" cy="56" r="40" fill="#3b82f6" opacity="0.5" />
      <circle cx="1120" cy="4" r="14" fill="#60a5fa" opacity="0.4" />
      <g transform="translate(600,38)" stroke="#bfdbfe" strokeWidth="4" strokeLinecap="round" opacity="0.6">
        <line x1="10" y1="0" x2="34" y2="0" />
        <line x1="5" y1="-8" x2="5" y2="8" />
        <line x1="12" y1="-6" x2="12" y2="6" />
        <line x1="39" y1="-8" x2="39" y2="8" />
        <line x1="32" y1="-6" x2="32" y2="6" />
      </g>
      <polyline
        points="840,42 856,42 863,30 871,52 878,37 885,42 920,42"
        fill="none"
        stroke="#bfdbfe"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  );
}

function Navbar() {
  const { user, logout } = useAuth();

  const displayName = user?.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : user?.email;

  return (
    <header className={styles.navbar}>
      <NavbarArt />

      <div className={styles.left}>
        <Link to="/kalendarz" className={styles.brand}>
          Platforma Treningowa
        </Link>

        <nav className={styles.tabs}>
          <NavLink to="/kalendarz" className={({ isActive }) => (isActive ? styles.tabActive : styles.tab)}>
            Kalendarz
          </NavLink>
          <NavLink to="/dziennik" className={({ isActive }) => (isActive ? styles.tabActive : styles.tab)}>
            Dziennik
          </NavLink>
        </nav>
      </div>

      <div className={styles.right}>
        <span className={styles.userName}>{displayName}</span>
        <button type="button" className={styles.logoutButton} onClick={logout}>
          Wyloguj
        </button>
      </div>
    </header>
  );
}

export default Navbar;
