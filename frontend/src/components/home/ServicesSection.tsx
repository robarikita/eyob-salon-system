import React from 'react';

interface ServiceItem {
  id: string;
  name: string;
  price: string;
  image: string;
  alt: string;
}

interface ServicesSectionProps {
  onSelectService?: (serviceName: string) => void;
}

export const servicesData: ServiceItem[] = [
  {
    id: 'hair-styling',
    name: 'Hair Styling',
    price: 'From 500 Br',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAiDscVuwZgbYQI5-jEbKdOKNsM7pQrQJPkaa6O3t9MbCkYtd4J6fWmcc5y1NYGcZWACP3DNGP6XIUHOzp8OrxHRS_ak9UDgh9jZZGmxnxqiEdORNWg38R0qRsrhAbZ2K1GSpW8WKGEM6_jJNNYW8IfO2JfnjWnT8D9Q9QFXYepciKjt70yPSIbLjwQt2GPn9-d7LVEOXqS55LdjJQrxLo3c8-RqOA9ucnLhJAXNWsw',
    alt: 'Hair Styling Service',
  },
  {
    id: 'makeup',
    name: 'Makeup',
    price: 'From 500 Br',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpzjCUzM6_ArmIuUB0b-RozQjSb6vZ2bHswYG0Agkz7VRDk15t1lJvktLx-dL21r1rrARDh_eoPdkH2LUBFpsby0waig_zW2mJC7Tx7S_iObiCBAVx37UZ5-lBXGLZ32ZxL_HhANcvJrkFMtVinR6zY7tlFTqafCNLDKhA5laP8cUcarbo_11RLgwKvNKmDPjkoIiESbUY9hpD-rA0nwdxvNlv6oEbJnfG5zFcg9jB',
    alt: 'Makeup Application Service',
  },
  {
    id: 'nail-care',
    name: 'Nail Care',
    price: 'From 300 Br',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR_-L2NLWpYLWzUqKlPadJX206qyjOvFSrDxAAu5RcVVcvqN7Ell-k17UH5MuHgqpcDafWTDBE3fXygRSkKDvXIwLrBMngUx2HqDGAzCTKJg712CnG26pWh5cqBGRS53SKlQIFzy2LOvnmwNtpJi0aznb-8EhehW2uk6uShmpG60BNV7s_kENp6xyYhH0u9hn-rMAz8-g813frtG70TAspg1AK2raRYmMuhh3frSzc',
    alt: 'Nail Care Manicure & Pedicure Service',
  },
  {
    id: 'facial-treatment',
    name: 'Facial Treatment',
    price: 'From 500 Br',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYX7wrXYLurEKNGYI3ONkWetNfWyrr1LUoR0aC_ecZb_ueibsD20QALBW43JoRY3UJMXriuSuYr0_PBHb3UhEdiDxJsEn8OyqWQdjV1734BheD8PTVFXYKuLBTi6dmPGb-XrA_ye-dxYl8S4zf5QCNwsS_3h83_XK8tksrvz4DfrxFwXQJy40hCxqlctt5srOGQLkjf_kVl1K93XfHlFFSGFi_Zj9j_A753TYGnDwX',
    alt: 'Facial Treatment & Skin Care Service',
  },
];

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectService }) => {
  const handleServiceClick = (serviceName: string) => {
    if (onSelectService) {
      onSelectService(serviceName);
    }
    const el = document.querySelector('#book');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative bg-brand-cream text-stone-900 pt-20 pb-20 px-6 lg:px-12 mt-6" id="services">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-2">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold font-luxury text-stone-900 tracking-tight">
              Our Services
            </h2>
            <p className="text-stone-600 text-sm sm:text-base mt-1.5 font-normal">
              Explore our premium beauty services
            </p>
          </div>
          <a
            href="#book"
            onClick={(e) => {
              e.preventDefault();
              const el = document.querySelector('#book');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 text-stone-900 hover:text-amber-800 font-semibold text-sm transition-colors group cursor-pointer"
          >
            <span>View All Services</span>
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        {/* Services Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {servicesData.map((service) => (
            <article
              key={service.id}
              onClick={() => handleServiceClick(service.name)}
              className="bg-brand-cream-card rounded-2xl p-4 service-card-border shadow-sm hover:shadow-lg hover:border-brand-gold/70 transition-all duration-300 flex flex-col group cursor-pointer"
            >
              <div className="w-full h-44 rounded-xl overflow-hidden bg-stone-200 mb-3.5">
                <img
                  src={service.image}
                  alt={service.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <h3 className="font-bold text-stone-900 text-base group-hover:text-amber-800 transition-colors">
                {service.name}
              </h3>
              <p className="text-xs text-amber-700 font-semibold mt-0.5">
                {service.price}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

