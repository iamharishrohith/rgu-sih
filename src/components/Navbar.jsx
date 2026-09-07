import React, { useState } from 'react';
import { CheckCircle2, UserCheck, LayoutDashboard } from 'lucide-react';

export default function Navbar({ 
  registeredCount, 
  totalFinalizedCount = 113, 
  onSecretAdminTrigger, 
  isAdminLoggedIn, 
  onOpenLandingView,
  onOpenCandidateDesk, 
  currentView 
}) {
  const [clickCount, setClickCount] = useState(0);

  // Secret triple-click on banner logo to trigger admin
  const handleLogoClick = () => {
    setClickCount(prev => {
      const next = prev + 1;
      if (next >= 3) {
        onSecretAdminTrigger();
        return 0;
      }
      return next;
    });
    if (onOpenLandingView) onOpenLandingView();
  };

  return (
    <header className="site-header">
      {/* Top Institutional & Hackathon Dual Banners */}
      <div className="header-logos-bar">
        <div className="logos-container">
          <div 
            className="logo-item moe-sih-banner" 
            onClick={handleLogoClick}
            style={{ cursor: 'pointer' }}
            title="Smart India Hackathon 2026 (Triple-click for Admin Access)"
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
            onClick={onOpenLandingView}
            style={{ cursor: 'pointer' }}
            title="Rathinam Global University"
          >
            <img 
              src="/logos/rathinam_rgu_logo.png" 
              alt="Rathinam Global University - NAAC A++ Grade, 1st in Tamil Nadu" 
              className="banner-img rgu-img"
            />
          </div>

          {/* Admin Navigation Button appears ONLY when already authenticated */}
          {isAdminLoggedIn && (
            <div className="header-actions-group" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="meta-stats-pill">
                <CheckCircle2 size={15} className="text-emerald" />
                <span><strong>{registeredCount}</strong> / {totalFinalizedCount} Forms Submitted</span>
              </div>

              {currentView === 'admin' ? (
                <button className="btn-nav-view active" onClick={onOpenCandidateDesk}>
                  <UserCheck size={16} />
                  <span>Exit Admin</span>
                </button>
              ) : (
                <button className="btn-nav-admin active-admin" onClick={onSecretAdminTrigger}>
                  <LayoutDashboard size={16} />
                  <span>Admin Desk</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
