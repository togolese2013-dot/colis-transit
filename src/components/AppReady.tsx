'use client';

import { useEffect } from 'react';

export default function AppReady() {
  useEffect(() => {
    document.body.style.visibility = 'visible';
  }, []);

  return null;
}
