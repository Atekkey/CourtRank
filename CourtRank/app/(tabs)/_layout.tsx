import { Tabs } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

import { FiHome, FiSearch, FiAward, FiUser } from "react-icons/fi";

import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {

  return (
    <AuthProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: 'orange',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            height: Platform.OS == "web" ? 60 : 70, // Increase height
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
               <FiHome name="home" size={size} color={color} />
               //<Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="discover_leagues"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color, size }) => (
              <FiSearch name="search" size={size} color={color} />
              //<Ionicons name="search" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="my_leagues"
          options={{
            title: 'My Leagues',
            tabBarIcon: ({ color, size }) => (
              <FiAward name="trophy" size={size} color={color} />
              //<Ionicons name="trophy" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="my_profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <FiUser name="person" size={size} color={color} />
              //<Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </AuthProvider> 
  );
}