import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import {
  serviceApi,
  ServiceRitual,
  CreateServicePayload,
  ServiceCategoryItem,
} from '../../../api/serviceApi';
import { branchApi, BranchDTO } from '../../../api/branchApi';
import { useAuth } from '../../../context/AuthContext';

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

export const ServiceCatalogPage: React.FC = () => {
  const { user } = useAuth();
  const isBranchAdmin = user?.role === 'BRANCH_ADMIN';

  const [branches, setBranches] = useState<BranchDTO[]>([]);
  const [services, setServices] = useState<ServiceRitual[]>([]);
  const [categoriesList, setCategoriesList] = useState<ServiceCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [notification, setNotification] = useState<string | null>(null);

  // Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState<boolean>(false);
  const [catName, setCatName] = useState<string>('');
  const [catNameAm, setCatNameAm] = useState<string>('');
  const [catDescription, setCatDescription] = useState<string>('');
  const [catReason, setCatReason] = useState<string>('');
  const [isSavingCat, setIsSavingCat] = useState<boolean>(false);

  // Service Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<ServiceRitual | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  // Service Form State
  const [formName, setFormName] = useState<string>('');
  const [formNameAm, setFormNameAm] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('');
  const [formBasePrice, setFormBasePrice] = useState<number>(1000);
  const [formDuration, setFormDuration] = useState<number>(60);
  const [formDepositType, setFormDepositType] = useState<'NONE' | 'FIXED' | 'PERCENTAGE'>('NONE');
  const [formDepositValue, setFormDepositValue] = useState<number>(20);
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formReason, setFormReason] = useState<string>('');

  const loadCategories = async () => {
    try {
      const data = await serviceApi.getCategories(
        selectedBranch === 'all' ? undefined : selectedBranch
      );
      setCategoriesList(data || []);
      if (!formCategory && data && data.length > 0) {
        setFormCategory(data[0].name);
      }
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    async function loadBranches() {
      try {
        const list = await branchApi.listBranches();
        setBranches(list || []);
      } catch (err: any) {
        console.error('Failed to load branches:', err);
      }
    }
    loadBranches();
    loadCategories();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await serviceApi.listServices({
        search: searchQuery || undefined,
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        branchId: selectedBranch === 'all' ? undefined : selectedBranch,
        status: selectedStatus,
      });
      setServices(data || []);
    } catch (err: any) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [searchQuery, selectedBranch, selectedStatus, selectedCategory]);

  const handleToggleStatus = async (id: string, name: string) => {
    try {
      const result = await serviceApi.toggleServiceStatus(id);
      const newActive = Boolean(result.service.isActive ?? result.service.status);
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: newActive, status: newActive } : s))
      );
      setNotification(`Status updated: ${name}`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(`Toggle failed: ${err.message}`);
    }
  };

  const openCreateModal = () => {
    setEditingService(null);
    setFormName('');
    setFormNameAm('');
    setFormCategory(categoriesList[0]?.name || 'Hair Styling & Couture');
    setFormBasePrice(1000);
    setFormDuration(60);
    setFormDepositType('NONE');
    setFormDepositValue(20);
    setFormImageUrl('');
    setFormIsActive(true);
    setFormReason('');
    setModalOpen(true);
  };

  const openEditModal = (s: ServiceRitual) => {
    setEditingService(s);
    setFormName(s.name);
    setFormNameAm(s.nameAm || s.amharicName || '');
    setFormCategory(s.category);
    setFormBasePrice(Number(s.basePrice));
    setFormDuration(s.durationMinutes);
    setFormDepositType(s.depositType || 'NONE');
    setFormDepositValue(Number(s.depositValue ?? 0));
    setFormImageUrl(s.imageUrl || '');
    setFormIsActive(s.isActive !== undefined ? s.isActive : s.status);
    setFormReason('');
    setModalOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const res = await serviceApi.uploadImage(file);
      setFormImageUrl(res.url);
      setNotification('Image uploaded / ምስል ተጭኗል');
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      alert(`Image upload failed: ${err.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Please enter service name.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: CreateServicePayload = {
        name: formName.trim(),
        nameAm: formNameAm.trim() || undefined,
        category: formCategory,
        basePrice: Number(formBasePrice),
        durationMinutes: Number(formDuration),
        depositType: formDepositType,
        depositValue: formDepositType === 'NONE' ? 0 : Number(formDepositValue),
        imageUrl: formImageUrl.trim() || undefined,
        isActive: formIsActive,
        reason: formReason.trim() || undefined,
      };

      if (editingService) {
        await serviceApi.updateService(editingService.id, payload);
        setNotification('Service updated / አገልግሎት ተቀይሯል');
      } else {
        await serviceApi.createService(payload);
        setNotification(
          isBranchAdmin
            ? 'Proposed for approval / ለውጥ ቀርቧል'
            : 'Service created / አዲስ አገልግሎት ተፈጥሯል'
        );
      }
      setModalOpen(false);
      fetchServices();
      loadCategories();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      alert('Please enter category name.');
      return;
    }
    if (isBranchAdmin && !catReason.trim()) {
      alert('Reason is required for category proposal.');
      return;
    }

    setIsSavingCat(true);
    try {
      await serviceApi.createCategory({
        name: catName.trim(),
        nameAm: catNameAm.trim() || undefined,
        description: catDescription.trim() || undefined,
        reason: catReason.trim() || undefined,
      });

      setNotification(
        isBranchAdmin
          ? 'Category proposed / ምድብ ቀርቧል'
          : 'Category created / ምድብ ተፈጥሯል'
      );
      setCategoryModalOpen(false);
      setCatName('');
      setCatNameAm('');
      setCatDescription('');
      setCatReason('');
      loadCategories();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(`Category creation failed: ${err.message}`);
    } finally {
      setIsSavingCat(false);
    }
  };

  const totalCount = services.length;
  const activeCount = services.filter((s) => (s.isActive !== undefined ? s.isActive : s.status)).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <AdminLayout activePath="/admin/services">
      <div className="relative w-full text-[#FAF7F2]">
        {/* Toast Alert */}
        {notification && (
          <div className="mb-4 p-3 rounded-xl bg-[#181412] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-between shadow-lg text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span>{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-stone-400 hover:text-white text-[10px] uppercase tracking-wider"
            >
              Dismiss / ዝጋ
            </button>
          </div>
        )}

        {/* Minimalist Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#2C2724]">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-stone-400 uppercase tracking-widest font-semibold">
              <span>Catalog / ዝርዝር</span>
              <span>•</span>
              <span className="text-[#D4AF37]">Dynamic Pricing / ዋጋዎች</span>
            </div>
            <h1 className="text-2xl font-serif text-[#FAF7F2] font-semibold tracking-tight mt-0.5">
              Services / አገልግሎቶች
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setCategoryModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-[#181412] hover:bg-[#2C2724] text-xs font-semibold uppercase tracking-wider text-stone-300 border border-[#2C2724] transition flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">category</span>
              <span>+ Category / አዲስ ምድብ</span>
            </button>
            <Link
              to="/admin/services/pricing"
              className="px-3.5 py-2 rounded-lg bg-[#181412] hover:bg-[#2C2724] text-xs font-semibold uppercase tracking-wider text-stone-300 border border-[#2C2724] transition flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px] text-[#D4AF37]">payments</span>
              <span>Pricing / ዋጋዎች</span>
            </Link>
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow-md"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>+ New / አዲስ</span>
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#181412] p-4 rounded-xl border border-[#2C2724]">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Total / ጠቅላላ</span>
            <div className="text-2xl font-serif font-bold text-[#FAF7F2] mt-1">{totalCount}</div>
          </div>
          <div className="bg-[#181412] p-4 rounded-xl border border-[#2C2724]">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Active / ንቁ</span>
            <div className="text-2xl font-serif font-bold text-[#D4AF37] mt-1">{activeCount}</div>
          </div>
          <div className="bg-[#181412] p-4 rounded-xl border border-[#2C2724]">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Inactive / ቦዘኔ</span>
            <div className="text-2xl font-serif font-bold text-stone-400 mt-1">{inactiveCount}</div>
          </div>
          <div className="bg-[#181412] p-4 rounded-xl border border-[#2C2724]">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Categories / ምድቦች</span>
            <div className="text-2xl font-serif font-bold text-[#FAF7F2] mt-1">{categoriesList.length}</div>
          </div>
        </div>

        {/* Controls Ribbon */}
        <div className="bg-[#181412] p-3 rounded-xl border border-[#2C2724] mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search / ፈልግ..."
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#0E0B09] text-xs text-[#FAF7F2] placeholder-stone-500 border border-[#2C2724] focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Branch Filter */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="h-10 px-3 rounded-lg bg-[#0E0B09] text-xs text-[#FAF7F2] font-semibold uppercase tracking-wider border border-[#2C2724] focus:outline-none focus:border-[#D4AF37] cursor-pointer"
            >
              <option value="all">All Branches / ሁሉም</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 px-3 rounded-lg bg-[#0E0B09] text-xs text-[#FAF7F2] font-semibold uppercase tracking-wider border border-[#2C2724] focus:outline-none focus:border-[#D4AF37] cursor-pointer"
            >
              <option value="all">All / ሁሉም</option>
              <option value="active">Active / ንቁ</option>
              <option value="inactive">Inactive / ቦዘኔ</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#0E0B09] rounded-lg p-1 border border-[#2C2724]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition ${
                  viewMode === 'grid' ? 'bg-[#181412] text-[#D4AF37]' : 'text-stone-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition ${
                  viewMode === 'table' ? 'bg-[#181412] text-[#D4AF37]' : 'text-stone-400 hover:text-white'
                }`}
                title="Table View"
              >
                <span className="material-symbols-outlined text-[18px]">view_agenda</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider shrink-0 transition ${
              selectedCategory === 'All'
                ? 'bg-[#D4AF37] text-[#0E0B09]'
                : 'bg-[#181412] text-stone-400 hover:text-white border border-[#2C2724]'
            }`}
          >
            All / ሁሉም ({totalCount})
          </button>
          {categoriesList.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider shrink-0 transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#D4AF37] text-[#0E0B09]'
                    : 'bg-[#181412] text-stone-400 hover:text-white border border-[#2C2724]'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-80">({cat.count})</span>
                {cat.status === 'PENDING_APPROVAL' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && services.length === 0 && (
          <div className="bg-[#181412] rounded-xl p-12 text-center border border-dashed border-[#2C2724]">
            <span className="material-symbols-outlined text-4xl text-stone-600 mb-2">spa</span>
            <h3 className="font-serif text-base text-[#FAF7F2] font-semibold">No services found / አገልግሎት አልተገኘም</h3>
            <p className="text-xs text-stone-400 mt-1">Try adjusting search or filters.</p>
          </div>
        )}

        {/* GRID VIEW */}
        {!loading && viewMode === 'grid' && services.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {services.map((s) => {
              const displayPrice = Number(s.effectivePrice ?? s.basePrice);
              const isActive = s.isActive !== undefined ? s.isActive : s.status;
              const isPending = s.approvalStatus === 'PENDING_APPROVAL';

              const depositLabel =
                s.depositType === 'NONE'
                  ? 'No Deposit / ያለ ቅድመ ክፍያ'
                  : s.depositType === 'PERCENTAGE'
                  ? `${s.depositValue}% Deposit`
                  : `${s.depositValue} ETB Deposit`;

              return (
                <div
                  key={s.id}
                  className="bg-[#181412] rounded-xl overflow-hidden border border-[#2C2724] hover:border-[#D4AF37]/50 transition flex flex-col justify-between shadow-sm"
                >
                  {/* Image & Header */}
                  <div className="relative h-44 w-full bg-[#0E0B09] overflow-hidden">
                    <img
                      src={
                        s.imageUrl ||
                        'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={s.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#181412] via-transparent to-black/40" />

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-black/80 text-[#D4AF37] font-mono text-[10px] font-bold">
                        #{s.code || s.slug?.slice(0, 8)}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#181412]/90 text-stone-300 text-[10px] font-semibold uppercase">
                        {s.category.split('&')[0].trim()}
                      </span>
                      {isPending && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[9px] font-bold uppercase tracking-wider">
                          Pending / በመጠባበቅ ላይ
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isActive
                            ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                            : 'bg-red-950/40 text-red-400 border border-red-900/40'
                        }`}
                      >
                        {isActive ? 'Active / ንቁ' : 'Inactive / ቦዘኔ'}
                      </span>
                    </div>

                    {/* Bottom Amharic Title & Price */}
                    <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                      <div className="truncate max-w-[65%]">
                        <span className="text-[11px] font-serif text-stone-300 truncate block">
                          {s.nameAm || s.amharicName || '—'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-bold text-[#D4AF37] font-serif">
                          {displayPrice.toLocaleString()}{' '}
                          <span className="text-[10px] text-stone-400 font-sans">ETB</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-base font-bold text-[#FAF7F2] leading-snug line-clamp-1">
                        {s.name}
                      </h3>

                      <div className="flex items-center justify-between text-xs text-stone-400 mt-3 pt-2 border-t border-[#2C2724]">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-[#D4AF37]">schedule</span>
                          {s.durationMinutes} min / ደቂቃ
                        </span>
                        <span className="text-[11px] text-stone-400 font-medium">{depositLabel}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-[#2C2724] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(s)}
                        className="flex-1 py-1.5 px-2 rounded bg-[#2C2724] hover:bg-[#38322e] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider text-center transition"
                      >
                        Edit / አድስ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(s.id, s.name)}
                        className={`py-1.5 px-3 rounded text-xs font-semibold uppercase tracking-wider transition ${
                          isActive
                            ? 'bg-[#2C2724] hover:bg-red-950/40 text-stone-300 hover:text-red-400'
                            : 'bg-[#D4AF37] text-[#0E0B09]'
                        }`}
                        title="Toggle Status"
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <Link
                        to={`/admin/services/pricing?serviceId=${s.id}`}
                        className="p-1.5 rounded bg-[#2C2724] hover:bg-[#38322e] text-[#D4AF37]"
                        title="Branch Pricing / ዋጋዎች"
                      >
                        <span className="material-symbols-outlined text-[16px]">payments</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TABLE VIEW */}
        {!loading && viewMode === 'table' && services.length > 0 && (
          <div className="bg-[#181412] rounded-xl border border-[#2C2724] overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0E0B09] text-stone-400 uppercase tracking-wider font-semibold border-b border-[#2C2724]">
                  <tr>
                    <th className="py-3 px-4">Code / ኮድ</th>
                    <th className="py-3 px-4">Name / ስም</th>
                    <th className="py-3 px-4">Category / ምድብ</th>
                    <th className="py-3 px-4">Duration / ቆይታ</th>
                    <th className="py-3 px-4">Price / ዋጋ</th>
                    <th className="py-3 px-4">Status / ሁኔታ</th>
                    <th className="py-3 px-4 text-right">Actions / ተግባር</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C2724]">
                  {services.map((s) => {
                    const displayPrice = Number(s.effectivePrice ?? s.basePrice);
                    const isActive = s.isActive !== undefined ? s.isActive : s.status;
                    return (
                      <tr key={s.id} className="hover:bg-[#2C2724]/40 transition">
                        <td className="py-3 px-4 font-mono text-[#D4AF37]">{s.code || '—'}</td>
                        <td className="py-3 px-4 font-semibold text-[#FAF7F2]">
                          <div>{s.name}</div>
                          {s.nameAm && <div className="text-[10px] text-stone-400">{s.nameAm}</div>}
                        </td>
                        <td className="py-3 px-4 text-stone-300">{s.category}</td>
                        <td className="py-3 px-4 text-stone-300">{s.durationMinutes} min</td>
                        <td className="py-3 px-4 font-bold text-[#D4AF37]">
                          {displayPrice.toLocaleString()} ETB
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isActive
                                ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                                : 'bg-red-950/40 text-red-400'
                            }`}
                          >
                            {isActive ? 'Active / ንቁ' : 'Inactive / ቦዘኔ'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(s)}
                              className="px-2 py-1 rounded bg-[#2C2724] hover:bg-[#38322e] text-[#FAF7F2]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(s.id, s.name)}
                              className="px-2 py-1 rounded bg-[#2C2724] text-stone-300 hover:text-white"
                            >
                              {isActive ? 'Off' : 'On'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CREATE / EDIT SERVICE MODAL */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#181412] w-full max-w-xl rounded-2xl border border-[#2C2724] p-6 shadow-2xl my-8">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2C2724]">
                <h2 className="text-lg font-serif font-bold text-[#FAF7F2]">
                  {editingService ? 'Edit Ritual / አድስ' : '+ New Ritual / አዲስ'}
                </h2>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-stone-400 hover:text-white p-1"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveService} className="space-y-4">
                {/* Name EN */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-1">
                    Name (EN) / ስም *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Royal Bridal Crown Updo"
                    className="w-full h-10 px-3 rounded-lg bg-[#0E0B09] text-xs text-[#FAF7F2] border border-[#2C2724] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Name Amharic */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-1">
                    Name (አማ) / ስም በአማርኛ
                  </label>
                  <input
                    type="text"
                    value={formNameAm}
                    onChange={(e) => setFormNameAm(e.target.value)}
                    placeholder="ለምሳሌ፡ የሙሽራ የፀጉር አሰራር"
                    className="w-full h-10 px-3 rounded-lg bg-[#0E0B09] text-xs text-[#FAF7F2] border border-[#2C2724] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Category Selection from Live DB */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-1">
                    Category / ምድብ
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#0E0B09] text-xs text-[#FAF7F2] border border-[#2C2724] focus:outline-none focus:border-[#D4AF37]"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration & Base Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-1">
                      Base Price (ETB) / መነሻ ዋጋ *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formBasePrice}
                      onChange={(e) => setFormBasePrice(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-lg bg-[#0E0B09] text-xs text-[#FAF7F2] border border-[#2C2724] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-1">
                      Duration (min) / ቆይታ *
                    </label>
                    <input
                      type="number"
                      required
                      min={5}
                      value={formDuration}
                      onChange={(e) => setFormDuration(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-lg bg-[#0E0B09] text-xs text-[#FAF7F2] border border-[#2C2724] focus:outline-none focus:border-[#D4AF37]"
                    />
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {DURATION_PRESETS.map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setFormDuration(mins)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            formDuration === mins
                              ? 'bg-[#D4AF37] text-[#0E0B09]'
                              : 'bg-[#2C2724] text-stone-400 hover:text-white'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Deposit Rule */}
                <div className="p-3 bg-[#0E0B09] rounded-xl border border-[#2C2724]">
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-2">
                    Deposit Rule / ቅድመ ክፍያ
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {(['NONE', 'PERCENTAGE', 'FIXED'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormDepositType(type)}
                        className={`py-1.5 px-2 rounded text-xs font-semibold uppercase tracking-wider transition ${
                          formDepositType === type
                            ? 'bg-[#D4AF37] text-[#0E0B09]'
                            : 'bg-[#181412] text-stone-400 hover:text-white border border-[#2C2724]'
                        }`}
                      >
                        {type === 'NONE' ? 'None' : type === 'PERCENTAGE' ? 'Percent (%)' : 'Fixed (ETB)'}
                      </button>
                    ))}
                  </div>

                  {formDepositType !== 'NONE' && (
                    <div className="mt-2">
                      <label className="block text-[10px] text-stone-400 font-medium mb-1">
                        {formDepositType === 'PERCENTAGE' ? 'Deposit Percentage (%):' : 'Fixed Deposit (ETB):'}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={formDepositType === 'PERCENTAGE' ? 100 : undefined}
                        value={formDepositValue}
                        onChange={(e) => setFormDepositValue(Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-lg bg-[#181412] text-xs text-[#FAF7F2] border border-[#2C2724] focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  )}
                </div>

                {/* Reason for Proposal if Branch Admin */}
                {isBranchAdmin && (
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-1">
                      Reason / ምክንያት *
                    </label>
                    <input
                      type="text"
                      required
                      value={formReason}
                      onChange={(e) => setFormReason(e.target.value)}
                      placeholder="Reason for proposing new service..."
                      className="w-full h-10 px-3 rounded-lg bg-[#0E0B09] text-xs text-[#FAF7F2] border border-[#2C2724] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                )}

                {/* Image Upload / URL */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-1">
                    Image / ፎቶ
                  </label>
                  <div className="flex items-center gap-3">
                    {formImageUrl && (
                      <img
                        src={formImageUrl}
                        alt="Preview"
                        className="w-14 h-14 rounded-lg object-cover border border-[#D4AF37]/50 shrink-0"
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        disabled={isUploadingImage}
                        className="block w-full text-xs text-stone-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#2C2724] file:text-[#D4AF37] hover:file:bg-[#38322e] cursor-pointer"
                      />
                      <input
                        type="url"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        placeholder="Or paste image URL / ወይም ምስል URL"
                        className="w-full h-8 px-3 rounded bg-[#0E0B09] text-xs text-[#FAF7F2] border border-[#2C2724] focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                  {isUploadingImage && (
                    <p className="text-[10px] text-[#D4AF37] mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
                      Uploading image...
                    </p>
                  )}
                </div>

                {/* Active Status Toggle */}
                <div className="flex items-center justify-between p-3 bg-[#0E0B09] rounded-xl border border-[#2C2724]">
                  <div>
                    <span className="text-xs font-semibold text-[#FAF7F2] block">Service Status / ሁኔታ</span>
                    <span className="text-[10px] text-stone-400">Available for live booking</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormIsActive(!formIsActive)}
                    className={`px-3 py-1 rounded text-xs font-bold uppercase transition ${
                      formIsActive ? 'bg-[#D4AF37] text-[#0E0B09]' : 'bg-[#2C2724] text-stone-400'
                    }`}
                  >
                    {formIsActive ? 'Active / ንቁ' : 'Inactive / ቦዘኔ'}
                  </button>
                </div>

                {/* Submit Buttons */}
                <div className="pt-3 border-t border-[#2C2724] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[#2C2724] hover:bg-[#38322e] text-xs font-semibold uppercase tracking-wider text-stone-300 transition"
                  >
                    Cancel / ሰርዝ
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isUploadingImage}
                    className="px-5 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : isBranchAdmin ? 'Submit / አስገባ' : 'Save / አስቀምጥ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CREATE CATEGORY MODAL */}
        {categoryModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#181412] w-full max-w-md rounded-2xl border border-[#2C2724] p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2C2724]">
                <h2 className="text-lg font-serif font-bold text-[#FAF7F2]">
                  {isBranchAdmin ? 'Propose Category / አዲስ ምድብ' : '+ New Category / አዲስ ምድብ'}
                </h2>
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="text-stone-400 hover:text-white p-1"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-1">
                    Name (EN) / ስም *
                  </label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Scalp Restoration"
                    className="w-full h-10 px-3 rounded-lg bg-[#0E0B09] text-xs text-[#FAF7F2] border border-[#2C2724] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-1">
                    Name (አማ) / ስም በአማርኛ
                  </label>
                  <input
                    type="text"
                    value={catNameAm}
                    onChange={(e) => setCatNameAm(e.target.value)}
                    placeholder="ለምሳሌ፡ የራስ ቅል እንክብካቤ"
                    className="w-full h-10 px-3 rounded-lg bg-[#0E0B09] text-xs text-[#FAF7F2] border border-[#2C2724] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-1">
                    Description / መግለጫ
                  </label>
                  <textarea
                    rows={2}
                    value={catDescription}
                    onChange={(e) => setCatDescription(e.target.value)}
                    placeholder="Brief description..."
                    className="w-full p-3 rounded-lg bg-[#0E0B09] text-xs text-[#FAF7F2] border border-[#2C2724] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {isBranchAdmin && (
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-1">
                      Reason / ምክንያት *
                    </label>
                    <input
                      type="text"
                      required
                      value={catReason}
                      onChange={(e) => setCatReason(e.target.value)}
                      placeholder="Why is this category required?"
                      className="w-full h-10 px-3 rounded-lg bg-[#0E0B09] text-xs text-[#FAF7F2] border border-[#2C2724] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                )}

                <div className="pt-3 border-t border-[#2C2724] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCategoryModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[#2C2724] hover:bg-[#38322e] text-xs font-semibold uppercase tracking-wider text-stone-300 transition"
                  >
                    Cancel / ሰርዝ
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingCat}
                    className="px-5 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
                  >
                    {isSavingCat ? 'Saving...' : isBranchAdmin ? 'Submit / አስገባ' : 'Create / ፍጠር'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ServiceCatalogPage;
