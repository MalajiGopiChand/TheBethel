const PARENT_LANG_KEY = 'parent_ui_lang';

export const ParentLang = {
  EN: 'en',
  TE: 'te'
};

const dict = {
  en: {
    dashboardTitle: 'Parent Dashboard',
    complaints: 'Complaints & Issues',
    raiseNow: 'Raise Now',
    homework: 'Homework',
    assignmentsFound: 'assignments found',
    noHomework: 'No homework assigned',
    enjoyFree: 'Enjoy your free time!',
    areaLeaderboard: 'Area Leaderboard',
    childRank: "Your Child's Current Rank",
    topStudents: 'Top Students',
    familyInfo: 'Family Information',
    academicDetails: 'Academic Details'
  },
  te: {
    dashboardTitle: 'తల్లిదండ్రుల డ్యాష్‌బోర్డ్',
    complaints: 'ఫిర్యాదులు & సమస్యలు',
    raiseNow: 'ఇప్పుడే పంపండి',
    homework: 'హోమ్‌వర్క్',
    assignmentsFound: 'అసైన్‌మెంట్లు కనిపించాయి',
    noHomework: 'హోమ్‌వర్క్ లేదు',
    enjoyFree: 'ఈరోజు ఖాళీ సమయం ఆనందించండి!',
    areaLeaderboard: 'ప్రాంత లీడర్‌బోర్డ్',
    childRank: 'మీ పిల్లవాడి ప్రస్తుత ర్యాంక్',
    topStudents: 'టాప్ విద్యార్థులు',
    familyInfo: 'కుటుంబ సమాచారం',
    academicDetails: 'విద్యా వివరాలు'
  }
};

export function getParentLang() {
  const saved = localStorage.getItem(PARENT_LANG_KEY);
  if (saved === ParentLang.EN || saved === ParentLang.TE) return saved;
  return ParentLang.TE; // default Telugu
}

export function setParentLang(lang) {
  localStorage.setItem(PARENT_LANG_KEY, lang === ParentLang.EN ? ParentLang.EN : ParentLang.TE);
}

export function tParent(lang, key) {
  const active = lang === ParentLang.EN ? ParentLang.EN : ParentLang.TE;
  return dict[active]?.[key] || dict.en[key] || key;
}
