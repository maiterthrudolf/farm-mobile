import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLang } from '../i18n/LanguageContext';
import AppButton from '../components/AppButton';
import NavHeader from '../components/NavHeader';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { TranslationKey } from '../i18n/translations';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CattleMenu'>;
};

// Order matches Balsamiq layout exactly (left col, right col per row)
// [translationKey, color, screenName | null, adminOnly]
const MODULES: Array<[TranslationKey, string, keyof RootStackParamList | null, boolean]> = [
  ['view',      Colors.primary, 'Scan', false],
  ['edit',      Colors.primary, 'EditScan', false],
  ['birth',     Colors.primary, 'BirthMother', false],
  ['sales',     Colors.primary, 'SaleMenu', false],
  ['medical',   Colors.primary, 'MedicalMenu', false],
  ['deaths',    Colors.primary, 'DeathScan', false],
  ['weight',    Colors.primary, 'WeighScan', false],
  ['groups',    Colors.primary, 'GroupsMenu', false],
  ['id',        Colors.primary, 'IDCompany', false],
  ['pregnancy',     Colors.primary, 'PregnancyScan',    false],
  ['father',        Colors.primary, 'Father',            false],
  ['insemination',  Colors.primary, 'InseminationMenu', false],
];

export default function CattleMenuScreen({ navigation }: Props) {
  const { t } = useLang();

  const handlePress = (screen: keyof RootStackParamList | null, key: TranslationKey) => {
    if (!screen) {
      // Modules not yet implemented
      return;
    }
    if (screen === 'Scan') {
      navigation.navigate('Scan', { returnTo: 'View', moduleLabel: t(key) });
    } else if (screen === 'IDCompany') {
      navigation.navigate('IDCompany');
    } else if (screen === 'BirthMother') {
      navigation.navigate('BirthMother');
    } else if (screen === 'Father') {
      navigation.navigate('Father');
    } else {
      (navigation as any).navigate(screen);
    }
  };

  // Render buttons in pairs (2 per row)
  const pairs: typeof MODULES[] = [];
  for (let i = 0; i < MODULES.length; i += 2) {
    pairs.push(MODULES.slice(i, i + 2) as typeof MODULES);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <NavHeader title={t('cattle')} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.grid}>
        {pairs.map((pair, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {pair.map(([key, color, screen, adminOnly]) => (
              <AppButton
                key={key}
                title={t(key)}
                onPress={() => handlePress(screen, key)}
                color={adminOnly ? Colors.textMuted : color}
                style={styles.moduleBtn}
                disabled={adminOnly}
              />
            ))}
            {pair.length === 1 && <View style={styles.moduleBtn} />}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  grid: {
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  moduleBtn: {
    flex: 1,
    paddingVertical: 20,
  },
});
