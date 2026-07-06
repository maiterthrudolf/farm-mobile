import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { fetchGroupList, removeAnimalFromGroup, GroupAnimal } from '../api/client';
import NavHeader from '../components/NavHeader';
import ConfirmModal from '../components/ConfirmModal';
import ErrorModal from '../components/ErrorModal';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'GroupAnimalList'>;
  route: RouteProp<RootStackParamList, 'GroupAnimalList'>;
};

function calcAge(birthDate: string | null | undefined, ro: boolean): string {
  if (!birthDate) return '—';
  const b = new Date(birthDate);
  const n = new Date();
  const totalMonths = (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  const yr = ro ? 'A' : 'Y'; const mo = ro ? 'L' : 'M';
  if (y === 0) return `${m}${mo}`;
  if (y >= 10)  return `${y}${yr}`;
  if (m === 0)  return `${y}${yr}`;
  return `${y}${yr}${m}${mo}`;
}

function colorLabel(color: string | null | undefined, ro: boolean): string {
  if (!color) return '—';
  const map: Record<string, [string, string]> = {
    'N': ['Neg', 'Bla'], 'B': ['Neg', 'Bla'], 'BLACK': ['Neg', 'Bla'], 'Black': ['Neg', 'Bla'],
    'R': ['Ros', 'Red'], 'RED': ['Ros', 'Red'], 'Red': ['Ros', 'Red'],
  };
  const e = map[color]; if (e) return ro ? e[0] : e[1];
  return color.slice(0, 3);
}

function sexLabel(sex: string | null | undefined): string {
  if (sex === 'F') return 'Fem';
  if (sex === 'M') return 'Mal';
  return '—';
}

export default function GroupAnimalListScreen({ navigation, route }: Props) {
  const { groupName, groupColor } = route.params;
  const { lang } = useLang();
  const ro = lang === 'RO';
  const isGenerala = groupName === 'Generala';

  const [animals, setAnimals]       = useState<GroupAnimal[]>([]);
  const [loading, setLoading]       = useState(true);
  const [confirmAnimal, setConfirm] = useState<GroupAnimal | null>(null);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    fetchGroupList(groupName).then(setAnimals).catch(() => {}).finally(() => setLoading(false));
  }, [groupName]);

  const handleRemove = async () => {
    if (!confirmAnimal) return;
    const tag = confirmAnimal.ear_tag;
    setConfirm(null);
    try {
      await removeAnimalFromGroup(tag);
      setAnimals(prev => prev.filter(a => a.ear_tag !== tag));
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    }
  };

  const wTag = animals.length > 0 ? Math.max(...animals.map(a => a.ear_tag.length)) : 0;
  const wAge = animals.length > 0 ? Math.max(...animals.map(a => calcAge(a.birth_date, ro).length)) : 0;
  const wCol = animals.length > 0 ? Math.max(...animals.map(a => colorLabel(a.color, ro).length)) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />
      <ConfirmModal
        message={confirmAnimal
          ? (ro ? `Muta ${confirmAnimal.ear_tag} in Generala?` : `Move ${confirmAnimal.ear_tag} to Generala?`)
          : null}
        labelYes={ro ? 'Muta' : 'Move'}
        labelNo={ro ? 'Anuleaza' : 'Cancel'}
        onYes={handleRemove}
        onNo={() => setConfirm(null)}
      />

      <NavHeader title={`${groupName} (${animals.length})`} onBack={() => navigation.goBack()} />

      {loading
        ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 30 }} />
        : animals.length === 0
          ? <Text style={styles.empty}>{ro ? 'Niciun animal' : 'No animals'}</Text>
          : (
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
              {animals.map((item, idx) => {
                const num = String(idx + 1).padStart(2, '0') + '.';
                const tag = item.ear_tag.padEnd(wTag);
                const sex = sexLabel(item.sex);
                const age = calcAge(item.birth_date, ro).padEnd(wAge);
                const col = colorLabel(item.color, ro).padEnd(wCol);
                const bg  = item.category === 'taur' ? '#EFEBE9' : item.sex === 'F' ? '#FFF3E0' : '#EFEBE9';
                return (
                  <View key={item.ear_tag} style={[styles.rowWrap, { backgroundColor: bg }]}>
                    <Text style={styles.rowText}>
                      {`${num} ${tag} · ${sex} · ${age} · ${col}`}
                    </Text>
                    {!isGenerala && (
                      <TouchableOpacity
                        style={styles.xBtn}
                        onPress={() => setConfirm(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.xTxt}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  scroll:  { flex: 1 },
  content: { padding: 12 },
  rowWrap: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowText: { flex: 1, paddingVertical: 8, fontSize: 13, color: Colors.textDark, fontFamily: 'monospace' },
  xBtn:    { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#C62828', borderRadius: 6, marginVertical: 4, marginRight: 2 },
  xTxt:    { color: '#fff', fontSize: 13, fontWeight: '900' },
  empty:   { textAlign: 'center', color: Colors.textMuted, fontStyle: 'italic', marginTop: 40 },
});
