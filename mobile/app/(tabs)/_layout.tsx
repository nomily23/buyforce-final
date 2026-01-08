import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
        tabBarActiveTintColor: '#E91E63',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
            height: Platform.OS === 'ios' ? 95 : 70, 
            paddingBottom: Platform.OS === 'ios' ? 30 : 10, 
            paddingTop: 10,
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#f0f0f0',
            elevation: 10, 
            shadowColor: '#000', 
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        },
        tabBarLabelStyle: {
            fontSize: 12,
            marginBottom: 5,
            fontWeight: '600'
        }
    }}>

      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "heart" : "heart-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="my-group" 
        options={{
          title: 'My Groups',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "bag-handle" : "bag-handle-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="notifications" 
        options={{
          title: 'Updates',
          tabBarBadge: 3,
          tabBarBadgeStyle: { backgroundColor: '#E91E63', color: 'white', fontSize: 10 },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "notifications" : "notifications-outline"} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
          ),
        }}
      />

    </Tabs>
  );
}