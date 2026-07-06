import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLang } from '../i18n/LanguageContext';
import AppButton from '../components/AppButton';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MainMenu'>;
};

export default function MainMenuScreen({ navigation }: Props) {
  const { lang, setLang, t } = useLang();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Language Toggle */}
      <View style={styles.langRow}>
        <TouchableOpacity
          style={[styles.langBtn, lang === 'EN' && styles.langBtnActive]}
          onPress={() => setLang('EN')}
        >
          <Text style={[styles.langText, lang === 'EN' && styles.langTextActive]}>EN</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.langBtn, lang === 'RO' && styles.langBtnActive]}
          onPress={() => setLang('RO')}
        >
          <Text style={[styles.langText, lang === 'RO' && styles.langTextActive]}>RO</Text>
        </TouchableOpacity>
      </View>

      {/* Logo / Title */}
      <View style={styles.logoArea}>
        <Text style={styles.logoIcon}>🐄</Text>
        <Text style={styles.appTitle}>FARM APP</Text>
      </View>

      {/* Main Buttons */}
      <View style={styles.buttonArea}>
        <AppButton
          title={t('cattle')}
          onPress={() => navigation.navigate('CattleMenu')}
          style={styles.mainBtn}
          textStyle={styles.mainBtnText}
        />
        <AppButton
          title={t('feed')}
          onPress={() => navigation.navigate('FeedMenu')}
          color="#B8900E"
          textColor={Colors.textLight}
          style={styles.mainBtn}
          textStyle={styles.mainBtnText}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    gap: 8,
  },
  langBtn: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  langBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  langText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  langTextActive: {
    color: Colors.textLight,
  },
  logoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 72,
    marginBottom: 8,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 3,
  },
  buttonArea: {
    paddingHorizontal: 32,
    paddingBottom: 60,
    gap: 16,
  },
  mainBtn: {
    paddingVertical: 22,
  },
  mainBtnText: {
    fontSize: 22,
    letterSpacing: 1,
  },
});
