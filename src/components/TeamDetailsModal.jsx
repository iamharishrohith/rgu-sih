import React from 'react';
import { X, ShieldCheck, User, Mail, Phone, Building, Hash, Award, Users } from 'lucide-react';

export default function TeamDetailsModal({ team, onClose, onEditForm }) {
  if (!team || !team.registrationData) return null;
  const reg = team.registrationData;
  const members = reg.members || [];

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="modal-dialog-box details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top-bar">
          <div className="modal-title-left">
            <div className="modal-icon-badge">
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="modal-title-text">
                Team Verified Roster: {reg.team_name || team.team_name}
              </span>
              <div className="modal-title-sub">
                Temp ID: {team.temp_team_id} • PS: {reg.sih_ps_id || reg.ps_id || team.ps_id} • Status: {reg.status || team.status}
              </div>
            </div>
          </div>
          <button className="btn-close-icon" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="reg-modal-body">
          {/* PS Information */}
          <div className="detail-section">
            <h4 className="detail-heading">Problem Statement</h4>
            <div className="ps-detail-card">
              <span className="ps-id-pill">{reg.sih_ps_id || reg.ps_id || team.ps_id}</span>
              <p className="ps-title-full">{reg.ps_title || 'National Problem Statement'}</p>
            </div>
          </div>

          {/* Team Leader */}
          <div className="detail-section">
            <h4 className="detail-heading">Team Leader (Member 1)</h4>
            <div className="member-detail-grid">
              <div className="m-detail-cell">
                <span className="m-label">Full Name:</span>
                <strong>{reg.leader_name}</strong>
              </div>
              <div className="m-detail-cell">
                <span className="m-label">Register Number:</span>
                <strong>{reg.leader_reg_no}</strong>
              </div>
              <div className="m-detail-cell">
                <span className="m-label">Personal Email:</span>
                <span>{reg.leader_personal_email}</span>
              </div>
              <div className="m-detail-cell">
                <span className="m-label">College Email:</span>
                <span>{reg.leader_college_email}</span>
              </div>
              <div className="m-detail-cell">
                <span className="m-label">Phone Calling:</span>
                <strong>{reg.leader_phone}</strong>
              </div>
              <div className="m-detail-cell">
                <span className="m-label">WhatsApp:</span>
                <strong>{reg.leader_whatsapp}</strong>
              </div>
              <div className="m-detail-cell">
                <span className="m-label">Year / Dept:</span>
                <span>{reg.leader_year} - {reg.leader_dept}</span>
              </div>
              <div className="m-detail-cell">
                <span className="m-label">School:</span>
                <span>{reg.leader_school}</span>
              </div>
            </div>
          </div>

          {/* 5 Members */}
          <div className="detail-section">
            <h4 className="detail-heading">Team Members (Members 2 to 6)</h4>
            <div className="members-roster-list">
              {members.map((m, idx) => (
                <div key={idx} className="member-row-card">
                  <div className="m-num-tag">Member #{idx + 2}</div>
                  <div className="m-info-cols">
                    <div className="m-col-main">
                      <strong>{m.name || 'Member Name'}</strong>
                      <span className="m-reg">({m.reg_no || 'Reg No'})</span>
                    </div>
                    <div className="m-col-sub">
                      <span>{m.dept || 'Department'} • {m.year || '3rd Year'}</span>
                      <span>Personal: {m.personal_email || '—'} | College: {m.college_email || '—'}</span>
                      <span>Phone: {m.phone || '—'} | WA: {m.whatsapp || '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mentor */}
          <div className="detail-section">
            <h4 className="detail-heading">Faculty Mentor / Guide</h4>
            <div className="mentor-detail-card">
              <div className="m-detail-cell">
                <span className="m-label">Mentor Name:</span>
                <strong>{reg.mentor_name || 'Designated Faculty'}</strong>
              </div>
              <div className="m-detail-cell">
                <span className="m-label">Designation:</span>
                <span>{reg.mentor_designation}</span>
              </div>
              <div className="m-detail-cell">
                <span className="m-label">Email:</span>
                <span>{reg.mentor_email || '—'}</span>
              </div>
              <div className="m-detail-cell">
                <span className="m-label">Phone:</span>
                <span>{reg.mentor_phone || '—'}</span>
              </div>
            </div>
          </div>

          <div className="detail-modal-footer">
            <button className="btn-primary-action" onClick={onClose}>
              Close Roster
            </button>
            {onEditForm && (
              <button 
                type="button"
                className="btn-edit-submission-outline" 
                onClick={() => {
                  if (onEditForm) onEditForm(team);
                }}
              >
                <span>Edit 6-Member Form</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
