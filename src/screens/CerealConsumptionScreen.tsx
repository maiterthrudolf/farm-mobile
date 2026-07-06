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
import { addCerealConsumption, fetchCerealConsumptionStats, CerealStatRow } from '../api/client';
import DatePickerField from '../components/DatePickerField';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'CerealConsumption'> };

const CEREAL_TYPES = ['Porumb', 'Porumb Siloz', 'Porumb Crimping', 'Grau', 'Orz'];

function todayDisplay() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
}
function toTons(kg: number) { return (kg / 1000).toFixed(1); }

export default function CerealConsumptionScreen({ navigation }: Props) {
  const { lang } = useLang();
  const ro = lang === 'RO';

  const [showDetails,     setShowDetails]     = useState(false);
  const [cerealType,      setCerealType]      = useState('');
  const [tStr,            setTStr]            = useState('');
  const [consumptionDate, setConsumptionDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [todayRows,       setTodayRows]       = useState<CerealStatRow[]>([]);
  const [yearRows,        setYearRows]        = useState<CerealStatRow[]>([]);
  const [statsLoading,    setStatsLoading]    = useState(false);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await fetchCerealConsumptionStats();
      setTodayRows(s.today); setYearRows(s.year);
    } catch { /* silent */ }
    setStatsLoading(false);
  }, []);

  const resetForm = () => {
    setCerealType(''); setTStr('');
    setConsumptionDate(new Date().toISOString().slice(0, 10));
  };

  const handleToggleDetails = () => {
    if (!showDetails) { setShowDetails(true); loadStats(); }
    else { setShowDetails(false); resetForm(); }
  };

  const handleSubmit = async () => {
    if (!cerealType) { setError(ro ? 'Selecteaza tipul de cereala' : 'Select cereal type'); return; }
    const t = parseFloat(tStr.replace(',', '.'));
    if (!t || t <= 0) { setError(ro ? 'Introdu cantitatea in tone' : 'Enter tonnes'); return; }
    setLoading(true);
    try {
      await addCerealConsumption({ cereal_type: cerealType, consumption_kg: t * 1000, consumption_date: consumptionDate });
      setTStr('');
      loadStats();
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
        title={ro ? 'Consum Cereale' : 'Consumption Cereals'}
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
                  {CEREAL_TYPES.map(ct => {
                    const r = todayRows.find(x => x.cereal_type === ct);
                    return (
                      <View key={ct} style={styles.statsRow}>
                        <Text style={styles.statsType}>{ct}</Text>
                        <Text style={styles.statsTons}>{toTons(r?.total_kg ?? 0)} <Text style={styles.statsUnit}>t</Text></Text>
                      </View>
                    );
                  })}
                </View>
                <View style={[styles.statsSection, styles.statsSectionGreen]}>
                  <Text style={styles.statsSectionTitleGreen}>Total {new Date().getFullYear()}</Text>
                  {CEREAL_TYPES.map(ct => {
                    const r = yearRows.find(x => x.cereal_type === ct);
                    return (
                      <View key={ct} style={styles.statsRow}>
                        <Text style={styles.statsType}>{ct}</Text>
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

          <Text style={styles.label}>{ro ? 'Tip Cereala' : 'Type of Cereals'}</Text>
          <View style={styles.chips}>
            {CEREAL_TYPES.map(ct => (
              <TouchableOpacity
                key={ct} style={[styles.chip, cerealType === ct && styles.chipSel]}
                onPress={() => setCerealType(ct)}
              >
                <Text style={[styles.chipTxt, cerealType === ct && styles.chipSelTxt]}>{ct}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{ro ? 'Data Consum' : 'Date of Consumption'}</Text>
          <DatePickerField value={consumptionDate} onChange={setConsumptionDate} />

          <Text style={styles.label}>{ro ? 'Cantitate (t)' : 'Quantity (t)'}</Text>
          <TextInput
            style={styles.input} value={tStr} onChangeText={setTStr}
            keyboardType="numeric" placeholder="0.0" placeholderTextColor={Colors.border}
          />

          {loading
            ? <ActivityIndicator size="large" color={Colors.primary} />
            : (
              <TouchableOpacity style={styles.addBtn} onPress={handleSubmit} activeOpacity={0.8}>
                <Text style={styles.addBtnTxt}>{ro ? 'Adauga la Consum' : 'Add to Consumption'}</Text>
              </TouchableOpacity>
            )
          }
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:                   { flex: 1, backgroundColor: Colors.background },
  content:                { padding: 16, gap: 10 },
  label:                  { fontSize: 13, fontWeight: '700', color: Colors.textDark, marginTop: 4 },
  input:                  { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, fontSize: 18, fontWeight: '700', paddingVertical: 12, paddingHorizontal: 14, color: Colors.textDark, backgroundColor: Colors.card },
  chips:                  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:                   { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: Colors.card },
  chipSel:                { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipTxt:                { fontSize: 13, fontWeight: '600', color: Colors.textDark },
  chipSelTxt:             { color: '#fff' },
  addBtn:                 { backgroundColor: '#2E7D32', borderRadius: 8, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  addBtnTxt:              { color: '#fff', fontSize: 16, fontWeight: '800' },
  detailsBtn:             { backgroundColor: '#1565C0', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  detailsBtnTxt:          { color: '#fff', fontSize: 13, fontWeight: '700' },
  statsSection:           { borderWidth: 1.5, borderColor: '#1565C0', borderRadius: 8, overflow: 'hidden', backgroundColor: Colors.card },
  statsSectionGreen:      { borderColor: '#2E7D32' },
  statsSectionTitle:      { backgroundColor: '#1565C0', paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, fontWeight: '800', color: '#fff' },
  statsSectionTitleGreen: { backgroundColor: '#2E7D32', paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, fontWeight: '800', color: '#fff' },
  statsRow:               { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.border },
  statsType:              { flex: 2, fontSize: 13, fontWeight: '700', color: Colors.textDark },
  statsTons:              { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.primary },
  statsUnit:              { fontSize: 11, color: Colors.textMuted, fontWeight: '400' },
});
