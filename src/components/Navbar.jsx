import React, { useState } from 'react';
import { CheckCircle2, UserCheck, LayoutDashboard, Lock, Unlock, Clock, DoorOpen, Award } from 'lucide-react';

export default function Navbar({ 
  registeredCount, 
  totalFinalizedCount = 110, 
  onSecretAdminTrigger, 
  onOpenAdminGateway,
  isAdminLoggedIn, 
  onOpenLandingView,
  onOpenCandidateDesk, 
  onOpenInOutPortal,
  onOpenEvaluationQueue,
  onOpenCertificateStudio,
  onOpenTop100,
  currentView,
  isPortalClosed,
  onOpenTimerModal
}) {
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [arenaClickCount, setArenaClickCount] = useState(0);

  // Secret triple-click on banner logo to trigger admin
  const handleLogoClick = () => {
    setAdminClickCount(prev => {
      const next = prev + 1;
      if (next >= 3) {
        if (onOpenAdminGateway) onOpenAdminGateway();
        else onSecretAdminTrigger();
        return 0;
      }
      return next;
    });
  };

  // Secret 4-click on Rathinam logo for hidden SIH Arena access
  const handleRathinamLogoClick = () => {
    setArenaClickCount(prev => {
      const next = prev + 1;
      if (next >= 4) {
        if (onOpenAdminGateway) onOpenAdminGateway();
        else onSecretAdminTrigger();
        return 0;
      }
      return next;
    });
  };

  return (
    <header className="site-header">
      {/* Top Institutional & Hackathon Dual Banners (100% Centered) */}
      <div className="header-logos-bar">
        <div className="logos-container">
          <div className="logos-brand-combo">
            <div 
              className="logo-item moe-sih-banner" 
              onClick={handleLogoClick}
              style={{ cursor: 'pointer' }}
              title="Smart India Hackathon 2026 (Ctrl+Shift+A or Triple-click for Admin Access)"
            >
              <img 
                src="/logos/sih_moe_aicte_logo.png" 
                alt="Ministry of Education, AICTE, MoE Innovation Cell, Smart India Hackathon 2026" 
                className="banner-img moe-img"
              />
            </div>

            <div className="logo-divider-line"></div>

            <div 
              className="logo-item rathinam-banner"
              onClick={handleRathinamLogoClick}
              style={{ cursor: 'pointer' }}
              title="Rathinam Global University"
            >
              <img 
                src="/logos/rathinam_rgu_logo.png" 
                alt="Rathinam Global University - NAAC A++ Grade, 1st in Tamil Nadu" 
                className="banner-img rgu-img"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
