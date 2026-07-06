import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { recordIndividualTreatment, MedicalAnimalInfo } from '../api/client';
import NavHeader from '../components/NavHeader';
import ErrorModal from '../components/ErrorModal';
import ConfirmModal from '../components/ConfirmModal';
import FormField from '../components/FormField';
import DateField from '../components/DateField';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MedicalIndividual'>;
  route: RouteProp<RootStackParamList, 'MedicalIndividual'>;
};

const TREATMENTS = [
  'Antibiotic', 'Bandaj', 'Dezinfectie', 'Calciu',
  'Vitamine', 'Anestezic', 'Sutura', 'Copite', 'Castrare', 'Alte',
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function animalLabel(info: MedicalAnimalInfo, ro: boolean): string {
  const sex = info.sex === 'F' ? (ro ? 'Femela' : 'Female') : info.sex === 'M' ? (ro ? 'Mascul' : 'Male') : '—';
  const grp = info.group_name ? (/\bgrupa\b/i.test(info.group_name) ? info.group_name : `Grupa ${info.group_name}`) : '—';
  return `${sex}  ·  ${grp}`;
}

function fmtAge(birthDate: string | null | undefined, ro: boolean): string {
  if (!birthDate) return '—';
  const birth = new Date(birthDate);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  const rem = months % 12;
  const years = rem >= 6 ? Math.ceil(months / 12) : Math.floor(months / 12);
  return `${years} ${ro ? 'A' : 'Y'}`;
}

export default function MedicalIndividualScreen({ navigation, route }: Props) {
  const { earTag, animalInfo } = route.params;
  const { lang } = useLang();
  const ro = lang === 'RO';

  const [selected,       setSelected]       = useState<Set<string>>(new Set());
  const [treatmentDate,  setTreatmentDate]  = useState(todayISO());
  const [comment,        setComment]        = useState('');
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [askNeutered,    setAskNeutered]    = useState(false);

  const toggleTreatment = (t: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };

  const doSave = async (neuteredSet: boolean) => {
    setSaving(true);
    try {
      await recordIndividualTreatment({
        ear_tag: earTag,
        treatments: Array.from(selected).join(','),
        treatment_date: treatmentDate,
        comment: comment.trim() || undefined,
        neutered_set: neuteredSet,
      });
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message ?? 'Error');
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (selected.size === 0) {
      setError(ro ? 'Selectati cel putin un tratament' : 'Select at least one treatment');
      return;
    }
    if (selected.has('Castrare')) {
      setAskNeutered(true);
    } else {
      doSave(false);
    }
  };

  // Limit date to past 30 days
  const minDate = (() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10);
  })();

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />
      <ConfirmModal
        message={askNeutered
          ? (ro ? 'Castrare confirmata? Setam animalul ca castrat.' : 'Confirm castration? Animal will be marked as neutered.')
          : null}
        labelYes={ro ? 'Da, Castrat' : 'Yes, Neutered'}
        labelNo={ro ? 'Nu' : 'No'}
        onYes={() => { setAskNeutered(false); doSave(true); }}
        onNo={() => { setAskNeutered(false); doSave(false); }}
      />

      <NavHeader
        title={ro ? 'Tratament Individual' : 'Individual Treatment'}
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            style={styles.listBtn}
            onPress={() => navigation.navigate('MedicalHistory', { earTag })}
            activeOpacity={0.8}
          >
            <Text style={styles.listBtnTxt}>{ro ? 'Listă' : 'List'}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Animal banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTag}>{earTag}</Text>
          <Text style={styles.bannerSub}>{animalLabel(animalInfo, ro)}  ·  {fmtAge(animalInfo.birth_date, ro)}</Text>
        </View>

        <FormField label={ro ? 'Tratamente (minim 1)' : 'Treatments (min 1)'}>
          <View style={styles.checkGrid}>
            {TREATMENTS.map(t => {
              const isOn = selected.has(t);
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.checkChip, isOn && styles.checkChipOn]}
                  onPress={() => toggleTreatment(t)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.checkChipTxt, isOn && styles.checkChipTxtOn]}>
                    {isOn ? '✓ ' : ''}{t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </FormField>

        <FormField label={ro ? 'Data Tratamentului' : 'Date of Treatment'}>
          <DateField
            value={treatmentDate}
            onChange={setTreatmentDate}
            min={minDate}
            max={todayISO()}
          />
        </FormField>

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

        <TouchableOpacity
          style={[styles.saveBtn, (saving || selected.size === 0) && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={saving || selected.size === 0}
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
  banner:        { backgroundColor: Colors.primary, borderRadius: 10, padding: 14, gap: 4 },
  bannerTag:     { color: '#fff', fontSize: 16, fontWeight: '900', fontFamily: 'monospace' },
  bannerSub:     { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  checkGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  checkChip:     { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20,
                   paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.card },
  checkChipOn:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkChipTxt:  { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  checkChipTxtOn:{ color: '#fff' },
  input:         { borderWidth: 2, borderColor: Colors.border, borderRadius: 8, fontSize: 15,
                   paddingVertical: 12, paddingHorizontal: 14, color: Colors.textDark, backgroundColor: Colors.card },
  commentInput:  { minHeight: 80 },
  saveBtn:       { backgroundColor: '#2E7D32', borderRadius: 10, paddingVertical: 18, alignItems: 'center' },
  saveBtnTxt:    { color: '#fff', fontSize: 17, fontWeight: '800' },
  listBtn:       { backgroundColor: '#E65100', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 5 },
  listBtnTxt:    { color: '#fff', fontSize: 13, fontWeight: '700' },
});
