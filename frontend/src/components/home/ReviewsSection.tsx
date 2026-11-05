import React from 'react';

interface ClientReview {
  id: string;
  name: string;
  badge: string;
  comment: string;
  rating: string;
}

export const reviewsData: ClientReview[] = [
  {
    id: 'review-1',
    name: 'Eyob M.',
    badge: 'Verified Client',
    comment:
      '"The bridal hair team exceeded every expectation! My hair stayed magical for 14 hours straight, through all day and evening!"',
    rating: '★★★★★',
  },
  {
    id: 'review-2',
    name: 'Rediet K.',
    badge: 'Verified Client',
    comment:
      '"The atmosphere in the Kazanchis salon feels like a 5-star sanctuary. Tigist does the most pristine manicure that lasts 4+ weeks."',
    rating: '★★★★★',
  },
  {
    id: 'review-3',
    name: 'Bethlehem B.',
    badge: 'Verified Client',
    comment:
      '"The facial treatment completely reset my skin before my graduation! Clean, highly professional, and relaxing."',
    rating: '★★★★★',
  },
];

export const ReviewsSection: React.FC = () => {
  return (
    <section className="relative bg-[#F6F1E8] text-stone-900 py-20 px-6 lg:px-12 border-t border-[#EAE1D1]" id="reviews">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-amber-800">
            Client Love
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-luxury text-stone-900 tracking-tight mt-1.5">
            What Our Clients Say
          </h2>
          <p className="text-stone-600 text-sm sm:text-base mt-2">
            Real experiences from our valued beauty club members.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviewsData.map((review) => (
            <div
              key={review.id}
              className="bg-brand-cream-card p-6 rounded-2xl service-card-border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-3 text-sm">
                  {review.rating}
                </div>
                <p className="text-stone-700 text-sm italic leading-relaxed">
                  {review.comment}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="font-bold text-stone-900 text-sm font-luxury">
                  {review.name}
                </span>
                <span className="text-xs text-stone-400">
                  {review.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

