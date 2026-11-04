import React, { useState, useEffect } from 'react';

interface ConsultationFormProps {
  initialService?: string;
  initialBranch?: string;
}

export const ConsultationForm: React.FC<ConsultationFormProps> = ({
  initialService = 'Hair Styling',
  initialBranch = 'Bole Bulbula',
}) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [service, setService] = useState(initialService);
  const [branch, setBranch] = useState(initialBranch);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Update if initial props change
  useEffect(() => {
    if (initialService) setService(initialService);
  }, [initialService]);

  useEffect(() => {
    if (initialBranch) setBranch(initialBranch);
  }, [initialBranch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!phoneNumber.trim()) {
      setErrorMessage('Please enter your contact phone number.');
      return;
    }

    setIsSubmitting(true);

    // Simulate reservation submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 600);
  };

  const handleReset = () => {
    setFullName('');
    setPhoneNumber('');
    setIsSubmitted(false);
    setErrorMessage('');
  };

  return (
    <section className="relative bg-brand-cream text-stone-900 py-20 px-6 lg:px-12 border-t border-[#EAE1D1]" id="book">
      <div className="max-w-4xl mx-auto bg-gradient-to-br from-brand-cream-card to-[#F7EFE1] p-8 sm:p-12 rounded-3xl service-card-border shadow-md">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-amber-800">
            Quick Reservation
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-luxury text-stone-900 tracking-tight mt-1.5">
            Book Your Consultation
          </h2>
          <p className="text-stone-600 text-sm mt-2">
            Reserve an appointment with your favorite stylist or request customized beauty services.
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center bg-white/80 rounded-2xl border border-amber-200/80 shadow-sm animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="font-luxury text-2xl font-bold text-stone-900 mb-2">
              Appointment Request Received!
            </h3>
            <p className="text-stone-600 text-sm max-w-md mx-auto mb-4">
              Thank you, <span className="font-semibold text-stone-900">{fullName}</span>. We have noted your request for{' '}
              <span className="font-semibold text-stone-900">{service}</span> at our{' '}
              <span className="font-semibold text-stone-900">{branch}</span> branch. Our reception team will call{' '}
              <span className="font-semibold text-stone-900">{phoneNumber}</span> shortly to confirm your time slot.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2.5 rounded-full text-xs font-semibold text-stone-950 gold-gradient-btn tracking-wide"
            >
              Book Another Appointment
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {errorMessage && (
              <div className="sm:col-span-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {errorMessage}
              </div>
            )}

            <div>
              <label htmlFor="full-name" className="block text-xs font-medium text-stone-700 mb-1">
                Your Full Name
              </label>
              <input
                id="full-name"
                name="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Helen Kebede"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 text-sm bg-white outline-none transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="phone-number" className="block text-xs font-medium text-stone-700 mb-1">
                Phone Number
              </label>
              <input
                id="phone-number"
                name="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+251 9..."
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 text-sm bg-white outline-none transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="select-service" className="block text-xs font-medium text-stone-700 mb-1">
                Select Service
              </label>
              <select
                id="select-service"
                name="service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 text-sm bg-white outline-none transition-all"
              >
                <option value="Hair Styling">Hair Styling</option>
                <option value="Makeup">Makeup Application</option>
                <option value="Nail Care">Nail Care &amp; Spa</option>
                <option value="Facial Treatment">Facial Treatment</option>
                <option value="Bridal Complete Package">Bridal Complete Package</option>
              </select>
            </div>

            <div>
              <label htmlFor="select-branch" className="block text-xs font-medium text-stone-700 mb-1">
                Preferred Branch
              </label>
              <select
                id="select-branch"
                name="branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 text-sm bg-white outline-none transition-all"
              >
                <option value="Bole Bulbula">Bole Bulbula</option>
                <option value="Kazanchis">Kazanchis</option>
                <option value="CMC">CMC</option>
              </select>
            </div>

            <div className="sm:col-span-2 mt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full text-stone-950 font-semibold text-sm sm:text-base gold-gradient-btn tracking-wide flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                <span>{isSubmitting ? 'Reserving...' : 'Confirm Appointment'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

