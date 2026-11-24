import { useEffect, useState } from 'react';

// Tab-local drafts survive refreshes, are scoped to the signed-in user, and
// never contain passwords or authentication tokens.
export default function useSessionDraft(key, initial) {
  const [value, setValue] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(key)) ?? initial; }
    catch { return initial; }
  });
  useEffect(() => {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* Continue without draft storage. */ }
  }, [key, value]);
  return [value, setValue];
}
