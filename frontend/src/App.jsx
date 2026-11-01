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
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { initLenis, destroyLenis } from './utils/lenis';

// Lazy-load the Stitch Clinical Intelligence Dashboard for optimal performance
const StitchDashboard = lazy(() => import('./dashboard/StitchDashboard'));

function AppContent() {
  const { isAuthenticated } = useAuth();
  const { isDark } = useTheme();
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
  const isLogin = currentPath === '/login';
  const isRegister = currentPath === '/register';

  // Handle Lenis smooth scroll on landing page only
  useEffect(() => {
    if (!isDashboard && !isLogin && !isRegister) {
      const lenis = initLenis();
      return () => {
        destroyLenis();
      };
    } else {
      destroyLenis();
    }
  }, [isDashboard, isLogin, isRegister]);

  // ROUTE 1: Dedicated Login Page
  if (isLogin) {
    return <LoginPage onNavigate={navigateTo} returnPath="/dashboard" />;
  }

  // ROUTE 2: Dedicated Registration Page
  if (isRegister) {
    return <RegisterPage onNavigate={navigateTo} />;
  }

  // ROUTE 3: Protected Clinical Dashboard
  if (isDashboard) {
    // If not authenticated, redirect to Login
    if (!isAuthenticated) {
      return (
        <LoginPage
          onNavigate={navigateTo}
          returnPath="/dashboard"
        />
      );
    }

    return (
      <Suspense
        fallback={
          <div className={`h-screen w-screen flex items-center justify-center font-mono text-sm select-none ${
            isDark ? 'bg-[#070A0F] text-[#14B8A6]' : 'bg-[#F4F6F9] text-[#0D9488]'
          }`}>
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

  // ROUTE 4: Editorial Landing Page
  const handleLaunchFlightDeck = () => {
    if (isAuthenticated) {
      navigateTo('/dashboard');
    } else {
      navigateTo('/login');
    }
  };

  return (
    <div style={{
      backgroundColor: isDark ? '#080E18' : '#F4F6F9',
      minHeight: '100vh',
      color: isDark ? '#F1F5FA' : '#0F172A',
      overflowX: 'hidden',
      transition: 'background-color 0.2s ease, color 0.2s ease'
    }}>
      {/* Navigation Header */}
      <Navbar
        onOpenFlightDeck={handleLaunchFlightDeck}
        onNavigate={navigateTo}
      />

      {/* Consolidated 6-Section Storytelling Journey */}
      <main>
        {/* Section 01: Hero Experience */}
        <HeroSection
          onOpenFlightDeck={handleLaunchFlightDeck}
        />

        {/* Section 02: The Clinical Problem */}
        <ProblemSection />

        {/* Section 03: Three-Agent Intelligence & Workflow Pipeline */}
        <ThreeAgentsSection />

        {/* Section 04: Explainable Alert Experience & Human-in-the-Loop Governance */}
        <AlertExperienceSection />

        {/* Section 05: ICU Case Replay Simulation Preview */}
        <SimulationPreviewSection
          onOpenFlightDeck={handleLaunchFlightDeck}
        />

        {/* Section 06: Closing Statement with Kinetic Inline CTA */}
        <ClosingSection
          onOpenFlightDeck={handleLaunchFlightDeck}
        />
      </main>

      {/* Footer */}
      <Footer
        onOpenFlightDeck={handleLaunchFlightDeck}
      />

      {/* Optional Clinical Flight Deck Modal */}
      <FlightDeckModal
        isOpen={flightDeckOpen}
        onClose={() => setFlightDeckOpen(false)}
        onLaunchDashboard={() => {
          setFlightDeckOpen(false);
          handleLaunchFlightDeck();
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
