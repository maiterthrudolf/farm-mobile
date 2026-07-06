import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import NavHeader from '../components/NavHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BirthCompany'>;
};

const COMPANIES = [
  { key: 'AFM',    label: 'AFM',    bg: '#1565C0', text: '#fff' },
  { key: 'ATLAS',  label: 'Atlas',  bg: '#E65100', text: '#fff' },
  { key: 'ARES',   label: 'Ares',   bg: '#F9A825', text: '#000' },
  { key: 'APOLLO', label: 'Apollo', bg: '#2E7D32', text: '#fff' },
];

export default function BirthCompanyScreen({ navigation }: Props) {
  const { lang, t } = useLang();
  const ro = lang === 'RO';

  return (
    <SafeAreaView style={styles.safe}>
      <NavHeader title={t('birth')} onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        {COMPANIES.map(c => (
          <TouchableOpacity
            key={c.key}
            style={[styles.companyBtn, { backgroundColor: c.bg }]}
            onPress={() => navigation.navigate('BirthScan', { company: c.key, mother: null })}
            activeOpacity={0.8}
          >
            <Text style={[styles.companyLabel, { color: c.text }]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.background },
  content:      { flex: 1, padding: 32, gap: 16, justifyContent: 'center' },
  companyBtn:   { borderRadius: 14, paddingVertical: 28, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  companyLabel: { fontSize: 30, fontWeight: '800', letterSpacing: 1 },
});
