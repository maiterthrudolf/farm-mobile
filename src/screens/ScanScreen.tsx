import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useLang } from '../i18n/LanguageContext';
import NavHeader from '../components/NavHeader';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { searchByLast4, CattleSearchResult } from '../api/client';
import FormField from '../components/FormField';

let CameraView: any = null;
let useCameraPermissions: any = null;
if (Platform.OS !== 'web') {
  const cam = require('expo-camera');
  CameraView = cam.CameraView;
  useCameraPermissions = cam.useCameraPermissions;
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Scan'>;
  route: RouteProp<RootStackParamList, 'Scan'>;
};

export default function ScanScreen({ navigation, route }: Props) {
  const { returnTo, moduleLabel } = route.params;
  const { t } = useLang();
  const isWeb = Platform.OS === 'web';

  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions
    ? useCameraPermissions()
    : [{ granted: false }, async () => {}];

  useEffect(() => {
    if (!isWeb && !permission?.granted) requestPermission();
  }, []);

  const handleSearch = async (last4: string) => {
    const digits = last4.trim();
    if (!/^\d{4}$/.test(digits)) {
      Alert.alert('', 'Exactamente 4 cifre / Exactly 4 digits');
      return;
    }
    setLoading(true);
    try {
      const results = await searchByLast4(digits);
      if (results.length === 0) {
        navigation.navigate('ScanMultiple', { results: [], returnTo, moduleLabel });
      } else if (results.length === 1) {
        navigation.navigate('AnimalDetail', { earTag: results[0].ear_tag, moduleLabel });
      } else {
        navigation.navigate('ScanMultiple', { results, returnTo, moduleLabel });
      }
    } catch {
      Alert.alert('Error', 'Server not reachable / Serverul nu raspunde');
    } finally {
      setLoading(false);
      setManualInput('');
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    handleSearch(data.slice(-4));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <NavHeader title={moduleLabel} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>

          {/* Camera — native only */}
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
                  <Text style={styles.rescanText}>↺  Scan again</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Web: camera placeholder */}
          {isWeb && (
            <View style={styles.cameraPlaceholder}>
              <Text style={styles.cameraPlaceholderIcon}>📷</Text>
              <Text style={styles.cameraPlaceholderText}>Camera available on device</Text>
            </View>
          )}

          {/* Manual input section */}
          <View style={styles.manualSection}>
            <FormField label={`${t('enterLast4')}:`}>
            <TextInput
              style={styles.input}
              value={manualInput}
              onChangeText={(v) => { if (/^\d{0,4}$/.test(v)) setManualInput(v); }}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="_ _ _ _"
              placeholderTextColor={Colors.border}
              returnKeyType="search"
              onSubmitEditing={() => { if (manualInput.length === 4) handleSearch(manualInput); }}
            />
            </FormField>
            {loading
              ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 12 }} />
              : (
                <TouchableOpacity
                  style={[styles.searchBtn, manualInput.length !== 4 && styles.searchBtnDisabled]}
                  onPress={() => handleSearch(manualInput)}
                  disabled={manualInput.length !== 4}
                >
                  <Text style={styles.searchBtnText}>{t('search')}</Text>
                </TouchableOpacity>
              )
            }
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.background },
  content:    { padding: 16, gap: 16 },

  cameraBox:  { borderRadius: 10, overflow: 'hidden', backgroundColor: '#000' },
  camera:     { height: 240, width: '100%' },
  rescanBtn:  {
    position: 'absolute', bottom: 10, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  rescanText: { color: '#fff', fontWeight: '600' },

  cameraPlaceholder: {
    height: 200,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  } as any,
  cameraPlaceholderIcon: { fontSize: 48 },
  cameraPlaceholderText: { color: Colors.textMuted, marginTop: 8, fontSize: 14 },

  manualSection: { gap: 10 },
  input: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 8,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 14,
    color: Colors.textDark,
    backgroundColor: Colors.card,
    letterSpacing: 10,
  },
  searchBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  searchBtnDisabled: { opacity: 0.4 },
  searchBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
