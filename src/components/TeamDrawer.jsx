import React from 'react';
import { X, FileText, User, Building, MapPin, Hash, CheckCircle2 } from 'lucide-react';

export default function TeamDrawer({ team, onClose, onGenerateCertificate }) {
  if (!team) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-header-left">
            <span className={`status-badge-lg ${team.status.toLowerCase().replace(/\s+/g, '-')}`}>
              {team.status}
            </span>
            <h2 className="drawer-team-title">{team.team_name}</h2>
            <p className="drawer-sub-id">ID: {team.temp_team_id} • Rank #{team.rank}</p>
          </div>
          <button className="btn-close-icon" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="drawer-content-scroll">
          {/* Rubric Score Breakdown Card */}
          <div className="drawer-panel-card score-panel">
            <div className="score-summary-row">
              <div>
                <span className="score-val-hero">{team.total_score_50.toFixed(1)}</span>
                <span className="score-max-sub">/ 50.0</span>
              </div>
              <div className="score-pct-pill">
                {team.score_percentage.toFixed(1)}% Aggregate
              </div>
            </div>

            <div className="rubric-bars-stack">
              <div className="rubric-row">
                <div className="rubric-row-label">
                  <span>Problem Understanding</span>
                  <strong>{team.c1_understanding_10} / 10</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(team.c1_understanding_10 / 10) * 100}%` }}></div>
                </div>
              </div>

              <div className="rubric-row">
                <div className="rubric-row-label">
                  <span>Innovation &amp; Novelty</span>
                  <strong>{team.c2_innovation_10} / 10</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(team.c2_innovation_10 / 10) * 100}%` }}></div>
                </div>
              </div>

              <div className="rubric-row">
                <div className="rubric-row-label">
                  <span>Technical Feasibility &amp; Architecture</span>
                  <strong>{team.c3_tech_feasibility_15} / 15</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(team.c3_tech_feasibility_15 / 15) * 100}%` }}></div>
                </div>
              </div>

              <div className="rubric-row">
                <div className="rubric-row-label">
                  <span>Scalability &amp; Social Impact</span>
                  <strong>{team.c4_scalability_10} / 10</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(team.c4_scalability_10 / 10) * 100}%` }}></div>
                </div>
              </div>

              <div className="rubric-row">
                <div className="rubric-row-label">
                  <span>SIH Deck &amp; Presentation</span>
                  <strong>{team.c5_presentation_5} / 5</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(team.c5_presentation_5 / 5) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Problem Statement Card */}
          <div className="drawer-panel-card">
            <h4 className="card-section-title">Problem Statement Assignment</h4>
            <div className="ps-id-chips-row">
              <span className="ps-code-pill">{team.ps_id}</span>
              <span className={`cat-pill ${team.ps_category.toLowerCase()}`}>{team.ps_category}</span>
              <span className="domain-pill">{team.domain}</span>
            </div>
            <p className="ps-title-full">{team.ps_title}</p>
            <p className="ps-ministry-text">Ministry / Department: {team.organization}</p>
          </div>

          {/* Team Leadership Card */}
          <div className="drawer-panel-card">
            <h4 className="card-section-title">Candidate Registration</h4>
            <div className="meta-two-col-grid">
              <div className="meta-item-box">
                <User size={14} className="meta-item-icon" />
                <div>
                  <div className="meta-item-lbl">Team Leader</div>
                  <div className="meta-item-val">{team.leader_name}</div>
                </div>
              </div>

              <div className="meta-item-box">
                <Hash size={14} className="meta-item-icon" />
                <div>
                  <div className="meta-item-lbl">Register Number</div>
                  <div className="meta-item-val">{team.reg_no}</div>
                </div>
              </div>

              <div className="meta-item-box">
                <Building size={14} className="meta-item-icon" />
                <div>
                  <div className="meta-item-lbl">School / Department</div>
                  <div className="meta-item-val">{team.school}</div>
                </div>
              </div>

              <div className="meta-item-box">
                <MapPin size={14} className="meta-item-icon" />
                <div>
                  <div className="meta-item-lbl">Evaluation Panel Venue</div>
                  <div className="meta-item-val">{team.venue}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Jury Evaluation Remarks */}
          <div className="drawer-panel-card">
            <h4 className="card-section-title">Official Jury Remarks</h4>
            <p className="jury-feedback-body">"{team.reasons}"</p>
          </div>
        </div>

        <div className="drawer-footer-actions">
          <button className="btn-generate-cert-wide" onClick={() => onGenerateCertificate(team)}>
            <FileText size={15} />
            <span>Generate Section 65B Digital Certificate</span>
          </button>
        </div>
      </div>
    </div>
  );
}
