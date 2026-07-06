import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Modal,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { fetchGroupBulls, searchBullEligible, addGroupBull, removeGroupBull, GroupAnimal } from '../api/client';
import NavHeader from '../components/NavHeader';
import ErrorModal from '../components/ErrorModal';
import ConfirmModal from '../components/ConfirmModal';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'GroupBullList'> };

const COLOR_MAP: Record<string, { en: string; ro: string }> = {
  'R':     { en: 'Red',   ro: 'Rosu' },
  'RED':   { en: 'Red',   ro: 'Rosu' },
  'N':     { en: 'Black', ro: 'Negru' },
  'BLACK': { en: 'Black', ro: 'Negru' },
};

function fmtColor(color: string | undefined, ro: boolean): string {
  if (!color) return '';
  const c = COLOR_MAP[color.toUpperCase()];
  return c ? (ro ? c.ro : c.en) : color;
}

function ageMonths(birthDate: string | undefined): number {
  if (!birthDate) return 0;
  const b = new Date(birthDate);
  const n = new Date();
  return (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
}

function fmtAge(birthDate: string | undefined, ro: boolean): string {
  const m = ageMonths(birthDate);
  if (m === 0) return '';
  const years = Math.floor(m / 12);
  const rem = m % 12;
  const suffix = ro ? 'A' : 'Y';
  return `${rem >= 6 ? years + 1 : years}${suffix}`;
}

export default function GroupBullListScreen({ navigation }: Props) {
  const { lang } = useLang();
  const ro = lang === 'RO';

  const [bulls,        setBulls]        = useState<GroupAnimal[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GroupAnimal | null>(null);

  // Add flow
  const [showAddModal, setShowAddModal] = useState(false);
  const [scanLast4,    setScanLast4]    = useState('');
  const [scanResult,   setScanResult]   = useState<GroupAnimal | null>(null);
  const [bullNameInput,setBullNameInput]= useState('');
  const [scanning,     setScanning]     = useState(false);
  const [saving,       setSaving]       = useState(false);
  // Name edit for existing bulls without name
  const [editTarget,   setEditTarget]   = useState<GroupAnimal | null>(null);
  const [editName,     setEditName]     = useState('');

  const load = useCallback(() => {
    fetchGroupBulls().then(setBulls).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleScan = async () => {
    if (scanLast4.length < 4) return;
    setScanning(true);
    try {
      const results = await searchBullEligible(scanLast4);
      if (results.length === 0) {
        setError(ro ? 'Crotaliu invalid sau nu e eligibil (minim 16 luni, mascul)' : 'ID not found or not eligible (min 16 months, male)');
      } else {
        setScanResult(results[0]);
        setBullNameInput('');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setScanning(false);
    }
  };

  const handleAdd = async () => {
    if (!scanResult || !bullNameInput.trim()) return;
    setSaving(true);
    try {
      await addGroupBull(scanResult.ear_tag, bullNameInput.trim());
      setShowAddModal(false);
      setScanLast4(''); setScanResult(null); setBullNameInput('');
      load();
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const tag = deleteTarget.ear_tag;
    setDeleteTarget(null);
    try {
      await removeGroupBull(tag);
      setBulls(prev => prev.filter(b => b.ear_tag !== tag));
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setScanLast4(''); setScanResult(null); setBullNameInput('');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />
      <ConfirmModal
        message={deleteTarget ? (ro ? `Sterge taurul ${deleteTarget.bull_name ?? deleteTarget.ear_tag}?` : `Delete bull ${deleteTarget.bull_name ?? deleteTarget.ear_tag}?`) : null}
        labelYes={ro ? 'Sterge' : 'Delete'}
        labelNo={ro ? 'Anuleaza' : 'Cancel'}
        onYes={handleDelete}
        onNo={() => setDeleteTarget(null)}
      />

      {/* Add Bull Modal */}
      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={closeAddModal}>
        <View style={styles.overlay}>
          <View style={styles.popup}>
            <Text style={styles.popupTitle}>{ro ? 'Adauga Taur' : 'Add Bull'}</Text>

            {!scanResult ? (
              <>
                <Text style={styles.popupLabel}>{ro ? 'Ultimele 4 cifre:' : 'Last 4 digits:'}</Text>
                <TextInput
                  style={styles.popupInput}
                  value={scanLast4}
                  onChangeText={v => setScanLast4(v.replace(/\D/g, '').slice(0, 10))}
                  keyboardType="number-pad"
                  placeholder="0000"
                  placeholderTextColor={Colors.border}
                  autoFocus
                  onSubmitEditing={handleScan}
                />
                <TouchableOpacity
                  style={[styles.popupBtnGreen, (scanning || scanLast4.length < 4) && { opacity: 0.5 }]}
                  onPress={handleScan}
                  disabled={scanning || scanLast4.length < 4}
                  activeOpacity={0.8}
                >
                  {scanning ? <ActivityIndicator color="#fff" /> : <Text style={styles.popupBtnTxt}>{ro ? 'Cauta' : 'Search'}</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.foundTag}>{scanResult.ear_tag}</Text>
                <Text style={styles.popupLabel}>{ro ? 'Numele taurului:' : 'Bull name:'}</Text>
                <TextInput
                  style={styles.popupInput}
                  value={bullNameInput}
                  onChangeText={setBullNameInput}
                  placeholder={ro ? 'ex: Pharaoff' : 'e.g. Pharaoff'}
                  placeholderTextColor={Colors.border}
                  autoFocus
                  onSubmitEditing={handleAdd}
                />
                <TouchableOpacity
                  style={[styles.popupBtnGreen, (!bullNameInput.trim() || saving) && { opacity: 0.5 }]}
                  onPress={handleAdd}
                  disabled={!bullNameInput.trim() || saving}
                  activeOpacity={0.8}
                >
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.popupBtnTxt}>{ro ? 'Adauga' : 'Add'}</Text>}
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.popupBtnRed} onPress={closeAddModal} activeOpacity={0.8}>
              <Text style={styles.popupBtnTxt}>{ro ? 'Anuleaza' : 'Cancel'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit name modal */}
      <Modal visible={!!editTarget} transparent animationType="fade" onRequestClose={() => setEditTarget(null)}>
        <View style={styles.overlay}>
          <View style={styles.popup}>
            <Text style={styles.popupTitle}>{ro ? 'Numele taurului' : 'Bull name'}</Text>
            <Text style={styles.foundTag}>{editTarget?.ear_tag}</Text>
            <TextInput
              style={styles.popupInput}
              value={editName}
              onChangeText={setEditName}
              placeholder={ro ? 'ex: Pharaoff' : 'e.g. Pharaoff'}
              placeholderTextColor={Colors.border}
              autoFocus
              onSubmitEditing={async () => {
                if (!editTarget || !editName.trim()) return;
                setSaving(true);
                try {
                  await addGroupBull(editTarget.ear_tag, editName.trim());
                  setEditTarget(null); setEditName('');
                  load();
                } catch (e: any) { setError(e?.message ?? 'Error'); }
                finally { setSaving(false); }
              }}
            />
            <TouchableOpacity
              style={[styles.popupBtnGreen, (!editName.trim() || saving) && { opacity: 0.5 }]}
              disabled={!editName.trim() || saving}
              onPress={async () => {
                if (!editTarget || !editName.trim()) return;
                setSaving(true);
                try {
                  await addGroupBull(editTarget.ear_tag, editName.trim());
                  setEditTarget(null); setEditName('');
                  load();
                } catch (e: any) { setError(e?.message ?? 'Error'); }
                finally { setSaving(false); }
              }}
              activeOpacity={0.8}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.popupBtnTxt}>{ro ? 'Salveaza' : 'Save'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.popupBtnRed} onPress={() => setEditTarget(null)} activeOpacity={0.8}>
              <Text style={styles.popupBtnTxt}>{ro ? 'Anuleaza' : 'Cancel'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <NavHeader title={ro ? 'Lista Tauri' : 'Bull List'} onBack={() => navigation.goBack()} />

      <View style={styles.addRow}>
        <Text style={styles.addRowTitle}>{ro ? 'Tauri definitii' : 'Defined Bulls'}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
          <Text style={styles.addBtnTxt}>{ro ? '+ Adauga' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>

      {loading
        ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 30 }} />
        : (
          <ScrollView contentContainerStyle={styles.list}>
            {bulls.length === 0 && (
              <Text style={styles.empty}>{ro ? 'Niciun taur definit' : 'No bulls defined'}</Text>
            )}
            {bulls.map(b => {
              const isAutoBull = ageMonths(b.birth_date) >= 24;
              return (
                <View key={b.ear_tag} style={styles.bullRow}>
                  <TouchableOpacity
                    style={styles.bullInfo}
                    onPress={() => { setEditTarget(b); setEditName(b.bull_name ?? ''); }}
                    activeOpacity={0.7}
                  >
                    <Text style={b.bull_name ? styles.bullName : styles.bullNameEmpty}>
                      {b.bull_name ?? (ro ? 'Fara Nume' : 'No Name')}
                    </Text>
                    <View style={styles.bullTagRow}>
                    <Text style={styles.bullTag}>{b.ear_tag}{b.color ? `  ·  ${fmtColor(b.color, ro)}` : ''}</Text>
                    <Text style={styles.bullAge}>{fmtAge(b.birth_date, ro)}</Text>
                  </View>
                  </TouchableOpacity>
                  {!isAutoBull && (
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleteTarget(b)} activeOpacity={0.8}>
                      <Text style={styles.deleteBtnTxt}>{ro ? 'Sterge' : 'Delete'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.background },
  addRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  addRowTitle: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  addBtn:      { backgroundColor: Colors.primary, borderRadius: 8, width: 90, paddingVertical: 8, alignItems: 'center' },
  addBtnTxt:   { color: '#fff', fontSize: 13, fontWeight: '700' },
  list:        { padding: 12, gap: 10 },
  empty:       { textAlign: 'center', color: Colors.textMuted, fontStyle: 'italic', marginTop: 30 },
  bullRow:     { flexDirection: 'row', alignItems: 'stretch', gap: 10 },
  bullInfo:    { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.card, gap: 2 },
  bullName:      { fontSize: 15, fontWeight: '800', color: Colors.primary },
  bullNameEmpty: { fontSize: 15, fontWeight: '500', color: Colors.textMuted, fontStyle: 'italic' },
  bullTagRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bullTag:       { fontSize: 12, color: Colors.textMuted, fontFamily: 'monospace' },
  bullAge:       { fontSize: 12, color: Colors.textMuted, fontFamily: 'monospace', textAlign: 'right' },
  deleteBtn:   { backgroundColor: '#C62828', borderRadius: 8, width: 90, alignItems: 'center', justifyContent: 'center' },
  deleteBtnTxt:{ color: '#fff', fontSize: 13, fontWeight: '700' },

  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  popup:       { backgroundColor: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 340, gap: 12, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 },
  popupTitle:  { fontSize: 18, fontWeight: '800', color: Colors.textDark, textAlign: 'center' },
  popupLabel:  { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  popupInput:  { borderWidth: 2, borderColor: Colors.primary, borderRadius: 8, fontSize: 16, paddingVertical: 12, paddingHorizontal: 14, color: Colors.textDark, backgroundColor: Colors.card },
  foundTag:    { fontSize: 13, color: Colors.textDark, fontFamily: 'monospace', fontWeight: '700', textAlign: 'center', backgroundColor: '#E8F5E9', padding: 8, borderRadius: 6 },
  popupBtnGreen:{ backgroundColor: '#2E7D32', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  popupBtnRed:  { backgroundColor: '#C62828', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  popupBtnTxt:  { color: '#fff', fontSize: 16, fontWeight: '800' },
});
