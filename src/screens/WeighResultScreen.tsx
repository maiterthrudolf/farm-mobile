import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { getCompany, categoryColor, categoryLabel } from '../theme/companies';
import AnimalCard from '../components/AnimalCard';
import NavHeader from '../components/NavHeader';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { fetchWeightHistory, WeightEntry } from '../api/client';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'WeighResult'>;
  route: RouteProp<RootStackParamList, 'WeighResult'>;
};

function monthsOld(birthDate: string | null | undefined): number {
  if (!birthDate) return 0;
  const b = new Date(birthDate);
  const n = new Date();
  return (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
}

function ageStr(birthDate: string | null | undefined, lang: string): string {
  const mo = lang === 'RO' ? 'L' : 'M';
  const yr = lang === 'RO' ? 'A' : 'Y';
  const total = monthsOld(birthDate);
  const y = Math.floor(total / 12); const r = total % 12;
  if (y === 0) return `${r} ${mo}`;
  if (r === 0) return `${y} ${yr}`;
  return `${y} ${yr} ${r} ${mo}`;
}

const SALE_TARGET = 650;

export default function WeighResultScreen({ navigation, route }: Props) {
  const { animal } = route.params;
  const { lang, t } = useLang();
  const ro = lang === 'RO';

  const company      = getCompany(animal.company);
  const companyShort = company?.short ?? animal.company ?? null;
  const companyBg    = company?.bg ?? Colors.primaryDark;
  const companyText  = company?.text ?? '#fff';

  const [history, setHistory] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeightHistory(animal.ear_tag)
      .then(h => { setHistory(h); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const mo = monthsOld(animal.birth_date);
  const showGains = mo < 24;

  // Stats from weight history (sorted newest-first)
  const hasTwo = history.length >= 2;
  const avgGainNum = hasTwo
    ? (() => {
        const days = Math.round(
          (new Date(history[0].weighed_date).getTime() - new Date(history[1].weighed_date).getTime()) / 86400000
        );
        return days > 0 ? (history[0].weight_kg - history[1].weight_kg) / days : 0;
      })()
    : 0;

  const daysAgo = history.length
    ? Math.round((Date.now() - new Date(history[0].weighed_date).getTime()) / 86400000)
    : 0;
  const estimated = history.length
    ? Math.round(history[0].weight_kg + avgGainNum * daysAgo)
    : null;

  const daysFromBirth = history.length && animal.birth_date
    ? Math.round((new Date(history[0].weighed_date).getTime() - new Date(animal.birth_date).getTime()) / 86400000)
    : null;
  const lifeGain = daysFromBirth && daysFromBirth > 0 && history.length
    ? ((history[0].weight_kg - 30) / daysFromBirth).toFixed(2)
    : null;

  const daysTo650 = avgGainNum > 0 && estimated != null
    ? Math.round((SALE_TARGET - estimated) / avgGainNum)
    : null;
  const saleDate = daysTo650 != null && daysTo650 > 0
    ? (() => {
        const d = new Date();
        d.setDate(d.getDate() + daysTo650);
        return d.toLocaleString(ro ? 'ro-RO' : 'en-GB', { month: 'long', year: 'numeric' });
      })()
    : null;

  const catColor = categoryColor(animal.sex, mo, (animal as any).breeding ?? false, (animal as any).is_bull ?? false);
  const catLbl   = categoryLabel(animal.sex, mo, lang, (animal as any).breeding ?? false, (animal as any).is_bull ?? false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const lastWasToday = history.length > 0 && history[0].weighed_date === todayStr;
  const showEstimate = estimated != null && !lastWasToday;
  const displayed = history.slice(0, 4); // today + max 3 previous

  return (
    <SafeAreaView style={styles.safe}>
      <NavHeader
        title={t('weight')}
        right={companyShort
          ? <View style={[styles.companyBadge, { backgroundColor: companyBg }]}>
              <Text style={[styles.companyBadgeTxt, { color: companyText }]}>{companyShort}</Text>
            </View>
          : undefined
        }
      />

      <View style={styles.content}>

        <AnimalCard data={animal} lang={lang} onPress={() => {}} showCompany={true} showCategoryBar={true} />

        {loading
          ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
          : (
            <View style={[styles.card, { borderColor: catColor }]}>
              <View style={[styles.cardBar, { backgroundColor: catColor }]}>
                <Text style={styles.cardBarTxt}>{catLbl}</Text>
              </View>
              <View style={styles.cardBody}>

                <Text style={styles.sectionLabel}>{ro ? 'Cantariri' : 'Weighings'}</Text>
                {displayed.map((w, i) => (
                  <Text key={i} style={[styles.row, i === 0 && styles.rowNew]}>
                    {w.weight_kg} kg  ·  {w.weighed_date}
                    {i === 0 ? <Text style={styles.todayTag}>  ← {ro ? 'azi' : 'today'}</Text> : null}
                  </Text>
                ))}

                {showGains && hasTwo && (
                  <>
                    <View style={styles.divider} />
                    <Text style={styles.sectionLabel}>{ro ? 'Spor & Estimari' : 'Gains & Estimates'}</Text>
                    <Text style={styles.row}>
                      {ro ? 'Spor mediu' : 'Avg gain'}{': '}
                      <Text style={styles.highlight}>{avgGainNum.toFixed(2)} kg/{ro ? 'zi' : 'day'}</Text>
                    </Text>
                    {lifeGain && (
                      <Text style={styles.row}>
                        {ro ? 'Spor viata' : 'Lifetime gain'}{': '}
                        <Text style={styles.highlight}>{lifeGain} kg/{ro ? 'zi' : 'day'}</Text>
                      </Text>
                    )}
                    {showEstimate && (
                      <Text style={styles.row}>
                        {ro ? 'Estimare azi' : 'Est. today'}{': '}
                        <Text style={styles.highlight}>{estimated} kg</Text>
                      </Text>
                    )}
                    {saleDate && (
                      <Text style={styles.row}>
                        {ro ? 'Posibila vanzare' : 'Possible sale'}{': '}
                        <Text style={styles.highlight}>{saleDate}</Text>
                      </Text>
                    )}
                    {daysTo650 != null && daysTo650 > 0 && (
                      <Text style={styles.row}>
                        {daysTo650} {ro ? `zile pana la ${SALE_TARGET} kg` : `days to ${SALE_TARGET} kg`}
                      </Text>
                    )}
                  </>
                )}

              </View>
            </View>
          )
        }

        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => navigation.navigate('WeighScan')}
          activeOpacity={0.8}
        >
          <Text style={styles.nextBtnTxt}>{ro ? 'Urmatorul Animal' : 'Next Animal'}</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Colors.background },
  companyBadge:    { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, minWidth: 70, alignItems: 'center' },
  companyBadgeTxt: { fontSize: 13, fontWeight: '800' },
  content:         { flex: 1, padding: 12, gap: 12 },
  card:            { borderWidth: 2, borderRadius: 8, overflow: 'hidden', backgroundColor: Colors.card },
  cardBar:         { paddingHorizontal: 12, paddingVertical: 5 },
  cardBarTxt:      { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: '#fff' },
  cardBody:        { padding: 14, gap: 5 },
  sectionLabel:    { fontSize: 11, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 },
  row:             { fontSize: 14, color: Colors.textMuted },
  rowNew:          { fontSize: 15, color: Colors.textDark, fontWeight: '700' },
  todayTag:        { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  highlight:       { color: Colors.primaryDark, fontWeight: '700' },
  divider:         { height: 1, backgroundColor: Colors.border, marginVertical: 6 },
  nextBtn:         { backgroundColor: '#2E7D32', borderRadius: 8, paddingVertical: 20, alignItems: 'center' },
  nextBtnTxt:      { color: '#fff', fontSize: 18, fontWeight: '800' },
});
