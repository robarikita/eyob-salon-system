import React from 'react';

export const ValuePropsBanner: React.FC = () => {
  return (
    <section className="relative z-20 -mt-8 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="bg-[#F8F5EE] text-stone-900 rounded-2xl shadow-xl py-5 px-6 sm:px-10 border border-[#E9DEC9] backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-4 divide-y md:divide-y-0 md:divide-x divide-stone-300/80">
          {/* Feature 1: Professional Staff */}
          <div className="flex items-center justify-center gap-3.5 pt-2 md:pt-0">
            <div className="w-10 h-10 rounded-full bg-amber-100/90 flex items-center justify-center text-amber-800 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-semibold text-stone-900 text-sm tracking-normal">
              Professional Staff
            </span>
          </div>

          {/* Feature 2: Multiple Locations */}
          <div className="flex items-center justify-center gap-3.5 pt-4 md:pt-0">
            <div className="w-10 h-10 rounded-full bg-amber-100/90 flex items-center justify-center text-amber-800 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-semibold text-stone-900 text-sm tracking-normal">
              Multiple Locations
            </span>
          </div>

          {/* Feature 3: Trusted & Secure */}
          <div className="flex items-center justify-center gap-3.5 pt-4 md:pt-0">
            <div className="w-10 h-10 rounded-full bg-amber-100/90 flex items-center justify-center text-amber-800 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-semibold text-stone-900 text-sm tracking-normal">
              Trusted &amp; Secure
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

