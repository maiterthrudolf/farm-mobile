import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { useLang } from '../i18n/LanguageContext';

interface Props {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export default function NavHeader({ title, onBack, right }: Props) {
  const { lang } = useLang();
  const ro = lang === 'RO';
  return (
    <View style={styles.bar}>
      {onBack
        ? <TouchableOpacity onPress={onBack} style={styles.side}>
            <Text style={styles.back}>{'< '}{ro ? 'inapoi' : 'back'}</Text>
          </TouchableOpacity>
        : <View style={styles.side} />
      }
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={[styles.side, styles.rightSide]}>{right ?? null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar:       { backgroundColor: Colors.primaryDark, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14 },
  side:      { width: 70 },
  rightSide: { alignItems: 'flex-end' },
  back:      { color: Colors.textLight, fontSize: 14, fontWeight: '600' },
  title:     { flex: 1, color: Colors.textLight, fontSize: 17, fontWeight: '800', textAlign: 'center' },
});
