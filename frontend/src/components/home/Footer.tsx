import React from 'react';

export const Footer: React.FC = () => {
  const scrollTo = (hash: string) => {
    if (hash === '#') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-brand-darker border-t border-brand-gold/15 pt-14 pb-8 text-stone-400 text-xs" id="contact">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-stone-800">
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="text-brand-gold font-luxury text-2xl font-bold">Eyob Beauty</span>
            <span className="text-stone-600">|</span>
            <span className="text-xs uppercase tracking-widest text-stone-400">Salon &amp; Spa</span>
          </div>
          <p className="text-stone-400 max-w-sm text-xs leading-relaxed">
            Elevating self-confidence through bespoke hair styling, luxury skin care, and elevated glam in Addis Ababa.
          </p>
        </div>

        <div>
          <h4 className="text-stone-200 font-semibold mb-3">Quick Navigation</h4>
          <ul className="space-y-2">
            <li>
              <button
                type="button"
                onClick={() => scrollTo('#')}
                className="hover:text-brand-gold transition-colors text-left"
              >
                Home
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => scrollTo('#services')}
                className="hover:text-brand-gold transition-colors text-left"
              >
                Services &amp; Pricing
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => scrollTo('#team')}
                className="hover:text-brand-gold transition-colors text-left"
              >
                Master Stylists
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => scrollTo('#locations')}
                className="hover:text-brand-gold transition-colors text-left"
              >
                Branch Locations
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-stone-200 font-semibold mb-3">Contact Us</h4>
          <p className="text-stone-400">Phone: +251 911 234 567</p>
          <p className="text-stone-400 mt-1">Email: contact@eyobbeauty.com</p>
          <p className="text-stone-400 mt-1">Addis Ababa, Ethiopia</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© 2026 Eyob Beauty Salon &amp; Spa. All rights reserved.</p>
        <div className="flex items-center space-x-6 text-stone-400">
          <a href="#" className="hover:text-brand-gold transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-brand-gold transition-colors">
            Terms of Service
          </a>
          <a href="#" className="hover:text-brand-gold transition-colors">
            Support
          </a>
        </div>
      </div>
    </footer>
  );
};

