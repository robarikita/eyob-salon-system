import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BranchLocation {
  id: string;
  name: string;
  badge: string;
  address: string;
  hours: string;
}

interface LocationsSectionProps {
  onSelectBranch?: (branchName: string) => void;
}

export const locationsData: BranchLocation[] = [
  {
    id: 'bole-bulbula',
    name: 'Bole Bulbula',
    badge: 'Open Daily',
    address: 'Behind Morning Star Mall, Building 2, Ground Floor',
    hours: 'Hours: 9:00 AM - 8:00 PM',
  },
  {
    id: 'kazanchis',
    name: 'Kazanchis',
    badge: 'Open Daily',
    address: 'Next to UNECA Compound, Palace View Complex',
    hours: 'Hours: 8:30 AM - 8:30 PM',
  },
  {
    id: 'cmc',
    name: 'CMC',
    badge: 'Open Daily',
    address: 'Tsehay Real Estate Square, Wing B, Suite 104',
    hours: 'Hours: 9:00 AM - 8:00 PM',
  },
];

export const LocationsSection: React.FC<LocationsSectionProps> = ({ onSelectBranch }) => {
  const navigate = useNavigate();

  const handleBranchClick = (branchId: string, branchName: string) => {
    if (onSelectBranch) {
      onSelectBranch(branchName);
    }
    navigate(`/book?branch=${encodeURIComponent(branchId)}`);
  };

  return (
    <section className="relative bg-brand-cream text-stone-900 py-20 px-6 lg:px-12" id="locations">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-amber-800">
              Convenient Luxury
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-luxury text-stone-900 tracking-tight mt-1.5">
              Branch Locations
            </h2>
            <p className="text-stone-600 text-sm sm:text-base mt-1">
              Visit us at any of our premier city locations across Addis Ababa.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {locationsData.map((branch) => (
            <div
              key={branch.id}
              className="bg-brand-cream-card rounded-2xl p-6 service-card-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold font-luxury text-xl text-stone-900">
                    {branch.name}
                  </h3>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                    {branch.badge}
                  </span>
                </div>
                <p className="text-sm text-stone-600 mb-2">
                  {branch.address}
                </p>
                <p className="text-xs text-stone-500 mb-4">
                  {branch.hours}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleBranchClick(branch.id, branch.name)}
                className="text-xs font-bold uppercase tracking-wider text-amber-800 hover:text-amber-900 flex items-center gap-1.5 pt-3 border-t border-stone-200/80 transition-colors text-left cursor-pointer"
              >
                <span>BOOK THIS BRANCH</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

