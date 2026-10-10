import { Tabs } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { Platform, View } from 'react-native';
import { ThemedText as Text } from '@/components/Themed';
import * as Device from 'expo-device';
import {osName} from 'expo-device';

import { FiHome, FiSearch, FiAward, FiUser } from "react-icons/fi";

import { Ionicons } from '@expo/vector-icons';
import { Label } from '@react-navigation/elements';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    
    <AuthProvider>
      <Tabs 
      
        screenOptions={{
          tabBarShowLabel: false,
        
          tabBarInactiveTintColor: colors.onPrimary,
          tabBarActiveTintColor: Platform.OS ==='web' ? colors.accent : colors.onPrimary,
          
          
          
          
          
          tabBarStyle: {
            height: 60,
            backgroundColor: colors.primary,
            borderTopWidth: 0,
            width: '90%',
            marginBottom: 20,
            borderRadius: 100,

            display: 'flex',
            
            flexDirection: 'row',
            alignItems: 'center',

            position: 'absolute',
            
            marginLeft:'5%',

          shadowColor: colors.shadow,
          shadowOpacity: 0.6,
          shadowOffset: { width: 0, height: 5 },
          shadowRadius: 10,
            
             
            
          },
          tabBarIconStyle: {
            marginTop: 2,
          },
          sceneStyle: { backgroundColor: colors.background },
          
          

        }}

          
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,
            
            tabBarIcon: ({ color, size, focused }) => 
            (Platform.OS === 'web' ?
            
            
              <FiHome name="home" size={size} color={color}  
              style={{
                borderBottomColor: focused ? colors.accent : 'transparent',
                borderBottomWidth: 2,
                transitionProperty: 'border-bottom-color',
                transitionDuration: '0.3s',
                transitionTimingFunction: 'ease-in-out',
              }}/>


              
              
             
              
              
            
           
            : 
              
              <Ionicons name="home" size={size} color={color}  
              style={{
                borderBottomColor: focused ? colors.accent : 'transparent',
                borderBottomWidth: 2,
                transitionProperty: 'border-bottom-color',
                transitionDuration: '0.3s',
                transitionTimingFunction: 'ease-in-out',
              }}/>
              
              
             
              
            
            
            )
            
          }}
        />
        <Tabs.Screen
          name="discover_leagues"
          options={{
            title: 'Discover',
            headerShown: false,
            tabBarIcon: ({ color, size, focused }) => (Platform.OS === 'web' ? 
              
              <FiSearch name="search" size={size} color={color} 
              style={{
                borderBottomColor: focused ? colors.accent : 'transparent',
                borderBottomWidth: 2,
                transitionProperty: 'border-bottom-color',
                transitionDuration: '0.3s',
                transitionTimingFunction: 'ease-in-out',
              }}/>
              : 
              <Ionicons name="search" size={size} color={color} 
              style={{
                borderBottomColor: focused ? colors.accent : 'transparent',
                borderBottomWidth: 2,
                transitionProperty: 'border-bottom-color',
                transitionDuration: '0.3s',
                transitionTimingFunction: 'ease-in-out',
              }}/>
            
            )
          }}
        />
        <Tabs.Screen
          name="my_leagues"
          options={{
            title: 'My Leagues',
            headerShown: false,
            tabBarIcon: ({ color, size, focused }) => (
              Platform.OS === 'web' ?
              <FiAward name="trophy" size={size} color={color} 
              style={{
                borderBottomColor: focused ? colors.accent : 'transparent',
                borderBottomWidth: 2,
                transitionProperty: 'border-bottom-color',
                transitionDuration: '0.3s',
                transitionTimingFunction: 'ease-in-out',
              }}/>

              :
              <Ionicons name="trophy" size={size} color={color} 
              style={{
                borderBottomColor: focused ? colors.accent : 'transparent',
                borderBottomWidth: 2,
                transitionProperty: 'border-bottom-color',
                transitionDuration: '0.3s',
                transitionTimingFunction: 'ease-in-out',
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
              Platform.OS === 'web' ?
              <FiUser name="person" size={size} color={color} 
              style={{
                borderBottomColor: focused ? colors.accent : 'transparent',
                borderBottomWidth: 2,
                transitionProperty: 'border-bottom-color',
                transitionDuration: '0.3s',
                transitionTimingFunction: 'ease-in-out',
              }}/>

              :
              <Ionicons name="person" size={size} color={color} 
              style={{
                borderBottomColor: focused ? colors.accent : 'transparent',
                borderBottomWidth: 2,
                transitionProperty: 'border-bottom-color',
                transitionDuration: '0.3s',
                transitionTimingFunction: 'ease-in-out',
              }}/>
            ),
          }}
        />
      </Tabs>
    </AuthProvider> 
  );
}