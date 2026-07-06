import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import NavHeader from '../components/NavHeader';
import AppButton from '../components/AppButton';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLang } from '../i18n/LanguageContext';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'FeedMenu'>;
};

const MODULES_EN: [string, keyof RootStackParamList][] = [
  ['Bales\nProduction',   'BalesProduction'],
  ['Grains\nProduction',  'CerealProduction'],
  ['Bales\nFarm Entry',   'BalesFarmEntry'],
  ['Grains\nConsumption', 'CerealConsumption'],
  ['Bales\nConsumption',  'BalesConsumption'],
  ['Grains\nSale',        'CerealSale'],
];

const MODULES_RO: [string, keyof RootStackParamList][] = [
  ['Baloti\nProductie',  'BalesProduction'],
  ['Cereale\nProductie', 'CerealProduction'],
  ['Baloti\nIntrare Ferma', 'BalesFarmEntry'],
  ['Cereale\nConsum',    'CerealConsumption'],
  ['Baloti\nConsum',     'BalesConsumption'],
  ['Cereale\nVanzare',   'CerealSale'],
];

export default function FeedMenuScreen({ navigation }: Props) {
  const { lang } = useLang();
  const ro = lang === 'RO';
  const modules = ro ? MODULES_RO : MODULES_EN;

  const pairs: typeof modules[] = [];
  for (let i = 0; i < modules.length; i += 2) pairs.push(modules.slice(i, i + 2));

  return (
    <SafeAreaView style={styles.safe}>
      <NavHeader title={ro ? 'Furaje' : 'Feed'} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.grid}>
        {pairs.map((pair, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {pair.map(([label, route], i) => (
              <AppButton
                key={i}
                title={label}
                onPress={() => (navigation as any).navigate(route)}
                color="#B8900E"
                style={styles.moduleBtn}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.background },
  grid:      { padding: 16, gap: 12 },
  row:       { flexDirection: 'row', gap: 12 },
  moduleBtn: { flex: 1, paddingVertical: 20 },
});
