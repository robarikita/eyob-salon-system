import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LanguageToggle } from '../common/LanguageToggle';
import { serviceApi, NotificationItem } from '../../api/serviceApi';

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
  const { user, logout, hasPermission } = useAuth();
  const currentPath = activePath || location.pathname;
  const [currentBranch, setCurrentBranch] = useState(selectedBranch);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [assignedBranchName, setAssignedBranchName] = useState<string>('');

  const isServicesSectionActive = currentPath.startsWith('/admin/services');
  const isEmployeeSectionActive =
    currentPath.startsWith('/admin/employees') && currentPath !== '/admin/employees/dashboard';

  const [servicesOpen, setServicesOpen] = useState(isServicesSectionActive);
  const [employeesOpen, setEmployeesOpen] = useState(isEmployeeSectionActive);

  // Notification System State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const list = await serviceApi.getNotifications();
      setNotifications(list || []);
      setUnreadCount((list || []).filter((n) => !n.isRead).length);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await serviceApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await serviceApi.markNotificationRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {}
    }
    setNotificationsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  useEffect(() => {
    if (isServicesSectionActive) setServicesOpen(true);
    if (isEmployeeSectionActive) setEmployeesOpen(true);
  }, [currentPath, isServicesSectionActive, isEmployeeSectionActive]);

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
    { label: 'Overview / አጠቃላይ', path: '/admin/employees/dashboard', icon: 'dashboard' },
    { label: 'Appointments / ቀጠሮዎች', path: '/admin/appointments', icon: 'calendar_month' },
    { label: 'Clientele / ደንበኞች', path: '/admin/clientele', icon: 'group' },
    ...(hasPermission('manage_branches')
      ? [{ label: 'Branches / ቅርንጫፎች', path: '/admin/branches', icon: 'domain' }]
      : []),
    ...(hasPermission('manage_roles') || user?.role === 'OWNER'
      ? [{ label: 'Roles & Permissions / ሚናዎች', path: '/admin/roles', icon: 'shield_person' }]
      : []),
    ...(hasPermission('view_audit_logs')
      ? [{ label: 'Audit Logs / ኦዲት', path: '/admin/audit-logs', icon: 'policy' }]
      : []),
    ...(user?.role === 'OWNER' || user?.role === 'BRANCH_ADMIN'
      ? [{ label: 'Approvals / ማጽደቂያ', path: '/admin/governance', icon: 'verified_user' }]
      : []),
  ];

  const serviceSubNav = [
    { label: 'Master Catalog / ዋና ዝርዝር', path: '/admin/services', icon: 'auto_awesome' },
    {
      label: 'Branch Pricing / ቅርንጫፍ ዋጋ',
      path: '/admin/services/pricing',
      altPath: '/admin/services/branch-governance',
      icon: 'tune',
    },
  ];

  const employeeSubNav = [
    { label: 'Specialist Roster / የሰራተኞች ዝርዝር', path: '/admin/employees', icon: 'badge' },
    {
      label: 'Schedules & Shifts / የስራ ሰዓት',
      path: '/admin/employees/schedules',
      altPath: '/admin/employees/schedule',
      icon: 'calendar_today',
    },
  ];

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
            <nav className="space-y-1.5 mt-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-r-xl transition-all ${
                      isActive
                        ? 'bg-[rgba(212,175,55,0.12)] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37] shadow-sm'
                        : 'text-[#FAF7F2]/70 hover:bg-[#181412] hover:text-[#D4AF37] border-l-4 border-transparent'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[19px] ${
                        isActive ? 'text-[#D4AF37]' : 'text-[#FAF7F2]/60'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}

              {/* Service Rituals Dropdown */}
              <div className="pt-1 pb-1">
                <button
                  type="button"
                  onClick={() => setServicesOpen((prev) => !prev)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                    isServicesSectionActive
                      ? 'text-[#D4AF37] font-semibold bg-[rgba(212,175,55,0.06)]'
                      : 'text-[#FAF7F2]/70 hover:bg-[#181412] hover:text-[#D4AF37]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`material-symbols-outlined text-[19px] ${
                        isServicesSectionActive ? 'text-[#D4AF37]' : 'text-[#FAF7F2]/60'
                      }`}
                    >
                      hotel_class
                    </span>
                    <span className="text-sm font-medium">Service Rituals / አገልግሎቶች</span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                      servicesOpen ? 'rotate-180 text-[#D4AF37]' : 'text-[#FAF7F2]/40'
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {servicesOpen && (
                  <div className="pl-4 pr-2 mt-1 space-y-1">
                    {serviceSubNav.map((sub) => {
                      const isSubActive =
                        location.pathname === sub.path || location.pathname === (sub as any).altPath;
                      return (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          onClick={() => setMobileSidebarOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-r-lg text-xs transition-all ${
                            isSubActive
                              ? 'bg-[rgba(212,175,55,0.12)] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37]'
                              : 'text-[#FAF7F2]/70 hover:bg-[#181412] hover:text-[#D4AF37] border-l-4 border-transparent'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSubActive ? 'bg-[#D4AF37]' : 'bg-[#FAF7F2]/30'
                            }`}
                          />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Employees & Specialists Dropdown */}
              <div className="pt-1 pb-1">
                <button
                  type="button"
                  onClick={() => setEmployeesOpen((prev) => !prev)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                    isEmployeeSectionActive
                      ? 'text-[#D4AF37] font-semibold bg-[rgba(212,175,55,0.06)]'
                      : 'text-[#FAF7F2]/70 hover:bg-[#181412] hover:text-[#D4AF37]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`material-symbols-outlined text-[19px] ${
                        isEmployeeSectionActive ? 'text-[#D4AF37]' : 'text-[#FAF7F2]/60'
                      }`}
                    >
                      badge
                    </span>
                    <span className="text-sm font-medium">Employees / ሰራተኞች</span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                      employeesOpen ? 'rotate-180 text-[#D4AF37]' : 'text-[#FAF7F2]/40'
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {employeesOpen && (
                  <div className="pl-4 pr-2 mt-1 space-y-1">
                    {employeeSubNav.map((sub) => {
                      const isSubActive =
                        location.pathname === sub.path || location.pathname === (sub as any).altPath;
                      return (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          onClick={() => setMobileSidebarOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-r-lg text-xs transition-all ${
                            isSubActive
                              ? 'bg-[rgba(212,175,55,0.12)] text-[#D4AF37] font-semibold border-l-4 border-[#D4AF37]'
                              : 'text-[#FAF7F2]/70 hover:bg-[#181412] hover:text-[#D4AF37] border-l-4 border-transparent'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSubActive ? 'bg-[#D4AF37]' : 'bg-[#FAF7F2]/30'
                            }`}
                          />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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

            {/* Live Gold Notification Dropdown */}
            <div className="relative" ref={notifDropdownRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative p-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors cursor-pointer"
                title="Notifications / ማስታወቂያዎች"
              >
                <span className="material-symbols-outlined text-[20px] text-[#D4AF37]">
                  notifications
                </span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-[#D4AF37] text-[#0E0B09] rounded-full text-[10px] font-bold shadow-md animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#181412] border border-[#2C2724] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                  <div className="px-4 py-3 bg-[#0E0B09] border-b border-[#2C2724] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#D4AF37] text-[18px]">
                        notifications_active
                      </span>
                      <span className="text-xs font-bold text-[#FAF7F2] uppercase tracking-wider">
                        Notices / ማስታወቂያ
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-[#D4AF37] hover:underline font-semibold uppercase tracking-wider"
                      >
                        Mark All Read / ሁሉንም አንብብ
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[#2C2724]">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-stone-500 text-xs">
                        No Notices / አዲስ ማስታወቂያ የለም
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3.5 hover:bg-[#2C2724]/50 cursor-pointer transition flex items-start gap-3 ${
                            !n.isRead ? 'bg-[#0E0B09]/60' : ''
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              !n.isRead ? 'bg-[#D4AF37]' : 'bg-transparent'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-[#FAF7F2] truncate">
                                {n.title}
                              </span>
                              <span className="text-[10px] text-stone-500 shrink-0">
                                {new Date(n.createdAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-300 mt-0.5 line-clamp-2">
                              {n.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-2.5 bg-[#0E0B09] border-t border-[#2C2724] text-center">
                    <Link
                      to="/admin/governance"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[11px] font-bold text-[#D4AF37] hover:underline uppercase tracking-wider"
                    >
                      Approvals Center / ማጽደቂያ &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/account/profile"
              className="flex items-center gap-2.5 pl-1 sm:pl-2 group hover:opacity-90 transition-opacity"
            >
              {user ? (
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-on-surface">
                    {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Administrator'}
                  </span>
                  <span className="text-[11px] text-[#D4AF37] font-medium">
                    {user.role === 'OWNER'
                      ? 'Proprietor / ባለቤት'
                      : user.role === 'BRANCH_ADMIN'
                      ? 'Branch Admin / አስተዳዳሪ'
                      : user.role || 'Admin'}
                  </span>
                </div>
              ) : (
                <div className="hidden sm:flex flex-col items-end gap-1">
                  <div className="h-3 w-24 bg-[#2C2724] animate-pulse rounded" />
                  <div className="h-2.5 w-16 bg-[#2C2724] animate-pulse rounded" />
                </div>
              )}
              <div className="w-9 h-9 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#0E0B09] shadow-sm font-serif font-bold text-sm">
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
