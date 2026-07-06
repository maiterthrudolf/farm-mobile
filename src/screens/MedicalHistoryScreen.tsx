import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { fetchMedicalHistory, MedicalHistoryRecord } from '../api/client';
import NavHeader from '../components/NavHeader';
import ErrorModal from '../components/ErrorModal';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MedicalHistory'>;
  route: RouteProp<RootStackParamList, 'MedicalHistory'>;
};

function fmtDate(d: string): string {
  return d ? d.slice(0, 10).split('-').reverse().join('.') : '—';
}


export default function MedicalHistoryScreen({ navigation, route }: Props) {
  const { lang } = useLang();
  const ro = lang === 'RO';
  const earTag = route?.params?.earTag;

  const [records, setRecords] = useState<MedicalHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    fetchMedicalHistory(earTag)
      .then(setRecords)
      .catch(e => setError(e?.message ?? 'Error'))
      .finally(() => setLoading(false));
  }, [earTag]);

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />
      <NavHeader
        title={earTag
          ? `${earTag.match(/^[A-Z]+/)?.[0] ?? ''} ${earTag.slice(-8)}`
          : (ro ? 'Istoric 12 Luni' : 'History 12 Months')
        }
        onBack={() => navigation.goBack()}
      />

      {loading
        ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        : (
          <ScrollView contentContainerStyle={styles.scroll}>
            {records.length === 0
              ? <Text style={styles.empty}>{ro ? 'Nicio inregistrare' : 'No records found'}</Text>
              : (
                <View style={styles.card}>
                  {records.map((r, idx) => (
                    <View key={r.id} style={[styles.row, idx > 0 && styles.rowBorder]}>
                      <View style={styles.dateCol}>
                        <Text style={styles.date}>{fmtDate(r.treatment_date)}</Text>
                        {earTag && (
                          <Text style={[styles.typeBadge, r.record_type === 'individual' ? styles.badgeInd : styles.badgeProc]}>
                            {r.record_type === 'individual' ? (ro ? 'Individual' : 'Individual') : (ro ? 'Procedura' : 'Procedure')}
                          </Text>
                        )}
                      </View>
                      <View style={styles.infoCol}>
                        {r.record_type === 'individual'
                          ? <Text style={styles.procName}>{(r.treatments ?? '—').replace(/,/g, ', ')}</Text>
                          : <>
                              <Text style={styles.procName}>{r.procedure_type ?? '—'}</Text>
                              {r.medication_name
                                ? <Text style={styles.medName}>{r.medication_name}</Text>
                                : null}
                            </>
                        }
                        {r.weight ? <Text style={styles.meta}>{r.weight} kg</Text> : null}
                        {r.comment ? <Text style={styles.comment}>{r.comment}</Text> : null}
                      </View>
                    </View>
                  ))}
                </View>
              )
            }
          </ScrollView>
        )
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.background },
  scroll:    { padding: 12 },
  empty:     { textAlign: 'center', color: Colors.textMuted, fontStyle: 'italic', marginTop: 40 },
  card:      { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, backgroundColor: Colors.card },
  row:       { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 12, alignItems: 'flex-start' },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  dateCol:   { width: 76, gap: 4 },
  date:      { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  typeBadge: { alignSelf: 'flex-start', fontSize: 9, fontWeight: '700', color: '#fff',
               borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
               overflow: 'hidden', marginBottom: 3, letterSpacing: 0.3 },
  badgeProc: { backgroundColor: Colors.primary },
  badgeInd:  { backgroundColor: '#E65100' },
  infoCol:   { flex: 1, gap: 2 },
  procName:  { fontSize: 13, fontWeight: '700', color: Colors.textDark },
  medName:   { fontSize: 11, color: '#1565C0', fontWeight: '600' },
  comment:   { fontSize: 10, color: Colors.textMuted, fontStyle: 'italic', lineHeight: 14 },
  meta:      { fontSize: 11, color: Colors.textMuted },
});
