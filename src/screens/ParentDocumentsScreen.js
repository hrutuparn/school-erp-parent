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
  Modal,
  TextInput
} from 'react-native';
import { supabase } from '../services/supabase';
import colors from '../components/colors';

const CERTIFICATE_TYPES = [
  { label: '👋 Leaving Certificate (LC)', value: 'leaving_cert' },
  { label: '✏️ Name Correction', value: 'name_change' },
  { label: '📅 Date of Birth Correction', value: 'dob_change' },
  { label: '📄 Study / Bonafide Certificate', value: 'study_cert' }
];

export default function ParentDocumentsScreen({ onBack, studentId, parentId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedType, setSelectedType] = useState('study_cert');
  const [correctedValue, setCorrectedValue] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [studentId]);

  async function fetchRequests() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_requests')
        .select('*')
        .eq('student_id', studentId)
        .order('requested_on', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (e) {
      console.log('Error fetching document requests:', e.message);
      // Fallback to empty list
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  const handleApplySubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Validation Error', 'Please specify a reason or details for the request');
      return;
    }

    if ((selectedType === 'name_change' || selectedType === 'dob_change') && !correctedValue.trim()) {
      Alert.alert('Validation Error', 'Please enter the correct value to be updated');
      return;
    }

    setSubmitting(true);
    try {
      // Construct note: if it's name/dob change, prefix corrected value to the notes
      const fullNote = (selectedType === 'name_change' || selectedType === 'dob_change') 
        ? `${correctedValue.trim()} (Reason: ${reason.trim()})`
        : reason.trim();

      const newRequest = {
        school_id: 'SCH_MH_27430012',
        student_id: studentId,
        type: selectedType,
        note: fullNote,
        status: 'pending',
        requested_on: new Date().toISOString()
      };

      const { error } = await supabase
        .from('document_requests')
        .insert([newRequest]);

      if (error) throw error;

      Alert.alert('Success', 'Certificate request submitted successfully for approval.');
      setApplyModalVisible(false);
      setReason('');
      setCorrectedValue('');
      fetchRequests(); // refresh list
    } catch (e) {
      console.log('Submit error:', e.message);
      Alert.alert('Error', 'Failed to submit document request: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeName = (value) => {
    switch (value) {
      case 'leaving_cert': return 'Leaving Certificate';
      case 'name_change': return 'Name Correction';
      case 'dob_change': return 'DOB Correction';
      case 'study_cert': return 'Study/Bonafide Certificate';
      default: return value;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📄 Documents & Certificates</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.applyFab, { backgroundColor: colors.purple }]}
        onPress={() => setApplyModalVisible(true)}
      >
        <Text style={styles.applyFabText}>+ Request Document</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.purple} />
          <Text style={{ marginTop: 15, color: colors.gray }}>Retrieving Document Requests...</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item, index) => item.request_id ? item.request_id.toString() : index.toString()}
          contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
          renderItem={({ item }) => {
            const isPending = item.status === 'pending';
            const isApproved = item.status === 'approved';
            const isRejected = item.status === 'rejected';

            return (
              <View style={styles.requestCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.requestType}>{getTypeName(item.type)}</Text>
                  <View style={[
                    styles.statusBadge,
                    isApproved && { backgroundColor: colors.green + '15' },
                    isRejected && { backgroundColor: '#E74C3C15' },
                    isPending && { backgroundColor: colors.orange + '15' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      isApproved && { color: colors.green },
                      isRejected && { color: '#E74C3C' },
                      isPending && { color: colors.orange }
                    ]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <Text style={styles.detailsText}><Text style={{ fontWeight: 'bold' }}>Details:</Text> "{item.note}"</Text>
                <Text style={styles.dateText}>Requested on: {new Date(item.requested_on).toLocaleDateString()}</Text>
                {item.resolved_on && (
                  <Text style={styles.dateText}>Resolved on: {new Date(item.resolved_on).toLocaleDateString()}</Text>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📂</Text>
              <Text style={styles.emptyText}>No document requests submitted yet.</Text>
              <Text style={styles.emptySubtext}>Tap the button below to submit your first request.</Text>
            </View>
          }
        />
      )}

      {/* Request Form Modal */}
      <Modal visible={applyModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Certificate</Text>
              <TouchableOpacity onPress={() => setApplyModalVisible(false)} style={styles.closeBtn}>
                <Text style={{ fontSize: 20, color: colors.gray }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Dropdown Type Selection */}
              <Text style={styles.inputLabel}>Select Document Type</Text>
              <View style={styles.typeSelectorGrid}>
                {CERTIFICATE_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeOptionCard,
                      selectedType === type.value && { borderColor: colors.purple, backgroundColor: colors.purple + '05' }
                    ]}
                    onPress={() => setSelectedType(type.value)}
                  >
                    <Text style={[
                      styles.typeOptionText,
                      selectedType === type.value && { color: colors.purple, fontWeight: 'bold' }
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Conditional Corrected Value Fields */}
              {(selectedType === 'name_change' || selectedType === 'dob_change') && (
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>
                    {selectedType === 'name_change' ? 'Correct Student Full Name' : 'Correct Date of Birth (DD-MM-YYYY)'}
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={selectedType === 'name_change' ? 'e.g. Rajesh Kumar Sen' : 'e.g. 15-08-2012'}
                    placeholderTextColor={colors.gray}
                    value={correctedValue}
                    onChangeText={setCorrectedValue}
                  />
                </View>
              )}

              {/* Details Reason Input */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Reason / Application Description</Text>
                <TextInput
                  style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Explain why you need this document..."
                  placeholderTextColor={colors.gray}
                  multiline
                  value={reason}
                  onChangeText={setReason}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.purple }]}
                onPress={handleApplySubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitBtnText}>✓ Submit Request to Principal</Text>
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
  applyFab: {
    position: 'absolute',
    bottom: 25,
    right: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  applyFabText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  requestCard: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestType: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginVertical: 10,
  },
  detailsText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 10,
    color: colors.gray,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 30,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 13,
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
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
  inputLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  typeSelectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  typeOptionCard: {
    width: '48%',
    borderWidth: 1.5,
    borderColor: colors.lightGray,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    justifyContent: 'center',
  },
  typeOptionText: {
    fontSize: 12,
    color: colors.text,
  },
  formGroup: {
    marginBottom: 15,
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
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
