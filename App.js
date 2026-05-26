import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens imports
import ParentLoginScreen from './src/screens/ParentLoginScreen';
import ParentDashboard from './src/screens/ParentDashboard';
import ParentChatScreen from './src/screens/ParentChatScreen';
import AttendanceDetailScreen from './src/screens/AttendanceDetailScreen';
import HomeworkDetailScreen from './src/screens/HomeworkDetailScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import FeesScreen from './src/screens/FeesScreen';
import EventsScreen from './src/screens/EventsScreen';
import BusTrackingScreen from './src/screens/BusTrackingScreen';
import ParentDocumentsScreen from './src/screens/ParentDocumentsScreen';
import ChatSelectionScreen from './src/screens/ChatSelectionScreen';

import colors from './src/components/colors';

// Translation Dictionaries
const translations = {
  en: {
    welcome: "Good",
    parent: "Parent",
    attendance: "Attendance",
    homework: "Homework",
    results: "Results",
    fees: "Fees",
    events: "Events",
    busTracking: "Bus Tracking",
    chat: "Chat Connect",
    documents: "Documents",
    logout: "Logout",
    changeLanguage: "Change Language"
  },
  hi: {
    welcome: "शुभ",
    parent: "अभिभावक",
    attendance: "उपस्थिति",
    homework: "गृहकार्य",
    results: "परिणाम",
    fees: "शुल्क",
    events: "कार्यक्रम",
    busTracking: "बस ट्रैकिंग",
    chat: "चैट संपर्क",
    documents: "दस्तावेज़",
    logout: "लॉगआउट",
    changeLanguage: "भाषा बदलें"
  },
  mr: {
    welcome: "शुभ",
    parent: "पालक",
    attendance: "हजेरी",
    homework: "घरचा अभ्यास",
    results: "निकाल",
    fees: "शुल्क",
    events: "कार्यक्रम",
    busTracking: "बस ट्रॅकिंग",
    chat: "चॅट संपर्क",
    documents: "दस्तऐवज",
    logout: "लॉगआउट",
    changeLanguage: "भाषा बदला"
  }
};

const LANGUAGES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'hi', label: '🇮🇳 हिंदी (Hindi)' },
  { code: 'mr', label: '🇮🇳 मराठी (Marathi)' }
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [parentId, setParentId] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  
  // Dynamic student selection lifted state
  const [selectedChild, setSelectedChild] = useState(null);

  // Chat parameters
  const [chatReceiverId, setChatReceiverId] = useState('');
  const [chatReceiverName, setChatReceiverName] = useState('');
  const [chatTitle, setChatTitle] = useState('Chat with Teacher');

  // Localization states
  const [lang, setLang] = useState('en');
  const [langPickerVisible, setLangPickerVisible] = useState(false);

  // Load language preference on startup
  useEffect(() => {
    loadLanguagePreference();
  }, []);

  async function loadLanguagePreference() {
    try {
      const savedLang = await AsyncStorage.getItem('app_language');
      if (savedLang) {
        setLang(savedLang);
      }
    } catch (e) {
      console.log('Error loading language:', e);
    }
  }

  const handleLanguageChange = async (code) => {
    try {
      setLang(code);
      await AsyncStorage.setItem('app_language', code);
      setLangPickerVisible(false);
    } catch (e) {
      console.log('Error saving language preference:', e);
    }
  };

  // Helper translation function
  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  // If not logged in, show login screen
  if (!isAuthenticated) {
    return (
      <ParentLoginScreen onLogin={(parent) => {
        setParentId(parent.id);
        setParentPhone(parent.phone);
        setIsAuthenticated(true);
      }} />
    );
  }

  const navigateToChat = (receiverId, receiverName, title) => {
    setChatReceiverId(receiverId);
    setChatReceiverName(receiverName);
    setChatTitle(title);
    setCurrentScreen('chat');
  };

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'attendance':
        return (
          <AttendanceDetailScreen
            studentId={selectedChild?.id}
            onBack={() => setCurrentScreen('dashboard')}
          />
        );
      case 'homework':
        return (
          <HomeworkDetailScreen
            className={selectedChild?.class}
            onBack={() => setCurrentScreen('dashboard')}
          />
        );
      case 'results':
        return (
          <ResultsScreen
            studentId={selectedChild?.id}
            onBack={() => setCurrentScreen('dashboard')}
          />
        );
      case 'fees':
        return (
          <FeesScreen
            studentId={selectedChild?.id}
            parentId={parentId}
            onBack={() => setCurrentScreen('dashboard')}
          />
        );
      case 'events':
        return (
          <EventsScreen
            onBack={() => setCurrentScreen('dashboard')}
          />
        );
      case 'bus':
        return (
          <BusTrackingScreen
            studentId={selectedChild?.id}
            onBack={() => setCurrentScreen('dashboard')}
          />
        );
      case 'documents':
        return (
          <ParentDocumentsScreen
            studentId={selectedChild?.id}
            parentId={parentId}
            onBack={() => setCurrentScreen('dashboard')}
          />
        );
      case 'chat_select':
        return (
          <ChatSelectionScreen
            selectedChild={selectedChild}
            onBack={() => setCurrentScreen('dashboard')}
            onSelectChat={navigateToChat}
          />
        );
      case 'chat':
        return (
          <ParentChatScreen
            parentId={parentId}
            teacherId={chatReceiverId}
            studentName={chatReceiverName}
            title={chatTitle}
            onBack={() => setCurrentScreen('chat_select')}
          />
        );
      case 'dashboard':
      default:
        return (
          <ParentDashboard
            parentId={parentId}
            parentPhone={parentPhone}
            selectedChild={selectedChild}
            setSelectedChild={setSelectedChild}
            setCurrentScreen={setCurrentScreen}
            onLogout={() => {
              setIsAuthenticated(false);
              setSelectedChild(null);
              setParentPhone('');
            }}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="dark" />
      
      {/* Active Screen Render */}
      {renderActiveScreen()}

      {/* Floating Language Globe Selector Button */}
      <TouchableOpacity 
        style={styles.langFloatingBtn}
        onPress={() => setLangPickerVisible(true)}
      >
        <Text style={{ fontSize: 22 }}>🌐</Text>
      </TouchableOpacity>

      {/* Language Picker Modal */}
      <Modal visible={langPickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('changeLanguage')}</Text>
            
            <FlatList
              data={LANGUAGES}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.langOption,
                    lang === item.code && { backgroundColor: colors.lightGray }
                  ]}
                  onPress={() => handleLanguageChange(item.code)}
                >
                  <Text style={styles.langOptionLabel}>{item.label}</Text>
                  {lang === item.code && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setLangPickerVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  langFloatingBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.lightGray
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  langOptionLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  checkIcon: {
    color: colors.teal,
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalCloseBtn: {
    marginTop: 10,
    paddingVertical: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
  },
  modalCloseText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
});