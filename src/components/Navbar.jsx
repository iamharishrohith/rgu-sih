import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, UserCheck, LayoutDashboard, Sparkles, Table2, Home } from 'lucide-react';

export default function Navbar({ 
  registeredCount, 
  totalFinalizedCount = 110, 
  onSecretAdminTrigger, 
  isAdminLoggedIn, 
  onOpenLandingView,
  onOpenCandidateDesk, 
  currentView 
}) {
  const [clickCount, setClickCount] = useState(0);

  // Secret triple-click on brand icon to trigger admin
  const handleBrandIconClick = () => {
    setClickCount(prev => {
      const next = prev + 1;
      if (next >= 3) {
        onSecretAdminTrigger();
        return 0;
      }
      return next;
    });
  };

  return (
    <header className="site-header">
      {/* Top Institutional & Hackathon Dual Banners */}
      <div className="header-logos-bar">
        <div className="logos-container">
          <div className="logo-item moe-sih-banner">
            <img 
              src="/logos/sih_moe_aicte_logo.png" 
              alt="Ministry of Education, AICTE, MoE Innovation Cell, Smart India Hackathon 2026" 
              className="banner-img moe-img"
            />
          </div>
          <div className="logo-divider-line"></div>
          <div className="logo-item rathinam-banner">
            <img 
              src="/logos/rathinam_rgu_logo.png" 
              alt="Rathinam Global University - NAAC A++ Grade, 1st in Tamil Nadu" 
              className="banner-img rgu-img"
            />
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="header-inner">
        <div className="brand-group" onClick={onOpenLandingView} style={{ cursor: 'pointer' }}>
          <div 
            className="brand-badge-icon secret-admin-trigger" 
            onClick={(e) => {
              e.stopPropagation();
              handleBrandIconClick();
            }}
            title="Smart India Hackathon 2026"
          >
            <ShieldCheck size={24} />
          </div>
          <div className="brand-text-block">
            <div className="brand-main-heading">
              Smart India Hackathon 2026
              <span className="pill-campus-tag">National Finalist Registry</span>
            </div>
            <div className="brand-sub-heading">
              Rathinam Global University • Campus Evaluation Authority
            </div>
          </div>
        </div>

        {/* View Switchers & Status */}
        <div className="header-actions-group">
          {/* Landing vs Desk Switcher */}
          <div className="view-switch-pill-container">
            <button 
              className={`view-switch-btn ${currentView === 'landing' ? 'active' : ''}`}
              onClick={onOpenLandingView}
            >
              <Home size={14} />
              <span>Grand Announcement</span>
            </button>
            <button 
              className={`view-switch-btn ${currentView === 'candidate_desk' ? 'active' : ''}`}
              onClick={onOpenCandidateDesk}
            >
              <Table2 size={14} />
              <span>Candidate Desk</span>
            </button>
          </div>

          {/* Strict 110 Finalized Teams Counter */}
          <div className="meta-stats-pill">
            <CheckCircle2 size={15} className="text-emerald" />
            <span><strong>{registeredCount}</strong> / {totalFinalizedCount} Forms Submitted</span>
          </div>

          {/* Admin Navigation Button appears ONLY when already authenticated */}
          {isAdminLoggedIn && (
            currentView === 'admin' ? (
              <button className="btn-nav-view active" onClick={onOpenCandidateDesk}>
                <UserCheck size={16} />
                <span>Exit Admin</span>
              </button>
            ) : (
              <button className="btn-nav-admin active-admin" onClick={onSecretAdminTrigger}>
                <LayoutDashboard size={16} />
                <span>Admin Desk</span>
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
