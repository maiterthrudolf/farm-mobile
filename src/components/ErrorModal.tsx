import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type Props = {
  message: string | null;
  onClose: () => void;
};

export default function ErrorModal({ message, onClose }: Props) {
  return (
    <Modal
      visible={!!message}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.title}>!</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.btn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.btnTxt}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  popup:    { backgroundColor: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 340, alignItems: 'center', gap: 14,
              shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 10 },
  title:    { fontSize: 40, color: '#C62828' },
  message:  { fontSize: 16, color: '#212121', textAlign: 'center', fontWeight: '600', lineHeight: 24 },
  btn:      { backgroundColor: '#C62828', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 40, marginTop: 4 },
  btnTxt:   { color: '#fff', fontSize: 16, fontWeight: '800' },
});
