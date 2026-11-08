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
        setLoading(true);
        const data = await serviceApi.listServices({ status: 'active' });
        setServices(data || []);
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setLoading(false);
      }
    }
    loadServices();
  }, []);

  const handleServiceClick = (service: ServiceRitual) => {
    try {
      sessionStorage.setItem('booking_service', JSON.stringify(service));
    } catch {
      // Ignore
    }
    if (onSelectService) {
      onSelectService(service.name);
    }
    navigate('/book');
  };

  const displayServices = services.slice(0, 8);

  return (
    <section className="relative bg-[#0E0B09] text-[#FAF7F2] pt-20 pb-20 px-6 lg:px-12 border-t border-[#2C2724]" id="services">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-[#2C2724]">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold mb-1">
              <span>Sanctuary Rituals</span>
              <span>•</span>
              <span>ልዩ አገልግሎቶች</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#FAF7F2] tracking-tight">
              Services / አገልግሎቶች
            </h2>
          </div>
          <Link
            to="/book"
            className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 text-[#D4AF37] hover:text-white font-bold text-xs uppercase tracking-wider transition-colors group cursor-pointer"
          >
            <span>All Services / ሁሉም</span>
            <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-1">
              arrow_forward
            </span>
          </Link>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[#181412] rounded-xl p-4 border border-[#2C2724] animate-pulse space-y-3">
                <div className="w-full aspect-video bg-[#2C2724] rounded-lg" />
                <div className="h-4 bg-[#2C2724] rounded w-3/4" />
                <div className="h-4 bg-[#2C2724] rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* Live Services Grid Cards */}
        {!loading && displayServices.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayServices.map((service) => {
              const price = Number(service.effectivePrice ?? service.basePrice);
              const duration = service.effectiveDuration ?? service.durationMinutes;

              return (
                <article
                  key={service.id}
                  onClick={() => handleServiceClick(service)}
                  className="bg-[#181412] rounded-xl p-4 border border-[#2C2724] hover:border-[#D4AF37] transition-all duration-300 flex flex-col justify-between group cursor-pointer shadow-md"
                >
                  <div>
                    {/* Aspect-Video Image Banner with Gradient Fallback */}
                    <div className="w-full aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-[#181412] to-[#2C2724] relative mb-3 border border-[#2C2724]">
                      {service.imageUrl ? (
                        <img
                          src={service.imageUrl}
                          alt={service.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[#D4AF37]/60">
                          <span className="material-symbols-outlined text-3xl mb-1">spa</span>
                          <span className="text-[9px] uppercase tracking-widest font-semibold text-stone-400">Sanctuary Ritual</span>
                        </div>
                      )}

                      {service.isUniformPrice === false && (
                        <span className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm text-[#D4AF37] border border-[#D4AF37]/40 px-2 py-0.5 rounded text-[10px] font-semibold">
                          Variable / ተለዋዋጭ
                        </span>
                      )}
                    </div>

                    {/* Category Pill */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] bg-[#0E0B09] px-2 py-0.5 rounded border border-[#2C2724]">
                        {service.category?.split('&')[0]?.trim() || service.code || 'Ritual'}
                      </span>
                    </div>

                    {/* Ritual Title */}
                    <h3 className="font-serif font-bold text-[#FAF7F2] text-base group-hover:text-[#D4AF37] transition-colors line-clamp-1 leading-snug">
                      {service.name}
                    </h3>
                    {(service.nameAm || service.amharicName) && (
                      <p className="text-xs text-stone-400 font-serif line-clamp-1 mt-0.5">
                        {service.nameAm || service.amharicName}
                      </p>
                    )}
                  </div>

                  {/* Duration, Price & Action Button */}
                  <div className="mt-4 pt-3 border-t border-[#2C2724] space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-400 flex items-center gap-1 font-medium text-[11px]">
                        <span className="material-symbols-outlined text-xs text-[#D4AF37]">schedule</span>
                        {duration} min / ደቂቃ
                      </span>
                      <div className="text-right">
                        <span className="font-bold text-sm text-[#D4AF37] font-serif">
                          {service.isUniformPrice === false
                            ? `From ${Number(service.minPrice || price).toLocaleString()} ETB`
                            : `${Number(price).toLocaleString()} ETB`}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="w-full py-2 rounded-lg bg-[#2C2724] group-hover:bg-[#D4AF37] text-stone-300 group-hover:text-[#0E0B09] text-xs font-bold uppercase tracking-wider transition-colors duration-200 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>Book / ያዝ</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
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
