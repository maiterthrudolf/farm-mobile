import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { searchUnallocatedByLast4 } from '../api/client';
import { getCompany } from '../theme/companies';
import ErrorModal from '../components/ErrorModal';
import NavHeader from '../components/NavHeader';

let CameraView: any = null;
let useCameraPermissions: any = null;
if (Platform.OS !== 'web') {
  const cam = require('expo-camera');
  CameraView = cam.CameraView;
  useCameraPermissions = cam.useCameraPermissions;
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BirthScan'>;
  route: RouteProp<RootStackParamList, 'BirthScan'>;
};

export default function BirthScanScreen({ navigation, route }: Props) {
  const { company: companyKey, mother } = route.params;
  const { lang, t } = useLang();
  const ro = lang === 'RO';
  const isWeb = Platform.OS === 'web';

  const company      = getCompany(companyKey);
  const companyShort = company?.short ?? companyKey ?? null;
  const companyBg    = company?.bg    ?? Colors.primaryDark;
  const companyText  = company?.text  ?? '#fff';

  const [input,   setInput]   = useState('');
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [permission, requestPermission] = useCameraPermissions
    ? useCameraPermissions()
    : [{ granted: false }, async () => {}];

  useEffect(() => {
    if (!isWeb && !permission?.granted) requestPermission();
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      setScanned(false); setInput(''); setError(null);
    });
    return unsub;
  }, [navigation]);

  const showError = (msg: string) => setError(msg);

  const handleSearch = async (raw: string) => {
    setError(null);
    const last4 = raw.trim().slice(-4);
    if (!/^\d{4}$/.test(last4)) {
      showError(ro ? 'Introdu cel putin 4 cifre' : 'Enter at least 4 digits');
      return;
    }
    setLoading(true);
    try {
      const results = await searchUnallocatedByLast4(last4);
      if (results.length === 0) {
        showError(ro ? 'Crotaliu nu este valid' : 'ID not found in unallocated pool');
        return;
      }
      if (companyKey) {
        const expectedCo = getCompany(companyKey);
        const match = results.find(r => {
          const rCo = getCompany(r.company);
          return rCo && expectedCo && rCo.short === expectedCo.short;
        });
        if (!match) {
          const actualCo = getCompany(results[0].company)?.short ?? results[0].company ?? '?';
          showError(ro ? `Firma gresita — crotaliu apartine firmei ${actualCo}` : `Wrong company — this ID belongs to ${actualCo}`);
          return;
        }
        navigation.navigate('BirthDetails', { earTag: match.ear_tag, company: companyKey, noId: false, mother });
      } else {
        navigation.navigate('BirthDetails', { earTag: results[0].ear_tag, company: results[0].company, noId: false, mother });
      }
    } catch (e: any) {
      showError(e?.message ?? (ro ? 'Server indisponibil' : 'Server unavailable'));
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

  const handleNoId = () => {
    navigation.navigate('BirthDetails', { earTag: 'NOID', company: companyKey, noId: true, mother });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />
      <NavHeader
        title={t('birth')}
        onBack={() => navigation.goBack()}
        right={companyShort
          ? <View style={[styles.companyBadge, { backgroundColor: companyBg }]}>
              <Text style={[styles.companyBadgeTxt, { color: companyText }]}>{companyShort}</Text>
            </View>
          : undefined
        }
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>

          {!isWeb && permission?.granted && (
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
          {isWeb && (
            <View style={styles.cameraPlaceholder}>
              <Text style={{ fontSize: 40 }}>📷</Text>
              <Text style={styles.placeholderTxt}>{ro ? 'Camera disponibila pe dispozitiv' : 'Camera available on device'}</Text>
            </View>
          )}

          <Text style={styles.label}>
            {ro ? 'Crotaliu VITEL - cel putin ultimele 4 cifre:' : 'Newborn ID - at least the last 4 digits:'}
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

          <TouchableOpacity style={styles.noIdBtn} onPress={handleNoId} activeOpacity={0.8}>
            <Text style={styles.noIdBtnTxt}>{ro ? 'Moarte Fara Crotaliu' : 'Death with No ID'}</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: Colors.background },
  companyBadge:      { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, minWidth: 70, alignItems: 'center' },
  companyBadgeTxt:   { fontSize: 13, fontWeight: '800' },
  content:           { padding: 20, gap: 14 },
  cameraBox:         { borderRadius: 10, overflow: 'hidden', backgroundColor: '#000' },
  camera:            { height: 220, width: '100%' },
  rescanBtn:         { position: 'absolute', bottom: 10, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  rescanTxt:         { color: '#fff', fontWeight: '600' },
  cameraPlaceholder: { height: 180, backgroundColor: '#E0E0E0', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed' } as any,
  placeholderTxt:    { color: Colors.textMuted, marginTop: 8 },
  label:             { fontSize: 13, color: Colors.textDark, fontWeight: '600' },
  input:             { borderWidth: 2, borderColor: Colors.primary, borderRadius: 8, fontSize: 22, fontWeight: '700', textAlign: 'center', paddingVertical: 14, color: Colors.textDark, backgroundColor: Colors.card, letterSpacing: 8 },
  searchBtn:         { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  btnDisabled:       { opacity: 0.4 },
  searchBtnTxt:      { color: '#fff', fontSize: 17, fontWeight: '700' },
  noIdBtn:           { backgroundColor: '#C62828', borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  noIdBtnTxt:        { color: '#fff', fontSize: 17, fontWeight: '700' },
});
