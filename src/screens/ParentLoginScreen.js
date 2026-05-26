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
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { supabase } from '../services/supabase';
import colors from '../components/colors';

export default function ParentLoginScreen({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = Phone Number, 2 = OTP Verification

  // Step 1: Request OTP
  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    // Simulate API call for sending SMS OTP
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      Alert.alert('OTP Sent', 'For sandbox simulation, enter OTP code 000000');
    }, 1200);
  };

  // Step 2: Verify OTP and Login
  const handleVerifyOtp = async () => {
    if (otp !== '000000') {
      Alert.alert('Authentication Error', 'Invalid verification code. Use 000000 for this sandbox.');
      return;
    }

    setLoading(true);
    try {
      // Query students first to resolve parent's name
      const { data: matchedStudents, error: studentsError } = await supabase
        .from('students')
        .select('parent_name')
        .eq('parent_phone', phone)
        .limit(1);

      if (studentsError) throw studentsError;

      let parentName = '';
      if (matchedStudents && matchedStudents.length > 0) {
        parentName = matchedStudents[0].parent_name || `Parent_${phone.slice(-4)}`;
      } else {
        // Allow login but notify
        parentName = `Parent_${phone.slice(-4)}`;
        Alert.alert('Registration Note', 'Your mobile number is not registered under any student profile in our system. You can link a child from the dashboard using their Class, Roll Number and Name.');
      }

      Alert.alert('Success', `Welcome back, ${parentName}!`);
      onLogin({ id: phone, phone, name: parentName });
    } catch (error) {
      Alert.alert('Database Login Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.innerContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>👪</Text>
            <Text style={styles.logoText}>Parent Portal</Text>
            <Text style={styles.logoSubtext}>Connect with your child's education</Text>
          </View>

          {step === 1 ? (
            // STEP 1 UI: Enter Mobile Number
            <View>
              <Text style={styles.welcomeText}>Parent Sign In</Text>
              <Text style={styles.subText}>
                Enter your registered mobile number to receive a verification OTP code.
              </Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>+91</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Mobile Number (10 digits)"
                  value={phone}
                  onChangeText={(val) => setPhone(val.replace(/\D/g, '').slice(0, 10))}
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholderTextColor={colors.gray}
                />
              </View>

              <TouchableOpacity
                style={[styles.authButton, { backgroundColor: colors.teal }]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.authButtonText}>Send OTP Code</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            // STEP 2 UI: Enter OTP Code
            <View>
              <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
                <Text style={styles.backText}>← Change Mobile Number</Text>
              </TouchableOpacity>

              <Text style={styles.welcomeText}>Verify Mobile</Text>
              <Text style={styles.subText}>
                Enter the 6-digit OTP code sent to +91 {phone}.
              </Text>

              <TextInput
                style={styles.otpInput}
                placeholder="0 0 0 0 0 0"
                value={otp}
                onChangeText={(val) => setOtp(val.replace(/\D/g, '').slice(0, 6))}
                keyboardType="numeric"
                maxLength={6}
                placeholderTextColor={colors.gray}
                textAlign="center"
              />

              <TouchableOpacity
                style={[styles.authButton, { backgroundColor: colors.orange }]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.authButtonText}>Verify & Login</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.helpText}>
            Demo Sandboxed Portal • Use OTP: 000000
          </Text>
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
    marginBottom: 40,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 25,
    lineHeight: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.lightGray,
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  inputPrefix: {
    fontSize: 16,
    color: colors.text,
    fontWeight: 'bold',
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.text,
  },
  otpInput: {
    backgroundColor: colors.white,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.orange,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
    color: colors.text,
    marginBottom: 20,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  backText: {
    fontSize: 14,
    color: colors.teal,
    fontWeight: '500',
  },
  helpText: {
    textAlign: 'center',
    color: colors.gray,
    fontSize: 12,
    marginTop: 20,
    fontStyle: 'italic',
  },
});