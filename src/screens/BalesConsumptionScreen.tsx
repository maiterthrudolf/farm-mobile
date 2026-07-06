import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import ErrorModal from '../components/ErrorModal';
import NavHeader from '../components/NavHeader';
import { addBaleConsumption, fetchBaleConsumptionStats, BaleStatRow } from '../api/client';
import DatePickerField from '../components/DatePickerField';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'BalesConsumption'> };

const ENTRY_WEIGHTS = [200, 250, 300, 350, 400, 450, 500, 600];
const BALE_TYPES    = ['Iarba Uscata', 'Iarba Siloz', 'Lucerna Uscata', 'Lucerna Siloz', 'Paie'];

function todayDisplay() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
}
function fmtNum(n: number) { return n.toLocaleString('ro-RO'); }
function toTons(kg: number) { return (kg / 1000).toFixed(1); }

export default function BalesConsumptionScreen({ navigation }: Props) {
  const { lang } = useLang();
  const ro = lang === 'RO';

  const [showDetails,  setShowDetails]  = useState(false);
  const [baleType,     setBaleType]     = useState('');
  const [weight,       setWeight]       = useState<number | null>(null);
  const [count,        setCount]        = useState('');
  const [fromField,    setFromField]    = useState(false);
  const [entryDate,    setEntryDate]    = useState(new Date().toISOString().slice(0, 10));
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [todayRows,    setTodayRows]    = useState<BaleStatRow[]>([]);
  const [yearRows,     setYearRows]     = useState<BaleStatRow[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await fetchBaleConsumptionStats();
      setTodayRows(s.today); setYearRows(s.year);
    } catch { /* silent */ }
    setStatsLoading(false);
  }, []);

  const resetForm = () => {
    setBaleType(''); setWeight(null); setCount(''); setFromField(false);
    setEntryDate(new Date().toISOString().slice(0, 10));
  };

  const handleToggleDetails = () => {
    if (!showDetails) { setShowDetails(true); loadStats(); }
    else { setShowDetails(false); resetForm(); }
  };

  const handleSubmit = async () => {
    if (!baleType) { setError(ro ? 'Selecteaza tipul de balot' : 'Select bale type'); return; }
    if (!weight)   { setError(ro ? 'Selecteaza greutatea' : 'Select weight'); return; }
    const cnt = parseInt(count, 10);
    if (!cnt || cnt <= 0) { setError(ro ? 'Introdu numarul de baloti' : 'Enter number of bales'); return; }
    setLoading(true);
    try {
      await addBaleConsumption({ bale_type: baleType, weight_kg: weight, count: cnt, from_field: fromField, entry_date: entryDate });
      setCount('');
      await loadStats();
      setShowDetails(true);
    } catch (e: any) { setError(e.message ?? 'Error'); }
    setLoading(false);
  };

  const detailsBtn = (
    <TouchableOpacity style={styles.detailsBtn} onPress={handleToggleDetails}>
      <Text style={styles.detailsBtnTxt}>{ro ? 'Detalii' : 'Details'}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />
      <NavHeader
        title={ro ? 'Consum Baloti' : 'Consumption Bales'}
        onBack={showDetails ? () => { setShowDetails(false); resetForm(); } : () => navigation.goBack()}
        right={showDetails ? null : detailsBtn}
      />

      {showDetails ? (
        <ScrollView contentContainerStyle={styles.content}>
          {statsLoading
            ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
            : <>
                <View style={styles.statsSection}>
                  <Text style={styles.statsSectionTitle}>{ro ? 'Azi' : 'Today'} {todayDisplay()}</Text>
                  {BALE_TYPES.map(bt => {
                    const r = todayRows.find(x => x.bale_type === bt);
                    return (
                      <View key={bt} style={styles.statsRow}>
                        <Text style={styles.statsType}>{bt}</Text>
                        <Text style={styles.statsCount}>{fmtNum(r?.count ?? 0)} <Text style={styles.statsUnit}>{ro ? 'baloti' : 'bales'}</Text></Text>
                        <Text style={styles.statsTons}>{toTons(r?.total_kg ?? 0)} <Text style={styles.statsUnit}>t</Text></Text>
                      </View>
                    );
                  })}
                </View>
                <View style={[styles.statsSection, styles.statsSectionGreen]}>
                  <Text style={styles.statsSectionTitleGreen}>Total {new Date().getFullYear()}</Text>
                  {BALE_TYPES.map(bt => {
                    const r = yearRows.find(x => x.bale_type === bt);
                    return (
                      <View key={bt} style={styles.statsRow}>
                        <Text style={styles.statsType}>{bt}</Text>
                        <Text style={styles.statsCount}>{fmtNum(r?.count ?? 0)} <Text style={styles.statsUnit}>{ro ? 'baloti' : 'bales'}</Text></Text>
                        <Text style={styles.statsTons}>{toTons(r?.total_kg ?? 0)} <Text style={styles.statsUnit}>t</Text></Text>
                      </View>
                    );
                  })}
                </View>
              </>
          }
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>

          <Text style={styles.label}>{ro ? 'Tip Balot' : 'Type of Bales'}</Text>
          <View style={styles.chips}>
            {BALE_TYPES.map(bt => (
              <TouchableOpacity
                key={bt} style={[styles.chip, baleType === bt && styles.chipSel]}
                onPress={() => setBaleType(bt)}
              >
                <Text style={[styles.chipTxt, baleType === bt && styles.chipSelTxt]}>{bt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{ro ? 'Greutate (kg)' : 'Weight (kg)'}</Text>
          <View style={styles.chipsRow}>
            {ENTRY_WEIGHTS.map(w => (
              <TouchableOpacity
                key={w} style={[styles.chipW, weight === w && styles.chipSel]}
                onPress={() => setWeight(w)}
              >
                <Text style={[styles.chipTxt, weight === w && styles.chipSelTxt]}>{w}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{ro ? 'Numar Baloti' : 'Number of Bales'}</Text>
          <TextInput
            style={styles.input} value={count} onChangeText={setCount}
            keyboardType="number-pad" placeholder="0" placeholderTextColor={Colors.border}
          />

          <TouchableOpacity
            style={[styles.checkRow, fromField && styles.checkRowSel]}
            onPress={() => setFromField(v => !v)}
          >
            <View style={[styles.checkbox, fromField && styles.checkboxSel]}>
              {fromField && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.checkLabel, fromField && styles.checkLabelSel]}>
              {ro ? 'Din camp (nu din stoc ferma)' : 'From field (not farm stock)'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>{ro ? 'Data Intrare' : 'Entry Date'}</Text>
          <DatePickerField value={entryDate} onChange={setEntryDate} />

          {loading
            ? <ActivityIndicator size="large" color={Colors.primary} />
            : (
              <TouchableOpacity style={styles.addBtn} onPress={handleSubmit} activeOpacity={0.8}>
                <Text style={styles.addBtnTxt}>{ro ? 'Adauga la Consum' : 'Add Bales to Consumption'}</Text>
              </TouchableOpacity>
            )
          }
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: Colors.background },
  content:            { padding: 12, gap: 8 },
  label:              { fontSize: 13, fontWeight: '700', color: Colors.textDark },
  input:              { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, fontSize: 18, fontWeight: '700', paddingVertical: 10, paddingHorizontal: 14, color: Colors.textDark, backgroundColor: Colors.card },
  chips:              { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipsRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:               { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: Colors.card },
  chipW:              { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, alignItems: 'center', backgroundColor: Colors.card },
  chipSel:            { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipTxt:            { fontSize: 13, fontWeight: '600', color: Colors.textDark },
  chipSelTxt:         { color: '#fff' },
  checkRow:           { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, padding: 9, backgroundColor: Colors.card },
  checkRowSel:        { borderColor: Colors.primary, backgroundColor: '#E8F5E9' },
  checkbox:           { width: 22, height: 22, borderWidth: 2, borderColor: Colors.border, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checkboxSel:        { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark:          { color: '#fff', fontSize: 14, fontWeight: '800' },
  checkLabel:         { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  checkLabelSel:      { color: Colors.primaryDark },
  addBtn:             { backgroundColor: '#2E7D32', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  addBtnTxt:          { color: '#fff', fontSize: 16, fontWeight: '800' },
  detailsBtn:         { backgroundColor: '#1565C0', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  detailsBtnTxt:      { color: '#fff', fontSize: 13, fontWeight: '700' },
  statsSection:           { borderWidth: 1.5, borderColor: '#1565C0', borderRadius: 8, overflow: 'hidden', backgroundColor: Colors.card },
  statsSectionGreen:      { borderColor: '#2E7D32' },
  statsSectionTitle:      { backgroundColor: '#1565C0', paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, fontWeight: '800', color: '#fff' },
  statsSectionTitleGreen: { backgroundColor: '#2E7D32', paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, fontWeight: '800', color: '#fff' },
  statsRow:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.border },
  statsType:          { flex: 2, fontSize: 13, fontWeight: '700', color: Colors.textDark },
  statsCount:         { flex: 1.5, fontSize: 13, fontWeight: '700', color: Colors.textDark },
  statsUnit:          { fontSize: 11, color: Colors.textMuted, fontWeight: '400' },
  statsTons:          { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.primary },
  statsEmpty:         { paddingHorizontal: 14, paddingVertical: 10, color: Colors.textMuted, fontSize: 13 },
});
