import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface LanguageToggleProps {
  className?: string;
  showIcon?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ className = '', showIcon = false }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center text-xs tracking-wider font-medium text-[#A3998F] bg-[#181412] px-3 py-1.5 rounded-full border border-[#D4AF37]/20 select-none shadow-sm ${className}`}
    >
      {showIcon && (
        <span className="material-symbols-outlined text-[15px] text-[#D4AF37] mr-1.5 pointer-events-none">
          language
        </span>
      )}
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`transition-colors font-medium ${
          language === 'en' ? 'text-[#D4AF37] font-bold' : 'text-[#A3998F] hover:text-[#EDE8E3]'
        }`}
      >
        EN
      </button>
      <span className="mx-2 text-[#4E463E] opacity-60">|</span>
      <button
        type="button"
        onClick={() => setLanguage('am')}
        className={`transition-colors font-medium ${
          language === 'am' ? 'text-[#D4AF37] font-bold' : 'text-[#A3998F] hover:text-[#EDE8E3]'
        }`}
      >
        አማ
      </button>
    </div>
  );
};

export default LanguageToggle;

