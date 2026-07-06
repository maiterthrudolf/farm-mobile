import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import { fetchSaleListAnimals, authorizeSaleList, deleteSaleList, SaleListAnimal } from '../api/client';
import ErrorModal from '../components/ErrorModal';
import NavHeader from '../components/NavHeader';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SaleDetail'>;
  route: RouteProp<RootStackParamList, 'SaleDetail'>;
};

export default function SaleDetailScreen({ navigation, route }: Props) {
  const { listId, listName } = route.params;
  const { lang, t } = useLang();
  const ro = lang === 'RO';

  const [animals,  setAnimals]  = useState<SaleListAnimal[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [confirm,  setConfirm]  = useState<'authorize' | 'delete' | null>(null);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchSaleListAnimals(listId)
      .then(setAnimals)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [listId]));

  const handleAuthorize = async () => {
    setBusy(true);
    try {
      await authorizeSaleList(listId);
      navigation.navigate('SaleMenu');
    } catch (e: any) {
      setError(e?.message ?? (ro ? 'Eroare' : 'Error'));
    } finally {
      setBusy(false); setConfirm(null);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteSaleList(listId);
      navigation.navigate('SaleMenu');
    } catch (e: any) {
      setError(e?.message ?? (ro ? 'Eroare' : 'Error'));
    } finally {
      setBusy(false); setConfirm(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={error} onClose={() => setError(null)} />

      {/* Confirm modal */}
      <Modal visible={!!confirm} transparent animationType="fade" onRequestClose={() => setConfirm(null)}>
        <View style={styles.overlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmMsg}>
              {confirm === 'authorize'
                ? (ro
                    ? `Autorizeaza lista "${listName}"?\nToate animalele vor fi marcate ca VANDUTE.`
                    : `Authorize list "${listName}"?\nAll animals will be marked as SOLD.`)
                : (ro
                    ? `Sterge lista "${listName}"?\nStatusul animalelor NU se schimba.`
                    : `Delete list "${listName}"?\nAnimal status will NOT change.`)}
            </Text>
            {busy
              ? <ActivityIndicator color={Colors.primary} />
              : (
                <View style={styles.confirmBtns}>
                  <TouchableOpacity
                    style={[styles.confirmYes, confirm === 'delete' && styles.confirmYesDanger]}
                    onPress={confirm === 'authorize' ? handleAuthorize : handleDelete}
                  >
                    <Text style={styles.confirmYesTxt}>{ro ? 'Da' : 'Yes'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmNo} onPress={() => setConfirm(null)}>
                    <Text style={styles.confirmNoTxt}>{ro ? 'Nu' : 'No'}</Text>
                  </TouchableOpacity>
                </View>
              )
            }
          </View>
        </View>
      </Modal>

      <NavHeader title={t('sales')} onBack={() => navigation.navigate('SaleMenu')} />

      {/* List name + count */}
      <View style={styles.listHeader}>
        <Text style={styles.listName}>{listName}</Text>
        {loading
          ? <ActivityIndicator size="small" color={Colors.primary} />
          : <Text style={styles.listCount}>{animals.length} {ro ? 'animale' : 'animals'}</Text>
        }
      </View>

      <View style={styles.menu}>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('SaleScan', { listId, listName })}
          activeOpacity={0.8}
        >
          <Text style={styles.editBtnTxt}>{ro ? 'Editare' : 'Edit'}</Text>
          <Text style={styles.editBtnSub}>{ro ? 'Adauga sau sterge animale' : 'Add or remove animals'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => navigation.navigate('SaleList', { listId, listName })}
          activeOpacity={0.8}
        >
          <Text style={styles.viewBtnTxt}>{ro ? 'Vizualizeaza' : 'View List'}</Text>
          <Text style={styles.viewBtnSub}>{ro ? 'Toate animalele din lista' : 'All animals in list'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.authorizeBtn}
          onPress={() => setConfirm('authorize')}
          activeOpacity={0.8}
        >
          <Text style={styles.authorizeBtnTxt}>{ro ? 'Autorizeaza' : 'Authorize'}</Text>
          <Text style={styles.authorizeBtnSub}>{ro ? 'Marcheaza animalele ca VANDUTE' : 'Mark all animals as SOLD'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => setConfirm('delete')}
          activeOpacity={0.8}
        >
          <Text style={styles.deleteBtnTxt}>{ro ? 'Sterge Lista' : 'Delete List'}</Text>
          <Text style={styles.deleteBtnSub}>{ro ? 'Statusul animalelor nu se schimba' : 'Animal status will not change'}</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.background },
  listHeader:     { backgroundColor: Colors.primaryLight, paddingVertical: 20, paddingHorizontal: 16, alignItems: 'center', gap: 4 },
  listName:       { fontSize: 22, fontWeight: '800', color: Colors.primaryDark },
  listCount:      { fontSize: 14, color: Colors.primaryDark, fontWeight: '600' },
  menu:           { flex: 1, padding: 16, gap: 12, justifyContent: 'center' },
  editBtn:        { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 20, paddingHorizontal: 20, gap: 4 },
  editBtnTxt:     { color: '#fff', fontSize: 18, fontWeight: '800' },
  editBtnSub:     { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  viewBtn:        { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 20, paddingHorizontal: 20, gap: 4 },
  viewBtnTxt:     { color: '#fff', fontSize: 18, fontWeight: '800' },
  viewBtnSub:     { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  authorizeBtn:   { backgroundColor: '#2E7D32', borderRadius: 10, paddingVertical: 20, paddingHorizontal: 20, gap: 4 },
  authorizeBtnTxt:{ color: '#fff', fontSize: 18, fontWeight: '800' },
  authorizeBtnSub:{ color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  deleteBtn:      { backgroundColor: '#C62828', borderRadius: 10, paddingVertical: 20, paddingHorizontal: 20, gap: 4 },
  deleteBtnTxt:   { color: '#000', fontSize: 18, fontWeight: '700' },
  deleteBtnSub:   { color: 'rgba(0,0,0,0.6)', fontSize: 13 },
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  confirmBox:     { backgroundColor: '#fff', borderRadius: 12, padding: 24, marginHorizontal: 32, gap: 16 },
  confirmMsg:     { fontSize: 15, color: '#212121', textAlign: 'center', lineHeight: 22 },
  confirmBtns:    { flexDirection: 'row', gap: 10 },
  confirmYes:     { flex: 1, backgroundColor: '#2E7D32', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  confirmYesDanger:{ backgroundColor: '#C62828' },
  confirmYesTxt:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  confirmNo:      { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  confirmNoTxt:   { color: Colors.textMuted, fontSize: 16, fontWeight: '600' },
});
