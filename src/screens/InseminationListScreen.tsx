import React, { useState, useEffect } from 'react';
import {
  Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { fetchPreparedList, fetchInseminatedList, InseminationAnimalInfo } from '../api/client';
import NavHeader from '../components/NavHeader';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'InseminationList'>;
  route: RouteProp<RootStackParamList, 'InseminationList'>;
};

function daysSince(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  return `${diff}d`;
}

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return dateStr.slice(0, 10); // YYYY-MM-DD
}


export default function InseminationListScreen({ navigation, route }: Props) {
  const { listType } = route.params;
  const { lang } = useLang();
  const ro = lang === 'RO';

  const [animals, setAnimals] = useState<InseminationAnimalInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const title = listType === 'prepared'
    ? (ro ? 'Pregatite' : 'Prepared')
    : (ro ? 'Insamantate' : 'Inseminated');

  useEffect(() => {
    const load = listType === 'prepared' ? fetchPreparedList : fetchInseminatedList;
    load()
      .then(setAnimals)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [listType]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <NavHeader title={title} onBack={() => navigation.goBack()} />
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 30 }} />
      </SafeAreaView>
    );
  }

  const wTag  = animals.length > 0 ? Math.max(...animals.map(a => a.ear_tag.length)) : 0;
  const wBull = animals.length > 0 ? Math.max(...animals.map(a => (a.bull_name ?? '—').length)) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <NavHeader title={`${title} (${animals.length})`} onBack={() => navigation.goBack()} />

      {animals.length === 0
        ? <Text style={styles.empty}>{ro ? 'Nicio vaca' : 'No animals'}</Text>
        : (
          <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent}>
            {animals.map((item, idx) => {
              const num  = String(idx + 1).padStart(2, '0') + '.';
              const tag  = item.ear_tag.padEnd(wTag);
              const bull = (item.bull_name ?? '—').padEnd(wBull);

              const line = listType === 'prepared'
                ? `${num} ${tag} · ${fmtDate(item.prepared_date)} · ${daysSince(item.prepared_date)}`
                : `${num} ${tag} · ${bull} · ${fmtDate(item.inseminated_date)}`;

              return (
                <Text key={item.ear_tag} style={styles.listRow}>
                  {line}
                </Text>
              );
            })}
          </ScrollView>
        )
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.background },
  listScroll:  { flex: 1 },
  listContent: { padding: 12 },
  listRow:     { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, fontSize: 13, color: Colors.textDark, fontFamily: 'monospace' },
  empty:       { textAlign: 'center', color: Colors.textMuted, fontStyle: 'italic', marginTop: 40 },
});
