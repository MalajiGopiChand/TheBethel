import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to track the previous location in React Router
 * Returns the previous location pathname before the current one
 */
export const usePreviousLocation = () => {
  const location = useLocation();
  const prevLocationRef = useRef(null);
  const currentLocationRef = useRef(location.pathname);

  useEffect(() => {
    // Only update previous if the location actually changed
    if (currentLocationRef.current !== location.pathname) {
      prevLocationRef.current = currentLocationRef.current;
      currentLocationRef.current = location.pathname;
    }
  }, [location.pathname]);

  return prevLocationRef.current;
};
