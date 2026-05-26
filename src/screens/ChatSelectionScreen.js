import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { supabase } from '../services/supabase';
import colors from '../components/colors';

export default function ChatSelectionScreen({ onBack, selectedChild, onSelectChat }) {
  const [loading, setLoading] = useState(false);
  const [principal, setPrincipal] = useState({ id: 'PRI_001', name: 'Principal Mr. Joshi' });

  useEffect(() => {
    fetchPrincipal();
  }, []);

  async function fetchPrincipal() {
    try {
      const { data, error } = await supabase
        .from('principals')
        .select('principal_id, full_name')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setPrincipal({
          id: data.principal_id,
          name: data.full_name
        });
      }
    } catch (e) {
      console.log('Error fetching principal info:', e.message);
      // fallback already set in state
    }
  }

  const handleTeacherPress = () => {
    if (!selectedChild?.teacherId) {
      Alert.alert(
        'No Teacher Assigned',
        'Your child does not have an assigned class teacher in the database yet. We will connect you to the default class teacher dashboard.',
        [
          { 
            text: 'OK', 
            onPress: () => onSelectChat('1', 'Class Teacher', 'Chat with Teacher') 
          }
        ]
      );
      return;
    }
    onSelectChat(selectedChild.teacherId, selectedChild.name, 'Chat with Teacher');
  };

  const handlePrincipalPress = () => {
    onSelectChat(principal.id, principal.name, 'Chat with Principal');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💬 Connect with School</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.instructionText}>
          Who would you like to message? Select from the channels below:
        </Text>

        {/* Class Teacher Card */}
        <TouchableOpacity style={styles.channelCard} onPress={handleTeacherPress}>
          <View style={[styles.emojiBg, { backgroundColor: colors.green + '15' }]}>
            <Text style={styles.cardEmoji}>👩‍🏫</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Class Teacher</Text>
            <Text style={styles.cardSub}>
              Direct updates about homework, classroom attendance, progress, and performance.
            </Text>
          </View>
          <Text style={styles.arrowIcon}>➔</Text>
        </TouchableOpacity>

        {/* Principal Card */}
        <TouchableOpacity style={styles.channelCard} onPress={handlePrincipalPress}>
          <View style={[styles.emojiBg, { backgroundColor: colors.purple + '15' }]}>
            <Text style={styles.cardEmoji}>🏢</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>School Principal</Text>
            <Text style={styles.cardSub}>
              General school inquiries, leaves approval issues, fee requests, or principal corrections.
            </Text>
            <Text style={styles.partnerName}>Contact: {principal.name}</Text>
          </View>
          <Text style={styles.arrowIcon}>➔</Text>
        </TouchableOpacity>

        {/* Extra Information */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            💡 Messages sent in these channels are monitored by the administration portal for compliance and quality assistance.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    padding: 20,
    flex: 1,
  },
  instructionText: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 25,
    lineHeight: 20,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  emojiBg: {
    width: 54,
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardEmoji: {
    fontSize: 28,
  },
  cardInfo: {
    flex: 1,
    paddingRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 11,
    color: colors.gray,
    lineHeight: 16,
  },
  partnerName: {
    fontSize: 10,
    color: colors.teal,
    fontWeight: 'bold',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  arrowIcon: {
    fontSize: 18,
    color: colors.gray,
    fontWeight: 'bold',
  },
  infoBanner: {
    backgroundColor: '#FCF8E3',
    borderColor: '#FBEED5',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  infoText: {
    fontSize: 11,
    color: '#C09853',
    lineHeight: 16,
  },
});
