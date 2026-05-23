import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  FlatList,
  Modal
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { supabase } from '../services/supabase';
import colors from '../components/colors';

export default function ParentDashboard({
  onLogout,
  parentId,
  setParentId,
  setChatTeacherId,
  setChatStudentName,
  setCurrentScreen
}) {
  const [currentTime, setCurrentTime] = useState('');
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showChildPicker, setShowChildPicker] = useState(false);
  const [attendancePercent, setAttendancePercent] = useState(0);
  const [averageMarks, setAverageMarks] = useState(0);

  // Set greeting time
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setCurrentTime('Morning');
    else if (hours < 17) setCurrentTime('Afternoon');
    else setCurrentTime('Evening');
  }, []);

  // Fetch children for this parent
  useEffect(() => {
    if (parentId) {
      fetchChildren();
    }
  }, [parentId]);

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('parent_students')
        .select(`
          student_id,
          nickname,
          students!inner (
            id,
            first_name,
            last_name,
            class,
            roll_number,
            teacher_id,
            unique_id
          )
        `)
        .eq('parent_id', parentId);

      if (error) throw error;

      const mapped = data.map(item => ({
        id: item.students.id,
        name: item.nickname || `${item.students.first_name} ${item.students.last_name}`,
        class: item.students.class,
        roll: item.students.roll_number,
        teacherId: item.students.teacher_id,
        uniqueId: item.students.unique_id
      }));
      setChildren(mapped);
      if (mapped.length > 0) {
        setSelectedChild(mapped[0]);
        await fetchStats(mapped[0].id);
      }
    } catch (error) {
      console.log('Error fetching children:', error);
    }
  };

  const fetchStats = async (studentId) => {
    // Placeholder: replace with actual attendance and marks queries
    setAttendancePercent(92);
    setAverageMarks(78);
  };

  const handleChildSelect = (child) => {
    setSelectedChild(child);
    setShowChildPicker(false);
    fetchStats(child.id);
  };

  const handleChatPress = () => {
    if (!selectedChild) {
      Alert.alert('No child selected', 'Please select a child first');
      return;
    }
    if (!selectedChild.teacherId) {
      Alert.alert('No teacher assigned', 'This child does not have a teacher yet');
      return;
    }
    setChatTeacherId(selectedChild.teacherId);
    setChatStudentName(selectedChild.name);
    setCurrentScreen('chat');
  };

  // Features list – we’ll update the chat button to call handleChatPress
  const features = [
    {
      emoji: '✅',
      title: 'Attendance',
      color: colors.green,
      onPress: () => Alert.alert('Attendance', `${attendancePercent}% attendance`)
    },
    {
      emoji: '📝',
      title: 'Homework',
      color: colors.orange,
      onPress: () => Alert.alert('Homework', 'Coming soon!')
    },
    {
      emoji: '📊',
      title: 'Results',
      color: colors.purple,
      onPress: () => Alert.alert('Results', `Average: ${averageMarks}%`)
    },
    {
      emoji: '💰',
      title: 'Fees',
      color: colors.blue,
      onPress: () => Alert.alert('Fees', 'Coming soon!')
    },
    {
      emoji: '📅',
      title: 'Events',
      color: colors.teal,
      onPress: () => Alert.alert('Events', 'Coming soon!')
    },
    {
      emoji: '🚌',
      title: 'Bus Tracking',
      color: colors.orange,
      onPress: () => Alert.alert('Bus Tracking', 'Coming soon!')
    },
    {
      emoji: '💬',
      title: 'Chat Teacher',
      color: colors.green,
      onPress: handleChatPress   // <- now calls the real function
    },
    {
      emoji: '📋',
      title: 'Documents',
      color: colors.purple,
      onPress: () => Alert.alert('Documents', 'Coming soon!')
    }
  ];

  // If no children yet
  if (children.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {currentTime},</Text>
            <Text style={styles.parentName}>Parent 👪</Text>
          </View>
          <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>🚪</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>👧🧒</Text>
          <Text style={styles.emptyText}>No children linked</Text>
          <Text style={styles.emptySubtext}>Please contact your school to add your child.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="dark" />

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {currentTime},</Text>
          <Text style={styles.parentName}>Parent 👪</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>🚪</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Child selector */}
        <TouchableOpacity style={styles.childSelector} onPress={() => setShowChildPicker(true)}>
          <Text style={styles.childName}>{selectedChild?.name}</Text>
          <Text style={styles.dropdownIcon}>▼</Text>
        </TouchableOpacity>

        <View style={styles.studentCard}>
          <Text style={styles.studentLabel}>Class & Roll</Text>
          <Text style={styles.studentClass}>Class {selectedChild?.class} | Roll No. {selectedChild?.roll}</Text>
          <View style={styles.uniqueIdBadge}>
            <Text style={styles.uniqueIdText}>{selectedChild?.uniqueId}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.white }]}>
            <Text style={styles.statNumber}>{attendancePercent}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.white }]}>
            <Text style={styles.statNumber}>{averageMarks}%</Text>
            <Text style={styles.statLabel}>Average Marks</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.featureCard, { backgroundColor: feature.color }]}
              onPress={feature.onPress}
            >
              <Text style={styles.featureEmoji}>{feature.emoji}</Text>
              <Text style={styles.featureTitle}>{feature.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.recentActivity}>
          <Text style={styles.recentTitle}>Recent Activity</Text>
          <View style={styles.activityItem}>
            <Text style={styles.activityEmoji}>✅</Text>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Present today</Text>
              <Text style={styles.activityTime}>Today, 9:00 AM</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <Text style={styles.activityEmoji}>📝</Text>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Homework: Math Chapter 5</Text>
              <Text style={styles.activityTime}>Yesterday</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Child Picker Modal */}
      <Modal visible={showChildPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Child</Text>
            <FlatList
              data={children}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleChildSelect(item)}
                >
                  <Text style={styles.modalItemName}>{item.name}</Text>
                  <Text style={styles.modalItemClass}>Class {item.class}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowChildPicker(false)}
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
  greeting: {
    fontSize: 16,
    color: colors.gray,
  },
  parentName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 20,
  },
  childSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 5,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  dropdownIcon: {
    fontSize: 18,
    color: colors.gray,
  },
  studentCard: {
    backgroundColor: colors.white,
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studentLabel: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 5,
  },
  studentClass: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  uniqueIdBadge: {
    backgroundColor: colors.teal + '20',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.teal,
  },
  uniqueIdText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.teal,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: colors.gray,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  featureCard: {
    width: '23%',
    marginHorizontal: '1%',
    marginBottom: 15,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  featureTitle: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  recentActivity: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  activityEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 10,
    color: colors.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 100,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalItemName: {
    fontSize: 16,
    color: colors.text,
  },
  modalItemClass: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  modalCloseButton: {
    marginTop: 15,
    paddingVertical: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
});