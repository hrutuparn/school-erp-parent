import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import ParentLoginScreen from './src/screens/ParentLoginScreen';
import ParentDashboard from './src/screens/ParentDashboard';
import colors from './src/components/colors';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <ParentLoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ExpoStatusBar style="dark" />
      <ParentDashboard onLogout={() => setIsAuthenticated(false)} />
    </SafeAreaView>
  );
}