import React from 'react';
import { 
  X, DoorOpen, LayoutDashboard, ShieldAlert, Clock, UserCheck, 
  Award, Database, Lock, Unlock, ExternalLink, LogOut, CheckCircle2,
  Sparkles, ArrowRight, Sun, QrCode
} from 'lucide-react';

export default function AdminGatewayModal({
  isOpen,
  onClose,
  onSelectView,
  onOpenTimer,
  onAdminLogout,
  currentView,
  isPortalClosed,
  totalTeamsCount = 110,
  submittedCount = 0
}) {
  if (!isOpen) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="modal-dialog-box admin-gateway-modal" onClick={e => e.stopPropagation()}>
        {/* Top Header */}
        <div className="modal-top-bar">
          <div className="modal-title-left">
            <div className="modal-icon-badge gateway-badge">
              <ShieldAlert size={18} className="text-emerald" />
            </div>
            <div>
              <span className="modal-title-text">SIH 2026 • Master Admin Gateway</span>
              <span className="modal-subtitle-text">Authorized Security Access &amp; Workplace Launcher</span>
            </div>
          </div>
          <button className="btn-close-icon" onClick={onClose} aria-label="Close Gateway">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="gateway-modal-body">
          <div className="gateway-intro-banner">
            <div className="gateway-intro-left">
              <span className="auth-verified-tag">
                <CheckCircle2 size={13} />
                <span>Administrator Authenticated</span>
              </span>
              <h3>Select Workplace or Control Module</h3>
              <p>Choose an administrative desk or operational workplace below to proceed.</p>
            </div>
            <div className="gateway-meta-pill">
              <span><strong>{submittedCount}</strong> Forms Received / {totalTeamsCount} Teams</span>
            </div>
          </div>

          {/* 4 Launch Cards Grid */}
          <div className="gateway-cards-grid">
            
            {/* CARD 1: SIH ARENA WORKPLACE */}
            <div 
              className={`gateway-card arena-card ${currentView === 'inout_portal' ? 'active-gateway-card' : ''}`}
              onClick={() => {
                onSelectView('inout_portal');
                onClose();
              }}
            >
              <div className="card-top-icon-row">
                <div className="gateway-card-icon arena-icon-bg">
                  <DoorOpen size={22} />
                </div>
                <span className="gateway-status-pill pill-emerald">
                  <span className="pulsing-dot green"></span>
                  <span>3-Stack Live Board</span>
                </span>
              </div>
              <h4>SIH Arena In-Out Movement &amp; Attendance</h4>
              <p>Total Teams (Not Active), Arena In, and Arena Out 3-Stack Board with Login/Logout and Gate Passes.</p>
              <div className="card-bottom-action">
                <span>Launch Arena Workplace</span>
                <ArrowRight size={15} />
              </div>
            </div>

            {/* CARD 2: CANDIDATE SELECTION REGISTRY */}
            <div 
              className={`gateway-card candidate-card ${currentView === 'candidate_desk' ? 'active-gateway-card' : ''}`}
              onClick={() => {
                onSelectView('candidate_desk');
                onClose();
              }}
            >
              <div className="card-top-icon-row">
                <div className="gateway-card-icon candidate-icon-bg">
                  <UserCheck size={22} />
                </div>
                <span className="gateway-status-pill pill-blue">
                  <span>110 Finalized Teams</span>
                </span>
              </div>
              <h4>Selection Roster &amp; Candidate Registry</h4>
              <p>Shortlist, Bench, and Waitlist tier rosters, search filters, and verification details.</p>
              <div className="card-bottom-action">
                <span>Open Candidate Desk</span>
                <ArrowRight size={15} />
              </div>
            </div>

            {/* CARD 3: MASTER ADMIN CONSOLE */}
            <div 
              className={`gateway-card admin-card ${currentView === 'admin' ? 'active-gateway-card' : ''}`}
              onClick={() => {
                onSelectView('admin');
                onClose();
              }}
            >
              <div className="card-top-icon-row">
                <div className="gateway-card-icon admin-icon-bg">
                  <LayoutDashboard size={22} />
                </div>
                <span className="gateway-status-pill pill-indigo">
                  <span>Section 65B Audit</span>
                </span>
              </div>
              <h4>Master Admin &amp; Database Console</h4>
              <p>Custom team CRUD, live database synchronization, Section 65B audit trails, and CSV exports.</p>
              <div className="card-bottom-action">
                <span>Open Master Console</span>
                <ArrowRight size={15} />
              </div>
            </div>

            {/* CARD 4: REGISTRATION WINDOW TIMER */}
            <div 
              className="gateway-card timer-card"
              onClick={() => {
                onClose();
                onOpenTimer();
              }}
            >
              <div className="card-top-icon-row">
                <div className="gateway-card-icon timer-icon-bg">
                  <Clock size={22} />
                </div>
                <span className={`gateway-status-pill ${isPortalClosed ? 'pill-rose' : 'pill-emerald'}`}>
                  {isPortalClosed ? <Lock size={11} /> : <Unlock size={11} />}
                  <span>{isPortalClosed ? 'Window Locked' : 'Window Open'}</span>
                </span>
              </div>
              <h4>Registration Window &amp; Auto-Lock Timer</h4>
              <p>Configure scheduled dynamic countdown timers, window presets, or manually lock the portal.</p>
              <div className="card-bottom-action">
                <span>Configure Timer</span>
                <ArrowRight size={15} />
              </div>
            </div>

          </div>

          {/* Bottom Actions Row */}
          <div className="gateway-bottom-actions">
            <button 
              className="btn-gateway-secondary"
              onClick={() => {
                onSelectView('landing');
                onClose();
              }}
            >
              <Sparkles size={15} />
              <span>View Public Selection Showcase</span>
            </button>

            <button 
              className="btn-gateway-logout"
              onClick={() => {
                onClose();
                onAdminLogout();
              }}
            >
              <LogOut size={15} />
              <span>Log Out Admin Session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
