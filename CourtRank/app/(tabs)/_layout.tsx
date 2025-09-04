import { Tabs } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { Platform, Text, View } from 'react-native';
import * as Device from 'expo-device';

import { Ionicons } from '@expo/vector-icons';
import { Label } from '@react-navigation/elements';

export default function TabLayout() {

  return (
    <AuthProvider>
      <Tabs 
      
        screenOptions={{
          tabBarShowLabel: false,
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'white',
          
          
          
          
          
          tabBarStyle: {
            height: 60,
            backgroundColor: "#8E24AA" , 
            width: '90%',
            marginBottom: 20,
            borderRadius: 100,

            display: 'flex',
            
            flexDirection: 'row',
            alignItems: 'center',

            position: 'absolute',
            
            marginLeft:'5%',

          shadowColor: '#000',
          shadowOpacity: 0.6,
          shadowOffset: { width: 0, height: 5 },
          shadowRadius: 10,
            
             
            
          },
          tabBarIconStyle: {
            marginTop: 2,
          }
          
          

        }}

          
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color, size, focused }) => (<>
              <Ionicons name="home" size={size} color={color}  
              style={{
                borderBottomColor: focused ? 'orange' : 'transparent',
                borderBottomWidth: 2,
                transitionProperty: 'border-bottom-color',
                transitionDuration: '0.3s',
                transitionTimingFunction: 'ease-in-out',
              }}/>
              
              
             
              </>
            ),
            
          }}
        />
        <Tabs.Screen
          name="discover_leagues"
          options={{
            title: 'Discover',
            headerShown: false,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name="search" size={size} color={color} 
              style={{
                borderBottomColor: focused ? 'orange' : 'transparent',
                borderBottomWidth: 2,
              }}/>
            ),
          }}
        />
        <Tabs.Screen
          name="my_leagues"
          options={{
            title: 'My Leagues',
            headerShown: false,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name="trophy" size={size} color={color} 
              style={{
                borderBottomColor: focused ? 'orange' : 'transparent',
                borderBottomWidth: 2,
              }}/>
            ),
          }}
        />
        <Tabs.Screen
          name="my_profile"
          options={{
            title: 'Profile',
            headerShown: false,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name="person" size={size} color={color} 
              style={{
                borderBottomColor: focused ? 'orange' : 'transparent',
                borderBottomWidth: 2,
              }}/>
            ),
          }}
        />
      </Tabs>
    </AuthProvider> 
  );
}