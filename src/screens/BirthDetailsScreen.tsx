import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { getCompany } from '../theme/companies';
import AnimalCard from '../components/AnimalCard';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { saveBirth, MotherInfo } from '../api/client';
import ErrorModal from '../components/ErrorModal';
import NavHeader from '../components/NavHeader';
import FormField from '../components/FormField';
import DateField from '../components/DateField';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BirthDetails'>;
  route: RouteProp<RootStackParamList, 'BirthDetails'>;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}


export default function BirthDetailsScreen({ navigation, route }: Props) {
  const { earTag, company: companyKey, noId, mother } = route.params;
  const { lang, t } = useLang();
  const ro = lang === 'RO';

  const company      = getCompany(companyKey);
  const companyShort = company?.short ?? companyKey ?? null;
  const borderColor  = company?.bg ?? Colors.border;
  const headerText   = company?.text ?? '#fff';
  const isNoId       = noId || earTag === 'NOID';

  const [dateISO, setDateISO] = useState(todayISO());
  const [sex,     setSex]     = useState<'M' | 'F' | null>(null);
  const [color,   setColor]   = useState<'BLACK' | 'RED' | null>(null);
  const [comment, setComment] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const headerLabel = isNoId ? (ro ? 'Moarte Fara Crotaliu' : 'Death with No ID') : earTag;

  const showError = (msg: string) => setError(msg);

  const handleSave = async () => {
    setError(null);
    if (!dateISO || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
      showError(ro ? 'Data invalida' : 'Invalid date');
      return;
    }
    const parsed  = new Date(dateISO);
    const today   = new Date(); today.setHours(23, 59, 59);
    const minDate = new Date(); minDate.setMonth(minDate.getMonth() - 1);
    if (parsed > today) {
      showError(ro ? 'Data nu poate fi in viitor' : 'Date cannot be in the future');
      return;
    }
    if (parsed < minDate) {
      showError(ro ? 'Maxim 1 luna in trecut' : 'Maximum 1 month in the past');
      return;
    }
    if (!sex)   { showError(ro ? 'Selecteaza sexul'    : 'Select sex');   return; }
    if (!color) { showError(ro ? 'Selecteaza culoarea' : 'Select color'); return; }

    const finalTag     = isNoId ? `NOID-${Date.now()}` : earTag;
    const finalCompany = companyKey ?? (mother?.company ?? null);

    setSaving(true);
    try {
      await saveBirth({
        ear_tag:        finalTag,
        company:        finalCompany,
        birth_date:     dateISO,
        sex,
        color,
        comment:        comment || null,
        mother_ear_tag: mother?.ear_tag ?? null,
        no_id:          isNoId,
      });
      navigation.navigate('BirthMother');
    } catch (e: any) {
      setSaving(false);
      showError(e?.message ?? (ro ? 'Nu s-a putut salva' : 'Could not save'));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />
      <NavHeader
        title={t('birth')}
        onBack={() => navigation.navigate('BirthMother')}
        right={companyShort
          ? <View style={[styles.companyBadge, { backgroundColor: borderColor }]}>
              <Text style={[styles.companyBadgeTxt, { color: headerText }]}>{companyShort}</Text>
            </View>
          : undefined
        }
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { borderColor }]}>

          {/* Card header: earTag · company (short) */}
          <View style={[styles.cardHeader, { backgroundColor: borderColor }]}>
            <Text style={[styles.cardHeaderTxt, { color: headerText }]}>
              {isNoId ? (ro ? 'Moarte Fara Crotaliu' : 'Death with No ID') : earTag}
            </Text>
          </View>

          <View style={styles.body}>

            <FormField label={ro ? 'Mama' : 'Mother'}>
              {mother
                ? <AnimalCard data={mother} lang={lang} onPress={() => {}} showCompany={false} showGestation={true} showCategoryBar={false} />
                : <Text style={styles.noMother}>{ro ? 'Fara mama' : 'No mother assigned'}</Text>
              }
            </FormField>

            <FormField label={ro ? 'Data Nasterii' : 'Birth Date'}>
              <DateField value={dateISO} onChange={setDateISO} />
            </FormField>

            <FormField label={ro ? 'Sex' : 'Sex'}>
              <View style={styles.toggleRow}>
                {(['M', 'F'] as const).map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.toggleBtn, sex === s && styles.toggleBtnActive]}
                    onPress={() => setSex(s)}
                  >
                    <Text style={[styles.toggleTxt, sex === s && styles.toggleTxtActive]}>
                      {s === 'M' ? (ro ? 'Mascul' : 'Male') : (ro ? 'Femela' : 'Female')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </FormField>

            <FormField label={ro ? 'Culoare' : 'Color'}>
              <View style={styles.toggleRow}>
                {(['BLACK', 'RED'] as const).map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.toggleBtn, color === c && styles.toggleBtnActive]}
                    onPress={() => setColor(c)}
                  >
                    <Text style={[styles.toggleTxt, color === c && styles.toggleTxtActive]}>
                      {c === 'BLACK' ? (ro ? 'Negru' : 'Black') : (ro ? 'Rosu' : 'Red')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </FormField>

            <FormField label={ro ? 'Comentariu' : 'Comment'}>
              <TextInput
                style={styles.commentInput}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                placeholder={ro ? 'comentarii despre acest animal...' : 'notes about this animal...'}
                placeholderTextColor={Colors.border}
              />
            </FormField>

            {/* Save */}
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Colors.background },
  scroll:          { padding: 12 },
  card:            { borderWidth: 2, borderRadius: 8, overflow: 'hidden', backgroundColor: Colors.card },
  cardHeader:      { paddingHorizontal: 14, paddingVertical: 10 },
  cardHeaderTxt:   { fontSize: 15, fontWeight: '800' },
  body:            { padding: 14, gap: 12 },
  companyBadge:    { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, minWidth: 70, alignItems: 'center' },
  companyBadgeTxt: { fontSize: 13, fontWeight: '800' },
  noMother:        { fontSize: 14, color: Colors.textMuted, fontStyle: 'italic' },
  toggleRow:       { flexDirection: 'row', gap: 10 },
  toggleBtn:       { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, paddingVertical: 16, alignItems: 'center', backgroundColor: '#fff' },
  toggleBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  toggleTxt:       { fontSize: 16, fontWeight: '600', color: Colors.textMuted },
  toggleTxtActive: { color: '#fff' },
  commentInput:    { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.textDark, backgroundColor: '#fff', minHeight: 90, textAlignVertical: 'top' },
  saveBtn:         { backgroundColor: '#2E7D32', borderRadius: 8, paddingVertical: 20, alignItems: 'center', marginTop: 8 },
  saveBtnTxt:      { color: '#fff', fontSize: 18, fontWeight: '800' },
  btnDisabled:     { opacity: 0.5 },
});
