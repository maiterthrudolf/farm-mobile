import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { AREAS, PARCEL_INFO } from '../data/parcels';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import ErrorModal from '../components/ErrorModal';
import NavHeader from '../components/NavHeader';
import DatePickerField from '../components/DatePickerField';
import {
  fetchBaleProductionFormData, addBaleProduction, fetchBaleProductionStats,
  BaleStatRow,
} from '../api/client';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'BalesProduction'> };

const PRODUCTION_WEIGHTS = [450, 500, 550, 600];
const BALE_TYPES = ['Iarba Uscata', 'Iarba Siloz', 'Lucerna Uscata', 'Lucerna Siloz', 'Paie'];

const BALE_TYPE_TO_PARCEL: Record<string, string[]> = {
  'Iarba Uscata':  ['Grass'],
  'Iarba Siloz':   ['Grass'],
  'Lucerna Uscata':['Alfalfa'],
  'Lucerna Siloz': ['Alfalfa'],
  'Paie':          ['Barley', 'Wheat'],
};

function filteredAreas(baleType: string): string[] {
  const types = BALE_TYPE_TO_PARCEL[baleType];
  if (!types) return AREAS;
  return AREAS.filter(a => { const i = PARCEL_INFO[a]; return i && types.includes(i.type); });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function todayDisplay() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
}
function displayToISO(s: string): string | null {
  const [d, m, y] = s.split('.');
  if (!d || !m || !y || y.length !== 4) return null;
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
}
function fmtNum(n: number) { return n.toLocaleString('ro-RO'); }
function toTons(kg: number) { return (kg / 1000).toFixed(1); }

