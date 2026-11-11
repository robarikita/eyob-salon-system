import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { serviceApi, GovernanceRequestItem } from '../../../api/serviceApi';
import { useAuth } from '../../../context/AuthContext';
import { useBranchFilter } from '../../../context/BranchFilterContext';
import { formatDateTime } from '../../../utils/formatDate';

export const GovernanceApprovalPage: React.FC = () => {
  const { user } = useAuth();
  const { effectiveBranchId } = useBranchFilter();
  const [requests, setRequests] = useState<GovernanceRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await serviceApi.getGovernanceRequests(filterStatus, effectiveBranchId);
      setRequests(data || []);
    } catch (err: any) {
      console.error('Failed to load governance requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filterStatus, effectiveBranchId]);

  const handleReview = async (id: string, decision: 'APPROVE' | 'REJECT') => {
    setProcessingId(id);
    try {
      const note = reviewNotes[id] || undefined;
      await serviceApi.reviewGovernanceRequest(id, { decision, reviewNote: note });
      setToastMessage(
        decision === 'APPROVE' ? 'Approved / ጸድቋል' : 'Rejected / ውድቅ ተደርጓል'
      );
      fetchRequests();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(`Review action failed: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const isOwner = user?.role === 'OWNER';

  return (
    <AdminLayout activePath="/admin/governance">
      <div className="w-full text-[#FAF7F2]">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="mb-4 p-3 rounded-xl bg-[#181412] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-between shadow-xl text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-stone-400 hover:text-white text-[10px] uppercase tracking-wider"
            >
              Dismiss / ዝጋ
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#2C2724]">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-stone-400 uppercase tracking-widest font-semibold">
              <span>Governance / አመራር</span>
              <span>•</span>
              <span className="text-[#D4AF37]">Approval Center / ማጽደቂያ</span>
            </div>
            <h1 className="text-2xl font-serif text-[#FAF7F2] font-semibold tracking-tight mt-0.5">
              Change Approvals / ማጽደቂያ
            </h1>
          </div>

          {/* Filter Status Tabs */}
          <div className="flex items-center bg-[#181412] p-1 rounded-xl border border-[#2C2724]">
            {[
              { label: 'Pending / በመጠባበቅ ላይ', value: 'PENDING' },
              { label: 'Approved / የጸደቁ', value: 'APPROVED' },
              { label: 'Rejected / ውድቅ', value: 'REJECTED' },
              { label: 'All / ሁሉም', value: 'ALL' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilterStatus(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                  filterStatus === tab.value
                    ? 'bg-[#D4AF37] text-[#0E0B09]'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="p-12 text-center text-stone-400 text-xs">
            <span className="material-symbols-outlined text-2xl animate-spin text-[#D4AF37] mb-2 block">
              sync
            </span>
            Loading / በመጫን ላይ...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center bg-[#181412] rounded-xl border border-[#2C2724]">
            <span className="material-symbols-outlined text-4xl text-stone-600 mb-2 block">
              task_alt
            </span>
            <p className="text-stone-400 text-xs uppercase tracking-wider">
              No Pending Requests / ጥያቄዎች የሉም
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const isPending = req.status === 'PENDING';
              const p = req.payload || {};

              return (
                <div
                  key={req.id}
                  className="bg-[#181412] p-5 rounded-xl border border-[#2C2724] hover:border-[#D4AF37]/30 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Type Badge */}
                      <span className="px-2.5 py-1 rounded bg-[#0E0B09] text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] font-bold uppercase tracking-wider">
                        {req.type === 'PRICE_UPDATE'
                          ? 'Price / ዋጋ'
                          : req.type === 'CATEGORY_CREATION'
                          ? 'Category / ምድብ'
                          : req.type === 'SERVICE_CREATION'
                          ? 'Service / አገልግሎት'
                          : req.type}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          req.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : req.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {req.status === 'PENDING'
                          ? 'Pending / በመጠባበቅ ላይ'
                          : req.status === 'APPROVED'
                          ? 'Approved / ጸድቋል'
                          : 'Rejected / ውድቅ'}
                      </span>

                      {/* Branch Name */}
                      <span className="text-xs text-stone-300 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-[#D4AF37]">
                          location_on
                        </span>
                        {req.branch?.name || 'Branch'}
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-400 text-right">
                      <div>{formatDateTime(req.createdAt)}</div>
                      {req.updatedAt && req.updatedAt !== req.createdAt && (
                        <div className="text-[9px] text-stone-500">
                          Updated: {formatDateTime(req.updatedAt)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reason & Payload Diff */}
                  <div className="mb-4">
                    {/* Enriched Diff Card */}
                    {(req.type === 'PRICE_UPDATE' || req.type === 'BRANCH_SERVICE_DEACTIVATION') ? (
                      <div className="bg-[#0E0B09] p-3.5 rounded-xl border border-[#2C2724] space-y-3">
                        {/* Service Thumbnail & Info */}
                        <div className="flex items-center gap-3">
                          {p.serviceImage || p.imageUrl ? (
                            <img
                              src={p.serviceImage || p.imageUrl}
                              alt={p.serviceName || p.name || 'Ritual'}
                              className="w-12 h-12 rounded-lg object-cover border border-[#2C2724] flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-[#181412] border border-[#2C2724] flex items-center justify-center text-[#D4AF37] flex-shrink-0">
                              <span className="material-symbols-outlined text-xl">spa</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="px-2 py-0.5 rounded bg-[#181412] text-stone-400 border border-[#2C2724] text-[10px] font-semibold uppercase">
                                {p.categoryName || p.category || 'Ritual'}
                              </span>
                              {p.serviceId && (
                                <span className="text-[10px] font-mono text-stone-500">#{String(p.serviceId).slice(0, 8)}</span>
                              )}
                            </div>
                            <h4 className="text-sm font-serif font-bold text-[#FAF7F2] truncate">
                              {p.serviceName || p.name || 'Ritual / አገልግሎት'}
                            </h4>
                            {(p.serviceNameAm || p.nameAm) && (
                              <p className="text-[11px] font-serif text-stone-400 truncate">
                                {p.serviceNameAm || p.nameAm}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Comparison Pills */}
                        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#2C2724]/60 text-xs">
                          <div className="flex items-center gap-1 bg-[#181412] px-2.5 py-1 rounded-lg border border-[#2C2724]">
                            <span className="text-stone-400 text-[10px] uppercase">Current:</span>
                            <span className="text-stone-200 font-mono font-bold">
                              {p.currentPrice !== undefined && p.currentPrice !== null
                                ? `${Number(p.currentPrice).toLocaleString()} ETB`
                                : p.currentBranchPrice !== undefined && p.currentBranchPrice !== null
                                ? `${Number(p.currentBranchPrice).toLocaleString()} ETB`
                                : p.currentBasePrice !== undefined && p.currentBasePrice !== null
                                ? `${Number(p.currentBasePrice).toLocaleString()} ETB`
                                : '—'}
                            </span>
                          </div>
                          <span className="text-stone-500 font-bold">→</span>
                          <div className="flex items-center gap-1 bg-[#D4AF37]/10 px-2.5 py-1 rounded-lg border border-[#D4AF37]/30">
                            <span className="text-[#D4AF37] text-[10px] uppercase font-semibold">
                              {req.type === 'BRANCH_SERVICE_DEACTIVATION' ? 'Action:' : 'Proposed:'}
                            </span>
                            <span className="text-[#D4AF37] font-mono font-bold">
                              {req.type === 'BRANCH_SERVICE_DEACTIVATION'
                                ? 'Deactivate / ማቆም'
                                : `${Number(p.proposedPrice ?? p.customPrice ?? 0).toLocaleString()} ETB`}
                            </span>
                          </div>
                          {(p.proposedDuration || p.customDurationMinutes) && (
                            <div className="flex items-center gap-1 bg-[#181412] px-2.5 py-1 rounded-lg border border-[#2C2724]">
                              <span className="text-stone-400 text-[10px] uppercase">Duration:</span>
                              <span className="text-stone-300 font-mono font-semibold">
                                {p.proposedDuration || p.customDurationMinutes} min
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#0E0B09] p-3 rounded-lg border border-[#2C2724] text-xs space-y-1.5 font-mono">
                        {req.type === 'CATEGORY_CREATION' && (
                          <div className="space-y-1 text-stone-300">
                            <div><span className="text-stone-400 font-sans">Name:</span> {p.name}</div>
                            {p.nameAm && <div><span className="text-stone-400 font-sans">Amharic:</span> {p.nameAm}</div>}
                            {p.description && <div><span className="text-stone-400 font-sans">Desc:</span> {p.description}</div>}
                          </div>
                        )}
                        {req.type === 'SERVICE_CREATION' && (
                          <div className="space-y-1 text-stone-300">
                            <div><span className="text-stone-400 font-sans">Ritual:</span> {p.name} ({p.code})</div>
                            <div><span className="text-stone-400 font-sans">Category:</span> {p.category}</div>
                            <div className="text-[#D4AF37]"><span className="text-stone-400 font-sans">Price:</span> {p.basePrice} ETB ({p.durationMinutes}m)</div>
                          </div>
                        )}
                        {req.type === 'EMPLOYEE_REGISTRATION' && (
                          <div className="space-y-1 text-stone-300">
                            <div><span className="text-stone-400 font-sans">Specialist:</span> {p.firstName} {p.lastName}</div>
                            {p.phone && <div><span className="text-stone-400 font-sans">Phone:</span> {p.phone}</div>}
                            {(p.ritualTitle || p.title) && (
                              <div><span className="text-stone-400 font-sans">Title:</span> {p.ritualTitle || p.title}</div>
                            )}
                            {p.hireReason && (
                              <div><span className="text-stone-400 font-sans">Hire Reason:</span> {p.hireReason}</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Branch Badge + Reason */}
                    <div className="mt-2.5 flex items-start gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-[#0E0B09] text-[#D4AF37] border border-[#2C2724] text-[10px] font-bold uppercase tracking-wider flex-shrink-0">
                        {req.branch?.name || 'Branch'}
                      </span>
                      <p className="text-stone-300 text-xs">
                        <span className="text-stone-500 font-normal">Reason / ምክንያት: </span>
                        {req.reason}
                      </p>
                    </div>
                  </div>

                  {/* Review Note Display if already reviewed */}
                  {req.reviewNote && (
                    <div className="mb-3 p-2 rounded bg-[#0E0B09] text-[11px] text-stone-400 border border-[#2C2724]">
                      <span className="text-[#D4AF37] font-semibold">Reviewer Note / ማስታወሻ: </span>
                      {req.reviewNote}
                    </div>
                  )}

                  {/* Actions for Owner */}
                  {isOwner && isPending && (
                    <div className="pt-3 border-t border-[#2C2724] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <input
                        type="text"
                        placeholder="Optional note / ማስታወሻ..."
                        value={reviewNotes[req.id] || ''}
                        onChange={(e) =>
                          setReviewNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                        }
                        className="flex-1 h-9 px-3 rounded-lg bg-[#0E0B09] text-xs text-[#FAF7F2] placeholder-stone-500 border border-[#2C2724] focus:outline-none focus:border-[#D4AF37]"
                      />

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={processingId === req.id}
                          onClick={() => handleReview(req.id, 'REJECT')}
                          className="px-4 py-2 rounded-lg bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-900/40 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
                        >
                          Reject / ውድቅ
                        </button>
                        <button
                          type="button"
                          disabled={processingId === req.id}
                          onClick={() => handleReview(req.id, 'APPROVE')}
                          className="px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#C59A3F] text-[#0E0B09] text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 shadow-md"
                        >
                          Approve / አጽድቅ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default GovernanceApprovalPage;

