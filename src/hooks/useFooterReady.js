import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Footer is hidden as soon as the route changes (sync with old content unmount),
 * then shown again after delay so it can fade in with the new Section content.
 */
export default function useFooterReady(delayMs = 400) {
  const { pathname } = useLocation();
  const [visibleForPath, setVisibleForPath] = useState(null);

  const ready = visibleForPath === pathname;

  useEffect(() => {
    const timer = window.setTimeout(() => setVisibleForPath(pathname), delayMs);
    return () => window.clearTimeout(timer);
  }, [pathname, delayMs]);

  return ready;
}
