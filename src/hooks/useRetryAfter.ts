import { useEffect, useState } from 'react';

export function useRetryAfter() {
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (blockedUntil === null) return;

    const tick = () => {
      const left = Math.max(0, Math.ceil((blockedUntil - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) setBlockedUntil(null);
    };

    tick(); // od razu, bez czekania na pierwszy interwał
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [blockedUntil]);

  const blockFor = (seconds: number) => setBlockedUntil(Date.now() + seconds * 1000);
  const clear = () => setBlockedUntil(null);

  return { blocked: blockedUntil !== null, secondsLeft, blockFor, clear };
}