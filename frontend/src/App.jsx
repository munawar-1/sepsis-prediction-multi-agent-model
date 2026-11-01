import React, { useEffect, useState, Suspense, lazy } from 'react';
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

// Lazy-load the Stitch Clinical Intelligence Dashboard for optimal performance
const StitchDashboard = lazy(() => import('./dashboard/StitchDashboard'));

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  });
  const [flightDeckOpen, setFlightDeckOpen] = useState(false);

  // Sync client-side route on browser Back/Forward actions
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Programmatic client navigation
  const navigateTo = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo(0, 0);
    }
  };

  const isDashboard = currentPath.startsWith('/dashboard');

  // Handle Lenis smooth scroll on landing page only
  useEffect(() => {
    if (!isDashboard) {
      const lenis = initLenis();
      return () => {
        destroyLenis();
      };
    } else {
      destroyLenis();
    }
  }, [isDashboard]);

  // If on /dashboard route, render the Google Stitch Clinical Intelligence Dashboard
  if (isDashboard) {
    return (
      <Suspense
        fallback={
          <div className="h-screen w-screen bg-[#070A0F] flex items-center justify-center font-mono text-sm text-[#14B8A6] select-none">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#14B8A6] animate-ping" />
              <span>INITIALIZING AEGIS-ICU WORKSPACE...</span>
            </div>
          </div>
        }
      >
        <StitchDashboard onExitToLanding={() => navigateTo('/')} />
      </Suspense>
    );
  }

  // Otherwise, render the complete Aegis-ICU Editorial Landing Page
  return (
    <div style={{ backgroundColor: '#080E18', minHeight: '100vh', color: '#F1F5FA', overflowX: 'hidden' }}>
      {/* Navigation Header */}
      <Navbar
        onOpenFlightDeck={() => navigateTo('/dashboard')}
      />

      {/* Consolidated 6-Section Storytelling Journey */}
      <main>
        {/* Section 01: Hero Experience */}
        <HeroSection
          onOpenFlightDeck={() => navigateTo('/dashboard')}
        />

        {/* Section 02: The Clinical Problem */}
        <ProblemSection />

        {/* Section 03: Three-Agent Intelligence & Workflow Pipeline */}
        <ThreeAgentsSection />

        {/* Section 04: Explainable Alert Experience & Human-in-the-Loop Governance */}
        <AlertExperienceSection />

        {/* Section 05: ICU Case Replay Simulation Preview */}
        <SimulationPreviewSection
          onOpenFlightDeck={() => navigateTo('/dashboard')}
        />

        {/* Section 06: Closing Statement with Kinetic Inline CTA */}
        <ClosingSection
          onOpenFlightDeck={() => navigateTo('/dashboard')}
        />
      </main>

      {/* Footer */}
      <Footer
        onOpenFlightDeck={() => navigateTo('/dashboard')}
      />

      {/* Optional Clinical Flight Deck Modal */}
      <FlightDeckModal
        isOpen={flightDeckOpen}
        onClose={() => setFlightDeckOpen(false)}
        onLaunchDashboard={() => {
          setFlightDeckOpen(false);
          navigateTo('/dashboard');
        }}
      />
    </div>
  );
}
