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

export default function ResultsScreen({ onBack, studentId }) {
  const [marksList, setMarksList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalTests: 0,
    averagePercent: 0
  });

  useEffect(() => {
    fetchMarks();
  }, [studentId]);

  async function fetchMarks() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marks')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false });

      if (error) throw error;

      const records = data || [];
      setMarksList(records);

      // Compute statistics
      let totalPercentSum = 0;
      let count = 0;

      records.forEach(item => {
        const score = parseFloat(item.marks_obtained);
        const max = parseFloat(item.max_marks);
        if (!isNaN(score) && !isNaN(max) && max > 0) {
          totalPercentSum += (score / max) * 100;
          count++;
        }
      });

      const averagePercent = count > 0 ? Math.round(totalPercentSum / count) : 0;

      setSummary({
        totalTests: count,
        averagePercent
      });
    } catch (e) {
      console.log('Error loading results:', e.message);
      Alert.alert('Error', 'Failed to retrieve test scores.');
    } finally {
      setLoading(false);
    }
  }

  const getTestTypeLabel = (type) => {
    switch (type) {
      case 'unit': return 'Unit Test';
      case 'weekly': return 'Weekly Test';
      case 'monthly': return 'Monthly Test';
      case 'olympiad': return 'Olympiad';
      case 'semester': return 'Semester Exam';
      default: return 'Test';
    }
  };

  const getGrade = (obtained, max) => {
    const ratio = obtained / max;
    if (ratio >= 0.9) return { mark: 'A+', color: '#27AE60' };
    if (ratio >= 0.8) return { mark: 'A', color: '#2ECC71' };
    if (ratio >= 0.7) return { mark: 'B', color: '#F1C40F' };
    if (ratio >= 0.6) return { mark: 'C', color: '#E67E22' };
    if (ratio >= 0.5) return { mark: 'D', color: '#D35400' };
    return { mark: 'F', color: '#E74C3C' };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.teal} />
          <Text style={{ marginTop: 15, color: colors.gray }}>Retrieving Test Scores...</Text>
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
        <Text style={styles.headerTitle}>📊 Academic Progress</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Tests Graded</Text>
          <Text style={[styles.summaryNumber, { color: colors.teal }]}>{summary.totalTests}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Class Average</Text>
          <Text style={[styles.summaryNumber, { color: summary.averagePercent >= 75 ? colors.green : colors.orange }]}>
            {summary.averagePercent}%
          </Text>
        </View>
      </View>

      {/* Score details list */}
      <View style={styles.listSection}>
        <Text style={styles.sectionHeader}>✍️ Assessment Report Cards</Text>

        <FlatList
          data={marksList}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => {
            const grade = getGrade(parseFloat(item.marks_obtained), parseFloat(item.max_marks));
            return (
              <View style={styles.reportRow}>
                <View style={styles.reportMeta}>
                  <View style={styles.subjectRow}>
                    <Text style={styles.subjectText}>{item.subject}</Text>
                    <Text style={styles.testTypeBadge}>{getTestTypeLabel(item.test_type)}</Text>
                  </View>
                  <Text style={styles.testTitle}>{item.test_name}</Text>
                  <Text style={styles.testDate}>Administered on {item.date}</Text>
                </View>

                <View style={styles.scoreMeta}>
                  <Text style={styles.scoreText}>
                    <Text style={styles.obtainedText}>{item.marks_obtained}</Text>
                    <Text style={styles.maxText}> / {item.max_marks}</Text>
                  </Text>
                  <View style={[styles.gradeBadge, { backgroundColor: grade.color + '15', borderColor: grade.color }]}>
                    <Text style={[styles.gradeText, { color: grade.color }]}>{grade.mark}</Text>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📊</Text>
              <Text style={styles.emptyText}>No academic marks recorded yet.</Text>
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginVertical: 15,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.lightGray,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.gray,
    marginBottom: 5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  listSection: {
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
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  reportMeta: {
    flex: 1,
    paddingRight: 10,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  subjectText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: 8,
  },
  testTypeBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.teal,
    backgroundColor: colors.teal + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  testTitle: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  testDate: {
    fontSize: 10,
    color: colors.gray,
    marginTop: 4,
  },
  scoreMeta: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 13,
    marginBottom: 6,
  },
  obtainedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  maxText: {
    fontSize: 11,
    color: colors.gray,
  },
  gradeBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  gradeText: {
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
