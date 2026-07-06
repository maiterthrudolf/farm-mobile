import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { getCompany } from '../theme/companies';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { checkEarTag, saveUnallocatedId, IdCheckResult } from '../api/client';
import NavHeader from '../components/NavHeader';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'IDConfirm'>;
  route: RouteProp<RootStackParamList, 'IDConfirm'>;
};

type ScreenState = 'checking' | 'error' | 'ok';

export default function IDConfirmScreen({ navigation, route }: Props) {
  const { company: companyKey, earTag } = route.params;
  const { lang, t } = useLang();
  const ro = lang === 'RO';
  const company = getCompany(companyKey);

  const [screenState, setScreenState] = useState<ScreenState>('checking');
  const [errorMsg,    setErrorMsg]    = useState('');
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    setScreenState('checking');
    checkEarTag(earTag)
      .then((result: IdCheckResult) => {
        if (result.exists) {
          if (result.where === 'animal') {
            setErrorMsg(ro ? 'Crotaliu existent pe animal' : 'ID on animal');
          } else {
            const co = result.company ?? companyKey;
            setErrorMsg(
              ro
                ? `Crotaliu existent pentru firma ${co} si nealocat`
                : `ID existing at company ${co} but not allocated`
            );
          }
          setScreenState('error');
        } else {
          setScreenState('ok');
        }
      })
      .catch(() => {
        setErrorMsg(ro ? 'Eroare server' : 'Server error');
        setScreenState('error');
      });
  }, [earTag]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveUnallocatedId(earTag, companyKey);
      // saved OK — go back to scan screen keeping the company
      navigation.navigate('IDScan', { company: companyKey });
    } catch {
      setSaving(false);
      Alert.alert(ro ? 'Eroare' : 'Error', ro ? 'Nu s-a putut salva' : 'Could not save');
    }
  };

  // display format: insert space after "RO" for readability
  const displayTag = earTag.startsWith('RO') ? `RO ${earTag.slice(2)}` : earTag;

  return (
    <SafeAreaView style={styles.safe}>
      <NavHeader
        title={t('id')}
        onBack={() => navigation.goBack()}
        right={company
          ? <View style={[styles.companyBadge, { backgroundColor: company.bg }]}>
              <Text style={[styles.badgeTxt, { color: company.text }]}>{company.short}</Text>
            </View>
          : undefined
        }
      />

      <View style={styles.content}>
        {/* Scanned ID — always shown */}
        <View style={styles.tagBox}>
          <Text style={styles.tagTxt}>{displayTag}</Text>
        </View>

        {/* State: checking */}
        {screenState === 'checking' && (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 32 }} />
        )}

        {/* State: error — only the error button is shown, clicking goes to page 1 */}
        {screenState === 'error' && (
          <TouchableOpacity
            style={styles.errorBtn}
            onPress={() => navigation.navigate('IDCompany')}
            activeOpacity={0.85}
          >
            <Text style={styles.errorBtnTxt}>{errorMsg}</Text>
          </TouchableOpacity>
        )}

        {/* State: ok — red (rescan) + green (save) */}
        {screenState === 'ok' && (
          <>
            <TouchableOpacity
              style={styles.redBtn}
              onPress={() => navigation.navigate('IDScan', { company: companyKey })}
              activeOpacity={0.85}
            >
              <Text style={styles.redBtnTxt}>
                {ro ? 'Gresit !!!\nRescaneaza' : 'Wrong !!!\nRescan'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.greenBtn, saving && styles.btnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.greenBtnTxt}>
                    {ro
                      ? 'Corect\nSalveaza si Scaneaza\nUrmatorul Crotaliu'
                      : 'Correct\nSave and Scan\nNext Ear Tag'}
                  </Text>
              }
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.background },
  companyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, minWidth: 60, alignItems: 'center' },
  badgeTxt:     { fontSize: 12, fontWeight: '800' },

  content:      { flex: 1, padding: 28, gap: 20, alignItems: 'center', justifyContent: 'center' },

  tagBox:       {
    borderWidth: 3, borderColor: Colors.textDark, borderRadius: 12,
    paddingHorizontal: 28, paddingVertical: 18,
    backgroundColor: Colors.card,
  },
  tagTxt:       { fontSize: 30, fontWeight: '900', color: Colors.textDark, letterSpacing: 2 },

  errorBtn:     {
    backgroundColor: '#C62828', borderRadius: 10,
    paddingVertical: 22, paddingHorizontal: 24,
    width: '100%', alignItems: 'center',
  },
  errorBtnTxt:  { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center', lineHeight: 26 },

  redBtn:       { backgroundColor: '#C62828', borderRadius: 10, paddingVertical: 22, width: '100%', alignItems: 'center' },
  redBtnTxt:    { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center', lineHeight: 28 },

  greenBtn:     { backgroundColor: '#2E7D32', borderRadius: 10, paddingVertical: 22, width: '100%', alignItems: 'center' },
  greenBtnTxt:  { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center', lineHeight: 26 },

  btnDisabled:  { opacity: 0.6 },
});
