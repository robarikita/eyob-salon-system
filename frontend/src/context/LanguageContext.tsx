import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'am';

interface TranslationEntry {
  en: string;
  am: string;
  bilingual: string;
}

const DICTIONARY: Record<string, TranslationEntry> = {
  // Navigation
  'nav.book': { en: 'Book', am: 'ያዝ', bilingual: 'Book / ያዝ' },
  'nav.myBookings': { en: 'My Bookings', am: 'ቀጠሮዎቼ', bilingual: 'My Bookings / ቀጠሮዎቼ' },
  'nav.profile': { en: 'Profile', am: 'መገለጫ', bilingual: 'Profile / መገለጫ' },
  'nav.staff': { en: 'Staff', am: 'ሰራተኞች', bilingual: 'Staff / ሰራተኞች' },
  'nav.admin': { en: 'Admin', am: 'አስተዳደር', bilingual: 'Admin / አስተዳደር' },

  // Auth & Identification
  'auth.signIn': { en: 'Sign In', am: 'ግባ', bilingual: 'Sign In / ግባ' },
  'auth.register': { en: 'Register', am: 'ተመዝገብ', bilingual: 'Register / ተመዝገብ' },
  'auth.createAccount': { en: 'Create Account', am: 'ይመዝገቡ', bilingual: 'Create Account / ይመዝገቡ' },
  'auth.emailOrPhone': { en: 'Email or Phone', am: 'ስልክ', bilingual: 'Email or Phone / ስልክ' },
  'auth.password': { en: 'Password', am: 'የይለፍ ቃል', bilingual: 'Password / የይለፍ ቃል' },
  'auth.fullName': { en: 'Full Name', am: 'ሙሉ ስም', bilingual: 'Full Name / ሙሉ ስም' },
  'auth.phone': { en: 'Phone', am: 'ስልክ ቁጥር', bilingual: 'Phone / ስልክ ቁጥር' },
  'auth.branch': { en: 'Branch', am: 'ቅርንጫፍ', bilingual: 'Branch / ቅርንጫፍ' },
  'auth.pin': { en: 'PIN', am: 'ሚስጥር ቁጥር', bilingual: 'PIN / ሚስጥር ቁጥር' },
  'auth.staffId': { en: 'Staff ID', am: 'መለያ ቁጥር', bilingual: 'Staff ID / መለያ ቁጥር' },
  'auth.securityCode': { en: 'Security Code', am: 'ባለ 6-አሃዝ ኮድ', bilingual: 'Security Code / ባለ 6-አሃዝ ኮድ' },
  'auth.staffLogin': { en: 'Staff Login', am: 'የሰራተኛ መግቢያ', bilingual: 'Staff Login / የሰራተኛ መግቢያ' },
  'auth.adminPortal': { en: 'Admin Portal', am: 'የአስተዳደር መግቢያ', bilingual: 'Admin Portal / የአስተዳደር መግቢያ' },
  'auth.workstation': { en: 'Workstation', am: 'ቦታ', bilingual: 'Workstation / ቦታ' },
  'auth.username': { en: 'Username', am: 'መለያ', bilingual: 'Username / መለያ' },

  // Actions
  'actions.clockIn': { en: 'Clock In', am: 'ስራ ጀምር', bilingual: 'Clock In / ስራ ጀምር' },
  'actions.save': { en: 'Save', am: 'መዝግብ', bilingual: 'Save / መዝግብ' },
  'actions.signOut': { en: 'Sign Out', am: 'ውጣ', bilingual: 'Sign Out / ውጣ' },
  'actions.authorize': { en: 'Authorize', am: 'ይግቡ', bilingual: 'Authorize / ይግቡ' },
  'actions.forgot': { en: 'Forgot?', am: 'ረሱ?', bilingual: 'Forgot? / ረሱ?' },
  'actions.haveAccount': { en: 'Have an account?', am: 'መለያ አለዎት?', bilingual: 'Have an account? / መለያ አለዎት?' },
  'actions.noAccount': { en: "Don't have an account?", am: 'መለያ የለዎትም?', bilingual: "Don't have an account? / መለያ የለዎትም?" },
  'actions.language': { en: 'Language', am: 'ቋንቋ', bilingual: 'Language / ቋንቋ' },
  'actions.security': { en: 'Security', am: 'ደህንነት', bilingual: 'Security / ደህንነት' },
  'actions.newPassword': { en: 'New Password', am: 'አዲስ የይለፍ ቃል', bilingual: 'New Password / አዲስ የይለፍ ቃል' },
  'actions.confirm': { en: 'Confirm', am: 'አረጋግጥ', bilingual: 'Confirm / አረጋግጥ' },

  // Role Selector Tabs & Password Reset
  'roles.customer': { en: 'Customer', am: 'ደንበኛ', bilingual: 'Customer / ደንበኛ' },
  'roles.specialist': { en: 'Specialist', am: 'ባለሙያ', bilingual: 'Specialist / ባለሙያ' },
  'roles.branchAdmin': { en: 'Branch Admin', am: 'አስተዳዳሪ', bilingual: 'Branch Admin / አስተዳዳሪ' },
  'roles.owner': { en: 'Owner', am: 'ባለቤት', bilingual: 'Owner / ባለቤት' },
  'auth.forgotPassword': { en: 'Forgot Password?', am: 'የይለፍ ቃል ረሱ?', bilingual: 'Forgot Password? / የይለፍ ቃል ረሱ?' },
  'auth.resetPassword': { en: 'Reset Password', am: 'የይለፍ ቃል ቀይር', bilingual: 'Reset Password / የይለፍ ቃል ቀይር' },

  // Branch Management
  'nav.branches': { en: 'Branches', am: 'ቅርንጫፎች', bilingual: 'Branches / ቅርንጫፎች' },
  'branch.management': { en: 'Branch Management', am: 'የቅርንጫፍ አስተዳደር', bilingual: 'Branch Management / የቅርንጫፍ አስተዳደር' },
  'branch.newBranch': { en: 'New Branch', am: 'አዲስ ቅርንጫፍ', bilingual: 'New Branch / አዲስ ቅርንጫፍ' },
  'branch.hours': { en: 'Operating Hours', am: 'የስራ ሰዓት', bilingual: 'Operating Hours / የስራ ሰዓት' },
  'branch.active': { en: 'Active', am: 'ንቁ', bilingual: 'Active / ንቁ' },
  'branch.inactive': { en: 'Inactive', am: 'ዝግ', bilingual: 'Inactive / ዝግ' },
  'branch.closed': { en: 'Closed', am: 'ዝግ', bilingual: 'Closed / ዝግ' },
  'branch.overnight': { en: 'Overnight', am: 'እስከ ሌሊት', bilingual: 'Overnight / እስከ ሌሊት' },
  'branch.saveSchedule': { en: 'Save Schedule', am: 'መዝግብ', bilingual: 'Save Schedule / መዝግብ' },
  'branch.edit': { en: 'Edit', am: 'አድስ', bilingual: 'Edit / አድስ' },
  'branch.delete': { en: 'Delete', am: 'አጥፋ', bilingual: 'Delete / አጥፋ' },
  'branch.statusToggle': { en: 'Status Toggle', am: 'ሁኔታ ቀይር', bilingual: 'Status Toggle / ሁኔታ ቀይር' },
  'branch.assignAdmin': { en: 'Assign Admin', am: 'አስተዳዳሪ መድብ', bilingual: 'Assign Admin / አስተዳዳሪ መድብ' },

  // Customer Profile & Global Access
  'profile.title': { en: 'Personal Dossier', am: 'የግል መገለጫ', bilingual: 'Personal Dossier / የግል መገለጫ' },
  'profile.contactPrefs': { en: 'Ritual Preferences', am: 'የመልእክት ምርጫዎች', bilingual: 'Ritual Preferences / የመልእክት ምርጫዎች' },
  'profile.globalPass': { en: 'Global Sanctuary Pass', am: 'ዓለም አቀፍ አባል', bilingual: 'Global Sanctuary Pass / ዓለም አቀፍ አባል' },
  'profile.smsAlerts': { en: 'SMS Alerts', am: 'የኤስኤምኤስ መልዕክት', bilingual: 'SMS Alerts / የኤስኤምኤስ መልዕክት' },
  'profile.emailAlerts': { en: 'Email Confirmations', am: 'የኢሜይል ማረጋገጫ', bilingual: 'Email Confirmations / የኢሜይል ማረጋገጫ' },
  'profile.visits': { en: 'Sanctuary Visits', am: 'ጉብኝቶች', bilingual: 'Sanctuary Visits / ጉብኝቶች' },
  'profile.firstName': { en: 'First Name', am: 'ስም', bilingual: 'First Name / ስም' },
  'profile.lastName': { en: 'Last Name', am: 'የአባት ስም', bilingual: 'Last Name / የአባት ስም' },
  'profile.email': { en: 'Email', am: 'ኢሜይል', bilingual: 'Email / ኢሜይል' },
  'profile.completed': { en: 'Completed', am: 'የተጠናቀቁ', bilingual: 'Completed / የተጠናቀቁ' },
  'profile.active': { en: 'Active', am: 'ንቁ', bilingual: 'Active / ንቁ' },
  'profile.total': { en: 'Total Visits', am: 'ጠቅላላ ጉብኝቶች', bilingual: 'Total Visits / ጠቅላላ ጉብኝቶች' },

  // Booking Flow & Wizard
  'book.step1': { en: 'Service & Specialist', am: 'አገልግሎት እና ባለሙያ', bilingual: 'Service & Specialist / አገልግሎት እና ባለሙያ' },
  'book.step2': { en: 'Date & Time', am: 'ቀን እና ሰዓት', bilingual: 'Date & Time / ቀን እና ሰዓት' },
  'book.step3': { en: 'Review & Summary', am: 'ማጠቃለያ', bilingual: 'Review & Summary / ማጠቃለያ' },
  'book.step4': { en: 'Confirmation', am: 'ማረጋገጫ', bilingual: 'Confirmation / ማረጋገጫ' },
  'book.selectRitual': { en: 'Select Service Ritual', am: 'አገልግሎት ይምረጡ', bilingual: 'Select Service Ritual / አገልግሎት ይምረጡ' },
  'book.selectSpecialist': { en: 'Select Preferred Specialist', am: 'ባለሙያ ይምረጡ', bilingual: 'Select Preferred Specialist / ባለሙያ ይምረጡ' },
  'book.anySpecialist': { en: 'Any Available Specialist', am: 'ማንኛውም ዝግጁ ባለሙያ', bilingual: 'Any Available Specialist / ማንኛውም ዝግጁ ባለሙያ' },
  'book.continueSchedule': { en: 'Continue to Schedule', am: 'ወደ ቀጠሮ ሰዓት ይለፉ', bilingual: 'Continue to Schedule / ወደ ቀጠሮ ሰዓት ይለፉ' },
  'book.continueReview': { en: 'Continue to Review', am: 'ቀጠሮውን ያረጋግጡ', bilingual: 'Continue to Review / ቀጠሮውን ያረጋግጡ' },
  'book.confirmReserve': { en: 'Book Appointment', am: 'ቀጠሮ ይያዙ', bilingual: 'Book Appointment / ቀጠሮ ይያዙ' },
  'book.loginRequired': { en: 'Please sign in to confirm your appointment', am: 'ቀጠሮዎን ለማጠናቀቅ እባክዎ ይግቡ', bilingual: 'Please sign in to confirm your appointment / ቀጠሮዎን ለማጠናቀቅ እባክዎ ይግቡ' },
  'book.changeBranch': { en: 'Change Branch', am: 'ቅርንጫፍ ቀይር', bilingual: 'Change Branch / ቅርንጫፍ ቀይር' },
  'book.selectBranch': { en: 'Select Sanctuary Branch', am: 'ቅርንጫፍ ይምረጡ', bilingual: 'Select Sanctuary Branch / ቅርንጫፍ ይምረጡ' },
  'book.backServices': { en: 'Back to Services', am: 'ወደ አገልግሎቶች ተመለስ', bilingual: 'Back to Services / ወደ አገልግሎቶች ተመለስ' },
  'book.backSchedule': { en: 'Back to Schedule', am: 'ወደ ቀጠሮ ሰዓት ተመለስ', bilingual: 'Back to Schedule / ወደ ቀጠሮ ሰዓት ተመለስ' },
  'book.financialLedger': { en: 'Financial Ledger', am: 'የክፍያ ማጠቃለያ', bilingual: 'Financial Ledger / የክፍያ ማጠቃለያ' },
  'book.totalTariff': { en: 'Ritual Full Tariff', am: 'ሙሉ ዋጋ', bilingual: 'Ritual Full Tariff / ሙሉ ዋጋ' },
  'book.deposit': { en: 'Advance Deposit', am: 'የቅድመ ክፍያ ተቀማጭ', bilingual: 'Advance Deposit / የቅድመ ክፍያ ተቀማጭ' },
  'book.balanceDue': { en: 'Balance Due at Reception', am: 'በቦታው የሚከፈል ቀሪ', bilingual: 'Balance Due at Reception / በቦታው የሚከፈል ቀሪ' },
  'book.notes': { en: 'Client Notes & Requests', am: 'ልዩ ማስታወሻዎች', bilingual: 'Client Notes & Requests / ልዩ ማስታወሻዎች' },
  'book.restoredDraft': { en: 'Restored Pending Appointment Draft', am: 'የተያዘ የቀጠሮ ረቂቅ ተመልሷል', bilingual: 'Restored Pending Appointment Draft / የተያዘ የቀጠሮ ረቂቅ ተመልሷል' },
  'book.finishBooking': { en: 'Complete Reservation', am: 'ቀጠሮውን ያጠናቅቁ', bilingual: 'Complete Reservation / ቀጠሮውን ያጠናቅቁ' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, mode?: 'bilingual' | 'current') => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('salon_lang');
    return saved === 'am' ? 'am' : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('salon_lang', lang);
  };

  const toggleLanguage = () => {
    const next = language === 'en' ? 'am' : 'en';
    setLanguage(next);
  };

  const t = (key: string, mode: 'bilingual' | 'current' = 'bilingual'): string => {
    const entry = DICTIONARY[key];
    if (!entry) return key;
    if (mode === 'bilingual') {
      return entry.bilingual;
    }
    return entry[language] || entry.en;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

