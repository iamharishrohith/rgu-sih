import React, { useState, useMemo } from 'react';
import { 
  Users, CheckCircle2, Clock, Phone, MessageSquare, Download, Upload, Plus, Trash2, EyeOff, 
  Search, Filter, ShieldCheck, UserCheck, Eye, Edit3, Save, X, ExternalLink,
  LogOut, RefreshCw, Layers, BarChart3, PieChart, Award, FileText, Send, Check,
  Lock, Unlock, Hourglass, Zap, Calendar, DoorOpen, DoorClosed, ArrowRight, LogIn,
  RotateCcw, AlertTriangle
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { sanitizeCSVField } from '../crypto_security';
import { OFFICIAL_SCHOOLS, normalizeSchoolName } from '../data/sihMasterData';
import TeamEditorModal from './TeamEditorModal.jsx';
import DeleteConfirmationModal from './DeleteConfirmationModal.jsx';
import BulkWhatsAppSender from './BulkWhatsAppSender.jsx';

export default function AdminDashboard({ 
  allMasterTeams, 
  registrationsMap, 
  teamContactsMap,
  arenaTeamSessions = {},
  arenaActiveOuts = {},
  arenaMovementLogs = [],
  onUpdateArenaSessions,
  onUpdateArenaActiveOuts,
  onUpdateArenaMovementLogs,
  onUpdateContact, 
  onLogout,
  onViewTeamDetails,
  onOpenTeamForm,
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam,
  hiddenTeamIds = [],
  onToggleTeamVisibility,
  portalSettings,
  onOpenTimerModal,
  onUpdatePortalSettings
}) {
  // Navigation Tabs: 'analytics' | 'arena' | 'shortlist' | 'bench' | 'waitlist' | 'pending' | 'upload' | 'whatsapp'
  const [activeTab, setActiveTab] = useState('analytics'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [arenaFilter, setArenaFilter] = useState('all'); // 'all' | 'arena_in' | 'arena_out' | 'not_active'
  const [arenaLogSearch, setArenaLogSearch] = useState('');
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
        school: normalizeSchoolName(reg?.leader_school || reg?.leader_dept || t.school),
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

    // School breakdown initialized with official schools
    const schoolMap = {};
    OFFICIAL_SCHOOLS.forEach(sch => {
      schoolMap[sch] = { total: 0, reg: 0 };
    });
    teamRecords.forEach(t => {
      const sch = normalizeSchoolName(t.school);
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


  // Arena Live Status Analytics
  const arenaStats = useMemo(() => {
    let inCount = 0;
    let outCount = 0;
    let notActiveCount = 0;

    teamRecords.forEach(t => {
      const teamId = t.temp_team_id;
      const activePasses = Object.values(arenaActiveOuts || {}).filter(o => o.team_id === teamId);
      const isOutOnBreak = activePasses.length > 0;
      const session = arenaTeamSessions?.[teamId];

      if (isOutOnBreak) {
        outCount++;
      } else if (session?.is_logged_in && !session?.is_logged_out) {
        inCount++;
      } else if (session?.is_logged_out) {
        outCount++;
      } else {
        notActiveCount++;
      }
    });

    return {
      inCount,
      outCount,
      notActiveCount,
      totalLogs: (arenaMovementLogs || []).length
    };
  }, [teamRecords, arenaTeamSessions, arenaActiveOuts, arenaMovementLogs]);

  // Admin Quick Action: Force Log In Team
  const handleAdminLogIn = (team) => {
    const teamId = team.temp_team_id;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Clear active pass
    const newOuts = { ...arenaActiveOuts };
    Object.keys(newOuts).forEach(k => {
      if (newOuts[k].team_id === teamId) delete newOuts[k];
    });
    if (onUpdateArenaActiveOuts) onUpdateArenaActiveOuts(newOuts);

    const newSessions = {
      ...arenaTeamSessions,
      [teamId]: {
        ...(arenaTeamSessions[teamId] || {}),
        is_logged_in: true,
        is_logged_out: false,
        morning_login_time: arenaTeamSessions[teamId]?.morning_login_time || timeStr,
        morning_timestamp: arenaTeamSessions[teamId]?.morning_timestamp || now.getTime()
      }
    };
    if (onUpdateArenaSessions) onUpdateArenaSessions(newSessions);

    const logEntry = {
      team_id: teamId,
      team_name: team.team_name,
      leader_name: team.leader_name,
      reg_no: team.reg_no,
      venue: 'SIH Arena',
      out_time: '---',
      in_time: timeStr,
      duration_minutes: 0,
      reason_label: 'Admin Check-In (Arena In)',
      member_name: `Full Team (${team.team_name})`,
      custom_note: `Team checked in via Admin Dashboard at ${timeStr}.`,
      status: 'ARENA_IN',
      log_type: 'TEAM_LOGIN'
    };
    if (onUpdateArenaMovementLogs) onUpdateArenaMovementLogs([logEntry, ...(arenaMovementLogs || [])]);
  };

  // Admin Quick Action: Force Log Out Team
  const handleAdminLogOut = (team) => {
    const teamId = team.temp_team_id;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newOuts = { ...arenaActiveOuts };
    Object.keys(newOuts).forEach(k => {
      if (newOuts[k].team_id === teamId) delete newOuts[k];
    });
    if (onUpdateArenaActiveOuts) onUpdateArenaActiveOuts(newOuts);

    const newSessions = {
      ...arenaTeamSessions,
      [teamId]: {
        ...(arenaTeamSessions[teamId] || {}),
        is_logged_out: true,
        evening_logout_time: timeStr,
        evening_timestamp: now.getTime()
      }
    };
    if (onUpdateArenaSessions) onUpdateArenaSessions(newSessions);

    const logEntry = {
      team_id: teamId,
      team_name: team.team_name,
      leader_name: team.leader_name,
      reg_no: team.reg_no,
      venue: 'SIH Arena',
      out_time: timeStr,
      in_time: '---',
      duration_minutes: 0,
      reason_label: 'Admin Departure (Arena Out)',
      member_name: `Team Logout (${team.team_name})`,
      custom_note: `Team logged out via Admin Dashboard at ${timeStr}.`,
      status: 'ARENA_OUT',
      log_type: 'TEAM_LOGOUT'
    };
    if (onUpdateArenaMovementLogs) onUpdateArenaMovementLogs([logEntry, ...(arenaMovementLogs || [])]);
  };

  // Admin Quick Action: Reset Team Session
  const handleAdminReset = (team) => {
    const teamId = team.temp_team_id;
    const newOuts = { ...arenaActiveOuts };
    Object.keys(newOuts).forEach(k => {
      if (newOuts[k].team_id === teamId) delete newOuts[k];
    });
    if (onUpdateArenaActiveOuts) onUpdateArenaActiveOuts(newOuts);

    const newSessions = { ...arenaTeamSessions };
    delete newSessions[teamId];
    if (onUpdateArenaSessions) onUpdateArenaSessions(newSessions);
  };

  // Export Arena Movement Logs CSV
  const handleExportArenaLogsCSV = () => {
    const headers = ['Team ID', 'Team Name', 'Leader Name', 'Reg No', 'Log Type', 'Reason', 'Member', 'Out Time', 'In Time', 'Duration (Mins)', 'Status', 'Note'];
    const rows = (arenaMovementLogs || []).map(l => [
      sanitizeCSVField(l.team_id || ''),
      sanitizeCSVField(l.team_name || ''),
      sanitizeCSVField(l.leader_name || ''),
      sanitizeCSVField(l.reg_no || ''),
      sanitizeCSVField(l.log_type || ''),
      sanitizeCSVField(l.reason_label || l.reason || ''),
      sanitizeCSVField(l.member_name || ''),
      sanitizeCSVField(l.out_time || ''),
      sanitizeCSVField(l.in_time || ''),
      sanitizeCSVField(l.duration_minutes || 0),
      sanitizeCSVField(l.status || ''),
      sanitizeCSVField(l.custom_note || '')
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `SIH2026_Arena_Movement_Logs_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // List of distinct schools for filtering
  const distinctSchools = useMemo(() => {
    return OFFICIAL_SCHOOLS;
  }, []);

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
          <button 
            className={`btn-admin-portal-pill ${portalSettings?.isClosed ? 'locked' : 'active'}`}
            onClick={onOpenTimerModal}
            title="Configure Registration Portal Access & Automatic Closure Timer"
          >
            {portalSettings?.isClosed ? <Lock size={15} className="text-rose" /> : <Unlock size={15} className="text-emerald" />}
            <span>Portal: {portalSettings?.isClosed ? 'Locked / Closed' : 'Open (Active)'}</span>
          </button>
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
          className={`admin-mod-tab ${activeTab === 'arena' ? 'active' : ''}`}
          onClick={() => setActiveTab('arena')}
          style={{ background: activeTab === 'arena' ? '#059669' : 'transparent', color: activeTab === 'arena' ? '#ffffff' : 'inherit' }}
        >
          <DoorOpen size={16} className={activeTab === 'arena' ? 'text-white' : 'text-emerald'} />
          <span>Arena Live Presence ({arenaStats.inCount})</span>
          <span className="mod-tab-sub-count">{arenaStats.outCount} outside</span>
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

        <button 
          className={`admin-mod-tab ${activeTab === 'whatsapp' ? 'active' : ''}`}
          onClick={() => setActiveTab('whatsapp')}
          style={{ background: activeTab === 'whatsapp' ? '#25d366' : 'transparent', color: activeTab === 'whatsapp' ? '#ffffff' : 'inherit' }}
        >
          <MessageSquare size={16} className={activeTab === 'whatsapp' ? 'text-white' : 'text-emerald'} />
          <span>WhatsApp Broadcast</span>
        </button>
      </div>

      {/* =========================================================================
          VIEW 1: MASTER ANALYTICS VIEW
          ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="master-analytics-view-container">
          {/* Institutional Portal Access & Submission Timer Controller Card */}
          <div className={`admin-portal-ctrl-card ${portalSettings?.isClosed ? 'closed' : 'open'}`}>
            <div className="portal-ctrl-left">
              <div className={`portal-ctrl-icon ${portalSettings?.isClosed ? 'bg-rose-soft' : 'bg-emerald-soft'}`}>
                {portalSettings?.isClosed ? <Lock size={22} className="text-rose" /> : <Unlock size={22} className="text-emerald" />}
              </div>
              <div className="portal-ctrl-info">
                <div className="portal-ctrl-header-row">
                  <h4>Candidate Portal Status: {portalSettings?.isClosed ? 'LOCKED / REGISTRATION CLOSED' : 'ACTIVE & ACCEPTING SUBMISSIONS'}</h4>
                  <span className={`portal-live-pill ${portalSettings?.isClosed ? 'pill-closed' : 'pill-open'}`}>
                    {portalSettings?.isClosed ? 'Submissions Disabled' : 'Submissions Active'}
                  </span>
                </div>
                <p className="portal-ctrl-desc">
                  {portalSettings?.isClosed 
                    ? 'Candidates currently see the submission window closed screen. You can reopen the portal and configure an automatic closure timer.'
                    : portalSettings?.closeTimestamp
                      ? `Portal is open and will automatically lock at: ${new Date(portalSettings.closeTimestamp).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })} (${portalSettings.presetLabel || 'Timer Active'})`
                      : 'Portal is open with no automatic deadline timer.'}
                </p>
              </div>
            </div>

            <div className="portal-ctrl-actions">
              {portalSettings?.isClosed ? (
                <button className="btn-portal-reopen-primary" onClick={onOpenTimerModal}>
                  <Unlock size={16} />
                  <span>Reopen Portal &amp; Set Time Limit</span>
                </button>
              ) : (
                <div className="portal-ctrl-btn-group">
                  <button className="btn-portal-adjust-timer" onClick={onOpenTimerModal}>
                    <Clock size={15} />
                    <span>Adjust Deadline Timer</span>
                  </button>
                  <button 
                    className="btn-portal-lock-fast" 
                    onClick={() => onUpdatePortalSettings({
                      isClosed: true,
                      closeTimestamp: null,
                      timerPreset: null,
                      presetLabel: 'Manually Locked by Admin',
                      lastUpdated: new Date().toISOString()
                    })}
                  >
                    <Lock size={14} />
                    <span>Lock Portal Now</span>
                  </button>
                </div>
              )}
            </div>
          </div>

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
          VIEW 1.5: ARENA LIVE PRESENCE & MOVEMENT AUDIT LOGS VIEW
          ========================================================================= */}
      {activeTab === 'arena' && (
        <div className="admin-arena-view-wrapper">
          {/* Top Metric Cards */}
          <div className="admin-analytics-kpi-grid">
            <div className="analytics-kpi-card highlight-green">
              <div className="kpi-icon-badge emerald">
                <DoorOpen size={24} />
              </div>
              <div className="kpi-data-box">
                <span className="kpi-number">{arenaStats.inCount}</span>
                <span className="kpi-title">Present in SIH Arena</span>
                <span className="kpi-subtext">Active Teams inside hackathon venue</span>
              </div>
            </div>

            <div className="analytics-kpi-card highlight-amber">
              <div className="kpi-icon-badge amber">
                <DoorClosed size={24} />
              </div>
              <div className="kpi-data-box">
                <span className="kpi-number">{arenaStats.outCount}</span>
                <span className="kpi-title">Outside on Break / Logout</span>
                <span className="kpi-subtext">Active break passes &amp; departures</span>
              </div>
            </div>

            <div className="analytics-kpi-card">
              <div className="kpi-icon-badge slate">
                <Clock size={24} />
              </div>
              <div className="kpi-data-box">
                <span className="kpi-number">{arenaStats.notActiveCount}</span>
                <span className="kpi-title">Not Checked In Yet</span>
                <span className="kpi-subtext">Awaiting First Team Arrival Login</span>
              </div>
            </div>

            <div className="analytics-kpi-card">
              <div className="kpi-icon-badge indigo">
                <Layers size={24} />
              </div>
              <div className="kpi-data-box">
                <span className="kpi-number">{arenaStats.totalLogs}</span>
                <span className="kpi-title">Live Audit Entries</span>
                <span className="kpi-subtext">Real-time Movement &amp; Check-in Logs</span>
              </div>
            </div>
          </div>

          {/* Stacks Filter Controls */}
          <div className="admin-arena-controls-bar">
            <div className="arena-filter-pills">
              <button 
                className={`arena-pill-btn ${arenaFilter === 'all' ? 'active' : ''}`}
                onClick={() => setArenaFilter('all')}
              >
                <span>All Teams ({teamRecords.length})</span>
              </button>
              <button 
                className={`arena-pill-btn pill-in ${arenaFilter === 'arena_in' ? 'active' : ''}`}
                onClick={() => setArenaFilter('arena_in')}
              >
                <DoorOpen size={14} />
                <span>Inside Arena ({arenaStats.inCount})</span>
              </button>
              <button 
                className={`arena-pill-btn pill-out ${arenaFilter === 'arena_out' ? 'active' : ''}`}
                onClick={() => setArenaFilter('arena_out')}
              >
                <DoorClosed size={14} />
                <span>Outside on Break ({arenaStats.outCount})</span>
              </button>
              <button 
                className={`arena-pill-btn pill-not-active ${arenaFilter === 'not_active' ? 'active' : ''}`}
                onClick={() => setArenaFilter('not_active')}
              >
                <Clock size={14} />
                <span>Not Checked In ({arenaStats.notActiveCount})</span>
              </button>
            </div>

            <div className="arena-search-wrap">
              <Search size={16} className="search-icon-input" />
              <input 
                type="text" 
                placeholder="Search team, leader, roll no, or venue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-search-input"
              />
            </div>
          </div>

          {/* Live Teams Arena Table */}
          <div className="admin-table-card">
            <div className="table-card-header">
              <div className="table-title-group">
                <h3>Live Team Arena Presence Status</h3>
                <span className="table-count-badge">
                  Real-time multi-device synchronization active
                </span>
              </div>
            </div>

            <table className="admin-master-table">
              <thead>
                <tr>
                  <th>Rank &amp; ID</th>
                  <th>Team &amp; Problem Statement</th>
                  <th>Leader &amp; School</th>
                  <th>Arena Status</th>
                  <th>Arrival Check-In</th>
                  <th>Break / Exit Status</th>
                  <th>Admin Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamRecords
                  .filter(t => {
                    const teamId = t.temp_team_id;
                    const activePasses = Object.values(arenaActiveOuts || {}).filter(o => o.team_id === teamId);
                    const isOut = activePasses.length > 0;
                    const session = arenaTeamSessions?.[teamId];
                    const isIn = !isOut && session?.is_logged_in && !session?.is_logged_out;
                    const isLoggedOut = !isOut && session?.is_logged_out;
                    const isNotActive = !session?.is_logged_in && !isOut;

                    if (arenaFilter === 'arena_in' && !isIn) return false;
                    if (arenaFilter === 'arena_out' && (!isOut && !isLoggedOut)) return false;
                    if (arenaFilter === 'not_active' && !isNotActive) return false;

                    if (searchTerm.trim()) {
                      const q = searchTerm.toLowerCase();
                      return (
                        t.temp_team_id.toLowerCase().includes(q) ||
                        t.team_name.toLowerCase().includes(q) ||
                        t.leader_name.toLowerCase().includes(q) ||
                        t.reg_no.toLowerCase().includes(q) ||
                        t.ps_id.toLowerCase().includes(q) ||
                        t.school.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .map(team => {
                    const teamId = team.temp_team_id;
                    const activePasses = Object.values(arenaActiveOuts || {}).filter(o => o.team_id === teamId);
                    const isOut = activePasses.length > 0;
                    const session = arenaTeamSessions?.[teamId];
                    const isIn = !isOut && session?.is_logged_in && !session?.is_logged_out;
                    const isLoggedOut = !isOut && session?.is_logged_out;
                    const isNotActive = !session?.is_logged_in && !isOut;

                    return (
                      <tr key={teamId} className={`table-row ${isIn ? 'row-arena-in' : isOut ? 'row-arena-out' : ''}`}>
                        <td className="col-id">
                          <span className="rank-badge">#{team.rank}</span>
                          <strong className="font-mono text-primary">{teamId}</strong>
                        </td>

                        <td className="col-team">
                          <div className="team-name-strong">{team.team_name}</div>
                          <div className="ps-info-sub">
                            <span className="ps-id-tag">{team.ps_id}</span>
                            {team.ps_title && <span className="ps-title-tag">• {team.ps_title}</span>}
                          </div>
                        </td>

                        <td className="col-leader">
                          <div className="leader-name-bold">{team.leader_name}</div>
                          <div className="school-name-sub">{team.school}</div>
                          <span className="reg-no-mono">{team.reg_no}</span>
                        </td>

                        <td className="col-arena-status">
                          {isIn ? (
                            <span className="status-badge status-present">
                              <DoorOpen size={13} /> Present in Arena
                            </span>
                          ) : isOut ? (
                            <span className="status-badge status-out">
                              <DoorClosed size={13} /> On Break: {activePasses[0]?.reason_label || 'Outside'}
                            </span>
                          ) : isLoggedOut ? (
                            <span className="status-badge status-out">
                              <LogOut size={13} /> Logged Out
                            </span>
                          ) : (
                            <span className="status-badge status-not-active">
                              <Clock size={13} /> Not Checked In
                            </span>
                          )}
                        </td>

                        <td className="col-time">
                          {session?.morning_login_time ? (
                            <span className="time-badge in">
                              <CheckCircle2 size={12} className="text-emerald" />
                              {session.morning_login_time}
                            </span>
                          ) : (
                            <span className="text-muted">Awaiting arrival</span>
                          )}
                        </td>

                        <td className="col-break">
                          {isOut ? (
                            <div className="break-info-pill">
                              <span>Due: <strong>{activePasses[0]?.expected_return_time}</strong></span>
                            </div>
                          ) : (
                            <span className="text-muted">---</span>
                          )}
                        </td>

                        <td className="col-actions">
                          <div className="admin-actions-cell">
                            {!isIn ? (
                              <button 
                                className="btn-admin-action-login" 
                                onClick={() => handleAdminLogIn(team)}
                                title="Force Mark Team as Present in Arena"
                              >
                                <LogIn size={13} />
                                <span>Check-In</span>
                              </button>
                            ) : (
                              <button 
                                className="btn-admin-action-logout" 
                                onClick={() => handleAdminLogOut(team)}
                                title="Force Mark Team as Logged Out"
                              >
                                <LogOut size={13} />
                                <span>Check-Out</span>
                              </button>
                            )}

                            {(isIn || isOut || session?.is_logged_in) && (
                              <button 
                                className="btn-admin-action-reset" 
                                onClick={() => handleAdminReset(team)}
                                title="Reset Team back to Not Checked In"
                              >
                                <RotateCcw size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Real-Time Movement Logs Table */}
          <div className="admin-table-card" style={{ marginTop: '24px' }}>
            <div className="table-card-header">
              <div className="table-title-group">
                <h3>Live Movement &amp; Attendance Audit Log</h3>
                <span className="table-count-badge">{(arenaMovementLogs || []).length} Recorded Entries</span>
              </div>
              <div className="table-actions-right">
                <input 
                  type="text" 
                  placeholder="Filter movement logs..."
                  value={arenaLogSearch}
                  onChange={(e) => setArenaLogSearch(e.target.value)}
                  className="admin-search-input-small"
                />
                <button className="btn-export-csv" onClick={handleExportArenaLogsCSV}>
                  <Download size={14} />
                  <span>Export Logs (CSV)</span>
                </button>
                <button 
                  className="btn-admin-action-reset" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px' }}
                  onClick={() => {
                    if (window.confirm('Clear all movement and check-in audit logs?')) {
                      if (onUpdateArenaMovementLogs) onUpdateArenaMovementLogs([]);
                    }
                  }}
                  title="Clear all recorded movement audit logs"
                >
                  <RotateCcw size={13} />
                  <span>Reset Logs</span>
                </button>
              </div>
            </div>

            <table className="admin-master-table">
              <thead>
                <tr>
                  <th>Timestamp / Time</th>
                  <th>Team &amp; ID</th>
                  <th>Candidate / Scope</th>
                  <th>Activity / Reason</th>
                  <th>Out Time</th>
                  <th>In Time</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(arenaMovementLogs || [])
                  .filter(l => {
                    if (!arenaLogSearch.trim()) return true;
                    const q = arenaLogSearch.toLowerCase();
                    return (
                      (l.team_id || '').toLowerCase().includes(q) ||
                      (l.team_name || '').toLowerCase().includes(q) ||
                      (l.leader_name || '').toLowerCase().includes(q) ||
                      (l.member_name || '').toLowerCase().includes(q) ||
                      (l.reason_label || '').toLowerCase().includes(q)
                    );
                  })
                  .slice(0, 100)
                  .map((log, idx) => (
                    <tr key={idx} className="table-row">
                      <td className="col-time font-mono">{log.in_time !== '---' ? log.in_time : log.out_time}</td>
                      <td className="col-team">
                        <strong>{log.team_name}</strong>
                        <span className="font-mono text-muted" style={{ marginLeft: '6px', fontSize: '0.8rem' }}>({log.team_id})</span>
                      </td>
                      <td>{log.member_name}</td>
                      <td>
                        <span className="badge-reason-tag">{log.reason_label || log.reason || log.log_type}</span>
                      </td>
                      <td className="font-mono">{log.out_time}</td>
                      <td className="font-mono">{log.in_time}</td>
                      <td>{log.duration_minutes > 0 ? `${log.duration_minutes} mins` : '---'}</td>
                      <td>
                        <span className={`status-badge ${log.status === 'ARENA_IN' ? 'status-present' : 'status-out'}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                {(arenaMovementLogs || []).length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      No movement or check-in events recorded yet. Events from student QR scans and portal actions will appear here live.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
          VIEW 2.5: BULK WHATSAPP SENDER VIEW
          ========================================================================= */}
      {activeTab === 'whatsapp' && (
        <BulkWhatsAppSender
          teamRecords={teamRecords}
          onUpdateContact={onUpdateContact}
        />
      )}

      {/* =========================================================================
          VIEW 3, 4, 5, 6: TABLE VIEWS (Shortlist, Bench, Waitlist, Pending)
          ========================================================================= */}
      {activeTab !== 'analytics' && activeTab !== 'upload' && activeTab !== 'whatsapp' && (
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
