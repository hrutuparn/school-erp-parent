import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { supabase } from '../services/supabase';
import colors from '../components/colors';

export default function AttendanceDetailScreen({ onBack, studentId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    total: 0,
    percent: 0
  });

  useEffect(() => {
    fetchAttendance();
  }, [studentId]);

  async function fetchAttendance() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_attendance')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false });

      if (error) throw error;

      const records = data || [];
      setLogs(records);

      // Compute statistics
      const presentCount = records.filter(r => r.status === 'present').length;
      const absentCount = records.filter(r => r.status === 'absent').length;
      const total = records.length;
      const percent = total > 0 ? Math.round((presentCount / total) * 100) : 100;

      setStats({
        present: presentCount,
        absent: absentCount,
        total,
        percent
      });
    } catch (e) {
      console.log('Error fetching attendance details:', e.message);
      Alert.alert('Error', 'Failed to retrieve attendance logs.');
    } finally {
      setLoading(false);
    }
  }

  const formatLongDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.teal} />
          <Text style={{ marginTop: 15, color: colors.gray }}>Retrieving Attendance Logs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 Attendance Log</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats Summary Card */}
      <View style={styles.statsCard}>
        <View style={styles.circularProgressContainer}>
          <View style={[styles.circleOverlay, { borderColor: stats.percent >= 75 ? colors.green : colors.orange }]}>
            <Text style={styles.percentText}>{stats.percent}%</Text>
            <Text style={styles.percentSub}>Present</Text>
          </View>
        </View>

        <View style={styles.statsDetails}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.green }]}>{stats.present}</Text>
            <Text style={styles.statLabel}>Days Present</Text>
          </View>
          <View style={[styles.statItem, { borderLeftWidth: 1, borderLeftColor: colors.lightGray }]}>
            <Text style={[styles.statNumber, { color: '#E74C3C' }]}>{stats.absent}</Text>
            <Text style={styles.statLabel}>Days Absent</Text>
          </View>
        </View>
      </View>

      {/* Daily Logs Timeline */}
      <View style={styles.logsSection}>
        <Text style={styles.sectionHeader}>📅 Timeline Records</Text>
        
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => {
            const isPresent = item.status === 'present';
            return (
              <View style={styles.logRow}>
                <View style={styles.logMeta}>
                  <Text style={styles.logDate}>{formatLongDate(item.date)}</Text>
                  <Text style={styles.logTime}>Logged at {item.marked_at || '9:00 AM'}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  isPresent ? styles.statusBadgePresent : styles.statusBadgeAbsent
                ]}>
                  <Text style={[
                    styles.statusText,
                    isPresent ? { color: colors.green } : { color: '#E74C3C' }
                  ]}>
                    {isPresent ? '🟢 PRESENT' : '🔴 ABSENT'}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>No attendance records recorded yet.</Text>
            </View>
          }
        />
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    backgroundColor: colors.white,
    margin: 15,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.lightGray,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  circularProgressContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  circleOverlay: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 6,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  percentSub: {
    fontSize: 9,
    color: colors.gray,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statsDetails: {
    flex: 1,
    flexDirection: 'row',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    color: colors.gray,
    marginTop: 4,
  },
  logsSection: {
    flex: 1,
    paddingHorizontal: 15,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    paddingLeft: 4,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  logMeta: {
    flex: 1,
  },
  logDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  logTime: {
    fontSize: 11,
    color: colors.gray,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusBadgePresent: {
    backgroundColor: colors.green + '15',
  },
  statusBadgeAbsent: {
    backgroundColor: '#E74C3C15',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray,
  },
});
