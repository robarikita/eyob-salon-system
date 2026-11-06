import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LanguageToggle } from '../common/LanguageToggle';

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
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const currentPath = activePath || location.pathname;
  const [currentBranch, setCurrentBranch] = useState(selectedBranch);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [assignedBranchName, setAssignedBranchName] = useState<string>('');

  useEffect(() => {
    if (user?.role === 'BRANCH_ADMIN' && user.branchId) {
      fetch(`/api/v1/branches/${user.branchId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.name) {
            setAssignedBranchName(data.data.name);
          }
        })
        .catch(() => {});
    }
  }, [user?.branchId, user?.role]);

  const handleBranchSelect = (val: string) => {
    setCurrentBranch(val);
    if (onBranchChange) onBranchChange(val);
  };

  const navItems = [
    { label: 'Overview', path: '/admin/employees/dashboard', icon: 'dashboard' },
    { label: 'Appointments', path: '/admin/appointments', icon: 'calendar_month' },
    ...(user?.role === 'OWNER'
      ? [
          { label: 'Branches', path: '/admin/branches', icon: 'domain' },
          { label: 'Roles & Permissions', path: '/admin/roles', icon: 'shield_person' },
          { label: 'Audit Logs', path: '/admin/audit-logs', icon: 'policy' },
        ]
      : []),
  ];

  const serviceSubNav = [
    { label: 'Master Catalog', path: '/admin/services', icon: 'auto_awesome' },
    { label: 'Curate Ritual', path: '/admin/services/create', icon: 'add_circle' },
    { label: 'Branch Governance', path: '/admin/services/branch-governance', icon: 'tune' },
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
  const isServicesSectionActive = currentPath.startsWith('/admin/services');

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

              {/* Service Rituals Group */}
              <div className="pt-1 pb-1">
                <Link
                  to="/admin/services"
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors ${
                    isServicesSectionActive
                      ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                      : 'text-surface-variant hover:bg-surface-variant/10 hover:text-surface-bright'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[19px]">hotel_class</span>
                    <span className="text-sm">Service Rituals</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </Link>

                <div className="pl-7 pr-2 mt-1 space-y-0.5">
                  {serviceSubNav.map((sub) => {
                    const isSubActive = currentPath === sub.path;
                    return (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                          isSubActive
                            ? 'bg-primary-container/80 text-on-primary-container font-semibold'
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

        {/* Sidebar Sign Out & Footer Badge */}
        <div className="p-4 bg-inverse-surface border-t border-surface-variant/10 space-y-3">
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-error hover:bg-error/10 border border-error/20 transition-colors text-sm font-semibold"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Sign Out / ውጣ</span>
          </button>

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

            {/* Branch Selector (Locked Badge for Branch Admin; Switcher for Owner) */}
            {user?.role === 'BRANCH_ADMIN' ? (
              <div className="flex items-center gap-2 bg-surface-container-low border border-primary/20 rounded-xl px-3.5 py-1.5 shadow-sm text-xs font-semibold text-primary">
                <span className="material-symbols-outlined text-[17px]">location_on</span>
                <span>{assignedBranchName || 'Assigned Branch'}</span>
              </div>
            ) : (
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
            )}
          </div>

          {/* Right Header: Search, Language, Notifications, Avatar */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex items-center bg-surface-container-low rounded-xl px-3 py-1.5 w-48 xl:w-64 shadow-inner">
              <span className="material-symbols-outlined text-secondary text-[18px] mr-2">search</span>
              <input
                type="text"
                placeholder="Search specialists, rituals..."
                className="w-full bg-transparent text-xs text-on-surface placeholder:text-secondary focus:outline-none"
              />
            </div>

            <LanguageToggle />

            <button
              type="button"
              className="relative p-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-container shadow-[0_0_8px_rgba(197,155,39,0.8)]" />
            </button>

            <Link
              to="/account/profile"
              className="flex items-center gap-2.5 pl-1 sm:pl-2 group hover:opacity-90 transition-opacity"
            >
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-on-surface">
                  {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Administrator' : 'Administrator'}
                </span>
                <span className="text-[11px] text-secondary">
                  {user?.role === 'OWNER' ? 'Proprietor' : user?.role || 'Admin'}
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white shadow-sm font-serif font-bold text-sm">
                {user ? `${user.firstName?.[0] || 'A'}${user.lastName?.[0] || ''}` : 'A'}
              </div>
            </Link>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/admin/login');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-error border border-error/20 text-xs font-semibold transition-colors"
              title="Sign Out / ውጣ"
            >
              <span className="material-symbols-outlined text-[17px]">logout</span>
              <span className="hidden sm:inline">Sign Out / ውጣ</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full bg-background p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
