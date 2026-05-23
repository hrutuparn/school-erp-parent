import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal
} from 'react-native';
import { supabase } from '../services/supabase';
import colors from '../components/colors';

export default function ParentChatScreen({ onBack, parentId, teacherId, studentName }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedCommand, setSelectedCommand] = useState(null);
  const [showCommandPicker, setShowCommandPicker] = useState(false);

  const commands = [
    { label: '/chat', value: '/chat', color: colors.teal },
    { label: '/complaint', value: '/complaint', color: colors.orange },
    { label: '/doubt', value: '/doubt', color: colors.purple },
    { label: '/request', value: '/request', color: colors.green }
  ];

  useEffect(() => {
    fetchMessages();
    const subscription = supabase
      .channel(`chat-${parentId}-${teacherId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `receiver_id=eq.${parentId},sender_id=eq.${teacherId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();
    return () => subscription.unsubscribe();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${parentId},receiver_id.eq.${teacherId}),and(sender_id.eq.${teacherId},receiver_id.eq.${parentId})`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.log(error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }
    if (!selectedCommand) {
      Alert.alert('Error', 'Please select a command (/chat, /complaint, /doubt, /request) before sending');
      return;
    }

    const fullMessage = `${selectedCommand} ${inputText.trim()}`;

    const newMessage = {
      sender_id: String(parentId),
      sender_type: 'parent',
      receiver_id: String(teacherId),
      message: fullMessage,
      command: selectedCommand.substring(1), // store without slash
      created_at: new Date()
    };
    setInputText('');
    setMessages(prev => [...prev, { ...newMessage, id: Date.now() }]);

    try {
      const { error } = await supabase.from('chat_messages').insert([newMessage]);
      if (error) throw error;
    } catch (error) {
      Alert.alert('Error', 'Failed to send');
      setMessages(prev => prev.filter(m => m.id !== newMessage.id));
    }
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const getCommandColor = (cmd) => {
    switch(cmd) {
      case 'chat': return colors.teal;
      case 'complaint': return colors.orange;
      case 'doubt': return colors.purple;
      case 'request': return colors.green;
      default: return colors.gray;
    }
  };

  const renderMessage = ({ item }) => {
    const isParent = item.sender_type === 'parent';
    const commandColor = item.command ? getCommandColor(item.command) : null;
    return (
      <View style={[styles.messageRow, isParent ? styles.parentRow : styles.teacherRow]}>
        <View style={[styles.messageBubble, isParent ? styles.parentBubble : styles.teacherBubble]}>
          {item.command && (
            <View style={[styles.commandTag, { backgroundColor: commandColor }]}>
              <Text style={styles.commandText}>/{item.command}</Text>
            </View>
          )}
          <Text style={styles.messageText}>{item.message}</Text>
          <Text style={styles.messageTime}>{formatTime(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Chat with Teacher</Text>
          <Text style={styles.headerSubtitle}>{studentName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          data={messages}
          keyExtractor={item => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 15 }}
        />

        {/* Command selector */}
        <View style={styles.commandSelector}>
          <TouchableOpacity
            style={styles.commandButton}
            onPress={() => setShowCommandPicker(true)}
          >
            <Text style={styles.commandButtonText}>
              {selectedCommand ? selectedCommand : 'Select command'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Message input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !selectedCommand && { opacity: 0.5 }]}
            onPress={sendMessage}
            disabled={!selectedCommand}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Command picker modal */}
      <Modal visible={showCommandPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose message type</Text>
            {commands.map((cmd) => (
              <TouchableOpacity
                key={cmd.value}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedCommand(cmd.value);
                  setShowCommandPicker(false);
                }}
              >
                <View style={[styles.commandPreview, { backgroundColor: cmd.color }]}>
                  <Text style={styles.commandPreviewText}>{cmd.label}</Text>
                </View>
                <Text style={styles.modalItemDesc}>
                  {cmd.label === '/chat' && 'General chat with teacher'}
                  {cmd.label === '/complaint' && 'Report an issue or concern'}
                  {cmd.label === '/doubt' && 'Ask a doubt about studies'}
                  {cmd.label === '/request' && 'Request something (e.g., documents, meeting)'}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCommandPicker(false)}
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
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.lightGray },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 24, color: colors.text },
  headerInfo: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  headerSubtitle: { fontSize: 12, color: colors.gray },
  messageRow: { marginBottom: 15 },
  teacherRow: { alignItems: 'flex-start' },
  parentRow: { alignItems: 'flex-end' },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 15 },
  teacherBubble: { backgroundColor: colors.teal },
  parentBubble: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.lightGray },
  messageText: { fontSize: 14, color: colors.text },
  messageTime: { fontSize: 10, color: colors.gray, marginTop: 4, alignSelf: 'flex-end' },
  commandTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginBottom: 6 },
  commandText: { fontSize: 9, color: colors.white, fontWeight: 'bold' },
  commandSelector: { paddingHorizontal: 15, marginBottom: 5 },
  commandButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.lightGray },
  commandButtonText: { fontSize: 14, color: colors.text },
  dropdownArrow: { fontSize: 16, color: colors.gray },
  inputContainer: { flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 10, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.lightGray },
  input: { flex: 1, backgroundColor: colors.lightGray, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, fontSize: 14, maxHeight: 100 },
  sendButton: { marginLeft: 10, paddingHorizontal: 15, borderRadius: 20, justifyContent: 'center', backgroundColor: colors.teal },
  sendButtonText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15, textAlign: 'center' },
  modalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.lightGray },
  commandPreview: { width: 90, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 15, marginRight: 12, alignItems: 'center' },
  commandPreviewText: { fontSize: 12, color: colors.white, fontWeight: 'bold' },
  modalItemDesc: { flex: 1, fontSize: 14, color: colors.text },
  modalCloseButton: { marginTop: 15, paddingVertical: 12, backgroundColor: colors.lightGray, borderRadius: 8 },
  modalCloseText: { fontSize: 16, color: colors.text, textAlign: 'center', fontWeight: '600' },
});