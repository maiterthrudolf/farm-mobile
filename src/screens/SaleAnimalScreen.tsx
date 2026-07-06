import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import AnimalCard from '../components/AnimalCard';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { addAnimalToList, removeAnimalFromList, fetchWeightHistory, WeightEntry } from '../api/client';
import ErrorModal from '../components/ErrorModal';
import NavHeader from '../components/NavHeader';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SaleAnimal'>;
  route: RouteProp<RootStackParamList, 'SaleAnimal'>;
};

function monthsOld(birthDate: string | null | undefined): number {
  if (!birthDate) return 0;
  const b = new Date(birthDate);
  const n = new Date();
  return (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
}

const SALE_TARGET = 650;

export default function SaleAnimalScreen({ navigation, route }: Props) {
  const { listId, listName, animal } = route.params;
  const { lang } = useLang();
  const ro = lang === 'RO';

  const [weightKg, setWeightKg] = useState('');
  const [history,  setHistory]  = useState<WeightEntry[]>([]);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [added,    setAdded]    = useState(false);

  useEffect(() => {
    addAnimalToList(listId, animal.ear_tag, null)
      .then(() => setAdded(true))
      .catch(e => setError(e?.message ?? 'Error'));
    fetchWeightHistory(animal.ear_tag).then(setHistory).catch(() => {});
  }, []);

  const kg = weightKg ? parseFloat(weightKg.replace(',', '.')) : null;
  const validKg = kg != null && !isNaN(kg) && kg > 0 && kg <= 1500;

  // Gain calculations
  const mo = monthsOld(animal.birth_date);
  const showGains = mo < 24 && history.length >= 2;

  const avgGainNum = showGains
    ? (() => {
        const days = Math.round(
          (new Date(history[0].weighed_date).getTime() - new Date(history[1].weighed_date).getTime()) / 86400000
        );
        return days > 0 ? (history[0].weight_kg - history[1].weight_kg) / days : 0;
      })()
    : 0;

  const daysAgo = history.length
    ? Math.round((Date.now() - new Date(history[0].weighed_date).getTime()) / 86400000)
    : 0;
  const estimated = history.length && avgGainNum > 0
    ? Math.round(history[0].weight_kg + avgGainNum * daysAgo)
    : null;

  const daysFromBirth = history.length && animal.birth_date
    ? Math.round((new Date(history[0].weighed_date).getTime() - new Date(animal.birth_date).getTime()) / 86400000)
    : null;
  const lifeGain = daysFromBirth && daysFromBirth > 0 && history.length
    ? ((history[0].weight_kg - 30) / daysFromBirth).toFixed(2)
    : null;

  const daysTo650 = avgGainNum > 0 && estimated != null
    ? Math.round((SALE_TARGET - estimated) / avgGainNum)
    : null;
  const saleDate = daysTo650 != null && daysTo650 > 0
    ? (() => {
        const d = new Date();
        d.setDate(d.getDate() + daysTo650);
        return d.toLocaleString(ro ? 'ro-RO' : 'en-GB', { month: 'long', year: 'numeric' });
      })()
    : null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const lastWasToday = history.length > 0 && history[0].weighed_date === todayStr;
  const showEstimate = estimated != null && !lastWasToday;

  const handleNext = async () => {
    setSaving(true);
    try {
      await addAnimalToList(listId, animal.ear_tag, validKg ? kg : null);
      navigation.navigate('SaleScan', { listId, listName });
    } catch (e: any) {
      setSaving(false);
      setError(e?.message ?? (ro ? 'Eroare' : 'Error'));
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await removeAnimalFromList(listId, animal.ear_tag);
      navigation.navigate('SaleScan', { listId, listName });
    } catch (e: any) {
      setSaving(false);
      setError(e?.message ?? (ro ? 'Eroare' : 'Error'));
    }
  };

  const handleSaveList = async () => {
    if (validKg) {
      await addAnimalToList(listId, animal.ear_tag, kg).catch(() => {});
    }
    navigation.navigate('SaleMenu');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />
      <NavHeader title={listName} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>

        <AnimalCard data={animal} lang={lang} onPress={() => {}} showCompany={true} showCategoryBar={true} />

        {/* Weight history + gains */}
        {history.length > 0 && (
          <View style={styles.card}>
            {history.slice(0, 3).map((w, i) => (
              <Text key={i} style={[styles.historyRow, i === 0 && styles.historyRowBold]}>
                {w.weight_kg} kg  ·  {w.weighed_date}
              </Text>
            ))}
            {showGains && (
              <>
                <View style={styles.divider} />
                <Text style={styles.gainRow}>
                  {ro ? 'Spor mediu' : 'Avg gain'}{': '}
                  <Text style={styles.gainVal}>{avgGainNum.toFixed(2)} kg/{ro ? 'zi' : 'day'}</Text>
                </Text>
                {lifeGain && (
                  <Text style={styles.gainRow}>
                    {ro ? 'Spor viata' : 'Lifetime gain'}{': '}
                    <Text style={styles.gainVal}>{lifeGain} kg/{ro ? 'zi' : 'day'}</Text>
                  </Text>
                )}
                {showEstimate && (
                  <Text style={styles.gainRow}>
                    {ro ? 'Estimare azi' : 'Est. today'}{': '}
                    <Text style={styles.gainVal}>{estimated} kg</Text>
                  </Text>
                )}
                {saleDate && (
                  <Text style={styles.gainRow}>
                    {ro ? 'Posibila vanzare' : 'Possible sale'}{': '}
                    <Text style={styles.gainVal}>{saleDate}</Text>
                  </Text>
                )}
              </>
            )}
          </View>
        )}

        {/* Weight input */}
        <Text style={styles.sectionLabel}>{ro ? 'KG (optional)' : 'KG (optional)'}</Text>
        <TextInput
          style={styles.weightInput}
          value={weightKg}
          onChangeText={setWeightKg}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={Colors.border}
          maxLength={6}
        />

        {/* Buttons — Next first, Delete second */}
        <TouchableOpacity
          style={[styles.nextBtn, (saving || !added) && styles.btnDisabled]}
          onPress={handleNext}
          disabled={saving || !added}
          activeOpacity={0.8}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.nextBtnTxt}>{ro ? 'Urmatorul Animal' : 'Next Animal'}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteBtn, saving && styles.btnDisabled]}
          onPress={handleDelete}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.deleteBtnTxt}>{ro ? 'Sterge Animal' : 'Delete Animal'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveListBtn, saving && styles.btnDisabled]}
          onPress={handleSaveList}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveListBtnTxt}>{ro ? 'Salveaza Lista' : 'Save List'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Colors.background },
  scroll:          { padding: 12, gap: 10 },
  card:            { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, gap: 4 },
  historyRow:      { fontSize: 14, color: Colors.textMuted, fontFamily: 'monospace' },
  historyRowBold:  { fontSize: 15, color: Colors.textDark, fontWeight: '700' },
  divider:         { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  gainRow:         { fontSize: 13, color: Colors.textMuted },
  gainVal:         { color: Colors.primaryDark, fontWeight: '700' },
  sectionLabel:    { fontSize: 13, fontWeight: '700', color: Colors.textDark },
  weightInput:     { borderWidth: 2, borderColor: Colors.primary, borderRadius: 8, fontSize: 36, fontWeight: '800', textAlign: 'center', paddingVertical: 16, color: Colors.textDark, backgroundColor: Colors.card },
  deleteBtn:       { backgroundColor: '#C62828', borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  deleteBtnTxt:    { color: '#fff', fontSize: 17, fontWeight: '700' },
  nextBtn:         { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 18, alignItems: 'center' },
  nextBtnTxt:      { color: '#fff', fontSize: 17, fontWeight: '800' },
  saveListBtn:     { backgroundColor: '#2E7D32', borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  saveListBtnTxt:  { color: '#fff', fontSize: 17, fontWeight: '700' },
  btnDisabled:     { opacity: 0.5 },
});
