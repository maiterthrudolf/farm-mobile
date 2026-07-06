import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type Props = {
  message: string | null;
  labelYes?: string;
  labelNo?: string;
  onYes: () => void;
  onNo: () => void;
};

export default function ConfirmModal({ message, labelYes = 'Yes', labelNo = 'No', onYes, onNo }: Props) {
  return (
    <Modal
      visible={!!message}
      transparent
      animationType="fade"
      onRequestClose={onNo}
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.title}>?</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.row}>
            <TouchableOpacity style={styles.btnYes} onPress={onYes} activeOpacity={0.8}>
              <Text style={styles.btnYesTxt}>{labelYes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnNo} onPress={onNo} activeOpacity={0.8}>
              <Text style={styles.btnNoTxt}>{labelNo}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  popup:     { backgroundColor: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 340, alignItems: 'center', gap: 14,
               shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 10 },
  title:     { fontSize: 40, color: '#E65100' },
  message:   { fontSize: 16, color: '#212121', textAlign: 'center', fontWeight: '600', lineHeight: 24 },
  row:       { flexDirection: 'column', gap: 10, marginTop: 4, width: '100%' },
  btnYes:    { backgroundColor: '#2E7D32', borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  btnYesTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
  btnNo:     { backgroundColor: '#C62828', borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  btnNoTxt:  { color: '#fff', fontSize: 17, fontWeight: '700' },
});
