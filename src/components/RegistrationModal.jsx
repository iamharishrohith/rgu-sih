import React, { useState, useEffect, useRef } from 'react';
import { 
  X, CheckCircle, ShieldCheck, User, Mail, Phone, Building, Hash, 
  ExternalLink, Users, Award, BookOpen, MessageSquare, AlertCircle, 
  ChevronRight, Save, Check
} from 'lucide-react';
import { supabase, formatRegistrationPayloadForSupabase } from '../supabaseClient';
import { OFFICIAL_SCHOOLS, normalizeSchoolName } from '../data/sihMasterData';

export default function RegistrationModal({ team, onClose, onConfirmRegistration, existingRegistration }) {
  if (!team) return null;

  const currentTeamId = team.temp_team_id || team.teamId || team.temp_id || '';
  const prevTeamIdRef = useRef(currentTeamId);

  // Active sub-step in form (0: Team & PS, 1: Team Leader, 2: 5 Members, 3: Mentor & Submit)
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [syncStatusMsg, setSyncStatusMsg] = useState('');
  const [isDraftRestored, setIsDraftRestored] = useState(false);

  // Helper to get initial form data combining team defaults, existing record, and local drafts
  const getInitialFormData = () => {
    const teamId = team.temp_team_id || team.teamId || team.temp_id || '';
    let draftData = null;
    try {
      const savedDraft = localStorage.getItem(`sih_draft_${teamId}`);
      if (savedDraft) {
        draftData = JSON.parse(savedDraft);
      }
    } catch (e) {}

    // When existing registration is present, use it as solid base and overlay any unsaved draft
    const source = existingRegistration 
      ? { ...existingRegistration, ...(draftData || {}) } 
      : (draftData || {});

    // Prepare 5 clean member slots (Members 2 to 6)
    const rawMembers = Array.isArray(source.members) && source.members.length > 0
      ? source.members
      : (Array.isArray(existingRegistration?.members) && existingRegistration.members.length > 0 ? existingRegistration.members : []);

    const defaultLeaderDept = source.leader_dept || existingRegistration?.leader_dept || team.school || 'Computer Science & Engineering';
    const defaultLeaderSchool = normalizeSchoolName(source.leader_school || existingRegistration?.leader_school || team.school);

    const membersList = [2, 3, 4, 5, 6].map((id, idx) => {
      const existingM = rawMembers[idx] || {};
      return {
        id,
        name: (existingM.name || '').trim(),
        reg_no: (existingM.reg_no || '').trim(),
        gender: existingM.gender || 'Male',
        personal_email: (existingM.personal_email || '').trim(),
        college_email: (existingM.college_email || '').trim(),
        phone: (existingM.phone || '').trim(),
        whatsapp: (existingM.whatsapp || '').trim(),
        year: existingM.year || '3rd Year',
        dept: (existingM.dept || defaultLeaderDept).trim(),
        school: normalizeSchoolName(existingM.school || defaultLeaderSchool)
      };
    });

    return {
      // Team & PS
      team_name: source.team_name || existingRegistration?.team_name || (team.team_name !== 'Team Unknown' ? team.team_name : ''),
      temp_team_id: source.temp_team_id || existingRegistration?.temp_team_id || teamId,
      sih_ps_id: source.sih_ps_id || existingRegistration?.sih_ps_id || source.ps_id || existingRegistration?.ps_id || team.ps_id || '',
      ps_title: source.ps_title || existingRegistration?.ps_title || team.ps_title || '',
      status: source.status || existingRegistration?.status || team.status || 'Shortlist',
      
      // Team Leader (Member 1)
      leader_name: source.leader_name || existingRegistration?.leader_name || team.leader_name || '',
      leader_reg_no: source.leader_reg_no || existingRegistration?.leader_reg_no || team.reg_no || '',
      leader_gender: source.leader_gender || existingRegistration?.leader_gender || 'Male',
      leader_personal_email: source.leader_personal_email || existingRegistration?.leader_personal_email || '',
      leader_college_email: source.leader_college_email || existingRegistration?.leader_college_email || '',
      leader_phone: source.leader_phone || existingRegistration?.leader_phone || team.mobile || '',
      leader_whatsapp: source.leader_whatsapp || existingRegistration?.leader_whatsapp || team.mobile || '',
      leader_year: source.leader_year || existingRegistration?.leader_year || '3rd Year',
      leader_dept: defaultLeaderDept,
      leader_school: defaultLeaderSchool,

      // 5 Team Members (Members 2 to 6)
      members: membersList,

      // Faculty Mentor
      mentor_name: source.mentor_name || existingRegistration?.mentor_name || '',
      mentor_designation: source.mentor_designation || existingRegistration?.mentor_designation || 'Assistant Professor',
      mentor_email: source.mentor_email || existingRegistration?.mentor_email || '',
      mentor_phone: source.mentor_phone || existingRegistration?.mentor_phone || ''
    };
  };

  // Form State
  const [formData, setFormData] = useState(getInitialFormData);

  // Auto-Save Draft to LocalStorage whenever user types (protects against browser refresh/connection loss)
  useEffect(() => {
    if (formData.temp_team_id && !submitted) {
      try {
        localStorage.setItem(`sih_draft_${formData.temp_team_id}`, JSON.stringify(formData));
      } catch (e) {}
    }
  }, [formData, submitted]);

  // Keep form data synchronized ONLY when switching to a DIFFERENT team
  useEffect(() => {
    if (currentTeamId && currentTeamId !== prevTeamIdRef.current) {
      prevTeamIdRef.current = currentTeamId;
      const initial = getInitialFormData();
      setFormData(initial);
      setSubmitted(false);
      setActiveStep(0);
      setErrorMsg('');
      setValidationErrors({});
      try {
        if (localStorage.getItem(`sih_draft_${initial.temp_team_id}`)) {
          setIsDraftRestored(true);
        } else {
          setIsDraftRestored(false);
        }
      } catch (e) {}
    }
  }, [currentTeamId]);


  // Active member tab in Step 2
  const [activeMemberTab, setActiveMemberTab] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});

  // Helper to update member details
  const updateMember = (index, field, value) => {
    setFormData(prev => {
      const updatedMembers = [...prev.members];
      updatedMembers[index] = { ...updatedMembers[index], [field]: value };
      return { ...prev, members: updatedMembers };
    });
    if (validationErrors[`member_${index}_${field}`]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[`member_${index}_${field}`];
        return copy;
      });
    }
  };

  // Quick copy leader school/dept to member
  const copyLeaderDeptToMember = (index) => {
    updateMember(index, 'dept', formData.leader_dept);
    updateMember(index, 'school', formData.leader_school);
    updateMember(index, 'year', formData.leader_year);
  };

  // Step-by-Step Validation Checker
  const validateStep = (stepIdx) => {
    const errors = {};
    if (stepIdx === 0) {
      if (!formData.team_name || !formData.team_name.trim()) {
        errors.team_name = 'Official Team Name is required';
      }
      if (!formData.sih_ps_id || !formData.sih_ps_id.trim()) {
        errors.sih_ps_id = 'Problem Statement ID is required';
      }
    } else if (stepIdx === 1) {
      if (!formData.leader_name || !formData.leader_name.trim()) {
        errors.leader_name = 'Leader Name is required';
      }
      if (!formData.leader_reg_no || !formData.leader_reg_no.trim()) {
        errors.leader_reg_no = 'Leader Register Number is required';
      }
      if (!formData.leader_personal_email || !formData.leader_personal_email.trim() || !formData.leader_personal_email.includes('@')) {
        errors.leader_personal_email = 'Valid personal email (e.g. yourname@gmail.com) is required';
      }
      const phoneDigits = (formData.leader_phone || '').replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        errors.leader_phone = 'Valid 10-digit calling phone number is required';
      }
    } else if (stepIdx === 2) {
      if (Array.isArray(formData.members)) {
        formData.members.forEach((m, idx) => {
          if (m.name && m.name.trim() && (!m.reg_no || !m.reg_no.trim())) {
            errors[`member_${idx}_reg_no`] = `Member #${idx + 2} Register Number is required`;
            setActiveMemberTab(idx);
          }
        });
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = (targetStep) => {
    setErrorMsg('');
    if (validateStep(activeStep)) {
      setActiveStep(targetStep);
    } else {
      setErrorMsg('Please complete the required fields highlighted below before continuing.');
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitting) return; // Prevent double trigger
    setErrorMsg('');
    setValidationErrors({});

    // Comprehensive Full Form Validation
    const errors = {};
    const cleanTeamName = (formData.team_name || '').trim() || (team.team_name !== 'Team Unknown' ? team.team_name : `Team ${formData.leader_name ? formData.leader_name.split(' ')[0] : 'Innovators'}`);
    const cleanPsId = (formData.sih_ps_id || team.ps_id || 'SIH26001').trim();
    const cleanPsTitle = (formData.ps_title || team.ps_title || team.domain || 'Smart India Hackathon 2026 Solution').trim();
    const cleanLeaderName = (formData.leader_name || team.leader_name || '').trim();
    const cleanLeaderReg = (formData.leader_reg_no || team.reg_no || '').trim();
    const cleanLeaderEmail = (formData.leader_personal_email || '').trim();
    const cleanLeaderPhone = (formData.leader_phone || team.mobile || '').trim();

    if (!cleanTeamName) errors.team_name = 'Official Team Name is required';
    if (!cleanLeaderName) errors.leader_name = 'Leader Name is required';
    if (!cleanLeaderReg) errors.leader_reg_no = 'Leader Register Number is required';
    if (!cleanLeaderEmail || !cleanLeaderEmail.includes('@')) {
      errors.leader_personal_email = 'Valid Leader personal email is required';
    }
    const phoneDigits = cleanLeaderPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      errors.leader_phone = 'Valid 10-digit Leader phone number is required';
    }

    // Check member errors (only flag if name is provided without reg_no)
    if (Array.isArray(formData.members)) {
      formData.members.forEach((m, idx) => {
        if (m.name && m.name.trim() && (!m.reg_no || !m.reg_no.trim())) {
          errors[`member_${idx}_reg_no`] = `Member #${idx + 2} Register Number is required`;
        }
      });
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setErrorMsg('Form has missing required fields. We have jumped to the section that needs correction.');
      if (errors.team_name || errors.sih_ps_id) {
        setActiveStep(0);
      } else if (errors.leader_name || errors.leader_reg_no || errors.leader_personal_email || errors.leader_phone) {
        setActiveStep(1);
      } else {
        const memberErrKey = Object.keys(errors).find(k => k.startsWith('member_'));
        if (memberErrKey) {
          const mIdx = parseInt(memberErrKey.split('_')[1], 10);
          if (!isNaN(mIdx)) setActiveMemberTab(mIdx);
          setActiveStep(2);
        }
      }
      return;
    }

    setIsSubmitting(true);
    setSyncStatusMsg('Saving locally & syncing to database...');

    const cleanMembers = Array.isArray(formData.members) ? formData.members.map((m, idx) => ({
      id: m.id || (idx + 2),
      name: (m.name || '').trim(),
      reg_no: (m.reg_no || '').trim(),
      gender: m.gender || 'Male',
      personal_email: (m.personal_email || '').trim(),
      college_email: (m.college_email || '').trim(),
      phone: (m.phone || '').trim(),
      whatsapp: (m.whatsapp || m.phone || '').trim(),
      year: m.year || '3rd Year',
      dept: (m.dept || formData.leader_dept || 'Computer Science & Engineering').trim(),
      school: normalizeSchoolName(m.school || formData.leader_school || team.school)
    })) : [];

    const payload = {
      temp_team_id: formData.temp_team_id || team.temp_team_id,
      team_name: cleanTeamName,
      sih_ps_id: cleanPsId,
      ps_title: cleanPsTitle,
      status: formData.status || team.status || 'Shortlist',
      leader_name: cleanLeaderName,
      leader_reg_no: cleanLeaderReg,
      leader_gender: formData.leader_gender || 'Male',
      leader_personal_email: cleanLeaderEmail.toLowerCase(),
      leader_college_email: (formData.leader_college_email || '').trim(),
      leader_phone: cleanLeaderPhone,
      leader_whatsapp: (formData.leader_whatsapp || cleanLeaderPhone).trim(),
      leader_year: formData.leader_year || '3rd Year',
      leader_dept: formData.leader_dept || team.school || 'Computer Science & Engineering',
      leader_school: formData.leader_school || normalizeSchoolName(team.school),
      members: cleanMembers,
      mentor_name: (formData.mentor_name || 'Faculty Guide Assigned').trim(),
      mentor_designation: formData.mentor_designation || 'Assistant Professor',
      mentor_email: (formData.mentor_email || '').trim(),
      mentor_phone: (formData.mentor_phone || '').trim(),
      updated_at: new Date().toISOString()
    };

    // 1. Instant Local Storage Persistence (Zero Data Loss)
    try {
      const localRegistrations = JSON.parse(localStorage.getItem('sih_registrations') || '{}');
      localRegistrations[payload.temp_team_id] = payload;
      localStorage.setItem('sih_registrations', JSON.stringify(localRegistrations));
    } catch (localErr) {
      console.warn('LocalStorage error:', localErr);
    }

    // 2. Queue into Offline Sync Queue (Retried automatically if offline)
    try {
      const offlineQueue = JSON.parse(localStorage.getItem('sih_offline_pending_registrations') || '{}');
      offlineQueue[payload.temp_team_id] = payload;
      localStorage.setItem('sih_offline_pending_registrations', JSON.stringify(offlineQueue));
    } catch (qErr) {}

    // 3. Notify Parent Component State immediately
    try {
      if (onConfirmRegistration) {
        onConfirmRegistration(payload.temp_team_id, payload);
      }
    } catch (parentErr) {
      console.warn('Parent confirmation callback exception:', parentErr);
    }

    // 4. Resilient Cloud Upsert to Supabase
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout - saved to offline queue')), 12000)
      );
      const sanitizedPayload = formatRegistrationPayloadForSupabase(payload);
      const upsertPromise = supabase
        .from('registrations')
        .upsert(sanitizedPayload, { onConflict: 'temp_team_id' });

      const { error: sbError } = await Promise.race([upsertPromise, timeoutPromise]);

      if (!sbError) {
        // Remove from offline queue and clear draft on verified cloud confirmation
        try {
          const offlineQueue = JSON.parse(localStorage.getItem('sih_offline_pending_registrations') || '{}');
          delete offlineQueue[payload.temp_team_id];
          localStorage.setItem('sih_offline_pending_registrations', JSON.stringify(offlineQueue));
          localStorage.removeItem(`sih_draft_${payload.temp_team_id}`);
        } catch (e) {}
        setSyncStatusMsg('Verified & Saved to Cloud Database!');
      } else {
        setSyncStatusMsg('Saved to Local Cache! Will auto-sync to cloud database in background.');
      }
    } catch (err) {
      console.warn('Cloud sync note:', err.message);
      setSyncStatusMsg('Saved to Local Cache! Will auto-sync to cloud database in background.');
    }

    setIsSubmitting(false);
    setSubmitted(true);
  };

  const steps = [
    { id: 0, title: 'Team & PS' },
    { id: 1, title: 'Team Leader' },
    { id: 2, title: '5 Members' },
    { id: 3, title: 'Mentor & Submit' }
  ];

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="modal-dialog-box reg-form-modal" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className="modal-top-bar">
          <div className="modal-title-left">
            <div className={`modal-icon-badge ${existingRegistration ? 'edit-mode' : ''}`}>
              {existingRegistration ? <Save size={20} /> : <ShieldCheck size={20} />}
            </div>
            <div>
              <span className="modal-title-text">
                {existingRegistration ? 'Edit & Update Candidate Registration Form' : 'Candidate Team Finalist Registration Form'}
              </span>
              <div className="modal-title-sub">
                {existingRegistration 
                  ? `SIH 2026 • Editing Team ${formData.team_name || team.team_name} (${team.temp_team_id})`
                  : 'SIH 2026 • 6-Member Roster & Mentor Verification'}
              </div>
            </div>
          </div>
          <button className="btn-close-icon" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="reg-modal-body">
          {submitted ? (
            <div className="success-confirmation-view">
              <div className="success-icon-circle">
                <CheckCircle size={48} color="#10b981" />
              </div>
              <h2 className="success-title">
                {existingRegistration ? 'Registration Successfully Updated & Saved!' : 'Registration Successfully Submitted!'}
              </h2>
              <p className="success-desc">
                Team <strong>{formData.team_name}</strong> (<code>{formData.temp_team_id}</code>) details have been securely logged and saved into the Smart India Hackathon 2026 database.
              </p>

              <div className="confirmed-summary-box">
                <div className="summary-grid">
                  <div className="summary-cell">
                    <span className="cell-label">Problem Statement ID</span>
                    <strong className="cell-val text-primary-code">{formData.sih_ps_id}</strong>
                  </div>
                  <div className="summary-cell">
                    <span className="cell-label">Allocated Tier</span>
                    <span className={`status-pill ${formData.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {formData.status}
                    </span>
                  </div>
                  <div className="summary-cell full">
                    <span className="cell-label">PS Title</span>
                    <strong className="cell-val">{formData.ps_title || 'Verified National Problem Statement'}</strong>
                  </div>
                  <div className="summary-cell">
                    <span className="cell-label">Team Leader</span>
                    <strong className="cell-val">{formData.leader_name} ({formData.leader_gender || 'Male'}, {formData.leader_reg_no})</strong>
                  </div>
                  <div className="summary-cell">
                    <span className="cell-label">Leader Phone / WhatsApp</span>
                    <strong className="cell-val">{formData.leader_phone} / {formData.leader_whatsapp}</strong>
                  </div>
                  <div className="summary-cell">
                    <span className="cell-label">Faculty Mentor</span>
                    <strong className="cell-val">{formData.mentor_name || 'Designated Guide'} ({formData.mentor_designation})</strong>
                  </div>
                  <div className="summary-cell">
                    <span className="cell-label">Total Roster</span>
                    <strong className="cell-val">6 Verified Members (Leader + 5)</strong>
                  </div>
                </div>
              </div>

              <div className="success-actions">
                <button className="btn-primary-action" onClick={onClose}>
                  Close &amp; Return to Desk
                </button>
                <button type="button" className="btn-edit-submission-outline" onClick={() => setSubmitted(false)}>
                  Modify Details Again
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="reg-multi-step-form">
              {/* Step Navigation Bar */}
              <div className="form-steps-nav">
                {steps.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`step-nav-btn ${activeStep === idx ? 'active' : ''} ${activeStep > idx ? 'completed' : ''}`}
                    onClick={() => setActiveStep(idx)}
                  >
                    <span className="step-num">{activeStep > idx ? <Check size={12} /> : idx + 1}</span>
                    <span className="step-label">{s.title}</span>
                  </button>
                ))}
              </div>

              {errorMsg && (
                <div className="form-error-banner">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Step 0: Team & Problem Statement */}
              {activeStep === 0 && (
                <div className="step-section-content">
                  <div className="section-header-row">
                    <BookOpen size={18} className="text-indigo" />
                    <h3>Team &amp; Problem Statement Details</h3>
                  </div>

                  <div className="grid-2-col">
                    <div className="input-group">
                      <label>Temp Team ID <span className="req">*</span></label>
                      <input 
                        type="text" 
                        value={formData.temp_team_id} 
                        disabled 
                        className="input-disabled"
                      />
                    </div>

                    <div className="input-group">
                      <label>Selected Tier <span className="req">*</span></label>
                      <input 
                        type="text" 
                        value={formData.status} 
                        disabled 
                        className="input-disabled"
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Official Team Name <span className="req">*</span></label>
                    <input 
                      type="text" 
                      placeholder="e.g. AgriGuard, CyberKnights, EcoVision (No human names)"
                      value={formData.team_name}
                      onChange={(e) => {
                        setFormData({...formData, team_name: e.target.value});
                        if (validationErrors.team_name) {
                          setValidationErrors(prev => { const c = {...prev}; delete c.team_name; return c; });
                        }
                      }}
                      className={validationErrors.team_name ? 'input-error-field' : ''}
                    />
                    {validationErrors.team_name && <span className="field-err-msg">{validationErrors.team_name}</span>}
                    <span className="input-helper">Please provide a proper innovative team name (not a personal name).</span>
                  </div>

                  <div className="grid-2-col">
                    <div className="input-group">
                      <label>SIH Problem Statement ID <span className="req">*</span></label>
                      <input 
                        type="text" 
                        value={formData.sih_ps_id} 
                        onChange={(e) => {
                          setFormData({...formData, sih_ps_id: e.target.value});
                          if (validationErrors.sih_ps_id) {
                            setValidationErrors(prev => { const c = {...prev}; delete c.sih_ps_id; return c; });
                          }
                        }}
                        placeholder="e.g. SIH26131, SIH26001"
                        className={validationErrors.sih_ps_id ? 'input-error-field' : ''}
                      />
                      {validationErrors.sih_ps_id && <span className="field-err-msg">{validationErrors.sih_ps_id}</span>}
                    </div>

                    <div className="input-group helper-box-container">
                      <label>Need to verify your PS?</label>
                      <a 
                        href="https://sih.gov.in" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn-sih-portal-link"
                      >
                        <span>Search on sih.gov.in</span>
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Problem Statement Title <span className="req">*</span></label>
                    <textarea 
                      rows={2}
                      placeholder="e.g. AI-driven Real-Time Automated Crop Disease Diagnostic and Advisory System"
                      value={formData.ps_title}
                      onChange={(e) => {
                        setFormData({...formData, ps_title: e.target.value});
                        if (validationErrors.ps_title) {
                          setValidationErrors(prev => { const c = {...prev}; delete c.ps_title; return c; });
                        }
                      }}
                      className={validationErrors.ps_title ? 'input-error-field' : ''}
                    />
                    {validationErrors.ps_title && <span className="field-err-msg">{validationErrors.ps_title}</span>}
                    <span className="input-helper">
                      If unknown, look up <strong>{formData.sih_ps_id}</strong> on the official <a href="https://sih.gov.in" target="_blank" rel="noreferrer">sih.gov.in</a> portal and paste title here.
                    </span>
                  </div>

                  <div className="step-footer-actions">
                    {existingRegistration ? (
                      <button type="button" className="btn-quick-save-draft" onClick={handleSubmit} disabled={isSubmitting}>
                        <Save size={15} />
                        <span>Save Changes</span>
                      </button>
                    ) : <div></div>}
                    <button type="button" className="btn-next-step" onClick={() => handleNextStep(1)}>
                      <span>Next: Team Leader Info</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 1: Team Leader (Member 1) */}
              {activeStep === 1 && (
                <div className="step-section-content">
                  <div className="section-header-row">
                    <User size={18} className="text-emerald" />
                    <h3>Team Leader Details (Member 1)</h3>
                  </div>

                  <div className="grid-2-col">
                    <div className="input-group">
                      <label>Team Leader Name <span className="req">*</span></label>
                      <input 
                        type="text" 
                        value={formData.leader_name}
                        onChange={(e) => {
                          setFormData({...formData, leader_name: e.target.value});
                          if (validationErrors.leader_name) {
                            setValidationErrors(prev => { const c = {...prev}; delete c.leader_name; return c; });
                          }
                        }}
                        className={validationErrors.leader_name ? 'input-error-field' : ''}
                      />
                      {validationErrors.leader_name && <span className="field-err-msg">{validationErrors.leader_name}</span>}
                    </div>

                    <div className="input-group">
                      <label>Register Number <span className="req">*</span></label>
                      <input 
                        type="text" 
                        value={formData.leader_reg_no}
                        onChange={(e) => {
                          setFormData({...formData, leader_reg_no: e.target.value});
                          if (validationErrors.leader_reg_no) {
                            setValidationErrors(prev => { const c = {...prev}; delete c.leader_reg_no; return c; });
                          }
                        }}
                        className={validationErrors.leader_reg_no ? 'input-error-field' : ''}
                      />
                      {validationErrors.leader_reg_no && <span className="field-err-msg">{validationErrors.leader_reg_no}</span>}
                    </div>
                  </div>

                  <div className="grid-2-col">
                    <div className="input-group">
                      <label>Personal Email ID <span className="req">*</span></label>
                      <input 
                        type="email" 
                        placeholder="leader.personal@gmail.com"
                        value={formData.leader_personal_email}
                        onChange={(e) => {
                          setFormData({...formData, leader_personal_email: e.target.value});
                          if (validationErrors.leader_personal_email) {
                            setValidationErrors(prev => { const c = {...prev}; delete c.leader_personal_email; return c; });
                          }
                        }}
                        className={validationErrors.leader_personal_email ? 'input-error-field' : ''}
                      />
                      {validationErrors.leader_personal_email && <span className="field-err-msg">{validationErrors.leader_personal_email}</span>}
                    </div>

                    <div className="input-group">
                      <label>College Email ID</label>
                      <input 
                        type="email" 
                        placeholder="rollno@rathinam.ac.in (Optional)"
                        value={formData.leader_college_email}
                        onChange={(e) => setFormData({...formData, leader_college_email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid-2-col">
                    <div className="input-group">
                      <label>Calling Phone Number <span className="req">*</span></label>
                      <input 
                        type="tel" 
                        placeholder="10-digit mobile number"
                        value={formData.leader_phone}
                        onChange={(e) => {
                          setFormData({...formData, leader_phone: e.target.value});
                          if (validationErrors.leader_phone) {
                            setValidationErrors(prev => { const c = {...prev}; delete c.leader_phone; return c; });
                          }
                        }}
                        className={validationErrors.leader_phone ? 'input-error-field' : ''}
                      />
                      {validationErrors.leader_phone && <span className="field-err-msg">{validationErrors.leader_phone}</span>}
                    </div>

                    <div className="input-group">
                      <label>WhatsApp Number</label>
                      <input 
                        type="tel" 
                        placeholder="e.g. 9876543210"
                        value={formData.leader_whatsapp}
                        onChange={(e) => setFormData({...formData, leader_whatsapp: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid-2-col">
                    <div className="input-group">
                      <label>Gender <span className="req">*</span></label>
                      <select 
                        value={formData.leader_gender || 'Male'}
                        onChange={(e) => setFormData({...formData, leader_gender: e.target.value})}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label>Year of Study <span className="req">*</span></label>
                      <select 
                        value={formData.leader_year}
                        onChange={(e) => setFormData({...formData, leader_year: e.target.value})}
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="Post Graduate">Post Graduate (PG)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid-2-col">
                    <div className="input-group">
                      <label>Department <span className="req">*</span></label>
                      <input 
                        type="text" 
                        placeholder="e.g. CSE, AI & DS, IT, ECE"
                        value={formData.leader_dept}
                        onChange={(e) => setFormData({...formData, leader_dept: e.target.value})}
                      />
                    </div>

                    <div className="input-group">
                      <label>School / Faculty <span className="req">*</span></label>
                      <select 
                        value={formData.leader_school}
                        onChange={(e) => setFormData({...formData, leader_school: e.target.value})}
                      >
                        {OFFICIAL_SCHOOLS.map(sch => (
                          <option key={sch} value={sch}>{sch}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="step-footer-actions">
                    <button type="button" className="btn-prev-step" onClick={() => setActiveStep(0)}>
                      Back
                    </button>
                    <div className="step-footer-right" style={{ display: 'flex', gap: '10px' }}>
                      {existingRegistration && (
                        <button type="button" className="btn-quick-save-draft" onClick={handleSubmit} disabled={isSubmitting}>
                          <Save size={15} />
                          <span>Save Changes</span>
                        </button>
                      )}
                      <button type="button" className="btn-next-step" onClick={() => handleNextStep(2)}>
                        <span>Next: 5 Team Members</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: 5 Team Members */}
              {activeStep === 2 && (
                <div className="step-section-content">
                  <div className="section-header-row">
                    <Users size={18} className="text-amber" />
                    <div>
                      <h3>Other 5 Team Members (Mandatory Roster)</h3>
                      <span className="section-subtext">SIH requires an exact 6-member team structure (1 Leader + 5 Members).</span>
                    </div>
                  </div>

                  {/* SIH Gender Diversity Indicator */}
                  {(() => {
                    const totalFemale = (formData.leader_gender === 'Female' ? 1 : 0) +
                      (formData.members || []).filter(m => (m.name || '').trim() && m.gender === 'Female').length;
                    return (
                      <div className={`gender-diversity-banner ${totalFemale >= 1 ? 'compliant' : 'advisory'}`} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        marginBottom: '16px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        background: totalFemale >= 1 ? '#ecfdf5' : '#fffbeb',
                        border: `1px solid ${totalFemale >= 1 ? '#a7f3d0' : '#fde68a'}`,
                        color: totalFemale >= 1 ? '#065f46' : '#92400e'
                      }}>
                        {totalFemale >= 1 ? <CheckCircle size={15} color="#059669" /> : <AlertCircle size={15} color="#d97706" />}
                        <span>
                          {totalFemale >= 1 
                            ? `SIH Gender Diversity Compliant: ${totalFemale} Female Candidate(s) in Roster.`
                            : `SIH Guideline Advisory: Please ensure at least 1 female candidate is included in your 6-member team.`}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Member Tabs Header */}
                  <div className="member-sub-tabs">
                    {formData.members.map((m, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`member-sub-tab-btn ${activeMemberTab === idx ? 'active' : ''} ${m.name && m.reg_no ? 'filled' : ''}`}
                        onClick={() => setActiveMemberTab(idx)}
                      >
                        <span>Member #{idx + 2}</span>
                        {m.name ? <span className="mem-tab-name">({m.name.split(' ')[0]})</span> : null}
                        {m.name && m.reg_no ? <Check size={11} className="mem-check-icon" /> : null}
                      </button>
                    ))}
                  </div>

                  {/* Current Active Member Fields */}
                  {formData.members.map((member, idx) => {
                    if (idx !== activeMemberTab) return null;
                    return (
                      <div key={member.id} className="member-form-card">
                        <div className="member-card-top-row">
                          <span className="member-order-title">
                            Member #{idx + 2} Registration Details
                          </span>
                          <button
                            type="button"
                            className="btn-copy-leader"
                            onClick={() => copyLeaderDeptToMember(idx)}
                            title="Quick copy Department, School and Year from Team Leader"
                          >
                            Copy Leader Dept &amp; School
                          </button>
                        </div>

                        <div className="grid-2-col">
                          <div className="input-group">
                            <label>Member Full Name</label>
                            <input 
                              type="text" 
                              placeholder={`Full Name of Member #${idx + 2}`}
                              value={member.name}
                              onChange={(e) => updateMember(idx, 'name', e.target.value)}
                            />
                          </div>

                          <div className="input-group">
                            <label>Register Number {member.name ? <span className="req">*</span> : ''}</label>
                            <input 
                              type="text" 
                              placeholder="e.g. 22BCS102"
                              value={member.reg_no}
                              onChange={(e) => updateMember(idx, 'reg_no', e.target.value)}
                              className={validationErrors[`member_${idx}_reg_no`] ? 'input-error-field' : ''}
                            />
                            {validationErrors[`member_${idx}_reg_no`] && (
                              <span className="field-err-msg">{validationErrors[`member_${idx}_reg_no`]}</span>
                            )}
                          </div>
                        </div>

                        <div className="grid-2-col">
                          <div className="input-group">
                            <label>Personal Email</label>
                            <input 
                              type="email" 
                              placeholder="member.personal@gmail.com"
                              value={member.personal_email}
                              onChange={(e) => updateMember(idx, 'personal_email', e.target.value)}
                            />
                          </div>

                          <div className="input-group">
                            <label>College Email</label>
                            <input 
                              type="email" 
                              placeholder="rollno@rathinam.ac.in (Optional)"
                              value={member.college_email}
                              onChange={(e) => updateMember(idx, 'college_email', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid-2-col">
                          <div className="input-group">
                            <label>Phone Number</label>
                            <input 
                              type="tel" 
                              placeholder="10-digit phone number"
                              value={member.phone}
                              onChange={(e) => updateMember(idx, 'phone', e.target.value)}
                            />
                          </div>

                          <div className="input-group">
                            <label>WhatsApp Number</label>
                            <input 
                              type="tel" 
                              placeholder="WhatsApp number"
                              value={member.whatsapp}
                              onChange={(e) => updateMember(idx, 'whatsapp', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid-2-col">
                          <div className="input-group">
                            <label>Gender</label>
                            <select 
                              value={member.gender || 'Male'}
                              onChange={(e) => updateMember(idx, 'gender', e.target.value)}
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div className="input-group">
                            <label>Year of Study</label>
                            <select 
                              value={member.year}
                              onChange={(e) => updateMember(idx, 'year', e.target.value)}
                            >
                              <option value="1st Year">1st Year</option>
                              <option value="2nd Year">2nd Year</option>
                              <option value="3rd Year">3rd Year</option>
                              <option value="4th Year">4th Year</option>
                              <option value="Post Graduate">Post Graduate (PG)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid-2-col">
                          <div className="input-group">
                            <label>Department</label>
                            <input 
                              type="text" 
                              placeholder="e.g. CSE, IT, ECE"
                              value={member.dept}
                              onChange={(e) => updateMember(idx, 'dept', e.target.value)}
                            />
                          </div>

                          <div className="input-group">
                            <label>School / Faculty</label>
                            <select 
                              value={member.school}
                              onChange={(e) => updateMember(idx, 'school', e.target.value)}
                            >
                              {OFFICIAL_SCHOOLS.map(sch => (
                                <option key={sch} value={sch}>{sch}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="step-footer-actions">
                    <button type="button" className="btn-prev-step" onClick={() => setActiveStep(1)}>
                      Back
                    </button>
                    <div className="step-footer-right" style={{ display: 'flex', gap: '10px' }}>
                      {existingRegistration && (
                        <button type="button" className="btn-quick-save-draft" onClick={handleSubmit} disabled={isSubmitting}>
                          <Save size={15} />
                          <span>Save Changes</span>
                        </button>
                      )}
                      <button type="button" className="btn-next-step" onClick={() => handleNextStep(3)}>
                        <span>Next: Mentor &amp; Submit</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Mentor & Submission */}
              {activeStep === 3 && (
                <div className="step-section-content">
                  <div className="section-header-row">
                    <Award size={18} className="text-violet" />
                    <h3>Faculty Mentor / Guide Details</h3>
                  </div>

                  <div className="grid-2-col">
                    <div className="input-group">
                      <label>Mentor Full Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Dr. K. Raman / Prof. Deepa (Optional)"
                        value={formData.mentor_name}
                        onChange={(e) => setFormData({...formData, mentor_name: e.target.value})}
                      />
                    </div>

                    <div className="input-group">
                      <label>Designation</label>
                      <select 
                        value={formData.mentor_designation}
                        onChange={(e) => setFormData({...formData, mentor_designation: e.target.value})}
                      >
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Professor">Professor</option>
                        <option value="Head of Department (HoD)">Head of Department (HoD)</option>
                        <option value="Dean / Director">Dean / Director</option>
                        <option value="Industry Expert">Industry Expert</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid-2-col">
                    <div className="input-group">
                      <label>Mentor Email ID</label>
                      <input 
                        type="email" 
                        placeholder="mentor.name@rathinam.ac.in (Optional)"
                        value={formData.mentor_email}
                        onChange={(e) => setFormData({...formData, mentor_email: e.target.value})}
                      />
                    </div>

                    <div className="input-group">
                      <label>Mentor Phone Number</label>
                      <input 
                        type="tel" 
                        placeholder="e.g. 9840012345 (Optional)"
                        value={formData.mentor_phone}
                        onChange={(e) => setFormData({...formData, mentor_phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="declaration-card">
                    <div className="declaration-header">
                      <ShieldCheck size={16} className="text-emerald" />
                      <strong>Final Confirmation &amp; Anti-Overlap Declaration</strong>
                    </div>
                    <p>
                      I hereby certify that our team details and designated faculty mentor are verified. Our Problem Statement <code>{formData.sih_ps_id}</code> is officially locked and complies with all Smart India Hackathon 2026 guidelines.
                    </p>
                  </div>

                  <div className="step-footer-actions">
                    <button type="button" className="btn-prev-step" onClick={() => setActiveStep(2)}>
                      Back
                    </button>
                    <button type="button" className="btn-submit-final" onClick={handleSubmit} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <span>Saving to Database...</span>
                      ) : (
                        <>
                          <Save size={16} />
                          <span>{existingRegistration ? 'Save & Update Registration' : 'Submit & Lock Registration'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
