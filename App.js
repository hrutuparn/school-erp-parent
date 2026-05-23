import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import ParentLoginScreen from './src/screens/ParentLoginScreen';   // ← import login screen
import ParentDashboard from './src/screens/ParentDashboard';
import ParentChatScreen from './src/screens/ParentChatScreen';
import colors from './src/components/colors';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [parentId, setParentId] = useState('');
  const [chatTeacherId, setChatTeacherId] = useState('');
  const [chatStudentName, setChatStudentName] = useState('');

  // If not logged in, show login screen
  if (!isAuthenticated) {
    return (
      <ParentLoginScreen onLogin={(parent) => {
        setParentId(parent.id);
        setIsAuthenticated(true);
      }} />
    );
  }

  // If chat screen requested
  if (currentScreen === 'chat') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ExpoStatusBar style="dark" />
        <ParentChatScreen
          onBack={() => setCurrentScreen('dashboard')}
          parentId={parentId}
          teacherId={chatTeacherId}
          studentName={chatStudentName}
        />
      </SafeAreaView>
    );
  }

  // Default: dashboard
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ExpoStatusBar style="dark" />
      <ParentDashboard
        onLogout={() => setIsAuthenticated(false)}
        parentId={parentId}
        setParentId={setParentId}
        setChatTeacherId={setChatTeacherId}
        setChatStudentName={setChatStudentName}
        setCurrentScreen={setCurrentScreen}
      />
    </SafeAreaView>
  );
}