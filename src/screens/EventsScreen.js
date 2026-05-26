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

const MOCK_EVENTS = [
  {
    event_id: 'EVT_001',
    title: 'Parent-Teacher Meeting (PTM)',
    type: 'meeting',
    date: '2026-06-05',
    start_time: '10:00 AM',
    end_time: '01:00 PM',
    description: 'Quarterly review to discuss academic progress, classroom behavior, and future improvement plans.',
    applicable_to: 'All Classes',
    is_holiday: false
  },
  {
    event_id: 'EVT_002',
    title: 'Monsoon Break Holiday',
    type: 'holiday',
    date: '2026-06-12',
    start_time: 'Full Day',
    end_time: '',
    description: 'School remains closed on account of heavy monsoon forecasts. Stay safe at home.',
    applicable_to: 'All Students',
    is_holiday: true
  },
  {
    event_id: 'EVT_003',
    title: 'Annual Science Exhibition',
    type: 'academic',
    date: '2026-06-20',
    start_time: '09:00 AM',
    end_time: '04:00 PM',
    description: 'Students from standard 5 to 10 will showcase their innovative physics, chemistry, and biology projects.',
    applicable_to: 'Standard 5-10',
    is_holiday: false
  },
  {
    event_id: 'EVT_004',
    title: 'Inter-School Football Finals',
    type: 'sports',
    date: '2026-06-25',
    start_time: '02:00 PM',
    end_time: '05:00 PM',
    description: 'Come and support our school football team as they compete in the District Championship Finals.',
    applicable_to: 'All Parents & Students',
    is_holiday: false
  }
];

export default function EventsScreen({ onBack }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'meeting', 'holiday', 'sports'

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setEvents(data);
      } else {
        setEvents(MOCK_EVENTS);
      }
    } catch (e) {
      console.log('Error fetching events:', e.message);
      setEvents(MOCK_EVENTS);
    } finally {
      setLoading(false);
    }
  }

  const getEventEmoji = (type) => {
    switch (type) {
      case 'meeting': return '👩‍🏫';
      case 'holiday': return '🏖️';
      case 'academic': return '🔬';
      case 'sports': return '⚽';
      default: return '📅';
    }
  };

  const getEventBadgeColor = (type) => {
    switch (type) {
      case 'meeting': return colors.teal;
      case 'holiday': return '#E74C3C';
      case 'academic': return colors.purple;
      case 'sports': return colors.orange;
      default: return colors.blue;
    }
  };

  const filteredEvents = events.filter(e => {
    if (selectedFilter === 'all') return true;
    return e.type === selectedFilter;
  });

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        weekday: 'short'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📅 School Events & Holidays</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
          {['all', 'meeting', 'holiday', 'academic', 'sports'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterTab,
                selectedFilter === tab && { backgroundColor: getEventBadgeColor(tab) || colors.text }
              ]}
              onPress={() => setSelectedFilter(tab)}
            >
              <Text style={[
                styles.filterTabText,
                selectedFilter === tab ? { color: colors.white } : { color: colors.text }
              ]}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.teal} />
          <Text style={{ marginTop: 15, color: colors.gray }}>Loading Calendar Events...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.event_id.toString()}
          contentContainerStyle={{ padding: 15, paddingBottom: 40 }}
          renderItem={({ item }) => {
            const badgeColor = getEventBadgeColor(item.type);
            const emoji = getEventEmoji(item.type);

            return (
              <View style={[
                styles.eventCard,
                item.is_holiday ? styles.holidayCard : null
              ]}>
                <View style={styles.eventLeft}>
                  <View style={[styles.emojiBg, { backgroundColor: badgeColor + '15' }]}>
                    <Text style={styles.eventEmoji}>{emoji}</Text>
                  </View>
                </View>

                <View style={styles.eventRight}>
                  <View style={styles.row}>
                    <Text style={styles.eventTitle}>{item.title}</Text>
                    {item.is_holiday && (
                      <View style={styles.holidayBadge}>
                        <Text style={styles.holidayText}>HOLIDAY</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.eventDate}>📅 {formatDate(item.date)}</Text>
                  <Text style={styles.eventTime}>⏰ {item.start_time} {item.end_time ? ` - ${item.end_time}` : ''}</Text>
                  
                  <Text style={styles.eventDescription}>{item.description}</Text>

                  <View style={styles.cardFooter}>
                    <Text style={styles.targetAudience}>👥 For: {item.applicable_to}</Text>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🍃</Text>
              <Text style={styles.emptyText}>No events scheduled under this category.</Text>
            </View>
          }
        />
      )}
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
  filterContainer: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    marginRight: 8,
    alignItems: 'center',
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  holidayCard: {
    borderColor: '#FADBD8',
    backgroundColor: '#FDEDEC',
  },
  eventLeft: {
    marginRight: 15,
    justifyContent: 'flex-start',
  },
  emojiBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventEmoji: {
    fontSize: 24,
  },
  eventRight: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginRight: 5,
  },
  holidayBadge: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  holidayText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: 'bold',
  },
  eventDate: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 3,
  },
  eventTime: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 10,
  },
  eventDescription: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: 8,
  },
  targetAudience: {
    fontSize: 11,
    color: colors.gray,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
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
