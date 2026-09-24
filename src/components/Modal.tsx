import { ReactNode, useEffect, useRef } from 'react';
import styles from '../styles/Modal.module.scss';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Modal({ title, onClose, children, wide }: ModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;

    cardRef.current?.focus();

    const onTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !cardRef.current) return;

      const items = Array.from(cardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (!e.shiftKey && (active === last || active === cardRef.current)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && (active === first || active === cardRef.current)) {
        e.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('keydown', onTab);

    return () => {
      document.removeEventListener('keydown', onTab);
      if (opener && document.contains(opener)) opener.focus();
    };
  }, []);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={cardRef}
        tabIndex={-1}
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
