import React from 'react';

interface TeamMember {
  initials: string;
  name: string;
  role: string;
  rating: string;
  reviewsCount: string;
  bio: string;
}

export const teamMembers: TeamMember[] = [
  {
    initials: 'SA',
    name: 'Sara Ahmed',
    role: 'Senior Hair Stylist',
    rating: '★★★★★',
    reviewsCount: '(4.9/5)',
    bio: '10+ years crafting haute bridal styles, precision cuts, and radiant coloring.',
  },
  {
    initials: 'HT',
    name: 'Helen T.',
    role: 'Master Makeup Artist',
    rating: '★★★★★',
    reviewsCount: '(5.0/5)',
    bio: 'Celebrity and editorial glamour specialist emphasizing flawless, natural skin glow.',
  },
  {
    initials: 'TG',
    name: 'Tigist G.',
    role: 'Nail Specialist',
    rating: '★★★★★',
    reviewsCount: '(4.9/5)',
    bio: 'Creative nail architect specializing in modern Russian manicures and custom art.',
  },
];

export const TeamSection: React.FC = () => {
  return (
    <section className="relative bg-[#F4EFE6] text-stone-900 py-20 px-6 lg:px-12 border-t border-[#EAE1D1]" id="team">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-amber-800">
            Master Specialists
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-luxury text-stone-900 tracking-tight mt-1.5">
            Meet Our Team
          </h2>
          <p className="text-stone-600 text-sm sm:text-base mt-2">
            Dedicated professionals with years of artistry to transform your look.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teamMembers.map((member) => (
            <div
              key={member.name}
              className="bg-brand-cream-card rounded-2xl p-6 service-card-border shadow-sm hover:shadow-md transition-shadow text-center flex flex-col items-center"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-200 to-amber-100 flex items-center justify-center text-amber-800 font-luxury text-3xl font-bold mb-4 shadow-inner">
                {member.initials}
              </div>
              <h3 className="font-bold text-lg text-stone-900 font-luxury">
                {member.name}
              </h3>
              <p className="text-xs text-amber-700 font-medium uppercase tracking-wider mt-0.5">
                {member.role}
              </p>
              <div className="flex items-center gap-1 text-amber-500 mt-2 text-sm">
                <span>{member.rating}</span>
                <span className="text-stone-500 text-xs ml-1">{member.reviewsCount}</span>
              </div>
              <p className="text-xs text-stone-600 mt-3 leading-relaxed">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

