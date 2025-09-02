// NEED TO REVIEW

import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { osName } from 'expo-device';

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [hasPlayer, setHasPlayer] = useState(false);
  const [checkingPlayer, setCheckingPlayer] = useState(false);

  


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
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ title: 'Login', headerShown: false }} />
      <Stack.Screen name="auth/register" options={{ title: 'Register', headerShown: false }} />
    </Stack>
  );
}



export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}