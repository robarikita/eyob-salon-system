import React, { useState } from 'react';
import { Navbar } from '../components/home/Navbar';
import { HeroSection } from '../components/home/HeroSection';
import { ValuePropsBanner } from '../components/home/ValuePropsBanner';
import { ServicesSection } from '../components/home/ServicesSection';
import { TeamSection } from '../components/home/TeamSection';
import { LocationsSection } from '../components/home/LocationsSection';
import { ReviewsSection } from '../components/home/ReviewsSection';
import { ConsultationForm } from '../components/home/ConsultationForm';
import { Footer } from '../components/home/Footer';

export const HomePage: React.FC = () => {
  const [selectedService, setSelectedService] = useState('Hair Styling');
  const [selectedBranch, setSelectedBranch] = useState('Bole Bulbula');

  const scrollToBooking = () => {
    const el = document.querySelector('#book');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectService = (serviceName: string) => {
    setSelectedService(serviceName);
  };

  const handleSelectBranch = (branchName: string) => {
    setSelectedBranch(branchName);
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col font-sans selection:bg-brand-gold selection:text-brand-darker">
      {/* 1. Navigation Header */}
      <Navbar onBookClick={scrollToBooking} />

      {/* 2. Luxury Hero Section */}
      <HeroSection onBookClick={scrollToBooking} />

      {/* 3. Value Propositions Banner */}
      <ValuePropsBanner />

      {/* 4. Services Section */}
      <ServicesSection onSelectService={handleSelectService} />

      {/* 5. Master Stylists / Team Section */}
      <TeamSection />

      {/* 6. Branch Locations Section */}
      <LocationsSection onSelectBranch={handleSelectBranch} />

      {/* 7. Client Reviews Section */}
      <ReviewsSection />

      {/* 8. Booking Consultation Form */}
      <ConsultationForm
        initialService={selectedService}
        initialBranch={selectedBranch}
      />

      {/* 9. Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;

