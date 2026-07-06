import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { fetchProcedureTypes, createMedicalProcedure, updateMedicalProcedure, MedicalProcedure } from '../api/client';
import NavHeader from '../components/NavHeader';
import ErrorModal from '../components/ErrorModal';
import FormField from '../components/FormField';
import DateField from '../components/DateField';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MedicalAddProcedure'>;
  route: import('@react-navigation/native').RouteProp<RootStackParamList, 'MedicalAddProcedure'>;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function MedicalAddProcedureScreen({ navigation, route }: Props) {
  const { lang } = useLang();
  const ro = lang === 'RO';
  const existing = route?.params?.procedure ?? null;
  const isEdit = existing != null;

  const [types,      setTypes]      = useState<string[]>([]);
  const [selType,    setSelType]    = useState(existing?.procedure_type ?? '');
  const [medication, setMedication] = useState(existing?.medication_name ?? '');
  const [beginDate,  setBeginDate]  = useState(existing?.begin_period?.slice(0, 10) ?? todayISO());
  const [endDate,    setEndDate]    = useState(existing?.end_period?.slice(0, 10) ?? todayISO());
  const [comment,    setComment]    = useState('');
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    fetchProcedureTypes().then(setTypes).catch(() => {});
  }, []);

  const today = todayISO();
  const canSave = selType !== '' && medication.trim() !== '' && beginDate !== '' && endDate !== '';

  const handleBeginChange = (v: string) => {
    setBeginDate(v);
    if (endDate < v) setEndDate(v);
  };

  const handleSave = async () => {
    if (!canSave) return;
    if (beginDate < today) {
      setError(ro ? 'Data de inceput nu poate fi in trecut' : 'Begin date cannot be in the past');
      return;
    }
    if (endDate < beginDate) {
      setError(ro ? 'Data de sfarsit trebuie sa fie >= data de inceput' : 'End date must be >= Begin date');
      return;
    }
    setSaving(true);
    try {
      if (isEdit && existing) {
        await updateMedicalProcedure(existing.id, {
          procedure_type: selType,
          medication_name: medication.trim(),
          begin_period: beginDate,
          end_period: endDate,
          comment: comment.trim() || undefined,
        });
      } else {
        await createMedicalProcedure({
          procedure_type: selType,
          medication_name: medication.trim(),
          begin_period: beginDate,
          end_period: endDate,
          comment: comment.trim() || undefined,
        });
      }
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />
      <NavHeader title={isEdit ? (ro ? 'Editeaza Procedura' : 'Edit Procedure') : (ro ? 'Adauga Procedura' : 'Add Procedure')} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <FormField label={ro ? 'Procedura' : 'Procedure'}>
          <View style={styles.typeGrid}>
            {types.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, selType === t && styles.typeChipSel]}
                onPress={() => setSelType(t)}
                activeOpacity={0.7}
              >
                <Text style={[styles.typeChipTxt, selType === t && styles.typeChipTxtSel]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormField>

        <FormField label={ro ? 'Medicament' : 'Medication'}>
          <TextInput
            style={styles.input}
            value={medication}
            onChangeText={t => setMedication(t.length === 1 ? t.toUpperCase() : t)}
            placeholder={ro ? 'Numele medicamentului' : 'Medication name'}
            placeholderTextColor={Colors.border}
            maxLength={30}
          />
        </FormField>

        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <FormField label={ro ? 'Inceput Perioada' : 'Begin Period'}>
              <DateField value={beginDate} onChange={handleBeginChange} min={today} />
            </FormField>
          </View>
          <View style={styles.dateField}>
            <FormField label={ro ? 'Sfarsit Perioada' : 'End Period'}>
              <DateField value={endDate} onChange={setEndDate} min={beginDate} />
            </FormField>
          </View>
        </View>

        <FormField label={ro ? 'Comentariu' : 'Comment'}>
          <TextInput
            style={[styles.input, styles.commentInput]}
            value={comment}
            onChangeText={setComment}
            placeholder={ro ? 'Optional...' : 'Optional...'}
            placeholderTextColor={Colors.border}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </FormField>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, (!canSave || saving) && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={!canSave || saving}
          activeOpacity={0.8}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnTxt}>{ro ? 'Salvare' : 'Save'}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.background },
  scroll:        { padding: 16, gap: 14 },
  input:         { borderWidth: 2, borderColor: Colors.border, borderRadius: 8, fontSize: 16,
                   paddingVertical: 12, paddingHorizontal: 14, color: Colors.textDark, backgroundColor: Colors.card },
  typeGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip:      { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20,
                   paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.card },
  typeChipSel:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipTxt:   { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  typeChipTxtSel:{ color: '#fff' },
  dateRow:       { flexDirection: 'row', gap: 12 },
  dateField:     { flex: 1 },
  commentInput:  { minHeight: 80 },
  saveBtn:       { backgroundColor: '#2E7D32', borderRadius: 10, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  saveBtnTxt:    { color: '#fff', fontSize: 17, fontWeight: '800' },
});
