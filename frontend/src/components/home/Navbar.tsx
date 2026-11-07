import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LanguageToggle } from '../common/LanguageToggle';

interface NavbarProps {
  onBookClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onBookClick }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navLinks = [
    { name: 'Home', href: '#', active: true },
    { name: 'Services', href: '#services', active: false },
    { name: 'Our Team', href: '#team', active: false },
    { name: 'Locations', href: '#locations', active: false },
    { name: 'Reviews', href: '#reviews', active: false },
    { name: 'Contact', href: '#contact', active: false },
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    if (onBookClick && href === '#book') {
      onBookClick();
      return;
    }
    if (href === '#') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-brand-darker/90 backdrop-blur-md border-b border-brand-gold/15">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); handleNavClick('#'); }}
          className="flex items-center gap-3.5 group"
        >
          <div className="w-10 h-10 flex items-center justify-center text-brand-gold">
            <svg 
              className="w-10 h-10 drop-shadow-[0_2px_8px_rgba(212,175,55,0.4)] transition-transform duration-300 group-hover:scale-105" 
              fill="none" 
              viewBox="0 0 48 48" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M24 6C24 6 27.5 16 35 20C42.5 24 45 32 40 37C35 42 27 41 24 41C21 41 13 42 8 37C3 32 5.5 24 13 20C20.5 16 24 6 24 6Z" 
                stroke="currentColor" 
                strokeLinejoin="round" 
                strokeWidth="1.8"
              />
              <path 
                d="M24 16C24 16 29 25 29 33C29 37 26.5 40 24 40C21.5 40 19 37 19 33C19 25 24 16 24 16Z" 
                fill="currentColor" 
                fillOpacity="0.25" 
                stroke="currentColor" 
                strokeWidth="1.6"
              />
              <circle cx="24" cy="12" fill="currentColor" r="1.5" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-luxury text-2xl font-bold tracking-wider text-brand-gold uppercase leading-tight">
              Eyob Beauty
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-brand-gold-light/75 font-medium -mt-0.5">
              Salon &amp; Spa
            </span>
          </div>
        </a>

        {/* Center Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(link.href);
              }}
              className={`relative py-1 transition-colors duration-200 ${
                link.active
                  ? 'text-brand-gold font-semibold'
                  : 'text-stone-300 hover:text-brand-gold'
              }`}
            >
              {link.name}
              {link.active && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-gold rounded-full" />
              )}
            </a>
          ))}
        </nav>

        {/* Right Header Actions */}
        <div className="flex items-center space-x-3 sm:space-x-5">
          {/* Search Button */}
          <div className="relative">
            <button
              aria-label="Search"
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-stone-300 hover:text-brand-gold transition-colors"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 21l-4.35-4.35M16.65 11a5.65 5.65 0 11-11.3 0 5.65 5.65 0 0111.3 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {searchOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-brand-surface border border-brand-gold/30 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-dark rounded-lg border border-brand-gold/20">
                  <svg className="w-4 h-4 text-brand-gold-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 21l-4.35-4.35M16.65 11a5.65 5.65 0 11-11.3 0 5.65 5.65 0 0111.3 0z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search services, stylists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full bg-transparent text-xs text-stone-200 placeholder-stone-500 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setSearchOpen(false);
                        const servicesEl = document.querySelector('#services');
                        servicesEl?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  />
                  <button 
                    onClick={() => setSearchOpen(false)}
                    className="text-stone-400 hover:text-stone-200 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Language Toggle */}
          <div className="hidden sm:flex items-center">
            <LanguageToggle />
          </div>

          {/* Account / Sign In & Sign Out */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to={user?.role === 'EMPLOYEE' ? '/staff/dashboard' : user?.role === 'OWNER' || user?.role === 'BRANCH_ADMIN' ? '/admin/appointments' : '/account/profile'}
                className="text-stone-200 hover:text-brand-gold text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#181412] border border-brand-gold/20 transition-colors"
              >
                <span className="material-symbols-outlined text-[17px] text-brand-gold">account_circle</span>
                <span className="max-w-[140px] truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || user?.phone || ''}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="text-xs font-medium text-red-400 hover:text-red-300 px-2.5 py-1.5 rounded-lg border border-red-900/60 hover:bg-red-950/30 flex items-center gap-1 transition-colors"
                title="Sign Out / ውጣ"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span className="hidden xl:inline">Sign Out / ውጣ</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-stone-300 hover:text-brand-gold text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 px-2 py-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              <span className="hidden xl:inline">Sign In / ግባ</span>
            </Link>
          )}

          {/* Desktop CTA Button */}
          <Link
            to="/book"
            className="hidden sm:inline-flex items-center justify-center px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-stone-950 gold-gradient-btn tracking-wide"
          >
            Book Appointment
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-brand-gold hover:text-brand-gold-light focus:outline-none"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-brand-darker/98 border-b border-brand-gold/20 px-6 pt-3 pb-6 space-y-4 backdrop-blur-xl animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-3 pt-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className={`py-2 text-base font-medium transition-colors ${
                  link.active
                    ? 'text-brand-gold font-semibold flex items-center justify-between'
                    : 'text-stone-300 hover:text-brand-gold'
                }`}
              >
                <span>{link.name}</span>
                {link.active && <span className="w-2 h-2 rounded-full bg-brand-gold"></span>}
              </a>
            ))}
          </nav>
          <div className="pt-3 border-t border-stone-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <LanguageToggle />
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="text-brand-gold text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  <span>Sign In / ግባ</span>
                </Link>
              )}
            </div>

            {isAuthenticated && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#181412] border border-brand-gold/20">
                <Link
                  to={user?.role === 'EMPLOYEE' ? '/staff/dashboard' : user?.role === 'OWNER' || user?.role === 'BRANCH_ADMIN' ? '/admin/appointments' : '/account/profile'}
                  className="text-stone-200 text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px] text-brand-gold">account_circle</span>
                  <span>{user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || user?.phone || ''}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 px-2.5 py-1 rounded border border-red-900/60 hover:bg-red-950/30 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  <span>Sign Out / ውጣ</span>
                </button>
              </div>
            )}

            <Link
              to="/book"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold text-stone-950 gold-gradient-btn tracking-wide"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

