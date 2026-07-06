import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { checkMedicalAnimal } from '../api/client';
import NavHeader from '../components/NavHeader';
import ErrorModal from '../components/ErrorModal';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MedicalScan'>;
  route: RouteProp<RootStackParamList, 'MedicalScan'>;
};

export default function MedicalScanScreen({ navigation, route }: Props) {
  const { mode, procedureId, procedureName, medicationName } = route.params;
  const { lang } = useLang();
  const ro = lang === 'RO';

  const [last4,   setLast4]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const isProc = mode === 'procedure';
  const title  = isProc
    ? (procedureName ?? (ro ? 'Procedura' : 'Procedure'))
    : (ro ? 'Tratament Individual' : 'Individual Treatment');

  const handleSearch = async () => {
    if (last4.length < 4) return;
    setLoading(true);
    try {
      const animal = await checkMedicalAnimal(last4);
      setLast4('');
      if (isProc) {
        navigation.navigate('MedicalProcedureDetails', {
          earTag: animal.ear_tag,
          procedureId: procedureId!,
          procedureName: procedureName!,
          medicationName: medicationName!,
          animalInfo: animal,
        });
      } else {
        navigation.navigate('MedicalIndividual', { earTag: animal.ear_tag, animalInfo: animal });
      }
    } catch (e: any) {
      setError(e?.message ?? 'Error');
      setTimeout(() => inputRef.current?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />
      <NavHeader title={title} onBack={() => navigation.goBack()} />

      {isProc && medicationName && (
        <View style={styles.procBadge}>
          <Text style={styles.procBadgeTxt}>{medicationName}</Text>
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <Text style={styles.hint}>{ro ? 'Ultimele 4 cifre ale crotaliului:' : 'Last 4 digits of ear tag:'}</Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={last4}
            onChangeText={v => setLast4(v.replace(/\D/g, '').slice(0, 10))}
            placeholder="0000"
            placeholderTextColor={Colors.border}
            keyboardType="number-pad"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            autoFocus
          />
          <TouchableOpacity
            style={[styles.searchBtn, (loading || last4.length < 4) && styles.btnDisabled]}
            onPress={handleSearch}
            disabled={loading || last4.length < 4}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.searchBtnTxt}>{ro ? 'Cauta' : 'Search'}</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.background },
  procBadge:     { backgroundColor: '#E8F5E9', paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  procBadgeTxt:  { fontSize: 13, color: '#2E7D32', fontWeight: '600', textAlign: 'center' },
  content:       { flex: 1, padding: 24, gap: 16, justifyContent: 'center' },
  hint:          { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  input:         { borderWidth: 2, borderColor: Colors.primary, borderRadius: 10, fontSize: 28,
                   fontWeight: '700', textAlign: 'center', paddingVertical: 14,
                   color: Colors.textDark, backgroundColor: '#fff', letterSpacing: 6 },
  searchBtn:     { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 18, alignItems: 'center' },
  searchBtnTxt:  { color: '#fff', fontSize: 18, fontWeight: '800' },
  btnDisabled:   { opacity: 0.5 },
});
