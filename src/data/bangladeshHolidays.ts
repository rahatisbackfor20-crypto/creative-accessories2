export interface BangladeshHolidayItem {
  id: string;
  nameBn: string;
  nameEn: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  daysCount: number;
  type: 'general' | 'executive' | 'optional' | 'factory';
  category: 'national' | 'muslim' | 'hindu' | 'buddhist' | 'christian' | 'factory';
  descriptionBn: string;
  descriptionEn: string;
}

export const OFFICIAL_BANGLADESH_HOLIDAYS: BangladeshHolidayItem[] = [
  // 2025 Holidays
  {
    id: 'bd-2025-02-15',
    nameBn: 'পবিত্র শবে বরাত',
    nameEn: 'Shab-e-Barat',
    date: '2025-02-15',
    daysCount: 1,
    type: 'executive',
    category: 'muslim',
    descriptionBn: 'চাঁদ দেখা সাপেক্ষে পবিত্র শবে বরাত উপলক্ষে সরকারি ছুটি।',
    descriptionEn: 'Public holiday on the occasion of holy Shab-e-Barat subject to moon sighting.'
  },
  {
    id: 'bd-2025-02-21',
    nameBn: 'শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস',
    nameEn: 'Shaheed Day & International Mother Language Day',
    date: '2025-02-21',
    daysCount: 1,
    type: 'general',
    category: 'national',
    descriptionBn: 'ভাষা আন্দোলনের বীর শহীদদের স্মরণে জাতীয় সাধারণ ছুটি।',
    descriptionEn: 'National holiday commemorating the martyrs of the 1952 Language Movement.'
  },
  {
    id: 'bd-2025-03-26',
    nameBn: 'স্বাধীনতা ও জাতীয় দিবস',
    nameEn: 'Independence & National Day',
    date: '2025-03-26',
    daysCount: 1,
    type: 'general',
    category: 'national',
    descriptionBn: 'মহান স্বাধীনতা ও জাতীয় দিবস উপলক্ষে সাধারণ ছুটি।',
    descriptionEn: 'National holiday celebrating the Independence of Bangladesh.'
  },
  {
    id: 'bd-2025-03-27',
    nameBn: 'পবিত্র শব-ই-কদর',
    nameEn: 'Shab-e-Qadr',
    date: '2025-03-27',
    daysCount: 1,
    type: 'executive',
    category: 'muslim',
    descriptionBn: 'পবিত্র লাইলাতুল কদর উপলক্ষে সরকারি ছুটি।',
    descriptionEn: 'Public holiday for the Holy Night of Decree (Lailatul Qadr).'
  },
  {
    id: 'bd-2025-03-28',
    nameBn: 'জুমাতুল বিদা',
    nameEn: 'Jumatul Wida',
    date: '2025-03-28',
    daysCount: 1,
    type: 'general',
    category: 'muslim',
    descriptionBn: 'রমজানুল মোবারকের শেষ শুক্রবার জুমাতুল বিদা উপলক্ষে ছুটি।',
    descriptionEn: 'Holiday for the last Friday of the holy month of Ramadan.'
  },
  {
    id: 'bd-2025-03-29',
    nameBn: 'পবিত্র ঈদ-উল-ফিতর (৩ দিনের ছুটি)',
    nameEn: 'Eid-ul-Fitr Holidays',
    date: '2025-03-29',
    endDate: '2025-04-02',
    daysCount: 5,
    type: 'general',
    category: 'muslim',
    descriptionBn: 'মুসলমানদের সর্ববৃহৎ ধর্মীয় উৎসব পবিত্র ঈদ-উল-ফিতর উপলক্ষে সরকারি ও কারখানা ছুটি।',
    descriptionEn: 'Official government and factory holidays for the grand festival of Eid-ul-Fitr.'
  },
  {
    id: 'bd-2025-04-14',
    nameBn: 'বাংলা নববর্ষ / পহেলা বৈশাখ',
    nameEn: 'Bengali New Year (Pohela Boishakh)',
    date: '2025-04-14',
    daysCount: 1,
    type: 'general',
    category: 'national',
    descriptionBn: 'বাংলা নববর্ষ উপলক্ষে জাতীয় উৎসব ও সাধারণ ছুটি।',
    descriptionEn: 'National public holiday celebrating the first day of the Bengali calendar.'
  },
  {
    id: 'bd-2025-05-01',
    nameBn: 'মে দিবস / আন্তর্জাতিক শ্রমিক দিবস',
    nameEn: 'May Day / International Workers Day',
    date: '2025-05-01',
    daysCount: 1,
    type: 'general',
    category: 'national',
    descriptionBn: 'বিশ্ব শ্রমিক দিবস ও মে দিবস উপলক্ষে কারখানা ও সরকারি ছুটি।',
    descriptionEn: 'International Workers Day holiday observed nationwide in factories and offices.'
  },
  {
    id: 'bd-2025-05-11',
    nameBn: 'শুভ বুদ্ধ পূর্ণিমা (বৈশাখী পূর্ণিমা)',
    nameEn: 'Buddha Purnima',
    date: '2025-05-11',
    daysCount: 1,
    type: 'general',
    category: 'buddhist',
    descriptionBn: 'গৌতম বুদ্ধের জন্ম ও জ্ঞানলাভ উপলক্ষে সরকারি সাধারণ ছুটি।',
    descriptionEn: 'Public holiday celebrating the birth, enlightenment, and death of Gautama Buddha.'
  },
  {
    id: 'bd-2025-06-05',
    nameBn: 'পবিত্র ঈদ-উল-আযহা (কোরবানি ঈদ)',
    nameEn: 'Eid-ul-Adha Holidays',
    date: '2025-06-05',
    endDate: '2025-06-09',
    daysCount: 5,
    type: 'general',
    category: 'muslim',
    descriptionBn: 'পবিত্র কোরবানি ঈদ উপলক্ষে সরকারি ও কারখানা ছুটি।',
    descriptionEn: 'Government and factory holidays for the Feast of the Sacrifice (Eid-ul-Adha).'
  },
  {
    id: 'bd-2025-07-06',
    nameBn: 'পবিত্র আশুরা (১০ই মহররম)',
    nameEn: 'Ashura',
    date: '2025-07-06',
    daysCount: 1,
    type: 'executive',
    category: 'muslim',
    descriptionBn: 'পবিত্র ১০ই মহররম কারবালার শোকাবহ স্মৃতি ও আশুরা উপলক্ষে ছুটি।',
    descriptionEn: 'Public holiday marking the 10th of Muharram.'
  },
  {
    id: 'bd-2025-08-16',
    nameBn: 'শুভ জন্মাষ্টমী',
    nameEn: 'Janmashtami',
    date: '2025-08-16',
    daysCount: 1,
    type: 'general',
    category: 'hindu',
    descriptionBn: 'শ্রীকৃষ্ণের জন্মতিথি উপলক্ষে সাধারণ ছুটি।',
    descriptionEn: 'Public holiday celebrating the birth of Lord Sri Krishna.'
  },
  {
    id: 'bd-2025-09-05',
    nameBn: 'পবিত্র ঈদে মিলাদুন্নবী (সা.)',
    nameEn: 'Eid-e-Miladunnabi',
    date: '2025-09-05',
    daysCount: 1,
    type: 'general',
    category: 'muslim',
    descriptionBn: 'মহানবী হযরত মুহাম্মদ (সা.)-এর শুভ জন্মদিন ও ওফাত উপলক্ষে সরকারি ছুটি।',
    descriptionEn: 'Public holiday observing the birth and demise of Prophet Muhammad (PBUH).'
  },
  {
    id: 'bd-2025-10-02',
    nameBn: 'শারদীয় দুর্গাপূজা (বিজয়া দশমী)',
    nameEn: 'Durga Puja (Bijoya Dashami)',
    date: '2025-10-01',
    endDate: '2025-10-02',
    daysCount: 2,
    type: 'general',
    category: 'hindu',
    descriptionBn: 'সনাতন ধর্মাবলম্বীদের বৃহত্তম উৎসব দুর্গাপূজার মহানবমী ও বিজয়া দশমী উপলক্ষে ছুটি।',
    descriptionEn: 'Grand Hindu festival holiday for Maha Nabami and Bijoya Dashami.'
  },
  {
    id: 'bd-2025-12-16',
    nameBn: 'মহান বিজয় দিবস',
    nameEn: 'Victory Day',
    date: '2025-12-16',
    daysCount: 1,
    type: 'general',
    category: 'national',
    descriptionBn: 'বাঙালি জাতির ১৯৭১-এর মহান মুক্তিযুদ্ধের বিজয়ের স্মারক জাতীয় সাধারণ ছুটি।',
    descriptionEn: 'National Victory Day commemorating the victory in the 1971 Liberation War.'
  },
  {
    id: 'bd-2025-12-25',
    nameBn: 'যিশু খ্রিস্টের জন্মদিন / শুভ বড়দিন',
    nameEn: 'Christmas Day',
    date: '2025-12-25',
    daysCount: 1,
    type: 'general',
    category: 'christian',
    descriptionBn: 'যিশু খ্রিস্টের জন্মোৎসব ও খ্রিস্টান ধর্মাবলম্বীদের শুভ বড়দিন উপলক্ষে ছুটি।',
    descriptionEn: 'Public holiday celebrating the Nativity of Jesus Christ (Christmas).'
  },

  // 2026 Holidays (Official Gazette projected)
  {
    id: 'bd-2026-02-04',
    nameBn: 'পবিত্র শবে বরাত',
    nameEn: 'Shab-e-Barat',
    date: '2026-02-04',
    daysCount: 1,
    type: 'executive',
    category: 'muslim',
    descriptionBn: 'পবিত্র শবে বরাত উপলক্ষে সরকারি ছুটি।',
    descriptionEn: 'Public holiday on the occasion of Shab-e-Barat.'
  },
  {
    id: 'bd-2026-02-21',
    nameBn: 'শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস',
    nameEn: 'Shaheed Day & International Mother Language Day',
    date: '2026-02-21',
    daysCount: 1,
    type: 'general',
    category: 'national',
    descriptionBn: 'ভাষা আন্দোলনের বীর শহীদদের স্মরণে জাতীয় সাধারণ ছুটি।',
    descriptionEn: 'National holiday commemorating the language martyrs of Bangladesh.'
  },
  {
    id: 'bd-2026-03-17',
    nameBn: 'পবিত্র শব-ই-কদর',
    nameEn: 'Shab-e-Qadr',
    date: '2026-03-17',
    daysCount: 1,
    type: 'executive',
    category: 'muslim',
    descriptionBn: 'পবিত্র লাইলাতুল কদর উপলক্ষে সরকারি ছুটি।',
    descriptionEn: 'Public holiday for the Holy Night of Destiny (Shab-e-Qadr).'
  },
  {
    id: 'bd-2026-03-20',
    nameBn: 'পবিত্র ঈদ-উল-ফিতর (৩ থেকে ৫ দিন)',
    nameEn: 'Eid-ul-Fitr Holidays',
    date: '2026-03-19',
    endDate: '2026-03-23',
    daysCount: 5,
    type: 'general',
    category: 'muslim',
    descriptionBn: 'পবিত্র ঈদ-উল-ফিতর উপলক্ষে সরকারি ও কারখানা দীর্ঘ বাৎসরিক ছুটি।',
    descriptionEn: 'Major holiday festival of Eid-ul-Fitr observed across government and factories.'
  },
  {
    id: 'bd-2026-03-26',
    nameBn: 'মহান স্বাধীনতা ও জাতীয় দিবস',
    nameEn: 'Independence & National Day',
    date: '2026-03-26',
    daysCount: 1,
    type: 'general',
    category: 'national',
    descriptionBn: 'স্বাধীনতা ও জাতীয় দিবস উপলক্ষে সাধারণ ছুটি।',
    descriptionEn: 'National holiday celebrating Independence of Bangladesh.'
  },
  {
    id: 'bd-2026-04-14',
    nameBn: 'পহেলা বৈশাখ / বাংলা নববর্ষ',
    nameEn: 'Pohela Boishakh (Bengali New Year)',
    date: '2026-04-14',
    daysCount: 1,
    type: 'general',
    category: 'national',
    descriptionBn: 'বাংলা নববর্ষের প্রথম দিন উপলক্ষে জাতীয় ছুটি।',
    descriptionEn: 'National public holiday celebrating Bengali New Year.'
  },
  {
    id: 'bd-2026-05-01',
    nameBn: 'মে দিবস / শ্রমিক সংহতি দিবস',
    nameEn: 'May Day / Labor Day',
    date: '2026-05-01',
    daysCount: 1,
    type: 'general',
    category: 'national',
    descriptionBn: 'আন্তর্জাতিক শ্রমিক সংহতি দিবস উপলক্ষে ফ্যাক্টরি ও সরকারি ছুটি।',
    descriptionEn: 'International Workers Day holiday observed in all factories and industries.'
  },
  {
    id: 'bd-2026-05-27',
    nameBn: 'পবিত্র ঈদ-উল-আযহা (কোরবানি ঈদ)',
    nameEn: 'Eid-ul-Adha Holidays',
    date: '2026-05-26',
    endDate: '2026-05-30',
    daysCount: 5,
    type: 'general',
    category: 'muslim',
    descriptionBn: 'পবিত্র ঈদ-উল-আযহা ও কোরবানি উপলক্ষে সরকারি ও কারখানা ছুটি।',
    descriptionEn: 'Official government and factory holidays for Eid-ul-Adha.'
  },
  {
    id: 'bd-2026-05-31',
    nameBn: 'শুভ বুদ্ধ পূর্ণিমা',
    nameEn: 'Buddha Purnima',
    date: '2026-05-31',
    daysCount: 1,
    type: 'general',
    category: 'buddhist',
    descriptionBn: 'বৈশাখী পূর্ণিমা উপলক্ষে সাধারণ ছুটি।',
    descriptionEn: 'Public holiday celebrating Buddha Purnima.'
  },
  {
    id: 'bd-2026-06-25',
    nameBn: 'পবিত্র আশুরা',
    nameEn: 'Holy Ashura',
    date: '2026-06-25',
    daysCount: 1,
    type: 'executive',
    category: 'muslim',
    descriptionBn: '১০ই মহররম উপলক্ষে সরকারি ছুটি।',
    descriptionEn: 'Public holiday observing the holy Ashura.'
  },
  {
    id: 'bd-2026-08-25',
    nameBn: 'পবিত্র ঈদে মিলাদুন্নবী (সা.)',
    nameEn: 'Eid-e-Miladunnabi',
    date: '2026-08-25',
    daysCount: 1,
    type: 'general',
    category: 'muslim',
    descriptionBn: 'পবিত্র ঈদে মিলাদুন্নবী (সা.) উপলক্ষে সাধারণ ছুটি।',
    descriptionEn: 'Public holiday commemorating Eid-e-Miladunnabi.'
  },
  {
    id: 'bd-2026-09-04',
    nameBn: 'শুভ জন্মাষ্টমী',
    nameEn: 'Janmashtami',
    date: '2026-09-04',
    daysCount: 1,
    type: 'general',
    category: 'hindu',
    descriptionBn: 'ভগবান শ্রীকৃষ্ণের শুভ আবির্ভাব তিথি উপলক্ষে সাধারণ ছুটি।',
    descriptionEn: 'Public holiday observing Janmashtami.'
  },
  {
    id: 'bd-2026-10-20',
    nameBn: 'শারদীয় দুর্গাপূজা (বিজয়া দশমী ও মহানবমী)',
    nameEn: 'Durga Puja Holidays',
    date: '2026-10-19',
    endDate: '2026-10-21',
    daysCount: 3,
    type: 'general',
    category: 'hindu',
    descriptionBn: 'সনাতন ধর্মাবলম্বীদের শারদীয় দুর্গাপূজা উপলক্ষে কারখানা ও সরকারি ছুটি।',
    descriptionEn: 'Festive Durga Puja holidays for Maha Nabami and Bijoya Dashami.'
  },
  {
    id: 'bd-2026-12-16',
    nameBn: 'মহান বিজয় দিবস',
    nameEn: 'Victory Day of Bangladesh',
    date: '2026-12-16',
    daysCount: 1,
    type: 'general',
    category: 'national',
    descriptionBn: 'বাঙালি জাতির বীরত্বপূর্ণ বিজয়ের স্মরণে জাতীয় ছুটি।',
    descriptionEn: 'National holiday commemorating victory in the 1971 Liberation War.'
  },
  {
    id: 'bd-2026-12-25',
    nameBn: 'যিশু খ্রিস্টের জন্মদিন / বড়দিন',
    nameEn: 'Christmas Day',
    date: '2026-12-25',
    daysCount: 1,
    type: 'general',
    category: 'christian',
    descriptionBn: 'খ্রিস্টান সম্প্রদায়ের শুভ বড়দিন উপলক্ষে সরকারি ছুটি।',
    descriptionEn: 'Public holiday on the birth anniversary of Jesus Christ (Christmas).'
  },

  // 2027 Key Holidays preview
  {
    id: 'bd-2027-02-21',
    nameBn: 'শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস',
    nameEn: 'Shaheed Day & Mother Language Day',
    date: '2027-02-21',
    daysCount: 1,
    type: 'general',
    category: 'national',
    descriptionBn: 'আন্তর্জাতিক মাতৃভাষা দিবস উপলক্ষে জাতীয় সাধারণ ছুটি।',
    descriptionEn: 'National public holiday for International Mother Language Day.'
  },
  {
    id: 'bd-2027-03-09',
    nameBn: 'পবিত্র ঈদ-উল-ফিতর',
    nameEn: 'Eid-ul-Fitr Holidays',
    date: '2027-03-09',
    endDate: '2027-03-13',
    daysCount: 5,
    type: 'general',
    category: 'muslim',
    descriptionBn: 'পবিত্র ঈদ-উল-ফিতর উপলক্ষে সরকারি ও কারখানা ছুটি।',
    descriptionEn: 'Government and industrial holidays for Eid-ul-Fitr.'
  },
  {
    id: 'bd-2027-03-26',
    nameBn: 'স্বাধীনতা ও জাতীয় দিবস',
    nameEn: 'Independence & National Day',
    date: '2027-03-26',
    daysCount: 1,
    type: 'general',
    category: 'national',
    descriptionBn: 'মহান স্বাধীনতা ও জাতীয় দিবস উপলক্ষে সরকারি ছুটি।',
    descriptionEn: 'National public holiday for Independence Day.'
  },
  {
    id: 'bd-2027-04-14',
    nameBn: 'পহেলা বৈশাখ / বাংলা নববর্ষ',
    nameEn: 'Bengali New Year',
    date: '2027-04-14',
    daysCount: 1,
    type: 'general',
    category: 'national',
    descriptionBn: 'বাংলা নববর্ষ উপলক্ষে সাধারণ ছুটি।',
    descriptionEn: 'National public holiday for Bengali New Year.'
  },
  {
    id: 'bd-2027-05-01',
    nameBn: 'মে দিবস / শ্রমিক দিবস',
    nameEn: 'May Day / Labor Day',
    date: '2027-05-01',
    daysCount: 1,
    type: 'general',
    category: 'national',
    descriptionBn: 'মে দিবস উপলক্ষে সাধারণ ছুটি।',
    descriptionEn: 'May Day national public holiday.'
  },
  {
    id: 'bd-2027-05-16',
    nameBn: 'পবিত্র ঈদ-উল-আযহা',
    nameEn: 'Eid-ul-Adha Holidays',
    date: '2027-05-16',
    endDate: '2027-05-20',
    daysCount: 5,
    type: 'general',
    category: 'muslim',
    descriptionBn: 'পবিত্র কোরবানি ঈদ উপলক্ষে সরকারি ও কারখানা ছুটি।',
    descriptionEn: 'Official government and factory holidays for Eid-ul-Adha.'
  },
  {
    id: 'bd-2027-10-10',
    nameBn: 'শারদীয় দুর্গাপূজা (বিজয়া দশমী)',
    nameEn: 'Durga Puja (Bijoya Dashami)',
    date: '2027-10-09',
    endDate: '2027-10-11',
    daysCount: 3,
    type: 'general',
    category: 'hindu',
    descriptionBn: 'শারদীয় দুর্গাপূজা উপলক্ষে সাধারণ ছুটি।',
    descriptionEn: 'Durga Puja festival public holiday.'
  },
  {
    id: 'bd-2027-12-16',
    nameBn: 'মহান বিজয় দিবস',
    nameEn: 'Victory Day',
    date: '2027-12-16',
    daysCount: 1,
    type: 'general',
    category: 'national',
    descriptionBn: 'মহান বিজয় দিবস উপলক্ষে সাধারণ ছুটি।',
    descriptionEn: 'Victory Day national public holiday.'
  },
  {
    id: 'bd-2027-12-25',
    nameBn: 'যিশু খ্রিস্টের জন্মদিন / বড়দিন',
    nameEn: 'Christmas Day',
    date: '2027-12-25',
    daysCount: 1,
    type: 'general',
    category: 'christian',
    descriptionBn: 'শুভ বড়দিন উপলক্ষে সাধারণ ছুটি।',
    descriptionEn: 'Christmas Day public holiday.'
  }
];

