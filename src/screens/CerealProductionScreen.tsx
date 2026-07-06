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
import { addCerealProduction, fetchCerealProductionStats, CerealStatRow } from '../api/client';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'CerealProduction'> };

const CEREAL_TYPES = ['Porumb', 'Porumb Siloz', 'Porumb Crimping', 'Grau', 'Orz'];

const CEREAL_TYPE_TO_PARCEL: Record<string, string[]> = {
  'Porumb':          ['Corn'],
  'Porumb Siloz':    ['Corn Silage'],
  'Porumb Crimping': ['Corn'],
  'Grau':            ['Wheat'],
  'Orz':             ['Barley'],
};

function filteredAreas(cerealType: string): string[] {
  const types = CEREAL_TYPE_TO_PARCEL[cerealType];
  if (!types) return AREAS;
  return AREAS.filter(a => { const i = PARCEL_INFO[a]; return i && types.includes(i.type); });
}

function todayDisplay() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
}
function toTons(kg: number) { return (kg / 1000).toFixed(1); }

export default function CerealProductionScreen({ navigation }: Props) {
  const { lang } = useLang();
  const ro = lang === 'RO';

  const [showDetails,    setShowDetails]    = useState(false);
  const [area,           setArea]           = useState('');
  const [cerealType,     setCerealType]     = useState('');
  const [harvestT,       setHarvestT]       = useState('');
  const [productionDate, setProductionDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [showAreaModal,  setShowAreaModal]  = useState(false);
  const [todayRows,      setTodayRows]      = useState<CerealStatRow[]>([]);
  const [yearRows,       setYearRows]       = useState<CerealStatRow[]>([]);
  const [statsLoading,   setStatsLoading]   = useState(false);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await fetchCerealProductionStats();
      setTodayRows(s.today); setYearRows(s.year);
    } catch { /* silent */ }
    setStatsLoading(false);
  }, []);

  const resetForm = () => {
    setArea(''); setCerealType(''); setHarvestT('');
    setProductionDate(new Date().toISOString().slice(0, 10));
  };

  const handleToggleDetails = () => {
    if (!showDetails) { setShowDetails(true); loadStats(); }
    else { setShowDetails(false); resetForm(); }
  };

  const handleSubmit = async () => {
    if (!area)       { setError(ro ? 'Selecteaza parcela' : 'Select area'); return; }
    if (!cerealType) { setError(ro ? 'Selecteaza tipul de cereala' : 'Select cereal type'); return; }
    const t = parseFloat(harvestT.replace(',', '.'));
    if (!t || t <= 0) { setError(ro ? 'Introdu cantitatea in tone' : 'Enter harvest in tonnes'); return; }

    setLoading(true);
    try {
      await addCerealProduction({ area, cereal_type: cerealType, harvest_kg: t * 1000, production_date: productionDate });
      setHarvestT('');
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
        title={ro ? 'Productie Cereale' : 'Production Cereals'}
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
                {filteredAreas(cerealType).map(a => {
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
                  onPress={() => { setCerealType(ct); setArea(''); }}
                >
                  <Text style={[styles.chipTxt, cerealType === ct && styles.chipSelTxt]}>{ct}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{ro ? 'Parcela' : 'Area'}</Text>
            <TouchableOpacity
              style={[styles.pickerField, !cerealType && styles.pickerDisabled]}
              onPress={() => cerealType && setShowAreaModal(true)}
              activeOpacity={cerealType ? 0.7 : 1}
            >
              <Text style={[styles.pickerText, !area && styles.pickerPlaceholder]}>
                {area
                  ? `${area}  ·  ${PARCEL_INFO[area]?.type}  ·  ${PARCEL_INFO[area]?.ha.toFixed(1)} ha`
                  : cerealType
                    ? (ro ? 'Selecteaza parcela...' : 'Select area...')
                    : (ro ? 'Alege mai intai tipul' : 'Select type first')}
              </Text>
              <Text style={styles.pickerArrow}>{cerealType ? '▼' : '—'}</Text>
            </TouchableOpacity>

            <Text style={styles.label}>{ro ? 'Data Productie' : 'Production Date'}</Text>
            <DatePickerField value={productionDate} onChange={setProductionDate} />

            <Text style={styles.label}>{ro ? 'Recolta (t)' : 'Harvest (t)'}</Text>
            <TextInput
              style={styles.input} value={harvestT} onChangeText={setHarvestT}
              keyboardType="numeric" placeholder="0.0" placeholderTextColor={Colors.border}
            />

            {loading
              ? <ActivityIndicator size="large" color={Colors.primary} />
              : (
                <TouchableOpacity style={styles.addBtn} onPress={handleSubmit} activeOpacity={0.8}>
                  <Text style={styles.addBtnTxt}>{ro ? 'Adauga la Productie' : 'Add to Production'}</Text>
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
  pickerField:            { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: Colors.card },
  pickerDisabled:         { opacity: 0.45 },
  pickerText:             { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textDark },
  pickerPlaceholder:      { color: Colors.textMuted },
  pickerArrow:            { fontSize: 12, color: Colors.textMuted },
  dropOverlay:            { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 100 },
  dropBox:                { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.card, padding: 16 },
  dropHeader:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  dropTitle:              { fontSize: 16, fontWeight: '800', color: Colors.textDark },
  dropClose:              { padding: 6 },
  dropCloseTxt:           { fontSize: 18, color: Colors.textMuted, fontWeight: '700' },
  dropItem:               { paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dropItemSel:            { backgroundColor: Colors.primary, borderRadius: 6 },
  dropItemName:           { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  dropItemSub:            { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  dropItemSelTxt:         { color: '#fff' },
  statsSection:           { borderWidth: 1.5, borderColor: '#1565C0', borderRadius: 8, overflow: 'hidden', backgroundColor: Colors.card },
  statsSectionGreen:      { borderColor: '#2E7D32' },
  statsSectionTitle:      { backgroundColor: '#1565C0', paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, fontWeight: '800', color: '#fff' },
  statsSectionTitleGreen: { backgroundColor: '#2E7D32', paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, fontWeight: '800', color: '#fff' },
  statsRow:               { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.border },
  statsType:              { flex: 2, fontSize: 13, fontWeight: '700', color: Colors.textDark },
  statsTons:              { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.primary },
  statsUnit:              { fontSize: 11, color: Colors.textMuted, fontWeight: '400' },
});
