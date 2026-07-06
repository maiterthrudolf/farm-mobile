import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useLang } from '../i18n/LanguageContext';
import NavHeader from '../components/NavHeader';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { CattleSearchResult } from '../api/client';
import AnimalCard from '../components/AnimalCard';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ScanMultiple'>;
  route: RouteProp<RootStackParamList, 'ScanMultiple'>;
};

export default function ScanMultipleScreen({ navigation, route }: Props) {
  const { results, moduleLabel } = route.params;
  const { lang, t } = useLang();

  return (
    <SafeAreaView style={styles.safe}>
      <NavHeader title={moduleLabel} onBack={() => navigation.goBack()} />

      <View style={styles.subHeader}>
        {results.length === 0 && (
          <Text style={[styles.subTitle, { color: Colors.danger }]}>{t('noIdFound')}</Text>
        )}
        {results.length === 1 && (
          <Text style={styles.subTitle}>1 {lang === 'RO' ? 'animal gasit' : 'animal found'}</Text>
        )}
        {results.length > 1 && (
          <>
            <Text style={styles.subTitle}>{t('multipleFound')}</Text>
            <Text style={styles.subHint}>{t('pleaseSelect')}</Text>
          </>
        )}
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.ear_tag}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <AnimalCard
            data={item}
            lang={lang}
            onPress={() => navigation.navigate('AnimalDetail', { earTag: item.ear_tag, moduleLabel })}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.background },
  subHeader:   { backgroundColor: Colors.card, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  subTitle:    { fontSize: 16, fontWeight: '700', color: Colors.primaryDark },
  subHint:     { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  list:        { padding: 12, gap: 10 },
});
