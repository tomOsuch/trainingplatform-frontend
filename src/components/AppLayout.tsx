import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import styles from "../styles/Navbar.module.scss";

function AppLayout() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  );
}

export default AppLayout;