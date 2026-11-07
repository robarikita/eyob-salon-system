import React from 'react';
import { Link } from 'react-router-dom';

interface HeroSectionProps {
  onBookClick?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onBookClick }) => {
  const handleLearnMore = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onBookClick) {
      // Keep onBookClick prop support
    }
    const el = document.querySelector('#services');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative bg-hero-luxury overflow-hidden pt-8 pb-24 lg:py-20">
      {/* Decorative Warm Amber & Sunset Glows */}
      <div className="absolute w-[620px] h-[620px] bg-amber-500/25 top-1/2 right-1/4 -translate-y-1/2 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute w-[450px] h-[450px] bg-yellow-600/20 -top-10 left-10 rounded-full blur-[90px] pointer-events-none" />

      {/* Flowing Delicate Gold Ribbons & Filigree in Background */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-45"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M-100,520 C280,440 600,620 980,320 C1280,120 1520,380 1850,220"
          fill="none"
          stroke="url(#heroGoldRibbon1)"
          strokeWidth="2.2"
        />
        <path
          d="M120,680 C540,610 820,240 1220,340 C1540,430 1720,270 1950,290"
          fill="none"
          opacity="0.65"
          stroke="url(#heroGoldRibbon2)"
          strokeWidth="1.4"
        />
        <defs>
          <linearGradient id="heroGoldRibbon1" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#C59A3F" stopOpacity="0" />
            <stop offset="45%" stopColor="#F3E5AB" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#8E6B23" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="heroGoldRibbon2" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#F3E5AB" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#ECC472" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#9F7223" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[500px]">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-1">
              <h1 className="font-luxury text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-brand-gold leading-[1.08]">
                Look Beautiful,
              </h1>
              <p className="font-luxury text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-stone-100 leading-[1.08]">
                Feel Confident
              </p>
            </div>
            <p className="text-base sm:text-lg text-stone-300 font-normal max-w-lg leading-relaxed pt-1">
              Premium beauty services, professional care. Your beauty, our priority.
            </p>

            {/* Primary & Secondary CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-3">
              <Link
                to="/book"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-stone-950 font-semibold text-sm sm:text-base gold-gradient-btn tracking-normal"
              >
                <span>Book Appointment</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a
                href="#services"
                onClick={handleLearnMore}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-stone-200 hover:text-brand-gold transition duration-200 text-sm sm:text-base font-medium group"
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-full border border-stone-400/40 text-stone-200 group-hover:border-brand-gold transition-colors">
                  <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <span>Learn More</span>
              </a>
            </div>
          </div>

          {/* Right Column: Hero Visual with Seamless Organic Masking & Ethereal Glow */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[530px]">
              {/* Seamless Warm Ambient Halo behind visual */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-brand-gold/45 via-amber-600/30 to-amber-200/10 rounded-full blur-3xl pointer-events-none" />

              {/* Masked Image Container for Seamless Sunset Blend */}
              <div className="relative hero-blend-mask rounded-3xl overflow-hidden">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDeAoKsVk8vidt9ghuK6SetryTZ9HL39iC2S3bsRGHkGDdcNsq7CU2DQjokcZvxEG5uyg0H254kXWBwE3St6KT5yxDo_FMPsXWYwtgXdnicA4XsPITFXXytc_UU7-07Yvd5Cr11tHxBDCgA5y66BirbqrFis0Bf4g5XpOPRHk66_wk9ZHkVuQCb_4XqxD31RAxmS5_3-rxT0Q3iflxAInCkAgs-urpaUWgy3P7TL_sX"
                  alt="Stunning woman with glowing radiant skin and soft updo curls with cinematic golden rim lighting"
                  className="w-full h-auto object-cover max-h-[540px] transform hover:scale-[1.02] transition-transform duration-700"
                  loading="eager"
                />
                {/* Soft Inner Golden Gradient Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/70 via-transparent to-brand-dark/20 pointer-events-none" />
              </div>

              {/* Delicate Golden Floating Sparkles */}
              <div className="absolute -bottom-2 right-12 text-brand-gold animate-pulse text-2xl font-serif select-none pointer-events-none">
                ✦
              </div>
              <div className="absolute top-10 -left-2 text-brand-gold-light text-xl select-none pointer-events-none">
                ✦
              </div>
              <div className="absolute top-1/2 -right-4 text-amber-200/80 text-sm select-none pointer-events-none">
                ✧
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

