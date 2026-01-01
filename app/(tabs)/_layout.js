import React from 'react';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#e028b1',
        },
        headerTintColor: '#ffffff',
        tabBarStyle: { backgroundColor: '#181818', borderTopColor: '#333' },
        tabBarActiveTintColor: '#e028b1',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      {/* RENAMED BACK to 'My List' */}
      <Tabs.Screen name="mylist" options={{ title: 'My List' }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats' }} />
    </Tabs>
  );
}