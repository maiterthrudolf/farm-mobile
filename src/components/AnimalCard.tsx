import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import { getCompany, getColorName, categoryColor, categoryLabel } from '../theme/companies';

export interface AnimalCardData {
  ear_tag: string;
  sex?: string | null;
  birth_date?: string | null;
  color?: string | null;
  company?: string | null;
  bidaa?: boolean | null;
  pedigree?: string | null;
  neutered?: boolean | null;
  status?: string | null;
  group_name?: string | null;
  gestation?: boolean | null;
  gestation_weeks?: number | null;
  conception_date?: string | null;
  breeding?: boolean | null;
  is_bull?: boolean | null;
}

interface Props {
  data: AnimalCardData;
  lang: string;
  onPress: () => void;
  showCompany?: boolean;     // default true
  showGestation?: boolean;   // default false
  showCategoryBar?: boolean; // default true
}

// ── helpers ──────────────────────────────────────────────────────────────────

function monthsOld(birthDate: string | null | undefined): number {
  if (!birthDate) return 0;
  const b = new Date(birthDate);
  const n = new Date();
  return (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
}

function calcAge(birthDate: string | null | undefined, lang: string): string {
  if (!birthDate) return '?';
  const mo = lang === 'RO' ? 'L' : 'M';
  const yr = lang === 'RO' ? 'A' : 'Y';
  const total = monthsOld(birthDate);
  const y = Math.floor(total / 12); const r = total % 12;
  if (y === 0) return `${r}${mo}`;
  if (r === 0) return `${y}${yr}`;
  return `${y}${yr} ${r}${mo}`;
}

function yesNo(val: boolean | null | undefined, lang: string): string {
  if (val == null) return '-';
  return val ? (lang === 'RO' ? 'Da' : 'Yes') : (lang === 'RO' ? 'Nu' : 'No');
}

function statusLbl(s: string | null | undefined, lang: string): string {
  const u = (s ?? '').toUpperCase();
  const ro = lang === 'RO';
  if (u === 'VIU'    || u === 'ALIVE') return ro ? 'VIU'    : 'ALIVE';
  if (u === 'VANDUT' || u === 'SOLD')  return ro ? 'VANDUT' : 'SOLD';
  if (u === 'MORT'   || u === 'DEAD')  return ro ? 'MORT'   : 'DEAD';
  return s ?? '';
}

function statusClr(s: string | null | undefined): string {
  const u = (s ?? '').toUpperCase();
  if (u === 'VIU'    || u === 'ALIVE') return '#2E7D32';
  if (u === 'VANDUT' || u === 'SOLD')  return '#1565C0';
  return '#C62828';
}

const S  = ' · ';
const S2 = '  ·  ';

// ── component ─────────────────────────────────────────────────────────────────

export default function AnimalCard({ data, lang, onPress, showCompany = true, showGestation = false, showCategoryBar = true }: Props) {
  const ro  = lang === 'RO';
  const mo  = monthsOld(data.birth_date);
  const catLbl   = categoryLabel(data.sex ?? null, mo, lang, data.breeding ?? false, data.is_bull ?? false);
  const co       = getCompany(data.company ?? null);
  const barBg    = co?.bg  ?? '#757575';
  const barTxt   = co?.text ?? '#fff';

  const rawGroup = data.group_name ?? '-';
  const group    = rawGroup === '-'
    ? '-'
    : /\bgrupa\b/i.test(rawGroup) ? rawGroup : `Grupa ${rawGroup}`;

  // Line 1: ear_tag (+ company if showCompany)
  const line1 = showCompany && co
    ? `${data.ear_tag}${S}${co.short}`
    : data.ear_tag;

  // Line 2: group
  const line2 = group;

  // Line 3: Birth · Age · Color · [Status]
  const colorName = getColorName(data.color ?? null, lang as any);
  const line3base = data.birth_date
    ? `${data.birth_date.slice(0, 10)}${S}${colorName}${S}${calcAge(data.birth_date, lang)}`
    : '—';

  // Line 4: BIDAA · Pedigree · [Gestation] · [Neutered]
  const gestLbl = ro ? 'Gestatie' : 'Gestation';
  let gestStr = ro ? 'Nu' : 'No';
  if (data.gestation) {
    const dynamicWks = data.conception_date
      ? Math.floor((Date.now() - new Date(data.conception_date).getTime()) / (7 * 24 * 60 * 60 * 1000))
      : null;
    const wks = dynamicWks ?? data.gestation_weeks;
    gestStr = wks != null ? `${wks} ${ro ? 'sapt' : 'wk'}` : (ro ? 'Da' : 'Yes');
  }
  const line4parts = [
    `BIDAA: ${yesNo(data.bidaa, lang)}`,
    `Pedigree: ${data.pedigree ?? '—'}`,
  ];
  if (showGestation) line4parts.push(`${gestLbl}: ${gestStr}`);
  if (data.sex === 'M') line4parts.push(`Neutered: ${yesNo(data.neutered, lang)}`);
  const line4 = line4parts.join(S2);

  return (
    <TouchableOpacity style={[styles.card, { borderColor: barBg }]} onPress={onPress} activeOpacity={0.75}>
      {showCategoryBar && (
        <View style={[styles.bar, { backgroundColor: barBg }]}>
          <Text style={[styles.barTxt, { color: barTxt }]}>{catLbl}</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.line1}>{line1}</Text>
        <Text style={styles.line1}>{line2}</Text>
        <Text style={styles.line34}>
          {line3base}
          {data.status
            ? <Text style={{ color: statusClr(data.status), fontWeight: '700' }}>{S2}{statusLbl(data.status, lang)}</Text>
            : null}
        </Text>
        <Text style={styles.line34}>{line4}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:   { backgroundColor: Colors.card, borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  bar:    { paddingHorizontal: 12, paddingVertical: 4 },
  barTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  body:   { padding: 12, gap: 3 },
  line1:  { fontSize: 13, fontWeight: '700', color: Colors.textDark, fontFamily: 'monospace' },
  line34: { fontSize: 13, color: Colors.textMuted },
});
