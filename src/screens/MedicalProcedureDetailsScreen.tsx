import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { recordMedicalProcedure, fetchLastProcedureRecord, MedicalAnimalInfo } from '../api/client';
import NavHeader from '../components/NavHeader';
import ErrorModal from '../components/ErrorModal';
import FormField from '../components/FormField';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MedicalProcedureDetails'>;
  route: RouteProp<RootStackParamList, 'MedicalProcedureDetails'>;
};

function fmtDate(d: string | null): string {
  if (!d) return '—';
  return d.slice(0, 10).split('-').reverse().join('.');
}

function animalLabel(info: MedicalAnimalInfo, ro: boolean): string {
  const sex = info.sex === 'F' ? (ro ? 'Femela' : 'Female') : info.sex === 'M' ? (ro ? 'Mascul' : 'Male') : '—';
  const grp = info.group_name ? (/\bgrupa\b/i.test(info.group_name) ? info.group_name : `Grupa ${info.group_name}`) : '—';
  return `${sex}  ·  ${grp}`;
}

function fmtAge(birthDate: string | null | undefined, ro: boolean): string {
  if (!birthDate) return '—';
  const birth = new Date(birthDate);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  const rem = months % 12;
  const years = rem >= 6 ? Math.ceil(months / 12) : Math.floor(months / 12);
  return `${years} ${ro ? 'A' : 'Y'}`;
}

export default function MedicalProcedureDetailsScreen({ navigation, route }: Props) {
  const { earTag, procedureId, procedureName, medicationName, animalInfo } = route.params;
  const { lang } = useLang();
  const ro = lang === 'RO';

  const [comment, setComment] = useState('');
  const [weight,  setWeight]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const weightRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchLastProcedureRecord(earTag, procedureId).then(r => {
      if (r.comment) setComment(r.comment);
      if (r.weight != null) setWeight(String(r.weight));
    });
  }, [earTag, procedureId]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await recordMedicalProcedure({
        ear_tag: earTag,
        procedure_id: procedureId,
        comment: comment.trim() || undefined,
        weight: weight ? parseFloat(weight) : undefined,
      });
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message ?? 'Error');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />
      <NavHeader
        title={procedureName}
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            style={styles.listBtn}
            onPress={() => navigation.navigate('MedicalHistory', { earTag })}
            activeOpacity={0.8}
          >
            <Text style={styles.listBtnTxt}>{ro ? 'Listă' : 'List'}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Animal info banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTag}>{earTag}</Text>
          <Text style={styles.bannerSub}>{animalLabel(animalInfo, ro)}  ·  {fmtAge(animalInfo.birth_date, ro)}</Text>
        </View>

        <FormField label={ro ? 'Greutate (kg, optional)' : 'Weight (kg, optional)'}>
          <TextInput
            ref={weightRef}
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="0.0"
            placeholderTextColor={Colors.border}
            keyboardType="decimal-pad"
            returnKeyType="done"
            blurOnSubmit
          />
        </FormField>

        <FormField label={ro ? 'Comentariu' : 'Comment'}>
          <TextInput
            style={[styles.input, styles.commentInput]}
            value={comment}
            onChangeText={setComment}
            placeholder={ro ? 'Optional...' : 'Optional...'}
            placeholderTextColor={Colors.border}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </FormField>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnTxt}>{ro ? 'Salvare' : 'Save'}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.background },
  scroll:        { padding: 16, gap: 14 },
  banner:        { backgroundColor: Colors.primary, borderRadius: 10, padding: 14, gap: 4 },
  bannerTag:     { color: '#fff', fontSize: 16, fontWeight: '900', fontFamily: 'monospace' },
  bannerSub:     { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  listBtn:       { backgroundColor: '#E65100', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 5 },
  listBtnTxt:    { color: '#fff', fontSize: 13, fontWeight: '700' },
  input:         { borderWidth: 2, borderColor: Colors.border, borderRadius: 8, fontSize: 16,
                   paddingVertical: 12, paddingHorizontal: 14, color: Colors.textDark, backgroundColor: Colors.card },
  commentInput:  { minHeight: 80 },
  saveBtn:       { backgroundColor: '#2E7D32', borderRadius: 10, paddingVertical: 18, alignItems: 'center' },
  saveBtnTxt:    { color: '#fff', fontSize: 17, fontWeight: '800' },
  successBox:    { gap: 10 },
  successTxt:    { textAlign: 'center', color: '#2E7D32', fontWeight: '800', fontSize: 15,
                   backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8 },
  nextBtn:       { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 16, alignItems: 'center' },
  nextBtnTxt:    { color: '#fff', fontSize: 16, fontWeight: '800' },
});
