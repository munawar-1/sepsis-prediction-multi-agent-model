import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ProblemSection from './components/ProblemSection';
import ThreeAgentsSection from './components/ThreeAgentsSection';
import AlertExperienceSection from './components/AlertExperienceSection';
import SimulationPreviewSection from './components/SimulationPreviewSection';
import ClosingSection from './components/ClosingSection';
import Footer from './components/Footer';
import FlightDeckModal from './components/FlightDeckModal';
import { initLenis, destroyLenis } from './utils/lenis';

export default function App() {
  const [flightDeckOpen, setFlightDeckOpen] = useState(false);

  useEffect(() => {
    // Initialize Lenis smooth scroll and synchronize with GSAP ScrollTrigger
    const lenis = initLenis();

    return () => {
      destroyLenis();
    };
  }, []);

  return (
    <div style={{ backgroundColor: '#080E18', minHeight: '100vh', color: '#F1F5FA', overflowX: 'hidden' }}>
      {/* Navigation Header */}
      <Navbar onOpenFlightDeck={() => setFlightDeckOpen(true)} />

      {/* Consolidated 6-Section Storytelling Journey (~60% of original height) */}
      <main>
        {/* Section 01: Hero Experience with Impilo-style visual scaling */}
        <HeroSection onOpenFlightDeck={() => setFlightDeckOpen(true)} />

        {/* Section 02: The Clinical Problem (Centered split-screen, vertically balanced) */}
        <ProblemSection />

        {/* Section 03: Three-Agent Intelligence & Workflow Pipeline */}
        <ThreeAgentsSection />

        {/* Section 04: Explainable Alert Experience & Human-in-the-Loop Governance */}
        <AlertExperienceSection />

        {/* Section 05: ICU Case Replay Simulation Preview */}
        <SimulationPreviewSection onOpenFlightDeck={() => setFlightDeckOpen(true)} />

        {/* Section 06: Closing Statement with Kinetic Inline CTA */}
        <ClosingSection onOpenFlightDeck={() => setFlightDeckOpen(true)} />
      </main>

      {/* Footer */}
      <Footer onOpenFlightDeck={() => setFlightDeckOpen(true)} />

      {/* Interactive Clinical Flight Deck Modal */}
      <FlightDeckModal
        isOpen={flightDeckOpen}
        onClose={() => setFlightDeckOpen(false)}
      />
    </div>
  );
}
