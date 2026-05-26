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
  TextInput,
  Image
} from 'react-native';
import { supabase } from '../services/supabase';
import colors from '../components/colors';

const MOCK_FEES_TEMPLATE = [
  {
    fee_id: 'FEE_TEMPLATE_TUI',
    fee_type: 'tuition',
    description: 'Tuition Fee (Quarter 1)',
    amount: 15000,
    due_date: '2026-06-15',
    status: 'unpaid'
  },
  {
    fee_id: 'FEE_TEMPLATE_BUS',
    fee_type: 'bus',
    description: 'Bus Transport Fee (Term 1)',
    amount: 4500,
    due_date: '2026-06-01',
    status: 'unpaid'
  },
  {
    fee_id: 'FEE_TEMPLATE_EXM',
    fee_type: 'exam',
    description: 'Annual Examination Fee',
    amount: 1500,
    due_date: '2026-06-10',
    status: 'unpaid'
  }
];

export default function FeesScreen({ onBack, studentId, parentId }) {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFee, setSelectedFee] = useState(null);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);
  
  // Checkout form states
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' or 'card'
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paying, setPaying] = useState(false);
  const [recentTransaction, setRecentTransaction] = useState(null);

  useEffect(() => {
    fetchFees();
  }, [studentId]);

  async function fetchFees() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fees')
        .select('*')
        .eq('student_id', studentId)
        .order('due_date', { ascending: true });

      if (error) throw error;

      // If database contains fees, use them. Otherwise, seed or merge template
      const dbFees = data || [];
      if (dbFees.length === 0) {
        // We will display the templates.
        // We set status to unpaid for template items unless we find paid versions in memory/state
        setFees(MOCK_FEES_TEMPLATE);
      } else {
        setFees(dbFees);
      }
    } catch (e) {
      console.log('Error fetching fees:', e.message);
      // Fallback to template if table query fails
      setFees(MOCK_FEES_TEMPLATE);
    } finally {
      setLoading(false);
    }
  }

  const handlePayPress = (fee) => {
    setSelectedFee(fee);
    setCheckoutVisible(true);
  };

  const executeMockPayment = async () => {
    if (paymentMethod === 'upi' && !upiId.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid UPI ID (e.g. user@okaxis)');
      return;
    }
    if (paymentMethod === 'card' && (cardNumber.replace(/\s/g, '').length < 16 || cardExpiry.length < 5 || cardCvv.length < 3)) {
      Alert.alert('Validation Error', 'Please fill in card details correctly');
      return;
    }

    setPaying(true);
    
    // Simulate payment processing delay
    setTimeout(async () => {
      const transactionId = 'TXN' + Math.floor(1000000000 + Math.random() * 9000000000);
      const paidOn = new Date().toISOString().split('T')[0];
      const methodText = paymentMethod === 'upi' ? `UPI (${upiId})` : `Card (ending ${cardNumber.slice(-4)})`;
      
      const newFeeRecord = {
        fee_id: selectedFee.fee_id.startsWith('FEE_TEMPLATE') ? 'FEE_' + Math.floor(10000 + Math.random() * 90000) : selectedFee.fee_id,
        school_id: 'SCH_MH_27430012',
        student_id: studentId,
        fee_type: selectedFee.fee_type,
        description: selectedFee.description,
        amount: selectedFee.amount,
        due_date: selectedFee.due_date,
        status: 'paid',
        paid_amount: selectedFee.amount,
        paid_on: paidOn,
        payment_method: methodText,
        transaction_id: transactionId,
        receipt_url: 'receipt_' + transactionId + '.pdf'
      };

      try {
        // Try inserting the record into database to keep it persistent
        const { error } = await supabase
          .from('fees')
          .upsert([newFeeRecord]);

        if (error) {
          console.log('Error writing fee payment to DB:', error.message);
        }
      } catch (dbError) {
        console.log('Database write exception:', dbError.message);
      }

      setRecentTransaction(newFeeRecord);
      setPaying(false);
      setCheckoutVisible(false);
      setReceiptVisible(true);
      fetchFees(); // refresh list
    }, 2000);
  };

  const getFeeColor = (type) => {
    switch (type) {
      case 'tuition': return colors.teal;
      case 'bus': return colors.orange;
      case 'exam': return colors.purple;
      default: return colors.blue;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💰 Fees & Invoices</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Outstanding Balance Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Total Outstanding Balance</Text>
            <Text style={styles.balanceAmount}>
              ₹{fees.filter(f => f.status !== 'paid').reduce((sum, f) => sum + f.amount, 0).toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryVisual}>
            <Text style={{ fontSize: 32 }}>💳</Text>
          </View>
        </View>

        {/* Invoice List */}
        <Text style={styles.sectionHeader}>📂 Fee Receipts & Invoices</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={colors.teal} style={{ marginTop: 30 }} />
        ) : (
          <View style={{ paddingHorizontal: 15 }}>
            {fees.map((item, index) => {
              const isPaid = item.status === 'paid';
              const themeColor = getFeeColor(item.fee_type);
              return (
                <View key={item.fee_id || index} style={styles.invoiceCard}>
                  <View style={[styles.cardAccent, { backgroundColor: themeColor }]} />
                  <View style={styles.invoiceDetails}>
                    <View style={styles.invoiceRow}>
                      <Text style={styles.feeType}>{item.description}</Text>
                      <Text style={styles.feeAmount}>₹{item.amount.toLocaleString()}</Text>
                    </View>
                    
                    <View style={styles.invoiceRow}>
                      <Text style={styles.dueDate}>
                        {isPaid ? `Paid on ${item.paid_on}` : `Due by ${item.due_date}`}
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        isPaid ? styles.badgePaid : styles.badgeUnpaid
                      ]}>
                        <Text style={[
                          styles.statusText,
                          isPaid ? { color: colors.green } : { color: '#E74C3C' }
                        ]}>
                          {isPaid ? '🟢 PAID' : '🔴 UNPAID'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actionRow}>
                      {isPaid ? (
                        <TouchableOpacity 
                          style={styles.receiptButton} 
                          onPress={() => {
                            setRecentTransaction(item);
                            setReceiptVisible(true);
                          }}
                        >
                          <Text style={styles.receiptButtonText}>📄 View Receipt</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity 
                          style={[styles.payButton, { backgroundColor: colors.teal }]} 
                          onPress={() => handlePayPress(item)}
                        >
                          <Text style={styles.payButtonText}>⚡ Pay Now</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Mock Checkout Modal */}
      <Modal visible={checkoutVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.checkoutContent}>
            <View style={styles.checkoutHeader}>
              <Text style={styles.checkoutTitle}>Secure Checkout</Text>
              <TouchableOpacity onPress={() => setCheckoutVisible(false)} style={styles.closeBtn}>
                <Text style={{ fontSize: 20, color: colors.gray }}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedFee && (
              <View style={styles.checkoutSummary}>
                <Text style={styles.summaryDesc}>{selectedFee.description}</Text>
                <Text style={styles.summaryAmount}>₹{selectedFee.amount.toLocaleString()}</Text>
              </View>
            )}

            {/* Payment Method Selector */}
            <View style={styles.methodSelector}>
              <TouchableOpacity
                style={[styles.methodBtn, paymentMethod === 'upi' && styles.methodBtnActive]}
                onPress={() => setPaymentMethod('upi')}
              >
                <Text style={[styles.methodBtnText, paymentMethod === 'upi' && styles.methodBtnTextActive]}>🌐 UPI Pay</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodBtn, paymentMethod === 'card' && styles.methodBtnActive]}
                onPress={() => setPaymentMethod('card')}
              >
                <Text style={[styles.methodBtnText, paymentMethod === 'card' && styles.methodBtnTextActive]}>💳 Credit Card</Text>
              </TouchableOpacity>
            </View>

            {/* Payment Method Details */}
            {paymentMethod === 'upi' ? (
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Enter UPI ID</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. parent@ybl"
                  placeholderTextColor={colors.gray}
                  value={upiId}
                  onChangeText={setUpiId}
                  autoCapitalize="none"
                />
                <Text style={styles.inputHelp}>Supports Google Pay, PhonePe, BHIM, etc.</Text>
              </View>
            ) : (
              <View>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Card Number</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="4111 2222 3333 4444"
                    placeholderTextColor={colors.gray}
                    keyboardType="numeric"
                    value={cardNumber}
                    onChangeText={(val) => {
                      const sanitized = val.replace(/\D/g, '');
                      const formatted = sanitized.match(/.{1,4}/g)?.join(' ') || sanitized;
                      setCardNumber(formatted.slice(0, 19));
                    }}
                  />
                </View>
                <View style={styles.rowInputs}>
                  <View style={[styles.formGroup, { width: '48%' }]}>
                    <Text style={styles.inputLabel}>Expiry (MM/YY)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="12/28"
                      placeholderTextColor={colors.gray}
                      keyboardType="numeric"
                      value={cardExpiry}
                      onChangeText={(val) => {
                        const sanitized = val.replace(/\D/g, '');
                        if (sanitized.length > 2) {
                          setCardExpiry(sanitized.slice(0, 2) + '/' + sanitized.slice(2, 4));
                        } else {
                          setCardExpiry(sanitized);
                        }
                      }}
                      maxLength={5}
                    />
                  </View>
                  <View style={[styles.formGroup, { width: '48%' }]}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="123"
                      placeholderTextColor={colors.gray}
                      keyboardType="numeric"
                      secureTextEntry
                      value={cardCvv}
                      onChangeText={(val) => setCardCvv(val.replace(/\D/g, '').slice(0, 3))}
                      maxLength={3}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Pay Button */}
            <TouchableOpacity
              style={[styles.paySubmitBtn, { backgroundColor: colors.teal }]}
              onPress={executeMockPayment}
              disabled={paying}
            >
              {paying ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.paySubmitText}>⚡ Pay Mock Amount</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.securityNote}>🔒 This is a simulated school payments gateway sandbox.</Text>
          </View>
        </View>
      </Modal>

      {/* Printable Receipt Modal */}
      <Modal visible={receiptVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.receiptContent}>
            <View style={styles.receiptTop}>
              <Text style={styles.checkmarkEmoji}>✅</Text>
              <Text style={styles.receiptStatus}>Payment Successful!</Text>
              <Text style={styles.receiptSub}>Thank you for your payment</Text>
            </View>

            {recentTransaction && (
              <View style={styles.receiptBill}>
                <View style={styles.receiptLogoHeader}>
                  <Text style={styles.receiptSchoolName}>🏫 Greenwood Public School</Text>
                  <Text style={styles.receiptSchoolInfo}>UDISE: 27430012 | Affiliated Board</Text>
                </View>
                
                <View style={styles.receiptDottedBorder} />

                <View style={styles.receiptRowItem}>
                  <Text style={styles.receiptField}>Receipt No:</Text>
                  <Text style={styles.receiptVal}>{recentTransaction.transaction_id.slice(-8)}</Text>
                </View>
                <View style={styles.receiptRowItem}>
                  <Text style={styles.receiptField}>Transaction ID:</Text>
                  <Text style={[styles.receiptVal, { fontSize: 10 }]}>{recentTransaction.transaction_id}</Text>
                </View>
                <View style={styles.receiptRowItem}>
                  <Text style={styles.receiptField}>Date paid:</Text>
                  <Text style={styles.receiptVal}>{recentTransaction.paid_on}</Text>
                </View>
                <View style={styles.receiptRowItem}>
                  <Text style={styles.receiptField}>Payment Mode:</Text>
                  <Text style={styles.receiptVal}>{recentTransaction.payment_method}</Text>
                </View>
                
                <View style={styles.receiptDottedBorder} />
                
                <View style={styles.receiptRowItem}>
                  <Text style={styles.receiptField}>Fee item:</Text>
                  <Text style={styles.receiptVal}>{recentTransaction.description}</Text>
                </View>

                <View style={styles.receiptDottedBorder} />

                <View style={[styles.receiptRowItem, { marginTop: 10 }]}>
                  <Text style={[styles.receiptField, { fontWeight: 'bold', color: colors.text }]}>Total Paid:</Text>
                  <Text style={[styles.receiptVal, { fontWeight: 'bold', fontSize: 18, color: colors.green }]}>
                    ₹{recentTransaction.amount.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.receiptFooter}>
                  <Text style={styles.footerNote}>This is a computer-generated school ERP receipt.</Text>
                  <Text style={styles.footerSeal}>Seal: APPROVED SANDBOX PAYMENT</Text>
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.closeReceiptBtn, { backgroundColor: colors.text }]}
              onPress={() => setReceiptVisible(false)}
            >
              <Text style={styles.closeReceiptText}>Close Receipt</Text>
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
  summaryCard: {
    backgroundColor: colors.white,
    margin: 15,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.lightGray,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.gray,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  balanceAmount: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginTop: 5,
  },
  summaryVisual: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E74C3C15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginHorizontal: 15,
    marginBottom: 12,
  },
  invoiceCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardAccent: {
    width: 6,
  },
  invoiceDetails: {
    flex: 1,
    padding: 15,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feeType: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  dueDate: {
    fontSize: 12,
    color: colors.gray,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgePaid: {
    backgroundColor: colors.green + '15',
  },
  badgeUnpaid: {
    backgroundColor: '#E74C3C15',
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  actionRow: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    marginTop: 8,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  payButton: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 6,
  },
  payButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  receiptButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  receiptButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  checkoutContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  checkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkoutTitle: {
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
  checkoutSummary: {
    backgroundColor: colors.background,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  summaryDesc: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.teal,
  },
  methodSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 4,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  methodBtnActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  methodBtnText: {
    fontSize: 13,
    color: colors.gray,
    fontWeight: 'bold',
  },
  methodBtnTextActive: {
    color: colors.text,
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
    fontSize: 15,
    color: colors.text,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputHelp: {
    fontSize: 11,
    color: colors.gray,
    marginTop: 4,
  },
  paySubmitBtn: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  paySubmitText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  securityNote: {
    fontSize: 10,
    color: colors.gray,
    textAlign: 'center',
    marginTop: 15,
  },
  receiptContent: {
    backgroundColor: colors.white,
    width: '90%',
    alignSelf: 'center',
    marginTop: '15%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  receiptTop: {
    alignItems: 'center',
    marginBottom: 15,
  },
  checkmarkEmoji: {
    fontSize: 48,
  },
  receiptStatus: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.green,
    marginTop: 8,
  },
  receiptSub: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  receiptBill: {
    backgroundColor: '#FAF7F2',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  receiptLogoHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  receiptSchoolName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  receiptSchoolInfo: {
    fontSize: 9,
    color: colors.gray,
    marginTop: 2,
  },
  receiptDottedBorder: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderStyle: 'dashed',
    borderRadius: 1,
    marginVertical: 10,
  },
  receiptRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  receiptField: {
    fontSize: 12,
    color: colors.gray,
  },
  receiptVal: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  receiptFooter: {
    alignItems: 'center',
    marginTop: 15,
  },
  footerNote: {
    fontSize: 8,
    color: colors.gray,
    textAlign: 'center',
  },
  footerSeal: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.teal,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.teal,
    borderStyle: 'dashed',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  closeReceiptBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  closeReceiptText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
