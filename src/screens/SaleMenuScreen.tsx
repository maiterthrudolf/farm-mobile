import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { fetchSaleLists, createSaleList, SaleList } from '../api/client';
import ErrorModal from '../components/ErrorModal';
import NavHeader from '../components/NavHeader';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'SaleMenu'> };

export default function SaleMenuScreen({ navigation }: Props) {
  const { lang, t } = useLang();
  const ro = lang === 'RO';

  const [name,    setName]    = useState('');
  const [lists,   setLists]   = useState<SaleList[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating,setCreating]= useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchSaleLists().then(setLists).catch(() => {}).finally(() => setLoading(false));
  }, []));

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError(ro ? 'Introdu numele clientului' : 'Enter client name'); return; }
    setCreating(true);
    try {
      const list = await createSaleList(trimmed);
      setName('');
      navigation.navigate('SaleScan', { listId: list.id, listName: list.name });
    } catch (e: any) {
      setError(e?.message ?? (ro ? 'Eroare' : 'Error'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />
      <NavHeader title={t('sales')} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>

        <Text style={styles.sectionLabel}>{ro ? 'Creaza Lista noua. Introdu numele clientului:' : 'Create new list. Enter client name:'}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={v => setName(v.slice(0, 30))}
          placeholder={ro ? 'Nume client (max 30)' : 'Client name (max 30)'}
          placeholderTextColor={Colors.border}
          maxLength={30}
          returnKeyType="done"
          onSubmitEditing={handleCreate}
        />
        <Text style={styles.charCount}>{name.length}/30</Text>

        <TouchableOpacity
          style={[styles.createBtn, (!name.trim() || creating) && styles.btnDisabled]}
          onPress={handleCreate}
          disabled={!name.trim() || creating}
          activeOpacity={0.8}
        >
          {creating
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.createBtnTxt}>{ro ? 'Creaza' : 'Create'}</Text>
          }
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>{ro ? 'Liste neautorizate:' : 'Unauthorized lists:'}</Text>
        {loading
          ? <ActivityIndicator color={Colors.primary} />
          : lists.length === 0
            ? <Text style={styles.muted}>{ro ? 'Nicio lista' : 'No lists'}</Text>
            : lists.map(l => (
                <TouchableOpacity
                  key={l.id}
                  style={styles.listBtn}
                  onPress={() => navigation.navigate('SaleDetail', { listId: l.id, listName: l.name })}
                  activeOpacity={0.75}
                >
                  <Text style={styles.listBtnTxt}>{l.name}</Text>
                  <Text style={styles.listBtnCount}>{l.animal_count} {ro ? 'animale' : 'animals'}</Text>
                </TouchableOpacity>
              ))
        }

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.background },
  content:      { padding: 20, gap: 10 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.textDark, marginTop: 8 },
  input:        { borderWidth: 2, borderColor: Colors.primary, borderRadius: 8, fontSize: 18, fontWeight: '600', paddingVertical: 14, paddingHorizontal: 16, color: Colors.textDark, backgroundColor: Colors.card },
  charCount:    { fontSize: 12, color: Colors.textMuted, textAlign: 'right', marginTop: -6 },
  createBtn:    { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
  btnDisabled:  { opacity: 0.4 },
  createBtnTxt: { color: '#fff', fontSize: 17, fontWeight: '700' },
  muted:        { fontSize: 14, color: Colors.textMuted, fontStyle: 'italic' },
  listBtn:      { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listBtnTxt:   { fontSize: 16, fontWeight: '700', color: '#fff' },
  listBtnCount: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
});
