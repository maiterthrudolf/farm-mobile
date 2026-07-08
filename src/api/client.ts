import { Platform } from 'react-native';

function extractError(b: any, status: number): string {
  const d = b?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return d.map((e: any) => e.msg ?? JSON.stringify(e)).join(', ');
  return `HTTP ${status}`;
}

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const BASE_URL =
  Platform.OS === 'web'
    ? (isLocalhost ? 'http://localhost:8080' : 'http://18.193.35.22/farm')
    : 'http://18.193.35.22/farm';

export interface CattleSearchResult {
  ear_tag: string;
  race: string | null;
  sex: string | null;
  birth_date: string | null;
  status: string | null;
  group_name: string | null;
  color: string | null;
  company: string | null;
  bidaa: boolean | null;
  pedigree: string | null;  // 'yes' | 'no' | 'pending'
  neutered: boolean | null;
}

export interface CattleRecord {
  id: number;
  ear_tag: string;
  race: string | null;
  sex: string | null;
  birth_date: string | null;
  company: string | null;
  date_of_purchase: string | null;
  sales_date: string | null;
  death_date: string | null;
  death_reason: string | null;
  client_name: string | null;
  status: string | null;
  mother_ear_tag: string | null;
  father_ear_tag: string | null;
  father_ai_code: string | null;
  color: string | null;
  bidaa: boolean | null;
  pedigree: string | null;  // 'yes' | 'no' | 'pending'
  breeding: boolean | null;
  is_bull: boolean | null;
  neutered: boolean | null;
  purpose: string | null;
  gestation: boolean | null;
  gestation_weeks: number | null;
  gestation_check_date: string | null;
  conception_date: string | null;
  group_name: string | null;
  comment: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CalfRecord {
  ear_tag: string;
  birth_date: string | null;
  status: string | null;
  sex: string | null;
}

export async function searchByLast4(last4: string): Promise<CattleSearchResult[]> {
  const res = await fetch(`${BASE_URL}/api/cattle/search?last4=${last4}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchByTag(earTag: string): Promise<CattleRecord> {
  const res = await fetch(`${BASE_URL}/api/cattle/by-tag/${encodeURIComponent(earTag)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export interface IdCheckResult {
  exists: boolean;
  where: 'animal' | 'unallocated' | null;
  company: string | null;
}

// ── Birth module ─────────────────────────────────────────────────────────────

export interface UnallocatedResult {
  ear_tag: string;
  company: string;
}

export interface MotherInfo {
  ear_tag: string;
  sex: string | null;
  company: string | null;
  birth_date: string | null;
  color: string | null;
  bidaa: boolean | null;
  pedigree: string | null;
  gestation: boolean | null;
  gestation_weeks: number | null;
  group_name: string | null;
}

export async function searchUnallocatedByLast4(last4: string): Promise<UnallocatedResult[]> {
  const res = await fetch(`${BASE_URL}/api/births/check-newborn?last4=${last4}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function searchMotherByLast4(last4: string): Promise<MotherInfo[]> {
  const res = await fetch(`${BASE_URL}/api/births/check-mother?last4=${last4}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function saveBirth(data: {
  ear_tag: string; company: string | null; birth_date: string;
  sex: string; color: string; comment: string | null;
  mother_ear_tag: string | null; no_id: boolean; neutered?: boolean;
}): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/births/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function checkEarTag(earTag: string): Promise<IdCheckResult> {
  const res = await fetch(`${BASE_URL}/api/ids/check/${encodeURIComponent(earTag)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function saveUnallocatedId(earTag: string, company: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/ids/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ear_tag: earTag, company }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

// ── Death module ──────────────────────────────────────────────────────────────

export interface DeathAnimalInfo {
  ear_tag: string;
  sex: string | null;
  company: string | null;
  birth_date: string | null;
  color: string | null;
  bidaa: boolean | null;
  pedigree: string | null;
  neutered: boolean | null;
  status: string | null;
  group_name: string | null;
}

export async function searchDeathAnimalByLast4(last4: string): Promise<DeathAnimalInfo[]> {
  const res = await fetch(`${BASE_URL}/api/deaths/check-animal?last4=${last4}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function saveDeath(data: {
  ear_tag: string; death_date: string; death_reason: string; comment: string | null;
}): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/deaths/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

// ── Weight module ─────────────────────────────────────────────────────────────

export interface WeighAnimalInfo {
  ear_tag: string;
  sex: string | null;
  company: string | null;
  birth_date: string | null;
  color: string | null;
  bidaa: boolean | null;
  pedigree: string | null;
  neutered: boolean | null;
  status: string | null;
  group_name: string | null;
  comment: string | null;
}

export interface WeightEntry {
  id: number;
  weight_kg: number;
  weighed_date: string;
}

export async function searchWeighAnimalByLast4(last4: string): Promise<WeighAnimalInfo[]> {
  const res = await fetch(`${BASE_URL}/api/weights/check-animal?last4=${last4}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchWeightHistory(earTag: string): Promise<WeightEntry[]> {
  const res = await fetch(`${BASE_URL}/api/weights/history/${encodeURIComponent(earTag)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function saveWeight(data: {
  ear_tag: string; weight_kg: number; weighed_date: string; comment: string | null;
}): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/weights/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

// ── Sales module ──────────────────────────────────────────────────────────────

export interface SaleList {
  id: number; name: string; authorized: boolean; animal_count: number; created_at: string;
}

export interface SaleAnimalInfo {
  ear_tag: string; sex: string | null; company: string | null; birth_date: string | null;
  color: string | null; bidaa: boolean | null; pedigree: string | null;
  neutered: boolean | null; status: string | null; group_name: string | null;
}

export interface SaleListAnimal {
  ear_tag: string; sex: string | null; company: string | null; birth_date: string | null;
  color: string | null; status: string | null; group_name: string | null; weight_kg: number | null;
}

export async function fetchSaleLists(): Promise<SaleList[]> {
  const res = await fetch(`${BASE_URL}/api/sales/lists`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function createSaleList(name: string): Promise<{ id: number; name: string }> {
  const res = await fetch(`${BASE_URL}/api/sales/create-list`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function searchSaleAnimalByLast4(last4: string): Promise<SaleAnimalInfo[]> {
  const res = await fetch(`${BASE_URL}/api/sales/check-animal?last4=${last4}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function addAnimalToList(listId: number, earTag: string, weightKg: number | null): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/sales/add-animal`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ list_id: listId, ear_tag: earTag, weight_kg: weightKg }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function removeAnimalFromList(listId: number, earTag: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/sales/remove-animal?list_id=${listId}&ear_tag=${encodeURIComponent(earTag)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function fetchSaleListAnimals(listId: number): Promise<SaleListAnimal[]> {
  const res = await fetch(`${BASE_URL}/api/sales/list/${listId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function authorizeSaleList(listId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/sales/authorize/${listId}`, { method: 'POST' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function deleteSaleList(listId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/sales/delete-list/${listId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function fetchCalves(motherEarTag: string): Promise<CalfRecord[]> {
  const res = await fetch(`${BASE_URL}/api/cattle/calves/${encodeURIComponent(motherEarTag)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Pregnancy ─────────────────────────────────────────────────────────────────

export interface PregnancyAnimalInfo {
  ear_tag: string;
  sex: string | null;
  company: string | null;
  birth_date: string | null;
  color: string | null;
  bidaa: boolean | null;
  pedigree: string | null;
  gestation: boolean | null;
  gestation_weeks: number | null;
  group_name: string | null;
  comment: string | null;
}

export interface PregnancyTodayStats {
  pregnant: number;
  not_pregnant: number;
}

export async function searchPregnancyAnimalByLast4(last4: string): Promise<PregnancyAnimalInfo[]> {
  const res = await fetch(`${BASE_URL}/api/pregnancy/check-animal?last4=${last4}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchPregnancyTodayStats(): Promise<PregnancyTodayStats> {
  const res = await fetch(`${BASE_URL}/api/pregnancy/today-stats`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function recordPregnancy(earTag: string, pregnant: boolean, gestationWeeks: number | null, comment: string | null): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/pregnancy/record`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ear_tag: earTag, pregnant, gestation_weeks: gestationWeeks, comment: comment || null }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

// ── Insemination ──────────────────────────────────────────────────────────────

export interface InseminationAnimalInfo {
  ear_tag: string;
  sex: string | null;
  company: string | null;
  birth_date: string | null;
  color: string | null;
  bidaa: boolean | null;
  pedigree: string | null;
  gestation: boolean | null;
  gestation_weeks: number | null;
  group_name: string | null;
  comment: string | null;
  prepared: boolean | null;
  inseminated: boolean | null;
  prepared_date: string | null;
  inseminated_date: string | null;
  bull_name: string | null;
}

export interface Bull {
  id: number;
  name: string;
  code: string;
  used: boolean;
}

export async function fetchInseminationStats(): Promise<{ prepared_last_3_weeks: number }> {
  const res = await fetch(`${BASE_URL}/api/insemination/stats`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchBulls(): Promise<Bull[]> {
  const res = await fetch(`${BASE_URL}/api/insemination/bulls`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function editBull(id: number, name: string, code: string): Promise<Bull> {
  const res = await fetch(`${BASE_URL}/api/insemination/bulls/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, code }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function deleteBull(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/insemination/bulls/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
}

export async function addBull(name: string, code: string): Promise<Bull> {
  const res = await fetch(`${BASE_URL}/api/insemination/bulls/add`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, code }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchPreparedList(): Promise<InseminationAnimalInfo[]> {
  const res = await fetch(`${BASE_URL}/api/insemination/list-prepared`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchInseminatedList(): Promise<InseminationAnimalInfo[]> {
  const res = await fetch(`${BASE_URL}/api/insemination/list-inseminated`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function searchPrepareAnimalByLast4(last4: string): Promise<InseminationAnimalInfo[]> {
  const res = await fetch(`${BASE_URL}/api/insemination/check-prepare?last4=${last4}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function saveInseminationComment(earTag: string, comment: string | null): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/insemination/save-comment`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ear_tag: earTag, comment }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function recordPrepare(earTag: string, comment: string | null): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/insemination/prepare`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ear_tag: earTag, comment }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function searchInseminateAnimalByLast4(last4: string): Promise<InseminationAnimalInfo[]> {
  const res = await fetch(`${BASE_URL}/api/insemination/check-inseminate?last4=${last4}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function recordInseminate(earTag: string, comment: string | null, bullId: number | null): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/insemination/inseminate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ear_tag: earTag, comment, bull_id: bullId }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

// ── Groups ────────────────────────────────────────────────────────────────────

export interface GroupOverview {
  group_name: string;
  total: number;
  vaci: number;
  juninci: number;
  tauri: number;
  tauras: number;
  mascul: number;
}

export interface BullInGroup {
  ear_tag: string;
  bull_name: string | null;
  entry_date: string | null;
  days: number | null;
  birth_date: string | null;
  color: string | null;
}

export interface GroupDetails extends GroupOverview {
  bulls: BullInGroup[];
}

export interface GroupAnimal {
  ear_tag: string;
  sex: string | null;
  birth_date: string | null;
  color: string | null;
  company: string | null;
  bull_name: string | null;
  category: string | null;
}

export async function fetchGroupsOverview(): Promise<GroupOverview[]> {
  const res = await fetch(`${BASE_URL}/api/groups/overview`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchGroupDetails(groupName: string): Promise<GroupDetails> {
  const res = await fetch(`${BASE_URL}/api/groups/details?group=${encodeURIComponent(groupName)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function searchGroupAddAnimal(last4: string, groupName: string): Promise<GroupAnimal[]> {
  const res = await fetch(`${BASE_URL}/api/groups/check-add?last4=${last4}&group=${encodeURIComponent(groupName)}`);
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(extractError(b, res.status)); }
  return res.json();
}

export async function searchGroupRemoveAnimal(last4: string, groupName: string): Promise<GroupAnimal[]> {
  const res = await fetch(`${BASE_URL}/api/groups/check-remove?last4=${last4}&group=${encodeURIComponent(groupName)}`);
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(extractError(b, res.status)); }
  return res.json();
}

export async function addAnimalToGroup(earTag: string, groupName: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/groups/add-animal`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ear_tag: earTag, group_name: groupName }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function removeAnimalFromGroup(earTag: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/groups/remove-animal`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ear_tag: earTag }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function fetchGroupList(groupName: string): Promise<GroupAnimal[]> {
  const res = await fetch(`${BASE_URL}/api/groups/list?group=${encodeURIComponent(groupName)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchGroupBulls(): Promise<GroupAnimal[]> {
  const res = await fetch(`${BASE_URL}/api/groups/bulls`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function searchBullEligible(last4: string): Promise<GroupAnimal[]> {
  const res = await fetch(`${BASE_URL}/api/groups/bulls/search?last4=${last4}`);
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(extractError(b, res.status)); }
  return res.json();
}

export async function addGroupBull(earTag: string, bullName: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/groups/bulls/add`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ear_tag: earTag, bull_name: bullName }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function removeGroupBull(earTag: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/groups/bulls/${encodeURIComponent(earTag)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

// ── Medical ──────────────────────────────────────────────────────────────────

export interface MedicalProcedure {
  id: number;
  procedure_type: string;
  medication_name: string;
  begin_period: string;
  end_period: string;
  animal_count: number;
}

export interface MedicalRecord {
  id: number;
  record_type: string;
  procedure_type: string | null;
  medication_name: string | null;
  treatments: string | null;
  treatment_date: string;
  comment: string | null;
  weight: number | null;
}

export interface MedicalAnimalInfo {
  ear_tag: string;
  sex: string | null;
  birth_date: string | null;
  group_name: string | null;
  status: string | null;
  color: string | null;
  last_records: MedicalRecord[];
}

export async function fetchMedicalProcedures(): Promise<MedicalProcedure[]> {
  const res = await fetch(`${BASE_URL}/api/medical/procedures`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchProcedureTypes(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/api/medical/procedure-types`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function createMedicalProcedure(data: {
  procedure_type: string;
  medication_name: string;
  begin_period: string;
  end_period: string;
  comment?: string;
}): Promise<MedicalProcedure> {
  const res = await fetch(`${BASE_URL}/api/medical/procedures`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(extractError(b, res.status)); }
  return res.json();
}

export interface MedicalHistoryRecord {
  id: number;
  ear_tag: string;
  record_type: string;
  procedure_type: string | null;
  medication_name: string | null;
  treatments: string | null;
  treatment_date: string;
  comment: string | null;
  weight: number | null;
}

export async function fetchMedicalHistory(earTag?: string): Promise<MedicalHistoryRecord[]> {
  const url = earTag
    ? `${BASE_URL}/api/medical/history?ear_tag=${encodeURIComponent(earTag)}`
    : `${BASE_URL}/api/medical/history`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function updateMedicalProcedure(id: number, data: {
  procedure_type: string;
  medication_name: string;
  begin_period: string;
  end_period: string;
  comment?: string;
}): Promise<MedicalProcedure> {
  const res = await fetch(`${BASE_URL}/api/medical/procedures/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(extractError(b, res.status)); }
  return res.json();
}

export async function deleteMedicalProcedure(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/medical/procedures/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function fetchLastProcedureRecord(earTag: string, procedureId: number): Promise<{ comment: string | null; weight: number | null }> {
  const res = await fetch(`${BASE_URL}/api/medical/animal-procedure-record?ear_tag=${encodeURIComponent(earTag)}&procedure_id=${procedureId}`);
  if (!res.ok) return { comment: null, weight: null };
  return res.json();
}

export async function checkMedicalAnimal(last4: string): Promise<MedicalAnimalInfo> {
  const res = await fetch(`${BASE_URL}/api/medical/check?last4=${last4}`);
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(extractError(b, res.status)); }
  return res.json();
}

export async function recordMedicalProcedure(data: {
  ear_tag: string;
  procedure_id: number;
  comment?: string;
  weight?: number;
}): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/medical/record-procedure`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(extractError(b, res.status)); }
}

// ── Edit ──────────────────────────────────────────────────────────────────────

export interface EditAnimalData {
  new_ear_tag?: string;
  company?: string;
  birth_date?: string;
  sex?: string;
  color?: string;
  bidaa?: boolean;
  pedigree?: string;
  breeding?: boolean;
  purpose?: string;
  gestation?: boolean;
  gestation_weeks?: number | null;
  is_bull?: boolean;
  status?: string;
  death_date?: string;
  death_reason?: string;
  sales_date?: string;
  client_name?: string;
  group_name?: string;
  mother_ear_tag?: string;
  father_ear_tag?: string;
  comment?: string;
}

export async function fetchEditFormData(): Promise<{ companies: string[]; groups: string[] }> {
  const res = await fetch(`${BASE_URL}/api/edit/form-data`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function updateAnimal(earTag: string, data: EditAnimalData): Promise<{ ear_tag: string }> {
  const res = await fetch(`${BASE_URL}/api/edit/${encodeURIComponent(earTag)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export interface CreateAnimalData {
  ear_tag: string;
  company?: string;
  birth_date?: string;
  sex?: string;
  color?: string;
  race?: string;
  bidaa?: boolean;
  pedigree?: string;
  breeding?: boolean;
  purpose?: string;
  is_bull?: boolean;
  status?: string;
  death_date?: string;
  death_reason?: string;
  sales_date?: string;
  client_name?: string;
  group_name?: string;
  mother_ear_tag?: string;
  father_ear_tag?: string;
  comment?: string;
  initial_weight_kg?: number | null;
  initial_weight_date?: string | null;
}

export async function createAnimal(data: CreateAnimalData): Promise<{ ear_tag: string }> {
  const res = await fetch(`${BASE_URL}/api/edit/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function deleteWeight(weightId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/edit/weight/${weightId}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
}

// ── Father ────────────────────────────────────────────────────────────────────

export interface CalfItem {
  ear_tag: string;
  birth_date: string | null;
  mother_ear_tag: string | null;
  sex: string | null;
  group_name: string | null;
  comment: string | null;
}

export interface BullCandidate {
  ear_tag: string;
  bull_name: string | null;
  color: string | null;
  source: string;
  ai_bull_name: string | null;
  ai_bull_code: string | null;
}

export interface FatherCandidates {
  natural_bulls: BullCandidate[];
  ai_donor: BullCandidate | null;
}

export async function fetchFatherList(): Promise<CalfItem[]> {
  const res = await fetch(`${BASE_URL}/api/father/list`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchFatherCandidates(calfEarTag: string): Promise<FatherCandidates> {
  const res = await fetch(`${BASE_URL}/api/father/candidates?calf_ear_tag=${encodeURIComponent(calfEarTag)}`);
  if (!res.ok) return { natural_bulls: [], ai_donor: null };
  return res.json();
}

export async function assignFather(calfEarTag: string, fatherEarTag: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/father/assign`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ calf_ear_tag: calfEarTag, father_ear_tag: fatherEarTag }),
  });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(extractError(b, res.status)); }
}

export async function skipFather(earTag: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/father/skip`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ear_tag: earTag }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function recordIndividualTreatment(data: {
  ear_tag: string;
  treatments: string;
  treatment_date: string;
  comment?: string;
  neutered_set?: boolean;
}): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/medical/record-individual`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(extractError(b, res.status)); }
}

// ── Feed: Bales ───────────────────────────────────────────────────────────────

export interface BaleStatRow { bale_type: string; count: number; total_kg?: number }
export interface BaleStats   { today: BaleStatRow[]; year: BaleStatRow[] }

export async function fetchBaleProductionFormData(): Promise<{ areas: string[]; bale_types: string[]; weights: number[] }> {
  const res = await fetch(`${BASE_URL}/api/feed/bales/production/form-data`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
export async function addBaleProduction(data: { area: string; bale_type: string; weight_kg: number; count: number; production_date: string }): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/feed/bales/production`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(extractError(b, res.status)); }
}
export async function fetchBaleProductionStats(): Promise<BaleStats> {
  const res = await fetch(`${BASE_URL}/api/feed/bales/production/stats`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchBaleEntryFormData(): Promise<{ bale_types: string[]; weights: number[] }> {
  const res = await fetch(`${BASE_URL}/api/feed/bales/entry/form-data`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
export async function addBaleEntry(data: { bale_type: string; weight_kg: number; count: number; is_purchased: boolean; entry_date: string }): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/feed/bales/entry`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(extractError(b, res.status)); }
}
export async function fetchBaleEntryStats(): Promise<BaleStats> {
  const res = await fetch(`${BASE_URL}/api/feed/bales/entry/stats`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchBaleConsumptionFormData(): Promise<{ bale_types: string[]; weights: number[] }> {
  const res = await fetch(`${BASE_URL}/api/feed/bales/consumption/form-data`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
export async function addBaleConsumption(data: { bale_type: string; weight_kg: number; count: number; from_field: boolean; entry_date: string }): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/feed/bales/consumption`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(extractError(b, res.status)); }
}
export async function fetchBaleConsumptionStats(): Promise<BaleStats> {
  const res = await fetch(`${BASE_URL}/api/feed/bales/consumption/stats`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Feed: Cereals ─────────────────────────────────────────────────────────────

export interface CerealStatRow { cereal_type: string; total_kg: number }
export interface CerealStats   { today: CerealStatRow[]; year: CerealStatRow[] }

export async function fetchCerealProductionFormData(): Promise<{ areas: string[]; cereal_types: string[] }> {
  const res = await fetch(`${BASE_URL}/api/feed/cereals/production/form-data`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
export async function addCerealProduction(data: { area?: string | null; cereal_type: string; harvest_kg: number; is_purchased?: boolean; supplier?: string | null; production_date: string }): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/feed/cereals/production`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(extractError(b, res.status)); }
}
export async function fetchCerealProductionStats(): Promise<CerealStats> {
  const res = await fetch(`${BASE_URL}/api/feed/cereals/production/stats`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function addCerealConsumption(data: { cereal_type: string; consumption_kg: number; consumption_date: string }): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/feed/cereals/consumption`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(extractError(b, res.status)); }
}
export async function fetchCerealConsumptionStats(): Promise<CerealStats> {
  const res = await fetch(`${BASE_URL}/api/feed/cereals/consumption/stats`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function addCerealSale(data: { cereal_type: string; sale_kg: number; client: string; sale_date: string }): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/feed/cereals/sale`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(extractError(b, res.status)); }
}
export async function fetchCerealSaleStats(): Promise<CerealStats> {
  const res = await fetch(`${BASE_URL}/api/feed/cereals/sale/stats`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export interface CerealStockRow { cereal_type: string; stock_kg: number }

export async function fetchCerealStock(): Promise<CerealStockRow[]> {
  const res = await fetch(`${BASE_URL}/api/feed/cereals/stock`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export interface BaleStockRow {
  bale_type:   string;
  total_count: number; total_kg:  number;
  field_count: number; field_kg:  number;
  farm_count:  number; farm_kg:   number;
}

export async function fetchBaleStock(): Promise<BaleStockRow[]> {
  const res = await fetch(`${BASE_URL}/api/feed/bales/stock`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchAvailableWeights(bale_type: string, location: 'field' | 'farm'): Promise<number[]> {
  const res = await fetch(`${BASE_URL}/api/feed/bales/available-weights?bale_type=${encodeURIComponent(bale_type)}&location=${location}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
