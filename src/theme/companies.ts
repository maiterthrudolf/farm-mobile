import { Lang } from '../i18n/translations';

export interface CompanyDef {
  short: string;
  bg: string;
  text: string;
}

export const COMPANIES: Record<string, CompanyDef> = {
  APOLLO: { short: 'Apollo', bg: '#2E7D32', text: '#fff' },  // grün
  ARES:   { short: 'Ares',   bg: '#F9A825', text: '#000' },  // gelb
  ATLAS:  { short: 'Atlas',  bg: '#E65100', text: '#fff' },  // orange
  AFM:    { short: 'AFM',    bg: '#1565C0', text: '#fff' },  // blau
};

export function getCompany(fullName: string | null): CompanyDef | null {
  if (!fullName) return null;
  const u = fullName.toUpperCase();
  if (u.includes('APOLLO')) return COMPANIES.APOLLO;
  if (u.includes('ATLAS'))  return COMPANIES.ATLAS;
  if (u.includes('AFM') || u.includes('ANGUS FACILITY')) return COMPANIES.AFM;
  if (u.includes('ARES'))   return COMPANIES.ARES;
  return null;
}

export function getColorName(code: string | null, lang: Lang): string {
  if (!code) return '—';
  const u = code.toUpperCase();
  if (u === 'BLACK' || u === 'N') return lang === 'RO' ? 'Negru' : 'Black';
  if (u === 'RED'   || u === 'R') return lang === 'RO' ? 'Rosu'  : 'Red';
  return code;
}

// simplified 4-category system for card headers — finer granularity lives in animalType()
// breeding=true upgrades female <24M to Cow; isBull=true upgrades male <24M to Bull
export function categoryLabel(sex: string | null, ageMonths: number, lang: string, breeding?: boolean, isBull?: boolean): string {
  const ro = lang === 'RO';
  if (sex === 'F') {
    const isCow = ageMonths >= 24 || breeding;
    return isCow ? (ro ? 'Vaca' : 'Cow') : (ro ? 'Juninca' : 'Heifer');
  }
  if (sex === 'M') {
    const isBullClass = ageMonths >= 24 || isBull;
    return isBullClass ? (ro ? 'Taur' : 'Bull') : (ro ? 'Vitel' : 'Young Bull');
  }
  return '?';
}

// orange/red/brown/black — at-a-glance livestock type identification on card headers
export function categoryColor(sex: string | null, ageMonths: number, breeding?: boolean, isBull?: boolean): string {
  if (sex === 'F') return (ageMonths >= 24 || breeding) ? '#C62828' : '#E65100';
  if (sex === 'M') return (ageMonths >= 24 || isBull)   ? '#212121' : '#6D4C41';
  return '#757575';
}