// Helper to find the next upcoming holiday from today
export function getNextUpcomingHoliday(holidays: BangladeshHolidayItem[] = OFFICIAL_BANGLADESH_HOLIDAYS): {
  holiday: BangladeshHolidayItem;
  daysRemaining: number;
} | null {
  const todayStr = new Date().toISOString().split('T')[0];
  const sorted = [...holidays]
    .filter(h => (h.endDate || h.date) >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) return null;

  const next = sorted[0];
  const todayTime = new Date(todayStr).getTime();
  const targetTime = new Date(next.date).getTime();
  const diffDays = Math.ceil((targetTime - todayTime) / (1000 * 60 * 60 * 24));

  return {
    holiday: next,
    daysRemaining: Math.max(0, diffDays)
  };
}

// Generate a Google Calendar 1-click web URL for an individual holiday
export function generateGoogleCalendarUrl(holiday: BangladeshHolidayItem): string {
  const title = `${holiday.nameBn} (${holiday.nameEn}) - সরকারি ছুটি`;
  const details = `${holiday.descriptionBn}\n${holiday.descriptionEn}\n\nCreative Accessories Factory Official Holiday Calendar`;
  const location = 'Dhaka, Bangladesh';

  // Format date: YYYYMMDD
  const startDateStr = holiday.date.replace(/-/g, '');
  let endDateStr = startDateStr;
  
  if (holiday.endDate) {
    // For end date in full-day events, Google Calendar expects next day
    const end = new Date(holiday.endDate);
    end.setDate(end.getDate() + 1);
    endDateStr = end.toISOString().split('T')[0].replace(/-/g, '');
  } else {
    const d = new Date(holiday.date);
    d.setDate(d.getDate() + 1);
    endDateStr = d.toISOString().split('T')[0].replace(/-/g, '');
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startDateStr}/${endDateStr}`,
    details: details,
    location: location
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Generate downloadable .ics (iCalendar) file contents for all Bangladesh & Factory holidays
export function generateIcsCalendarFile(holidays: BangladeshHolidayItem[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Creative Accessories Factory//Bangladesh Holidays//BN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:বাংলাদেশ সরকারি ও কারখানা ছুটির ক্যালেন্ডার',
    'X-WR-TIMEZONE:Asia/Dhaka'
  ];

  holidays.forEach(h => {
    const start = h.date.replace(/-/g, '');
    let end = start;
    if (h.endDate) {
      const e = new Date(h.endDate);
      e.setDate(e.getDate() + 1);
      end = e.toISOString().split('T')[0].replace(/-/g, '');
    } else {
      const e = new Date(h.date);
      e.setDate(e.getDate() + 1);
      end = e.toISOString().split('T')[0].replace(/-/g, '');
    }

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${h.id}@creativeaccessories.com`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
    lines.push(`DTSTART;VALUE=DATE:${start}`);
    lines.push(`DTEND;VALUE=DATE:${end}`);
    lines.push(`SUMMARY:${h.nameBn} - ${h.nameEn}`);
    lines.push(`DESCRIPTION:${h.descriptionBn.replace(/\n/g, ' ')} (${h.descriptionEn.replace(/\n/g, ' ')})`);
    lines.push('LOCATION:Bangladesh');
    lines.push('STATUS:CONFIRMED');
    lines.push('TRANSP:TRANSPARENT');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
