import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { fetchSaleListAnimals, removeAnimalFromList, SaleListAnimal } from '../api/client';
import ErrorModal from '../components/ErrorModal';
import NavHeader from '../components/NavHeader';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SaleList'>;
  route: RouteProp<RootStackParamList, 'SaleList'>;
};

function calcAge(birthDate: string | null | undefined, ro: boolean): string {
  if (!birthDate) return '—';
  const b = new Date(birthDate);
  const n = new Date();
  const totalMonths = (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  const yr = ro ? 'A' : 'Y';
  const mo = ro ? 'L' : 'M';
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
  const entry = map[color];
  if (entry) return ro ? entry[0] : entry[1];
  return color.slice(0, 3);
}

function sexLabel(sex: string | null | undefined): string {
  if (sex === 'F') return 'Fem';
  if (sex === 'M') return 'Mal';
  return '—';
}

export default function SaleListScreen({ navigation, route }: Props) {
  const { listId, listName } = route.params;
  const { lang } = useLang();
  const ro = lang === 'RO';

  const [animals,    setAnimals]    = useState<SaleListAnimal[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [checked,    setChecked]    = useState<Set<string>>(new Set());
  const [deleting,   setDeleting]   = useState(false);

  const reload = () => {
    setLoading(true);
    fetchSaleListAnimals(listId)
      .then(setAnimals)
      .catch(() => setError(ro ? 'Eroare la incarcare' : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useFocusEffect(useCallback(() => {
    reload();
    setDeleteMode(false);
    setChecked(new Set());
  }, [listId]));

  const allChecked = animals.length > 0 && checked.size === animals.length;

  const toggleAll = () => {
    if (allChecked) {
      setChecked(new Set());
    } else {
      setChecked(new Set(animals.map(a => a.ear_tag)));
    }
  };

  const toggleOne = (tag: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const handleDeleteChecked = async () => {
    setDeleting(true);
    try {
      for (const tag of Array.from(checked)) {
        await removeAnimalFromList(listId, tag);
      }
      setChecked(new Set());
      setDeleteMode(false);
      reload();
    } catch (e: any) {
      setError(e?.message ?? (ro ? 'Eroare' : 'Error'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />

      <NavHeader
        title={listName}
        onBack={() => {
          if (deleteMode) { setDeleteMode(false); setChecked(new Set()); }
          else navigation.goBack();
        }}
        right={!deleteMode
          ? <TouchableOpacity style={styles.deleteModeBtn} onPress={() => setDeleteMode(true)}>
              <Text style={styles.deleteModeBtnTxt}>{ro ? 'Sterge' : 'Delete'}</Text>
            </TouchableOpacity>
          : <TouchableOpacity style={styles.checkAllBtn} onPress={toggleAll}>
              <Text style={styles.checkAllTxt}>{allChecked ? '☑ ' : '☐ '}{ro ? 'Toate' : 'All'}</Text>
            </TouchableOpacity>
        }
      />

      {loading
        ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 30 }} />
        : animals.length === 0
          ? <Text style={styles.empty}>{ro ? 'Lista este goala' : 'List is empty'}</Text>
          : (() => {
            // Compute column widths from data for alignment
            const rows = animals.map((item, idx) => ({
              item,
              num:  String(idx + 1).padStart(2, '0') + '.',
              tag:  item.ear_tag,
              sex:  sexLabel(item.sex),
              age:  calcAge(item.birth_date, ro),
              col:  colorLabel(item.color, ro),
              wkg:  item.weight_kg != null ? `${item.weight_kg}kg` : '',
            }));
            const wTag = Math.max(...rows.map(r => r.tag.length));
            const wAge = Math.max(...rows.map(r => r.age.length));
            const wCol = Math.max(...rows.map(r => r.col.length));

            return (
              <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent}>
                {rows.map(({ item, num, tag, sex, age, col, wkg }) => {
                  const isChecked = checked.has(item.ear_tag);
                  const isFemale  = item.sex === 'F';
                  const sexBg     = isChecked ? '#FFEBEE' : isFemale ? '#FFF3E0' : '#EFEBE9';
                  const line = `${num} ${tag.padEnd(wTag)} · ${sex} · ${age.padEnd(wAge)} · ${col.padEnd(wCol)}${wkg ? ' · ' + wkg : ''}`;
                  return (
                    <TouchableOpacity
                      key={item.ear_tag}
                      style={[styles.listRow, { backgroundColor: sexBg }]}
                      onPress={() => deleteMode && toggleOne(item.ear_tag)}
                      activeOpacity={deleteMode ? 0.6 : 1}
                    >
                      {deleteMode
                        ? (
                          <View style={styles.deleteModeRow}>
                            <Text style={styles.checkbox}>{isChecked ? '☑' : '☐'}</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.listRowTxt, isChecked && styles.listRowTxtChecked]}>
                                {num} {tag}
                              </Text>
                              <Text style={[styles.listRowSub, isChecked && styles.listRowTxtChecked]}>
                                {sex} · {age} · {col}{wkg ? ' · ' + wkg : ''}
                              </Text>
                            </View>
                          </View>
                        )
                        : (
                          <Text style={[styles.listRowTxt, isChecked && styles.listRowTxtChecked]}>
                            {line}
                          </Text>
                        )
                      }
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            );
          })()
      }

      {deleteMode && (
        <View style={styles.deleteBar}>
          <TouchableOpacity
            style={[styles.cancelBtn]}
            onPress={() => { setDeleteMode(false); setChecked(new Set()); }}
          >
            <Text style={styles.cancelBtnTxt}>{ro ? 'Renunta' : 'Cancel'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteCheckedBtn, (checked.size === 0 || deleting) && styles.btnDisabled]}
            onPress={handleDeleteChecked}
            disabled={checked.size === 0 || deleting}
          >
            {deleting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.deleteCheckedBtnTxt}>
                  {ro ? `Sterge (${checked.size})` : `Delete (${checked.size})`}
                </Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: Colors.background },
  deleteModeBtn:      { borderWidth: 1.5, borderColor: '#ffaaaa', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  deleteModeBtnTxt:   { color: '#ffaaaa', fontSize: 13, fontWeight: '700' },
  checkAllBtn:        { paddingHorizontal: 6 },
  checkAllTxt:        { color: Colors.textLight, fontSize: 13, fontWeight: '700' },
  listScroll:         { flex: 1 },
  listContent:        { padding: 12 },
  listRow:            { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10 },
  deleteModeRow:      { flexDirection: 'row', alignItems: 'flex-start', flex: 1, gap: 8 },
  listRowSub:         { fontSize: 12, color: Colors.textMuted, fontFamily: 'monospace', marginTop: 2 },
  listRowChecked:     { backgroundColor: '#FFEBEE' },
  checkbox:           { fontSize: 18, color: '#C62828', width: 24 },
  listRowTxt:         { fontSize: 13, color: Colors.textDark, fontFamily: 'monospace', flex: 1 },
  listRowTxtChecked:  { color: '#C62828' },
  empty:              { textAlign: 'center', color: Colors.textMuted, fontStyle: 'italic', marginTop: 40 },
  deleteBar:          { flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  cancelBtn:          { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  cancelBtnTxt:       { color: Colors.textMuted, fontSize: 16, fontWeight: '600' },
  deleteCheckedBtn:   { flex: 2, backgroundColor: '#C62828', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  deleteCheckedBtnTxt:{ color: '#fff', fontSize: 16, fontWeight: '700' },
  btnDisabled:        { opacity: 0.4 },
});
