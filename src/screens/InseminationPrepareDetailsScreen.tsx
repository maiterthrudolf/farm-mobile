import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { recordPrepare, saveInseminationComment } from '../api/client';
import ErrorModal from '../components/ErrorModal';
import NavHeader from '../components/NavHeader';
import AnimalCard from '../components/AnimalCard';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'InseminationPrepareDetails'>;
  route: RouteProp<RootStackParamList, 'InseminationPrepareDetails'>;
};

export default function InseminationPrepareDetailsScreen({ navigation, route }: Props) {
  const { animal } = route.params;
  const { lang } = useLang();
  const ro = lang === 'RO';

  const alreadyPrepared = animal.prepared === true;

  const [comment, setComment] = useState(animal.comment ?? '');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const autoSaveComment = async (value: string) => {
    try {
      await saveInseminationComment(animal.ear_tag, value || null);
    } catch {}
  };

  const handlePrepare = async () => {
    setSaving(true);
    try {
      await recordPrepare(animal.ear_tag, comment || null);
      navigation.navigate('InseminationPrepareScan');
    } catch (e: any) {
      setSaving(false);
      setError(e?.message ?? (ro ? 'Eroare' : 'Error'));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />
      <NavHeader
        title={ro ? 'Pregatire insamintare artificiala' : 'Preparation of artificial insemination'}
        onBack={() => navigation.navigate('InseminationPrepareScan')}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>

          <AnimalCard
            data={animal}
            lang={lang}
            onPress={() => {}}
            showCompany={true}
            showCategoryBar={true}
            showGestation={true}
          />

          {alreadyPrepared && animal.prepared_date && (
            <View style={styles.prepDateRow}>
              <Text style={styles.prepDateLabel}>{ro ? 'Data pregatire:' : 'Preparation date:'}</Text>
              <Text style={styles.prepDateValue}>{String(animal.prepared_date).slice(0, 10)}</Text>
            </View>
          )}

          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            onBlur={() => autoSaveComment(comment)}
            placeholder={ro ? 'Comentariu...' : 'Comment...'}
            placeholderTextColor={Colors.border}
            multiline
            textAlignVertical="top"
          />

          {!alreadyPrepared && (
            <TouchableOpacity
              style={[styles.preparedBtn, saving && styles.btnDisabled]}
              onPress={handlePrepare}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.preparedBtnTxt}>{ro ? 'Pregateste' : 'Prepare'}</Text>
              }
            </TouchableOpacity>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.background },
  scroll:         { padding: 16, gap: 12 },
  prepDateRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  prepDateLabel:  { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  prepDateValue:  { fontSize: 13, color: Colors.textDark, fontWeight: '700', fontFamily: 'monospace' },
  commentInput:   { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.textDark, backgroundColor: '#fff', minHeight: 80, textAlignVertical: 'top' },
  preparedBtn:    { backgroundColor: '#2E7D32', borderRadius: 8, paddingVertical: 22, alignItems: 'center' },
  preparedBtnTxt: { color: '#fff', fontSize: 20, fontWeight: '800' },
  btnDisabled:    { opacity: 0.5 },
});
