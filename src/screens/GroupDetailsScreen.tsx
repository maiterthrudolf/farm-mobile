import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { fetchGroupDetails, GroupDetails } from '../api/client';
import NavHeader from '../components/NavHeader';
import GroupBanner from '../components/GroupBanner';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'GroupDetails'>;
  route: RouteProp<RootStackParamList, 'GroupDetails'>;
};

const COLOR_MAP: Record<string, { en: string; ro: string }> = {
  'R':     { en: 'Red',   ro: 'Rosu' },
  'RED':   { en: 'Red',   ro: 'Rosu' },
  'N':     { en: 'Black', ro: 'Negru' },
  'BLACK': { en: 'Black', ro: 'Negru' },
};

function fmtColor(color: string | null | undefined, ro: boolean): string {
  if (!color) return '—';
  const c = COLOR_MAP[color.toUpperCase()];
  return c ? (ro ? c.ro : c.en) : color;
}

function fmtAge(birthDate: string | null | undefined, ro: boolean): string {
  if (!birthDate) return '—';
  const b = new Date(birthDate);
  const n = new Date();
  const months = (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
  const years = Math.floor(months / 12);
  const rem   = months % 12;
  const suffix = ro ? 'A' : 'Y';
  return `${rem >= 6 ? years + 1 : years}${suffix}`;
}

export default function GroupDetailsScreen({ navigation, route }: Props) {
  const { groupName, groupColor } = route.params;
  const { lang } = useLang();
  const ro = lang === 'RO';

  const [details, setDetails] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchGroupDetails(groupName)
      .then(setDetails)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [groupName]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const subtitle = details
    ? `${details.vaci} ${ro ? 'Vaci' : 'Cows'}  ·  ${details.juninci} ${ro ? 'Juninci' : 'Heifers'}  ·  ${details.tauras} ${ro ? 'Vitei' : 'Young Bulls'}  ·  ${details.tauri} ${ro ? 'Tauri' : 'Bulls'}`
    : '';

  return (
    <SafeAreaView style={styles.safe}>
      <NavHeader
        title={groupName}
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            onPress={() => navigation.navigate('GroupAnimalList', { groupName, groupColor })}
            style={{ backgroundColor: '#E65100', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 }}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{ro ? 'Lista' : 'List'}</Text>
          </TouchableOpacity>
        }
      />

      {loading
        ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        : (
          <ScrollView contentContainerStyle={styles.scroll}>

            <GroupBanner
              title={groupName}
              total={details?.total ?? 0}
              subtitle={subtitle}
              color={groupColor}
            />

            {/* Action buttons */}
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('GroupScan', { groupName, groupColor, action: 'add' })}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnTxt}>{ro ? 'Adauga animal in grupa' : 'Add Animal to this group'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => navigation.navigate('GroupScan', { groupName, groupColor, action: 'remove' })}
              activeOpacity={0.8}
            >
              <Text style={styles.removeBtnTxt}>{ro ? 'Sterge Animal din Grupa' : 'Remove Animal from group'}</Text>
            </TouchableOpacity>

            {/* Bulls in this group */}
            {details && details.bulls.length > 0 && (
              <View style={styles.bullsSection}>
                <Text style={styles.bullsSectionTitle}>{ro ? 'Tauri in grupa' : 'Bulls in group'}</Text>
                <View style={styles.bullsCard}>
                  {details.bulls.map((b, idx) => (
                    <View key={b.ear_tag} style={[styles.bullRow, idx > 0 && styles.bullRowBorder]}>
                      <Text style={b.bull_name ? styles.bullName : styles.bullNameEmpty}>
                        {b.bull_name ?? (ro ? 'Fara Nume' : 'No Name')}
                      </Text>
                      <View style={styles.bullMeta}>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('AnimalDetail', { earTag: b.ear_tag, moduleLabel: ro ? 'Grupe' : 'Groups' })}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.bullTagLink}>{b.ear_tag}</Text>
                        </TouchableOpacity>
                        <Text style={styles.bullMetaText}>
                          {`  ·  ${fmtColor(b.color, ro)}  ·  ${fmtAge(b.birth_date, ro)}`}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

          </ScrollView>
        )
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: Colors.background },
  scroll:            { padding: 16, gap: 14 },
  addBtn:            { backgroundColor: '#2E7D32', borderRadius: 8, paddingVertical: 20, alignItems: 'center' },
  addBtnTxt:         { color: '#fff', fontSize: 16, fontWeight: '800' },
  removeBtn:         { backgroundColor: '#E65100', borderRadius: 8, paddingVertical: 20, alignItems: 'center' },
  removeBtnTxt:      { color: '#fff', fontSize: 16, fontWeight: '800' },
  bullsSection:      { gap: 8 },
  bullsSectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  bullsCard:         { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, backgroundColor: Colors.card },
  bullRow:           { padding: 12, gap: 4 },
  bullRowBorder:     { borderTopWidth: 1, borderTopColor: Colors.border },
  bullName:          { fontSize: 15, fontWeight: '800', color: Colors.primary },
  bullNameEmpty:     { fontSize: 15, fontWeight: '500', color: Colors.textMuted, fontStyle: 'italic' },
  bullMeta:          { flexDirection: 'row', alignItems: 'center' },
  bullTagLink:       { fontSize: 13, fontFamily: 'monospace', fontWeight: '700', color: '#1565C0', textDecorationLine: 'underline' },
  bullMetaText:      { fontSize: 13, fontFamily: 'monospace', color: Colors.textMuted },
});
