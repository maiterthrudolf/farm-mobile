import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { searchWeighAnimalByLast4, fetchWeightHistory, WeighAnimalInfo } from '../api/client';
import ErrorModal from '../components/ErrorModal';
import AnimalCard from '../components/AnimalCard';
import NavHeader from '../components/NavHeader';

let CameraView: any = null;
let useCameraPermissions: any = null;
if (Platform.OS !== 'web') {
  const cam = require('expo-camera');
  CameraView = cam.CameraView;
  useCameraPermissions = cam.useCameraPermissions;
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'WeighScan'>;
};

function statusLabel(detail: string, ro: boolean): string {
  const u = detail.toUpperCase();
  if (u === 'MORT')   return ro ? 'No valid ID: Mort'   : 'No valid ID: Dead';
  if (u === 'VANDUT') return ro ? 'No valid ID: Vandut' : 'No valid ID: Sold';
  return ro ? 'Crotaliu nu este valid' : 'No valid ID';
}

export default function WeighScanScreen({ navigation }: Props) {
  const { lang, t } = useLang();
  const ro = lang === 'RO';
  const isWeb = Platform.OS === 'web';

  const [input,        setInput]        = useState('');
  const [scanned,      setScanned]      = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [results,      setResults]      = useState<WeighAnimalInfo[] | null>(null);
  const [todayWarning, setTodayWarning] = useState<{ animal: WeighAnimalInfo; kg: number } | null>(null);

  const [permission, requestPermission] = useCameraPermissions
    ? useCameraPermissions()
    : [{ granted: false }, async () => {}];

  useEffect(() => {
    if (!isWeb && !permission?.granted) requestPermission();
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      setScanned(false); setInput(''); setError(null); setResults(null); setTodayWarning(null);
    });
    return unsub;
  }, [navigation]);

  const today = new Date().toISOString().slice(0, 10);

  const proceed = async (animal: WeighAnimalInfo) => {
    try {
      const history = await fetchWeightHistory(animal.ear_tag);
      if (history.length > 0 && history[0].weighed_date === today) {
        setTodayWarning({ animal, kg: history[0].weight_kg });
        return;
      }
    } catch {}
    navigation.navigate('WeighDetails', { animal });
  };

  const handleSearch = async (raw: string) => {
    setError(null);
    setResults(null);
    const last4 = raw.trim().slice(-4);
    if (!/^\d{4}$/.test(last4)) {
      setError(ro ? 'Introdu cel putin 4 cifre' : 'Enter at least 4 digits');
      return;
    }
    setLoading(true);
    try {
      const animals = await searchWeighAnimalByLast4(last4);
      if (animals.length === 0) {
        setError(ro ? 'Crotaliu nu este valid' : 'No valid ID');
      } else if (animals.length === 1) {
        proceed(animals[0]);
      } else {
        setResults(animals);
      }
    } catch (e: any) {
      const detail = e?.message ?? '';
      setError(statusLabel(detail, ro));
    } finally {
      setLoading(false);
      setScanned(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    handleSearch(data);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />
      <NavHeader title={t('weight')} onBack={() => navigation.goBack()} />

      {/* Today-warning overlay */}
      {todayWarning && (
        <View style={styles.warningOverlay}>
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠</Text>
            <Text style={styles.warningMsg}>
              {ro
                ? `Acest animal a fost cantarit azi: ${todayWarning.kg} kg`
                : `This animal already has a weighing today: ${todayWarning.kg} kg`}
            </Text>
            <TouchableOpacity
              style={styles.warningBtnPrimary}
              onPress={() => { setTodayWarning(null); navigation.navigate('WeighDetails', { animal: todayWarning.animal }); }}
            >
              <Text style={styles.warningBtnTxt}>{ro ? 'Cantareste din nou' : 'Weigh again'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.warningBtnSecondary}
              onPress={() => setTodayWarning(null)}
            >
              <Text style={styles.warningBtnSecTxt}>{ro ? 'Urmatorul Animal' : 'Next Animal'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>

          {!isWeb && permission?.granted && !results && (
            <View style={styles.cameraBox}>
              <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ['code128', 'ean13', 'ean8', 'qr'] }}
              />
              {scanned && (
                <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
                  <Text style={styles.rescanTxt}>↺  {ro ? 'Rescaneaza' : 'Scan again'}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {isWeb && !results && (
            <View style={styles.cameraPlaceholder}>
              <Text style={{ fontSize: 40 }}>📷</Text>
              <Text style={styles.placeholderTxt}>{ro ? 'Camera disponibila pe dispozitiv' : 'Camera available on device'}</Text>
            </View>
          )}

          {results && (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsHint}>
                {ro ? `${results.length} rezultate — selecteaza animalul:` : `${results.length} results — select the animal:`}
              </Text>
              {results.map(a => (
                <AnimalCard key={a.ear_tag} data={a} lang={lang} onPress={() => proceed(a)} />
              ))}
              <TouchableOpacity style={styles.newSearchBtn} onPress={() => { setResults(null); setInput(''); }}>
                <Text style={styles.newSearchBtnTxt}>{ro ? 'Cauta din nou' : 'Search again'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {!results && (
            <>
              <Text style={styles.label}>
                {ro ? 'Crotaliu animal - cel putin ultimele 4 cifre:' : 'Animal ID - at least the last 4 digits:'}
              </Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                value={input}
                onChangeText={v => { setInput(v); setError(null); }}
                keyboardType="number-pad"
                placeholder="_ _ _ _"
                placeholderTextColor={Colors.border}
                maxLength={20}
                returnKeyType="search"
                onSubmitEditing={() => handleSearch(input)}
              />
              {loading
                ? <ActivityIndicator size="large" color={Colors.primary} />
                : (
                  <TouchableOpacity
                    style={[styles.searchBtn, !input && styles.btnDisabled]}
                    onPress={() => handleSearch(input)}
                    disabled={!input}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.searchBtnTxt}>{ro ? 'Cauta' : 'Search'}</Text>
                  </TouchableOpacity>
                )
              }
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: Colors.background },
  content:           { padding: 20, gap: 14 },
  cameraBox:         { borderRadius: 10, overflow: 'hidden', backgroundColor: '#000' },
  camera:            { height: 220, width: '100%' },
  rescanBtn:         { position: 'absolute', bottom: 10, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  rescanTxt:         { color: '#fff', fontWeight: '600' },
  cameraPlaceholder: { height: 180, backgroundColor: '#E0E0E0', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed' } as any,
  placeholderTxt:    { color: Colors.textMuted, marginTop: 8 },
  label:             { fontSize: 13, color: Colors.textDark, fontWeight: '600' },
  input:             { borderWidth: 2, borderColor: Colors.primary, borderRadius: 8, fontSize: 22, fontWeight: '700', textAlign: 'center', paddingVertical: 14, color: Colors.textDark, backgroundColor: Colors.card, letterSpacing: 8 },
  inputError:        { borderColor: '#C62828' },
  searchBtn:         { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  btnDisabled:       { opacity: 0.4 },
  searchBtnTxt:      { color: '#fff', fontSize: 17, fontWeight: '700' },
  warningOverlay:      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10, alignItems: 'center', justifyContent: 'center' },
  warningBox:          { backgroundColor: '#fff', borderRadius: 12, padding: 24, marginHorizontal: 24, gap: 14, alignItems: 'center' },
  warningTitle:        { fontSize: 32 },
  warningMsg:          { fontSize: 15, color: '#212121', textAlign: 'center', fontWeight: '600' },
  warningBtnPrimary:   { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 24, alignSelf: 'stretch', alignItems: 'center' },
  warningBtnTxt:       { color: '#fff', fontSize: 16, fontWeight: '700' },
  warningBtnSecondary: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 24, alignSelf: 'stretch', alignItems: 'center' },
  warningBtnSecTxt:    { color: Colors.textMuted, fontSize: 16, fontWeight: '600' },
  resultsSection:    { gap: 10 },
  resultsHint:       { fontSize: 16, fontWeight: '700', color: Colors.primaryDark },
  newSearchBtn:      { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, paddingVertical: 12, alignItems: 'center', backgroundColor: Colors.card },
  newSearchBtnTxt:   { fontSize: 15, color: Colors.textMuted, fontWeight: '600' },
});
