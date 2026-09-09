import React, { useState, useMemo } from 'react';
import { 
  Users, CheckCircle2, Clock, Phone, MessageSquare, Download, Upload, Plus, Trash2, EyeOff, 
  Search, Filter, ShieldCheck, UserCheck, Eye, Edit3, Save, X, ExternalLink,
  LogOut, RefreshCw, Layers, BarChart3, PieChart, Award, FileText, Send, Check
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { sanitizeCSVField } from '../crypto_security';
import TeamEditorModal from './TeamEditorModal.jsx';
import DeleteConfirmationModal from './DeleteConfirmationModal.jsx';

export default function AdminDashboard({ 
  allMasterTeams, 
  registrationsMap, 
  teamContactsMap,
  onUpdateContact, 
  onLogout,
  onViewTeamDetails,
  onOpenTeamForm,
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam,
  hiddenTeamIds = [],
  onToggleTeamVisibility
}) {
  // Navigation Tabs: 'analytics' | 'shortlist' | 'bench' | 'waitlist' | 'pending' | 'upload'
  const [activeTab, setActiveTab] = useState('analytics'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState('all');
  const [uploadText, setUploadText] = useState('');
  const [uploadFeedback, setUploadFeedback] = useState(null);
  const [editingContactId, setEditingContactId] = useState(null);
  const [editPhone, setEditPhone] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);

  const handleOpenCreateModal = () => {
    setTeamToEdit(null);
    setIsEditorModalOpen(true);
  };

  const handleOpenEditModal = (team) => {
    setTeamToEdit(team);
    setIsEditorModalOpen(true);
  };

  const handleOpenDeleteModal = (team) => {
    setTeamToDelete(team);
    setIsDeleteModalOpen(true);
  };

  const handleSaveTeamEditor = async (teamData, isEditMode) => {
    if (isEditMode) {
      if (onUpdateTeam) await onUpdateTeam(teamData.temp_team_id, teamData);
    } else {
      if (onCreateTeam) await onCreateTeam(teamData);
    }
  };

  const handleConfirmDelete = async (tempTeamId) => {
    if (onDeleteTeam) await onDeleteTeam(tempTeamId);
  };

  // Combined Team Records for all 110 Finalized Teams
  const teamRecords = useMemo(() => {
    return allMasterTeams.map(t => {
      const reg = registrationsMap[t.temp_team_id];
      const contact = teamContactsMap[t.temp_team_id];
      const isRegistered = !!reg;
      const phone = reg?.leader_phone || contact?.phone_number || t.mobile || '';
      const whatsapp = reg?.leader_whatsapp || contact?.whatsapp_number || t.mobile || '';
      const isHidden = Array.isArray(hiddenTeamIds) 
        ? hiddenTeamIds.includes(t.temp_team_id) 
        : (hiddenTeamIds instanceof Set ? hiddenTeamIds.has(t.temp_team_id) : false);

      return {
        ...t,
        team_name: reg?.team_name || t.team_name,
        ps_id: reg?.sih_ps_id || reg?.ps_id || t.ps_id,
        ps_title: reg?.ps_title || t.ps_title,
        leader_name: reg?.leader_name || t.leader_name,
        reg_no: reg?.leader_reg_no || reg?.reg_no || t.reg_no,
        school: reg?.leader_school || reg?.leader_dept || t.school,
        isRegistered,
        registrationData: reg,
        contactData: contact,
        effectivePhone: phone,
        effectiveWhatsapp: whatsapp,
        isHidden
      };
    });
  }, [allMasterTeams, registrationsMap, teamContactsMap, hiddenTeamIds]);

  // Overall & Tier Analytics
  const stats = useMemo(() => {
    const total = teamRecords.length;
    const registered = teamRecords.filter(t => t.isRegistered).length;
    const pending = total - registered;
    const completionPct = total > 0 ? Math.round((registered / total) * 100) : 0;
    const totalMembers = registered * 6; // 1 Leader + 5 Members

    const shortlistTeams = teamRecords.filter(t => t.status === 'Shortlist');
    const benchTeams = teamRecords.filter(t => t.status === 'Bench');
    const waitlistTeams = teamRecords.filter(t => t.status === 'Waitlist');

    const shortlistReg = shortlistTeams.filter(t => t.isRegistered).length;
    const benchReg = benchTeams.filter(t => t.isRegistered).length;
    const waitlistReg = waitlistTeams.filter(t => t.isRegistered).length;

    // School breakdown
    const schoolMap = {};
    teamRecords.forEach(t => {
      const sch = t.school || 'Unspecified';
      if (!schoolMap[sch]) schoolMap[sch] = { total: 0, reg: 0 };
      schoolMap[sch].total++;
      if (t.isRegistered) schoolMap[sch].reg++;
    });

    return { 
      total, registered, pending, completionPct, totalMembers,
      shortlistTotal: shortlistTeams.length,
      shortlistReg,
      benchTotal: benchTeams.length,
      benchReg,
      waitlistTotal: waitlistTeams.length,
      waitlistReg,
      schoolMap
    };
  }, [teamRecords]);

  // List of distinct schools for filtering
  const distinctSchools = useMemo(() => {
    return Array.from(new Set(teamRecords.map(t => t.school).filter(Boolean)));
  }, [teamRecords]);

  // Filtered List based on active tab & search
  const currentTabTeams = useMemo(() => {
    let list = teamRecords;
    if (activeTab === 'shortlist') list = teamRecords.filter(t => t.status === 'Shortlist');
    else if (activeTab === 'bench') list = teamRecords.filter(t => t.status === 'Bench');
    else if (activeTab === 'waitlist') list = teamRecords.filter(t => t.status === 'Waitlist');
    else if (activeTab === 'pending') list = teamRecords.filter(t => !t.isRegistered);

    if (selectedSchoolFilter !== 'all') {
      list = list.filter(t => t.school === selectedSchoolFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(t => 
        t.temp_team_id.toLowerCase().includes(q) ||
        t.team_name.toLowerCase().includes(q) ||
        t.leader_name.toLowerCase().includes(q) ||
        t.reg_no.toLowerCase().includes(q) ||
        t.ps_id.toLowerCase().includes(q) ||
        t.school.toLowerCase().includes(q) ||
        t.effectivePhone.includes(q) ||
        t.effectiveWhatsapp.includes(q)
      );
    }

    return list;
  }, [teamRecords, activeTab, selectedSchoolFilter, searchTerm]);

  // Handle Quick Contact Save
  const handleSaveContact = async (tempTeamId) => {
    try {
      await onUpdateContact(tempTeamId, editPhone, editWhatsapp || editPhone);
      setEditingContactId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const startEditContact = (team) => {
    setEditingContactId(team.temp_team_id);
    setEditPhone(team.effectivePhone);
    setEditWhatsapp(team.effectiveWhatsapp || team.effectivePhone);
  };

  // Handle Bulk Number Upload (CSV / Paste: TempTeamID, Phone, WhatsApp)
  const handleProcessBulkUpload = async (e) => {
    e.preventDefault();
    if (!uploadText.trim()) return;

    const lines = uploadText.trim().split('\n');
    let updatedCount = 0;

    for (const line of lines) {
      const parts = line.split(/[,\t|]/).map(p => p.trim());
      if (parts.length >= 2) {
        const tempId = parts[0];
        const phone = parts[1];
        const whatsapp = parts[2] || phone;

        if (tempId) {
          await onUpdateContact(tempId, phone, whatsapp);
          updatedCount++;
        }
      }
    }

    setUploadFeedback(`Successfully processed and attached numbers for ${updatedCount} teams!`);
    setUploadText('');
  };

  // Export Registered Dataset to CSV
  const handleExportCSV = () => {
    const headers = [
      'Temp Team ID', 'Team Name', 'Tier Status', 'PS ID', 'PS Title',
      'Leader Name', 'Leader Reg No', 'Leader Personal Email', 'Leader College Email', 'Leader Phone', 'Leader WhatsApp', 'Leader Year', 'Leader Dept', 'Leader School',
      'Member 2 Name', 'Member 2 Reg No', 'Member 2 Email', 'Member 2 Phone',
      'Member 3 Name', 'Member 3 Reg No', 'Member 3 Email', 'Member 3 Phone',
      'Member 4 Name', 'Member 4 Reg No', 'Member 4 Email', 'Member 4 Phone',
      'Member 5 Name', 'Member 5 Reg No', 'Member 5 Email', 'Member 5 Phone',
      'Member 6 Name', 'Member 6 Reg No', 'Member 6 Email', 'Member 6 Phone',
      'Mentor Name', 'Mentor Designation', 'Mentor Email', 'Mentor Phone'
    ];

    const rows = teamRecords.map(t => {
      const reg = t.registrationData || {};
      const m = reg.members || [];
      return [
        sanitizeCSVField(t.temp_team_id),
        sanitizeCSVField(reg.team_name || t.team_name),
        sanitizeCSVField(t.status),
        sanitizeCSVField(t.ps_id),
        sanitizeCSVField(reg.ps_title || ''),
        sanitizeCSVField(t.leader_name),
        sanitizeCSVField(t.reg_no),
        sanitizeCSVField(reg.leader_personal_email || ''),
        sanitizeCSVField(reg.leader_college_email || ''),
        sanitizeCSVField(reg.leader_phone || t.effectivePhone),
        sanitizeCSVField(reg.leader_whatsapp || t.effectiveWhatsapp),
        sanitizeCSVField(reg.leader_year || ''),
        sanitizeCSVField(reg.leader_dept || ''),
        sanitizeCSVField(reg.leader_school || t.school),
        sanitizeCSVField(m[0]?.name || ''), sanitizeCSVField(m[0]?.reg_no || ''), sanitizeCSVField(m[0]?.personal_email || ''), sanitizeCSVField(m[0]?.phone || ''),
        sanitizeCSVField(m[1]?.name || ''), sanitizeCSVField(m[1]?.reg_no || ''), sanitizeCSVField(m[1]?.personal_email || ''), sanitizeCSVField(m[1]?.phone || ''),
        sanitizeCSVField(m[2]?.name || ''), sanitizeCSVField(m[2]?.reg_no || ''), sanitizeCSVField(m[2]?.personal_email || ''), sanitizeCSVField(m[2]?.phone || ''),
        sanitizeCSVField(m[3]?.name || ''), sanitizeCSVField(m[3]?.reg_no || ''), sanitizeCSVField(m[3]?.personal_email || ''), sanitizeCSVField(m[3]?.phone || ''),
        sanitizeCSVField(m[4]?.name || ''), sanitizeCSVField(m[4]?.reg_no || ''), sanitizeCSVField(m[4]?.personal_email || ''), sanitizeCSVField(m[4]?.phone || ''),
        sanitizeCSVField(reg.mentor_name || ''),
        sanitizeCSVField(reg.mentor_designation || ''),
        sanitizeCSVField(reg.mentor_email || ''),
        sanitizeCSVField(reg.mentor_phone || '')
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SIH2026_Finalist_Teams_Roster_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-dashboard-wrapper">
      {/* Top Admin Sub-Header */}
      <div className="admin-header-strip">
        <div className="admin-title-group">
          <div className="admin-badge-icon">
            <Layers size={22} />
          </div>
          <div>
            <h2>SIH 2026 Finalist Administration &amp; Master Desk</h2>
            <p>110 Finalized Teams • 80 Unique Problem Statements • Real-Time Roster Manager</p>
          </div>
        </div>

                        <div className="admin-top-actions">
          <button className="btn-admin-add-team" onClick={handleOpenCreateModal}>
            <Plus size={15} />
            <span>Add New Team</span>
          </button>
          <button className="btn-export-csv" onClick={handleExportCSV}>
            <Download size={15} />
            <span>Export Master Roster (CSV)</span>
          </button>
          <button className="btn-admin-logout" onClick={onLogout}>
            <LogOut size={15} />
            <span>Lock Desk</span>
          </button>
        </div>
      </div>

      {/* Admin Modular Tab Navigation */}
      <div className="admin-modular-nav-bar">
        <button 
          className={`admin-mod-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={16} />
          <span>Master Analytics</span>
        </button>

        <button 
          className={`admin-mod-tab ${activeTab === 'shortlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('shortlist')}
        >
          <ShieldCheck size={16} className="text-emerald" />
          <span>Shortlist ({stats.shortlistTotal})</span>
          <span className="mod-tab-sub-count">{stats.shortlistReg} filled</span>
        </button>

        <button 
          className={`admin-mod-tab ${activeTab === 'bench' ? 'active' : ''}`}
          onClick={() => setActiveTab('bench')}
        >
          <Award size={16} className="text-amber" />
          <span>Bench ({stats.benchTotal})</span>
          <span className="mod-tab-sub-count">{stats.benchReg} filled</span>
        </button>

        <button 
          className={`admin-mod-tab ${activeTab === 'waitlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('waitlist')}
        >
          <Filter size={16} className="text-indigo" />
          <span>Waitlist ({stats.waitlistTotal})</span>
          <span className="mod-tab-sub-count">{stats.waitlistReg} filled</span>
        </button>

        <button 
          className={`admin-mod-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Clock size={16} className="text-rose" />
          <span>Pending Forms ({stats.pending})</span>
        </button>

        <button 
          className={`admin-mod-tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <Upload size={16} />
          <span>Bulk Upload Numbers</span>
        </button>
      </div>

      {/* =========================================================================
          VIEW 1: MASTER ANALYTICS VIEW
          ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="master-analytics-view-container">
          {/* Top 4 KPI Metrics */}
          <div className="analytics-metrics-grid">
            <div className="metric-card total-card">
              <div className="metric-icon-wrap bg-blue">
                <Users size={22} />
              </div>
              <div className="metric-data">
                <span className="metric-num">{stats.total}</span>
                <span className="metric-label">Finalized Teams Total</span>
              </div>
            </div>

            <div className="metric-card submitted-card">
              <div className="metric-icon-wrap bg-emerald">
                <CheckCircle2 size={22} />
              </div>
              <div className="metric-data">
                <span className="metric-num">{stats.registered}</span>
                <span className="metric-label">Forms Completed ({stats.completionPct}%)</span>
              </div>
            </div>

            <div className="metric-card pending-card">
              <div className="metric-icon-wrap bg-amber">
                <Clock size={22} />
              </div>
              <div className="metric-data">
                <span className="metric-num">{stats.pending}</span>
                <span className="metric-label">Pending Forms ({100 - stats.completionPct}%)</span>
              </div>
            </div>

            <div className="metric-card members-card">
              <div className="metric-icon-wrap bg-violet">
                <UserCheck size={22} />
              </div>
              <div className="metric-data">
                <span className="metric-num">{stats.totalMembers}</span>
                <span className="metric-label">Registered Members</span>
              </div>
            </div>
          </div>

          {/* Tier Completion Breakdown Cards */}
          <div className="analytics-tier-breakdown-grid">
            <div className="tier-breakdown-card shortlist-bd" onClick={() => setActiveTab('shortlist')}>
              <div className="tier-bd-header">
                <div className="tier-bd-title">
                  <ShieldCheck size={20} className="text-emerald" />
                  <h4>Shortlisted Finalists</h4>
                </div>
                <span className="tier-bd-stat-tag emerald">{stats.shortlistReg} / {stats.shortlistTotal} Ready</span>
              </div>
              <p className="tier-bd-desc">80 Unique Problem Statements finalized with 0 overlap.</p>
              <div className="progress-bar-wrap">
                <div 
                  className="progress-bar-fill emerald" 
                  style={{ width: `${(stats.shortlistReg / (stats.shortlistTotal || 1)) * 100}%` }}
                ></div>
              </div>
              <div className="tier-bd-footer">
                <span>{Math.round((stats.shortlistReg / (stats.shortlistTotal || 1)) * 100)}% Submitted</span>
                <span className="btn-jump-tab">Open Shortlist &rarr;</span>
              </div>
            </div>

            <div className="tier-breakdown-card bench-bd" onClick={() => setActiveTab('bench')}>
              <div className="tier-bd-header">
                <div className="tier-bd-title">
                  <Award size={20} className="text-amber" />
                  <h4>Bench Standby Pool</h4>
                </div>
                <span className="tier-bd-stat-tag amber">{stats.benchReg} / {stats.benchTotal} Ready</span>
              </div>
              <p className="tier-bd-desc">10 Top Secondary Teams on standby for national registration.</p>
              <div className="progress-bar-wrap">
                <div 
                  className="progress-bar-fill amber" 
                  style={{ width: `${(stats.benchReg / (stats.benchTotal || 1)) * 100}%` }}
                ></div>
              </div>
              <div className="tier-bd-footer">
                <span>{Math.round((stats.benchReg / (stats.benchTotal || 1)) * 100)}% Submitted</span>
                <span className="btn-jump-tab">Open Bench &rarr;</span>
              </div>
            </div>

            <div className="tier-breakdown-card waitlist-bd" onClick={() => setActiveTab('waitlist')}>
              <div className="tier-bd-header">
                <div className="tier-bd-title">
                  <Filter size={20} className="text-indigo" />
                  <h4>Waitlist Pool</h4>
                </div>
                <span className="tier-bd-stat-tag indigo">{stats.waitlistReg} / {stats.waitlistTotal} Ready</span>
              </div>
              <p className="tier-bd-desc">20 High-scoring teams for domain balancing.</p>
              <div className="progress-bar-wrap">
                <div 
                  className="progress-bar-fill indigo" 
                  style={{ width: `${(stats.waitlistReg / (stats.waitlistTotal || 1)) * 100}%` }}
                ></div>
              </div>
              <div className="tier-bd-footer">
                <span>{Math.round((stats.waitlistReg / (stats.waitlistTotal || 1)) * 100)}% Submitted</span>
                <span className="btn-jump-tab">Open Waitlist &rarr;</span>
              </div>
            </div>
          </div>

          {/* School-Wise Distribution Breakdown */}
          <div className="analytics-school-card">
            <h3 className="section-card-title">School &amp; Faculty Distribution Breakdown</h3>
            <div className="school-bars-list">
              {Object.entries(stats.schoolMap).map(([schoolName, data]) => {
                const pct = Math.round((data.reg / data.total) * 100);
                return (
                  <div key={schoolName} className="school-bar-row">
                    <div className="school-bar-info">
                      <span className="school-bar-name">{schoolName}</span>
                      <span className="school-bar-counts">
                        <strong>{data.reg}</strong> / {data.total} Forms Completed ({pct}%)
                      </span>
                    </div>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar-fill indigo" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: BULK UPLOAD VIEW
          ========================================================================= */}
      {activeTab === 'upload' && (
        <div className="bulk-upload-card">
          <div className="bulk-header">
            <Upload size={22} className="text-indigo" />
            <div>
              <h3>Admin Upload &amp; Link Team Leader Contact Numbers</h3>
              <p>Paste lines formatted as <code>TempTeamID, PhoneNumber</code> or <code>TempTeamID, PhoneNumber, WhatsAppNumber</code> to bulk attach leader contact numbers.</p>
            </div>
          </div>

          <form onSubmit={handleProcessBulkUpload} className="bulk-form">
            <div className="input-group">
              <label>CSV / TSV Contact Lines</label>
              <textarea 
                rows={8}
                placeholder={`SIH26-TM-019, 7200446041\nSIH26-TM-017, 9789124661\nSIH26-TM-003, 8754636382`}
                value={uploadText}
                onChange={(e) => setUploadText(e.target.value)}
              />
            </div>

            {uploadFeedback && (
              <div className="upload-feedback-banner">
                <CheckCircle2 size={16} />
                <span>{uploadFeedback}</span>
              </div>
            )}

            <div className="bulk-actions">
              <button type="submit" className="btn-bulk-save">
                <Save size={15} />
                <span>Process &amp; Update Team Contacts</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          VIEW 3, 4, 5, 6: TABLE VIEWS (Shortlist, Bench, Waitlist, Pending)
          ========================================================================= */}
      {activeTab !== 'analytics' && activeTab !== 'upload' && (
        <div className="admin-table-container">
          {/* Top Search & Filter Bar */}
          <div className="admin-table-controls-strip">
            <div className="admin-search-box">
              <Search size={16} />
              <input 
                type="text" 
                placeholder={`Search ${activeTab} candidates by ID, Team, Leader, Reg No, PS ID, Phone...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && <button onClick={() => setSearchTerm('')}>Clear</button>}
            </div>

            <div className="admin-filter-controls">
              <select 
                className="school-filter-dropdown"
                value={selectedSchoolFilter}
                onChange={(e) => setSelectedSchoolFilter(e.target.value)}
              >
                <option value="all">All Schools / Faculties</option>
                {distinctSchools.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <div className="table-count-tag">
                Showing <strong>{currentTabTeams.length}</strong> teams
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="table-scroll-box">
            <table className="modern-teams-table admin-table">
              <thead>
                <tr>
                  <th>Team ID</th>
                  <th>Team Name</th>
                  <th>Team Leader &amp; Reg No</th>
                  <th>PS ID</th>
                  <th>Tier</th>
                  <th>Form Status</th>
                  <th>Leader Contact Number</th>
                  <th>Form View &amp; Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentTabTeams.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-state-box">
                      No matching candidate records found in {activeTab.toUpperCase()}.
                    </td>
                  </tr>
                ) : (
                  currentTabTeams.map((team) => {
                    const isEditing = editingContactId === team.temp_team_id;
                    const phone = team.effectivePhone;
                    const whatsapp = team.effectiveWhatsapp || phone;
                    const hasNumber = !!phone;
                    const isSameNumber = phone === whatsapp;

                    const whatsappMsg = `Hello ${team.leader_name} (Team ${team.team_name}, ID: ${team.temp_team_id}), please complete your Smart India Hackathon 2026 finalist registration form with your 6-member roster and mentor on our portal.`;
                    const waUrl = whatsapp ? `https://wa.me/91${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMsg)}` : null;

                    return (
                      <tr key={`${activeTab}-${team.temp_team_id}-${team.rank}`} className={`table-row ${team.isRegistered ? 'row-confirmed' : 'row-pending'}`}>
                        <td>
                          <span className="team-id-badge">{team.temp_team_id}</span>
                        </td>

                        <td>
                          <div className="team-name-strong">
                            {team.registrationData?.team_name || team.team_name}
                          </div>
                          <div className="school-name-sub">{team.school}</div>
                        </td>

                        <td>
                          <div className="leader-name-bold">{team.leader_name}</div>
                          <span className="reg-no-mono">{team.reg_no}</span>
                        </td>

                        <td>
                          <span className="ps-id-pill">{team.ps_id}</span>
                        </td>

                        <td>
                          <span className={`status-badge ${team.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {team.status}
                          </span>
                        </td>

                        <td>
                          {team.isRegistered ? (
                            <span className="badge-form-done">
                              <CheckCircle2 size={13} /> Completed
                            </span>
                          ) : (
                            <span className="badge-form-pending">
                              <Clock size={13} /> Pending Fill
                            </span>
                          )}
                        </td>

                        {/* Cleaned Number Cell (No duplicate phone + WA lines) */}
                        <td className="col-contact-edit">
                          {isEditing ? (
                            <div className="inline-contact-edit-box">
                              <input 
                                type="tel" 
                                placeholder="Phone Number"
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                className="inline-input"
                              />
                              <input 
                                type="tel" 
                                placeholder="WhatsApp (Optional)"
                                value={editWhatsapp}
                                onChange={(e) => setEditWhatsapp(e.target.value)}
                                className="inline-input"
                              />
                              <div className="inline-edit-actions">
                                <button className="btn-save-inline" onClick={() => handleSaveContact(team.temp_team_id)}>
                                  <Save size={12} /> Save
                                </button>
                                <button className="btn-cancel-inline" onClick={() => setEditingContactId(null)}>
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="single-number-display-box">
                              {hasNumber ? (
                                <div className="number-pill-clean">
                                  <Phone size={13} className="text-gray" />
                                  <span className="num-text">{phone}</span>
                                  {isSameNumber && <span className="wa-verified-tag" title="Verified for Calling & WhatsApp">WA</span>}
                                </div>
                              ) : (
                                <span className="no-number-text">No number</span>
                              )}

                              <button 
                                className="btn-edit-number-subtle" 
                                onClick={() => startEditContact(team)}
                                title="Edit phone/whatsapp"
                              >
                                <Edit3 size={11} /> Edit
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Form View & Actions */}
                        <td>
                          <div className="admin-actions-cell-group">
                            {/* Per-Team Visibility Eye Toggle */}
                            <button 
                              className={`btn-team-vis-toggle ${team.isHidden ? 'hidden-state' : 'visible-state'}`}
                              onClick={() => onToggleTeamVisibility && onToggleTeamVisibility(team.temp_team_id)}
                              title={team.isHidden ? 'Student View: HIDDEN. Click to make visible to students' : 'Student View: VISIBLE. Click to hide from students'}
                            >
                              {team.isHidden ? <EyeOff size={13} className="text-amber" /> : <Eye size={13} className="text-emerald" />}
                              <span>{team.isHidden ? 'Hidden' : 'Visible'}</span>
                            </button>
                            {/* Edit Team Record */}
                            <button 
                              className="btn-admin-row-action edit"
                              onClick={() => handleOpenEditModal(team)}
                              title="Edit team information and evaluation"
                            >
                              <Edit3 size={13} />
                              <span>Edit</span>
                            </button>

                            {/* Delete Team Record */}
                            <button 
                              className="btn-admin-row-action delete"
                              onClick={() => handleOpenDeleteModal(team)}
                              title="Delete team from finalist roster"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>

                            {/* Registration Action: View Roster (if submitted) or Fill Form (if pending) */}
                            {team.isRegistered ? (
                              <button 
                                className="btn-admin-form-view filled"
                                onClick={() => onViewTeamDetails(team)}
                                title="View & Edit 6-Member Student Roster & Mentor"
                              >
                                <Eye size={13} />
                                <span>Roster</span>
                              </button>
                            ) : (
                              <button 
                                className="btn-admin-form-view pending"
                                onClick={() => onOpenTeamForm(team)}
                                title="Open Registration Form to enter student details"
                              >
                                <FileText size={13} />
                                <span>Fill Form</span>
                              </button>
                            )}

                            {/* WhatsApp Follow-up Button (if pending and has number) */}
                            {!team.isRegistered && waUrl && (
                              <a 
                                href={waUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="btn-wa-ping"
                                title="Send WhatsApp Registration Reminder"
                              >
                                <MessageSquare size={13} />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
          {/* Team Create / Edit Modal */}
      <TeamEditorModal
        isOpen={isEditorModalOpen}
        onClose={() => setIsEditorModalOpen(false)}
        onSave={handleSaveTeamEditor}
        teamToEdit={teamToEdit}
        nextSuggestedRank={teamRecords.length + 1}
        nextSuggestedId={`SIH26-TM-${String(teamRecords.length + 1).padStart(3, '0')}`}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        teamToDelete={teamToDelete}
      />
    </div>
  );
}
