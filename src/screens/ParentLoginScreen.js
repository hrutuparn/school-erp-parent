import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { supabase } from '../services/supabase';
import colors from '../components/colors';

export default function ParentLoginScreen({ onLogin }) {
  const [uniqueId, setUniqueId] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Unique ID, 2: Phone/Password
  const [studentName, setStudentName] = useState('');

  // This would verify the unique ID with database
  const handleUniqueIdSubmit = async () => {
    if (!uniqueId || uniqueId.length < 8) {
      Alert.alert('Error', 'Please enter a valid Unique ID');
      return;
    }

    setLoading(true);
    try {
      // TODO: Check if Unique ID exists in database
      const { data, error } = await supabase
        .from('students')
        .select('first_name, last_name')
        .eq('unique_id', uniqueId.toUpperCase())
        .single();

      if (error || !data) {
        Alert.alert('Error', 'Invalid Unique ID. Please check and try again.');
        setLoading(false);
        return;
      }

      setStudentName(`${data.first_name} ${data.last_name}`);
      setStep(2);
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Error', 'Please enter phone and password');
      return;
    }

    setLoading(true);
    try {
      // TODO: Create parent accounts in database
      // For now, simulate success
      Alert.alert('Success', `Welcome! You're connected to ${studentName}`);
      onLogin();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.innerContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>👪</Text>
            <Text style={styles.logoText}>Parent Portal</Text>
            <Text style={styles.logoSubtext}>Connect with your child's education</Text>
          </View>

          <Text style={styles.welcomeText}>Enter Unique ID</Text>
          <Text style={styles.subText}>
            Use the Unique ID provided by your child's school
          </Text>

          <View style={styles.uniqueIdContainer}>
            <Text style={styles.uniqueIdExample}>Example: JOHDOE7X9F</Text>
            <TextInput
              style={styles.uniqueIdInput}
              placeholder="Enter Unique ID"
              value={uniqueId}
              onChangeText={(text) => setUniqueId(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={12}
              placeholderTextColor={colors.gray}
            />
          </View>

          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: colors.teal }]}
            onPress={handleUniqueIdSubmit}
            disabled={loading}
          >
            <Text style={styles.authButtonText}>
              {loading ? 'Checking...' : 'Continue'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.helpText}>
            Don't have a Unique ID? Contact your school
          </Text>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.innerContainer}>
          <TouchableOpacity 
            onPress={() => setStep(1)} 
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>👪</Text>
            <Text style={styles.logoText}>Welcome, Parent!</Text>
            <Text style={styles.logoSubtext}>Connected to: {studentName}</Text>
          </View>

          <Text style={styles.welcomeText}>Login or Register</Text>
          <Text style={styles.subText}>
            Create an account to view your child's progress
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              placeholderTextColor={colors.gray}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={colors.gray}
            />

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: colors.orange }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.authButtonText}>
              {loading ? 'Please wait...' : 'LOGIN'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerButton}>
            <Text style={styles.registerText}>
              New user? <Text style={styles.registerHighlight}>Create Account</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoEmoji: {
    fontSize: 70,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  logoSubtext: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  subText: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 25,
  },
  uniqueIdContainer: {
    marginBottom: 25,
  },
  uniqueIdExample: {
    fontSize: 12,
    color: colors.teal,
    marginBottom: 5,
    fontStyle: 'italic',
  },
  uniqueIdInput: {
    backgroundColor: colors.white,
    paddingHorizontal: 15,
    paddingVertical: 18,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.teal,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 2,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: colors.white,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
    fontSize: 16,
    color: colors.text,
  },
  authButton: {
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  authButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    color: colors.teal,
  },
  helpText: {
    textAlign: 'center',
    color: colors.gray,
    fontSize: 12,
    marginTop: 15,
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  forgotPasswordText: {
    color: colors.teal,
    fontSize: 14,
  },
  registerButton: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: colors.text,
  },
  registerHighlight: {
    color: colors.orange,
    fontWeight: 'bold',
  },
});