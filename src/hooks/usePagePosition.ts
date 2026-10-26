import { useEffect, useRef, useState } from 'react';

const storageKey = 'longterm:page-position';

function readPosition(): { propertyId: string; scrollY: number } {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    return {
      propertyId: typeof saved?.propertyId === 'string' ? saved.propertyId : '',
      scrollY: Number.isFinite(saved?.scrollY) ? Math.max(0, saved.scrollY) : 0,
    };
  } catch {
    return { propertyId: '', scrollY: 0 };
  }
}

export function usePagePosition(ready: boolean) {
  const [saved] = useState(readPosition);
  const [propertyId, setPropertyId] = useState(saved.propertyId);
  const restoring = useRef(saved.scrollY > 0);

  // Save tab changes immediately, including refreshes before the next scroll.
  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({
        propertyId,
        scrollY: restoring.current ? saved.scrollY : window.scrollY,
      }));
    } catch { /* Storage can be unavailable. */ }
  }, [propertyId, ready, saved]);

  useEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    return () => { history.scrollRestoration = previous; };
  }, []);

  useEffect(() => {
    if (!ready) return;

    const persist = () => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({
          propertyId,
          scrollY: restoring.current ? saved.scrollY : window.scrollY,
        }));
      } catch { /* Storage may be disabled by browser settings. */ }
    };

    const restore = () => {
      if (restoring.current) window.scrollTo({ top: saved.scrollY, behavior: 'instant' });
    };
    const stopRestoring = () => {
      restoring.current = false;
    };
    // Lazy components and web fonts can change the page height after data arrives.
    const observer = new ResizeObserver(restore);
    observer.observe(document.body);
    restore();
    const timeout = window.setTimeout(() => {
      stopRestoring();
      observer.disconnect();
      persist();
    }, 8000);
    const onPageHide = () => persist();
    window.addEventListener('scroll', persist, { passive: true });
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('wheel', stopRestoring, { passive: true });
    window.addEventListener('touchstart', stopRestoring, { passive: true });
    window.addEventListener('pointerdown', stopRestoring, { passive: true });
    window.addEventListener('keydown', stopRestoring);
    persist();
    return () => {
      clearTimeout(timeout);
      observer.disconnect();
      window.removeEventListener('scroll', persist);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('wheel', stopRestoring);
      window.removeEventListener('touchstart', stopRestoring);
      window.removeEventListener('pointerdown', stopRestoring);
      window.removeEventListener('keydown', stopRestoring);
    };
  }, [ready, propertyId, saved]);

  return [propertyId, setPropertyId] as const;
}
