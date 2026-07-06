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
import { recordInseminate, saveInseminationComment, fetchBulls, Bull } from '../api/client';
import ErrorModal from '../components/ErrorModal';
import NavHeader from '../components/NavHeader';
import AnimalCard from '../components/AnimalCard';
import FormField from '../components/FormField';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'InseminationDetails'>;
  route: RouteProp<RootStackParamList, 'InseminationDetails'>;
};

export default function InseminationDetailsScreen({ navigation, route }: Props) {
  const { animal } = route.params;
  const { lang } = useLang();
  const ro = lang === 'RO';

  const alreadyInseminated = animal.inseminated === true;

  const [comment,        setComment]        = useState(animal.comment ?? '');
  const [bulls,          setBulls]          = useState<Bull[]>([]);
  const [selectedBullId, setSelectedBullId] = useState<number | null>(null);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  useEffect(() => {
    if (!alreadyInseminated) {
      fetchBulls().then(setBulls).catch(() => {});
    }
  }, []);

  const autoSaveComment = async (value: string) => {
    try { await saveInseminationComment(animal.ear_tag, value || null); } catch {}
  };

  const handleInseminate = async () => {
    if (!selectedBullId) {
      setError(ro ? 'Selectati un taur' : 'Please select a bull');
      return;
    }
    setSaving(true);
    try {
      await recordInseminate(animal.ear_tag, comment || null, selectedBullId);
      navigation.navigate('InseminationScan');
    } catch (e: any) {
      setSaving(false);
      setError(e?.message ?? (ro ? 'Eroare' : 'Error'));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />
      <NavHeader
        title={ro ? 'Insamintare artificiala' : 'Artificial insemination'}
        onBack={() => navigation.navigate('InseminationScan')}
      />

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

          {alreadyInseminated && animal.inseminated_date && (
            <View style={styles.insmDateRow}>
              <Text style={styles.insmDateLabel}>{ro ? 'Data insamintare:' : 'Insemination date:'}</Text>
              <Text style={styles.insmDateValue}>{String(animal.inseminated_date).slice(0, 10)}</Text>
            </View>
          )}

          {alreadyInseminated && animal.bull_name && (
            <View style={styles.bullInfo}>
              <Text style={styles.bullInfoLabel}>{ro ? 'Taur:' : 'Bull:'}</Text>
              <Text style={styles.bullInfoValue}>{animal.bull_name}</Text>
            </View>
          )}

          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            onBlur={() => autoSaveComment(comment)}
            placeholder={ro ? 'Comentariu...' : 'Comment...'}
            placeholderTextColor={Colors.border}
            multiline
            textAlignVertical="top"
          />

          {!alreadyInseminated && (
            <>
              <FormField label={ro ? 'Selectati taurul' : 'Select bull'}>
                <View style={{ gap: 8 }}>
                  {bulls.map(b => (
                    <TouchableOpacity
                      key={b.id}
                      style={[styles.bullOption, selectedBullId === b.id && styles.bullOptionSelected]}
                      onPress={() => setSelectedBullId(b.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.bullOptionTxt, selectedBullId === b.id && styles.bullOptionTxtSelected]}>
                        {b.name}  ({b.code})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </FormField>

              <TouchableOpacity
                style={[styles.inseminateBtn, (!selectedBullId || saving) && styles.btnDisabled]}
                onPress={handleInseminate}
                disabled={!selectedBullId || saving}
                activeOpacity={0.8}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.inseminateBtnTxt}>{ro ? 'Insamintata' : 'Inseminated'}</Text>
                }
              </TouchableOpacity>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:                  { flex: 1, backgroundColor: Colors.background },
  insmDateRow:           { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  insmDateLabel:         { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  insmDateValue:         { fontSize: 13, color: Colors.textDark, fontWeight: '700', fontFamily: 'monospace' },
  scroll:                { padding: 16, gap: 12 },
  commentInput:          { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.textDark, backgroundColor: '#fff', minHeight: 80, textAlignVertical: 'top' },
  bullOption:            { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff' },
  bullOptionSelected:    { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  bullOptionTxt:         { fontSize: 15, color: Colors.textDark },
  bullOptionTxtSelected: { color: Colors.primary, fontWeight: '700' },
  bullInfo:              { flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 8 },
  bullInfoLabel:         { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  bullInfoValue:         { fontSize: 14, color: Colors.textDark, fontWeight: '700' },
  inseminateBtn:         { backgroundColor: '#2E7D32', borderRadius: 8, paddingVertical: 22, alignItems: 'center', marginTop: 8 },
  inseminateBtnTxt:      { color: '#fff', fontSize: 20, fontWeight: '800' },
  btnDisabled:           { opacity: 0.5 },
});
