import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { employeeApi, Employee } from '../../../api/employeeApi';
import { serviceApi, ServiceRitual } from '../../../api/serviceApi';
import { useLanguage } from '../../../context/LanguageContext';

export const ServiceAssignmentView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAm = language === 'am';

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [services, setServices] = useState<ServiceRitual[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      employeeApi.getEmployeeById(id),
      serviceApi.listServices(),
    ])
      .then(([emp, srvList]) => {
        setEmployee(emp);
        setServices(srvList);
        const assigned = new Set<string>();
        if (emp.services) {
          emp.services.forEach((s) => {
            assigned.add(s.serviceId);
          });
        }
        setSelectedIds(assigned);
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Failed to load details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const toggleService = (serviceId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(services.map((s) => s.id)));
  };

  const clearAll = () => {
    setSelectedIds(new Set());
  };

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg(false);
    try {
      await employeeApi.assignServices(id, {
        serviceIds: Array.from(selectedIds),
      });
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to assign services');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredServices = services.filter((srv) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = srv.name?.toLowerCase().includes(q) || (srv as any).title?.toLowerCase().includes(q);
    const codeMatch = srv.code?.toLowerCase().includes(q);
    const catMatch = typeof srv.category === 'string' ? srv.category.toLowerCase().includes(q) : false;
    return Boolean(nameMatch || codeMatch || catMatch);
  });

  return (
    <AdminLayout selectedBranch="all">
      <div className="max-w-4xl mx-auto w-full text-[#FAF7F2] space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2C2724]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold">
                {isAm ? 'የባለሙያ ብቃት' : 'Qualification Mapping'}
              </span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#FAF7F2] mt-1">
              {employee ? `${employee.firstName} ${employee.lastName}` : isAm ? 'ባለሙያ' : 'Specialist'}
            </h1>
            <span className="text-xs text-stone-400">
              {selectedIds.size} {isAm ? 'ብቁ አገልግሎቶች' : 'Qualified Services'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/admin/employees')}
              className="px-3 py-1.5 rounded-lg border border-[#2C2724] text-xs text-stone-300 hover:text-[#D4AF37] transition"
            >
              {isAm ? 'ተመለስ' : 'Back'}
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#b89528] text-[#0E0B09] text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">check</span>
              <span>{isSaving ? (isAm ? 'በመመዝገብ ላይ...' : 'Saving...') : isAm ? 'መዝግብ' : 'Save Skills'}</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">verified</span>
            <span>{isAm ? 'ብቃቶች ተመዝግበዋል' : 'Qualifications saved'}</span>
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-[#181412] p-4 rounded-xl border border-[#2C2724] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-500 text-sm">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAm ? 'አገልግሎት ፈልግ...' : 'Search services...'}
              className="w-full bg-[#0E0B09] border border-[#2C2724] rounded-lg pl-9 pr-3 py-2 text-xs text-[#FAF7F2] placeholder-stone-500 outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="px-2.5 py-1 rounded border border-[#2C2724] text-[11px] text-stone-300 hover:text-[#D4AF37] transition"
            >
              {isAm ? 'ሁሉንም ምረጥ' : 'Select All'}
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="px-2.5 py-1 rounded border border-[#2C2724] text-[11px] text-stone-300 hover:text-red-400 transition"
            >
              {isAm ? 'ሁሉንም አፅዳ' : 'Clear All'}
            </button>
          </div>
        </div>

        {/* Services List */}
        <div className="bg-[#181412] rounded-xl border border-[#2C2724] overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-xs text-stone-400">
              {isAm ? 'በመጫን ላይ...' : 'Loading services...'}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="py-16 text-center text-xs text-stone-500">
              {isAm ? 'ምንም አገልግሎት አልተገኘም' : 'No services found'}
            </div>
          ) : (
            <div className="divide-y divide-[#2C2724]">
              {filteredServices.map((srv) => {
                const isChecked = selectedIds.has(srv.id);
                return (
                  <label
                    key={srv.id}
                    className="flex items-center justify-between p-4 hover:bg-[#231E1B] transition cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleService(srv.id)}
                        className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                      />
                      <div>
                        <div className="font-bold text-xs text-[#FAF7F2] flex items-center gap-2">
                          <span>{srv.name}</span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            #{srv.code}
                          </span>
                        </div>
                        {srv.amharicName && (
                          <div className="text-[11px] text-stone-400">
                            {srv.amharicName}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-stone-400">
                        {srv.durationMinutes} {isAm ? 'ደቂቃ' : 'min'}
                      </span>
                      <span className="font-bold text-[#D4AF37]">
                        {Number(srv.basePrice || 0).toLocaleString()} ETB
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isChecked
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-stone-800 text-stone-500'
                        }`}
                      >
                        {isChecked
                          ? isAm
                            ? 'ብቁ'
                            : 'Qualified'
                          : isAm
                          ? 'ያልተመደበ'
                          : 'Unassigned'}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ServiceAssignmentView;
