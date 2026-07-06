import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { fetchInseminationStats, fetchBulls, addBull, editBull, deleteBull, Bull } from '../api/client';
import ErrorModal from '../components/ErrorModal';
import ConfirmModal from '../components/ConfirmModal';
import NavHeader from '../components/NavHeader';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'InseminationMenu'>;
};

type ModalMode = 'add' | 'edit';

export default function InseminationMenuScreen({ navigation }: Props) {
  const { lang, t } = useLang();
  const ro = lang === 'RO';

  const [stats,      setStats]      = useState(0);
  const [bulls,      setBulls]      = useState<Bull[]>([]);
  const [error,      setError]      = useState<string | null>(null);
  const [modalMode,  setModalMode]  = useState<ModalMode>('add');
  const [showModal,  setShowModal]  = useState(false);
  const [editTarget, setEditTarget] = useState<Bull | null>(null);
  const [bullName,   setBullName]   = useState('');
  const [bullCode,   setBullCode]   = useState('');
  const [saving,     setSaving]     = useState(false);
  const [confirmBull, setConfirmBull] = useState<Bull | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([fetchInseminationStats(), fetchBulls()]);
      setStats(s.prepared_last_3_weeks);
      setBulls(b);
    } catch {}
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const openAdd = () => {
    setModalMode('add');
    setEditTarget(null);
    setBullName(''); setBullCode('');
    setShowModal(true);
  };

  const openEdit = (bull: Bull) => {
    setModalMode('edit');
    setEditTarget(bull);
    setBullName(bull.name);
    setBullCode(bull.code);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setBullName(''); setBullCode('');
    setEditTarget(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modalMode === 'add') {
        const bull = await addBull(bullName.trim(), bullCode.trim());
        setBulls(prev => [...prev, bull]);
      } else if (editTarget) {
        const updated = await editBull(editTarget.id, bullName.trim(), bullCode.trim());
        setBulls(prev => prev.map(b => b.id === updated.id ? updated : b));
      }
      closeModal();
    } catch (e: any) {
      setError(e?.message ?? (ro ? 'Eroare' : 'Error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmBull) return;
    const id = confirmBull.id;
    setConfirmBull(null);
    try {
      await deleteBull(id);
      setBulls(prev => prev.filter(b => b.id !== id));
    } catch (e: any) {
      setError(e?.message ?? (ro ? 'Eroare' : 'Error'));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />
      <ConfirmModal
        message={confirmBull ? `Are you sure you want to delete "${confirmBull.name}"?` : null}
        labelYes={ro ? 'Sterge' : 'Delete'}
        labelNo={ro ? 'Anuleaza' : 'Cancel'}
        onYes={handleDelete}
        onNo={() => setConfirmBull(null)}
      />

      {/* Add / Edit Bull Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.overlay}>
          <View style={styles.popup}>
            <Text style={styles.popupTitle}>
              {modalMode === 'add' ? (ro ? 'Adauga taur' : 'Add bull') : (ro ? 'Editeaza taur' : 'Edit bull')}
            </Text>
            <TextInput
              style={styles.popupInput}
              placeholder={ro ? 'Nume' : 'Name'}
              placeholderTextColor={Colors.border}
              value={bullName}
              onChangeText={setBullName}
              autoFocus
            />
            <TextInput
              style={styles.popupInput}
              placeholder={ro ? 'Cod (cifre)' : 'Code (numbers)'}
              placeholderTextColor={Colors.border}
              value={bullCode}
              onChangeText={v => setBullCode(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            <View style={styles.popupRow}>
              <TouchableOpacity
                style={[styles.popupBtnYes, saving && { opacity: 0.5 }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.popupBtnYesTxt}>{modalMode === 'add' ? (ro ? 'Adauga' : 'Add') : (ro ? 'Salveaza' : 'Save')}</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={styles.popupBtnNo} onPress={closeModal} activeOpacity={0.8}>
                <Text style={styles.popupBtnNoTxt}>{ro ? 'Anuleaza' : 'Cancel'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <NavHeader title={ro ? 'Insamanare Artificiala' : 'Artificial Insemination'} onBack={() => navigation.goBack()} />

      <View style={styles.statsBanner}>
        <Text style={styles.statTxt}>
          {ro ? 'Pregatite ultimele 3 saptamani' : 'Prepared last 3 weeks'}: <Text style={styles.statNum}>{stats}</Text>
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('InseminationPrepareScan')} activeOpacity={0.8}>
            <Text style={styles.actionBtnTxt}>{ro ? 'Pregatire' : 'Preparation'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.listBtn} onPress={() => navigation.navigate('InseminationList', { listType: 'prepared' })} activeOpacity={0.8}>
            <Text style={styles.listBtnTxt}>List</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('InseminationScan')} activeOpacity={0.8}>
            <Text style={styles.actionBtnTxt}>{ro ? 'Insamantare' : 'Insemination'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.listBtn} onPress={() => navigation.navigate('InseminationList', { listType: 'inseminated' })} activeOpacity={0.8}>
            <Text style={styles.listBtnTxt}>List</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bullsHeader}>
          <Text style={styles.bullsTitle}>{ro ? 'Tauri activi' : 'Active bulls'}</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
            <Text style={styles.addBtnTxt}>{ro ? '+ Adauga' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>

        {bulls.length === 0
          ? <Text style={styles.noBulls}>{ro ? 'Niciun taur inregistrat' : 'No bulls registered'}</Text>
          : bulls.map(b => (
            <View key={b.id} style={styles.bullRow}>
              <TouchableOpacity style={styles.bullCard} onPress={() => openEdit(b)} activeOpacity={0.7}>
                <Text style={styles.bullName}>{b.name}</Text>
                <Text style={styles.bullCode}>{b.code}</Text>
              </TouchableOpacity>
              {!b.used && (
                <TouchableOpacity style={styles.deleteBtn} onPress={() => setConfirmBull(b)} activeOpacity={0.8}>
                  <Text style={styles.deleteBtnTxt}>{ro ? 'Sterge' : 'Delete'}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        }

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.background },
  statsBanner:    { backgroundColor: Colors.primaryLight, paddingHorizontal: 16, paddingVertical: 10 },
  statTxt:        { fontSize: 14, color: Colors.primaryDark, fontWeight: '600' },
  statNum:        { fontWeight: '800' },
  scroll:         { padding: 16, gap: 12 },

  actionRow:      { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  actionBtn:      { flex: 1, backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 22, alignItems: 'center', justifyContent: 'center' },
  actionBtnTxt:   { color: '#fff', fontSize: 20, fontWeight: '800' },
  listBtn:        { backgroundColor: '#E65100', borderRadius: 8, width: 90, alignItems: 'center', justifyContent: 'center' },
  listBtnTxt:     { color: '#fff', fontSize: 14, fontWeight: '800' },

  bullsHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  bullsTitle:     { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  addBtn:         { backgroundColor: Colors.primary, borderRadius: 8, width: 90, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  addBtnTxt:      { color: '#fff', fontSize: 13, fontWeight: '700' },

  noBulls:        { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic' },
  bullRow:        { flexDirection: 'row', alignItems: 'stretch', gap: 10 },
  bullCard:       { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12,
                    borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: Colors.card },
  bullName:       { fontSize: 14, fontWeight: '700', color: Colors.primary },
  bullCode:       { fontSize: 13, color: Colors.textMuted, fontFamily: 'monospace' },
  deleteBtn:      { backgroundColor: '#C62828', borderRadius: 8, width: 90, alignItems: 'center', justifyContent: 'center' },
  deleteBtnTxt:   { color: '#fff', fontSize: 13, fontWeight: '700' },

  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  popup:          { backgroundColor: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 340, gap: 14,
                    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 10 },
  popupTitle:     { fontSize: 18, fontWeight: '800', color: Colors.textDark, textAlign: 'center' },
  popupInput:     { borderWidth: 2, borderColor: Colors.primary, borderRadius: 8, fontSize: 16, paddingVertical: 12, paddingHorizontal: 14, color: Colors.textDark, backgroundColor: Colors.card },
  popupRow:       { flexDirection: 'column', gap: 10, marginTop: 4 },
  popupBtnYes:    { backgroundColor: '#2E7D32', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  popupBtnYesTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  popupBtnNo:     { backgroundColor: '#C62828', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  popupBtnNoTxt:  { color: '#fff', fontSize: 16, fontWeight: '700' },
});
