// NEED TO REVIEW

import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { osName } from 'expo-device';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [hasPlayer, setHasPlayer] = useState(false);
  const [checkingPlayer, setCheckingPlayer] = useState(false);
  const { colors, isDark } = useTheme();

  const baseNavTheme = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...baseNavTheme,
    colors: {
      ...baseNavTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  


  useEffect(() => {
    if (!user || isLoading) {
      setHasPlayer(false);
      return;
    }

    const checkPlayerExists = async () => {
      setCheckingPlayer(true);
      try {
        
        const playerDoc = await getDoc(doc(db, 'players', user.uid));
        setHasPlayer(playerDoc.exists());
      } catch (error) {
        console.error('Error checking player document:', error);
        setHasPlayer(false);
      } finally {
        setCheckingPlayer(false);
      }
    };

    checkPlayerExists();
  }, [user, isLoading]);

  useEffect(() => {
    if (isLoading || checkingPlayer) return; // Don't do anything while loading

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (user && hasPlayer === false) {
      return;
    } else if (user && hasPlayer === true && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading, hasPlayer, checkingPlayer]);

  if (isLoading || checkingPlayer) {
    // You can return a loading screen here
    return null;
  }

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ title: 'Login', headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ title: 'Register', headerShown: false }} />
      </Stack>
    </NavThemeProvider>
  );
}



export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}