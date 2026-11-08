import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { serviceApi, ServiceRitual } from '../../api/serviceApi';

interface ServicesSectionProps {
  onSelectService?: (serviceName: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectService }) => {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceRitual[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadServices() {
      try {
        const data = await serviceApi.listServices({ isActive: true });
        setServices(data || []);
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setLoading(false);
      }
    }
    loadServices();
  }, []);

  const handleServiceClick = (serviceName: string) => {
    if (onSelectService) {
      onSelectService(serviceName);
    }
    navigate('/book');
  };

  const displayServices = services.slice(0, 8);

  return (
    <section className="relative bg-brand-cream text-stone-900 pt-20 pb-20 px-6 lg:px-12 mt-6" id="services">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-2">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold font-luxury text-stone-900 tracking-tight">
              Services / አገልግሎቶች
            </h2>
            <p className="text-stone-600 text-sm sm:text-base mt-1.5 font-normal">
              Signature Rituals
            </p>
          </div>
          <Link
            to="/book"
            className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 text-stone-900 hover:text-amber-800 font-bold text-xs uppercase tracking-wider transition-colors group cursor-pointer"
          >
            <span>All Services / ሁሉም</span>
            <svg
              className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-brand-cream-card rounded-2xl p-4 shadow-sm animate-pulse space-y-3">
                <div className="w-full h-44 bg-stone-300 rounded-xl" />
                <div className="h-4 bg-stone-300 rounded w-3/4" />
                <div className="h-4 bg-stone-300 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* Live Services Grid Cards */}
        {!loading && displayServices.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayServices.map((service) => {
              const price = Number(service.effectivePrice ?? service.basePrice);
              return (
                <article
                  key={service.id}
                  onClick={() => handleServiceClick(service.name)}
                  className="bg-brand-cream-card rounded-2xl p-4 service-card-border shadow-sm hover:shadow-lg hover:border-brand-gold/70 transition-all duration-300 flex flex-col group cursor-pointer"
                >
                  <div className="w-full h-44 rounded-xl overflow-hidden bg-stone-200 mb-3.5">
                    <img
                      src={
                        service.imageUrl ||
                        'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold font-luxury text-stone-900 text-lg group-hover:text-amber-800 transition-colors line-clamp-1">
                        {service.name}
                      </h3>
                      {service.nameAm && (
                        <p className="text-xs text-stone-500 font-serif line-clamp-1 mt-0.5">
                          {service.nameAm}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between">
                      <span className="font-bold text-stone-900 text-sm">
                        {price.toLocaleString()} ETB
                      </span>
                      <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                        Book / ያዝ &rarr;
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default ServicesSection;
