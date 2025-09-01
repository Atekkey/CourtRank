import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '../services/firebaseConfig.js'; // Adjust path as needed
import { getPlayerInfo } from '../services/firebaseService';

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  elo_array: number[];
}

interface AuthContextType {
  user: User | null;
  userInfo: UserProfile | null;
  isLoading: boolean;
  profileImage: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userInfo: null,
  isLoading: true,
  profileImage: null,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userInfo, setUserInfo] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const profile = await getPlayerInfo(user.uid);
          setUserInfo(profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserInfo({
            first_name: "...",
            last_name: "...",
            email: user.email || '',
            elo_array: [],
          });
        }
      } else {
        setUserInfo(null);
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUserInfo(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, userInfo, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}