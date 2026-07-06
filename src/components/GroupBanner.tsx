import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type Props = {
  title: string;
  total: number;
  subtitle: string;
  color: string;
  onPress?: () => void;
};

export default function GroupBanner({ title, total, subtitle, color, onPress }: Props) {
  const inner = (
    <>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.total}>{total}</Text>
      </View>
      <Text style={styles.sub}>{subtitle}</Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={[styles.banner, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.8}>
        {inner}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.banner, { backgroundColor: color }]}>
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: 10, padding: 12, gap: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title:  { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },
  total:  { color: '#fff', fontSize: 18, fontWeight: '900', marginLeft: 6 },
  sub:    { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '500' },
});
