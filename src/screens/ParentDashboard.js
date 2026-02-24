import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import colors from '../components/colors';

export default function ParentDashboard({ onLogout, studentName = "Priya Patel" }) {
  const [currentTime, setCurrentTime] = useState('Evening');

  const features = [
    {
      emoji: '✅',
      title: 'Attendance',
      color: colors.green,
      onPress: () => Alert.alert('Attendance', 'Coming soon!')
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
      onPress: () => Alert.alert('Results', 'Coming soon!')
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
      onPress: () => Alert.alert('Chat', 'Coming soon!')
    },
    {
      emoji: '📋',
      title: 'Documents',
      color: colors.purple,
      onPress: () => Alert.alert('Documents', 'Coming soon!')
    }
  ];

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
        <View style={styles.studentCard}>
          <Text style={styles.studentLabel}>Connected to:</Text>
          <Text style={styles.studentName}>{studentName}</Text>
          <View style={styles.uniqueIdBadge}>
            <Text style={styles.uniqueIdText}>JOHDOE7X9F</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.white }]}>
            <Text style={styles.statNumber}>95%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.white }]}>
            <Text style={styles.statNumber}>85%</Text>
            <Text style={styles.statLabel}>Average</Text>
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
  studentName: {
    fontSize: 24,
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
    fontSize: 16,
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
});