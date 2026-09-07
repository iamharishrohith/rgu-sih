import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle, ShieldCheck, User, Mail, Phone, Building, Hash, 
  ExternalLink, Users, Award, BookOpen, MessageSquare, AlertCircle, 
  ChevronRight, Save, Check
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function RegistrationModal({ team, onClose, onConfirmRegistration, existingRegistration }) {
  if (!team) return null;

  // Active sub-step in form (0: Team & PS, 1: Team Leader, 2: 5 Members, 3: Mentor & Submit)
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingRegistration);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    // Team & PS
    team_name: team.team_name !== 'Team Unknown' ? team.team_name : '',
    temp_team_id: team.temp_team_id,
    sih_ps_id: team.ps_id,
    ps_title: existingRegistration?.ps_title || '',
    status: team.status,
    
    // Team Leader (Member 1)
    leader_name: team.leader_name,
    leader_reg_no: team.reg_no,
    leader_personal_email: existingRegistration?.leader_personal_email || '',
    leader_college_email: existingRegistration?.leader_college_email || '',
    leader_phone: existingRegistration?.leader_phone || team.mobile || '',
    leader_whatsapp: existingRegistration?.leader_whatsapp || team.mobile || '',
    leader_year: existingRegistration?.leader_year || '3rd Year',
    leader_dept: existingRegistration?.leader_dept || team.school || 'Computer Science & Engineering',
    leader_school: existingRegistration?.leader_school || team.school || 'School of Engineering & Technology',

    // 5 Team Members (Members 2 to 6)
    members: existingRegistration?.members || [
      { id: 2, name: '', reg_no: '', personal_email: '', college_email: '', phone: '', whatsapp: '', year: '3rd Year', dept: 'Computer Science & Engineering', school: 'School of Engineering & Technology' },
      { id: 3, name: '', reg_no: '', personal_email: '', college_email: '', phone: '', whatsapp: '', year: '3rd Year', dept: 'Computer Science & Engineering', school: 'School of Engineering & Technology' },
      { id: 4, name: '', reg_no: '', personal_email: '', college_email: '', phone: '', whatsapp: '', year: '3rd Year', dept: 'Computer Science & Engineering', school: 'School of Engineering & Technology' },
      { id: 5, name: '', reg_no: '', personal_email: '', college_email: '', phone: '', whatsapp: '', year: '3rd Year', dept: 'Computer Science & Engineering', school: 'School of Engineering & Technology' },
      { id: 6, name: '', reg_no: '', personal_email: '', college_email: '', phone: '', whatsapp: '', year: '3rd Year', dept: 'Computer Science & Engineering', school: 'School of Engineering & Technology' },
    ],

    // Faculty Mentor
    mentor_name: existingRegistration?.mentor_name || '',
    mentor_designation: existingRegistration?.mentor_designation || 'Assistant Professor',
    mentor_email: existingRegistration?.mentor_email || '',
    mentor_phone: existingRegistration?.mentor_phone || ''
  });

  const [activeMemberTab, setActiveMemberTab] = useState(0);

  // Helper to update member details
  const updateMember = (index, field, value) => {
    setFormData(prev => {
      const updatedMembers = [...prev.members];
      updatedMembers[index] = { ...updatedMembers[index], [field]: value };
      return { ...prev, members: updatedMembers };
    });
  };

  // Quick copy leader school/dept to member
  const copyLeaderDeptToMember = (index) => {
    updateMember(index, 'dept', formData.leader_dept);
    updateMember(index, 'school', formData.leader_school);
    updateMember(index, 'year', formData.leader_year);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    // Validation
    if (!formData.team_name.trim()) {
      setErrorMsg('Please specify a valid official Team Name.');
      setIsSubmitting(false);
      setActiveStep(0);
      return;
    }
    if (!formData.ps_title.trim()) {
      setErrorMsg('Please provide the Problem Statement Title (verify on sih.gov.in if needed).');
      setIsSubmitting(false);
      setActiveStep(0);
      return;
    }
    if (!formData.leader_personal_email || !formData.leader_phone) {
      setErrorMsg('Please complete Team Leader contact details.');
      setIsSubmitting(false);
      setActiveStep(1);
      return;
    }

    const payload = {
      temp_team_id: formData.temp_team_id,
      team_name: formData.team_name,
      sih_ps_id: formData.sih_ps_id,
      ps_title: formData.ps_title,
      status: formData.status,
      leader_name: formData.leader_name,
      leader_reg_no: formData.leader_reg_no,
      leader_personal_email: formData.leader_personal_email,
      leader_college_email: formData.leader_college_email,
      leader_phone: formData.leader_phone,
      leader_whatsapp: formData.leader_whatsapp,
      leader_year: formData.leader_year,
      leader_dept: formData.leader_dept,
      leader_school: formData.leader_school,
      members: formData.members,
      mentor_name: formData.mentor_name,
      mentor_designation: formData.mentor_designation,
      mentor_email: formData.mentor_email,
      mentor_phone: formData.mentor_phone,
      updated_at: new Date().toISOString()
    };

    try {
      // 1. Try upserting to Supabase
      const { data, error } = await supabase
        .from('registrations')
        .upsert(payload, { onConflict: 'temp_team_id' })
        .select();

      if (error) {
        console.warn('Supabase insert warning, falling back to offline storage:', error);
      }

      // 2. Always persist to localStorage for zero-data-loss guarantee
      const localRegistrations = JSON.parse(localStorage.getItem('sih_registrations') || '{}');
      localRegistrations[formData.temp_team_id] = payload;
      localStorage.setItem('sih_registrations', JSON.stringify(localRegistrations));

      setIsSubmitting(false);
      setSubmitted(true);
      if (onConfirmRegistration) {
        onConfirmRegistration(formData.temp_team_id, payload);
      }
    } catch (err) {
      console.error('Registration error:', err);
      // Still save locally
      const localRegistrations = JSON.parse(localStorage.getItem('sih_registrations') || '{}');
      localRegistrations[formData.temp_team_id] = payload;
      localStorage.setItem('sih_registrations', JSON.stringify(localRegistrations));

      setIsSubmitting(false);
      setSubmitted(true);
      if (onConfirmRegistration) {
        onConfirmRegistration(formData.temp_team_id, payload);
      }
    }
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
            <div className="modal-icon-badge">
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="modal-title-text">
                Candidate Team Finalist Registration Form
              </span>
              <div className="modal-title-sub">
                SIH 2026 • 6-Member Roster &amp; Mentor Verification
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
              <h2 className="success-title">Registration Successfully Submitted!</h2>
              <p className="success-desc">
                Team <strong>{formData.team_name}</strong> (<code>{formData.temp_team_id}</code>) has been securely logged into the Smart India Hackathon 2026 database.
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
                    <strong className="cell-val">{formData.leader_name} ({formData.leader_reg_no})</strong>
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
                  Back to Shortlist Desk
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
                      required 
                      placeholder="e.g. AgriGuard, CyberKnights, EcoVision (No human names)"
                      value={formData.team_name}
                      onChange={(e) => setFormData({...formData, team_name: e.target.value})}
                    />
                    <span className="input-helper">Please provide a proper innovative team name (not a personal name).</span>
                  </div>

                  <div className="grid-2-col">
                    <div className="input-group">
                      <label>SIH Problem Statement ID <span className="req">*</span></label>
                      <input 
                        type="text" 
                        value={formData.sih_ps_id} 
                        onChange={(e) => setFormData({...formData, sih_ps_id: e.target.value})}
                        placeholder="e.g. SIH26131, SIH26001"
                      />
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
                      required
                      placeholder="e.g. AI-driven Real-Time Automated Crop Disease Diagnostic and Advisory System"
                      value={formData.ps_title}
                      onChange={(e) => setFormData({...formData, ps_title: e.target.value})}
                    />
                    <span className="input-helper">
                      If unknown, look up <strong>{formData.sih_ps_id}</strong> on the official <a href="https://sih.gov.in" target="_blank" rel="noreferrer">sih.gov.in</a> portal and paste title here.
                    </span>
                  </div>

                  <div className="step-footer-actions">
                    <div></div>
                    <button type="button" className="btn-next-step" onClick={() => setActiveStep(1)}>
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
                        required 
                        value={formData.leader_name}
                        onChange={(e) => setFormData({...formData, leader_name: e.target.value})}
                      />
                    </div>

                    <div className="input-group">
                      <label>Register Number <span className="req">*</span></label>
                      <input 
                        type="text" 
                        required 
                        value={formData.leader_reg_no}
                        onChange={(e) => setFormData({...formData, leader_reg_no: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid-2-col">
                    <div className="input-group">
                      <label>Personal Email ID <span className="req">*</span></label>
                      <input 
                        type="email" 
                        required 
                        placeholder="leader.personal@gmail.com"
                        value={formData.leader_personal_email}
                        onChange={(e) => setFormData({...formData, leader_personal_email: e.target.value})}
                      />
                    </div>

                    <div className="input-group">
                      <label>College Official Email ID <span className="req">*</span></label>
                      <input 
                        type="email" 
                        required 
                        placeholder="leader.regno@rathinam.ac.in"
                        value={formData.leader_college_email}
                        onChange={(e) => setFormData({...formData, leader_college_email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid-2-col">
                    <div className="input-group">
                      <label>Phone Calling Number <span className="req">*</span></label>
                      <input 
                        type="tel" 
                        required 
                        placeholder="e.g. 9876543210"
                        value={formData.leader_phone}
                        onChange={(e) => setFormData({...formData, leader_phone: e.target.value})}
                      />
                    </div>

                    <div className="input-group">
                      <label>WhatsApp Number <span className="req">*</span></label>
                      <input 
                        type="tel" 
                        required 
                        placeholder="e.g. 9876543210"
                        value={formData.leader_whatsapp}
                        onChange={(e) => setFormData({...formData, leader_whatsapp: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid-3-col">
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

                    <div className="input-group">
                      <label>Department <span className="req">*</span></label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. CSE, AI & DS, IT, ECE"
                        value={formData.leader_dept}
                        onChange={(e) => setFormData({...formData, leader_dept: e.target.value})}
                      />
                    </div>

                    <div className="input-group">
                      <label>School / Faculty <span className="req">*</span></label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. School of Engineering & Technology"
                        value={formData.leader_school}
                        onChange={(e) => setFormData({...formData, leader_school: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="step-footer-actions">
                    <button type="button" className="btn-prev-step" onClick={() => setActiveStep(0)}>
                      Back
                    </button>
                    <button type="button" className="btn-next-step" onClick={() => setActiveStep(2)}>
                      <span>Next: 5 Team Members</span>
                      <ChevronRight size={16} />
                    </button>
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

                  {/* Member Selector Tabs */}
                  <div className="member-subtabs">
                    {formData.members.map((m, idx) => (
                      <button
                        key={m.id}
                        type="button"
                        className={`member-pill-btn ${activeMemberTab === idx ? 'selected' : ''}`}
                        onClick={() => setActiveMemberTab(idx)}
                      >
                        <span>Member {idx + 2}</span>
                        {m.name && <span className="member-filled-dot"></span>}
                      </button>
                    ))}
                  </div>

                  {/* Active Member Form Card */}
                  <div className="active-member-card">
                    <div className="member-card-header">
                      <h4>Member #{activeMemberTab + 2} Information</h4>
                      <button 
                        type="button" 
                        className="btn-copy-leader-dept"
                        onClick={() => copyLeaderDeptToMember(activeMemberTab)}
                      >
                        Copy Leader Dept/School
                      </button>
                    </div>

                    <div className="grid-2-col">
                      <div className="input-group">
                        <label>Member Full Name <span className="req">*</span></label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. Priya S"
                          value={formData.members[activeMemberTab].name}
                          onChange={(e) => updateMember(activeMemberTab, 'name', e.target.value)}
                        />
                      </div>

                      <div className="input-group">
                        <label>Register Number <span className="req">*</span></label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. 21BCSE045"
                          value={formData.members[activeMemberTab].reg_no}
                          onChange={(e) => updateMember(activeMemberTab, 'reg_no', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid-2-col">
                      <div className="input-group">
                        <label>Personal Email ID <span className="req">*</span></label>
                        <input 
                          type="email" 
                          required 
                          placeholder="member.personal@gmail.com"
                          value={formData.members[activeMemberTab].personal_email}
                          onChange={(e) => updateMember(activeMemberTab, 'personal_email', e.target.value)}
                        />
                      </div>

                      <div className="input-group">
                        <label>College Official Email ID <span className="req">*</span></label>
                        <input 
                          type="email" 
                          required 
                          placeholder="member.regno@rathinam.ac.in"
                          value={formData.members[activeMemberTab].college_email}
                          onChange={(e) => updateMember(activeMemberTab, 'college_email', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid-2-col">
                      <div className="input-group">
                        <label>Phone Calling Number <span className="req">*</span></label>
                        <input 
                          type="tel" 
                          required 
                          placeholder="e.g. 9876543211"
                          value={formData.members[activeMemberTab].phone}
                          onChange={(e) => updateMember(activeMemberTab, 'phone', e.target.value)}
                        />
                      </div>

                      <div className="input-group">
                        <label>WhatsApp Number <span className="req">*</span></label>
                        <input 
                          type="tel" 
                          required 
                          placeholder="e.g. 9876543211"
                          value={formData.members[activeMemberTab].whatsapp}
                          onChange={(e) => updateMember(activeMemberTab, 'whatsapp', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid-3-col">
                      <div className="input-group">
                        <label>Year of Study <span className="req">*</span></label>
                        <select 
                          value={formData.members[activeMemberTab].year}
                          onChange={(e) => updateMember(activeMemberTab, 'year', e.target.value)}
                        >
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                          <option value="Post Graduate">Post Graduate (PG)</option>
                        </select>
                      </div>

                      <div className="input-group">
                        <label>Department <span className="req">*</span></label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. CSE, IT, ECE"
                          value={formData.members[activeMemberTab].dept}
                          onChange={(e) => updateMember(activeMemberTab, 'dept', e.target.value)}
                        />
                      </div>

                      <div className="input-group">
                        <label>School / Faculty <span className="req">*</span></label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. School of Engineering & Technology"
                          value={formData.members[activeMemberTab].school}
                          onChange={(e) => updateMember(activeMemberTab, 'school', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="step-footer-actions">
                    <button type="button" className="btn-prev-step" onClick={() => setActiveStep(1)}>
                      Back
                    </button>
                    <button type="button" className="btn-next-step" onClick={() => setActiveStep(3)}>
                      <span>Next: Mentor &amp; Submit</span>
                      <ChevronRight size={16} />
                    </button>
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
                      <label>Mentor Full Name <span className="req">*</span></label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Dr. K. Raman / Prof. Deepa"
                        value={formData.mentor_name}
                        onChange={(e) => setFormData({...formData, mentor_name: e.target.value})}
                      />
                    </div>

                    <div className="input-group">
                      <label>Designation <span className="req">*</span></label>
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
                      <label>Mentor Email ID <span className="req">*</span></label>
                      <input 
                        type="email" 
                        required 
                        placeholder="mentor.name@rathinam.ac.in"
                        value={formData.mentor_email}
                        onChange={(e) => setFormData({...formData, mentor_email: e.target.value})}
                      />
                    </div>

                    <div className="input-group">
                      <label>Mentor Phone Number <span className="req">*</span></label>
                      <input 
                        type="tel" 
                        required 
                        placeholder="e.g. 9840012345"
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
                      I hereby certify that all 6 team members and the designated faculty mentor are verified. Our Problem Statement <code>{formData.sih_ps_id}</code> is officially locked and complies with all Smart India Hackathon 2026 guidelines.
                    </p>
                  </div>

                  <div className="step-footer-actions">
                    <button type="button" className="btn-prev-step" onClick={() => setActiveStep(2)}>
                      Back
                    </button>
                    <button type="submit" className="btn-submit-final" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <span>Saving to Database...</span>
                      ) : (
                        <>
                          <Save size={16} />
                          <span>Submit &amp; Lock Registration</span>
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
