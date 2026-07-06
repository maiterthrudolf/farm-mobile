import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLang } from '../i18n/LanguageContext';
import {
  fetchByTag, fetchEditFormData, fetchWeightHistory, updateAnimal, deleteWeight,
  saveWeight, CattleRecord, WeightEntry,
} from '../api/client';
import NavHeader from '../components/NavHeader';
import ErrorModal from '../components/ErrorModal';
import ConfirmModal from '../components/ConfirmModal';
import FormField from '../components/FormField';
import DateField from '../components/DateField';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditDetails'>;
  route: RouteProp<RootStackParamList, 'EditDetails'>;
};

// ── Ear-tag format validation ─────────────────────────────────────────────────
const EAR_TAG_PATTERNS: Record<string, RegExp> = {
  RO: /^RO\d{12}$/,
  DE: /^DE\d{10}$/,
  AT: /^AT\d{9}$/,
  CZ: /^CZ\d{9}$/,
  IE: /^IE\d{12}$/,
  UK: /^UK\d{12}$/,
  LT: /^LT\d{12}$/,
};

function validateEarTag(tag: string): boolean {
  if (!tag) return true; // empty = not provided, skip
  const prefix = tag.slice(0, 2).toUpperCase();
  const pattern = EAR_TAG_PATTERNS[prefix];
  if (!pattern) return false;
  return pattern.test(tag.toUpperCase());
}

// ── Small reusable sub-components ────────────────────────────────────────────

