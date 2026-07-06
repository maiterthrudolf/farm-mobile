import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useLang } from '../i18n/LanguageContext';
import NavHeader from '../components/NavHeader';
import { Colors } from '../theme/colors';
import { getCompany, categoryLabel, categoryColor, getColorName } from '../theme/companies';
import { RootStackParamList } from '../navigation/AppNavigator';
import { fetchByTag, fetchCalves, fetchWeightHistory, CattleRecord, CalfRecord, WeightEntry } from '../api/client';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AnimalDetail'>;
  route: RouteProp<RootStackParamList, 'AnimalDetail'>;
};

// ── helpers ──────────────────────────────────────────────────────────────────

function monthsOld(birthDate: string | null): number {
  if (!birthDate) return 0;
  const b = new Date(birthDate);
  const n = new Date();
  return (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
}

function ageStr(birthDate: string | null, lang: string): string {
  const m = monthsOld(birthDate);
  if (m < 1) return lang === 'RO' ? '0 luni' : '0 mo';
  const yr = lang === 'RO' ? 'A' : 'Y';
  const mo = lang === 'RO' ? 'L' : 'M';
  const y = Math.floor(m / 12); const r = m % 12;
  if (y === 0) return `${r} ${mo}`;
  if (r === 0) return `${y} ${yr}`;
  return `${y} ${yr} ${r} ${mo}`;
}

function animalType(sex: string | null, birthDate: string | null, lang: string): string {
  const m = monthsOld(birthDate);
  const ro = lang === 'RO';
  if (sex === 'M') {
    if (m < 6)  return ro ? 'Vitel'  : 'Calf';
    if (m < 12) return ro ? 'Tauras' : 'Young Bull';
    return ro ? 'Mascul' : 'Bull';
  }
  if (m < 6)  return ro ? 'Vitea'   : 'Female Calf';
  if (m < 12) return ro ? 'Vitica'  : 'Young Heifer';
  if (m < 24) return ro ? 'Juninca' : 'Heifer';
  return ro ? 'Vaca' : 'Cow';
}

function yesNo(val: boolean | null | undefined, lang: string): string {
  if (val == null) return '—';
  return val ? (lang === 'RO' ? 'Da' : 'Yes') : (lang === 'RO' ? 'Nu' : 'No');
}

function pedigreeLabel(val: string | null, lang: string): string {
  const v = (val ?? '').toLowerCase();
  if (v === 'yes')     return lang === 'RO' ? 'Da'    : 'Yes';
  if (v === 'no')      return lang === 'RO' ? 'Nu'    : 'No';
  if (v === 'pending') return lang === 'RO' ? 'InCurs': 'Pending';
  return '—';
}

function statusLbl(s: string | null, lang: string): string {
  const u = (s ?? '').toUpperCase();
  const ro = lang === 'RO';
  if (u === 'VIU'    || u === 'ALIVE') return ro ? 'VIU'    : 'ALIVE';
  if (u === 'VANDUT' || u === 'SOLD')  return ro ? 'VANDUT' : 'SOLD';
  if (u === 'MORT'   || u === 'DEAD')  return ro ? 'MORT'   : 'DEAD';
  return s ?? '—';
}

function statusClr(s: string | null): string {
  const u = (s ?? '').toUpperCase();
  if (u === 'VIU'    || u === 'ALIVE') return '#2E7D32';
  if (u === 'VANDUT' || u === 'SOLD')  return '#1565C0';
  return '#C62828';
}

function isDeadOrSold(s: string | null) {
  const u = (s ?? '').toUpperCase();
  return u === 'MORT' || u === 'DEAD' || u === 'VANDUT' || u === 'SOLD';
}

function groupText(animal: CattleRecord, lang: string): string {
  const sold = animal.status === 'VANDUT' || animal.status === 'SOLD';
  const dead = animal.status === 'MORT' || animal.status === 'DEAD';
  if (sold) {
    const name = animal.client_name ?? '—';
    const d = animal.sales_date ? `  ·  ${fmtDate(animal.sales_date)}` : '';
    return `${name}${d}`;
  }
  if (dead) {
    const reason = animal.death_reason ?? '—';
    const d = animal.death_date ? `  ·  ${fmtDate(animal.death_date)}` : '';
    return `${reason}${d}`;
  }
  const g = animal.group_name;
  if (!g) return '—';
  return /\bgrupa\b/i.test(g) ? g : `Grupa ${g}`;
}

function fmtDate(d: string | null): string {
  return d ? d.slice(0, 10) : '—';
}

function currentGestWeeks(conceptionDate: string | null): number | null {
  if (!conceptionDate) return null;
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.floor((Date.now() - new Date(conceptionDate).getTime()) / msPerWeek);
}

function expectedCalving(conceptionDate: string | null): string | null {
  if (!conceptionDate) return null;
  const d = new Date(conceptionDate);
  d.setDate(d.getDate() + 280);
  return d.toISOString().slice(0, 10);
}

function purposeLabel(purpose: string | null, lang: string): string {
  if (!purpose) return lang === 'RO' ? 'Necunoscut' : 'Unknown';
  const p = purpose.toLowerCase();
  if (p === 'reproductie' || p === 'reproduction') return lang === 'RO' ? 'Reproductie' : 'Reproduction';
  if (p === 'ingrasare'   || p === 'fattening')    return lang === 'RO' ? 'Ingrasare'   : 'Fattening';
  return purpose;
}

function purposeColor(purpose: string | null): string {
  const p = (purpose ?? '').toLowerCase();
  if (p === 'reproductie' || p === 'reproduction') return '#2E7D32';
  if (p === 'ingrasare'   || p === 'fattening')    return '#E65100';
  return '#9E9E9E';
}

function sexWritten(sex: string | null, lang: string): string {
  if (sex === 'F') return lang === 'RO' ? 'Femela' : 'Female';
  if (sex === 'M') return lang === 'RO' ? 'Mascul' : 'Male';
  return '?';
}

// ── dummy weights — placeholder until Module 07 (Weight) writes real records ──
type WEntry = { kg: number; date: string };

function dummyWeights(earTag: string, birthDate: string | null): WEntry[] {
  // deterministic per ear tag so the same animal always shows the same values
  const seed = earTag.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const today = new Date();
  const d3 = new Date(today); d3.setDate(d3.getDate() - 45 - (seed % 30));
  const d2 = new Date(d3);   d2.setDate(d2.getDate() - 62 - (seed % 20));
  const d1 = new Date(d2);   d1.setDate(d1.getDate() - 55 - (seed % 25));
  const m = monthsOld(birthDate);
  if (m < 24) {
    // target ~1.3–1.5 kg/day: diff ~90–105 kg over 62–82 days
    const base = 260 + (seed % 60);
    const d1kg = base - (90 + (seed % 15));
    const d2kg = d1kg - (88 + (seed % 12));
    return [
      { kg: base, date: d3.toISOString().slice(0, 10) },
      { kg: d1kg, date: d2.toISOString().slice(0, 10) },
      { kg: d2kg, date: d1.toISOString().slice(0, 10) },
    ];
  }
  const base = 280 + (seed % 150);
  return [
    { kg: base,                        date: d3.toISOString().slice(0, 10) },
    { kg: base - 40 - (seed % 20),    date: d2.toISOString().slice(0, 10) },
    { kg: base - 75 - (seed % 25),    date: d1.toISOString().slice(0, 10) },
  ];
}

// placeholder until Module 05 (Medical) stores real procedures
function dummyMedical(lang: string) {
  const ro = lang === 'RO';
  return {
    next: ro ? 'Deparazitare 22.10.2025 - 17.11.2025' : 'Deworming 22.10.2025 - 17.11.2025',
    past: ro
      ? ['Musca - 27.03.2025', 'Deparazitare - 17.01.2025', 'Tratament pulmonar - 17.09.2024']
      : ['Fly treatment - 27.03.2025', 'Deworming - 17.01.2025', 'Lung treatment - 17.09.2024'],
  };
}

// ── section divider ───────────────────────────────────────────────────────────

function Divider() {
  return <View style={styles.divider} />;
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

// ── main screen ───────────────────────────────────────────────────────────────

export default function AnimalDetailScreen({ navigation, route }: Props) {
  const { earTag, moduleLabel } = route.params;
  const { lang, t } = useLang();
  const ro = lang === 'RO';

  const [animal,        setAnimal]        = useState<CattleRecord | null>(null);
  const [calves,        setCalves]        = useState<CalfRecord[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [motherBirth,   setMotherBirth]   = useState<string | null>(null);
  const [motherStatus,  setMotherStatus]  = useState<string | null>(null);
  const [fatherBirth,   setFatherBirth]   = useState<string | null>(null);
  const [fatherStatus,  setFatherStatus]  = useState<string | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true); setError(null);
      fetchByTag(earTag)
        .then(async (rec) => {
          setAnimal(rec);
          const p: Promise<void>[] = [];
          if (rec.mother_ear_tag)
            p.push(fetchByTag(rec.mother_ear_tag).then(m => { setMotherBirth(m.birth_date); setMotherStatus(m.status); }).catch(() => {}));
          if (rec.father_ear_tag)
            p.push(fetchByTag(rec.father_ear_tag).then(f => { setFatherBirth(f.birth_date); setFatherStatus(f.status); }).catch(() => {}));
          if (rec.sex === 'F' && monthsOld(rec.birth_date) >= 24)
            p.push(fetchCalves(earTag).then(setCalves).catch(() => {}));
          p.push(fetchWeightHistory(earTag).then(setWeightHistory).catch(() => {}));
          await Promise.all(p);
        })
        .catch(() => setError(ro ? 'Eroare la incarcare' : 'Load error'))
        .finally(() => setLoading(false));
    }, [earTag])
  );

  const goTo = (tag: string | null) => {
    if (tag) navigation.push('AnimalDetail', { earTag: tag, moduleLabel });
  };

  const company   = animal ? getCompany(animal.company) : null;

  // ── loading / error ────────────────────────────────────────────────────────
  if (loading || error || !animal) {
    return (
      <SafeAreaView style={styles.safe}>
        <NavHeader title={t('view')} onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          {loading
            ? <ActivityIndicator size="large" color={Colors.primary} />
            : <Text style={{ color: Colors.danger }}>{error ?? 'Not found'}</Text>}
        </View>
      </SafeAreaView>
    );
  }

  // ── derived ────────────────────────────────────────────────────────────────
  const age        = ageStr(animal.birth_date, lang);
  const ageMonths  = monthsOld(animal.birth_date);
  const isCow      = animal.sex === 'F' && ageMonths >= 24;  // calves section only for mature females
  const isHeifer   = animal.sex === 'F' && ageMonths >= 12;  // gestation field only relevant from 12 months
  const showGains  = ageMonths < 24;  // spec: daily/lifetime gain shown only for growing animals
  const catColor   = company?.bg ?? '#757575';

  const medical    = dummyMedical(lang);

  // Real weight data from cattle_weights table
  const weights = weightHistory; // WeightEntry[] sorted newest-first
  const hasWeights = weights.length >= 2;
  const avgGainNum = hasWeights
    ? (() => {
        const days = Math.round(
          (new Date(weights[0].weighed_date).getTime() - new Date(weights[1].weighed_date).getTime()) / 86400000
        );
        return days > 0 ? (weights[0].weight_kg - weights[1].weight_kg) / days : 0;
      })()
    : 0;
  const avgGain = hasWeights ? avgGainNum.toFixed(2) : null;
  const daysAgo = hasWeights
    ? Math.round((Date.now() - new Date(weights[0].weighed_date).getTime()) / 86400000)
    : 0;
  const estimated = hasWeights ? Math.round(weights[0].weight_kg + avgGainNum * daysAgo) : null;
  const daysFromBirth = hasWeights && animal.birth_date
    ? Math.round((new Date(weights[0].weighed_date).getTime() - new Date(animal.birth_date).getTime()) / 86400000)
    : null;
  const lifeGain = daysFromBirth && daysFromBirth > 0 && hasWeights
    ? ((weights[0].weight_kg - 30) / daysFromBirth).toFixed(2)
    : null;
  const SALE_TARGET = 650;
  const daysTo650 = avgGainNum > 0 && estimated != null ? Math.round((SALE_TARGET - estimated) / avgGainNum) : null;
  const saleDate = daysTo650 != null && daysTo650 > 0
    ? (() => {
        const d = new Date();
        d.setDate(d.getDate() + daysTo650);
        return d.toLocaleString(ro ? 'ro-RO' : 'en-GB', { month: 'long', year: 'numeric' });
      })()
    : null;

  const calvesByYear: Record<string, CalfRecord[]> = {};
  calves.forEach(c => {
    const yr = c.birth_date ? String(new Date(c.birth_date).getFullYear()) : '?';
    (calvesByYear[yr] = calvesByYear[yr] || []).push(c);
  });
  const cowBirthYear = animal.birth_date ? new Date(animal.birth_date).getFullYear() : 9999;
  const thisYear = new Date().getFullYear();
  // only show years where the cow was already 3+ years old (minimum calving age)
  const yearsToShow = [thisYear, thisYear - 1, thisYear - 2, thisYear - 3]
    .filter(yr => yr - cowBirthYear >= 3);

  const S  = ' · ';    // line 1+2: monospace, tight
  const S2 = '  ·  '; // line 3+: more breathing room
  const borderColor = catColor;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>

      <NavHeader title={t('view')} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ONE bordered container — company color wraps everything */}
        <View style={[styles.mainCard, { borderColor }]}>

          <View style={[styles.companyBar, { backgroundColor: catColor }]}>
            <Text style={[styles.companyLabel, { color: company?.text ?? '#fff' }]}>{categoryLabel(animal.sex, ageMonths, lang, animal.breeding ?? false, animal.is_bull ?? false)}</Text>
          </View>

          <View style={styles.body}>

            {/* ── Info lines ── */}
            <Text style={styles.line1}>
              {animal.ear_tag}{S}{company?.short ?? (animal.company ?? '')}
              {animal.status
                ? <Text style={{ color: statusClr(animal.status), fontWeight: '700' }}>{S}{statusLbl(animal.status, lang)}</Text>
                : null}
            </Text>
            <Text style={styles.line2}>{groupText(animal, lang)}</Text>
            <Text style={styles.line34}>
              {ro ? 'Nastere' : 'Birth'}: {fmtDate(animal.birth_date)}{S2}
              {ro ? 'Varsta' : 'Age'}: {age}{S2}
              {ro ? 'Culoare' : 'Color'}: <Text style={{ color: animal.color?.toUpperCase() === 'BLACK' ? '#212121' : '#C62828', fontWeight: '700' }}>{getColorName(animal.color, lang)}</Text>
            </Text>
            <Text style={styles.line34}>
              {'BIDAA: '}{yesNo(animal.bidaa, lang)}{S2}{'Pedigree: '}{pedigreeLabel(animal.pedigree, lang)}
              {isHeifer ? (
                <Text>
                  {S2}{ro ? 'Gestatie' : 'Gestation'}: {
                    animal.gestation
                      ? (() => {
                          const wks = currentGestWeeks(animal.conception_date);
                          return wks != null
                            ? `${wks} ${ro ? 'sapt' : 'wk'}`
                            : animal.gestation_weeks != null
                              ? `${animal.gestation_weeks} ${ro ? 'sapt' : 'wk'}`
                              : (ro ? 'Necunoscut' : 'Unknown');
                        })()
                      : (ro ? 'Nu' : 'No')
                  }
                  {animal.gestation && animal.conception_date
                    ? `  ·  ${ro ? 'Nastere est.' : 'Est. calving'}: ${fmtDate(expectedCalving(animal.conception_date))}`
                    : null}
                </Text>
              ) : null}
              {animal.sex === 'M' && animal.neutered != null
                ? <Text>{S2}{ro ? 'Castrat' : 'Neutered'}: {yesNo(animal.neutered, lang)}</Text>
                : null}
            </Text>

            <Divider />

            {/* ── Purpose (replaces Status section) ── */}
            <SectionTitle title={ro ? 'Scop' : 'Purpose'} />
            <Text style={[styles.line34, { color: purposeColor(animal.purpose), fontWeight: '700' }]}>
              {purposeLabel(animal.purpose, lang)}
            </Text>

            <Divider />

            {/* ── Parents ── */}
            <SectionTitle title={ro ? 'Parinti' : 'Parents'} />
            {[
              { label: ro ? 'Mama' : 'Mother', tag: animal.mother_ear_tag, birth: motherBirth, status: motherStatus, aiCode: null as string | null },
              { label: ro ? 'Tata' : 'Father', tag: animal.father_ear_tag, birth: fatherBirth, status: fatherStatus, aiCode: animal.father_ai_code },
            ].map(({ label, tag, birth, status, aiCode }) => (
              <TouchableOpacity key={label} onPress={() => goTo(tag)} disabled={!tag} style={styles.parentRow}>
                <Text style={styles.parentLabel}>{label}</Text>
                <View style={styles.parentLines}>
                  <Text style={tag ? styles.link : styles.muted}>{tag ?? (ro ? 'Necunoscut' : 'Unknown')}</Text>
                  {aiCode && (
                    <Text style={styles.muted}>{ro ? 'Cod' : 'Code'}: {aiCode}</Text>
                  )}
                  {birth && (
                    <Text style={styles.muted}>
                      {`${ro ? 'Nastere' : 'Birth'}: ${fmtDate(birth)}`}
                      {status ? <Text style={{ color: statusClr(status), fontWeight: '700' }}>{`  ·  ${statusLbl(status, lang)}`}</Text> : null}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {/* ── Calves (cows only) ── */}
            {isCow && (
              <>
                <Divider />
                <SectionTitle title={ro ? 'Vitei' : 'Calves'} />
                {yearsToShow.map(yr => {
                  const yrStr = String(yr);
                  const list = calvesByYear[yrStr];
                  return (
                    <View key={yr}>
                      <Text style={styles.calfYearLabel}>{yr}</Text>
                      {list && list.length > 0
                        ? list.map(c => (
                            <TouchableOpacity key={c.ear_tag} onPress={() => goTo(c.ear_tag)} style={styles.calfRow}>
                              <Text style={styles.parentLabel}>{sexWritten(c.sex, lang)}</Text>
                              <View style={styles.parentLines}>
                                <Text style={styles.link}>{c.ear_tag}</Text>
                                <Text style={styles.muted}>
                                  {fmtDate(c.birth_date)}
                                  {c.status
                                    ? <Text style={{ color: statusClr(c.status) }}>{`  ·  ${statusLbl(c.status, lang)}`}</Text>
                                    : null}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))
                        : <Text style={styles.muted}>{ro ? 'Neexistent' : 'Not existent'}</Text>
                      }
                    </View>
                  );
                })}
              </>
            )}

            <Divider />

            {/* ── Weight ── */}
            <SectionTitle title={ro ? 'Cantariri' : 'Weight'} />
            {weights.length === 0
              ? <Text style={styles.muted}>{ro ? 'Nicio cantarire inregistrata' : 'No weighings recorded'}</Text>
              : weights.slice(0, 5).map((w, i) => (
                  <Text key={i} style={styles.line34}>{w.weight_kg} kg  ·  {w.weighed_date}</Text>
                ))
            }
            {showGains && hasWeights && (
              <>
                <Text style={styles.line34}>
                  {'---- '}{ro ? 'Spor' : 'Avg gain'}{'  ---  '}{avgGain} kg/{ro ? 'zi' : 'day'}
                </Text>
                {lifeGain && (
                  <Text style={styles.line34}>
                    {'---- '}{ro ? 'Spor pe toata perioada vietii' : 'Lifetime gain'}{'  ---  '}{lifeGain} kg/{ro ? 'zi' : 'day'}
                  </Text>
                )}
                {estimated != null && (
                  <Text style={styles.line34}>
                    {ro ? 'Estimare greutate la zi' : 'Est. weight today'}: {estimated} kg
                  </Text>
                )}
                {saleDate && (
                  <Text style={styles.line34}>
                    {ro ? 'Posibila vanzare din' : 'Possible sale from'} {saleDate}
                  </Text>
                )}
              </>
            )}
            <Divider />

            {/* ── Medical ── */}
            <SectionTitle title={ro ? 'Proceduri' : 'Medical'} />
            <Text style={styles.nextProcLbl}>{ro ? 'Urmatoarea procedura:' : 'Next procedure:'}</Text>
            <Text style={styles.line34}>{medical.next}</Text>
            <View style={{ height: 4 }} />
            {medical.past.map((p, i) => (
              <Text key={i} style={styles.line34}>{p}</Text>
            ))}

            <Divider />

            {/* ── Comment ── */}
            <SectionTitle title={ro ? 'Comentariu' : 'Comment'} />
            <Text style={styles.line34}>{animal.comment || '—'}</Text>

          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.background },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:      { padding: 10 },

  mainCard:    {
    borderWidth: 2, borderRadius: 8, overflow: 'hidden',
    backgroundColor: Colors.card,
  },
  companyBar:  { paddingHorizontal: 12, paddingVertical: 5 },
  companyLabel:{ fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  body:        { padding: 12, gap: 4 },

  line1:       { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  line2:       { fontSize: 13, fontWeight: '700', color: Colors.textDark, fontFamily: 'monospace' },
  line34:      { fontSize: 13, color: Colors.textMuted },

  statusValue: { fontSize: 18, fontWeight: '800' },

  sectionTitle:{ fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1.2,
                 textTransform: 'uppercase', marginTop: 2, marginBottom: 2 },

  mutedLbl:    { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  muted:       { fontSize: 13, color: Colors.textMuted },
  link:        { fontSize: 13, color: Colors.primary, fontWeight: '700', textDecorationLine: 'underline' },

  parentRow:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  parentLabel: { width: 60, fontSize: 13, color: Colors.textMuted, fontWeight: '600', paddingTop: 1 },
  parentLines: { flex: 1, gap: 2 },

  calfRow:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  calfYearLabel:{ fontSize: 11, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1,
                  textTransform: 'uppercase', marginTop: 4, marginBottom: 2 },

  divider:     { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  nextProcLbl: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  dummyNote:   { fontSize: 10, color: Colors.textMuted, fontStyle: 'italic', marginTop: 2 },
});
