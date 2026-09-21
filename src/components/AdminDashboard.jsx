import React, { useState, useMemo } from 'react';
import { 
  Users, CheckCircle2, Clock, Phone, MessageSquare, Download, Upload, Plus, Trash2, EyeOff, 
  Search, Filter, ShieldCheck, UserCheck, Eye, Edit3, Save, X, ExternalLink,
  LogOut, RefreshCw, Layers, BarChart3, PieChart, Award, FileText, Send, Check,
  Lock, Unlock, Hourglass, Zap, Calendar, DoorOpen, DoorClosed, ArrowRight, LogIn,
  RotateCcw, AlertTriangle, Radio
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
  onUpdatePortalSettings,
  onOpenEvaluationQueue,
  onOpenAdminGateway,
  evaluationLedger = []
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

  // Evaluation Map for Completed Jury Presentations
  const evaluatedMap = useMemo(() => {
    const map = {};
    (evaluationLedger || []).forEach(l => {
      if (!map[l.teamId]) map[l.teamId] = [];
      map[l.teamId].push(l);
    });
    return map;
  }, [evaluationLedger]);

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

      const evals = evaluatedMap[t.temp_team_id] || [];
      const isEvaluated = evals.length > 0;

      return {
        ...t,
        team_name: reg?.team_name || t.team_name,
        ps_id: reg?.sih_ps_id || reg?.ps_id || t.ps_id,
        ps_title: reg?.ps_title || t.ps_title,
        leader_name: reg?.leader_name || t.leader_name,
        reg_no: reg?.leader_reg_no || reg?.reg_no || t.reg_no,
        school: normalizeSchoolName(reg?.leader_school || reg?.leader_dept || t.school),
        isRegistered,
        isEvaluated,
        evaluations: evals,
        registrationData: reg,
        contactData: contact,
        effectivePhone: phone,
        effectiveWhatsapp: whatsapp,
        isHidden
      };
    });
  }, [allMasterTeams, registrationsMap, teamContactsMap, hiddenTeamIds, evaluatedMap]);

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
    const fromRecords = Array.from(new Set(teamRecords.map(t => t.school).filter(Boolean)));
    const combined = Array.from(new Set([...OFFICIAL_SCHOOLS, ...fromRecords]));
    return combined;
  }, [teamRecords]);

  // Filtered List based on active tab & search
  const currentTabTeams = useMemo(() => {
    let list = teamRecords;
    if (activeTab === 'shortlist') list = teamRecords.filter(t => t.status === 'Shortlist');
    else if (activeTab === 'bench') list = teamRecords.filter(t => t.status === 'Bench');
    else if (activeTab === 'waitlist') list = teamRecords.filter(t => t.status === 'Waitlist');
    else if (activeTab === 'filled') list = teamRecords.filter(t => t.isRegistered);
    else if (activeTab === 'pending') list = teamRecords.filter(t => !t.isRegistered);

    if (selectedSchoolFilter && selectedSchoolFilter !== 'all') {
      const target = selectedSchoolFilter.toLowerCase();
      list = list.filter(t => (t.school || '').toLowerCase() === target);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(t => 
        (t.temp_team_id || '').toLowerCase().includes(q) ||
        (t.team_name || '').toLowerCase().includes(q) ||
        (t.leader_name || '').toLowerCase().includes(q) ||
        (t.reg_no || '').toLowerCase().includes(q) ||
        (t.ps_id || '').toLowerCase().includes(q) ||
        (t.ps_title || '').toLowerCase().includes(q) ||
        (t.school || '').toLowerCase().includes(q) ||
        (t.effectivePhone || '').includes(q) ||
        (t.effectiveWhatsapp || '').includes(q)
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

  // 1. Export Filled / Submitted Registration Forms (with full 6-member roster & mentor)
  const handleExportFilledCSV = (schoolOverride = selectedSchoolFilter) => {
    const targetSchool = schoolOverride || 'all';
    const list = teamRecords.filter(t => t.isRegistered && (targetSchool === 'all' || (t.school || '').toLowerCase() === targetSchool.toLowerCase()));
    
    const headers = [
      'Temp Team ID', 'Team Name', 'Tier Status', 'SIH PS ID', 'PS Title', 'School / Faculty', 'Department',
      'Leader Name', 'Leader Reg No', 'Leader Gender', 'Leader Personal Email', 'Leader College Email', 'Leader Phone', 'Leader WhatsApp', 'Leader Year', 'Leader Dept',
      'Member 2 Name', 'Member 2 Reg No', 'Member 2 Gender', 'Member 2 Dept', 'Member 2 Year', 'Member 2 Email', 'Member 2 Phone', 'Member 2 WhatsApp',
      'Member 3 Name', 'Member 3 Reg No', 'Member 3 Gender', 'Member 3 Dept', 'Member 3 Year', 'Member 3 Email', 'Member 3 Phone', 'Member 3 WhatsApp',
      'Member 4 Name', 'Member 4 Reg No', 'Member 4 Gender', 'Member 4 Dept', 'Member 4 Year', 'Member 4 Email', 'Member 4 Phone', 'Member 4 WhatsApp',
      'Member 5 Name', 'Member 5 Reg No', 'Member 5 Gender', 'Member 5 Dept', 'Member 5 Year', 'Member 5 Email', 'Member 5 Phone', 'Member 5 WhatsApp',
      'Member 6 Name', 'Member 6 Reg No', 'Member 6 Gender', 'Member 6 Dept', 'Member 6 Year', 'Member 6 Email', 'Member 6 Phone', 'Member 6 WhatsApp',
      'Mentor Name', 'Mentor Designation', 'Mentor Email', 'Mentor Phone',
      'Status', 'Submission Timestamp'
    ];

    const rows = list.map(t => {
      const reg = t.registrationData || {};
      const m = reg.members || [];
      return [
        sanitizeCSVField(t.temp_team_id),
        sanitizeCSVField(reg.team_name || t.team_name),
        sanitizeCSVField(t.status),
        sanitizeCSVField(reg.sih_ps_id || t.ps_id),
        sanitizeCSVField(reg.ps_title || t.ps_title || ''),
        sanitizeCSVField(reg.leader_school || t.school),
        sanitizeCSVField(reg.leader_dept || ''),
        sanitizeCSVField(reg.leader_name || t.leader_name),
        sanitizeCSVField(reg.leader_reg_no || t.reg_no),
        sanitizeCSVField(reg.leader_gender || 'Male'),
        sanitizeCSVField(reg.leader_personal_email || ''),
        sanitizeCSVField(reg.leader_college_email || ''),
        sanitizeCSVField(reg.leader_phone || t.effectivePhone),
        sanitizeCSVField(reg.leader_whatsapp || t.effectiveWhatsapp),
        sanitizeCSVField(reg.leader_year || ''),
        sanitizeCSVField(reg.leader_dept || ''),
        sanitizeCSVField(m[0]?.name || ''), sanitizeCSVField(m[0]?.reg_no || ''), sanitizeCSVField(m[0]?.gender || 'Male'), sanitizeCSVField(m[0]?.dept || ''), sanitizeCSVField(m[0]?.year || ''), sanitizeCSVField(m[0]?.personal_email || ''), sanitizeCSVField(m[0]?.phone || ''), sanitizeCSVField(m[0]?.whatsapp || ''),
        sanitizeCSVField(m[1]?.name || ''), sanitizeCSVField(m[1]?.reg_no || ''), sanitizeCSVField(m[1]?.gender || 'Male'), sanitizeCSVField(m[1]?.dept || ''), sanitizeCSVField(m[1]?.year || ''), sanitizeCSVField(m[1]?.personal_email || ''), sanitizeCSVField(m[1]?.phone || ''), sanitizeCSVField(m[1]?.whatsapp || ''),
        sanitizeCSVField(m[2]?.name || ''), sanitizeCSVField(m[2]?.reg_no || ''), sanitizeCSVField(m[2]?.gender || 'Male'), sanitizeCSVField(m[2]?.dept || ''), sanitizeCSVField(m[2]?.year || ''), sanitizeCSVField(m[2]?.personal_email || ''), sanitizeCSVField(m[2]?.phone || ''), sanitizeCSVField(m[2]?.whatsapp || ''),
        sanitizeCSVField(m[3]?.name || ''), sanitizeCSVField(m[3]?.reg_no || ''), sanitizeCSVField(m[3]?.gender || 'Male'), sanitizeCSVField(m[3]?.dept || ''), sanitizeCSVField(m[3]?.year || ''), sanitizeCSVField(m[3]?.personal_email || ''), sanitizeCSVField(m[3]?.phone || ''), sanitizeCSVField(m[3]?.whatsapp || ''),
        sanitizeCSVField(m[4]?.name || ''), sanitizeCSVField(m[4]?.reg_no || ''), sanitizeCSVField(m[4]?.gender || 'Male'), sanitizeCSVField(m[4]?.dept || ''), sanitizeCSVField(m[4]?.year || ''), sanitizeCSVField(m[4]?.personal_email || ''), sanitizeCSVField(m[4]?.phone || ''), sanitizeCSVField(m[4]?.whatsapp || ''),
        sanitizeCSVField(reg.mentor_name || ''),
        sanitizeCSVField(reg.mentor_designation || ''),
        sanitizeCSVField(reg.mentor_email || ''),
        sanitizeCSVField(reg.mentor_phone || ''),
        sanitizeCSVField('SUBMITTED_AND_VERIFIED'),
        sanitizeCSVField(reg.updated_at || new Date().toISOString())
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    const schoolSlug = targetSchool !== 'all' ? `_${targetSchool.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    link.setAttribute('download', `SIH2026_Filled_Forms${schoolSlug}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Export Non-Filled / Pending Teams Dataset
  const handleExportPendingCSV = (schoolOverride = selectedSchoolFilter) => {
    const targetSchool = schoolOverride || 'all';
    const list = teamRecords.filter(t => !t.isRegistered && (targetSchool === 'all' || (t.school || '').toLowerCase() === targetSchool.toLowerCase()));

    const headers = [
      'Temp Team ID', 'Team Name', 'Tier Status', 'PS ID', 'PS Title', 'School / Faculty',
      'Team Leader Name', 'Leader Reg No', 'Leader Phone', 'Leader WhatsApp',
      'Form Status', 'WhatsApp Follow-Up Link'
    ];

    const rows = list.map(t => {
      const phone = t.effectivePhone;
      const whatsapp = t.effectiveWhatsapp || phone;
      const whatsappMsg = `Hello ${t.leader_name} (Team ${t.team_name}, ID: ${t.temp_team_id}), please complete your Smart India Hackathon 2026 finalist registration form on our portal.`;
      const waUrl = whatsapp ? `https://wa.me/91${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMsg)}` : '';

      return [
        sanitizeCSVField(t.temp_team_id),
        sanitizeCSVField(t.team_name),
        sanitizeCSVField(t.status),
        sanitizeCSVField(t.ps_id),
        sanitizeCSVField(t.ps_title || ''),
        sanitizeCSVField(t.school),
        sanitizeCSVField(t.leader_name),
        sanitizeCSVField(t.reg_no),
        sanitizeCSVField(phone),
        sanitizeCSVField(whatsapp),
        sanitizeCSVField('PENDING_FILL'),
        sanitizeCSVField(waUrl)
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    const schoolSlug = targetSchool !== 'all' ? `_${targetSchool.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    link.setAttribute('download', `SIH2026_NonFilled_Pending_Teams${schoolSlug}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Export Current Filtered Table View
  const handleExportCurrentViewCSV = () => {
    const headers = [
      'Temp Team ID', 'Team Name', 'Tier Status', 'PS ID', 'PS Title', 'School / Faculty',
      'Team Leader Name', 'Leader Reg No', 'Leader Phone', 'Leader WhatsApp',
      'Form Status', 'Registered Members'
    ];

    const rows = currentTabTeams.map(t => {
      return [
        sanitizeCSVField(t.temp_team_id),
        sanitizeCSVField(t.registrationData?.team_name || t.team_name),
        sanitizeCSVField(t.status),
        sanitizeCSVField(t.ps_id),
        sanitizeCSVField(t.registrationData?.ps_title || t.ps_title || ''),
        sanitizeCSVField(t.school),
        sanitizeCSVField(t.leader_name),
        sanitizeCSVField(t.reg_no),
        sanitizeCSVField(t.effectivePhone),
        sanitizeCSVField(t.effectiveWhatsapp),
        sanitizeCSVField(t.isRegistered ? 'COMPLETED' : 'PENDING'),
        sanitizeCSVField(t.isRegistered ? '6 Members (Verified)' : '0 (Pending)')
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    const schoolSlug = selectedSchoolFilter !== 'all' ? `_${selectedSchoolFilter.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    link.setAttribute('download', `SIH2026_${activeTab.toUpperCase()}_Export${schoolSlug}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. Export Presented / Evaluated Teams Dataset
  const handleExportEvaluatedTeamsCSV = (schoolOverride = selectedSchoolFilter) => {
    const targetSchool = schoolOverride || 'all';
    const list = teamRecords.filter(t => t.isEvaluated && (targetSchool === 'all' || (t.school || '').toLowerCase() === targetSchool.toLowerCase()));

    const headers = [
      'Rank', 'Temp Team ID', 'Team Name', 'Tier Status', 'School / Faculty', 'PS ID', 'PS Title',
      'Leader Name', 'Leader Reg No', 'Leader Phone', 'Leader WhatsApp',
      'Average Score (/50)', 'Score %', 'Juries Evaluated Count', 'Evaluators',
      'Status', 'Last Evaluation Time', 'Feedback'
    ];

    const rows = list.map((t, idx) => {
      const evals = t.evaluations || [];
      const count = evals.length || 1;
      const totalSum = evals.reduce((sum, e) => sum + (e.totalScore || 0), 0);
      const avgScore = count > 0 ? (totalSum / count).toFixed(1) : (t.total_score_50 || 0);
      const avgPct = Math.round((parseFloat(avgScore) / 50) * 100);
      const evaluators = evals.map(e => e.evaluatorName || e.juries?.[0]?.name || 'Jury').join('; ');
      const feedbacks = evals.map(e => e.feedback).filter(Boolean).join(' | ');
      const lastTime = evals[evals.length - 1]?.evaluatedAtStr || '';

      return [
        idx + 1,
        sanitizeCSVField(t.temp_team_id),
        sanitizeCSVField(t.team_name),
        sanitizeCSVField(t.status),
        sanitizeCSVField(t.school),
        sanitizeCSVField(t.ps_id),
        sanitizeCSVField(t.ps_title || ''),
        sanitizeCSVField(t.leader_name),
        sanitizeCSVField(t.reg_no),
        sanitizeCSVField(t.effectivePhone),
        sanitizeCSVField(t.effectiveWhatsapp),
        avgScore,
        `${avgPct}%`,
        count,
        sanitizeCSVField(evaluators),
        sanitizeCSVField('PRESENTED_AND_EVALUATED'),
        sanitizeCSVField(lastTime),
        sanitizeCSVField(feedbacks)
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    const schoolSlug = targetSchool !== 'all' ? `_${targetSchool.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    link.setAttribute('download', `SIH2026_Presented_Evaluated_Teams${schoolSlug}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 5. Export Master All Roster Dataset to CSV
  const handleExportCSV = () => {
    handleExportFilledCSV('all');
  };

  // Arena Reveal State for 09:45 AM Gate
  const [isArenaRevealed, setIsArenaRevealed] = useState(() => {
    try {
      return localStorage.getItem('sih_arena_panel_revealed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleArenaReveal = () => {
    const nextState = !isArenaRevealed;
    setIsArenaRevealed(nextState);
    try {
      localStorage.setItem('sih_arena_panel_revealed', nextState ? 'true' : 'false');
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  };

  return (
    <div className="admin-dashboard-container">
      {/* Top Header Banner */}
      <div className="admin-header-banner">
        <div className="admin-header-left">
          <div className="admin-logo-pill">
            <span className="live-dot-green"></span>
            <span>SIH 2026 INTERNAL CONTROL</span>
          </div>
          <div className="admin-title-wrap">
            <h1>Administrative Command Desk</h1>
            <p>110 Finalized Teams • 80 Unique Problem Statements • Real-Time Roster Manager</p>
          </div>
        </div>

        <div className="admin-top-actions">
          {/* Live Arena Screen Reveal Toggle */}
          <button 
            className={`btn-admin-portal-pill ${isArenaRevealed ? 'revealed' : 'locked'}`}
            style={{
              background: isArenaRevealed ? '#ecfdf5' : '#eff6ff',
              color: isArenaRevealed ? '#059669' : '#1d4ed8',
              borderColor: isArenaRevealed ? '#a7f3d0' : '#bfdbfe'
            }}
            onClick={handleToggleArenaReveal}
            title={isArenaRevealed ? 'Live Arena Screen is REVEALED. Click to Re-lock to 09:45 AM countdown.' : 'Live Arena Screen is LOCKED until 09:45 AM. Click to Force Reveal early.'}
          >
            <Radio size={15} className={isArenaRevealed ? 'text-emerald animate-pulse' : 'text-primary'} />
            <span>Arena Screen: {isArenaRevealed ? 'Revealed (Live)' : 'Locked (Reveal Now)'}</span>
          </button>

          <button 
            className={`btn-admin-portal-pill ${portalSettings?.isClosed ? 'locked' : 'active'}`}
            onClick={onOpenTimerModal}
            title="Configure Registration Portal Access & Automatic Closure Timer"
          >
            {portalSettings?.isClosed ? <Lock size={15} className="text-rose" /> : <Unlock size={15} className="text-emerald" />}
            <span>Portal: {portalSettings?.isClosed ? 'Locked / Closed' : 'Open (Active)'}</span>
          </button>
          <button 
            className="btn-admin-portal-pill"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none' }}
            onClick={onOpenEvaluationQueue}
            title="Launch Digital Evaluation Queue & Live Multi-Panel Timing"
          >
            <Clock size={15} />
            <span>Evaluation Queue</span>
          </button>
          {onOpenAdminGateway && (
            <button 
              className="btn-admin-portal-pill"
              onClick={onOpenAdminGateway}
              title="Open Master Admin Gateway (Ctrl+Shift+A)"
            >
              <Layers size={15} />
              <span>Admin Gateway</span>
            </button>
          )}
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
          className={`admin-mod-tab ${activeTab === 'filled' ? 'active' : ''}`}
          onClick={() => setActiveTab('filled')}
          style={{ background: activeTab === 'filled' ? '#059669' : 'transparent', color: activeTab === 'filled' ? '#ffffff' : 'inherit' }}
        >
          <CheckCircle2 size={16} className={activeTab === 'filled' ? 'text-white' : 'text-emerald'} />
          <span>Filled Forms ({stats.registered})</span>
          <span className="mod-tab-sub-count">{stats.completionPct}%</span>
        </button>

        <button 
          className={`admin-mod-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Clock size={16} className="text-rose" />
          <span>Pending ({stats.pending})</span>
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
            <div className="school-card-header-flex">
              <div>
                <h3 className="section-card-title">School &amp; Faculty Distribution Breakdown</h3>
                <p className="section-card-subtitle">Live registration completion rates across all academic departments</p>
              </div>
              <div className="school-header-actions">
                <button 
                  className="btn-export-evaluated-pill"
                  onClick={() => handleExportEvaluatedTeamsCSV('all')}
                  title="Export all teams presented and evaluated by jury across all schools"
                >
                  <Download size={13} />
                  <span>Export Evaluated Teams ({teamRecords.filter(t => t.isEvaluated).length})</span>
                </button>
                <button 
                  className="btn-export-filled-pill"
                  onClick={() => handleExportFilledCSV('all')}
                  title="Export all completed registration forms across all schools"
                >
                  <Download size={13} />
                  <span>Export All Filled Forms ({stats.registered})</span>
                </button>
                <button 
                  className="btn-export-pending-pill"
                  onClick={() => handleExportPendingCSV('all')}
                  title="Export all pending non-filled teams across all schools"
                >
                  <Download size={13} />
                  <span>Export All Pending Teams ({stats.pending})</span>
                </button>
              </div>
            </div>

            <div className="school-bars-list">
              {Object.entries(stats.schoolMap).map(([schoolName, data]) => {
                const pct = data.total > 0 ? Math.round((data.reg / data.total) * 100) : 0;
                const pendingCount = data.total - data.reg;
                return (
                  <div key={schoolName} className="school-bar-row">
                    <div className="school-bar-top-line">
                      <div className="school-bar-title-group">
                        <span className="school-bar-name">{schoolName}</span>
                        <div className="school-pill-tags">
                          <span className="school-tag-stat total">{data.total} Total</span>
                          <span className="school-tag-stat filled">{data.reg} Filled</span>
                          {pendingCount > 0 && (
                            <span className="school-tag-stat pending">{pendingCount} Pending</span>
                          )}
                        </div>
                      </div>

                      <div className="school-row-action-btns">
                        <button 
                          className="btn-school-jump-filter filled"
                          onClick={() => {
                            setSelectedSchoolFilter(schoolName);
                            setActiveTab('filled');
                          }}
                          title={`View ${data.reg} filled forms from ${schoolName}`}
                        >
                          <CheckCircle2 size={12} />
                          <span>View Filled ({data.reg})</span>
                        </button>

                        {pendingCount > 0 && (
                          <button 
                            className="btn-school-jump-filter pending"
                            onClick={() => {
                              setSelectedSchoolFilter(schoolName);
                              setActiveTab('pending');
                            }}
                            title={`View ${pendingCount} pending teams from ${schoolName}`}
                          >
                            <Clock size={12} />
                            <span>View Pending ({pendingCount})</span>
                          </button>
                        )}

                        <button 
                          className="btn-school-export-csv"
                          onClick={() => handleExportFilledCSV(schoolName)}
                          title={`Export ${schoolName} filled forms to CSV`}
                        >
                          <Download size={12} />
                          <span>CSV</span>
                        </button>
                      </div>
                    </div>

                    <div className="progress-bar-wrap">
                      <div 
                        className={`progress-bar-fill ${pct === 100 ? 'emerald' : pct >= 50 ? 'indigo' : 'amber'}`} 
                        style={{ width: `${pct}%` }}
                      ></div>
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
                          <div className="col-id-flex">
                            <span className="rank-badge">#{team.rank}</span>
                            <strong className="font-mono text-primary">{teamId}</strong>
                          </div>
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
          VIEW 3, 4, 5, 6: TABLE VIEWS (Shortlist, Bench, Waitlist, Filled, Pending)
          ========================================================================= */}
      {activeTab !== 'analytics' && activeTab !== 'arena' && activeTab !== 'upload' && activeTab !== 'whatsapp' && (
        <div className="admin-table-container">
          {/* Top Search & Filter Bar */}
          <div className="admin-table-controls-strip">
            <div className="admin-search-box">
              <Search size={16} />
              <input 
                type="text" 
                placeholder={`Search ${activeTab.toUpperCase()} candidates by ID, Team, Leader, Reg No, PS ID, Phone...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && <button onClick={() => setSearchTerm('')}>Clear</button>}
            </div>

            <div className="admin-filter-controls">
              <div className="school-filter-wrap">
                <Filter size={14} className="school-filter-icon" />
                <select 
                  className="school-filter-dropdown"
                  value={selectedSchoolFilter}
                  onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                  title="Filter teams by School / Faculty"
                >
                  <option value="all">All Schools / Faculties ({teamRecords.length} Teams)</option>
                  {distinctSchools.map(s => {
                    const schData = stats.schoolMap[s] || { total: 0, reg: 0 };
                    return (
                      <option key={s} value={s}>
                        {s} ({schData.total} teams • {schData.reg} filled)
                      </option>
                    );
                  })}
                </select>
              </div>

              {(selectedSchoolFilter !== 'all' || searchTerm) && (
                <button 
                  className="btn-reset-filters-pill" 
                  onClick={() => {
                    setSelectedSchoolFilter('all');
                    setSearchTerm('');
                  }}
                  title="Reset all active filters"
                >
                  <RotateCcw size={12} />
                  <span>Reset Filter</span>
                </button>
              )}

              {/* Action Export Buttons */}
              <div className="admin-export-btn-group">
                <button 
                  className="btn-export-evaluated-pill"
                  onClick={() => handleExportEvaluatedTeamsCSV(selectedSchoolFilter)}
                  title={`Export ${selectedSchoolFilter !== 'all' ? selectedSchoolFilter : 'All'} Presented & Evaluated Teams to CSV`}
                >
                  <Download size={13} />
                  <span>Export Evaluated ({teamRecords.filter(t => t.isEvaluated && (selectedSchoolFilter === 'all' || (t.school || '').toLowerCase() === selectedSchoolFilter.toLowerCase())).length})</span>
                </button>

                <button 
                  className="btn-export-filled-pill"
                  onClick={() => handleExportFilledCSV(selectedSchoolFilter)}
                  title={`Export ${selectedSchoolFilter !== 'all' ? selectedSchoolFilter : 'All'} Filled Forms to CSV`}
                >
                  <Download size={13} />
                  <span>Export Filled ({teamRecords.filter(t => t.isRegistered && (selectedSchoolFilter === 'all' || (t.school || '').toLowerCase() === selectedSchoolFilter.toLowerCase())).length})</span>
                </button>

                <button 
                  className="btn-export-pending-pill"
                  onClick={() => handleExportPendingCSV(selectedSchoolFilter)}
                  title={`Export ${selectedSchoolFilter !== 'all' ? selectedSchoolFilter : 'All'} Non-Filled / Pending Teams to CSV`}
                >
                  <Download size={13} />
                  <span>Export Pending ({teamRecords.filter(t => !t.isRegistered && (selectedSchoolFilter === 'all' || (t.school || '').toLowerCase() === selectedSchoolFilter.toLowerCase())).length})</span>
                </button>

                <button 
                  className="btn-export-view-pill"
                  onClick={handleExportCurrentViewCSV}
                  title="Export currently displayed table rows to CSV"
                >
                  <Download size={13} />
                  <span>Export View ({currentTabTeams.length})</span>
                </button>
              </div>

              <div className="table-count-tag">
                Showing <strong>{currentTabTeams.length}</strong> {selectedSchoolFilter !== 'all' ? `(${selectedSchoolFilter})` : 'teams'}
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