function ChipGroup<T extends string>({
  options, value, onChange, labels,
}: {
  options: T[];
  value: T | null;
  onChange: (v: T) => void;
  labels?: Record<string, string>;
}) {
  return (
    <View style={chipStyles.row}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          style={[chipStyles.chip, value === opt && chipStyles.chipActive]}
          onPress={() => onChange(opt)}
          activeOpacity={0.8}
        >
          <Text style={[chipStyles.chipTxt, value === opt && chipStyles.chipTxtActive]}>
            {labels ? labels[opt] ?? opt : opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  row:          { flexDirection: 'row', gap: 8 },
  chip:         { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.card },
  chipActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipTxt:      { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
  chipTxtActive:{ color: '#fff' },
});

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity style={toggleStyles.row} onPress={() => onChange(!value)} activeOpacity={0.8}>
      <Text style={toggleStyles.label}>{label}</Text>
      <View style={[toggleStyles.indicator, value ? toggleStyles.on : toggleStyles.off]}>
        <Text style={toggleStyles.indicatorTxt}>{value ? 'ON' : 'OFF'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const toggleStyles = StyleSheet.create({
  row:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  label:         { fontSize: 15, color: Colors.textDark, flex: 1 },
  indicator:     { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  on:            { backgroundColor: Colors.primary },
  off:           { backgroundColor: Colors.border },
  indicatorTxt:  { color: '#fff', fontWeight: '700', fontSize: 13 },
});

// ── SelectModal ───────────────────────────────────────────────────────────────

function SelectModal({
  visible, title, items, selected, onSelect, onClose,
}: {
  visible: boolean;
  title: string;
  items: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={selectStyles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={selectStyles.sheet}>
          <Text style={selectStyles.title}>{title}</Text>
          <FlatList
            data={items}
            keyExtractor={i => i}
            style={selectStyles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[selectStyles.item, selected === item && selectStyles.itemActive]}
                onPress={() => { onSelect(item); onClose(); }}
                activeOpacity={0.8}
              >
                <Text style={[selectStyles.itemTxt, selected === item && selectStyles.itemTxtActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={selectStyles.cancelBtn} onPress={onClose}>
            <Text style={selectStyles.cancelTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const selectStyles = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: Colors.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 16, paddingBottom: 32, maxHeight: '70%' },
  title:        { fontSize: 16, fontWeight: '700', color: Colors.textDark, textAlign: 'center', marginBottom: 8, paddingHorizontal: 16 },
  list:         { flexGrow: 0 },
  item:         { paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  itemActive:   { backgroundColor: '#E8F5E9' },
  itemTxt:      { fontSize: 15, color: Colors.textDark },
  itemTxtActive:{ color: Colors.primary, fontWeight: '700' },
  cancelBtn:    { marginTop: 12, marginHorizontal: 20, paddingVertical: 14, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  cancelTxt:    { fontSize: 15, color: Colors.textMuted, fontWeight: '600' },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function EditDetailsScreen({ navigation, route }: Props) {
  const { lang } = useLang();
  const ro = lang === 'RO';
  const { earTag } = route.params;

  // Loading / error state
  const [pageLoading, setPageLoading] = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null);
  const [confirmMsg,  setConfirmMsg]  = useState<string | null>(null);
  const [pendingSave, setPendingSave] = useState(false);

  const [groups, setGroups] = useState<string[]>([]);

  // Modal visibility
  const [showGroup, setShowGroup] = useState(false);

  const COMPANIES = ['Apollo', 'Ares', 'AFM', 'Atlas'];

  // Original animal (for birth_date comparison)
  const [origAnimal, setOrigAnimal] = useState<CattleRecord | null>(null);

  // Weighings
  const [weighings,     setWeighings]     = useState<WeightEntry[]>([]);
  const [newWeightKg,   setNewWeightKg]   = useState('');
  const [newWeightDate, setNewWeightDate] = useState(new Date().toISOString().slice(0, 10));
  const [addingWeight,  setAddingWeight]  = useState(false);

  // Form state
  const [earTagVal,        setEarTagVal]        = useState('');
  const [company,          setCompany]          = useState('');
  const [birthDate,        setBirthDate]        = useState('');
  const [sex,              setSex]              = useState<'M' | 'F' | null>(null);
  const [color,            setColor]            = useState<'Black' | 'Red' | null>(null);
  const [bidaa,            setBidaa]            = useState(false);
  const [pedigree,         setPedigree]         = useState(false);
  const [breeding,         setBreeding]         = useState(false);
  const [gestation,        setGestation]        = useState(false);
  const [gestationWeeks,   setGestationWeeks]   = useState('');
  const [isBull,           setIsBull]           = useState(false);
  const [status,           setStatus]           = useState<'VIU' | 'MORT' | 'VANDUT'>('VIU');
  const [deathDate,        setDeathDate]        = useState('');
  const [deathReason,      setDeathReason]      = useState('');
  const [salesDate,        setSalesDate]        = useState('');
  const [clientName,       setClientName]       = useState('');
  const [groupName,        setGroupName]        = useState('');
  const [motherEarTag,     setMotherEarTag]     = useState('');
  const [fatherEarTag,     setFatherEarTag]     = useState('');
  const [purpose,          setPurpose]          = useState<'reproductie' | 'ingrasare' | null>(null);
  const [comment,          setComment]          = useState('');

  // Load everything on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [animal, formData, weights] = await Promise.all([
          fetchByTag(earTag),
          fetchEditFormData(),
          fetchWeightHistory(earTag),
        ]);
        if (cancelled) return;

        setOrigAnimal(animal);
        setGroups(formData.groups);
        setWeighings(weights.slice(0, 5));

        // Initialise form from animal
        setEarTagVal(animal.ear_tag ?? '');
        setCompany(animal.company ?? '');
        setBirthDate(animal.birth_date ?? '');
        setSex((animal.sex as 'M' | 'F') ?? null);
        setColor((animal.color as 'Black' | 'Red') ?? null);
        setBidaa(animal.bidaa ?? false);
        // pending counts as yes in edit
        setPedigree(animal.pedigree === 'yes' || animal.pedigree === 'pending');
        setBreeding(animal.breeding ?? false);
        setGestation(animal.gestation ?? false);
        setGestationWeeks(animal.gestation_weeks != null ? String(animal.gestation_weeks) : '');
        setIsBull(animal.is_bull ?? false);
        const rawStatus = (animal.status ?? 'VIU').toUpperCase();
        setStatus(rawStatus === 'MORT' ? 'MORT' : rawStatus === 'VANDUT' ? 'VANDUT' : 'VIU');
        setDeathDate(animal.death_date ?? '');
        setDeathReason(animal.death_reason ?? '');
        setSalesDate(animal.sales_date ?? '');
        setClientName(animal.client_name ?? '');
        setGroupName(animal.group_name ?? '');
        setMotherEarTag(animal.mother_ear_tag ?? '');
        setFatherEarTag(animal.father_ear_tag ?? '');
        setPurpose((animal.purpose as 'reproductie' | 'ingrasare') ?? null);
        setComment(animal.comment ?? '');
      } catch (e: any) {
        if (!cancelled) setErrorMsg(e?.message ?? 'Failed to load animal');
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [earTag]);

  const today = new Date().toISOString().slice(0, 10);

  const doSave = useCallback(async () => {
    // Validation
    if (earTagVal && !validateEarTag(earTagVal)) {
      setErrorMsg(ro ? 'Format crotaliu invalid' : 'Invalid ear tag format');
      return;
    }
    if (motherEarTag && !validateEarTag(motherEarTag)) {
      setErrorMsg(ro ? 'Format crotaliu mama invalid' : 'Invalid mother ear tag format');
      return;
    }
    if (fatherEarTag && !validateEarTag(fatherEarTag)) {
      setErrorMsg(ro ? 'Format crotaliu tata invalid' : 'Invalid father ear tag format');
      return;
    }
    if (status === 'MORT') {
      if (!deathDate) {
        setErrorMsg(ro ? 'Data decesului este obligatorie' : 'Death date is required');
        return;
      }
      if (!deathReason.trim()) {
        setErrorMsg(ro ? 'Motivul decesului este obligatoriu' : 'Death reason is required');
        return;
      }
    }
    if (status === 'VANDUT') {
      if (!salesDate) {
        setErrorMsg(ro ? 'Data vanzarii este obligatorie' : 'Sales date is required');
        return;
      }
      if (!clientName.trim()) {
        setErrorMsg(ro ? 'Numele clientului este obligatoriu' : 'Client name is required');
        return;
      }
    }

    // Birth date change > 7 days warning
    if (origAnimal?.birth_date && birthDate && birthDate !== origAnimal.birth_date && !pendingSave) {
      const diff = Math.abs(
        (new Date(birthDate).getTime() - new Date(origAnimal.birth_date).getTime()) / 86400000
      );
      if (diff > 7) {
        setConfirmMsg(
          ro
            ? `Data nasterii s-a modificat cu ${Math.round(diff)} zile. Esti sigur?`
            : `Date of birth changed by ${Math.round(diff)} days. Are you sure?`
        );
        return;
      }
    }

    setSaving(true);
    try {
      const payload: Parameters<typeof updateAnimal>[1] = {};
      if (earTagVal !== earTag) payload.new_ear_tag = earTagVal;
      if (company)    payload.company    = company;
      if (birthDate)  payload.birth_date = birthDate;
      if (sex)        payload.sex        = sex;
      if (color)      payload.color      = color;
      payload.bidaa    = bidaa;
      payload.pedigree = pedigree ? 'yes' : 'no';
      payload.breeding = breeding;
      payload.gestation = gestation;
      payload.gestation_weeks = gestation && gestationWeeks ? parseFloat(gestationWeeks) : null;
      payload.is_bull  = isBull;
      payload.status   = status;
      if (status === 'MORT') {
        payload.death_date   = deathDate;
        payload.death_reason = deathReason;
      }
      if (status === 'VANDUT') {
        payload.sales_date  = salesDate;
        payload.client_name = clientName;
      }
      if (purpose) payload.purpose = purpose;
      payload.group_name      = groupName || '';
      payload.mother_ear_tag  = motherEarTag || '';
      payload.father_ear_tag  = fatherEarTag || '';
      payload.comment         = comment;

      await updateAnimal(earTag, payload);
      navigation.goBack();
    } catch (e: any) {
      setErrorMsg(e?.message ?? (ro ? 'Eroare la salvare' : 'Save failed'));
    } finally {
      setSaving(false);
      setPendingSave(false);
    }
  }, [
    earTagVal, earTag, company, birthDate, sex, color, bidaa, pedigree,
    breeding, purpose, gestation, gestationWeeks, isBull, status, deathDate,
    deathReason, salesDate, clientName, groupName, motherEarTag,
    fatherEarTag, comment, origAnimal, pendingSave, ro, navigation,
  ]);

  // Triggered after user confirms birth-date change
  useEffect(() => {
    if (pendingSave) doSave();
  }, [pendingSave]);

  const handleDeleteWeight = async (id: number) => {
    try {
      await deleteWeight(id);
      setWeighings(prev => prev.filter(w => w.id !== id));
    } catch (e: any) {
      setErrorMsg(e?.message ?? (ro ? 'Eroare la stergere' : 'Delete failed'));
    }
  };

  const handleAddWeight = async () => {
    const kg = parseFloat(newWeightKg.replace(',', '.'));
    if (!newWeightKg || isNaN(kg) || kg <= 0) {
      setErrorMsg(ro ? 'Introduceti o greutate valida' : 'Enter a valid weight');
      return;
    }
    if (!newWeightDate) {
      setErrorMsg(ro ? 'Selectati data' : 'Select a date');
      return;
    }
    setAddingWeight(true);
    try {
      await saveWeight({ ear_tag: earTag, weight_kg: kg, weighed_date: newWeightDate, comment: null });
      const updated = await fetchWeightHistory(earTag);
      setWeighings(updated.slice(0, 5));
      setNewWeightKg('');
      setNewWeightDate(new Date().toISOString().slice(0, 10));
    } catch (e: any) {
      setErrorMsg(e?.message ?? (ro ? 'Eroare la adaugare' : 'Failed to add weight'));
    } finally {
      setAddingWeight(false);
    }
  };

  if (pageLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <NavHeader title={ro ? 'Editare Animal' : 'Edit Animal'} onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ErrorModal message={errorMsg} onClose={() => setErrorMsg(null)} />
      <ConfirmModal
        message={confirmMsg}
        labelYes={ro ? 'Da' : 'Yes'}
        labelNo={ro ? 'Nu' : 'No'}
        onYes={() => { setConfirmMsg(null); setPendingSave(true); }}
        onNo={() => { setConfirmMsg(null); setPendingSave(false); }}
      />
      <SelectModal
        visible={showGroup}
        title={ro ? 'Selecteaza Grupa' : 'Select Group'}
        items={groups}
        selected={groupName}
        onSelect={setGroupName}
        onClose={() => setShowGroup(false)}
      />

      <NavHeader title={ro ? 'Editare Animal' : 'Edit Animal'} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── Ear Tag ── */}
        <FormField label={ro ? 'Crotaliu / Ear Tag' : 'Ear Tag / ID'}>
          <TextInput
            style={styles.textInput}
            value={earTagVal}
            onChangeText={setEarTagVal}
            autoCapitalize="characters"
            placeholder="RO000000000000"
            placeholderTextColor={Colors.border}
          />
        </FormField>

        {/* ── Company ── */}
        <FormField label={ro ? 'Companie' : 'Company'}>
          <ChipGroup
            options={COMPANIES as any}
            value={company as any}
            onChange={v => setCompany(v)}
          />
        </FormField>

        {/* ── Date of Birth ── */}
        <FormField label={ro ? 'Data Nasterii' : 'Date of Birth'}>
          <DateField
            value={birthDate}
            onChange={setBirthDate}
            min="2010-01-01"
            max={today}
          />
        </FormField>

        {/* ── Sex ── */}
        <FormField label={ro ? 'Sex' : 'Sex'}>
          <ChipGroup
            options={['M', 'F']}
            value={sex}
            onChange={setSex}
            labels={{ M: ro ? 'Mascul' : 'Male', F: ro ? 'Femela' : 'Female' }}
          />
        </FormField>

        {/* ── Color ── */}
        <FormField label={ro ? 'Culoare' : 'Color'}>
          <ChipGroup
            options={['Black', 'Red']}
            value={color}
            onChange={setColor}
            labels={{ Black: ro ? 'Negru' : 'Black', Red: ro ? 'Rosu' : 'Red' }}
          />
        </FormField>

        {/* ── Purpose ── */}
        <FormField label={ro ? 'Destinatie' : 'Purpose'}>
          <ChipGroup
            options={['reproductie', 'ingrasare']}
            value={purpose}
            onChange={setPurpose}
            labels={{ reproductie: ro ? 'Reproductie' : 'Reproduction', ingrasare: ro ? 'Ingrasare' : 'Fattening' }}
          />
        </FormField>

        {/* ── Toggles ── */}
        <View style={styles.card}>
          <ToggleRow
            label={ro ? 'Bidaa' : 'Bidaa'}
            value={bidaa}
            onChange={setBidaa}
          />
          <View style={styles.divider} />
          <ToggleRow
            label={ro ? 'Pedigree' : 'Pedigree'}
            value={pedigree}
            onChange={setPedigree}
          />
          {sex !== 'M' && (
            <>
              <View style={styles.divider} />
              <ToggleRow
                label={ro ? 'Matca (Breeding)' : 'Breeding (Matca)'}
                value={breeding}
                onChange={setBreeding}
              />
            </>
          )}
          {sex !== 'M' && (
            <>
              <View style={styles.divider} />
              <ToggleRow
                label={ro ? 'Gestanta (Pregnant)' : 'Pregnant (Gestanta)'}
                value={gestation}
                onChange={v => { setGestation(v); if (!v) setGestationWeeks(''); }}
              />
              {gestation && (
                <TextInput
                  style={[styles.textInput, { marginTop: 8 }]}
                  value={gestationWeeks}
                  onChangeText={setGestationWeeks}
                  keyboardType="decimal-pad"
                  placeholder={ro ? 'Saptamani gestatie' : 'Gestation weeks'}
                  placeholderTextColor={Colors.border}
                />
              )}
            </>
          )}
          {sex !== 'F' && (
            <>
              <View style={styles.divider} />
              <ToggleRow
                label={ro ? 'Taur (Bull)' : 'Bull (Taur)'}
                value={isBull}
                onChange={setIsBull}
              />
            </>
          )}
        </View>

        {/* ── Status ── */}
        <FormField label={ro ? 'Status' : 'Status'}>
          <ChipGroup
            options={['VIU', 'MORT', 'VANDUT']}
            value={status}
            onChange={v => setStatus(v as 'VIU' | 'MORT' | 'VANDUT')}
            labels={{ VIU: ro ? 'Viu' : 'Alive', MORT: ro ? 'Mort' : 'Dead', VANDUT: ro ? 'Vandut' : 'Sold' }}
          />
        </FormField>

        {status === 'MORT' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{ro ? 'Detalii Deces' : 'Death Details'}</Text>
            <FormField label={ro ? 'Data Decesului' : 'Death Date'}>
              <DateField value={deathDate} onChange={setDeathDate} max={today} />
            </FormField>
            <FormField label={ro ? 'Motivul Decesului' : 'Death Reason'}>
              <TextInput
                style={styles.textInput}
                value={deathReason}
                onChangeText={setDeathReason}
                placeholder={ro ? 'Motivul decesului' : 'Cause of death'}
                placeholderTextColor={Colors.border}
              />
            </FormField>
          </View>
        )}

        {status === 'VANDUT' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{ro ? 'Detalii Vanzare' : 'Sale Details'}</Text>
            <FormField label={ro ? 'Data Vanzarii' : 'Sale Date'}>
              <DateField value={salesDate} onChange={setSalesDate} max={today} />
            </FormField>
            <FormField label={ro ? 'Numele Clientului' : 'Client Name'}>
              <TextInput
                style={styles.textInput}
                value={clientName}
                onChangeText={setClientName}
                placeholder={ro ? 'Numele clientului' : 'Client name'}
                placeholderTextColor={Colors.border}
              />
            </FormField>
          </View>
        )}

        {/* ── Group ── */}
        <FormField label={ro ? 'Grupa' : 'Group'}>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setShowGroup(true)} activeOpacity={0.8}>
            <Text style={groupName ? styles.selectBtnTxt : styles.selectBtnPlaceholder}>
              {groupName || (ro ? 'Selecteaza...' : 'Select...')}
            </Text>
            <Text style={styles.selectChevron}>›</Text>
          </TouchableOpacity>
        </FormField>

        {/* ── Mother ── */}
        <FormField label={ro ? 'Mama (Crotaliu)' : 'Mother (Ear Tag)'}>
          <TextInput
            style={styles.textInput}
            value={motherEarTag}
            onChangeText={setMotherEarTag}
            autoCapitalize="characters"
            placeholder="RO000000000000"
            placeholderTextColor={Colors.border}
          />
        </FormField>

        {/* ── Father ── */}
        <FormField label={ro ? 'Tata (Crotaliu)' : 'Father (Ear Tag)'}>
          <TextInput
            style={styles.textInput}
            value={fatherEarTag}
            onChangeText={setFatherEarTag}
            autoCapitalize="characters"
            placeholder="RO000000000000"
            placeholderTextColor={Colors.border}
          />
        </FormField>

        {/* ── Weighings ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{ro ? 'Cantariri' : 'Weighings'}</Text>

          {/* New weight entry */}
          <View style={styles.addWeighRow}>
            <TextInput
              style={[styles.textInput, styles.weightInput]}
              value={newWeightKg}
              onChangeText={setNewWeightKg}
              keyboardType="decimal-pad"
              placeholder={ro ? 'kg' : 'kg'}
              placeholderTextColor={Colors.border}
            />
            <View style={styles.weightDateWrap}>
              <DateField
                value={newWeightDate}
                onChange={setNewWeightDate}
                max={today}
              />
            </View>
            {addingWeight ? (
              <ActivityIndicator size="small" color={Colors.primary} style={styles.addWeighBtn} />
            ) : (
              <TouchableOpacity style={styles.addWeighBtn} onPress={handleAddWeight} activeOpacity={0.8}>
                <Text style={styles.addWeighBtnTxt}>+</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.divider} />

          {/* Existing weighings */}
          {weighings.length === 0 ? (
            <Text style={styles.emptyTxt}>{ro ? 'Nu exista cantariri' : 'No weighings recorded'}</Text>
          ) : (
            weighings.map(w => (
              <View key={w.id} style={styles.weighRow}>
                <View style={styles.weighInfo}>
                  <Text style={styles.weighDate}>{w.weighed_date}</Text>
                  <Text style={styles.weighKg}>{w.weight_kg} kg</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteWeighBtn}
                  onPress={() => handleDeleteWeight(w.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.deleteWeighTxt}>×</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* ── Comment ── */}
        <FormField label={ro ? 'Comentariu' : 'Comment'}>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            placeholder={ro ? 'Comentariu optional...' : 'Optional comment...'}
            placeholderTextColor={Colors.border}
            textAlignVertical="top"
          />
        </FormField>

        {/* ── Save button ── */}
        {saving ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 8 }} />
        ) : (
          <TouchableOpacity style={styles.saveBtn} onPress={doSave} activeOpacity={0.8}>
            <Text style={styles.saveBtnTxt}>{ro ? 'Salveaza' : 'Save'}</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:                 { flex: 1, backgroundColor: Colors.background },
  centered:             { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content:              { padding: 16, gap: 14 },
  textInput:            {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textDark,
    backgroundColor: Colors.card,
  },
  textArea:             { minHeight: 90 },
  selectBtn:            {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.card,
  },
  selectBtnTxt:         { fontSize: 15, color: Colors.textDark, flex: 1 },
  selectBtnPlaceholder: { fontSize: 15, color: Colors.border, flex: 1 },
  selectChevron:        { fontSize: 20, color: Colors.textMuted, marginLeft: 8 },
  card:                 {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle:            { fontSize: 14, fontWeight: '700', color: Colors.textMuted, marginBottom: 2 },
  divider:              { height: 1, backgroundColor: Colors.border, marginVertical: 2 },
  weighRow:             { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  weighInfo:            { flex: 1, gap: 2 },
  weighDate:            { fontSize: 13, color: Colors.textMuted },
  weighKg:              { fontSize: 16, fontWeight: '700', color: Colors.textDark },
  deleteWeighBtn:       {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#C62828',
    alignItems: 'center', justifyContent: 'center',
  },
  deleteWeighTxt:       { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 26 },
  addWeighRow:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weightInput:          { width: 80, flex: 0 },
  weightDateWrap:       { flex: 1 },
  addWeighBtn:          {
    width: 44, height: 44, borderRadius: 8,
    backgroundColor: '#2E7D32',
    alignItems: 'center', justifyContent: 'center',
  },
  addWeighBtnTxt:       { color: '#fff', fontSize: 26, fontWeight: '700', lineHeight: 30 },
  emptyTxt:             { fontSize: 14, color: Colors.textMuted, fontStyle: 'italic' },
  saveBtn:              { backgroundColor: '#2E7D32', borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  saveBtnTxt:           { color: '#fff', fontSize: 17, fontWeight: '800' },
});
