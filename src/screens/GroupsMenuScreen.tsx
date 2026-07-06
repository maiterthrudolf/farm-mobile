import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { fetchGroupsOverview, GroupOverview } from '../api/client';
import NavHeader from '../components/NavHeader';
import GroupBanner from '../components/GroupBanner';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'GroupsMenu'> };

type GroupDef = {
  name: string;       // canonical DB name (Romanian)
  nameEN?: string;    // English display label (optional)
  color: string;
  type: 'normal' | 'tauri' | 'vitei' | 'generala';
};

const ALL_GROUPS: GroupDef[] = [
  { name: 'Parcela 1 - Ferma',         color: '#C62828', type: 'normal' },
  { name: 'Parcela 2 - Ferma',         color: '#C62828', type: 'normal' },
  { name: 'Parcela 3 - Ferma',         color: '#C62828', type: 'normal' },
  { name: 'Parcela 4 - Ferma',         color: '#C62828', type: 'normal' },
  { name: 'Parcela 5 - Ferma',         color: '#C62828', type: 'normal' },
  { name: 'Parcela 6 - Ferma',         color: '#C62828', type: 'normal' },
  { name: 'Grupa 1 - Negestante',      color: '#1565C0', type: 'normal' },
  { name: 'Grupa 2 - Gestatie mica',   color: '#1565C0', type: 'normal' },
  { name: 'Grupa 3 - Gestatie mare',   color: '#1565C0', type: 'normal' },
  { name: 'Grupa 4 - Juninci',         color: '#1565C0', type: 'normal' },
  { name: 'Vitei', nameEN: 'Young Bulls', color: '#5D4037', type: 'tauri' },
  { name: 'Vitele',                    color: '#5D4037', type: 'vitei' },
  { name: 'Intarcati',                 color: '#5D4037', type: 'vitei' },
  { name: 'Reforme',                   color: '#5D4037', type: 'normal' },
  { name: 'Generala',                  color: '#5D4037', type: 'generala' },
];

function buildSubtitle(g: GroupDef, ov: GroupOverview | undefined, ro: boolean): string {
  const v = ov ?? { vaci: 0, juninci: 0, tauri: 0, tauras: 0, mascul: 0, total: 0, group_name: g.name };
  const vaci = ro ? 'Vaci' : 'Cows';
  const jun  = ro ? 'Juninci' : 'Heifers';
  const taur = ro ? 'Tauri' : 'Bulls';
  const trs  = ro ? 'Vitei' : 'Young Bulls';
  return `${v.vaci} ${vaci}  ·  ${v.juninci} ${jun}  ·  ${v.tauras} ${trs}  ·  ${v.tauri} ${taur}`;
}

export default function GroupsMenuScreen({ navigation }: Props) {
  const { lang } = useLang();
  const ro = lang === 'RO';
  const [overview, setOverview] = useState<GroupOverview[]>([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(() => {
    fetchGroupsOverview().then(setOverview).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const ovMap: Record<string, GroupOverview> = {};
  overview.forEach(o => { ovMap[o.group_name] = o; });

  const totals = overview.reduce(
    (acc, o) => ({
      total:   acc.total   + o.total,
      vaci:    acc.vaci    + o.vaci,
      juninci: acc.juninci + o.juninci,
      tauri:   acc.tauri   + o.tauri,
      tauras:  acc.tauras  + o.tauras,
      mascul:  acc.mascul  + o.mascul,
    }),
    { total: 0, vaci: 0, juninci: 0, tauri: 0, tauras: 0, mascul: 0 },
  );

  const renderBtn = (g: GroupDef) => {
    const ov = ovMap[g.name];
    return (
      <GroupBanner
        key={g.name}
        title={ro ? g.name : (g.nameEN ?? g.name)}
        total={ov?.total ?? 0}
        subtitle={buildSubtitle(g, ov, ro)}
        color={g.color}
        onPress={() => navigation.navigate('GroupDetails', { groupName: g.name, groupColor: g.color, groupType: g.type })}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <NavHeader
        title={ro ? 'Grupe' : 'Groups'}
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity onPress={() => navigation.navigate('GroupBullList')} style={hdrBtnStyle}>
            <Text style={hdrBtnTxtStyle}>{ro ? 'Tauri' : 'Bulls'}</Text>
          </TouchableOpacity>
        }
      />

      {loading
        ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        : (
          <ScrollView contentContainerStyle={styles.scroll}>
            <GroupBanner
              title="Total"
              total={totals.total}
              subtitle={`${totals.vaci} ${ro ? 'Vaci' : 'Cows'}  ·  ${totals.juninci} ${ro ? 'Juninci' : 'Heifers'}  ·  ${totals.tauras} ${ro ? 'Vitei' : 'Young Bulls'}  ·  ${totals.tauri} ${ro ? 'Tauri' : 'Bulls'}`}
              color="#2E7D32"
            />

            {ALL_GROUPS.map(g => renderBtn(g))}
          </ScrollView>
        )
      }
    </SafeAreaView>
  );
}

const hdrBtnStyle    = { backgroundColor: '#E65100', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 };
const hdrBtnTxtStyle = { color: '#fff', fontSize: 12, fontWeight: '700' as const };

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 12, gap: 10 },
});
