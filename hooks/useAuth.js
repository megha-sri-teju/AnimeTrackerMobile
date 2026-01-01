import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase'; // Correct path from root/hooks/useAuth.js

/**
 * Custom hook to manage Firebase user authentication state.
 * @returns {object} - An object containing the user and loading state.
 * - user: The Firebase user object (or null if not logged in).
 * - loading: Boolean, true while checking auth state, false otherwise.
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged returns an 'unsubscribe' function
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        setUser(user);
      } else {
        // User is signed out
        setUser(null);
      }
      // Set loading to false once we have an auth state.
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { user, loading };
}