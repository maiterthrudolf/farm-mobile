import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ScrollView, ActivityIndicator, TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { getCompany } from '../theme/companies';
import AnimalCard from '../components/AnimalCard';
import NavHeader from '../components/NavHeader';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { saveDeath } from '../api/client';
import ErrorModal from '../components/ErrorModal';
import FormField from '../components/FormField';
import DateField from '../components/DateField';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DeathDetails'>;
  route: RouteProp<RootStackParamList, 'DeathDetails'>;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

type DeathReason = 'JACKAL' | 'BEAR' | 'DOG' | 'DISEASE' | 'LOST' | 'STOLEN' | 'UNKNOWN';

const REASONS: { key: DeathReason; en: string; ro: string }[] = [
  { key: 'JACKAL',  en: 'Jackal',  ro: 'Sacal' },
  { key: 'BEAR',    en: 'Bear',    ro: 'Urs' },
  { key: 'DOG',     en: 'Dog',     ro: 'Caine' },
  { key: 'DISEASE', en: 'Disease', ro: 'Boala' },
  { key: 'LOST',    en: 'Lost',    ro: 'Disparut' },
  { key: 'STOLEN',  en: 'Stolen',  ro: 'Furat' },
  { key: 'UNKNOWN', en: 'Unknown', ro: 'Necunoscut' },
];

export default function DeathDetailsScreen({ navigation, route }: Props) {
  const { animal } = route.params;
  const { lang, t } = useLang();
  const ro = lang === 'RO';

  const company      = getCompany(animal.company);
  const companyShort = company?.short ?? animal.company ?? null;
  const companyBg    = company?.bg ?? Colors.primaryDark;
  const companyText  = company?.text ?? '#fff';

  const [dateISO, setDateISO] = useState(todayISO());
  const [reason,  setReason]  = useState<DeathReason | null>(null);
  const [comment, setComment] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (!dateISO || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
      setError(ro ? 'Data invalida' : 'Invalid date');
      return;
    }
    const parsed  = new Date(dateISO);
    const today   = new Date(); today.setHours(23, 59, 59);
    const minDate = new Date(); minDate.setMonth(minDate.getMonth() - 3);
    if (parsed > today) {
      setError(ro ? 'Data nu poate fi in viitor' : 'Date cannot be in the future');
      return;
    }
    if (parsed < minDate) {
      setError(ro ? 'Maxim 3 luni in trecut' : 'Maximum 3 months in the past');
      return;
    }
    if (!reason) {
      setError(ro ? 'Selecteaza cauza mortii' : 'Select death reason');
      return;
    }
    setSaving(true);
    try {
      await saveDeath({
        ear_tag:      animal.ear_tag,
        death_date:   dateISO,
        death_reason: reason,
        comment:      comment || null,
      });
      navigation.navigate('DeathScan');
    } catch (e: any) {
      setSaving(false);
      setError(e?.message ?? (ro ? 'Nu s-a putut salva' : 'Could not save'));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />
      <NavHeader
        title={t('deaths')}
        onBack={() => navigation.goBack()}
        right={companyShort
          ? <View style={[styles.companyBadge, { backgroundColor: companyBg }]}>
              <Text style={[styles.companyBadgeTxt, { color: companyText }]}>{companyShort}</Text>
            </View>
          : undefined
        }
      />

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Animal card */}
        <AnimalCard data={animal} lang={lang} onPress={() => {}} showCompany={true} showCategoryBar={true} />

        <View style={styles.form}>

          <FormField label={ro ? 'Data Mortii' : 'Date of Death'}>
            <DateField value={dateISO} onChange={setDateISO} />
          </FormField>

          <FormField label={ro ? 'Cauza Mortii' : 'Death Reason'}>
            <View style={styles.reasonGrid}>
              {REASONS.map(r => (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.reasonBtn, reason === r.key && styles.reasonBtnActive]}
                  onPress={() => setReason(r.key)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.reasonTxt, reason === r.key && styles.reasonTxtActive]}>
                    {ro ? r.ro : r.en}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FormField>

          <FormField label={ro ? 'Comentariu' : 'Comment'}>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              placeholder={ro ? 'comentarii...' : 'notes...'}
              placeholderTextColor={Colors.border}
            />
          </FormField>

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnTxt}>{ro ? 'Salveaza' : 'Save'}</Text>
            }
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Colors.background },
  companyBadge:    { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, minWidth: 70, alignItems: 'center' },
  companyBadgeTxt: { fontSize: 13, fontWeight: '800' },
  scroll:          { padding: 12, gap: 12 },
  form:            { gap: 12 },
  reasonGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reasonBtn:       { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#fff' },
  reasonBtnActive: { borderColor: '#C62828', backgroundColor: '#C62828' },
  reasonTxt:       { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
  reasonTxtActive: { color: '#fff' },
  commentInput:    { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.textDark, backgroundColor: '#fff', minHeight: 90, textAlignVertical: 'top' },
  saveBtn:         { backgroundColor: '#2E7D32', borderRadius: 8, paddingVertical: 20, alignItems: 'center', marginTop: 8 },
  saveBtnTxt:      { color: '#fff', fontSize: 18, fontWeight: '800' },
  btnDisabled:     { opacity: 0.5 },
});
