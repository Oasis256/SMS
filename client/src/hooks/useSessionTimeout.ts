import { useEffect, useRef, useCallback } from 'react';
import { SESSION_TIMEOUT_MS } from '../../../shared/const';
import { trpc } from '@/lib/trpc';

/**
 * Auto-logout after 30 minutes of inactivity.
 * Listens for mouse, keyboard, scroll, and touch events to reset the timer.
 */
export function useSessionTimeout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutMutation = trpc.auth.logout.useMutation();

  const doLogout = useCallback(() => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = '/';
      },
    });
  }, [logoutMutation]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doLogout, SESSION_TIMEOUT_MS);
  }, [doLogout]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer(); // Start the timer

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);
}
