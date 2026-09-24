import { ReactNode, useEffect } from 'react';
import styles from '../styles/Modal.module.scss';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

function Modal({ title, onClose, children, wide }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      {/* role + aria-modal robią z tego okno także dla czytnika ekranu; aria-label
          daje mu nazwę, po której da się je jednoznacznie wskazać - również w testach */}
      <div
        className={wide ? styles.cardWide : styles.card}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2>{title}</h2>
          <button className={styles.close} onClick={onClose} aria-label="Zamknij">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default Modal;
