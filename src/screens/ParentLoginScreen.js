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
  const [name, setName] = useState('');        // NEW: parent's name
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [studentData, setStudentData] = useState(null);

  // Step 1: verify unique ID and fetch student
  const handleUniqueIdSubmit = async () => {
    if (!uniqueId || uniqueId.length < 8) {
      Alert.alert('Error', 'Please enter a valid Unique ID');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, unique_id, teacher_id')
        .eq('unique_id', uniqueId.toUpperCase())
        .single();

      if (error || !data) {
        Alert.alert('Error', 'Invalid Unique ID. Please check and try again.');
        return;
      }

      setStudentData(data);
      setStep(2);
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: login/register parent and link to student
  const handleLogin = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      // 1. Find or create parent
      let parentId;
      const { data: existingParent, error: fetchError } = await supabase
        .from('parents')
        .select('id')
        .eq('phone', phone)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (existingParent) {
        parentId = existingParent.id;
      } else {
        // Create new parent
        const parentName = name.trim() || `Parent_${phone.slice(-4)}`;
        const { data: newParent, error: insertError } = await supabase
          .from('parents')
          .insert([{ phone, name: parentName, email: null }])
          .select()
          .single();

        if (insertError) throw insertError;
        parentId = newParent.id;
      }

      // 2. Link parent to student (if not already linked)
      const { data: existingLink, error: linkCheckError } = await supabase
        .from('parent_students')
        .select('id')
        .eq('parent_id', parentId)
        .eq('student_id', studentData.id)
        .maybeSingle();

      if (linkCheckError && linkCheckError.code !== 'PGRST116') throw linkCheckError;

      if (!existingLink) {
        const { error: linkError } = await supabase
          .from('parent_students')
          .insert([{
            parent_id: parentId,
            student_id: studentData.id,
            unique_id: studentData.unique_id,
            nickname: studentData.first_name,
            is_active: true
          }]);

        if (linkError) throw linkError;
      }

      // 3. Also ensure the student has a teacher_id (if missing)
      if (!studentData.teacher_id) {
        // Optionally assign a default teacher (e.g., teacher_id = 1)
        await supabase
          .from('students')
          .update({ teacher_id: '1' })
          .eq('id', studentData.id);
      }

      Alert.alert('Success', `Welcome! You are now connected to ${studentData.first_name} ${studentData.last_name}`);
      onLogin({ id: parentId, phone, name: existingParent?.name || name });
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ---- Step 1 UI (Unique ID) ----
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

  // ---- Step 2 UI (Phone & Name) ----
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.innerContainer}>
          <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>👪</Text>
            <Text style={styles.logoText}>Welcome, Parent!</Text>
            <Text style={styles.logoSubtext}>
              Connecting to: {studentData?.first_name} {studentData?.last_name}
            </Text>
          </View>

          <Text style={styles.welcomeText}>Enter Your Details</Text>
          <Text style={styles.subText}>
            We'll create an account using your phone number
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Your Name (optional)"
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.gray}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number (10 digits)*"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              placeholderTextColor={colors.gray}
            />
          </View>

          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: colors.orange }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.authButtonText}>
              {loading ? 'Connecting...' : 'Connect to Child'}
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
});