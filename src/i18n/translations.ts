export type Lang = 'EN' | 'RO';

const T = {
  EN: {
    // Main Menu
    cattle: 'Cattle',
    feed: 'Feed',
    father: 'Father',
    // Cattle Menu
    back: 'back',
    view: 'View',
    birth: 'Birth',
    edit: 'Edit',
    sales: 'Sales',
    medical: 'Medical',
    deaths: 'Deaths',
    weight: 'Weight',
    groups: 'Groups',
    id: 'ID',
    pregnancy: 'Pregnancy',
    insemination: 'Insemination',
    // Scan Module
    scanTitle: 'Scan / Search',
    scanHint: 'Point camera at barcode',
    enterLast4: 'Enter last 4 digits of ID',
    search: 'Search',
    noIdFound: 'No valid ID found',
    multipleFound: 'More than 1 ID found',
    pleaseSelect: 'Please select an animal',
    alive: 'Alive',
    sold: 'Sold',
    dead: 'Dead',
    // Feed Menu
    feedTitle: 'Feed',
    comingSoon: 'Coming soon...',
  },
  RO: {
    cattle: 'Vaci',
    feed: 'Furaje',
    father: 'Tata',
    back: 'inapoi',
    view: 'Vizualizare',
    birth: 'Nastere',
    edit: 'Editare',
    sales: 'Vanzare',
    medical: 'Medicale',
    deaths: 'Decese',
    weight: 'Cantarire',
    groups: 'Grupe',
    id: 'Crotalii',
    pregnancy: 'Gestatie',
    insemination: 'Insamantare',
    scanTitle: 'Scanare / Cautare',
    scanHint: 'Indreptati camera spre cod de bare',
    enterLast4: 'Introduceti ultimele 4 cifre ale crotaliului',
    search: 'Cauta',
    noIdFound: 'Nu s-a gasit un crotaliu valid',
    multipleFound: 'S-au gasit mai multe crotalii',
    pleaseSelect: 'Selectati un animal',
    alive: 'Viu',
    sold: 'Vandut',
    dead: 'Decedat',
    feedTitle: 'Furaje',
    comingSoon: 'In curand...',
  },
} as const;

export type TranslationKey = keyof typeof T['EN'];

export default T;
