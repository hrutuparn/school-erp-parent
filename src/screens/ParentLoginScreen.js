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
      // 1. Check if parent profile exists
      let parentId;
      let parentName = '';
      
      const { data: existingParent, error: fetchError } = await supabase
        .from('parents')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingParent) {
        parentId = existingParent.id;
        parentName = existingParent.name;
      } else {
        // Query students first to resolve parent's name
        const { data: matchedStudents } = await supabase
          .from('students')
          .select('parent_name')
          .eq('parent_phone', phone)
          .limit(1);

        const resolvedName = (matchedStudents && matchedStudents.length > 0 && matchedStudents[0].parent_name)
          ? matchedStudents[0].parent_name
          : `Parent_${phone.slice(-4)}`;

        // Create new Parent record
        const { data: newParent, error: insertError } = await supabase
          .from('parents')
          .insert([{ phone, name: resolvedName, email: null }])
          .select()
          .single();

        if (insertError) throw insertError;
        parentId = newParent.id;
        parentName = newParent.name;
      }

      // Perform auto student linking (self-healing for both existing and new parents)
      const { data: matchedStudents, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('parent_phone', phone);

      if (studentsError) throw studentsError;

      if (matchedStudents && matchedStudents.length > 0) {
        // Fetch existing links
        const { data: existingLinks, error: linksError } = await supabase
          .from('parent_students')
          .select('student_id')
          .eq('parent_id', parentId);

        if (!linksError) {
          const linkedStudentIds = new Set((existingLinks || []).map(l => l.student_id));
          const linksToInsert = [];

          matchedStudents.forEach(student => {
            if (!linkedStudentIds.has(student.id)) {
              linksToInsert.push({
                parent_id: parentId,
                student_id: student.id,
                unique_id: student.unique_id || `ID:${student.id}`,
                nickname: student.first_name,
                is_active: true
              });
            }
          });

          if (linksToInsert.length > 0) {
            const { error: linkError } = await supabase
              .from('parent_students')
              .insert(linksToInsert);

            if (linkError) {
              console.log('Error creating auto parent-student links:', linkError.message);
            }
          }
        }
      }

      Alert.alert('Success', `Welcome back, ${parentName || 'Parent'}!`);
      onLogin({ id: parentId, phone, name: parentName || 'Parent' });
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