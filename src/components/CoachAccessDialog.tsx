import Modal from './Modal';
import styles from '../styles/CooperationInviteForm.module.scss';

interface CoachAccessDialogProps {
  coachName: string;
  onClose: () => void;
}

function CoachAccessDialog({ coachName, onClose }: CoachAccessDialogProps) {
  return (
    <Modal title={`Co widzi ${coachName}`} onClose={onClose}>
      <div className={styles.info}>
        <p className={styles.infoLead}>Widzi:</p>
        <ul>
          <li>Twój kalendarz planów</li>
          <li>Twój dziennik treningów</li>
          <li>Twoje cele</li>
          <li>Twoje statystyki i wykres aktywności</li>
        </ul>

        <p className={styles.infoLead}>Może:</p>
        <ul>
          <li>ułożyć Ci plan treningowy</li>
          <li>poprawić plan, który sam Ci ułożył</li>
        </ul>

        <p className={styles.infoLead}>Nie może:</p>
        <ul>
          <li>dopisać ani zmienić nic w Twoim dzienniku — to zapis tego, co faktycznie zrobiłeś</li>
          <li>oznaczyć treningu jako zrobiony albo pominięty</li>
          <li>usunąć żadnego planu</li>
          <li>zobaczyć Twoich szablonów</li>
        </ul>

        <p className={styles.infoFoot}>
          Plany od trenera możesz edytować i usuwać jak własne — to Twój kalendarz, a plan jest propozycją, nie poleceniem.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={onClose}>
            Rozumiem
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default CoachAccessDialog;