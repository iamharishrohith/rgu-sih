import React, { useState, useEffect } from 'react';
import { X, Save, ShieldCheck, Users, Award, BookOpen, AlertCircle, Sparkles, Hash, Building, MapPin, Phone } from 'lucide-react';
import { sanitizeInputText } from '../crypto_security';

export default function TeamEditorModal({ isOpen, onClose, onSave, teamToEdit, nextSuggestedRank, nextSuggestedId }) {
  if (!isOpen) return null;

  const isEditMode = !!teamToEdit;

  const [formData, setFormData] = useState({
    temp_team_id: '',
    team_name: '',
    leader_name: '',
    reg_no: '',
    school: 'School of Quantum Science, Computing & AI',
    venue: 'Tower C312',
    mobile: '',
    ps_id: 'SIH26209',
    ps_title: 'Student Innovation',
    ps_category: 'Software',
    domain: 'Smart Education, EdTech & Skill Development',
    organization: 'AICTE',
    status: 'Shortlist',
    rank: 1,
    c1_understanding_10: 9.0,
    c2_innovation_10: 9.0,
    c3_tech_feasibility_15: 13.0,
    c4_scalability_10: 9.0,
    c5_presentation_5: 4.0,
    reasons: '',
    selection_reason: 'Top Ranked Team for Problem Statement'
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (teamToEdit) {
      setFormData({
        temp_team_id: teamToEdit.temp_team_id || '',
        team_name: teamToEdit.team_name || '',
        leader_name: teamToEdit.leader_name || '',
        reg_no: teamToEdit.reg_no || '',
        school: teamToEdit.school || 'School of Quantum Science, Computing & AI',
        venue: teamToEdit.venue || 'Tower C312',
        mobile: teamToEdit.mobile || teamToEdit.effectivePhone || '',
        ps_id: teamToEdit.ps_id || 'SIH26209',
        ps_title: teamToEdit.ps_title || '',
        ps_category: teamToEdit.ps_category || 'Software',
        domain: teamToEdit.domain || 'Smart Education, EdTech & Skill Development',
        organization: teamToEdit.organization || 'AICTE',
        status: teamToEdit.status || 'Shortlist',
        rank: teamToEdit.rank || nextSuggestedRank || 1,
        c1_understanding_10: teamToEdit.c1_understanding_10 ?? 9.0,
        c2_innovation_10: teamToEdit.c2_innovation_10 ?? 9.0,
        c3_tech_feasibility_15: teamToEdit.c3_tech_feasibility_15 ?? 13.0,
        c4_scalability_10: teamToEdit.c4_scalability_10 ?? 9.0,
        c5_presentation_5: teamToEdit.c5_presentation_5 ?? 4.0,
        reasons: teamToEdit.reasons || '',
        selection_reason: teamToEdit.selection_reason || 'Verified Finalist Evaluation'
      });
    } else {
      setFormData({
        temp_team_id: nextSuggestedId || `SIH26-TM-${String(Math.floor(Math.random() * 800) + 200).padStart(3, '0')}`,
        team_name: '',
        leader_name: '',
        reg_no: '',
        school: 'School of Quantum Science, Computing & AI',
        venue: 'Tower C312',
        mobile: '',
        ps_id: 'SIH26209',
        ps_title: 'Student Innovation',
        ps_category: 'Software',
        domain: 'Smart Education, EdTech & Skill Development',
        organization: 'AICTE',
        status: 'Shortlist',
        rank: nextSuggestedRank || 1,
        c1_understanding_10: 9.0,
        c2_innovation_10: 9.0,
        c3_tech_feasibility_15: 13.0,
        c4_scalability_10: 9.0,
        c5_presentation_5: 4.0,
        reasons: 'High-quality technical proposal evaluated by jury.',
        selection_reason: 'Top Ranked Team for Problem Statement'
      });
    }
  }, [teamToEdit, nextSuggestedRank, nextSuggestedId]);

  // Compute total score dynamically
  const calculatedTotal = (
    Number(formData.c1_understanding_10 || 0) +
    Number(formData.c2_innovation_10 || 0) +
    Number(formData.c3_tech_feasibility_15 || 0) +
    Number(formData.c4_scalability_10 || 0) +
    Number(formData.c5_presentation_5 || 0)
  ).toFixed(1);

  const calculatedPercentage = ((Number(calculatedTotal) / 50) * 100).toFixed(1);

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.temp_team_id.trim()) {
      setErrorMsg('Temporary Team ID is required.');
      return;
    }
    if (!formData.team_name.trim()) {
      setErrorMsg('Team Name is required.');
      return;
    }
    if (!formData.leader_name.trim()) {
      setErrorMsg('Team Leader Name is required.');
      return;
    }
    if (!formData.reg_no.trim()) {
      setErrorMsg('University Register Number is required.');
      return;
    }

    setIsSaving(true);
    try {
      const sanitizedRecord = {
        temp_team_id: sanitizeInputText(formData.temp_team_id).toUpperCase(),
        team_name: sanitizeInputText(formData.team_name),
        leader_name: sanitizeInputText(formData.leader_name),
        reg_no: sanitizeInputText(formData.reg_no).toUpperCase(),
        school: sanitizeInputText(formData.school),
        venue: sanitizeInputText(formData.venue),
        mobile: sanitizeInputText(formData.mobile),
        ps_id: sanitizeInputText(formData.ps_id).toUpperCase(),
        ps_title: sanitizeInputText(formData.ps_title),
        ps_category: formData.ps_category,
        domain: sanitizeInputText(formData.domain),
        organization: sanitizeInputText(formData.organization),
        status: formData.status,
        rank: parseInt(formData.rank, 10) || 1,
        c1_understanding_10: parseFloat(formData.c1_understanding_10) || 0,
        c2_innovation_10: parseFloat(formData.c2_innovation_10) || 0,
        c3_tech_feasibility_15: parseFloat(formData.c3_tech_feasibility_15) || 0,
        c4_scalability_10: parseFloat(formData.c4_scalability_10) || 0,
        c5_presentation_5: parseFloat(formData.c5_presentation_5) || 0,
        total_score_50: parseFloat(calculatedTotal),
        score_percentage: parseFloat(calculatedPercentage),
        reasons: sanitizeInputText(formData.reasons),
        selection_reason: sanitizeInputText(formData.selection_reason)
      };

      await onSave(sanitizedRecord, isEditMode);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to save team record: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card team-editor-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge indigo">
              {isEditMode ? <Award size={20} /> : <Users size={20} />}
            </div>
            <div>
              <h2>{isEditMode ? 'Edit Team Details' : 'Create New Team'}</h2>
              <p className="modal-subtitle">
                {isEditMode ? `Updating ${formData.temp_team_id} • ${formData.team_name || 'Team'}` : 'Register a new finalized team to the evaluation registry'}
              </p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="team-editor-form">
          {errorMsg && (
            <div className="error-alert-banner">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Team & Status Identification */}
          <div className="form-section-card">
            <div className="section-title-row">
              <Hash size={16} className="text-indigo" />
              <span>Team &amp; Tier Classification</span>
            </div>
            
            <div className="form-grid-3">
              <div className="form-group">
                <label>Temporary Team ID *</label>
                <input 
                  type="text" 
                  value={formData.temp_team_id} 
                  onChange={(e) => handleChange('temp_team_id', e.target.value)}
                  placeholder="e.g. SIH26-TM-156"
                  disabled={isEditMode}
                  className="form-input font-mono"
                  required
                />
              </div>

              <div className="form-group">
                <label>Tier Status *</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="form-select font-bold"
                >
                  <option value="Shortlist">Shortlist (Primary 80 Finalists)</option>
                  <option value="Bench">Bench (Tier-1 Standby)</option>
                  <option value="Waitlist">Waitlist (Reserve Pool)</option>
                </select>
              </div>

              <div className="form-group">
                <label>National Rank *</label>
                <input 
                  type="number" 
                  min="1" 
                  max="500" 
                  value={formData.rank} 
                  onChange={(e) => handleChange('rank', e.target.value)}
                  className="form-input font-bold"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Official Team Name *</label>
              <input 
                type="text" 
                value={formData.team_name} 
                onChange={(e) => handleChange('team_name', e.target.value)}
                placeholder="e.g. Binary Brains / Team Enigma"
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Section 2: Leader & Academic Affiliation */}
          <div className="form-section-card">
            <div className="section-title-row">
              <Building size={16} className="text-emerald" />
              <span>Team Leader &amp; Academic Details</span>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Leader Full Name *</label>
                <input 
                  type="text" 
                  value={formData.leader_name} 
                  onChange={(e) => handleChange('leader_name', e.target.value)}
                  placeholder="e.g. Jessy M"
                  className="form-input font-bold"
                  required
                />
              </div>

              <div className="form-group">
                <label>Leader Register Number *</label>
                <input 
                  type="text" 
                  value={formData.reg_no} 
                  onChange={(e) => handleChange('reg_no', e.target.value)}
                  placeholder="e.g. RCAS2026BDC082"
                  className="form-input font-mono"
                  required
                />
              </div>
            </div>

            <div className="form-grid-3" style={{ marginTop: '12px' }}>
              <div className="form-group">
                <label>School / Department</label>
                <select 
                  value={formData.school} 
                  onChange={(e) => handleChange('school', e.target.value)}
                  className="form-select"
                >
                  <option value="School of Quantum Science, Computing & AI">School of Quantum Science, Computing &amp; AI</option>
                  <option value="School of Engineering & Technology">School of Engineering &amp; Technology</option>
                  <option value="School of Business & Commerce">School of Business &amp; Commerce</option>
                  <option value="School of Allied Health & Life Sciences">School of Allied Health &amp; Life Sciences</option>
                  <option value="School of Arts, Science & Humanities">School of Arts, Science &amp; Humanities</option>
                  <option value="Advanced Autonomous Intelligence Division">Advanced Autonomous Intelligence Division</option>
                </select>
              </div>

              <div className="form-group">
                <label>Evaluation Venue</label>
                <input 
                  type="text" 
                  value={formData.venue} 
                  onChange={(e) => handleChange('venue', e.target.value)}
                  placeholder="e.g. Tower C312"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Leader Mobile Contact</label>
                <input 
                  type="tel" 
                  value={formData.mobile} 
                  onChange={(e) => handleChange('mobile', e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="form-input font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Problem Statement Allocation */}
          <div className="form-section-card">
            <div className="section-title-row">
              <BookOpen size={16} className="text-amber" />
              <span>SIH Problem Statement Allocation</span>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label>Problem Statement ID *</label>
                <input 
                  type="text" 
                  value={formData.ps_id} 
                  onChange={(e) => handleChange('ps_id', e.target.value)}
                  placeholder="e.g. SIH26183"
                  className="form-input font-mono font-bold"
                  required
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select 
                  value={formData.ps_category} 
                  onChange={(e) => handleChange('ps_category', e.target.value)}
                  className="form-select"
                >
                  <option value="Software">Software</option>
                  <option value="Hardware">Hardware</option>
                </select>
              </div>

              <div className="form-group">
                <label>Organization / Ministry</label>
                <input 
                  type="text" 
                  value={formData.organization} 
                  onChange={(e) => handleChange('organization', e.target.value)}
                  placeholder="e.g. AICTE / Ministry of Home Affairs"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-grid-2" style={{ marginTop: '12px' }}>
              <div className="form-group">
                <label>Problem Statement Title</label>
                <input 
                  type="text" 
                  value={formData.ps_title} 
                  onChange={(e) => handleChange('ps_title', e.target.value)}
                  placeholder="Official problem statement title..."
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Domain</label>
                <input 
                  type="text" 
                  value={formData.domain} 
                  onChange={(e) => handleChange('domain', e.target.value)}
                  placeholder="e.g. Cybersecurity, LegalTech & Defence"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Jury Evaluation Scores */}
          <div className="form-section-card">
            <div className="section-title-row">
              <Sparkles size={16} className="text-purple" />
              <span>Jury Evaluation Rubric &amp; Live Score</span>
            </div>

            <div className="form-grid-5">
              <div className="form-group">
                <label>C1: Concept (10)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="10" 
                  value={formData.c1_understanding_10} 
                  onChange={(e) => handleChange('c1_understanding_10', e.target.value)}
                  className="form-input font-bold"
                />
              </div>

              <div className="form-group">
                <label>C2: Innovation (10)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="10" 
                  value={formData.c2_innovation_10} 
                  onChange={(e) => handleChange('c2_innovation_10', e.target.value)}
                  className="form-input font-bold"
                />
              </div>

              <div className="form-group">
                <label>C3: Tech (15)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="15" 
                  value={formData.c3_tech_feasibility_15} 
                  onChange={(e) => handleChange('c3_tech_feasibility_15', e.target.value)}
                  className="form-input font-bold"
                />
              </div>

              <div className="form-group">
                <label>C4: Scalability (10)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="10" 
                  value={formData.c4_scalability_10} 
                  onChange={(e) => handleChange('c4_scalability_10', e.target.value)}
                  className="form-input font-bold"
                />
              </div>

              <div className="form-group">
                <label>C5: Pitch (5)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="5" 
                  value={formData.c5_presentation_5} 
                  onChange={(e) => handleChange('c5_presentation_5', e.target.value)}
                  className="form-input font-bold"
                />
              </div>
            </div>

            {/* Score Summary Box */}
            <div className="score-summary-bar">
              <div className="score-metric">
                <span className="s-label">Total Score</span>
                <span className="s-val text-indigo font-bold">{calculatedTotal} / 50</span>
              </div>
              <div className="score-metric">
                <span className="s-label">Score Percentage</span>
                <span className="s-val text-emerald font-bold">{calculatedPercentage}%</span>
              </div>
              <div className="score-metric">
                <span className="s-label">Selection Guarantee</span>
                <span className="s-val text-slate font-semibold">Section 65B Verified</span>
              </div>
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-cancel-modal" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn-save-team-action" disabled={isSaving}>
              <Save size={16} />
              <span>{isSaving ? 'Saving Team...' : isEditMode ? 'Update Team Changes' : 'Create & Register Team'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
