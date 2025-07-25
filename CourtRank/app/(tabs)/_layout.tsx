import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider } from '@/contexts/AuthContext';

export default function TabLayout() {
  return (
    <AuthProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: 'orange',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            height: 60, // Increase height
            paddingBottom: 0, // Add padding at bottom
            paddingTop: 0, // Add padding at top
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="discover_leagues"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="search" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="my_leagues"
          options={{
            title: 'My Leagues',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trophy" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="my_profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </AuthProvider> 
  );
}