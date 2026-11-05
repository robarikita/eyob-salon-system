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

