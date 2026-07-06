import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { fetchPregnancyTodayStats, recordPregnancy, PregnancyTodayStats } from '../api/client';
import ErrorModal from '../components/ErrorModal';
import ConfirmModal from '../components/ConfirmModal';
import NavHeader from '../components/NavHeader';
import AnimalCard from '../components/AnimalCard';
import FormField from '../components/FormField';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PregnancyDetails'>;
  route: RouteProp<RootStackParamList, 'PregnancyDetails'>;
};

export default function PregnancyDetailsScreen({ navigation, route }: Props) {
  const { animal } = route.params;
  const { lang, t } = useLang();
  const ro = lang === 'RO';

  const [weeks,        setWeeks]        = useState('');
  const [comment,      setComment]      = useState(animal.comment ?? '');
  const [stats,        setStats]        = useState<PregnancyTodayStats>({ pregnant: 0, not_pregnant: 0 });
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [confirmWeeks, setConfirmWeeks] = useState<number | null>(null);

  useEffect(() => {
    fetchPregnancyTodayStats().then(setStats).catch(() => {});
  }, []);

  const doSave = async (pregnant: boolean, gestWeeks: number | null) => {
    setSaving(true);
    try {
      await recordPregnancy(animal.ear_tag, pregnant, gestWeeks, comment || null);
      navigation.navigate('PregnancyScan');
    } catch (e: any) {
      setSaving(false);
      setError(e?.message ?? (ro ? 'Eroare' : 'Error'));
    }
  };

  const handleRecord = (pregnant: boolean) => {
    if (pregnant) {
      const w = parseInt(weeks, 10);
      if (isNaN(w) || w < 4 || w > 36) {
        setError(ro ? 'Introduceti saptamanile (4-36)' : 'Enter weeks (4-36)');
        return;
      }
      if (w > 10) {
        setConfirmWeeks(w);
        return;
      }
      doSave(true, w);
    } else {
      doSave(false, null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />
      <ConfirmModal
        message={confirmWeeks != null ? (ro ? `Esti sigur ca sunt ${confirmWeeks} saptamani?` : `Are you sure it's ${confirmWeeks} weeks?`) : null}
        labelYes={ro ? 'Da' : 'Yes'}
        labelNo={ro ? 'Nu' : 'No'}
        onYes={() => { const w = confirmWeeks!; setConfirmWeeks(null); doSave(true, w); }}
        onNo={() => setConfirmWeeks(null)}
      />
      <NavHeader title={t('pregnancy')} onBack={() => navigation.navigate('PregnancyScan')} />

      {/* Today stats banner — single line */}
      <View style={styles.statsBanner}>
        <Text style={styles.statTxt}>
          {ro ? 'Azi gestante' : 'Today pregnant'}: <Text style={styles.statNum}>{stats.pregnant}</Text>
          {'   ·   '}
          {ro ? 'Azi negestante' : 'Today not pregnant'}: <Text style={styles.statNum}>{stats.not_pregnant}</Text>
        </Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <AnimalCard
          data={animal}
          lang={lang}
          onPress={() => {}}
          showCompany={true}
          showCategoryBar={true}
          showGestation={true}
        />

        {/* Comment — editable */}
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={setComment}
          placeholder={ro ? 'Comentariu...' : 'Comment...'}
          placeholderTextColor={Colors.border}
          multiline
          textAlignVertical="top"
        />

        <FormField label={ro ? 'Saptamani' : 'Weeks'}>
          <TextInput
            style={styles.weeksInput}
            value={weeks}
            onChangeText={v => { setWeeks(v.replace(/[^0-9]/g, '')); setError(null); }}
            keyboardType="number-pad"
            placeholder="—"
            placeholderTextColor={Colors.border}
            maxLength={2}
            returnKeyType="done"
            onSubmitEditing={() => handleRecord(true)}
          />
        </FormField>

        {/* Buttons */}
        <TouchableOpacity
          style={[styles.pregnantBtn, saving && styles.btnDisabled]}
          onPress={() => handleRecord(true)}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.pregnantBtnTxt}>{ro ? 'Gestanta' : 'Pregnant'}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.notPregnantBtn, saving && styles.btnDisabled]}
          onPress={() => handleRecord(false)}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.notPregnantBtnTxt}>{ro ? 'Negestanta' : 'Not Pregnant'}</Text>
        </TouchableOpacity>

      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: Colors.background },
  statsBanner:       { backgroundColor: Colors.primaryLight, paddingHorizontal: 16, paddingVertical: 10 },
  statTxt:           { fontSize: 14, color: Colors.primaryDark, fontWeight: '600' },
  statNum:           { fontWeight: '800' },
  scroll:            { padding: 16, gap: 12 },

  commentInput:      { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.textDark, backgroundColor: '#fff', minHeight: 56, textAlignVertical: 'top' },

  weeksInput:        { borderWidth: 2, borderColor: Colors.primary, borderRadius: 8, fontSize: 36, fontWeight: '800', textAlign: 'center', paddingVertical: 16, color: Colors.textDark, backgroundColor: Colors.card },

  pregnantBtn:       { backgroundColor: '#2E7D32', borderRadius: 8, paddingVertical: 22, alignItems: 'center' },
  pregnantBtnTxt:    { color: '#fff', fontSize: 20, fontWeight: '800' },
  notPregnantBtn:    { backgroundColor: '#C62828', borderRadius: 8, paddingVertical: 22, alignItems: 'center' },
  notPregnantBtnTxt: { color: '#fff', fontSize: 20, fontWeight: '800' },
  btnDisabled:       { opacity: 0.5 },
});
