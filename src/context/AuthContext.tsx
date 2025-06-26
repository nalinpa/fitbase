import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import '../firebase'; 

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshToken: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshToken = async () => {
    if (user) {
      try {
        await user.getIdToken(true); // Force refresh
        console.log('Token refreshed successfully');
      } catch (error) {
        console.error('Error refreshing token:', error);
      }
    }
  };

  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth State Changed:', currentUser ? `user is ${currentUser.uid}` : 'user is null');
      
      if (currentUser) {
        try {
          // Ensure we have a fresh token when auth state changes
          await currentUser.getIdToken(true);
          console.log('Fresh token obtained for user:', currentUser.uid);
          setUser(currentUser);
        } catch (error) {
          console.error('Error getting fresh token:', error);
          // Still set the user even if token refresh fails
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Auto-refresh token every 30 minutes to keep it fresh
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        await user.getIdToken(true);
        console.log('Token auto-refreshed');
      } catch (error) {
        console.error('Auto token refresh failed:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(refreshInterval);
  }, [user]);

  const value = {
    user,
    loading,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}