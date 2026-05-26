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
  Alert,
  Platform
} from 'react-native';
import { supabase } from '../services/supabase';
import colors from '../components/colors';

export default function HomeworkDetailScreen({ onBack, className }) {
  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);

  useEffect(() => {
    fetchHomework();
  }, [className]);

  async function fetchHomework() {
    setLoading(true);
    try {
      const activeClass = className || '10A';
      
      const { data, error } = await supabase
        .from('homework')
        .select('*')
        .eq('class_name', activeClass)
        .order('assigned_date', { ascending: false });

      if (error) throw error;
      setHomeworkList(data || []);
    } catch (e) {
      console.log('Error loading homework:', e.message);
      Alert.alert('Error', 'Failed to retrieve homework assignments.');
    } finally {
      setLoading(false);
    }
  }

  const handlePlayVoice = (hwId) => {
    setPlayingVoiceId(hwId);
    setTimeout(() => {
      setPlayingVoiceId(null);
    }, 5000); // simulated playback length
  };

  const getDaysLeft = (dueDateStr) => {
    try {
      const today = new Date();
      today.setHours(0,0,0,0);
      const due = new Date(dueDateStr);
      due.setHours(0,0,0,0);
      
      const diffTime = due - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'Overdue';
      if (diffDays === 0) return 'Due Today';
      if (diffDays === 1) return 'Due Tomorrow';
      return `${diffDays} days left`;
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.orange} />
          <Text style={{ marginTop: 15, color: colors.gray }}>Retrieving Homework Board...</Text>
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
        <Text style={styles.headerTitle}>📝 Homework Board</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={homeworkList}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 15, paddingBottom: 40 }}
        renderItem={({ item }) => {
          const daysLeft = getDaysLeft(item.due_date);
          const isOverdue = daysLeft === 'Overdue';
          const isVoicePlaying = playingVoiceId === item.id;

          return (
            <View style={styles.homeworkCard}>
              {/* Card Header Info */}
              <View style={styles.cardHeader}>
                <View style={styles.subjectWrapper}>
                  <Text style={styles.subjectBadge}>📖 {item.subject}</Text>
                </View>
                <View style={[
                  styles.dueBadge, 
                  isOverdue ? { backgroundColor: '#E74C3C15' } : { backgroundColor: colors.orange + '15' }
                ]}>
                  <Text style={[
                    styles.dueText,
                    isOverdue ? { color: '#E74C3C' } : { color: colors.orange }
                  ]}>
                    {daysLeft} ({item.due_date})
                  </Text>
                </View>
              </View>

              {/* General Topic Info */}
              <Text style={styles.chapterTitle}>
                {item.chapter_no ? `Chapter ${item.chapter_no}: ` : ''}
                {item.chapter_name || 'Assignment Tasks'}
              </Text>
              
              <Text style={styles.assignedLabel}>Assigned on {item.assigned_date}</Text>

              <View style={styles.divider} />

              {/* Task Details based on content_type */}
              
              {/* 1. Text Content type */}
              {item.content_type === 'text' && (
                <Text style={styles.taskText}>{item.text_content}</Text>
              )}

              {/* 2. Preloaded Syllabus Q&A */}
              {item.content_type === 'preloaded' && (
                <View style={styles.qnaBox}>
                  <Text style={styles.qnaTitle}>📚 Textbook Selected Question:</Text>
                  <Text style={styles.taskTextItalic}>"{item.text_content}"</Text>
                </View>
              )}

              {/* 3. Simulated Blackboard Photo Scan */}
              {item.content_type === 'photo' && (
                <View style={styles.photoContainer}>
                  <Text style={styles.mediaLabel}>📸 Teacher Board scan details:</Text>
                  <View style={styles.chalkboard}>
                    <View style={styles.woodBorder}>
                      <Text style={styles.chalkText}>📚 Homework Task ✍️</Text>
                      <Text style={styles.chalkSubText}>Class: {item.class_name} - {item.subject}</Text>
                      <Text style={styles.chalkBody}>
                        Solve Ex 4.2 Page 88{'\n'}
                        Q1. Find roots using factorization.{'\n'}
                        Q3. Find numbers whose sum is 27.
                      </Text>
                      <Text style={styles.chalkSignature}>- {item.subject} Teacher</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* 4. Simulated Audio Voice Note Playback */}
              {item.content_type === 'voice' && (
                <View style={styles.voiceContainer}>
                  <Text style={styles.mediaLabel}>🎙️ Teacher Audio description:</Text>
                  <View style={styles.audioPlayer}>
                    <TouchableOpacity 
                      style={[styles.audioPlayBtn, isVoicePlaying && { backgroundColor: colors.gray }]}
                      onPress={() => handlePlayVoice(item.id)}
                      disabled={isVoicePlaying}
                    >
                      <Text style={styles.audioPlayIcon}>{isVoicePlaying ? '⏸' : '▶'}</Text>
                    </TouchableOpacity>
                    <View style={styles.progressBarWrapper}>
                      <Text style={styles.audioLabel}>
                        {isVoicePlaying ? '🔊 Playing Audio explanation...' : '🔈 Voice Note instructions'}
                      </Text>
                      <View style={styles.track}>
                        <View style={[styles.progressFill, isVoicePlaying ? { width: '60%' } : { width: '0%' }]} />
                      </View>
                    </View>
                  </View>
                </View>
              )}

            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🍃</Text>
            <Text style={styles.emptyText}>No homework assignments for Class {className}.</Text>
          </View>
        }
      />
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
  homeworkCard: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectWrapper: {
    alignSelf: 'flex-start',
  },
  subjectBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.teal,
    backgroundColor: colors.teal + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  dueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dueText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 5,
  },
  assignedLabel: {
    fontSize: 11,
    color: colors.gray,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginVertical: 12,
  },
  taskText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  taskTextItalic: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  qnaBox: {
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  qnaTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.gray,
    marginBottom: 5,
  },
  mediaLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.gray,
    marginBottom: 8,
  },
  photoContainer: {
    marginTop: 5,
  },
  chalkboard: {
    width: '100%',
    aspectRatio: 1.6,
    backgroundColor: '#1E352F', // Green slate chalkboard
    borderRadius: 12,
    borderWidth: 8,
    borderColor: '#7E523A', // Wood frame
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  woodBorder: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#3D251A',
    borderRadius: 2,
    padding: 5,
  },
  chalkText: {
    color: '#ECEFF1',
    fontFamily: Platform.OS === 'ios' ? 'Chalkboard SE' : 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
    textDecorationLine: 'underline',
  },
  chalkSubText: {
    color: '#B0BEC5',
    fontFamily: Platform.OS === 'ios' ? 'Chalkboard SE' : 'monospace',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 10,
  },
  chalkBody: {
    color: '#ECEFF1',
    fontFamily: Platform.OS === 'ios' ? 'Chalkboard SE' : 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  chalkSignature: {
    color: '#ECEFF1',
    fontFamily: Platform.OS === 'ios' ? 'Chalkboard SE' : 'monospace',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 10,
  },
  voiceContainer: {
    marginTop: 5,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  audioPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  audioPlayIcon: {
    fontSize: 16,
    color: colors.white,
    marginLeft: 2, // offset play emoji triangle slightly
  },
  progressBarWrapper: {
    flex: 1,
  },
  audioLabel: {
    fontSize: 11,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  track: {
    height: 4,
    backgroundColor: colors.lightGray,
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.teal,
    borderRadius: 2,
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
