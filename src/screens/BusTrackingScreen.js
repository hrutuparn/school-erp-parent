import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Linking,
  Dimensions,
  Animated
} from 'react-native';
import { supabase } from '../services/supabase';
import colors from '../components/colors';

const { width } = Dimensions.get('window');

const STOPS_TEMPLATE = [
  { order: 1, name: 'Kothrud Depo Depot', expected_time: '07:30 AM', passed: true, lat: 20, lng: 20 },
  { order: 2, name: 'Deccan Gymkhana Square', expected_time: '07:45 AM', passed: true, lat: 45, lng: 50 },
  { order: 3, name: 'Shivaji Nagar (Your Stop) 📍', expected_time: '08:02 AM', passed: false, lat: 70, lng: 80 },
  { order: 4, name: 'Greenwood Public School 🏫', expected_time: '08:15 AM', passed: false, lat: 95, lng: 110 }
];

export default function BusTrackingScreen({ onBack, studentId }) {
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState({
    name: 'Babanrao Shinde',
    phone: '9876543210',
    busNumber: 'MH-12-AB-1234',
    routeName: 'Shivaji Nagar Route',
    status: 'En Route'
  });
  
  // Animation coordinates/progress
  const [busProgress] = useState(new Animated.Value(0));
  const [currentStopIndex, setCurrentStopIndex] = useState(1);
  const [etaMinutes, setEtaMinutes] = useState(12);

  useEffect(() => {
    // Fetch bus details if table exists. We fallback to mock immediately to guarantee working demo
    setTimeout(() => {
      setLoading(false);
    }, 1000);

    // Animate bus icon along the path in a loop
    startBusAnimation();

    // Countdown ETA periodically for effect
    const interval = setInterval(() => {
      setEtaMinutes((prev) => (prev > 1 ? prev - 1 : 12));
    }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const startBusAnimation = () => {
    busProgress.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(busProgress, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: false
        }),
        Animated.delay(2000)
      ])
    ).start();

    // Listen to value to update active stop highlight dynamically
    busProgress.addListener(({ value }) => {
      if (value < 0.3) {
        setCurrentStopIndex(1);
      } else if (value < 0.6) {
        setCurrentStopIndex(2);
      } else if (value < 0.9) {
        setCurrentStopIndex(3);
      } else {
        setCurrentStopIndex(4);
      }
    });
  };

  const handleCallDriver = () => {
    const url = `tel:${driver.phone}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Phone dialer not available', `Driver phone number is +91 ${driver.phone}`);
        }
      })
      .catch((err) => console.log('Linking error:', err));
  };

  // Interpolate bus movement position on map layout
  const busX = busProgress.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [30, width * 0.3, width * 0.6, width * 0.78]
  });

  const busY = busProgress.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [120, 70, 130, 80]
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🚌 Live GPS Bus Tracker</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.orange} />
          <Text style={{ marginTop: 15, color: colors.gray }}>Locating Bus Transmitter...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Mock Live Map Visualization */}
          <View style={styles.mapContainer}>
            <View style={styles.mapHeader}>
              <View style={styles.statusDotRow}>
                <View style={styles.pulseDot} />
                <Text style={styles.liveLabel}>LIVE TRACKING</Text>
              </View>
              <Text style={styles.etaText}>Arriving in <Text style={{ color: colors.orange, fontWeight: 'bold' }}>{etaMinutes} mins</Text></Text>
            </View>

            {/* Visual Route Canvas */}
            <View style={styles.roadCanvas}>
              {/* Road Path */}
              <View style={styles.roadLine} />
              
              {/* Stop Markers */}
              <View style={[styles.mapStopPin, { left: 30, top: 120 }]} />
              <View style={[styles.mapStopPin, { left: width * 0.3, top: 70 }]} />
              <View style={[styles.mapStopPin, { left: width * 0.6, top: 130 }]} />
              <View style={[styles.mapStopPin, { left: width * 0.78, top: 80 }]} />

              {/* School badge marker */}
              <View style={[styles.schoolMarker, { left: width * 0.78, top: 40 }]}>
                <Text style={{ fontSize: 16 }}>🏫</Text>
              </View>

              {/* Animated Bus Icon */}
              <Animated.View style={[styles.animatedBus, { left: busX, top: busY }]}>
                <View style={styles.busWrapper}>
                  <Text style={{ fontSize: 22 }}>🚌</Text>
                  <View style={styles.radarRing} />
                </View>
              </Animated.View>
            </View>

            <Text style={styles.mapFootnote}>Route: {driver.routeName} • {driver.busNumber}</Text>
          </View>

          {/* Driver Contact details */}
          <View style={styles.driverCard}>
            <View style={styles.driverMeta}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>👨‍✈️</Text>
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <Text style={styles.driverTitle}>School Bus Driver</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.callButton} onPress={handleCallDriver}>
              <Text style={styles.callBtnText}>📞 Contact Driver</Text>
            </TouchableOpacity>
          </View>

          {/* Timeline stops progress */}
          <View style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>Route Stations & ETA</Text>
            
            {STOPS_TEMPLATE.map((stop) => {
              const isActive = currentStopIndex === stop.order;
              const isPassed = currentStopIndex > stop.order;
              
              return (
                <View key={stop.order} style={styles.timelineRow}>
                  <View style={styles.timelineLineContainer}>
                    <View style={[
                      styles.timelineIndicator,
                      isPassed ? styles.indicatorPassed : (isActive ? styles.indicatorActive : styles.indicatorPending)
                    ]}>
                      {isPassed && <Text style={styles.checkText}>✓</Text>}
                    </View>
                    {stop.order < 4 && <View style={styles.verticalConnector} />}
                  </View>

                  <View style={styles.timelineDetails}>
                    <Text style={[
                      styles.stopName,
                      isActive && { color: colors.orange, fontWeight: 'bold' }
                    ]}>
                      {stop.name}
                    </Text>
                    <Text style={styles.stopEta}>
                      {isPassed ? 'Passed' : `Expected at ${stop.expected_time}`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
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
  mapContainer: {
    backgroundColor: '#EAE6DF',
    margin: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.lightGray,
    padding: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
    marginRight: 6,
  },
  liveLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.green,
    letterSpacing: 1,
  },
  etaText: {
    fontSize: 12,
    color: colors.text,
  },
  roadCanvas: {
    height: 220,
    backgroundColor: '#DCD6CD',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#C5BCB1',
  },
  roadLine: {
    position: 'absolute',
    height: 60,
    left: 20,
    right: 20,
    top: 90,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#A89E90',
    borderStyle: 'dashed',
  },
  mapStopPin: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7F8C8D',
    borderWidth: 2,
    borderColor: colors.white,
  },
  schoolMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedBus: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10,
    marginLeft: -10,
  },
  busWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.orange,
    opacity: 0.5,
  },
  mapFootnote: {
    fontSize: 10,
    color: colors.gray,
    textAlign: 'center',
    marginTop: 5,
  },
  driverCard: {
    backgroundColor: colors.white,
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.lightGray,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 22,
  },
  driverInfo: {
    justifyContent: 'center',
  },
  driverName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  driverTitle: {
    fontSize: 11,
    color: colors.gray,
    marginTop: 2,
  },
  callButton: {
    backgroundColor: colors.teal,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  callBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  timelineCard: {
    backgroundColor: colors.white,
    marginHorizontal: 15,
    marginBottom: 30,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  timelineLineContainer: {
    width: 30,
    alignItems: 'center',
  },
  timelineIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  indicatorPassed: {
    backgroundColor: colors.green,
  },
  indicatorActive: {
    backgroundColor: colors.orange,
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  indicatorPending: {
    backgroundColor: colors.lightGray,
  },
  checkText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  verticalConnector: {
    position: 'absolute',
    top: 20,
    bottom: -15,
    width: 2,
    backgroundColor: colors.lightGray,
    zIndex: 1,
  },
  timelineDetails: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: 'center',
  },
  stopName: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  stopEta: {
    fontSize: 11,
    color: colors.gray,
    marginTop: 3,
  },
});
