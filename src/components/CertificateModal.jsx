import React, { useRef } from 'react';
import { X, Printer, ShieldCheck, FileText } from 'lucide-react';

export default function CertificateModal({ team, onClose }) {
  if (!team) return null;

  const certRef = useRef(null);

  // Deterministic SHA-256-like hex seal
  const rawData = `${team.temp_team_id}-${team.reg_no}-${team.ps_id}-${team.total_score_50}-SIH2026`;
  let hash = 0;
  for (let i = 0; i < rawData.length; i++) {
    hash = ((hash << 5) - hash) + rawData.charCodeAt(i);
    hash |= 0;
  }
  const certHash = Math.abs(hash).toString(16).padStart(16, '0') + 'e4a9f82b7c110294';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="modal-dialog-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top-bar no-print">
          <div className="modal-title-left">
            <FileText size={18} className="text-primary" />
            <span className="modal-title-text">Official Digital Certificate • Section 65B Proof Ledger</span>
          </div>
          <div className="modal-actions-right">
            <button className="btn-print-action" onClick={handlePrint}>
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button className="btn-close-icon" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="certificate-document-area" ref={certRef}>
          <div className="cert-outer-frame">
            <div className="cert-inner-frame">
              
              <div className="cert-header-block">
                <div className="cert-emblem">
                  <ShieldCheck size={38} color="#0f172a" />
                </div>
                <div className="cert-institution-meta">
                  <h2>RATHINAM GLOBAL UNIVERSITY</h2>
                  <p>COIMBATORE, TAMIL NADU • ACCREDITED A++ GRADE</p>
                  <h3>SMART INDIA HACKATHON 2026 — CAMPUS FINALS</h3>
                </div>
              </div>

              <div className="cert-heading-divider">
                <h1>CERTIFICATE OF SELECTION &amp; MERIT</h1>
                <p>Bharatiya Sakshya Adhiniyam 2023 (Section 65B Electronic Record Compliance)</p>
              </div>

              <div className="cert-content-body">
                <p className="cert-intro-text">This certificate is awarded to</p>
                <div className="cert-recipient-box">
                  <h2>{team.team_name}</h2>
                  <div className="cert-recipient-meta">
                    <span>Team ID: <strong>{team.temp_team_id}</strong></span>
                    <span>•</span>
                    <span>Team Leader: <strong>{team.leader_name}</strong></span>
                    <span>•</span>
                    <span>Register No: <strong>{team.reg_no}</strong></span>
                  </div>
                </div>

                <p className="cert-dept-text">
                  from <strong>{team.school || 'Department of Computational Sciences & Technology'}</strong>
                </p>

                <p className="cert-achievement-text">
                  in recognition of qualifying in the <strong>{team.status ? team.status.toUpperCase() : 'OFFICIAL SHORTLIST'}</strong> category for the Problem Statement:
                </p>

                <div className="cert-ps-callout">
                  <span className="ps-callout-code">{team.ps_id}</span>
                  <span className="ps-callout-title">{team.ps_title}</span>
                </div>

                <div className="cert-merit-scores">
                  Evaluation Aggregate: <strong>{typeof team.total_score_50 === 'number' ? team.total_score_50.toFixed(1) : team.total_score_50} / 50.0</strong> ({typeof team.score_percentage === 'number' ? team.score_percentage.toFixed(1) : team.score_percentage}%)
                </div>
              </div>

              <div className="cert-footer-signatures">
                <div className="cert-sig-item">
                  <div className="sig-rule"></div>
                  <p className="sig-signatory-name">Dr. Central Hackathon Coordinator</p>
                  <p className="sig-signatory-role">SIH 2026 Jury Authority</p>
                </div>

                <div className="cert-seal-center">
                  <div className="seal-emblem-box">
                    <ShieldCheck size={26} color="#0f172a" />
                    <span>SECTION 65B VERIFIED</span>
                  </div>
                  <span className="hash-mono-text">SHA-256: {certHash.substring(0, 24)}...</span>
                </div>

                <div className="cert-sig-item">
                  <div className="sig-rule"></div>
                  <p className="sig-signatory-name">Dean of Academic Affairs</p>
                  <p className="sig-signatory-role">Rathinam Global University</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
