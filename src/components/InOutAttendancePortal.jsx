import React, { useState, useEffect, useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  DoorOpen, DoorClosed, QrCode, Camera, Search, Clock, AlertTriangle, 
  CheckCircle2, XCircle, Utensils, Coffee, Bath, Wrench, Users, HeartPulse, 
  AlertCircle, Download, ArrowLeft, ArrowRight, UserCheck, ShieldCheck, 
  RotateCcw, Volume2, VolumeX, Sparkles, Filter, ExternalLink, Phone,
  User, Check, Flame, Printer, RefreshCw, Smartphone, KeyRound, Copy, Database,
  Lock, Unlock, ShieldAlert, Settings, Calendar, Bell, Plus, Trash2, Edit3,
  Sun, Moon, UserX, LogIn, LogOut, CheckSquare, Square, LayoutDashboard
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { normalizeSchoolName } from '../data/sihMasterData';
import LivePixelDigitalClock from './LivePixelDigitalClock.jsx';

const COMMON_BREAK_WINDOWS = [
  { id: 'morning_tea', label: 'Morning Tea / Refreshment Break', startHour: 10, startMin: 50, endHour: 11, endMin: 10, durationMins: 20, timeStr: '10:50 AM - 11:10 AM', icon: Coffee },
  { id: 'lunch', label: 'Grand Lunch Break (Dining Hall)', startHour: 12, startMin: 30, endHour: 13, endMin: 30, durationMins: 60, timeStr: '12:30 PM - 01:30 PM', icon: Utensils },
  { id: 'evening_tea', label: 'Evening Tea / High-Tea Break', startHour: 14, startMin: 50, endHour: 15, endMin: 10, durationMins: 20, timeStr: '02:50 PM - 03:10 PM', icon: Coffee },
];

const MOVEMENT_REASONS = [
  { id: 'lunch', label: 'Lunch Break (12:30 PM - 01:30 PM)', icon: Utensils, defaultMins: 60, color: '#ea580c', bg: '#fff7ed' },
  { id: 'tea', label: 'Tea / Refreshment Break (10:50 AM / 02:50 PM)', icon: Coffee, defaultMins: 20, color: '#d97706', bg: '#fffbeb' },
  { id: 'restroom', label: 'Restroom / Washroom', icon: Bath, defaultMins: 10, color: '#0284c7', bg: '#f0f9ff' },
  { id: 'lab', label: 'Hardware Lab / Components', icon: Wrench, defaultMins: 30, color: '#7c3aed', bg: '#f5f3ff' },
  { id: 'mentor', label: 'Mentor / Jury Consultation', icon: Users, defaultMins: 25, color: '#059669', bg: '#ecfdf5' },
  { id: 'medical', label: 'Medical / First Aid', icon: HeartPulse, defaultMins: 30, color: '#dc2626', bg: '#fef2f2' },
  { id: 'other', label: 'Other Official Reason (Custom Note)', icon: AlertCircle, defaultMins: 20, color: '#475569', bg: '#f8fafc' },
];

const MASTER_ADMIN_PASSCODE = 'SIH2026ADMIN';

export default function InOutAttendancePortal({ 
  allTeams = [], 
  registrationsMap = {},
  onBackToMain
}) {
  // Mode: If opened via QR code (?action=out or ?action=in), show dedicated minimal mobile form box!
  const [viewMode, setViewMode] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');
      const hash = (window.location.hash || '').toLowerCase();
      if (action === 'out' || hash.includes('action=out')) return 'candidate_out';
      if (action === 'in' || hash.includes('action=in')) return 'candidate_in';
      return 'desk';
    } catch {
      return 'desk';
    }
  });

  // Main Desk Tabs
  // 'morning_login' | 'scanner' | 'active_out' | 'evening_logout' | 'team_passes' | 'log' | 'master_admin'
  const [activeTab, setActiveTab] = useState('morning_login'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReason, setSelectedReason] = useState('lunch');
  const [customMinutes, setCustomMinutes] = useState(60);
  const [customNote, setCustomNote] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Filter Mode: Default to viewing ONLY those who filled the form
  const [onlySubmittedForms, setOnlySubmittedForms] = useState(true);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [liveDbRegistrations, setLiveDbRegistrations] = useState({});

  // Master Admin State
  const [isMasterAdminAuthenticated, setIsMasterAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('sih_arena_master_auth') === 'true';
  });
  const [adminPassInput, setAdminPassInput] = useState('');
  const [adminPassError, setAdminPassError] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Dynamic Rotating Gate Security Nonce
  const [dynamicSecurityToken, setDynamicSecurityToken] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [tokenSecondsRemaining, setTokenSecondsRemaining] = useState(30);

  // Current Clock
  const [currentTimeStr, setCurrentTimeStr] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  // Target team/member being checked out (Manual or Scan)
  const [pendingExitTarget, setPendingExitTarget] = useState(null);
  const [exitScope, setExitScope] = useState('team'); // 'team' | 'leader' | 'member' | 'custom'
  const [selectedMemberName, setSelectedMemberName] = useState('');
  const [customMemberInput, setCustomMemberInput] = useState('');

  // Self-Service Candidate Form Box State
  const [selfPassSearch, setSelfPassSearch] = useState('');
  const [selfPassSelectedTeam, setSelfPassSelectedTeam] = useState(null);
  const [returnSearch, setReturnSearch] = useState('');
  const [returnSuccessMsg, setReturnSuccessMsg] = useState('');

  // Special Generated Live Team Card Modal / View
  const [activeSpecialCard, setActiveSpecialCard] = useState(null);

  // Printable Gate Poster Modal (Separate Dedicated Posters for OUT and IN)
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [posterMode, setPosterMode] = useState('out'); // 'out' | 'in'

  // Enlarge Team Pass Modal
  const [qrPassTeam, setQrPassTeam] = useState(null);

  // Filter for Team Passes Gallery
  const [gallerySearch, setGallerySearch] = useState('');
  const [galleryFilterTier, setGalleryFilterTier] = useState('ALL');

  // Morning & Evening Searches
  const [morningSearch, setMorningSearch] = useState('');
  const [eveningSearch, setEveningSearch] = useState('');

  // ================= PERSISTENT STATE 1: TEAM SESSIONS =================
  const [teamSessions, setTeamSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('sih_arena_team_sessions');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // ================= PERSISTENT STATE 2: GRANULAR MEMBER ATTENDANCE =================
  const [memberAttendance, setMemberAttendance] = useState(() => {
    try {
      const saved = localStorage.getItem('sih_arena_member_attendance');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // ================= PERSISTENT STATE 3: ACTIVE OUT BREAK PASSES =================
  const [activeOuts, setActiveOuts] = useState(() => {
    try {
      const saved = localStorage.getItem('sih_inout_active_outs');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // ================= PERSISTENT STATE 4: MOVEMENT HISTORY AUDIT LOGS =================
  const [movementLogs, setMovementLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('sih_inout_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('sih_arena_team_sessions', JSON.stringify(teamSessions));
    } catch (e) { console.warn('Failed to save team sessions', e); }
  }, [teamSessions]);

  useEffect(() => {
    try {
      localStorage.setItem('sih_arena_member_attendance', JSON.stringify(memberAttendance));
    } catch (e) { console.warn('Failed to save member attendance', e); }
  }, [memberAttendance]);

  useEffect(() => {
    try {
      localStorage.setItem('sih_inout_active_outs', JSON.stringify(activeOuts));
    } catch (e) { console.warn('Failed to save active outs', e); }
  }, [activeOuts]);

  useEffect(() => {
    try {
      localStorage.setItem('sih_inout_logs', JSON.stringify(movementLogs));
    } catch (e) { console.warn('Failed to save movement logs', e); }
  }, [movementLogs]);

  // URL Listener to sync viewMode (?action=out or ?action=in)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');
      const hash = (window.location.hash || '').toLowerCase();
      
      if (action === 'out' || hash.includes('action=out')) {
        setViewMode('candidate_out');
      } else if (action === 'in' || hash.includes('action=in')) {
        setViewMode('candidate_in');
      }
    } catch (e) {
      console.warn('URL action parse error:', e);
    }
  }, []);

  // Direct Live Supabase Fetch Function
  const fetchSupabaseRegistrations = async () => {
    setIsSyncingDb(true);
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*');

      if (!error && data) {
        const remoteMap = {};
        data.forEach(r => {
          remoteMap[r.temp_team_id] = r;
        });
        setLiveDbRegistrations(remoteMap);
      }
    } catch (err) {
      console.warn('Supabase fetch error', err);
    } finally {
      setIsSyncingDb(false);
    }
  };

  // Initial Supabase DB load
  useEffect(() => {
    fetchSupabaseRegistrations();
  }, []);

  // Live Clock Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute Active Break Window
  const activeBreakInfo = useMemo(() => {
    const now = new Date();
    const currH = now.getHours();
    const currM = now.getMinutes();
    const currTotal = currH * 60 + currM;

    for (const b of COMMON_BREAK_WINDOWS) {
      const startTotal = b.startHour * 60 + b.startMin;
      const endTotal = b.endHour * 60 + b.endMin;

      if (currTotal >= startTotal && currTotal <= endTotal) {
        const remaining = endTotal - currTotal;
        return {
          isActive: true,
          currentBreak: b,
          remainingMins: remaining,
          statusText: `ACTIVE: ${b.label} (${remaining}m left)`
        };
      }
    }

    return {
      isActive: false,
      currentBreak: null,
      remainingMins: 0,
      statusText: 'No Official Common Break Active'
    };
  }, [currentTimeStr]);

  // Merge Registrations
  const activeRegistrationsMap = useMemo(() => {
    return { ...registrationsMap, ...liveDbRegistrations };
  }, [registrationsMap, liveDbRegistrations]);

  // Form-Filled Teams
  const formSubmittedTeams = useMemo(() => {
    return allTeams.filter(team => {
      const reg = activeRegistrationsMap[team.temp_team_id] || team.registration_data;
      return !!(reg && (reg.team_name || reg.submitted_at || reg.leader_whatsapp));
    });
  }, [allTeams, activeRegistrationsMap]);

  const displayedTeams = useMemo(() => {
    if (onlySubmittedForms) {
      return formSubmittedTeams;
    }
    return allTeams;
  }, [onlySubmittedForms, formSubmittedTeams, allTeams]);

  const submittedCount = formSubmittedTeams.length;

  // Sound Feedback
  const playBeep = (type = 'success') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'return') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.16);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'login') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.24);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // AudioContext not allowed before gesture
    }
  };

  // Helper to extract verified team roster from real Supabase / form data (0% mock)
  const getTeamRoster = (team) => {
    if (!team) return [];
    const reg = activeRegistrationsMap[team.temp_team_id] || team.registration_data;
    const members = [];

    // Leader (Member 1)
    members.push({
      role: 'Team Leader',
      name: reg?.leader_name || team.leader_name,
      reg_no: reg?.leader_reg_no || team.reg_no,
      isLeader: true
    });

    // Members 2 to 6 (Only genuine verified members from database)
    if (reg?.members && Array.isArray(reg.members)) {
      reg.members.forEach((m, idx) => {
        if (m && m.name && m.name.trim()) {
          members.push({
            role: `Member ${idx + 2}`,
            name: m.name.trim(),
            reg_no: m.reg_no || `RCAS-${team.temp_team_id}-${idx + 2}`,
            isLeader: false
          });
        }
      });
    }

    return members;
  };

  // Helper to check member presence status
  const getMemberStatus = (teamId, memberName) => {
    const teamRecord = memberAttendance[teamId] || {};
    const memberRecord = teamRecord[memberName];
    if (memberRecord !== undefined) {
      return memberRecord.is_present;
    }
    const session = teamSessions[teamId];
    if (session?.is_logged_in) return true;
    return false;
  };

  // Helper to check if member is currently on break
  const getMemberBreakStatus = (teamId, memberName) => {
    return Object.values(activeOuts).find(o => 
      o.team_id === teamId && 
      (o.scope === 'team' || o.member_name.includes(memberName) || (o.scope === 'leader' && memberName.includes('Leader')))
    );
  };

  // ================= ACTION 1: MORNING TEAM LOGIN =================
  const handleMorningTeamLogin = (team, mode = 'ALL_PRESENT') => {
    const teamId = team.temp_team_id;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const roster = getTeamRoster(team);

    const newTeamAttendance = { ...(memberAttendance[teamId] || {}) };
    roster.forEach(m => {
      if (mode === 'ALL_PRESENT') {
        newTeamAttendance[m.name] = { is_present: true, marked_at: timeStr };
      } else if (newTeamAttendance[m.name] === undefined) {
        newTeamAttendance[m.name] = { is_present: true, marked_at: timeStr };
      }
    });

    const presentCount = Object.values(newTeamAttendance).filter(v => v.is_present).length;

    setTeamSessions(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        morning_login_time: timeStr,
        morning_timestamp: now.getTime(),
        is_logged_in: true,
        is_logged_out: false,
        present_count: presentCount,
        total_roster: roster.length
      }
    }));

    setMemberAttendance(prev => ({
      ...prev,
      [teamId]: newTeamAttendance
    }));

    const logEntry = {
      team_id: teamId,
      team_name: team.team_name,
      leader_name: team.leader_name,
      reg_no: team.reg_no,
      venue: 'SIH Arena',
      out_time: '---',
      in_time: timeStr,
      duration_minutes: 0,
      reason_label: 'Morning Session Arrival (Team Login)',
      member_name: `Team Login (${presentCount}/${roster.length} Present)`,
      custom_note: `Morning arrival registered. ${presentCount} members marked present.`,
      status: 'LOGGED_IN',
      log_type: 'MORNING_LOGIN'
    };
    setMovementLogs(prev => [logEntry, ...prev]);

    playBeep('login');
  };

  // Toggle Single Member Present / Absent
  const handleToggleMemberPresence = (team, memberName) => {
    const teamId = team.temp_team_id;
    const currentPresence = getMemberStatus(teamId, memberName);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newPresence = !currentPresence;
    const roster = getTeamRoster(team);

    const updatedTeamAtt = {
      ...(memberAttendance[teamId] || {}),
      [memberName]: { is_present: newPresence, marked_at: now }
    };

    const presentMembers = roster.filter(m => {
      if (m.name === memberName) return newPresence;
      const ex = updatedTeamAtt[m.name];
      return ex ? ex.is_present : (teamSessions[teamId]?.is_logged_in ?? false);
    });

    setMemberAttendance(prev => ({
      ...prev,
      [teamId]: updatedTeamAtt
    }));

    setTeamSessions(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        morning_login_time: prev[teamId]?.morning_login_time || now,
        is_logged_in: presentMembers.length > 0,
        present_count: presentMembers.length,
        total_roster: roster.length
      }
    }));

    playBeep('success');
  };

  // Bulk Login All Displayed Teams
  const handleBulkMorningLoginAll = () => {
    if (!window.confirm(`Mark Morning Arrival Check-In for all ${displayedTeams.length} teams (All Roster Members Present)?`)) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newSessions = { ...teamSessions };
    const newAtt = { ...memberAttendance };
    const newLogs = [];

    displayedTeams.forEach(team => {
      const teamId = team.temp_team_id;
      const roster = getTeamRoster(team);
      const teamAtt = {};
      roster.forEach(m => {
        teamAtt[m.name] = { is_present: true, marked_at: timeStr };
      });
      newAtt[teamId] = teamAtt;

      newSessions[teamId] = {
        morning_login_time: timeStr,
        morning_timestamp: now.getTime(),
        is_logged_in: true,
        is_logged_out: false,
        present_count: roster.length,
        total_roster: roster.length
      };

      newLogs.push({
        team_id: teamId,
        team_name: team.team_name,
        leader_name: team.leader_name,
        reg_no: team.reg_no,
        venue: 'SIH Arena',
        out_time: '---',
        in_time: timeStr,
        duration_minutes: 0,
        reason_label: 'Morning Session Arrival (Bulk Login)',
        member_name: `Full Team (${roster.length}/${roster.length} Present)`,
        custom_note: 'Bulk morning check-in processed by Venue In-Charge.',
        status: 'LOGGED_IN',
        log_type: 'MORNING_LOGIN'
      });
    });

    setTeamSessions(newSessions);
    setMemberAttendance(newAtt);
    setMovementLogs(prev => [...newLogs, ...prev]);
    playBeep('login');
  };

  // ================= ACTION 2: EVENING TEAM LOGOUT =================
  const handleEveningTeamLogout = (team) => {
    const teamId = team.temp_team_id;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const activePasses = Object.keys(activeOuts).filter(k => activeOuts[k].team_id === teamId);
    if (activePasses.length > 0) {
      setActiveOuts(prev => {
        const copy = { ...prev };
        activePasses.forEach(k => delete copy[k]);
        return copy;
      });
    }

    setTeamSessions(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        evening_logout_time: timeStr,
        evening_timestamp: now.getTime(),
        is_logged_out: true
      }
    }));

    const logEntry = {
      team_id: teamId,
      team_name: team.team_name,
      leader_name: team.leader_name,
      reg_no: team.reg_no,
      venue: 'SIH Arena',
      out_time: timeStr,
      in_time: '---',
      duration_minutes: 0,
      reason_label: 'Evening Session Departure (Team Logout)',
      member_name: `Team Logout (${team.team_name})`,
      custom_note: `Evening session departure registered at ${timeStr}.`,
      status: 'LOGGED_OUT',
      log_type: 'EVENING_LOGOUT'
    };
    setMovementLogs(prev => [logEntry, ...prev]);

    playBeep('return');
  };

  // Bulk Logout All Teams for the Evening
  const handleBulkEveningLogoutAll = () => {
    if (!window.confirm(`Mark Evening Session Departure (Logout) for all ${displayedTeams.length} teams?`)) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newSessions = { ...teamSessions };
    const newLogs = [];

    displayedTeams.forEach(team => {
      const teamId = team.temp_team_id;
      newSessions[teamId] = {
        ...newSessions[teamId],
        evening_logout_time: timeStr,
        evening_timestamp: now.getTime(),
        is_logged_out: true
      };

      newLogs.push({
        team_id: teamId,
        team_name: team.team_name,
        leader_name: team.leader_name,
        reg_no: team.reg_no,
        venue: 'SIH Arena',
        out_time: timeStr,
        in_time: '---',
        duration_minutes: 0,
        reason_label: 'Evening Session Departure (Bulk Logout)',
        member_name: `Team Logout (${team.team_name})`,
        custom_note: 'Bulk evening departure logged by Venue Security.',
        status: 'LOGGED_OUT',
        log_type: 'EVENING_LOGOUT'
      });
    });

    setActiveOuts({});
    setTeamSessions(newSessions);
    setMovementLogs(prev => [...newLogs, ...prev]);
    playBeep('return');
  };

  // ================= ACTION 3: AUTHORIZE EXIT PASS =================
  const handleAuthorizeExit = () => {
    const targetTeam = selfPassSelectedTeam || pendingExitTarget;
    if (!targetTeam) return;

    const teamId = targetTeam.temp_team_id;
    const now = new Date();
    const returnExpected = new Date(now.getTime() + customMinutes * 60000);

    let memberDisplayName = '';
    let passKey = `${teamId}_team`;

    if (exitScope === 'team') {
      memberDisplayName = `Entire Team (${targetTeam.team_name})`;
      passKey = `${teamId}_team`;
    } else if (exitScope === 'leader') {
      memberDisplayName = `Team Leader: ${targetTeam.leader_name}`;
      passKey = `${teamId}_leader`;
    } else if (exitScope === 'custom') {
      memberDisplayName = customMemberInput.trim() || targetTeam.leader_name;
      passKey = `${teamId}_${memberDisplayName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    } else {
      memberDisplayName = selectedMemberName || targetTeam.leader_name;
      passKey = `${teamId}_${memberDisplayName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }

    const reasonObj = MOVEMENT_REASONS.find(r => r.id === selectedReason);
    const resolvedReasonLabel = selectedReason === 'other' 
      ? (customNote.trim() ? `Other: ${customNote.trim()}` : 'Official / Other Reason') 
      : (reasonObj?.label || 'Break');

    const passToken = `SEC-${Math.floor(100000 + Math.random() * 900000)}`;

    const outRecord = {
      pass_id: passKey,
      team_id: teamId,
      team_name: targetTeam.team_name,
      leader_name: targetTeam.leader_name,
      reg_no: targetTeam.reg_no,
      ps_id: targetTeam.ps_id,
      school: targetTeam.school,
      status_tier: targetTeam.status,
      mobile: targetTeam.mobile || '',
      venue: 'SIH Arena',
      out_time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      out_timestamp: now.getTime(),
      expected_return_time: returnExpected.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      expected_return_timestamp: returnExpected.getTime(),
      reason: selectedReason,
      reason_label: resolvedReasonLabel,
      scope: exitScope,
      member_name: memberDisplayName,
      custom_note: customNote,
      security_token: passToken,
      status: 'OUT'
    };

    setActiveOuts(prev => ({
      ...prev,
      [passKey]: outRecord
    }));

    playBeep('success');
    setPendingExitTarget(null);
    setCustomNote('');
    setCustomMemberInput('');

    // Open the Special Animated Live Team Card
    setActiveSpecialCard(outRecord);
  };

  // Perform IN Punch (Return from Break to SIH Arena)
  const handlePunchIn = (passKey) => {
    const existing = activeOuts[passKey];
    if (!existing) return;

    const now = new Date();
    const outTimeMs = existing.out_timestamp;
    const durationMinutes = Math.max(1, Math.round((now.getTime() - outTimeMs) / 60000));
    const isOverdue = now.getTime() > existing.expected_return_timestamp;

    const completedLog = {
      ...existing,
      in_time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      in_timestamp: now.getTime(),
      duration_minutes: durationMinutes,
      is_overdue: isOverdue,
      status: 'RETURNED',
      log_type: 'BREAK_RETURN'
    };

    setActiveOuts(prev => {
      const copy = { ...prev };
      delete copy[passKey];
      return copy;
    });

    setMovementLogs(prev => [completedLog, ...prev]);

    if (activeSpecialCard && activeSpecialCard.pass_id === passKey) {
      setActiveSpecialCard(null);
    }

    setReturnSuccessMsg(`Safe return logged for ${existing.member_name} (${existing.team_name})!`);
    playBeep('return');
  };

  // Master Admin: Force Punch In for all currently outside passes
  const handleAdminBulkReturnAll = () => {
    if (!window.confirm(`Mark all ${Object.keys(activeOuts).length} outside candidates as Returned to SIH Arena?`)) return;
    const now = new Date();
    const newLogs = [];

    Object.values(activeOuts).forEach(existing => {
      const outTimeMs = existing.out_timestamp;
      const durationMinutes = Math.max(1, Math.round((now.getTime() - outTimeMs) / 60000));
      const isOverdue = now.getTime() > existing.expected_return_timestamp;

      newLogs.push({
        ...existing,
        in_time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        in_timestamp: now.getTime(),
        duration_minutes: durationMinutes,
        is_overdue: isOverdue,
        custom_note: (existing.custom_note ? `${existing.custom_note} | ` : '') + '[Admin Bulk Return]',
        status: 'RETURNED',
        log_type: 'BREAK_RETURN'
      });
    });

    setActiveOuts({});
    setMovementLogs(prev => [...newLogs, ...prev]);
    playBeep('return');
  };

  // Master Admin: Extend pass time
  const handleAdminExtendPass = (passKey, addMins = 15) => {
    const existing = activeOuts[passKey];
    if (!existing) return;

    const newExpectedMs = existing.expected_return_timestamp + addMins * 60000;
    const newExpectedStr = new Date(newExpectedMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setActiveOuts(prev => ({
      ...prev,
      [passKey]: {
        ...existing,
        expected_return_timestamp: newExpectedMs,
        expected_return_time: newExpectedStr,
        custom_note: (existing.custom_note ? `${existing.custom_note} | ` : '') + `[Extended +${addMins}m by Admin]`
      }
    }));
    playBeep('success');
  };

  // Master Admin: Passcode Auth
  const handleAdminLoginSubmit = (e) => {
    e.preventDefault();
    if (adminPassInput === MASTER_ADMIN_PASSCODE) {
      setIsMasterAdminAuthenticated(true);
      sessionStorage.setItem('sih_arena_master_auth', 'true');
      setIsAuthModalOpen(false);
      setAdminPassError('');
      setViewMode('desk');
      setActiveTab('master_admin');
    } else {
      setAdminPassError('Incorrect Master Admin Passcode. Access Denied.');
      playBeep('error');
    }
  };

  const handleAdminLogout = () => {
    setIsMasterAdminAuthenticated(false);
    sessionStorage.removeItem('sih_arena_master_auth');
    setActiveTab('morning_login');
  };

  // Comprehensive Metrics
  const metrics = useMemo(() => {
    const totalTeams = displayedTeams.length;
    let teamsLoggedIn = 0;
    let teamsLoggedOut = 0;
    let totalMembersInArena = 0;
    let totalMembersAbsent = 0;

    displayedTeams.forEach(team => {
      const teamId = team.temp_team_id;
      const session = teamSessions[teamId];
      const roster = getTeamRoster(team);

      if (session?.is_logged_out) {
        teamsLoggedOut++;
      } else if (session?.is_logged_in) {
        teamsLoggedIn++;
      }

      // Member counts
      roster.forEach(m => {
        const isPres = getMemberStatus(teamId, m.name);
        const isOut = getMemberBreakStatus(teamId, m.name);
        if (isPres && !session?.is_logged_out) {
          if (!isOut) totalMembersInArena++;
        } else if (!isPres) {
          totalMembersAbsent++;
        }
      });
    });

    const activeOutsList = Object.values(activeOuts);
    const currentlyOutCount = activeOutsList.length;

    let overdueCount = 0;
    const now = Date.now();
    activeOutsList.forEach(out => {
      if (now > out.expected_return_timestamp) overdueCount++;
    });

    const lunchCount = movementLogs.filter(l => l.reason === 'lunch').length + activeOutsList.filter(o => o.reason === 'lunch').length;

    return {
      totalTeams,
      teamsLoggedIn,
      teamsLoggedOut,
      totalMembersInArena,
      totalMembersAbsent,
      currentlyOutCount,
      overdueCount,
      lunchCount
    };
  }, [displayedTeams, teamSessions, memberAttendance, activeOuts, movementLogs]);

  // Export CSV Audit Log
  const handleExportCSV = () => {
    const headers = ['Log ID', 'Type', 'Team ID', 'Team Name', 'Candidate / Scope', 'Register No', 'Phone', 'Reason / Action', 'Out / Dept Time', 'In / Arr Time', 'Duration (Mins)', 'Overdue', 'Notes'];
    const rows = movementLogs.map((l, idx) => [
      `"LOG-${idx + 1}"`,
      `"${l.log_type || 'MOVEMENT'}"`,
      `"${l.team_id}"`,
      `"${(l.team_name || '').replace(/"/g, '""')}"`,
      `"${(l.member_name || '').replace(/"/g, '""')}"`,
      `"${l.reg_no || ''}"`,
      `"${l.mobile || ''}"`,
      `"${l.reason_label || ''}"`,
      `"${l.out_time || ''}"`,
      `"${l.in_time || 'OUT'}"`,
      `"${l.duration_minutes || '0'}"`,
      `"${l.is_overdue ? 'YES' : 'NO'}"`,
      `"${(l.custom_note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SIH_Arena_Attendance_Ledger_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredGalleryTeams = useMemo(() => {
    return displayedTeams.filter(t => {
      if (galleryFilterTier !== 'ALL' && t.status !== galleryFilterTier) return false;
      if (!gallerySearch.trim()) return true;
      const q = gallerySearch.toLowerCase();
      return (
        t.temp_team_id.toLowerCase().includes(q) ||
        t.team_name.toLowerCase().includes(q) ||
        t.leader_name.toLowerCase().includes(q) ||
        t.reg_no.toLowerCase().includes(q) ||
        t.ps_id.toLowerCase().includes(q)
      );
    });
  }, [displayedTeams, galleryFilterTier, gallerySearch]);

  const filteredMorningTeams = useMemo(() => {
    if (!morningSearch.trim()) return displayedTeams;
    const q = morningSearch.toLowerCase();
    return displayedTeams.filter(t => 
      t.temp_team_id.toLowerCase().includes(q) ||
      t.team_name.toLowerCase().includes(q) ||
      t.leader_name.toLowerCase().includes(q) ||
      t.reg_no.toLowerCase().includes(q) ||
      t.school.toLowerCase().includes(q)
    );
  }, [displayedTeams, morningSearch]);

  const filteredEveningTeams = useMemo(() => {
    if (!eveningSearch.trim()) return displayedTeams;
    const q = eveningSearch.toLowerCase();
    return displayedTeams.filter(t => 
      t.temp_team_id.toLowerCase().includes(q) ||
      t.team_name.toLowerCase().includes(q) ||
      t.leader_name.toLowerCase().includes(q) ||
      t.reg_no.toLowerCase().includes(q)
    );
  }, [displayedTeams, eveningSearch]);


  // =========================================================================
  // VIEW MODE 1 & 2: ULTRA-MINIMAL CANDIDATE QR SCANNER FORM BOX
  // =========================================================================
  if (viewMode === 'candidate_out' || viewMode === 'candidate_in') {
    return (
      <div className="candidate-minimal-screen">
        {/* Minimal Header */}
        <div className="candidate-minimal-header">
          <div className="logos-minimal-row">
            <img src="/logos/sih_moe_aicte_logo.png" alt="SIH" className="mini-hdr-logo" />
            <div className="mini-hdr-divider"></div>
            <img src="/logos/rathinam_rgu_logo.png" alt="RGU" className="mini-hdr-logo" />
          </div>

          <div className="candidate-clock-wrap" style={{ margin: '14px 0', display: 'flex', justifyContent: 'center' }}>
            <LivePixelDigitalClock variant="mini" />
          </div>

          <div className="candidate-title-block">
            <div className={`minimal-badge ${viewMode === 'candidate_out' ? 'badge-exit' : 'badge-return'}`}>
              {viewMode === 'candidate_out' ? (
                <>
                  <DoorOpen size={14} />
                  <span>SIH ARENA • CANDIDATE EXIT GATE PASS</span>
                </>
              ) : (
                <>
                  <DoorClosed size={14} />
                  <span>SIH ARENA • SAFE RETURN CHECK-IN</span>
                </>
              )}
            </div>
            <h1 className="minimal-main-title">
              {viewMode === 'candidate_out' ? 'Generate Your Exit Pass' : 'Punch Your Safe Return'}
            </h1>
            <p className="minimal-subtitle">
              {viewMode === 'candidate_out' 
                ? 'Select your registered team and who is leaving to get your live pass.' 
                : 'Select your team to confirm return and close active break movement.'}
            </p>
          </div>
        </div>

        {/* Minimal Content Box */}
        <div className="candidate-minimal-card">
          {viewMode === 'candidate_out' ? (
            /* ================= CANDIDATE EXIT PASS FORM ================= */
            <div className="minimal-form-container">
              {/* Step 1: Select Team */}
              <div className="mini-step-group">
                <label className="mini-step-label">
                  <span className="mini-num">1</span>
                  <span>Select Your Team:</span>
                </label>

                {selfPassSelectedTeam ? (
                  <div className="mini-selected-team-pill">
                    <div className="team-text-details">
                      <span className="team-code-tag">{selfPassSelectedTeam.temp_team_id}</span>
                      <strong className="team-name-strong">{selfPassSelectedTeam.team_name}</strong>
                      <span className="team-ldr-tag">Leader: {selfPassSelectedTeam.leader_name} ({selfPassSelectedTeam.reg_no})</span>
                    </div>
                    <button 
                      className="btn-mini-change"
                      onClick={() => setSelfPassSelectedTeam(null)}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="mini-team-search-box">
                    <div className="mini-input-wrap">
                      <Search size={16} className="search-ico" />
                      <input 
                        type="text" 
                        placeholder="Search team name, temp ID (e.g. SIH26-TM-051), or leader..."
                        value={selfPassSearch}
                        onChange={e => setSelfPassSearch(e.target.value)}
                        className="mini-text-input"
                        autoFocus
                      />
                      {selfPassSearch && (
                        <button className="btn-mini-clear" onClick={() => setSelfPassSearch('')}>✕</button>
                      )}
                    </div>

                    <div className="mini-team-dropdown-list">
                      {displayedTeams
                        .filter(t => {
                          if (!selfPassSearch.trim()) return true;
                          const q = selfPassSearch.toLowerCase();
                          return (
                            t.temp_team_id.toLowerCase().includes(q) ||
                            t.team_name.toLowerCase().includes(q) ||
                            t.leader_name.toLowerCase().includes(q) ||
                            t.reg_no.toLowerCase().includes(q)
                          );
                        })
                        .slice(0, 8)
                        .map(team => (
                          <div 
                            key={team.temp_team_id}
                            className="mini-team-option-row"
                            onClick={() => {
                              setSelfPassSelectedTeam(team);
                              setSelectedMemberName(team.leader_name);
                              setExitScope('team');
                            }}
                          >
                            <span className="opt-code">{team.temp_team_id}</span>
                            <span className="opt-name">{team.team_name}</span>
                            <span className="opt-leader">{team.leader_name}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {selfPassSelectedTeam && (
                <>
                  {/* Step 2: Who is Leaving? */}
                  <div className="mini-step-group">
                    <label className="mini-step-label">
                      <span className="mini-num">2</span>
                      <span>Who is leaving the arena?</span>
                    </label>

                    <div className="mini-scope-tabs">
                      <button 
                        className={`mini-scope-btn ${exitScope === 'team' ? 'active' : ''}`}
                        onClick={() => setExitScope('team')}
                      >
                        <Users size={15} />
                        <span>Entire Team</span>
                      </button>

                      <button 
                        className={`mini-scope-btn ${exitScope === 'leader' ? 'active' : ''}`}
                        onClick={() => {
                          setExitScope('leader');
                          setSelectedMemberName(selfPassSelectedTeam.leader_name);
                        }}
                      >
                        <UserCheck size={15} />
                        <span>Leader Only</span>
                      </button>

                      <button 
                        className={`mini-scope-btn ${exitScope === 'member' ? 'active' : ''}`}
                        onClick={() => setExitScope('member')}
                      >
                        <User size={15} />
                        <span>Specific Member</span>
                      </button>
                    </div>

                    {exitScope === 'member' && (
                      <div className="mini-member-select-wrap">
                        <label className="mini-sublabel">Select Candidate from Roster:</label>
                        <div className="mini-member-chips-grid">
                          {getTeamRoster(selfPassSelectedTeam).map((m, idx) => (
                            <button 
                              key={idx}
                              className={`mini-mchip ${selectedMemberName === m.name ? 'selected' : ''}`}
                              onClick={() => setSelectedMemberName(m.name)}
                            >
                              <span>{m.role}: <strong>{m.name}</strong></span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 3: Select Reason */}
                  <div className="mini-step-group">
                    <label className="mini-step-label">
                      <span className="mini-num">3</span>
                      <span>Select Authorized Reason:</span>
                    </label>

                    <div className="mini-reasons-grid">
                      {MOVEMENT_REASONS.map(r => {
                        const IconC = r.icon;
                        const isSel = selectedReason === r.id;
                        return (
                          <div 
                            key={r.id}
                            className={`mini-reason-card ${isSel ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedReason(r.id);
                              setCustomMinutes(r.defaultMins);
                            }}
                          >
                            <IconC size={18} style={{ color: r.color }} />
                            <div className="mini-reason-text">
                              <strong>{r.label.split('(')[0]}</strong>
                              <span>{r.defaultMins} Mins</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Time steppers */}
                    <div className="mini-time-stepper-row">
                      <span>Time Allowed:</span>
                      <div className="mini-stepper">
                        <button onClick={() => setCustomMinutes(m => Math.max(5, m - 5))}>-5m</button>
                        <strong>{customMinutes} Mins</strong>
                        <button onClick={() => setCustomMinutes(m => m + 5)}>+5m</button>
                      </div>
                      <span className="return-time-badge">
                        Return Due: <strong>{new Date(Date.now() + customMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button className="btn-generate-minimal-pass" onClick={handleAuthorizeExit}>
                    <Sparkles size={18} />
                    <span>Generate Live Exit Pass</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            /* ================= CANDIDATE SAFE RETURN FORM ================= */
            <div className="minimal-form-container">
              {returnSuccessMsg ? (
                <div className="mini-success-banner">
                  <CheckCircle2 size={36} className="text-emerald" />
                  <h3>Safe Return Confirmed!</h3>
                  <p>{returnSuccessMsg}</p>
                  <button 
                    className="btn-done-minimal"
                    onClick={() => {
                      setReturnSuccessMsg('');
                      setViewMode('candidate_out');
                    }}
                  >
                    Generate Another Pass
                  </button>
                </div>
              ) : (
                <>
                  <div className="mini-step-group">
                    <label className="mini-step-label">
                      <span className="mini-num">1</span>
                      <span>Select Your Active Outside Pass to Return:</span>
                    </label>

                    {Object.keys(activeOuts).length === 0 ? (
                      <div className="mini-empty-outs-callout">
                        <CheckCircle2 size={24} className="text-emerald" />
                        <p>No teams currently marked outside. All candidates are inside SIH Arena.</p>
                      </div>
                    ) : (
                      <div className="mini-active-outs-list">
                        {Object.entries(activeOuts).map(([passKey, out]) => (
                          <div key={passKey} className="mini-out-item-card">
                            <div className="out-item-left">
                              <span className="out-code">{out.team_id}</span>
                              <strong className="out-team">{out.team_name}</strong>
                              <span className="out-member">{out.member_name} ({out.reason_label})</span>
                              <span className="out-time">Left: {out.out_time} • Due: {out.expected_return_time}</span>
                            </div>
                            <button 
                              className="btn-mini-return-action"
                              onClick={() => handlePunchIn(passKey)}
                            >
                              <CheckCircle2 size={16} />
                              <span>Punch Return</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Minimal Footer Switcher */}
        <div className="candidate-minimal-footer">
          <div className="mini-footer-links">
            <button 
              className="footer-link-btn"
              onClick={() => setViewMode(viewMode === 'candidate_out' ? 'candidate_in' : 'candidate_out')}
            >
              {viewMode === 'candidate_out' ? 'Returning to Arena? Switch to Check-In' : 'Leaving Arena? Switch to Exit Pass'}
            </button>
            <span className="divider-dot">•</span>
            <button 
              className="footer-link-btn text-muted"
              onClick={() => setViewMode('desk')}
            >
              Switch to Arena Desk Dashboard
            </button>
          </div>
        </div>

        {/* Live Digital Card Modal if generated */}
        {activeSpecialCard && (
          <div className="inout-modal-overlay" onClick={() => setActiveSpecialCard(null)}>
            <div className="special-card-modal-canvas" onClick={e => e.stopPropagation()}>
              <div className="special-card-ticket">
                <div className="ticket-top-header">
                  <div className="ticket-org-brand">
                    <img src="/logos/sih_moe_aicte_logo.png" alt="SIH" className="ticket-mini-logo" />
                    <div className="brand-text">
                      <span className="brand-sih">SMART INDIA HACKATHON 2026</span>
                      <span className="brand-rgu">Rathinam Global University</span>
                    </div>
                  </div>
                  <div className="ticket-token-pill">
                    <KeyRound size={12} />
                    <span>{activeSpecialCard.security_token}</span>
                  </div>
                </div>

                <div className="ticket-status-bar">
                  <div className="status-live-pill">
                    <span className="live-dot"></span>
                    <span>ACTIVE EXIT GATE PASS</span>
                  </div>
                  <div className="venue-name-tag">SIH Arena</div>
                </div>

                <div className="ticket-body-content">
                  <div className="ticket-qr-section">
                    <QRCodeSVG 
                      value={`${activeSpecialCard.team_id}|${activeSpecialCard.security_token}|${activeSpecialCard.out_timestamp}`}
                      size={160} 
                      level="H" 
                      includeMargin={true} 
                    />
                    <span className="qr-hash-code">{activeSpecialCard.team_id}</span>
                  </div>

                  <div className="ticket-info-section">
                    <h2 className="ticket-team-title">{activeSpecialCard.team_name}</h2>
                    <div className="ticket-meta-grid">
                      <div className="meta-item">
                        <span className="meta-lbl">Candidate / Scope</span>
                        <span className="meta-val highlight">{activeSpecialCard.member_name}</span>
                      </div>

                      <div className="meta-item">
                        <span className="meta-lbl">Authorized Reason</span>
                        <span className="meta-val reason-val">{activeSpecialCard.reason_label}</span>
                      </div>

                      <div className="meta-item">
                        <span className="meta-lbl">Departure Time</span>
                        <span className="meta-val">{activeSpecialCard.out_time}</span>
                      </div>

                      <div className="meta-item">
                        <span className="meta-lbl">Expected Return</span>
                        <span className="meta-val text-orange font-bold">{activeSpecialCard.expected_return_time}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ticket-footer-action">
                  <p>Show this Special Live Digital Card to Security Guards at the SIH Arena Exit Gate.</p>
                  <div className="ticket-footer-btns">
                    <button 
                      className="btn-ticket-punch-return"
                      onClick={() => handlePunchIn(activeSpecialCard.pass_id)}
                    >
                      <CheckCircle2 size={16} />
                      <span>Punch Return to Arena</span>
                    </button>
                    <button 
                      className="btn-ticket-close"
                      onClick={() => setActiveSpecialCard(null)}
                    >
                      Close Card
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE 3: FULL VENUE ADMIN & DESK WORKPLACE
  // =========================================================================
  return (
    <div className="inout-portal-container">
      {/* Top Header Navigation */}
      <div className="inout-top-strip">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onBackToMain && (
            <button 
              onClick={onBackToMain}
              className="btn-back-to-announcement"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '7px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: '#0f172a',
                color: '#ffffff',
                border: 'none'
              }}
              title="Return to Main SIH Announcement Portal & Shortlist"
            >
              <ArrowLeft size={14} />
              <span>Back to Shortlist</span>
            </button>
          )}

          <div className="inout-hall-badge">
            <DoorOpen size={16} className="text-orange" />
            <span>SIH ARENA • ATTENDANCE &amp; GATEWAY WORKPLACE</span>
          </div>
        </div>

        {/* Live Supabase Sync Status & Toggle */}
        <div className="supabase-sync-badge-group">
          <button 
            className={`btn-sync-db ${isSyncingDb ? 'syncing' : ''}`}
            onClick={fetchSupabaseRegistrations}
            title="Refresh Live Data from Supabase Database"
          >
            <RefreshCw size={13} className={isSyncingDb ? 'spin-slow' : ''} />
            <span>{isSyncingDb ? 'Syncing...' : 'Sync Supabase DB'}</span>
          </button>

          <button 
            className={`btn-toggle-registered-filter ${onlySubmittedForms ? 'active-filter' : ''}`}
            onClick={() => setOnlySubmittedForms(!onlySubmittedForms)}
            title="Toggle between viewing Only Form-Submitted Teams vs All Master Teams"
          >
            <Database size={13} />
            <span>
              {onlySubmittedForms 
                ? `Viewing ${submittedCount} Form-Filled Teams` 
                : `Viewing All ${allTeams.length} Teams`}
            </span>
          </button>
        </div>

        <div className="inout-top-actions">
          {/* Master Admin Trigger Button */}
          {isMasterAdminAuthenticated ? (
            <button 
              className={`btn-master-admin-trigger ${activeTab === 'master_admin' ? 'active' : ''}`}
              onClick={() => setActiveTab(activeTab === 'master_admin' ? 'morning_login' : 'master_admin')}
            >
              <ShieldAlert size={14} className="text-rose" />
              <span>Master Admin Controls</span>
            </button>
          ) : (
            <button 
              className="btn-master-admin-trigger"
              onClick={() => setIsAuthModalOpen(true)}
            >
              <Lock size={14} />
              <span>Master Admin</span>
            </button>
          )}

          {/* Physical Poster Generator - OUT (Exit Gate) */}
          <button 
            className="btn-print-poster-trigger poster-trigger-out"
            onClick={() => {
              setPosterMode('out');
              setIsPosterModalOpen(true);
            }}
            title="Print Physical Paper QR Poster to paste at SIH Arena EXIT Doors"
          >
            <DoorOpen size={14} />
            <span>Exit (OUT) Poster</span>
          </button>

          {/* Physical Poster Generator - IN (Return Gate) */}
          <button 
            className="btn-print-poster-trigger poster-trigger-in"
            onClick={() => {
              setPosterMode('in');
              setIsPosterModalOpen(true);
            }}
            title="Print Physical Paper QR Poster to paste at SIH Arena ENTRY Doors"
          >
            <DoorClosed size={14} />
            <span>Return (IN) Poster</span>
          </button>

          {/* Self-Service Mobile Pass Generator */}
          <button 
            className="btn-self-pass-trigger"
            onClick={() => setViewMode('candidate_out')}
            title="Open Candidate Minimal Form Box"
          >
            <Smartphone size={14} />
            <span>Candidate Form Box</span>
          </button>

          <button 
            className={`btn-sound-toggle ${soundEnabled ? 'active' : ''}`} 
            onClick={() => setSoundEnabled(!soundEnabled)}
            title="Toggle Scan Audio Feedback"
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span>{soundEnabled ? 'Sound ON' : 'Muted'}</span>
          </button>

          <button className="btn-export-attendance" onClick={handleExportCSV}>
            <Download size={14} />
            <span>Export CSV Log</span>
          </button>
        </div>
      </div>

      {/* Official Common Break Windows Ticker Strip */}
      <div className={`common-break-ticker-strip ${activeBreakInfo.isActive ? 'ticker-active-break' : ''}`}>
        <div className="ticker-left-info">
          <Clock size={16} className={activeBreakInfo.isActive ? 'text-amber' : 'text-slate'} />
          <span className="ticker-title">Official Arena Break Windows:</span>
          <div className="break-slots-badges">
            <span className={`break-slot-chip ${activeBreakInfo.currentBreak?.id === 'morning_tea' ? 'active-now' : ''}`}>
              <Coffee size={12} />
              <span>10:50 AM - 11:10 AM (Morning Tea)</span>
            </span>
            <span className={`break-slot-chip ${activeBreakInfo.currentBreak?.id === 'lunch' ? 'active-now' : ''}`}>
              <Utensils size={12} />
              <span>12:30 PM - 01:30 PM (Lunch Break)</span>
            </span>
            <span className={`break-slot-chip ${activeBreakInfo.currentBreak?.id === 'evening_tea' ? 'active-now' : ''}`}>
              <Coffee size={12} />
              <span>02:50 PM - 03:10 PM (Evening Tea)</span>
            </span>
          </div>
        </div>

        <div className="ticker-right-status">
          <span className="ticker-status-pill">
            <span className={`pulse-dot ${activeBreakInfo.isActive ? 'amber' : 'green'}`}></span>
            <span>{activeBreakInfo.statusText}</span>
          </span>
          <LivePixelDigitalClock variant="ticker" />
        </div>
      </div>

      {/* Hero Central Venue Status Banner */}
      <div className="inout-hero-banner">
        <div className="inout-hero-left">
          <div className="venue-live-status-tag">
            <span className="live-pulsing-dot"></span>
            <span>SIH ARENA • ATTENDANCE, LOGIN/LOGOUT &amp; GATE PASS DESK</span>
          </div>
          <h1>SIH Arena Daily Attendance &amp; Movement Workplace</h1>
          <p>
            Connected to <strong>Supabase Cloud Database</strong>. Viewing <strong>{submittedCount} verified teams who filled the official form</strong>. Track individual member presence (Leader &amp; Members), Morning Check-In Logins, Mid-Day Break Passes, and Evening Logouts with Section 65B compliance.
          </p>
        </div>

        <div className="inout-metrics-grid">
          {/* Card 1: Inside Arena */}
          <div className="inout-metric-card green">
            <div className="metric-icon-wrap emerald">
              <Sun size={20} />
            </div>
            <div className="metric-details">
              <span className="metric-lbl">Stationed in Arena</span>
              <div className="metric-num">
                {metrics.teamsLoggedIn} <span className="sub-num">/ {metrics.totalTeams} Teams</span>
              </div>
              <span className="metric-desc">{metrics.totalMembersInArena} Members Inside</span>
            </div>
          </div>

          {/* Card 2: Currently Outside on Break */}
          <div className="inout-metric-card orange">
            <div className="metric-icon-wrap orange">
              <DoorOpen size={20} />
            </div>
            <div className="metric-details">
              <span className="metric-lbl">On Break (Outside)</span>
              <div className="metric-num">{metrics.currentlyOutCount}</div>
              <span className="metric-desc">Active Exit Passes</span>
            </div>
          </div>

          {/* Card 3: Overdue Returns */}
          <div className="inout-metric-card red">
            <div className="metric-icon-wrap red">
              <AlertTriangle size={20} />
            </div>
            <div className="metric-details">
              <span className="metric-lbl">Overdue Return</span>
              <div className="metric-num">{metrics.overdueCount}</div>
              <span className="metric-desc">Exceeded Pass Time Limit</span>
            </div>
          </div>

          {/* Card 4: Evening Logouts / Absentees */}
          <div className="inout-metric-card indigo">
            <div className="metric-icon-wrap indigo">
              <Moon size={20} />
            </div>
            <div className="metric-details">
              <span className="metric-lbl">Logged Out / Departed</span>
              <div className="metric-num">{metrics.teamsLoggedOut}</div>
              <span className="metric-desc">{metrics.totalMembersAbsent} Absent Members</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Branch Navigation Tabs */}
      <div className="inout-nav-tabs">
        <button 
          className={`inout-tab-btn ${activeTab === 'morning_login' ? 'active' : ''}`}
          onClick={() => setActiveTab('morning_login')}
        >
          <LogIn size={16} />
          <span>Morning Team Login ({metrics.teamsLoggedIn}/{metrics.totalTeams})</span>
        </button>

        <button 
          className={`inout-tab-btn ${activeTab === 'scanner' ? 'active' : ''}`}
          onClick={() => setActiveTab('scanner')}
        >
          <QrCode size={16} />
          <span>Issue Break Passes &amp; Gate Scanner</span>
        </button>

        <button 
          className={`inout-tab-btn ${activeTab === 'active_out' ? 'active' : ''}`}
          onClick={() => setActiveTab('active_out')}
        >
          <DoorOpen size={16} />
          <span>Currently Outside ({metrics.currentlyOutCount})</span>
          {metrics.overdueCount > 0 && <span className="tab-alert-pill">{metrics.overdueCount} Overdue</span>}
        </button>

        <button 
          className={`inout-tab-btn ${activeTab === 'evening_logout' ? 'active' : ''}`}
          onClick={() => setActiveTab('evening_logout')}
        >
          <LogOut size={16} />
          <span>Evening Team Logout ({metrics.teamsLoggedOut})</span>
        </button>

        <button 
          className={`inout-tab-btn ${activeTab === 'team_passes' ? 'active' : ''}`}
          onClick={() => setActiveTab('team_passes')}
        >
          <Users size={16} />
          <span>Team Cards &amp; Rosters ({displayedTeams.length})</span>
        </button>

        <button 
          className={`inout-tab-btn ${activeTab === 'log' ? 'active' : ''}`}
          onClick={() => setActiveTab('log')}
        >
          <Clock size={16} />
          <span>Movement &amp; Attendance Log ({movementLogs.length})</span>
        </button>

        {isMasterAdminAuthenticated && (
          <button 
            className={`inout-tab-btn admin-tab ${activeTab === 'master_admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('master_admin')}
          >
            <ShieldAlert size={16} />
            <span>Master Admin Controls</span>
          </button>
        )}
      </div>

      {/* ================= TAB 1: MORNING TEAM LOGIN & ATTENDANCE ================= */}
      {activeTab === 'morning_login' && (
        <div className="inout-tab-pane">
          <div className="morning-login-container">
            <div className="session-section-header">
              <div className="section-title-left">
                <Sun size={22} className="text-amber" />
                <div>
                  <h2>Morning Session Team Arrival Check-In (Login)</h2>
                  <p>Check in teams arriving at SIH Arena. Mark individual members Present or Absent, or 1-click Login Entire Team.</p>
                </div>
              </div>

              <div className="session-header-actions">
                <button className="btn-bulk-session-action btn-bulk-login" onClick={handleBulkMorningLoginAll}>
                  <CheckCircle2 size={16} />
                  <span>Login All {displayedTeams.length} Teams (All Present)</span>
                </button>
              </div>
            </div>

            <div className="session-search-bar">
              <Search size={16} />
              <input 
                type="text"
                placeholder="Search teams by Name, Temp ID (e.g. SIH26-TM-051), Leader Name, Reg No, or School..."
                value={morningSearch}
                onChange={e => setMorningSearch(e.target.value)}
                className="session-search-input"
              />
              {morningSearch && (
                <button className="btn-clear-search" onClick={() => setMorningSearch('')}>Clear</button>
              )}
            </div>

            <div className="team-attendance-cards-grid">
              {filteredMorningTeams.map(team => {
                const teamId = team.temp_team_id;
                const session = teamSessions[teamId];
                const isLoggedIn = session?.is_logged_in;
                const roster = getTeamRoster(team);
                const activeBreak = Object.values(activeOuts).find(o => o.team_id === teamId);

                return (
                  <div key={teamId} className={`team-attendance-card ${isLoggedIn ? 'card-logged-in' : 'card-pending'}`}>
                    <div className="card-top-header">
                      <div className="team-meta-left">
                        <span className="badge-team-id">{teamId}</span>
                        <h3 className="team-title-text">{team.team_name}</h3>
                        <span className="team-school-text">{team.school}</span>
                      </div>

                      <div className="team-login-status-badge">
                        {isLoggedIn ? (
                          <div className="status-pill status-in">
                            <CheckCircle2 size={13} />
                            <span>Logged In at {session.morning_login_time}</span>
                          </div>
                        ) : (
                          <div className="status-pill status-waiting">
                            <Clock size={13} />
                            <span>Pending Morning Arrival</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="card-roster-section">
                      <div className="roster-header-label">
                        <span>Individual Candidate Presence Roster ({roster.length} Slots):</span>
                        <span className="roster-hint">Click member chip to toggle Present / Absent</span>
                      </div>

                      <div className="roster-chips-container">
                        {roster.map((m, idx) => {
                          const isPres = getMemberStatus(teamId, m.name);
                          const isBreak = getMemberBreakStatus(teamId, m.name);

                          return (
                            <div 
                              key={idx}
                              className={`member-presence-chip ${isPres ? (isBreak ? 'chip-on-break' : 'chip-present') : 'chip-absent'}`}
                              onClick={() => handleToggleMemberPresence(team, m.name)}
                              title={isPres ? `${m.name} is Present (Click to mark Absent)` : `${m.name} is Absent (Click to mark Present)`}
                            >
                              <div className="chip-icon">
                                {isPres ? (
                                  isBreak ? <DoorOpen size={13} /> : <CheckCircle2 size={13} />
                                ) : (
                                  <UserX size={13} />
                                )}
                              </div>
                              <div className="chip-text">
                                <span className="chip-role">{m.role} {m.isLeader ? '(Leader)' : ''}</span>
                                <span className="chip-name">{m.name}</span>
                              </div>
                              <span className="chip-status-tag">
                                {isPres ? (isBreak ? 'ON BREAK' : 'PRESENT') : 'ABSENT'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="card-actions-footer">
                      {activeBreak && (
                        <div className="card-break-alert">
                          <DoorOpen size={14} className="text-orange" />
                          <span>Member on Break: <strong>{activeBreak.member_name}</strong> ({activeBreak.reason_label})</span>
                        </div>
                      )}

                      <div className="card-btn-group">
                        <button 
                          className="btn-quick-login-all"
                          onClick={() => handleMorningTeamLogin(team, 'ALL_PRESENT')}
                        >
                          <CheckSquare size={14} />
                          <span>{isLoggedIn ? 'Re-confirm All Present' : 'Login Entire Team (All Present)'}</span>
                        </button>

                        <button 
                          className="btn-issue-break-direct"
                          onClick={() => {
                            setPendingExitTarget(team);
                            setSelectedMemberName(team.leader_name);
                            setExitScope('team');
                            const rObj = MOVEMENT_REASONS.find(r => r.id === selectedReason);
                            setCustomMinutes(rObj ? rObj.defaultMins : 60);
                          }}
                        >
                          <DoorOpen size={14} />
                          <span>Issue Break Pass</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: ISSUE BREAK PASSES & GATE SCANNER ================= */}
      {activeTab === 'scanner' && (
        <div className="inout-tab-pane">
          <div className="scanner-dual-layout">
            <div className="scanner-left-box">
              <div className="box-header-title">
                <QrCode size={18} className="text-orange" />
                <span>Gate Scanner &amp; Candidate Movement Punch</span>
                <span className="badge-db-indicator">
                  <Database size={11} />
                  <span>{displayedTeams.length} Teams Loaded</span>
                </span>
              </div>

              <form 
                onSubmit={(e) => { 
                  e.preventDefault(); 
                  const target = displayedTeams.find(t => 
                    t.temp_team_id.toUpperCase().includes(searchQuery.toUpperCase()) ||
                    t.team_name.toUpperCase().includes(searchQuery.toUpperCase()) ||
                    t.leader_name.toUpperCase().includes(searchQuery.toUpperCase()) ||
                    t.reg_no.toUpperCase().includes(searchQuery.toUpperCase())
                  );
                  if (target) {
                    setPendingExitTarget(target);
                    setSelectedMemberName(target.leader_name);
                    setExitScope('team');
                  }
                  setSearchQuery('');
                }} 
                className="scanner-search-form"
              >
                <div className="scanner-input-wrap">
                  <Search size={18} className="scanner-search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search or Scan Team ID (e.g. SIH26-TM-051), Leader Name, or Register No..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="scanner-text-field"
                    autoFocus
                  />
                  {searchQuery && (
                    <button type="button" className="btn-clear-input" onClick={() => setSearchQuery('')}>✕</button>
                  )}
                </div>
                <button type="submit" className="btn-punch-action">
                  <span>Open Exit Pass</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              <div className="quick-reason-block">
                <label className="field-block-label">Select Authorized Movement Reason:</label>
                <div className="reasons-pill-grid">
                  {MOVEMENT_REASONS.map(r => {
                    const IconC = r.icon;
                    const isSel = selectedReason === r.id;
                    return (
                      <button 
                        type="button"
                        key={r.id}
                        className={`reason-chip-btn ${isSel ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedReason(r.id);
                          setCustomMinutes(r.defaultMins);
                        }}
                      >
                        <IconC size={15} style={{ color: r.color }} />
                        <span>{r.label.split('(')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="live-matched-teams-box">
                <div className="box-sub-title">
                  <span>Matching Form-Submitted Teams ({displayedTeams.length}):</span>
                  <span className="click-hint">Click team to issue movement pass</span>
                </div>

                <div className="matched-teams-scroll-list">
                  {displayedTeams
                    .filter(t => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        t.temp_team_id.toLowerCase().includes(q) ||
                        t.team_name.toLowerCase().includes(q) ||
                        t.leader_name.toLowerCase().includes(q) ||
                        t.reg_no.toLowerCase().includes(q)
                      );
                    })
                    .slice(0, 15)
                    .map(t => {
                      const isOut = Object.values(activeOuts).find(o => o.team_id === t.temp_team_id);
                      return (
                        <div 
                          key={t.temp_team_id}
                          className={`team-quick-punch-card ${isOut ? 'is-outside' : 'is-inside'}`}
                          onClick={() => {
                            setPendingExitTarget(t);
                            setSelectedMemberName(t.leader_name);
                            setExitScope('team');
                            const rObj = MOVEMENT_REASONS.find(r => r.id === selectedReason);
                            setCustomMinutes(rObj ? rObj.defaultMins : 60);
                          }}
                        >
                          <div className="punch-card-left">
                            <div className="team-code-pill">{t.temp_team_id}</div>
                            <div className="team-identity-text">
                              <h4>{t.team_name}</h4>
                              <p>Leader: <strong>{t.leader_name}</strong> ({t.reg_no}) • {t.school}</p>
                            </div>
                          </div>

                          <div className="punch-card-right">
                            {isOut ? (
                              <span className="badge-outside-state">
                                <DoorOpen size={12} />
                                <span>{isOut.member_name} OUT ({isOut.reason_label})</span>
                              </span>
                            ) : (
                              <button className="btn-issue-pass-chip">
                                <DoorOpen size={12} />
                                <span>Issue Pass</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="scanner-right-box">
              <div className="box-header-title">
                <Printer size={18} className="text-emerald" />
                <span>Physical Gate Terminals &amp; QR Postings</span>
              </div>

              <div className="physical-poster-cards-stack">
                <div className="gate-poster-cta-card cta-out">
                  <div className="cta-icon-wrap out">
                    <DoorOpen size={24} />
                  </div>
                  <div className="cta-content">
                    <h4>SIH Arena Exit Gate Terminal (OUT)</h4>
                    <p>Pasted at arena exit doors. Candidates scan with smartphone to open minimal pass form.</p>
                    <div className="cta-btns-row">
                      <button 
                        className="btn-open-poster-view btn-out"
                        onClick={() => {
                          setPosterMode('out');
                          setIsPosterModalOpen(true);
                        }}
                      >
                        <Printer size={14} />
                        <span>Print EXIT (OUT) Gate Poster</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="gate-poster-cta-card cta-in">
                  <div className="cta-icon-wrap in">
                    <DoorClosed size={24} />
                  </div>
                  <div className="cta-content">
                    <h4>SIH Arena Return Gate Terminal (IN)</h4>
                    <p>Pasted at return doors. Candidates scan upon re-entering to punch return.</p>
                    <div className="cta-btns-row">
                      <button 
                        className="btn-open-poster-view btn-in"
                        onClick={() => {
                          setPosterMode('in');
                          setIsPosterModalOpen(true);
                        }}
                      >
                        <Printer size={14} />
                        <span>Print RETURN (IN) Gate Poster</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: CURRENTLY OUTSIDE ================= */}
      {activeTab === 'active_out' && (
        <div className="inout-tab-pane">
          <div className="active-outs-container">
            <div className="section-header-row">
              <div className="header-title-group">
                <h2>Currently Active Outside Passes ({Object.keys(activeOuts).length})</h2>
                <p>Live countdown timers for candidates currently outside the SIH Arena.</p>
              </div>

              {Object.keys(activeOuts).length > 0 && (
                <button className="btn-bulk-return-action" onClick={handleAdminBulkReturnAll}>
                  <CheckCircle2 size={16} />
                  <span>Bulk Return All Candidates ({Object.keys(activeOuts).length})</span>
                </button>
              )}
            </div>

            {Object.keys(activeOuts).length === 0 ? (
              <div className="empty-state-card">
                <CheckCircle2 size={48} className="text-emerald" />
                <h3>All Candidates are Stationed Inside SIH Arena</h3>
                <p>Zero active exit passes.</p>
              </div>
            ) : (
              <div className="active-outs-grid">
                {Object.entries(activeOuts).map(([passKey, out]) => {
                  const now = Date.now();
                  const isOverdue = now > out.expected_return_timestamp;
                  const minutesLeft = Math.round((out.expected_return_timestamp - now) / 60000);

                  return (
                    <div key={passKey} className={`active-out-card ${isOverdue ? 'overdue-alert' : ''}`}>
                      <div className="out-card-top">
                        <div className="team-tag">{out.team_id}</div>
                        <div className={`status-pill ${isOverdue ? 'overdue' : 'active'}`}>
                          {isOverdue ? (
                            <>
                              <AlertTriangle size={13} />
                              <span>OVERDUE ({Math.abs(minutesLeft)}m late)</span>
                            </>
                          ) : (
                            <>
                              <Clock size={13} />
                              <span>{minutesLeft} mins remaining</span>
                            </>
                          )}
                        </div>
                      </div>

                      <h3 className="out-team-name">{out.team_name}</h3>
                      <div className="out-member-highlight">
                        <User size={15} />
                        <span><strong>{out.member_name}</strong></span>
                      </div>

                      <div className="out-meta-row">
                        <span className="out-reason-tag">{out.reason_label}</span>
                        <span className="out-time-lbl">Left at {out.out_time}</span>
                      </div>

                      <div className="expected-return-box">
                        <Clock size={14} />
                        <span>Expected Return: <strong>{out.expected_return_time}</strong></span>
                      </div>

                      <div className="out-card-actions">
                        <button 
                          className="btn-punch-in-return"
                          onClick={() => handlePunchIn(passKey)}
                        >
                          <CheckCircle2 size={16} />
                          <span>Punch Return to Arena</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 4: EVENING TEAM LOGOUT ================= */}
      {activeTab === 'evening_logout' && (
        <div className="inout-tab-pane">
          <div className="evening-logout-container">
            <div className="session-section-header">
              <div className="section-title-left">
                <Moon size={22} className="text-indigo" />
                <div>
                  <h2>Evening Session Team Departure Check-Out (Logout)</h2>
                  <p>Log out teams departing from SIH Arena at the end of the day.</p>
                </div>
              </div>

              <div className="session-header-actions">
                <button className="btn-bulk-session-action btn-bulk-logout" onClick={handleBulkEveningLogoutAll}>
                  <LogOut size={16} />
                  <span>Logout All Teams (Evening Wrap-Up)</span>
                </button>
              </div>
            </div>

            <div className="session-search-bar">
              <Search size={16} />
              <input 
                type="text"
                placeholder="Search teams departing in evening..."
                value={eveningSearch}
                onChange={e => setEveningSearch(e.target.value)}
                className="session-search-input"
              />
              {eveningSearch && (
                <button className="btn-clear-search" onClick={() => setEveningSearch('')}>Clear</button>
              )}
            </div>

            <div className="team-attendance-cards-grid">
              {filteredEveningTeams.map(team => {
                const teamId = team.temp_team_id;
                const session = teamSessions[teamId];
                const isLoggedOut = session?.is_logged_out;
                const isLoggedIn = session?.is_logged_in;
                const roster = getTeamRoster(team);

                return (
                  <div key={teamId} className={`team-attendance-card ${isLoggedOut ? 'card-logged-out' : (isLoggedIn ? 'card-logged-in' : 'card-pending')}`}>
                    <div className="card-top-header">
                      <div className="team-meta-left">
                        <span className="badge-team-id">{teamId}</span>
                        <h3 className="team-title-text">{team.team_name}</h3>
                        <span className="team-school-text">{team.school}</span>
                      </div>

                      <div className="team-login-status-badge">
                        {isLoggedOut ? (
                          <div className="status-pill status-out">
                            <Moon size={13} />
                            <span>Logged Out at {session.evening_logout_time}</span>
                          </div>
                        ) : isLoggedIn ? (
                          <div className="status-pill status-in">
                            <Sun size={13} />
                            <span>In Arena since {session.morning_login_time}</span>
                          </div>
                        ) : (
                          <div className="status-pill status-waiting">
                            <Clock size={13} />
                            <span>Not Checked In Today</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="card-roster-summary">
                      <p><strong>Team Leader:</strong> {team.leader_name} ({team.reg_no})</p>
                      <p><strong>Roster Members:</strong> {roster.map(r => r.name).join(', ')}</p>
                    </div>

                    <div className="card-actions-footer">
                      {isLoggedOut ? (
                        <div className="logged-out-indicator">
                          <CheckCircle2 size={15} className="text-emerald" />
                          <span>Evening Departure Recorded. See you tomorrow!</span>
                        </div>
                      ) : (
                        <button 
                          className="btn-evening-logout-action"
                          onClick={() => handleEveningTeamLogout(team)}
                        >
                          <LogOut size={16} />
                          <span>Log Out Team for the Day</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: SPECIAL TEAM CARDS ================= */}
      {activeTab === 'team_passes' && (
        <div className="inout-tab-pane">
          <div className="team-passes-gallery">
            <div className="gallery-header-row">
              <div className="header-title-group">
                <h2>Special Verified Team Passes ({filteredGalleryTeams.length} Teams)</h2>
                <p>Digital badges generated for verified form-filled teams stationed at SIH Arena.</p>
              </div>

              <div className="gallery-filter-group">
                <input 
                  type="text" 
                  placeholder="Filter team cards by name, ID, or school..."
                  value={gallerySearch}
                  onChange={e => setGallerySearch(e.target.value)}
                  className="gallery-search-input"
                />
              </div>
            </div>

            <div className="team-cards-grid">
              {filteredGalleryTeams.map(team => {
                const teamId = team.temp_team_id;
                const roster = getTeamRoster(team);
                const isOut = Object.values(activeOuts).find(o => o.team_id === teamId);
                const session = teamSessions[teamId];

                return (
                  <div key={teamId} className={`team-digital-card ${isOut ? 'team-card-outside' : ''}`}>
                    <div className="card-top-bar">
                      <span className="card-team-code">{teamId}</span>
                      <span className={`status-pill ${session?.is_logged_in ? (isOut ? 'outside' : 'inside') : 'pending'}`}>
                        {session?.is_logged_in ? (isOut ? 'ON BREAK' : 'INSIDE ARENA') : 'PENDING LOGIN'}
                      </span>
                    </div>

                    <h3 className="card-team-name">{team.team_name}</h3>
                    <p className="card-school-name">{team.school}</p>

                    <div className="card-roster-list">
                      <div className="roster-title">Verified Roster:</div>
                      {roster.map((m, idx) => (
                        <div key={idx} className="roster-item-row">
                          <span className="m-role">{m.role}:</span>
                          <span className="m-name">{m.name}</span>
                        </div>
                      ))}
                    </div>

                    <div className="card-footer-btns">
                      <button 
                        className="btn-card-issue-pass"
                        onClick={() => {
                          setPendingExitTarget(team);
                          setSelectedMemberName(team.leader_name);
                          setExitScope('team');
                          const rObj = MOVEMENT_REASONS.find(r => r.id === selectedReason);
                          setCustomMinutes(rObj ? rObj.defaultMins : 60);
                        }}
                      >
                        <DoorOpen size={14} />
                        <span>Issue Pass</span>
                      </button>
                      <button 
                        className="btn-card-view-qr"
                        onClick={() => setQrPassTeam(team)}
                      >
                        <QrCode size={14} />
                        <span>Badge QR</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 6: SECTION 65B AUDIT LOG ================= */}
      {activeTab === 'log' && (
        <div className="inout-tab-pane">
          <div className="movement-log-container">
            <div className="log-header-strip">
              <div>
                <h2>Section 65B Electronic Attendance &amp; Movement Ledger</h2>
                <p>Immutable audit trail of all Morning Logins, Mid-Day Break Passes, Returns, and Evening Logouts.</p>
              </div>
              <button className="btn-export-log-csv" onClick={handleExportCSV}>
                <Download size={15} />
                <span>Export Ledger CSV</span>
              </button>
            </div>

            {movementLogs.length === 0 ? (
              <div className="empty-log-state">Zero movement logs recorded yet today.</div>
            ) : (
              <div className="log-table-wrapper">
                <table className="inout-log-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Type</th>
                      <th>Team ID</th>
                      <th>Team Name</th>
                      <th>Candidate / Scope</th>
                      <th>Reason / Action</th>
                      <th>Out Time</th>
                      <th>In Time</th>
                      <th>Duration</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movementLogs.map((log, idx) => (
                      <tr key={idx} className={log.is_overdue ? 'overdue-row' : ''}>
                        <td>{idx + 1}</td>
                        <td>
                          <span className={`log-type-tag ${log.log_type || 'MOVEMENT'}`}>
                            {log.log_type || 'MOVEMENT'}
                          </span>
                        </td>
                        <td><code>{log.team_id}</code></td>
                        <td><strong>{log.team_name}</strong></td>
                        <td>{log.member_name}</td>
                        <td>
                          <span className="log-reason-pill">{log.reason_label}</span>
                        </td>
                        <td>{log.out_time || '---'}</td>
                        <td>{log.in_time || 'OUT'}</td>
                        <td>{log.duration_minutes ? `${log.duration_minutes}m` : '---'}</td>
                        <td>
                          <span className={`log-status-badge ${log.status}`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 7: MASTER ADMIN CONTROLS ================= */}
      {activeTab === 'master_admin' && isMasterAdminAuthenticated && (
        <div className="inout-tab-pane">
          <div className="master-admin-dashboard-card">
            <div className="admin-header-strip">
              <div className="admin-title-left">
                <ShieldAlert size={22} className="text-rose" />
                <div>
                  <h2>SIH Arena Master Gate Administration</h2>
                  <p>Master override controls, bulk return protocols, and live Section 65B movement audit ledger</p>
                </div>
              </div>
              <button className="btn-admin-logout" onClick={handleAdminLogout}>
                <Lock size={14} />
                <span>Lock Admin Desk</span>
              </button>
            </div>

            <div className="admin-actions-grid">
              <div className="admin-action-box">
                <div className="box-top">
                  <CheckCircle2 size={20} className="text-emerald" />
                  <h4>Bulk Return All Candidates</h4>
                </div>
                <p>Force return all {Object.keys(activeOuts).length} candidates currently marked outside to INSIDE status.</p>
                <button 
                  className="btn-admin-danger"
                  disabled={Object.keys(activeOuts).length === 0}
                  onClick={handleAdminBulkReturnAll}
                >
                  Return All ({Object.keys(activeOuts).length})
                </button>
              </div>

              <div className="admin-action-box">
                <div className="box-top">
                  <RefreshCw size={20} className="text-indigo" />
                  <h4>Force Supabase DB Sync</h4>
                </div>
                <p>Pull latest form registrations and candidate roster changes directly from Supabase Cloud.</p>
                <button className="btn-admin-primary" onClick={fetchSupabaseRegistrations}>
                  Sync Supabase DB
                </button>
              </div>

              <div className="admin-action-box">
                <div className="box-top">
                  <Download size={20} className="text-amber" />
                  <h4>Export Full Movement Audit Log</h4>
                </div>
                <p>Download complete cryptographic Section 65B CSV movement ledger for institutional filing.</p>
                <button className="btn-admin-secondary" onClick={handleExportCSV}>
                  Download CSV Ledger
                </button>
              </div>

              <div className="admin-action-box">
                <div className="box-top">
                  <RotateCcw size={20} className="text-rose" />
                  <h4>Emergency Reset Movements</h4>
                </div>
                <p>Clear active out cache in local storage if gate sync gets desynchronized.</p>
                <button 
                  className="btn-admin-danger"
                  onClick={() => {
                    if (window.confirm('Clear all active outs cache? (History logs will remain intact)')) {
                      setActiveOuts({});
                      playBeep('return');
                    }
                  }}
                >
                  Clear Active Outs Cache
                </button>
              </div>
            </div>

            <div className="admin-breakdown-section">
              <h3>Currently Active Out Passes ({Object.keys(activeOuts).length})</h3>
              {Object.keys(activeOuts).length === 0 ? (
                <div className="admin-empty-callout">Zero active out passes. All candidates inside the arena.</div>
              ) : (
                <div className="admin-active-outs-list">
                  {Object.entries(activeOuts).map(([passKey, out]) => (
                    <div key={passKey} className="admin-out-row">
                      <div className="row-col-main">
                        <strong>{out.team_id}</strong> - {out.team_name} ({out.member_name})
                        <span className="admin-reason-pill">{out.reason_label}</span>
                      </div>
                      <div className="row-col-times">
                        <span>Left: {out.out_time}</span>
                        <span>Return Due: {out.expected_return_time}</span>
                      </div>
                      <div className="row-col-actions">
                        <button className="btn-admin-extend-chip" onClick={() => handleAdminExtendPass(passKey, 15)}>
                          +15m
                        </button>
                        <button className="btn-admin-extend-chip" onClick={() => handleAdminExtendPass(passKey, 30)}>
                          +30m
                        </button>
                        <button className="btn-admin-return-chip" onClick={() => handlePunchIn(passKey)}>
                          Return
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: PHYSICAL PASTED PAPER GATE POSTERS ================= */}
      {isPosterModalOpen && (
        <div className="inout-modal-overlay" onClick={() => setIsPosterModalOpen(false)}>
          <div className="poster-modal-card" onClick={e => e.stopPropagation()}>
            <div className="poster-modal-toolbar">
              <div className="poster-mode-switcher-tabs">
                <button 
                  className={`poster-tab-btn tab-out ${posterMode === 'out' ? 'active-out' : ''}`}
                  onClick={() => setPosterMode('out')}
                >
                  <DoorOpen size={15} />
                  <span>Exit (OUT) Gate Poster</span>
                </button>
                <button 
                  className={`poster-tab-btn tab-in ${posterMode === 'in' ? 'active-in' : ''}`}
                  onClick={() => setPosterMode('in')}
                >
                  <DoorClosed size={15} />
                  <span>Return (IN) Gate Poster</span>
                </button>
              </div>

              <div className="toolbar-btns">
                <button className="btn-print-action" onClick={() => window.print()}>
                  <Printer size={15} />
                  <span>Print {posterMode === 'out' ? 'OUT' : 'IN'} Poster</span>
                </button>
                <button className="btn-close-modal" onClick={() => setIsPosterModalOpen(false)}>✕</button>
              </div>
            </div>

            {posterMode === 'out' ? (
              <div className="printable-gate-poster poster-mode-out">
                <div className="poster-header-logos">
                  <img src="/logos/sih_moe_aicte_logo.png" alt="MoE AICTE SIH" className="poster-moe-logo" />
                  <div className="poster-divider"></div>
                  <img src="/logos/rathinam_rgu_logo.png" alt="Rathinam Global University" className="poster-rgu-logo" />
                </div>

                <div className="poster-badge-top badge-out">OFFICIAL SIH 2026 ARENA • EXIT GATE TERMINAL</div>
                <h1 className="poster-headline headline-out">SIH ARENA EXIT GATE PASS TERMINAL</h1>
                <p className="poster-subheadline">Authorized Candidate Temporary Movement &amp; Break Pass Generation • Section 65B Electronic Proof Ledger</p>

                <div className="poster-qr-container container-out">
                  <QRCodeSVG 
                    value={`${window.location.origin}/arena?action=out`}
                    size={260} 
                    level="H" 
                    includeMargin={true} 
                  />
                  <div className="poster-scan-callout callout-out">
                    <DoorOpen size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                    <span>SCAN TO GENERATE YOUR EXIT PASS</span>
                  </div>
                </div>

                <div className="poster-steps-grid">
                  <div className="poster-step-item item-out">
                    <div className="step-circle circle-out">1</div>
                    <div className="step-text">
                      <strong>Scan Exit QR Code</strong>
                      <span>Open the Exit Pass Wizard on your smartphone camera</span>
                    </div>
                  </div>

                  <div className="poster-step-item item-out">
                    <div className="step-circle circle-out">2</div>
                    <div className="step-text">
                      <strong>Select Team &amp; Person</strong>
                      <span>Choose Entire Team, Team Leader, or Specific Member</span>
                    </div>
                  </div>

                  <div className="poster-step-item item-out">
                    <div className="step-circle circle-out">3</div>
                    <div className="step-text">
                      <strong>Pick Reason &amp; Show Pass</strong>
                      <span>Select Lunch, Tea, Restroom, Lab, Mentor, or Other &amp; show card to gate security</span>
                    </div>
                  </div>
                </div>

                <div className="poster-footer-note note-out">
                  <p>All candidates must show their generated Special Digital Team Card to Gate Security before stepping outside the SIH Arena.</p>
                  <div className="poster-legal-stamp">Rathinam Global University • Campus Evaluation Authority • SIH Arena Gate Protocol</div>
                </div>
              </div>
            ) : (
              <div className="printable-gate-poster poster-mode-in">
                <div className="poster-header-logos">
                  <img src="/logos/sih_moe_aicte_logo.png" alt="MoE AICTE SIH" className="poster-moe-logo" />
                  <div className="poster-divider"></div>
                  <img src="/logos/rathinam_rgu_logo.png" alt="Rathinam Global University" className="poster-rgu-logo" />
                </div>

                <div className="poster-badge-top badge-in">OFFICIAL SIH 2026 ARENA • SAFE RETURN ENTRY TERMINAL</div>
                <h1 className="poster-headline headline-in">SIH ARENA SAFE RETURN CHECK-IN</h1>
                <p className="poster-subheadline">Instant Re-Entry Attendance Punch-In • Section 65B Electronic Movement Closure</p>

                <div className="poster-qr-container container-in">
                  <QRCodeSVG 
                    value={`${window.location.origin}/arena?action=in`}
                    size={260} 
                    level="H" 
                    includeMargin={true} 
                  />
                  <div className="poster-scan-callout callout-in">
                    <DoorClosed size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                    <span>SCAN UPON ENTERING TO LOG SAFE RETURN</span>
                  </div>
                </div>

                <div className="poster-steps-grid">
                  <div className="poster-step-item item-in">
                    <div className="step-circle circle-in">1</div>
                    <div className="step-text">
                      <strong>Scan Return QR Code</strong>
                      <span>Open the Return Check-In terminal immediately upon entering</span>
                    </div>
                  </div>

                  <div className="poster-step-item item-in">
                    <div className="step-circle circle-in">2</div>
                    <div className="step-text">
                      <strong>Locate Active Pass</strong>
                      <span>Find your Team or Candidate pass in the Outside Active list</span>
                    </div>
                  </div>

                  <div className="poster-step-item item-in">
                    <div className="step-circle circle-in">3</div>
                    <div className="step-text">
                      <strong>Punch 'Return to Arena'</strong>
                      <span>Close movement pass, record re-entry time, and restore venue attendance</span>
                    </div>
                  </div>
                </div>

                <div className="poster-footer-note note-in">
                  <p>Mandatory Re-Entry Protocol: Returning candidates must punch in immediately to prevent automated overdue violation alerts.</p>
                  <div className="poster-legal-stamp">Rathinam Global University • Campus Evaluation Authority • SIH Arena Gate Protocol</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL 4: ENLARGE TEAM QR PASS ================= */}
      {qrPassTeam && (
        <div className="inout-modal-overlay" onClick={() => setQrPassTeam(null)}>
          <div className="qr-badge-modal-card" onClick={e => e.stopPropagation()}>
            <div className="qr-badge-header">
              <span className="badge-org-tag">SMART INDIA HACKATHON 2026</span>
              <h2>Team Gate Movement Digital Badge</h2>
            </div>

            <div className="qr-badge-body">
              <div className="qr-display-center">
                <QRCodeSVG 
                  value={`${qrPassTeam.temp_team_id}|${qrPassTeam.leader_name}|${qrPassTeam.ps_id}|SIH2026`} 
                  size={200} 
                  level="H" 
                  includeMargin={true} 
                />
                <code className="qr-team-code">{qrPassTeam.temp_team_id}</code>
              </div>

              <div className="qr-team-meta">
                <h3>{qrPassTeam.team_name}</h3>
                <p><strong>Team Leader:</strong> {qrPassTeam.leader_name} <code>({qrPassTeam.reg_no})</code></p>
                <p><strong>School:</strong> {qrPassTeam.school}</p>
                <p><strong>Problem Statement:</strong> {qrPassTeam.ps_id}</p>
                <p><strong>Stationed Venue:</strong> SIH Arena</p>
              </div>

              <div className="qr-badge-footer">
                <button 
                  className="btn-badge-issue-pass"
                  onClick={() => {
                    const t = qrPassTeam;
                    setQrPassTeam(null);
                    setPendingExitTarget(t);
                    setSelectedMemberName(t.leader_name);
                    setExitScope('team');
                    const rObj = MOVEMENT_REASONS.find(r => r.id === selectedReason);
                    setCustomMinutes(rObj ? rObj.defaultMins : 60);
                  }}
                >
                  <DoorOpen size={16} />
                  <span>Issue Exit Pass for this Team</span>
                </button>
                <button className="btn-close-qr-modal" onClick={() => setQrPassTeam(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: AUTHORIZE EXIT GATE PASS ================= */}
      {pendingExitTarget && (
        <div className="inout-modal-overlay" onClick={() => setPendingExitTarget(null)}>
          <div className="inout-modal-card" onClick={e => e.stopPropagation()}>
            <div className="inout-modal-header">
              <div className="modal-title-left">
                <DoorOpen size={20} className="text-orange" />
                <div>
                  <h2>Issue Exit Gate Pass</h2>
                  <p>{pendingExitTarget.team_name} ({pendingExitTarget.temp_team_id})</p>
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setPendingExitTarget(null)}>✕</button>
            </div>

            <div className="inout-modal-body">
              <div className="modal-section-group">
                <label className="section-label">1. Who is leaving the SIH Arena?</label>
                <div className="scope-toggle-buttons">
                  <button 
                    className={`scope-btn ${exitScope === 'team' ? 'selected' : ''}`}
                    onClick={() => setExitScope('team')}
                  >
                    <Users size={16} />
                    <span>Entire Team (All Members)</span>
                  </button>
                  <button 
                    className={`scope-btn ${exitScope === 'leader' ? 'selected' : ''}`}
                    onClick={() => { setExitScope('leader'); setSelectedMemberName(pendingExitTarget.leader_name); }}
                  >
                    <UserCheck size={16} />
                    <span>Team Leader ({pendingExitTarget.leader_name})</span>
                  </button>
                  <button 
                    className={`scope-btn ${exitScope === 'member' ? 'selected' : ''}`}
                    onClick={() => setExitScope('member')}
                  >
                    <User size={16} />
                    <span>Specific Member</span>
                  </button>
                </div>

                {exitScope === 'member' && (
                  <div className="member-picker-subbox" style={{ marginTop: '12px' }}>
                    <div className="member-roster-options">
                      {getTeamRoster(pendingExitTarget).map((m, idx) => (
                        <button 
                          key={idx}
                          className={`member-option-chip ${selectedMemberName === m.name ? 'active' : ''}`}
                          onClick={() => setSelectedMemberName(m.name)}
                        >
                          <span>{m.role}: <strong>{m.name}</strong></span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-section-group">
                <label className="section-label">2. Select Reason for Exit:</label>
                <div className="reasons-selection-grid">
                  {MOVEMENT_REASONS.map(reason => {
                    const IconComp = reason.icon;
                    const isSelected = selectedReason === reason.id;
                    return (
                      <div 
                        key={reason.id}
                        className={`reason-card-choice ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedReason(reason.id);
                          setCustomMinutes(reason.defaultMins);
                        }}
                      >
                        <div className="reason-icon-circle" style={{ color: reason.color, background: reason.bg }}>
                          <IconComp size={18} />
                        </div>
                        <div className="reason-text-wrap">
                          <span className="reason-main-lbl">{reason.label}</span>
                          <span className="reason-time-hint">{reason.defaultMins} Mins Allowed</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="modal-section-group">
                <div className="time-allowance-row">
                  <label className="section-label">3. Time Allowed Outside:</label>
                  <div className="mins-stepper">
                    <button onClick={() => setCustomMinutes(m => Math.max(5, m - 5))}>-5m</button>
                    <span className="mins-val">{customMinutes} Minutes</span>
                    <button onClick={() => setCustomMinutes(m => m + 5)}>+5m</button>
                  </div>
                </div>
                <div className="expected-return-callout">
                  <Clock size={15} />
                  <span>Expected Return Time: <strong>{new Date(Date.now() + customMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                </div>
              </div>

              <div className="modal-section-group">
                <label className="section-label">
                  {selectedReason === 'other' ? 'Specify Your Custom Reason (Required):' : 'Optional Note / Destination Remark:'}
                </label>
                <input 
                  type="text" 
                  placeholder={selectedReason === 'other' ? 'e.g. Printing posters, Hardware lab purchase...' : 'e.g. Buying jumper wires from Lab, Heading to food court...'}
                  value={customNote}
                  onChange={e => setCustomNote(e.target.value)}
                  className="modal-note-input"
                />
              </div>

              <div className="modal-actions-bar">
                <button className="btn-cancel-exit" onClick={() => setPendingExitTarget(null)}>
                  Cancel
                </button>
                <button className="btn-confirm-exit" onClick={handleAuthorizeExit}>
                  <DoorOpen size={16} />
                  <span>Authorize Exit &amp; Issue Special Team Card</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 6: MASTER ADMIN AUTHENTICATION ================= */}
      {isAuthModalOpen && (
        <div className="inout-modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
          <div className="admin-auth-modal-card" onClick={e => e.stopPropagation()}>
            <div className="admin-auth-header">
              <ShieldAlert size={24} className="text-rose" />
              <h3>SIH Arena Master Admin Authorization</h3>
              <p>Enter Master Security Passcode to access override tools and live movement ledger.</p>
            </div>

            <form onSubmit={handleAdminLoginSubmit} className="admin-auth-form">
              <div className="admin-input-group">
                <label>Master Security Passcode</label>
                <input 
                  type="password" 
                  placeholder="Enter master passcode..."
                  value={adminPassInput}
                  onChange={e => { setAdminPassInput(e.target.value); setAdminPassError(''); }}
                  autoFocus
                  className="admin-pass-field"
                />
                {adminPassError && <span className="admin-error-text">{adminPassError}</span>}
              </div>

              <div className="admin-auth-btns">
                <button type="button" className="btn-auth-cancel" onClick={() => setIsAuthModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-auth-submit">
                  <Unlock size={14} />
                  <span>Authenticate Master Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
