import BannerArt from "./BannerArt";
import styles from "../styles/AuthForm.module.scss";

function AuthBanner() {
  return (
    <div className={styles.banner}>
      <BannerArt />
      <span>Platforma Treningowa</span>
    </div>
  );
}

export default AuthBanner;