export default function BalesProductionScreen({ navigation }: Props) {
  const { lang } = useLang();
  const ro = lang === 'RO';

  const [showDetails, setShowDetails]     = useState(false);
  const [area,        setArea]            = useState('');
  const [baleType,    setBaleType]        = useState('');
  const [weight,      setWeight]          = useState<number | null>(null);
  const [count,       setCount]           = useState('');
  const [productionDate, setProductionDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading,     setLoading]         = useState(false);
  const [error,       setError]           = useState<string | null>(null);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [todayRows,   setTodayRows]       = useState<BaleStatRow[]>([]);
  const [yearRows,    setYearRows]        = useState<BaleStatRow[]>([]);
  const [statsLoading, setStatsLoading]  = useState(false);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await fetchBaleProductionStats();
      setTodayRows(s.today);
      setYearRows(s.year);
    } catch { /* silent */ }
    setStatsLoading(false);
  }, []);

  const resetForm = () => {
    setArea(''); setBaleType(''); setWeight(null); setCount('');
    setProductionDate(new Date().toISOString().slice(0, 10));
  };

  const handleToggleDetails = () => {
    if (!showDetails) { setShowDetails(true); loadStats(); }
    else { setShowDetails(false); resetForm(); }
  };

  const handleSubmit = async () => {
    if (!area)       { setError(ro ? 'Selecteaza parcela' : 'Select area'); return; }
    if (!baleType)   { setError(ro ? 'Selecteaza tipul de balot' : 'Select bale type'); return; }
    if (!weight)     { setError(ro ? 'Selecteaza greutatea' : 'Select weight'); return; }
    const cnt = parseInt(count, 10);
    if (!cnt || cnt <= 0) { setError(ro ? 'Introdu numarul de baloti' : 'Enter number of bales'); return; }

    setLoading(true);
    try {
      await addBaleProduction({ area, bale_type: baleType, weight_kg: weight, count: cnt, production_date: productionDate });
      setCount('');
      setError(null);
      await loadStats();
      setShowDetails(true);
    } catch (e: any) {
      setError(e.message ?? 'Error');
    }
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
        title={ro ? 'Productie Baloti' : 'Production Bales'}
        onBack={showDetails ? () => { setShowDetails(false); resetForm(); } : () => navigation.goBack()}
        right={showDetails ? null : detailsBtn}
      />

      <View style={{ flex: 1 }}>
        {showAreaModal && (
          <TouchableOpacity style={styles.dropOverlay} activeOpacity={1} onPress={() => setShowAreaModal(false)}>
            <View style={styles.dropBox}>
              <View style={styles.dropHeader}>
                <Text style={styles.dropTitle}>{ro ? 'Selecteaza Parcela' : 'Select Area'}</Text>
                <TouchableOpacity onPress={() => setShowAreaModal(false)} style={styles.dropClose}>
                  <Text style={styles.dropCloseTxt}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView>
                {filteredAreas(baleType).map(a => {
                  const info = PARCEL_INFO[a];
                  const sel = area === a;
                  return (
                    <TouchableOpacity
                      key={a}
                      style={[styles.dropItem, sel && styles.dropItemSel]}
                      onPress={() => { setArea(a); setShowAreaModal(false); }}
                    >
                      <Text style={[styles.dropItemName, sel && styles.dropItemSelTxt]}>{a}</Text>
                      {info && (
                        <Text style={[styles.dropItemSub, sel && styles.dropItemSelTxt]}>
                          {info.type}  ·  {info.ha.toFixed(1)} ha
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableOpacity>
        )}

        {showDetails ? (
        <ScrollView contentContainerStyle={styles.content}>
          {statsLoading
            ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
            : <>
                <View style={styles.statsSection}>
                  <Text style={styles.statsSectionTitle}>
                    {ro ? 'Azi' : 'Today'} {todayDisplay()}
                  </Text>
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
                  <Text style={styles.statsSectionTitleGreen}>
                    Total {new Date().getFullYear()}
                  </Text>
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

          <Text style={styles.label}>{ro ? 'Tip Balot' : 'Bale Type'}</Text>
          {[['Iarba Uscata', 'Iarba Siloz'], ['Lucerna Uscata', 'Lucerna Siloz', 'Paie']].map((row, ri) => (
            <View key={ri} style={styles.chips}>
              {row.map(bt => (
                <TouchableOpacity
                  key={bt}
                  style={[styles.chip, baleType === bt && styles.chipSel]}
                  onPress={() => { setBaleType(bt); setArea(''); }}
                >
                  <Text style={[styles.chipTxt, baleType === bt && styles.chipSelTxt]}>{bt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          <Text style={styles.label}>{ro ? 'Parcela' : 'Area'}</Text>
          <TouchableOpacity
            style={[styles.pickerField, !baleType && styles.pickerDisabled]}
            onPress={() => baleType && setShowAreaModal(true)}
            activeOpacity={baleType ? 0.7 : 1}
          >
            <Text style={[styles.pickerText, !area && styles.pickerPlaceholder]}>
              {area
                ? `${area}  ·  ${PARCEL_INFO[area]?.type}  ·  ${PARCEL_INFO[area]?.ha.toFixed(1)} ha`
                : baleType
                  ? (ro ? 'Selecteaza parcela...' : 'Select area...')
                  : (ro ? 'Alege mai intai tipul' : 'Select type first')}
            </Text>
            <Text style={styles.pickerArrow}>{baleType ? '▼' : '—'}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>{ro ? 'Greutate (kg)' : 'Weight (kg)'}</Text>
          <View style={styles.chipsRow}>
            {PRODUCTION_WEIGHTS.map(w => (
              <TouchableOpacity
                key={w}
                style={[styles.chipW, weight === w && styles.chipSel]}
                onPress={() => setWeight(w)}
              >
                <Text style={[styles.chipTxt, weight === w && styles.chipSelTxt]}>{w}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{ro ? 'Numar Baloti' : 'Number of Bales'}</Text>
          <TextInput
            style={styles.input}
            value={count}
            onChangeText={setCount}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={Colors.border}
          />

          <Text style={styles.label}>{ro ? 'Data Productie' : 'Production Date'}</Text>
          <DatePickerField value={productionDate} onChange={setProductionDate} />

          {loading
            ? <ActivityIndicator size="large" color={Colors.primary} />
            : (
              <TouchableOpacity style={styles.addBtn} onPress={handleSubmit} activeOpacity={0.8}>
                <Text style={styles.addBtnTxt}>
                  {ro ? 'Adauga la Productie' : 'Add Bales to Production'}
                </Text>
              </TouchableOpacity>
            )
          }
        </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: Colors.background },
  content:            { padding: 16, gap: 10 },
  label:              { fontSize: 13, fontWeight: '700', color: Colors.textDark, marginTop: 4 },
  input:              { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, fontSize: 18, fontWeight: '700', paddingVertical: 12, paddingHorizontal: 14, color: Colors.textDark, backgroundColor: Colors.card },
  chips:              { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipsRow:           { flexDirection: 'row', gap: 8 },
  chip:               { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: Colors.card },
  chipW:              { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, paddingVertical: 10, alignItems: 'center', backgroundColor: Colors.card },
  chipSel:            { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipTxt:            { fontSize: 13, fontWeight: '600', color: Colors.textDark },
  chipSelTxt:         { color: '#fff' },
  addBtn:             { backgroundColor: '#2E7D32', borderRadius: 8, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  addBtnTxt:          { color: '#fff', fontSize: 16, fontWeight: '800' },
  detailsBtn:         { backgroundColor: '#1565C0', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  detailsBtnTxt:      { color: '#fff', fontSize: 13, fontWeight: '700' },
  pickerField:        { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: Colors.card },
  pickerDisabled:     { opacity: 0.45 },
  pickerText:         { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textDark },
  pickerPlaceholder:  { color: Colors.textMuted },
  pickerArrow:        { fontSize: 12, color: Colors.textMuted },
  dropOverlay:        { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 100 },
  dropBox:            { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.card, padding: 16 },
  dropHeader:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  dropTitle:          { fontSize: 16, fontWeight: '800', color: Colors.textDark },
  dropClose:          { padding: 6 },
  dropCloseTxt:       { fontSize: 18, color: Colors.textMuted, fontWeight: '700' },
  dropItem:           { paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dropItemSel:        { backgroundColor: Colors.primary, borderRadius: 6 },
  dropItemName:       { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  dropItemSub:        { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  dropItemSelTxt:     { color: '#fff' },
  statsSection:       { borderWidth: 1.5, borderColor: '#1565C0', borderRadius: 8, overflow: 'hidden', backgroundColor: Colors.card },
  statsSectionGreen:  { borderColor: '#2E7D32' },
  statsSectionTitle:  { backgroundColor: '#1565C0', paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, fontWeight: '800', color: '#fff' },
  statsSectionTitleGreen: { backgroundColor: '#2E7D32', paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, fontWeight: '800', color: '#fff' },
  statsRow:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.border },
  statsType:          { flex: 2, fontSize: 13, fontWeight: '700', color: Colors.textDark },
  statsCount:         { flex: 1.5, fontSize: 13, fontWeight: '700', color: Colors.textDark },
  statsUnit:          { fontSize: 11, color: Colors.textMuted, fontWeight: '400' },
  statsDash:          { fontSize: 12, color: Colors.textMuted },
  statsTons:          { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.primary },
  statsKg:            { color: Colors.primary, fontWeight: '600' },
  statsEmpty:         { paddingHorizontal: 14, paddingVertical: 10, color: Colors.textMuted, fontSize: 13 },
});
