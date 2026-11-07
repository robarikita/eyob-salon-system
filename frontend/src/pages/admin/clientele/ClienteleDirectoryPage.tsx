import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import {
  customerApi,
  ClienteleListItem,
  CustomerDossierResponse,
} from '../../../api/customerApi';

export const ClienteleDirectoryPage: React.FC = () => {

  const [customers, setCustomers] = useState<ClienteleListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Dossier Drawer / Modal state
  const [selectedCustomer, setSelectedCustomer] = useState<ClienteleListItem | null>(null);
  const [dossierData, setDossierData] = useState<CustomerDossierResponse | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  const fetchClientele = useCallback(async (searchQuery: string, pageNum: number) => {
    try {
      setLoading(true);
      const res = await customerApi.listClientele({
        search: searchQuery || undefined,
        page: pageNum,
        limit: 15,
      });
      setCustomers(res.customers || []);
      setTotal(res.total || 0);
      setPage(res.page || 1);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to load clientele:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchClientele(search, 1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search, fetchClientele]);

  const handleOpenDossier = async (customer: ClienteleListItem) => {
    setSelectedCustomer(customer);
    setDossierData(null);
    try {
      setLoadingDossier(true);
      const data = await customerApi.getCustomerDossier(customer.id);
      setDossierData(data);
    } catch (err) {
      console.error('Failed to load dossier:', err);
    } finally {
      setLoadingDossier(false);
    }
  };

  return (
    <AdminLayout activePath="/admin/clientele">
      <div className="space-y-6 max-w-[1600px] mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2C2724] pb-5">
          <div>
            <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-xs uppercase tracking-widest mb-1">
              <span className="material-symbols-outlined text-[18px]">group</span>
              <span>Clientele Sanctuary / የደንበኞች መዝገብ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#FAF7F2]">
              Clientele Directory / ደንበኞች
            </h1>
            <p className="text-xs text-[#A8A29E] mt-1">
              Cross-branch patrons, appointment history, visit frequencies, and luxury dossiers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-lg bg-[#181412] text-[#D4AF37] border border-[#3E3834] text-xs font-mono font-semibold">
              {total} {total === 1 ? 'Patron' : 'Patrons'}
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined text-[#A8A29E] text-[18px] absolute left-3 top-1/2 -translate-y-1/2">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patrons by name, phone, or email... / ፈልግ"
              className="w-full bg-[#181412] border border-[#2C2724] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#FAF7F2] placeholder-[#A8A29E]/60 focus:outline-none focus:border-[#D4AF37] transition font-sans"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Clientele Table */}
        <div className="bg-[#181412] border border-[#2C2724] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#FAF7F2]">
              <thead className="bg-[#120F0D] border-b border-[#2C2724] uppercase text-[10px] tracking-wider text-[#A8A29E] font-semibold">
                <tr>
                  <th className="py-3 px-4">Patron / ደንበኛ</th>
                  <th className="py-3 px-4">Contact / አድራሻ</th>
                  <th className="py-3 px-4">Language / ቋንቋ</th>
                  <th className="py-3 px-4">Visits / ጉብኝት</th>
                  <th className="py-3 px-4">Branch Presence / ቅርንጫፍ</th>
                  <th className="py-3 px-4 text-right">Dossier / ዝርዝር</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C2724]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-[#A8A29E]">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs uppercase tracking-wider">Accessing clientele records...</span>
                      </div>
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-[#A8A29E]">
                      <span className="material-symbols-outlined text-4xl text-[#A8A29E]/40 mb-2 block">
                        person_search
                      </span>
                      <p className="font-semibold text-sm text-[#FAF7F2]">No clientele records found</p>
                      <p className="text-xs text-[#A8A29E] mt-1">Try refining your search keyword.</p>
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-[#231D1A]/50 transition-colors cursor-pointer group"
                      onClick={() => handleOpenDossier(c)}
                    >
                      {/* Patron Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-xs flex items-center justify-center font-serif">
                            {c.firstName?.[0] || 'C'}{c.lastName?.[0] || ''}
                          </div>
                          <div>
                            <span className="font-semibold text-[#FAF7F2] group-hover:text-[#D4AF37] transition">
                              {c.fullName || `${c.firstName} ${c.lastName}`}
                            </span>
                            <span className="text-[10px] text-[#A8A29E] block">
                              Joined {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <p className="text-[#FAF7F2]">{c.phone}</p>
                        {c.email ? (
                          <p className="text-[#A8A29E] text-[10px] truncate max-w-[200px]">{c.email}</p>
                        ) : (
                          <span className="text-stone-600 italic text-[10px]">No email</span>
                        )}
                      </td>

                      {/* Language Preference */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#231D1A] text-[#D4AF37] border border-[#3E3834]">
                          {c.preferredLang || 'EN'}
                        </span>
                      </td>

                      {/* Visits Stats */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#D4AF37] text-xs">
                            {c.totalVisits}
                          </span>
                          <span className="text-[10px] text-[#A8A29E]">
                            ({c.completedVisits} completed)
                          </span>
                        </div>
                      </td>

                      {/* Branch Presence Breakdown */}
                      <td className="py-3.5 px-4">
                        {c.branchVisits && c.branchVisits.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {c.branchVisits.map((bv) => (
                              <span
                                key={bv.branchId}
                                className="px-2 py-0.5 rounded text-[10px] bg-[#120F0D] text-stone-300 border border-[#2C2724] font-medium"
                              >
                                {bv.branchName}: <strong className="text-[#D4AF37]">{bv.count}</strong>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-stone-600 italic text-[10px]">No visits yet</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDossier(c);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-[#231D1A] hover:bg-[#2C2724] text-[#D4AF37] border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded-lg text-xs font-semibold transition"
                        >
                          <span>Dossier / ዝርዝር</span>
                          <span className="material-symbols-outlined text-xs">chevron_right</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-[#2C2724] flex items-center justify-between text-xs text-[#A8A29E]">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => fetchClientele(search, page - 1)}
                  className="px-3 py-1 bg-[#231D1A] hover:bg-[#2C2724] disabled:opacity-40 rounded border border-[#3E3834] text-[#FAF7F2] transition"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => fetchClientele(search, page + 1)}
                  className="px-3 py-1 bg-[#231D1A] hover:bg-[#2C2724] disabled:opacity-40 rounded border border-[#3E3834] text-[#FAF7F2] transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dossier Side Drawer / Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm">
            <div
              className="fixed inset-0"
              onClick={() => setSelectedCustomer(null)}
            />
            <div className="relative bg-[#181412] border-l border-[#2C2724] w-full max-w-2xl h-full shadow-2xl flex flex-col z-10 overflow-hidden">
              {/* Drawer Header */}
              <div className="p-6 border-b border-[#2C2724] flex items-center justify-between bg-[#120F0D]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37] text-[#D4AF37] font-bold text-base flex items-center justify-center font-serif">
                    {selectedCustomer.firstName?.[0] || 'C'}{selectedCustomer.lastName?.[0] || ''}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#FAF7F2]">
                      {selectedCustomer.fullName || `${selectedCustomer.firstName} ${selectedCustomer.lastName}`}
                    </h3>
                    <p className="text-xs text-[#A8A29E] font-mono">
                      {selectedCustomer.phone} {selectedCustomer.email && `• ${selectedCustomer.email}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-[#231D1A]"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Profile Overview Card */}
                <div className="bg-[#120F0D] border border-[#2C2724] rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[#A8A29E] block text-[10px] uppercase font-semibold">Total Visits</span>
                    <span className="text-[#D4AF37] font-mono font-bold text-base">
                      {selectedCustomer.totalVisits}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A8A29E] block text-[10px] uppercase font-semibold">Completed</span>
                    <span className="text-emerald-400 font-mono font-bold text-base">
                      {selectedCustomer.completedVisits}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A8A29E] block text-[10px] uppercase font-semibold">Active Bookings</span>
                    <span className="text-[#FAF7F2] font-mono font-bold text-base">
                      {selectedCustomer.activeBookings}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A8A29E] block text-[10px] uppercase font-semibold">Language</span>
                    <span className="text-[#D4AF37] font-mono font-bold text-base">
                      {selectedCustomer.preferredLang || 'EN'}
                    </span>
                  </div>
                </div>

                {/* Cross-Branch Breakdown */}
                {selectedCustomer.branchVisits && selectedCustomer.branchVisits.length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-[#A8A29E] font-semibold mb-2">
                      Cross-Branch Presence / የቅርንጫፍ ጉብኝት
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {selectedCustomer.branchVisits.map((b) => (
                        <div
                          key={b.branchId}
                          className="bg-[#120F0D] border border-[#2C2724] rounded-lg p-3 text-xs"
                        >
                          <span className="text-stone-300 font-semibold block">{b.branchName}</span>
                          <span className="text-sm font-mono font-bold text-[#D4AF37] mt-1 block">
                            {b.count} {b.count === 1 ? 'Visit' : 'Visits'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Appointment History Records */}
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-[#A8A29E] font-semibold mb-3 flex items-center justify-between">
                    <span>Appointment History / የቀጠሮ ታሪክ</span>
                    {dossierData && (
                      <span className="font-mono text-[10px] text-[#D4AF37]">
                        {dossierData.appointments.length} Total Records
                      </span>
                    )}
                  </h4>

                  {loadingDossier ? (
                    <div className="py-12 text-center text-[#A8A29E]">
                      <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span className="text-xs">Loading appointments...</span>
                    </div>
                  ) : !dossierData || dossierData.appointments.length === 0 ? (
                    <div className="p-8 text-center bg-[#120F0D] border border-[#2C2724] rounded-xl text-stone-500 text-xs">
                      No appointment history recorded for this patron yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dossierData.appointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="bg-[#120F0D] border border-[#2C2724] rounded-xl p-4 text-xs space-y-3"
                        >
                          {/* Booking Top Info */}
                          <div className="flex items-center justify-between pb-2 border-b border-[#2C2724]">
                            <div>
                              <span className="font-mono font-bold text-[#D4AF37]">
                                {apt.bookingNumber}
                              </span>
                              <span className="text-[10px] text-[#A8A29E] ml-2">
                                {new Date(apt.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                apt.status === 'COMPLETED'
                                  ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/40'
                                  : apt.status === 'CONFIRMED'
                                  ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                                  : apt.status === 'CANCELLED'
                                  ? 'bg-red-950/70 text-red-400 border border-red-800/40'
                                  : 'bg-stone-800 text-stone-300 border border-stone-700'
                              }`}
                            >
                              {apt.status}
                            </span>
                          </div>

                          {/* Branch & Financials */}
                          <div className="flex items-center justify-between text-[11px] text-stone-400">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-[#D4AF37]">
                                location_on
                              </span>
                              {apt.branch?.name || 'Main Sanctuary'}
                            </span>
                            <span className="font-mono text-[#FAF7F2]">
                              {Number(apt.totalAmount).toLocaleString()} ETB (Deposit: {Number(apt.depositPaid).toLocaleString()} ETB)
                            </span>
                          </div>

                          {/* Ritual Items */}
                          {apt.items && apt.items.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-[#2C2724]/60">
                              {apt.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between bg-[#181412] p-2 rounded text-[11px]"
                                >
                                  <div>
                                    <p className="font-semibold text-[#FAF7F2]">
                                      {item.service?.name || item.serviceTitleSnapshot || 'Service Ritual'}
                                    </p>
                                    <p className="text-[10px] text-stone-500">
                                      Specialist: {item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : 'Assigned Specialist'}
                                    </p>
                                  </div>
                                  <span className="font-mono text-[#D4AF37]">
                                    {Number(item.priceSnapshot || 0).toLocaleString()} ETB
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ClienteleDirectoryPage;
