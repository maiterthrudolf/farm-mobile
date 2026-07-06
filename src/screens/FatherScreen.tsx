import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import {
  fetchFatherList, fetchFatherCandidates,
  assignFather, skipFather,
  CalfItem, FatherCandidates,
} from '../api/client';
import NavHeader from '../components/NavHeader';
import ErrorModal from '../components/ErrorModal';
import ConfirmModal from '../components/ConfirmModal';
import FormField from '../components/FormField';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Father'>;
};

function fmtDate(d: string | null): string {
  if (!d) return '—';
  return d.slice(0, 10).split('-').reverse().join('.');
}

function fmtAge(birthDate: string | null): string {
  if (!birthDate) return '—';
  const birth = new Date(birthDate);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 12) return `${months} M`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years} Y ${rem} M` : `${years} Y`;
}

export default function FatherScreen({ navigation }: Props) {
  const { lang } = useLang();
  const ro = lang === 'RO';

  const [calves,      setCalves]      = useState<CalfItem[]>([]);
  const [index,       setIndex]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [candidates,  setCandidates]  = useState<FatherCandidates | null>(null);
  const [loadingCand, setLoadingCand] = useState(false);
  const [selected,    setSelected]    = useState<string | null>(null); // ear_tag or 'ai'
  const [manual,      setManual]      = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [confirmSkip, setConfirmSkip] = useState(false);

  const loadList = useCallback(() => {
    setLoading(true);
    fetchFatherList()
      .then(list => { setCalves(list); setIndex(0); })
      .catch(e => setError(e?.message ?? 'Error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  const calf = calves[index] ?? null;

  useEffect(() => {
    if (!calf) { setCandidates(null); return; }
    setSelected(null);
    setManual('');
    setLoadingCand(true);
    fetchFatherCandidates(calf.ear_tag)
      .then(setCandidates)
      .catch(() => setCandidates({ natural_bulls: [], ai_donor: null }))
      .finally(() => setLoadingCand(false));
  }, [calf?.ear_tag]);

  const handleSave = async () => {
    const fatherTag = selected === 'ai'
      ? (candidates?.ai_donor?.ai_bull_name ?? '')
      : selected ?? manual.trim();
    if (!fatherTag || !calf) return;
    setSaving(true);
    try {
      await assignFather(calf.ear_tag, fatherTag);
      const next = calves.filter((_, i) => i !== index);
      setCalves(next);
      setIndex(prev => Math.min(prev, Math.max(0, next.length - 1)));
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!calf) return;
    setConfirmSkip(false);
    try {
      await skipFather(calf.ear_tag);
      const next = calves.filter((_, i) => i !== index);
      setCalves(next);
      setIndex(prev => Math.min(prev, Math.max(0, next.length - 1)));
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    }
  };

  const canSave = selected !== null || manual.trim().length > 0;

  const naturalBulls = candidates?.natural_bulls ?? [];
  const aiDonor = candidates?.ai_donor ?? null;

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />
      <ConfirmModal
        message={confirmSkip
          ? (ro ? 'Sigur tatal este necunoscut?' : 'Are you sure the father is unknown?')
          : null}
        labelYes={ro ? 'Da, necunoscut' : 'Yes, unknown'}
        labelNo={ro ? 'Nu' : 'No'}
        onYes={handleSkip}
        onNo={() => setConfirmSkip(false)}
      />

      <NavHeader
        title={ro ? 'Tata' : 'Father'}
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
      ) : calves.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>✓</Text>
          <Text style={styles.emptyText}>
            {ro ? 'Toti viteii au tata asignat!' : 'All calves have a father assigned!'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Counter + navigation */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navBtn, index === 0 && styles.navBtnDisabled]}
              onPress={() => setIndex(i => Math.max(0, i - 1))}
              disabled={index === 0}
              activeOpacity={0.7}
            >
              <Text style={styles.navBtnTxt}>‹ {ro ? 'Inapoi' : 'Prev'}</Text>
            </TouchableOpacity>

            <View style={styles.counter}>
              <Text style={styles.counterNum}>{String(index + 1).padStart(2, '0')}</Text>
              <Text style={styles.counterSep}> / </Text>
              <Text style={styles.counterTotal}>{calves.length}</Text>
            </View>

            <TouchableOpacity
              style={[styles.navBtn, index === calves.length - 1 && styles.navBtnDisabled]}
              onPress={() => setIndex(i => Math.min(calves.length - 1, i + 1))}
              disabled={index === calves.length - 1}
              activeOpacity={0.7}
            >
              <Text style={styles.navBtnTxt}>{ro ? 'Urm' : 'Next'} ›</Text>
            </TouchableOpacity>
          </View>

          {/* Calf info card */}
          {calf && (
            <View style={styles.calfCard}>
              <Text style={styles.calfTag}>{calf.ear_tag}</Text>
              <View style={styles.calfRow}>
                <Text style={styles.calfLabel}>{ro ? 'Nastere' : 'Born'}:</Text>
                <Text style={styles.calfVal}>{fmtDate(calf.birth_date)}  ·  {fmtAge(calf.birth_date)}</Text>
              </View>
              <View style={styles.calfRow}>
                <Text style={styles.calfLabel}>{ro ? 'Sex' : 'Sex'}:</Text>
                <Text style={styles.calfVal}>{calf.sex === 'F' ? (ro ? 'Femela' : 'Female') : calf.sex === 'M' ? (ro ? 'Mascul' : 'Male') : '—'}</Text>
              </View>
              {calf.mother_ear_tag && (
                <View style={styles.calfRow}>
                  <Text style={styles.calfLabel}>{ro ? 'Mama' : 'Mother'}:</Text>
                  <Text style={styles.calfVal}>{calf.mother_ear_tag}</Text>
                </View>
              )}
              {calf.group_name && (
                <View style={styles.calfRow}>
                  <Text style={styles.calfLabel}>{ro ? 'Grupa' : 'Group'}:</Text>
                  <Text style={styles.calfVal}>{calf.group_name}</Text>
                </View>
              )}
            </View>
          )}

          {/* Candidates */}
          {loadingCand ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <View style={styles.candidatesSection}>
              <Text style={styles.sectionLabel}>
                {ro ? 'Selectati tata' : 'Select father'}
              </Text>

              {/* Natural bulls */}
              {naturalBulls.length > 0 && (
                <View style={styles.candidateGroup}>
                  <Text style={styles.groupLabel}>{ro ? 'Tauri din grupa' : 'Bulls in group'}</Text>
                  {naturalBulls.map(bull => {
                    const isOn = selected === bull.ear_tag;
                    return (
                      <TouchableOpacity
                        key={bull.ear_tag}
                        style={[styles.candidateRow, isOn && styles.candidateRowOn]}
                        onPress={() => { setSelected(isOn ? null : bull.ear_tag); setManual(''); }}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.radio, isOn && styles.radioOn]} />
                        <View style={styles.candidateInfo}>
                          <Text style={[styles.candidateName, isOn && styles.candidateNameOn]}>
                            {bull.bull_name ?? bull.ear_tag}
                          </Text>
                          {bull.bull_name && (
                            <Text style={styles.candidateTag}>{bull.ear_tag}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* AI donor */}
              {aiDonor && (
                <View style={styles.candidateGroup}>
                  <Text style={styles.groupLabel}>{ro ? 'Inseminare artificiala' : 'Artificial insemination'}</Text>
                  <TouchableOpacity
                    style={[styles.candidateRow, selected === 'ai' && styles.candidateRowOn]}
                    onPress={() => { setSelected(selected === 'ai' ? null : 'ai'); setManual(''); }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radio, selected === 'ai' && styles.radioOn]} />
                    <View style={styles.candidateInfo}>
                      <Text style={[styles.candidateName, selected === 'ai' && styles.candidateNameOn]}>
                        {aiDonor.ai_bull_name}
                      </Text>
                      {aiDonor.ai_bull_code && (
                        <Text style={styles.candidateTag}>{ro ? 'Cod' : 'Code'}: {aiDonor.ai_bull_code}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* Manual entry */}
              <FormField label={ro ? 'Alt tata (ID manual)' : 'Other father (manual ID)'}>
                <TextInput
                  style={styles.input}
                  value={manual}
                  onChangeText={v => { setManual(v); if (v.trim()) setSelected(null); }}
                  placeholder={ro ? 'Numar ureche...' : 'Ear tag...'}
                  placeholderTextColor={Colors.border}
                  autoCapitalize="characters"
                />
              </FormField>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => setConfirmSkip(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.skipBtnTxt}>{ro ? 'Necunoscut' : 'Unknown'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, (!canSave || saving) && { opacity: 0.45 }]}
              onPress={handleSave}
              disabled={!canSave || saving}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnTxt}>{ro ? 'Salvare' : 'Save'}</Text>
              }
            </TouchableOpacity>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: Colors.background },
  scroll:           { padding: 16, gap: 16 },
  emptyWrap:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyIcon:        { fontSize: 56, color: Colors.primary },
  emptyText:        { fontSize: 16, fontWeight: '700', color: Colors.textMuted, textAlign: 'center' },

  navRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn:           { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  navBtnDisabled:   { opacity: 0.35 },
  navBtnTxt:        { color: '#fff', fontSize: 14, fontWeight: '700' },
  counter:          { flexDirection: 'row', alignItems: 'baseline' },
  counterNum:       { fontSize: 28, fontWeight: '900', color: Colors.primaryDark, fontFamily: 'monospace' },
  counterSep:       { fontSize: 18, color: Colors.textMuted },
  counterTotal:     { fontSize: 20, fontWeight: '700', color: Colors.textMuted },

  calfCard:         { backgroundColor: Colors.primary, borderRadius: 12, padding: 16, gap: 6 },
  calfTag:          { color: '#fff', fontSize: 15, fontWeight: '900', fontFamily: 'monospace', marginBottom: 4 },
  calfRow:          { flexDirection: 'row', gap: 6 },
  calfLabel:        { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', width: 64 },
  calfVal:          { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },

  candidatesSection:{ gap: 14 },
  sectionLabel:     { fontSize: 13, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  candidateGroup:   { gap: 6 },
  groupLabel:       { fontSize: 12, fontWeight: '600', color: Colors.textMuted, fontStyle: 'italic' },

  candidateRow:     { flexDirection: 'row', alignItems: 'center', gap: 12,
                      borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
                      paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Colors.card },
  candidateRowOn:   { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  radio:            { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.border },
  radioOn:          { borderColor: Colors.primary, backgroundColor: Colors.primary },
  candidateInfo:    { flex: 1, gap: 2 },
  candidateName:    { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  candidateNameOn:  { color: Colors.primaryDark },
  candidateTag:     { fontSize: 11, color: Colors.textMuted, fontFamily: 'monospace' },

  input:            { borderWidth: 2, borderColor: Colors.border, borderRadius: 8, fontSize: 15,
                      paddingVertical: 12, paddingHorizontal: 14, color: Colors.textDark,
                      backgroundColor: Colors.card },

  actions:          { flexDirection: 'row', gap: 12 },
  skipBtn:          { flex: 1, backgroundColor: Colors.textMuted, borderRadius: 10,
                      paddingVertical: 16, alignItems: 'center' },
  skipBtnTxt:       { color: '#fff', fontSize: 16, fontWeight: '800' },
  saveBtn:          { flex: 2, backgroundColor: '#2E7D32', borderRadius: 10,
                      paddingVertical: 16, alignItems: 'center' },
  saveBtnTxt:       { color: '#fff', fontSize: 16, fontWeight: '800' },
});
