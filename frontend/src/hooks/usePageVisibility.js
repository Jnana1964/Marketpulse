import { useEffect, useState } from 'react';

/** Tracks document.visibilityState so polling can pause in background tabs (spec section 40). */
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    function handleChange() {
      setIsVisible(!document.hidden);
    }
    document.addEventListener('visibilitychange', handleChange);
    return () => document.removeEventListener('visibilitychange', handleChange);
  }, []);

  return isVisible;
}
