'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function ScrollRestorer() {
  const pathname = usePathname();
  const routeKey = pathname || '/';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.history.scrollRestoration = 'manual';
    } catch {}

    const hasPendingPackageTarget = sessionStorage.getItem('chine_last_package_id');
    if (hasPendingPackageTarget) {
      return;
    }

    const savedScroll = sessionStorage.getItem(`scroll:${routeKey}`);
    if (savedScroll) {
      const scrollTop = Number(savedScroll);
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollTop, left: 0, behavior: 'auto' });
      });
      return;
    }

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }, [routeKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saveScroll = () => {
      sessionStorage.setItem(`scroll:${routeKey}`, String(window.scrollY || 0));
    };

    const handleBeforeUnload = () => saveScroll();
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('scroll', saveScroll, { passive: true });

    return () => {
      saveScroll();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('scroll', saveScroll);
    };
  }, [routeKey]);

  return null;
}
