import React from 'react';
import { 
  Lock, Unlock, ShieldCheck, Award, FileText, CheckCircle2, 
  UserCheck, AlertCircle, ArrowRight, Clock, Sparkles 
} from 'lucide-react';

export default function PortalClosedView({ 
  onSecretAdminTrigger, 
  registeredCount, 
  totalFinalizedCount = 110,
  onViewShortlist,
  isAdminLoggedIn = false,
  onOpenTimerModal,
  onGoToAdmin
}) {
  return (
    <div className="portal-closed-viewport">
      <div className="portal-closed-card">
        {/* Top Institutional Lock Badge */}
        <div className="closed-lock-icon-wrapper">
          <Lock size={36} className="text-rose" />
        </div>

        <div className="closed-status-pill">
          <span className="closed-dot"></span>
          <span>SUBMISSION WINDOW CONCLUDED</span>
        </div>

        <h1 className="closed-main-title">
          Portal Registration Closed
        </h1>

        <p className="closed-sub-headline">
          The candidate registration portal is currently <strong>Locked by Authority</strong>.
        </p>

        <div className="closed-explanation-box">
          <p>
            All 6-member finalist rosters, mentor nominations, and project proposals have been locked and submitted to the <strong>Institutional SIH 2026 Evaluation Committee</strong> for central validation and national submission.
          </p>
        </div>

        {/* Live Final Metrics */}
        <div className="closed-metrics-grid">
          <div className="closed-metric-item">
            <div className="metric-icon-mini text-emerald">
              <CheckCircle2 size={20} />
            </div>
            <div className="metric-text-group">
              <span className="metric-val">{registeredCount} / {totalFinalizedCount}</span>
              <span className="metric-sub">Teams Registered</span>
            </div>
          </div>

          <div className="closed-metric-item">
            <div className="metric-icon-mini text-indigo">
              <ShieldCheck size={20} />
            </div>
            <div className="metric-text-group">
              <span className="metric-val">80 PS</span>
              <span className="metric-sub">Unique PS Finalized</span>
            </div>
          </div>

          <div className="closed-metric-item">
            <div className="metric-icon-mini text-amber">
              <Award size={20} />
            </div>
            <div className="metric-text-group">
              <span className="metric-val">100%</span>
              <span className="metric-sub">Roster Verification</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="closed-actions-row">
          {onViewShortlist && (
            <button className="btn-closed-view-roster" onClick={onViewShortlist}>
              <span>View Finalized Shortlist (Read-Only)</span>
              <ArrowRight size={15} />
            </button>
          )}

          {isAdminLoggedIn ? (
            <div className="admin-reopen-btn-group">
              <button className="btn-closed-reopen-portal" onClick={onOpenTimerModal}>
                <Unlock size={15} className="text-emerald" />
                <span>Reopen Portal &amp; Set Time Limit</span>
              </button>
              {onGoToAdmin && (
                <button className="btn-closed-admin-access" onClick={onGoToAdmin}>
                  <ShieldCheck size={14} />
                  <span>Admin Desk</span>
                </button>
              )}
            </div>
          ) : (
            <button className="btn-closed-admin-access" onClick={onSecretAdminTrigger}>
              <Lock size={14} />
              <span>Institutional Admin Access</span>
            </button>
          )}
        </div>

        <div className="closed-authority-footer">
          <span>Smart India Hackathon 2026 • Campus Evaluation Authority • Rathinam Global University</span>
        </div>
      </div>
    </div>
  );
}
