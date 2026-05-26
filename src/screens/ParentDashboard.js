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
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { supabase } from '../services/supabase';
import colors from '../components/colors';

export default function ParentDashboard({
  onLogout,
  parentId,
  parentPhone,
  selectedChild,
  setSelectedChild,
  setCurrentScreen
}) {
  const [currentTime, setCurrentTime] = useState('');
  const [children, setChildren] = useState([]);
  const [showChildPicker, setShowChildPicker] = useState(false);
  const [attendancePercent, setAttendancePercent] = useState(0);
  const [averageMarks, setAverageMarks] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);

  // Link Child form states
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkFirstName, setLinkFirstName] = useState('');
  const [linkClass, setLinkClass] = useState('');
  const [linkRollNumber, setLinkRollNumber] = useState('');
  const [linking, setLinking] = useState(false);

  const handleLinkStudent = async () => {
    if (!linkFirstName.trim() || !linkClass.trim() || !linkRollNumber.trim()) {
      Alert.alert('Validation Error', 'Please fill in all student details.');
      return;
    }

    setLinking(true);
    try {
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('class', linkClass.trim().toUpperCase())
        .eq('roll_number', linkRollNumber.trim())
        .ilike('first_name', `%${linkFirstName.trim()}%`)
        .maybeSingle();

      if (error) throw error;

      if (!student) {
        Alert.alert('Not Found', 'No student found matching these credentials.');
        return;
      }

      // VERIFICATION CONSTRAINT: Matches parent's logged in mobile number!
      if (student.parent_phone !== parentPhone) {
        Alert.alert(
          'Security Verification Failed',
          `Your logged-in mobile number (+91 ${parentPhone}) does not match the parent mobile number (+91 ${student.parent_phone || 'None'}) registered for this student in our database. Please contact school administration to update the records.`
        );
        return;
      }

      // Verify link doesn't already exist
      const { data: existingLink } = await supabase
        .from('parent_students')
        .select('*')
        .eq('parent_id', parentId)
        .eq('student_id', student.id)
        .maybeSingle();

      if (existingLink) {
        Alert.alert('Already Linked', 'This student is already linked to your parent account.');
        return;
      }

      // Insert parent_students link
      const { error: insertLinkError } = await supabase
        .from('parent_students')
        .insert([{
          parent_id: parentId,
          student_id: student.id,
          unique_id: student.unique_id || `ID:${student.id}`,
          nickname: student.first_name,
          is_active: true
        }]);

      if (insertLinkError) throw insertLinkError;

      Alert.alert('Success', `${student.first_name} has been linked to your account successfully!`);
      setLinkModalVisible(false);
      setLinkFirstName('');
      setLinkClass('');
      setLinkRollNumber('');
      
      // Refresh children list
      await fetchChildren();
    } catch (e) {
      Alert.alert('Error', 'Failed to link student: ' + e.message);
    } finally {
      setLinking(false);
    }
  };

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
        // If not already set, set first child
        if (!selectedChild) {
          setSelectedChild(mapped[0]);
          await fetchStats(mapped[0].id, mapped[0].class);
        } else {
          const current = mapped.find(c => c.id === selectedChild.id) || mapped[0];
          setSelectedChild(current);
          await fetchStats(current.id, current.class);
        }
      }
    } catch (error) {
      console.log('Error fetching children:', error);
    }
  };

  const fetchStats = async (studentId, className) => {
    try {
      // 1. Fetch attendance
      const { data: attData, error: attError } = await supabase
        .from('student_attendance')
        .select('status')
        .eq('student_id', studentId);

      let attPercent = 100;
      if (!attError && attData && attData.length > 0) {
        const presentCount = attData.filter(r => r.status === 'present').length;
        attPercent = Math.round((presentCount / attData.length) * 100);
      }
      setAttendancePercent(attPercent);

      // 2. Fetch marks
      const { data: marksData, error: marksError } = await supabase
        .from('marks')
        .select('marks_obtained, max_marks')
        .eq('student_id', studentId);

      let avgMarks = 0;
      if (!marksError && marksData && marksData.length > 0) {
        let totalPercentSum = 0;
        let count = 0;
        marksData.forEach(item => {
          const score = parseFloat(item.marks_obtained);
          const max = parseFloat(item.max_marks);
          if (!isNaN(score) && !isNaN(max) && max > 0) {
            totalPercentSum += (score / max) * 100;
            count++;
          }
        });
        avgMarks = count > 0 ? Math.round(totalPercentSum / count) : 0;
      }
      setAverageMarks(avgMarks);

      // 3. Compile activities list
      const activitiesList = [];

      // Get last attendance
      const { data: lastAtt } = await supabase
        .from('student_attendance')
        .select('date, status')
        .eq('student_id', studentId)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastAtt) {
        activitiesList.push({
          id: 'act_att',
          emoji: lastAtt.status === 'present' ? '🟢' : '🔴',
          text: `Attendance: Marked ${lastAtt.status}`,
          time: `Date: ${lastAtt.date}`
        });
      } else {
        activitiesList.push({
          id: 'act_att_def',
          emoji: '✅',
          text: 'Attendance sync successful',
          time: 'Active'
        });
      }

      // Get last homework
      if (className) {
        const { data: lastHw } = await supabase
          .from('homework')
          .select('subject, chapter_name, assigned_date')
          .eq('class_name', className)
          .order('assigned_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastHw) {
          activitiesList.push({
            id: 'act_hw',
            emoji: '📝',
            text: `Homework: ${lastHw.subject} - ${lastHw.chapter_name || 'Tasks'}`,
            time: `Assigned: ${lastHw.assigned_date}`
          });
        }
      }

      // Get last exam result
      const { data: lastMark } = await supabase
        .from('marks')
        .select('subject, test_name, marks_obtained, max_marks')
        .eq('student_id', studentId)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastMark) {
        activitiesList.push({
          id: 'act_mark',
          emoji: '📊',
          text: `${lastMark.subject} graded: ${lastMark.marks_obtained}/${lastMark.max_marks}`,
          time: lastMark.test_name
        });
      }

      if (activitiesList.length < 2) {
        activitiesList.push({
          id: 'act_default',
          emoji: '📅',
          text: 'Greenwood school calendar synchronized',
          time: 'Just now'
        });
      }

      setRecentActivities(activitiesList);
    } catch (e) {
      console.log('Error fetching stats:', e.message);
    }
  };

  const handleChildSelect = (child) => {
    setSelectedChild(child);
    setShowChildPicker(false);
    fetchStats(child.id, child.class);
  };

  // Features list linking to the new screen routes
  const features = [
    {
      emoji: '✅',
      title: 'Attendance',
      color: colors.green,
      onPress: () => setCurrentScreen('attendance')
    },
    {
      emoji: '📝',
      title: 'Homework',
      color: colors.orange,
      onPress: () => setCurrentScreen('homework')
    },
    {
      emoji: '📊',
      title: 'Results',
      color: colors.purple,
      onPress: () => setCurrentScreen('results')
    },
    {
      emoji: '💰',
      title: 'Fees',
      color: colors.blue,
      onPress: () => setCurrentScreen('fees')
    },
    {
      emoji: '📅',
      title: 'Events',
      color: colors.teal,
      onPress: () => setCurrentScreen('events')
    },
    {
      emoji: '🚌',
      title: 'Bus Tracking',
      color: colors.orange,
      onPress: () => setCurrentScreen('bus')
    },
    {
      emoji: '💬',
      title: 'Chat Connect',
      color: colors.green,
      onPress: () => setCurrentScreen('chat_select')
    },
    {
      emoji: '📋',
      title: 'Documents',
      color: colors.purple,
      onPress: () => setCurrentScreen('documents')
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
          {recentActivities.map((act) => (
            <View key={act.id} style={styles.activityItem}>
              <Text style={styles.activityEmoji}>{act.emoji}</Text>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{act.text}</Text>
                <Text style={styles.activityTime}>{act.time}</Text>
              </View>
            </View>
          ))}
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
              ListFooterComponent={
                <TouchableOpacity
                  style={styles.modalItemLinkBtn}
                  onPress={() => {
                    setShowChildPicker(false);
                    setLinkModalVisible(true);
                  }}
                >
                  <Text style={styles.modalItemLinkText}>➕ Link a New Child</Text>
                </TouchableOpacity>
              }
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

      {/* Link Student Form Modal */}
      <Modal visible={linkModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.linkModalContent}>
            <View style={styles.linkModalHeader}>
              <Text style={styles.linkModalTitle}>Link Student to Account</Text>
              <TouchableOpacity
                onPress={() => setLinkModalVisible(false)}
                style={styles.closeBtn}
              >
                <Text style={{ fontSize: 20, color: colors.gray }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.linkModalSubtext}>
                Enter your child's name, class, and roll number. We will link them if they are registered with your phone number (+91 {parentPhone}).
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Student First Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Shivraj"
                  placeholderTextColor={colors.gray}
                  value={linkFirstName}
                  onChangeText={setLinkFirstName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Class / Standard</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 1A"
                  placeholderTextColor={colors.gray}
                  value={linkClass}
                  onChangeText={setLinkClass}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Roll Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 2"
                  placeholderTextColor={colors.gray}
                  value={linkRollNumber}
                  onChangeText={setLinkRollNumber}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={[styles.linkSubmitBtn, { backgroundColor: colors.teal }]}
                onPress={handleLinkStudent}
                disabled={linking}
              >
                {linking ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.linkSubmitBtnText}>✓ Search and Link Student</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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
    fontSize: 18,
    color: colors.gray,
  },
  parentName: {
    fontSize: 26,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  dropdownIcon: {
    fontSize: 22,
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
    width: '31.3%',
    marginHorizontal: '1%',
    marginBottom: 15,
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 13,
    color: colors.white,
    fontWeight: 'bold',
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
  modalItemLinkBtn: {
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: colors.background,
    borderRadius: 8
  },
  modalItemLinkText: {
    color: colors.teal,
    fontWeight: 'bold',
    fontSize: 15,
  },
  linkModalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '85%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  linkModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingBottom: 10
  },
  linkModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkModalSubtext: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 20,
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    color: colors.text,
  },
  linkSubmitBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  linkSubmitBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});