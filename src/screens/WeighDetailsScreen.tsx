import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { getCompany } from '../theme/companies';
import AnimalCard from '../components/AnimalCard';
import NavHeader from '../components/NavHeader';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { saveWeight } from '../api/client';
import ErrorModal from '../components/ErrorModal';
import FormField from '../components/FormField';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'WeighDetails'>;
  route: RouteProp<RootStackParamList, 'WeighDetails'>;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function avgGain(entries: WeightEntry[]): string | null {
  if (entries.length < 2) return null;
  const newest = entries[0];
  const prev   = entries[1];
  const days = Math.round(
    (new Date(newest.weighed_date).getTime() - new Date(prev.weighed_date).getTime()) / 86400000
  );
  if (days <= 0) return null;
  return ((newest.weight_kg - prev.weight_kg) / days).toFixed(2);
}

export default function WeighDetailsScreen({ navigation, route }: Props) {
  const { animal } = route.params;
  const { lang, t } = useLang();
  const ro = lang === 'RO';

  const company      = getCompany(animal.company);
  const companyShort = company?.short ?? animal.company ?? null;
  const companyBg    = company?.bg ?? Colors.primaryDark;
  const companyText  = company?.text ?? '#fff';

  const [weightKg, setWeightKg] = useState('');
  const [comment,  setComment]  = useState(animal.comment ?? '');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    const kg = parseFloat(weightKg.replace(',', '.'));
    if (isNaN(kg) || kg <= 0 || kg > 1500) {
      setError(ro ? 'Greutate invalida (1-1500 kg)' : 'Invalid weight (1-1500 kg)');
      return;
    }
    setSaving(true);
    try {
      await saveWeight({
        ear_tag:      animal.ear_tag,
        weight_kg:    kg,
        weighed_date: todayISO(),
        comment:      comment || null,
      });
      navigation.navigate('WeighResult', { animal });
    } catch (e: any) {
      setSaving(false);
      setError(e?.message ?? (ro ? 'Nu s-a putut salva' : 'Could not save'));
    }
  };

  const gain = avgGain(history);
  const today = todayISO();

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />
      <NavHeader
        title={t('weight')}
        onBack={() => navigation.goBack()}
        right={companyShort
          ? <View style={[styles.companyBadge, { backgroundColor: companyBg }]}>
              <Text style={[styles.companyBadgeTxt, { color: companyText }]}>{companyShort}</Text>
            </View>
          : undefined
        }
      />

      <ScrollView contentContainerStyle={styles.scroll}>

        <AnimalCard data={animal} lang={lang} onPress={() => {}} showCompany={true} showCategoryBar={true} />

        <View style={styles.form}>

          <FormField label={ro ? `Greutate azi (${today})` : `Weight today (${today})`}>
            <TextInput
              style={styles.weightInput}
              value={weightKg}
              onChangeText={v => { setWeightKg(v); setError(null); }}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={Colors.border}
              maxLength={6}
            />
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

          {/* Next animal button */}
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
  weightInput:     { borderWidth: 2, borderColor: Colors.primary, borderRadius: 8, fontSize: 36, fontWeight: '800', textAlign: 'center', paddingVertical: 16, color: Colors.textDark, backgroundColor: Colors.card },
  commentInput:    { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.textDark, backgroundColor: '#fff', minHeight: 90, textAlignVertical: 'top' },
  saveBtn:         { backgroundColor: '#2E7D32', borderRadius: 8, paddingVertical: 20, alignItems: 'center', marginTop: 8 },
  saveBtnTxt:      { color: '#fff', fontSize: 18, fontWeight: '800' },
  btnDisabled:     { opacity: 0.5 },
});
