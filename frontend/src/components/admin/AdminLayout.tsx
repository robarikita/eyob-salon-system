import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface AdminLayoutProps {
  children: React.ReactNode;
  selectedBranch?: string;
  onBranchChange?: (branch: string) => void;
  activePath?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  selectedBranch = 'all',
  onBranchChange,
  activePath,
}) => {
  const location = useLocation();
  const currentPath = activePath || location.pathname;
  const [currentBranch, setCurrentBranch] = useState(selectedBranch);
  const [isOwnerView, setIsOwnerView] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleBranchSelect = (val: string) => {
    setCurrentBranch(val);
    if (onBranchChange) onBranchChange(val);
  };

  const navItems = [
    { label: 'Overview', path: '/admin/employees/dashboard', icon: 'dashboard' },
    { label: 'Appointments', path: '/admin/appointments', icon: 'calendar_month' },
    { label: 'Service Rituals', path: '/admin/services', icon: 'auto_awesome' },
  ];

  const employeeSubNav = [
    { label: 'Staff Roster', path: '/admin/employees', icon: 'badge' },
    { label: 'Working Schedule', path: '/admin/employees/schedule', icon: 'calendar_today' },
    { label: 'Add Employee', path: '/admin/employees/add', icon: 'person_add' },
  ];

  const secondaryNav = [
    { label: 'VIP Clientele', path: '/admin/clientele', icon: 'group' },
    { label: 'Treasury & Invoices', path: '/admin/treasury', icon: 'payments' },
  ];

  const isEmployeeSectionActive = currentPath.startsWith('/admin/employees');

  return (
    <div className="bg-background min-h-screen text-on-surface font-sans flex antialiased">
      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Desktop fixed + Mobile responsive drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 bg-inverse-surface text-inverse-on-surface z-50 flex flex-col justify-between shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo Header */}
          <div className="h-20 flex items-center justify-between px-6 bg-inverse-surface border-b border-surface-variant/10">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center shadow-[0_0_20px_2px_rgba(197,155,39,0.35)] transition-transform group-hover:scale-105">
                <span className="material-symbols-outlined text-on-primary-container text-[20px]">spa</span>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl tracking-wide text-primary-fixed leading-none">EYOB</span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-tertiary-fixed-dim mt-0.5 font-medium">
                  Beauty &amp; Sanctuary
                </span>
              </div>
            </Link>
            <button
              className="lg:hidden text-surface-variant hover:text-white p-1"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="px-4 py-3">
            <div className="px-2 py-1">
              <span className="text-[10px] text-outline-variant uppercase tracking-widest font-semibold">
                Concierge &amp; Operations
              </span>
            </div>
            <nav className="space-y-1 mt-1">
              {navItems.map((item) => {
                const isActive = currentPath === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                        : 'text-surface-variant hover:bg-surface-variant/10 hover:text-surface-bright'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}

              {/* Employees Group */}
              <div className="pt-1 pb-1">
                <div
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-surface-variant ${
                    isEmployeeSectionActive ? 'text-primary-fixed font-semibold' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[19px]">badge</span>
                    <span className="text-sm">Employees</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-primary-fixed-dim">expand_more</span>
                </div>

                <div className="pl-7 pr-2 mt-1 space-y-0.5">
                  {employeeSubNav.map((sub) => {
                    const isSubActive = currentPath === sub.path;
                    return (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                          isSubActive
                            ? 'bg-primary-container text-on-primary-container font-semibold'
                            : 'text-surface-variant hover:bg-surface-variant/10 hover:text-surface-bright'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSubActive ? 'bg-on-primary-container' : 'bg-primary-fixed-dim'
                          }`}
                        />
                        <span>{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {secondaryNav.map((item) => {
                const isActive = currentPath === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-primary-container text-on-primary-container font-semibold'
                        : 'text-surface-variant hover:bg-surface-variant/10 hover:text-surface-bright'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer Badge */}
        <div className="p-4 bg-inverse-surface border-t border-surface-variant/10">
          <div className="p-3 rounded-xl bg-surface-container-highest/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary-fixed-dim text-[18px]">verified</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-surface-bright">Addis Ababa HQ</span>
                <span className="text-[11px] text-outline-variant">3 Sanctuaries</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline-variant text-[18px]">storefront</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="lg:pl-72 flex flex-col flex-1 min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-40 h-20 bg-surface/90 backdrop-blur-xl border-b border-surface-container-high px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Hamburger on mobile */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container"
              aria-label="Open navigation menu"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>

            {/* Branch Selector Dropdown */}
            <div className="relative flex items-center bg-surface-container-low rounded-xl px-3 py-1.5 shadow-sm">
              <span className="material-symbols-outlined text-primary text-[18px] mr-2">share_location</span>
              <select
                value={currentBranch}
                onChange={(e) => handleBranchSelect(e.target.value)}
                className="bg-transparent text-xs sm:text-sm text-on-surface font-medium focus:outline-none pr-7 cursor-pointer"
              >
                <option value="all">All Branches (3)</option>
                <option value="bole-bulbula">Bole Bulbula</option>
                <option value="kazanchis">Kazanchis</option>
                <option value="cmc">CMC Branch</option>
              </select>
              <span className="material-symbols-outlined text-secondary text-[16px] absolute right-2 pointer-events-none">
                unfold_more
              </span>
            </div>

            {/* View Mode Pill */}
            <div className="hidden sm:flex items-center">
              <button
                type="button"
                onClick={() => setIsOwnerView(!isOwnerView)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold uppercase tracking-wider hover:bg-surface-container-high transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
                {isOwnerView ? 'Owner View' : 'Branch Admin'}
              </button>
            </div>
          </div>

          {/* Right Header: Search, Notifications, Avatar */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex items-center bg-surface-container-low rounded-xl px-3 py-1.5 w-56 xl:w-72 shadow-inner">
              <span className="material-symbols-outlined text-secondary text-[18px] mr-2">search</span>
              <input
                type="text"
                placeholder="Search specialists, rituals..."
                className="w-full bg-transparent text-xs text-on-surface placeholder:text-secondary focus:outline-none"
              />
            </div>

            <button
              type="button"
              className="relative p-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-container shadow-[0_0_8px_rgba(197,155,39,0.8)]" />
            </button>

            <div className="flex items-center gap-2.5 pl-1 sm:pl-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-on-surface">Eyob Hailu</span>
                <span className="text-[11px] text-secondary">Proprietor</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white shadow-sm font-serif font-bold text-sm">
                EH
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full bg-background p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
