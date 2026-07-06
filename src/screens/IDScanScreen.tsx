import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, Alert, Platform, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { getCompany } from '../theme/companies';
import NavHeader from '../components/NavHeader';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';

let CameraView: any = null;
let useCameraPermissions: any = null;
if (Platform.OS !== 'web') {
  const cam = require('expo-camera');
  CameraView = cam.CameraView;
  useCameraPermissions = cam.useCameraPermissions;
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'IDScan'>;
  route: RouteProp<RootStackParamList, 'IDScan'>;
};

// Normalise to RO + 12 digits: accept either the full tag or bare 12 digits
function normalizeEarTag(raw: string): string | null {
  const t = raw.trim().toUpperCase();
  if (/^RO\d{12}$/.test(t)) return t;
  if (/^\d{12}$/.test(t))   return `RO${t}`;
  return null;
}

export default function IDScanScreen({ navigation, route }: Props) {
  const { company: companyKey } = route.params;
  const { lang, t } = useLang();
  const ro = lang === 'RO';
  const company = getCompany(companyKey);
  const isWeb = Platform.OS === 'web';

  const [input,   setInput]   = useState('');
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions
    ? useCameraPermissions()
    : [{ granted: false }, async () => {}];

  useEffect(() => {
    if (!isWeb && !permission?.granted) requestPermission();
  }, []);

  // Reset scan flag every time this screen is focused (coming back from IDConfirm)
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      setScanned(false);
      setInput('');
    });
    return unsub;
  }, [navigation]);

  const handleSubmit = (raw: string) => {
    const tag = normalizeEarTag(raw);
    if (!tag) {
      Alert.alert(
        ro ? 'Format invalid' : 'Invalid format',
        ro
          ? 'Formatul corect: RO + 12 cifre\nEx: RO123456789012'
          : 'Correct format: RO + 12 digits\nEx: RO123456789012'
      );
      return;
    }
    navigation.navigate('IDConfirm', { company: companyKey, earTag: tag });
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    handleSubmit(data);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <NavHeader
        title={t('id')}
        onBack={() => navigation.goBack()}
        right={company
          ? <View style={[styles.companyBadge, { backgroundColor: company.bg }]}>
              <Text style={[styles.badgeTxt, { color: company.text }]}>{company.short}</Text>
            </View>
          : undefined
        }
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>

          {/* Camera (native only) */}
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
              <Text style={styles.placeholderTxt}>
                {ro ? 'Camera disponibila pe dispozitiv' : 'Camera available on device'}
              </Text>
            </View>
          )}

          {/* Manual input */}
          <Text style={styles.label}>
            {ro ? 'Introdu toate cifrele crotaliului:' : 'Enter full ear tag:'}
          </Text>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="RO123456789012"
            placeholderTextColor={Colors.border}
            autoCapitalize="characters"
            maxLength={14}
            returnKeyType="go"
            onSubmitEditing={() => handleSubmit(input)}
          />
          <TouchableOpacity
            style={[styles.submitBtn, !input && styles.submitBtnDisabled]}
            onPress={() => handleSubmit(input)}
            disabled={!input}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnTxt}>
              {ro ? 'Introdu Crotaliu' : 'Submit Ear Tag'}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: Colors.background },
  companyBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, minWidth: 60, alignItems: 'center' },
  badgeTxt:         { fontSize: 12, fontWeight: '800' },

  content:          { padding: 20, gap: 14 },
  cameraBox:        { borderRadius: 10, overflow: 'hidden', backgroundColor: '#000' },
  camera:           { height: 220, width: '100%' },
  rescanBtn:        {
    position: 'absolute', bottom: 10, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  rescanTxt:        { color: '#fff', fontWeight: '600' },
  cameraPlaceholder:{
    height: 180, backgroundColor: '#E0E0E0', borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
  } as any,
  placeholderTxt:   { color: Colors.textMuted, marginTop: 8 },
  label:            { fontSize: 14, color: Colors.textDark, fontWeight: '600' },
  input:            {
    borderWidth: 2, borderColor: Colors.primary, borderRadius: 8,
    fontSize: 22, fontWeight: '700', textAlign: 'center',
    paddingVertical: 14, color: Colors.textDark,
    backgroundColor: Colors.card, letterSpacing: 4,
  },
  submitBtn:        { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  submitBtnDisabled:{ opacity: 0.4 },
  submitBtnTxt:     { color: '#fff', fontSize: 16, fontWeight: '700' },
});
