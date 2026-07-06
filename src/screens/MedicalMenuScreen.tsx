import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { fetchMedicalProcedures, deleteMedicalProcedure, MedicalProcedure } from '../api/client';
import NavHeader from '../components/NavHeader';
import ConfirmModal from '../components/ConfirmModal';
import ErrorModal from '../components/ErrorModal';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'MedicalMenu'> };

function fmtDate(d: string): string {
  return d ? d.slice(0, 10).split('-').reverse().join('.') : '—';
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function MedicalMenuScreen({ navigation }: Props) {
  const { lang } = useLang();
  const ro = lang === 'RO';

  const [procedures, setProcedures] = useState<MedicalProcedure[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [deleteTarget, setDelete]   = useState<MedicalProcedure | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchMedicalProcedures().then(setProcedures).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDelete(null);
    try {
      await deleteMedicalProcedure(id);
      setProcedures(prev => prev.filter(p => p.id !== id));
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />
      <ConfirmModal
        message={deleteTarget
          ? (ro ? `Stergeti procedura "${deleteTarget.procedure_type} / ${deleteTarget.medication_name}"?`
                : `Delete procedure "${deleteTarget.procedure_type} / ${deleteTarget.medication_name}"?`)
          : null}
        labelYes={ro ? 'Sterge' : 'Delete'}
        labelNo={ro ? 'Anuleaza' : 'Cancel'}
        onYes={handleDelete}
        onNo={() => setDelete(null)}
      />

      <NavHeader
        title={ro ? 'Medicale' : 'Medical'}
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            style={styles.histBtn}
            onPress={() => navigation.navigate('MedicalHistory')}
            activeOpacity={0.8}
          >
            <Text style={styles.histBtnTxt}>{ro ? 'Listă' : 'List'}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Individual Treatment button */}
        <TouchableOpacity
          style={styles.individualBtn}
          onPress={() => navigation.navigate('MedicalScan', { mode: 'individual' })}
          activeOpacity={0.8}
        >
          <Text style={styles.individualBtnTxt}>{ro ? 'Tratament Individual' : 'Individual Treatment'}</Text>
        </TouchableOpacity>

        {/* Procedures section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{ro ? 'Proceduri' : 'Procedures'}</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('MedicalAddProcedure')}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnTxt}>{ro ? '+ Adauga' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>

        {loading
          ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
          : procedures.filter(p => p.end_period >= todayISO()).length === 0
            ? <Text style={styles.empty}>{ro ? 'Nicio procedura activa' : 'No active procedures'}</Text>
            : (
              <View style={styles.card}>
                {procedures.filter(p => p.end_period >= todayISO()).map((p, idx) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.procRow, idx > 0 && styles.procBorder]}
                    onPress={() => navigation.navigate('MedicalScan', {
                      mode: 'procedure',
                      procedureId: p.id,
                      procedureName: p.procedure_type,
                      medicationName: p.medication_name,
                    })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.procInfo}>
                      <Text style={styles.procType}>{p.procedure_type}</Text>
                      <Text style={styles.procMed}>{p.medication_name}</Text>
                      <Text style={styles.procPeriod}>{fmtDate(p.begin_period)} – {fmtDate(p.end_period)}</Text>
                    </View>
                    <View style={styles.rowBtns}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => navigation.navigate('MedicalAddProcedure', { procedure: p })}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.editTxt}>✎</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => setDelete(p)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.deleteTxt}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )
        }
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.background },
  histBtn:        { backgroundColor: '#E65100', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 5 },
  histBtnTxt:     { color: '#fff', fontSize: 13, fontWeight: '700' },
  scroll:         { padding: 16, gap: 14 },
  individualBtn:  { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 20, alignItems: 'center' },
  individualBtnTxt:{ color: '#fff', fontSize: 16, fontWeight: '800' },
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle:   { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  addBtn:         { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnTxt:      { color: '#fff', fontSize: 13, fontWeight: '700' },
  empty:          { textAlign: 'center', color: Colors.textMuted, fontStyle: 'italic', marginTop: 20 },
  card:           { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, backgroundColor: Colors.card },
  procRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  procBorder:     { borderTopWidth: 1, borderTopColor: Colors.border },
  procInfo:       { flex: 1, gap: 2 },
  procType:       { fontSize: 14, fontWeight: '800', color: Colors.textDark },
  procMed:        { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  procPeriod:     { fontSize: 11, color: Colors.textMuted },
  rowBtns:        { flexDirection: 'row', gap: 6 },
  editBtn:        { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#1565C0', borderRadius: 6 },
  editTxt:        { color: '#fff', fontSize: 13, fontWeight: '900' },
  deleteBtn:      { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#C62828', borderRadius: 6 },
  deleteTxt:      { color: '#fff', fontSize: 13, fontWeight: '900' },
});
