import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import {
  searchGroupAddAnimal, searchGroupRemoveAnimal,
  addAnimalToGroup, removeAnimalFromGroup, GroupAnimal,
} from '../api/client';
import NavHeader from '../components/NavHeader';
import ErrorModal from '../components/ErrorModal';
import ConfirmModal from '../components/ConfirmModal';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'GroupScan'>;
  route: RouteProp<RootStackParamList, 'GroupScan'>;
};

export default function GroupScanScreen({ navigation, route }: Props) {
  const { groupName, action } = route.params;
  const { lang } = useLang();
  const ro = lang === 'RO';

  const [last4,   setLast4]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [confirm, setConfirm] = useState<GroupAnimal | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const isAdd = action === 'add';
  const title = isAdd
    ? (ro ? 'Adauga animal in grupa' : 'Add Animal to group')
    : (ro ? 'Sterge Animal din Grupa' : 'Remove Animal from group');

  const handleSearch = async () => {
    if (last4.length < 4) return;
    setLoading(true);
    setSuccess(null);
    try {
      const search = isAdd ? searchGroupAddAnimal : searchGroupRemoveAnimal;
      const results = await search(last4, groupName);
      if (results.length === 0) {
        setError(ro ? 'Crotaliu nu este valid' : 'ID not found or not eligible');
      } else {
        setConfirm(results[0]);
      }
    } catch (e: any) {
      setError(e?.message ?? (ro ? 'Eroare' : 'Error'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    const earTag = confirm.ear_tag;
    setConfirm(null);
    setLoading(true);
    try {
      if (isAdd) {
        await addAnimalToGroup(earTag, groupName);
        setSuccess(ro ? `Adaugat: ${earTag}` : `Added: ${earTag}`);
      } else {
        await removeAnimalFromGroup(earTag);
        setSuccess(ro ? `Sters din grupa: ${earTag}` : `Removed from group: ${earTag}`);
      }
      setLast4('');
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (e: any) {
      setError(e?.message ?? (ro ? 'Eroare' : 'Error'));
    } finally {
      setLoading(false);
    }
  };

  const confirmMsg = confirm
    ? (isAdd
      ? (ro
        ? `Sunteti sigur ca doriti sa adaugati animalul cu crotaliul ${confirm.ear_tag}?`
        : `Are you sure you want to add animal with ID ${confirm.ear_tag}?`)
      : (ro
        ? `Sunteti sigur ca doriti sa stergeti animalul cu crotaliul ${confirm.ear_tag}?`
        : `Are you sure you want to remove animal ${confirm.ear_tag} from the group?`))
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />
      <ConfirmModal
        message={confirmMsg}
        labelYes={ro ? 'Da' : 'Yes'}
        labelNo={ro ? 'Nu' : 'No'}
        onYes={handleConfirm}
        onNo={() => setConfirm(null)}
      />

      <NavHeader title={title} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <Text style={styles.hint}>{ro ? 'Introdu cel putin ultimele 4 cifre:' : 'Enter at least the last 4 digits:'}</Text>

          {success && <Text style={styles.successMsg}>{success}</Text>}

          <TextInput
            ref={inputRef}
            style={styles.input}
            value={last4}
            onChangeText={v => setLast4(v.replace(/\D/g, '').slice(0, 10))}
            placeholder="0000"
            placeholderTextColor={Colors.border}
            keyboardType="number-pad"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.searchBtn, (loading || last4.length < 4) && styles.btnDisabled]}
            onPress={handleSearch}
            disabled={loading || last4.length < 4}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.searchBtnTxt}>{ro ? 'Cauta' : 'Search'}</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.background },
  content:      { flex: 1, padding: 24, gap: 16, justifyContent: 'center' },
  hint:         { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  successMsg:   { fontSize: 14, color: '#2E7D32', fontWeight: '700', textAlign: 'center', backgroundColor: '#E8F5E9', padding: 10, borderRadius: 8 },
  input:        { borderWidth: 2, borderColor: Colors.primary, borderRadius: 10, fontSize: 28, fontWeight: '700', textAlign: 'center', paddingVertical: 14, color: Colors.textDark, backgroundColor: '#fff', letterSpacing: 6 },
  searchBtn:    { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 18, alignItems: 'center' },
  searchBtnTxt: { color: '#fff', fontSize: 18, fontWeight: '800' },
  btnDisabled:  { opacity: 0.5 },
});
