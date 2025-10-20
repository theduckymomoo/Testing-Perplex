import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './context/AuthContext';
import LandingScreen from './screens/LandingScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import Dashboard from './screens/Dashboard';
import Setting from './screens/Settings';
import HelpFAQScreen from './screens/DashboardComponets/SettingsPages/HelpFAQScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Landing">
          <Stack.Screen
            name="Landing"
            component={LandingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProfileSetup"
            component={ProfileSetupScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Dashboard" 
            component={Dashboard}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="HelpFAQ" 
            component={HelpFAQScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Setting" 
            component={Setting}
            options={{ 
              headerShown: true,
              title: 'Settings',
              headerStyle: {
                backgroundColor: '#0a0a0b',
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                fontWeight: '700',
                fontSize: 18,
              },
            }}
          />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </AuthProvider>
  );
}