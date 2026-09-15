import React, { useState, useEffect, useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  DoorOpen, DoorClosed, QrCode, Camera, Search, Clock, AlertTriangle, 
  CheckCircle2, XCircle, Utensils, Coffee, Bath, Wrench, Users, HeartPulse, 
  AlertCircle, Download, ArrowLeft, ArrowRight, UserCheck, ShieldCheck, 
  RotateCcw, Volume2, VolumeX, Sparkles, Filter, ExternalLink, Phone,
  User, Check, Flame, Printer, RefreshCw, Smartphone, KeyRound, Copy, Database,
  Lock, Unlock, ShieldAlert, Settings, Calendar, Bell, Plus, Trash2, Edit3
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { normalizeSchoolName } from '../data/sihMasterData';

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
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner' | 'active_out' | 'log' | 'team_passes' | 'kiosk' | 'master_admin'
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

  // Dynamic Rotating Gate Security Nonce (changes every 30 seconds to prevent replay attacks)
  const [dynamicSecurityToken, setDynamicSecurityToken] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [tokenSecondsRemaining, setTokenSecondsRemaining] = useState(30);

  // Current Break Window Status
  const [currentTimeStr, setCurrentTimeStr] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  // Camera QR Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const html5QrCodeRef = useRef(null);

  // Target team/member being checked out (Manual or Scan)
  const [pendingExitTarget, setPendingExitTarget] = useState(null);
  const [exitScope, setExitScope] = useState('team'); // 'team' | 'leader' | 'member' | 'custom'
  const [selectedMemberName, setSelectedMemberName] = useState('');
  const [customMemberInput, setCustomMemberInput] = useState('');

  // Self-Service Gate Pass Wizard Modal (when student scans pasted QR or clicks button)
  const [isSelfPassModalOpen, setIsSelfPassModalOpen] = useState(false);
  const [selfPassSearch, setSelfPassSearch] = useState('');
  const [selfPassSelectedTeam, setSelfPassSelectedTeam] = useState(null);

  // Special Generated Live Team Card Modal
  const [activeSpecialCard, setActiveSpecialCard] = useState(null);

  // Printable Gate Poster Modal (For printing physical pasted paper QR)
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);

  // Enlarge Team Pass Modal
  const [qrPassTeam, setQrPassTeam] = useState(null);

  // Filter for Team Passes Gallery
  const [gallerySearch, setGallerySearch] = useState('');
  const [galleryFilterTier, setGalleryFilterTier] = useState('ALL');

  // Persistent Movement State: Active Outs & History Logs
  const [activeOuts, setActiveOuts] = useState(() => {
    try {
      const saved = localStorage.getItem('sih_inout_active_outs');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [movementLogs, setMovementLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('sih_inout_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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

  // Live Clock Tick & Break Detection
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute Active Break Window
  const activeBreakInfo = useMemo(() => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    for (const b of COMMON_BREAK_WINDOWS) {
      const startMins = b.startHour * 60 + b.startMin;
      const endMins = b.endHour * 60 + b.endMin;
      if (currentMins >= startMins && currentMins <= endMins) {
        const remaining = endMins - currentMins;
        return {
          isActive: true,
          currentBreak: b,
          remainingMins: remaining,
          statusText: `ACTIVE: ${b.label} (${remaining}m remaining)`
        };
      }
    }

    // Find next break
    let nextBreak = null;
    let minDiff = 9999;
    for (const b of COMMON_BREAK_WINDOWS) {
      const startMins = b.startHour * 60 + b.startMin;
      if (startMins > currentMins && (startMins - currentMins) < minDiff) {
        minDiff = startMins - currentMins;
        nextBreak = b;
      }
    }

    return {
      isActive: false,
      nextBreak: nextBreak,
      minsUntilNext: minDiff < 9999 ? minDiff : null,
      statusText: nextBreak ? `Next Break: ${nextBreak.timeStr} (${minDiff}m)` : 'All Break Windows Concluded'
    };
  }, [currentTimeStr]);

  // Combined Active Registrations Map (combining props and live Supabase fetch)
  const activeRegistrationsMap = useMemo(() => {
    return { ...registrationsMap, ...liveDbRegistrations };
  }, [registrationsMap, liveDbRegistrations]);

  // Filtered Teams List: strictly only those who filled the form when onlySubmittedForms is true
  const displayedTeams = useMemo(() => {
    const list = allTeams.map(t => {
      const reg = activeRegistrationsMap[t.temp_team_id];
      if (reg) {
        return {
          ...t,
          isRegistered: true,
          team_name: reg.team_name || t.team_name,
          leader_name: reg.leader_name || t.leader_name,
          reg_no: reg.leader_reg_no || t.reg_no,
          ps_id: reg.sih_ps_id || reg.ps_id || t.ps_id,
          ps_title: reg.ps_title || t.ps_title,
          school: normalizeSchoolName(reg.leader_school || reg.leader_dept || t.school),
          mobile: reg.leader_phone || t.mobile,
          registered_at: reg.created_at || reg.updated_at,
          registration_data: reg
        };
      }
      return { ...t, isRegistered: !!t.isRegistered };
    });

    if (onlySubmittedForms) {
      return list.filter(t => t.isRegistered || !!activeRegistrationsMap[t.temp_team_id]);
    }
    return list;
  }, [allTeams, activeRegistrationsMap, onlySubmittedForms]);

  const submittedCount = useMemo(() => {
    return allTeams.filter(t => !!activeRegistrationsMap[t.temp_team_id] || t.isRegistered).length;
  }, [allTeams, activeRegistrationsMap]);

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('sih_inout_active_outs', JSON.stringify(activeOuts));
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }, [activeOuts]);

  useEffect(() => {
    try {
      localStorage.setItem('sih_inout_logs', JSON.stringify(movementLogs));
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }, [movementLogs]);

  // Rotating Security Nonce Timer (30s countdown)
  useEffect(() => {
    const timer = setInterval(() => {
      setTokenSecondsRemaining(prev => {
        if (prev <= 1) {
          setDynamicSecurityToken(Math.floor(100000 + Math.random() * 900000).toString());
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Audio Beep Synthesizer using Web Audio API
  const playBeep = (type = 'success') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'return') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // AudioContext unsupported
    }
  };

  // Camera QR Scanner Lifecycle
  useEffect(() => {
    if (isCameraActive) {
      const qrRegionId = 'qr-camera-reader-viewport';
      const html5QrCode = new Html5Qrcode(qrRegionId);
      html5QrCodeRef.current = html5QrCode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleScannedCode(decodedText);
        },
        () => {}
      ).catch(err => {
        setCameraError(err?.message || 'Could not access camera device');
        setIsCameraActive(false);
      });
    } else {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {}).finally(() => {
          html5QrCodeRef.current = null;
        });
      }
    }

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [isCameraActive]);

  // Handle a Scanned or Searched Code
  const handleScannedCode = (rawCode) => {
    if (!rawCode || typeof rawCode !== 'string') return;
    const clean = rawCode.trim().toUpperCase();

    // Match by Team ID or Register Number or Mobile or Name
    const team = displayedTeams.find(t => 
      t.temp_team_id.toUpperCase() === clean ||
      t.reg_no.toUpperCase() === clean ||
      t.mobile === clean ||
      clean.includes(t.temp_team_id.toUpperCase()) ||
      clean.includes(t.reg_no.toUpperCase())
    ) || allTeams.find(t => 
      t.temp_team_id.toUpperCase() === clean ||
      t.reg_no.toUpperCase() === clean ||
      t.mobile === clean ||
      clean.includes(t.temp_team_id.toUpperCase()) ||
      clean.includes(t.reg_no.toUpperCase())
    );

    if (!team) {
      playBeep('error');
      alert(`No verified team found matching QR / Code: "${rawCode}"`);
      return;
    }

    const teamId = team.temp_team_id;
    const isCurrentlyOut = !!activeOuts[teamId];

    if (isCurrentlyOut) {
      // Automatic IN Punch (Candidate returning to SIH Arena)
      handlePunchIn(teamId);
    } else {
      // Candidate wants to exit -> Open Exit Pass Form
      playBeep('success');
      setPendingExitTarget(team);
      setSelectedMemberName(team.leader_name);
      setExitScope('team');
      const rObj = MOVEMENT_REASONS.find(r => r.id === selectedReason);
      setCustomMinutes(rObj ? rObj.defaultMins : 60);
    }
  };

  // Perform OUT Punch & Generate Special Team Card
  const handleAuthorizeExit = () => {
    const targetTeam = pendingExitTarget || selfPassSelectedTeam;
    if (!targetTeam) return;

    const teamId = targetTeam.temp_team_id;
    const now = new Date();
    const returnExpected = new Date(now.getTime() + customMinutes * 60000);

    let memberDisplayName = '';
    if (exitScope === 'team') {
      memberDisplayName = `Entire Team (${targetTeam.team_name})`;
    } else if (exitScope === 'leader') {
      memberDisplayName = `Leader: ${targetTeam.leader_name} (${targetTeam.reg_no})`;
    } else if (exitScope === 'custom') {
      memberDisplayName = customMemberInput.trim() || targetTeam.leader_name;
    } else {
      memberDisplayName = selectedMemberName || targetTeam.leader_name;
    }

    const reasonObj = MOVEMENT_REASONS.find(r => r.id === selectedReason);
    const resolvedReasonLabel = selectedReason === 'other' 
      ? (customNote.trim() ? `Other: ${customNote.trim()}` : 'Official / Other Reason') 
      : (reasonObj?.label || 'Break');

    const passToken = `SEC-${Math.floor(100000 + Math.random() * 900000)}`;

    const outRecord = {
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
      [teamId]: outRecord
    }));

    playBeep('success');
    setPendingExitTarget(null);
    setIsSelfPassModalOpen(false);
    setSelfPassSelectedTeam(null);
    setCustomNote('');
    setCustomMemberInput('');

    // Open the Special Animated Live Team Card
    setActiveSpecialCard(outRecord);
  };

  // Perform IN Punch (Return to SIH Arena)
  const handlePunchIn = (teamId) => {
    const existing = activeOuts[teamId];
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
      status: 'RETURNED'
    };

    setActiveOuts(prev => {
      const copy = { ...prev };
      delete copy[teamId];
      return copy;
    });

    setMovementLogs(prev => [completedLog, ...prev]);

    if (activeSpecialCard && activeSpecialCard.team_id === teamId) {
      setActiveSpecialCard(null);
    }

    playBeep('return');
  };

  // Master Admin: Force Punch In for all currently outside teams
  const handleAdminBulkReturnAll = () => {
    if (!window.confirm(`Are you sure you want to mark all ${Object.keys(activeOuts).length} outside teams as Returned to SIH Arena?`)) return;
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
        custom_note: (existing.custom_note ? `${existing.custom_note} | ` : '') + '[Master Admin Bulk Return]',
        status: 'RETURNED'
      });
    });

    setActiveOuts({});
    setMovementLogs(prev => [...newLogs, ...prev]);
    playBeep('return');
  };

  // Master Admin: Extend pass time for a team
  const handleAdminExtendPass = (teamId, addMins = 15) => {
    const existing = activeOuts[teamId];
    if (!existing) return;

    const newExpectedMs = existing.expected_return_timestamp + addMins * 60000;
    const newExpectedStr = new Date(newExpectedMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setActiveOuts(prev => ({
      ...prev,
      [teamId]: {
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
      setActiveTab('master_admin');
    } else {
      setAdminPassError('Incorrect Master Admin Passcode. Access Denied.');
      playBeep('error');
    }
  };

  const handleAdminLogout = () => {
    setIsMasterAdminAuthenticated(false);
    sessionStorage.removeItem('sih_arena_master_auth');
    setActiveTab('scanner');
  };

  // Helper to extract full team roster (Leader + 5 members)
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

    // Members 2 to 6
    if (reg?.members && Array.isArray(reg.members)) {
      reg.members.forEach((m, idx) => {
        if (m.name && m.name.trim()) {
          members.push({
            role: `Member ${idx + 2}`,
            name: m.name,
            reg_no: m.reg_no || `RCAS-${team.temp_team_id}-${idx + 2}`,
            isLeader: false
          });
        }
      });
    }

    if (members.length === 1) {
      for (let i = 2; i <= 6; i++) {
        members.push({
          role: `Member ${i}`,
          name: `Team Member ${i}`,
          reg_no: `Roster Slot #${i}`,
          isPlaceholder: true
        });
      }
    }

    return members;
  };

  // Aggregate Metrics for SIH Arena (Calculated from Form-Submitted dataset)
  const metrics = useMemo(() => {
    const totalCount = displayedTeams.length;
    const currentlyOutCount = Object.keys(activeOuts).length;
    const insideVenueCount = Math.max(0, totalCount - currentlyOutCount);

    let overdueCount = 0;
    const now = Date.now();
    Object.values(activeOuts).forEach(out => {
      if (now > out.expected_return_timestamp) overdueCount++;
    });

    const lunchCount = movementLogs.filter(l => l.reason === 'lunch').length + Object.values(activeOuts).filter(o => o.reason === 'lunch').length;
    const teaCount = movementLogs.filter(l => l.reason === 'tea').length + Object.values(activeOuts).filter(o => o.reason === 'tea').length;

    return {
      totalTeams: totalCount,
      insideVenueCount,
      currentlyOutCount,
      overdueCount,
      lunchCount,
      teaCount
    };
  }, [displayedTeams, activeOuts, movementLogs]);

  // Export CSV Audit Log
  const handleExportCSV = () => {
    const headers = ['Log ID', 'Team ID', 'Team Name', 'Candidate / Scope', 'Register No', 'Phone', 'Reason', 'Out Time', 'In Time', 'Duration (Mins)', 'Overdue', 'Notes'];
    const rows = movementLogs.map((l, idx) => [
      `"LOG-${idx + 1}"`,
      `"${l.team_id}"`,
      `"${(l.team_name || '').replace(/"/g, '""')}"`,
      `"${(l.member_name || '').replace(/"/g, '""')}"`,
      `"${l.reg_no || ''}"`,
      `"${l.mobile || ''}"`,
      `"${l.reason_label || ''}"`,
      `"${l.out_time || ''}"`,
      `"${l.in_time || 'OUT'}"`,
      `"${l.duration_minutes || ''}"`,
      `"${l.is_overdue ? 'YES' : 'NO'}"`,
      `"${(l.custom_note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SIH_Arena_InOut_AuditLog_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Teams for Directory
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

  const gatewayUrl = `${window.location.origin}/#sih-arena-pass`;

  return (
    <div className="inout-portal-container">
      {/* Top Header Navigation */}
      <div className="inout-top-strip">
        <div className="inout-hall-badge">
          <DoorOpen size={16} className="text-orange" />
          <span>SIH ARENA • GATEWAY WORKPLACE</span>
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
              onClick={() => setActiveTab(activeTab === 'master_admin' ? 'scanner' : 'master_admin')}
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

          {/* Physical Poster Generator Button */}
          <button 
            className="btn-print-poster-trigger"
            onClick={() => setIsPosterModalOpen(true)}
            title="Print Physical Paper QR Poster to paste at SIH Arena Exit Doors"
          >
            <Printer size={14} />
            <span>Pasted Gate QR Poster</span>
          </button>

          {/* Self-Service Mobile Pass Generator */}
          <button 
            className="btn-self-pass-trigger"
            onClick={() => setIsSelfPassModalOpen(true)}
            title="Candidate Self-Service Gate Pass (Choose Team, Person & Reason)"
          >
            <Smartphone size={14} />
            <span>Generate Self Gate Pass</span>
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
          <span className="ticker-clock-display">{currentTimeStr}</span>
        </div>
      </div>

      {/* Hero Central Venue Status Banner */}
      <div className="inout-hero-banner">
        <div className="inout-hero-left">
          <div className="venue-live-status-tag">
            <span className="live-pulsing-dot"></span>
            <span>SIH ARENA • VERIFIED CANDIDATE GATE WORKPLACE</span>
          </div>
          <h1>SIH Arena Attendance &amp; Gate Pass Desk</h1>
          <p>
            Connected to <strong>Supabase Cloud Database</strong>. Viewing <strong>{submittedCount} verified teams who filled the official form</strong>. Candidates scan the pasted gateway QR or punch at the gate terminal to log Lunch, Tea, Restroom, Lab, and Custom reasons with live return alerts.
          </p>
        </div>

        <div className="inout-metrics-grid">
          <div className="inout-metric-card green">
            <div className="metric-icon-wrap emerald">
              <DoorClosed size={20} />
            </div>
            <div className="metric-details">
              <span className="metric-lbl">Inside SIH Arena</span>
              <div className="metric-num">{metrics.insideVenueCount} <span className="sub-num">/ {metrics.totalTeams} Teams</span></div>
              <span className="metric-desc">Stationed at Desks</span>
            </div>
          </div>

          <div className="inout-metric-card orange">
            <div className="metric-icon-wrap orange">
              <DoorOpen size={20} />
            </div>
            <div className="metric-details">
              <span className="metric-lbl">Currently Outside</span>
              <div className="metric-num">{metrics.currentlyOutCount}</div>
              <span className="metric-desc">Authorized Exit Passes</span>
            </div>
          </div>

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

          <div className="inout-metric-card amber">
            <div className="metric-icon-wrap amber">
              <Utensils size={20} />
            </div>
            <div className="metric-details">
              <span className="metric-lbl">Lunch / Break Passes</span>
              <div className="metric-num">{metrics.lunchCount}</div>
              <span className="metric-desc">Dining Tokens Logged</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Branch Navigation Tabs */}
      <div className="inout-nav-tabs">
        <button 
          className={`inout-tab-btn ${activeTab === 'scanner' ? 'active' : ''}`}
          onClick={() => setActiveTab('scanner')}
        >
          <QrCode size={16} />
          <span>Live Gate Scanner &amp; Quick Punch</span>
        </button>

        <button 
          className={`inout-tab-btn ${activeTab === 'kiosk' ? 'active' : ''}`}
          onClick={() => setActiveTab('kiosk')}
        >
          <RefreshCw size={16} />
          <span>Rotating Gate Terminal QR (Kiosk Mode)</span>
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
          className={`inout-tab-btn ${activeTab === 'log' ? 'active' : ''}`}
          onClick={() => setActiveTab('log')}
        >
          <Clock size={16} />
          <span>Movement History Log ({movementLogs.length})</span>
        </button>

        <button 
          className={`inout-tab-btn ${activeTab === 'team_passes' ? 'active' : ''}`}
          onClick={() => setActiveTab('team_passes')}
        >
          <Users size={16} />
          <span>Special Team Cards ({displayedTeams.length} Form-Filled Teams)</span>
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

      {/* ================= TAB 1: SCANNER & INSTANT PUNCH ================= */}
      {activeTab === 'scanner' && (
        <div className="inout-tab-pane">
          <div className="scanner-dual-layout">
            {/* Left Column: Fast Scanner & Search */}
            <div className="scanner-left-box">
              <div className="box-header-title">
                <QrCode size={18} className="text-orange" />
                <span>Gate Scanner &amp; Candidate Barcode Punch</span>
                <span className="badge-db-indicator">
                  <Database size={11} />
                  <span>{displayedTeams.length} Teams Loaded</span>
                </span>
              </div>

              {/* Fast Keyboard / Barcode Scanner Input */}
              <form 
                onSubmit={(e) => { e.preventDefault(); handleScannedCode(searchQuery); setSearchQuery(''); }}
                className="scanner-fast-input-form"
              >
                <div className="fast-input-container">
                  <Search size={18} className="input-search-icon" />
                  <input 
                    type="text" 
                    placeholder="Scan Barcode / Type Team ID (e.g. SIH26-TM-051), Leader Reg No, or Name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                    className="scanner-main-input"
                  />
                  <button type="submit" className="btn-punch-execute">
                    <span>Punch Gate</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </form>

              {/* Actions Strip: Camera Scanner & Mobile Pass */}
              <div className="camera-scan-controller">
                <button 
                  className={`btn-camera-toggle ${isCameraActive ? 'active-stop' : ''}`}
                  onClick={() => setIsCameraActive(!isCameraActive)}
                >
                  <Camera size={16} />
                  <span>{isCameraActive ? 'Stop Camera Video Scanner' : 'Launch Camera Video Scanner'}</span>
                </button>

                <button 
                  className="btn-open-self-pass"
                  onClick={() => setIsSelfPassModalOpen(true)}
                >
                  <Smartphone size={16} />
                  <span>Open Self-Service Gate Pass</span>
                </button>
              </div>

              {cameraError && <div className="camera-error-msg">{cameraError}</div>}

              {/* Camera Video Viewport */}
              {isCameraActive && (
                <div className="camera-viewport-card">
                  <div id="qr-camera-reader-viewport" className="qr-viewport-feed"></div>
                  <div className="camera-guide-overlay">
                    <span>Align Candidate QR Badge in box to scan</span>
                  </div>
                </div>
              )}

              {/* Quick Candidates Search Results */}
              <div className="quick-candidate-picker">
                <div className="picker-title">
                  Click candidate to issue pass / punch return ({displayedTeams.length} form-submitted teams):
                </div>
                <div className="candidate-pill-scroll">
                  {displayedTeams.slice(0, 24).map(team => {
                    const isOut = !!activeOuts[team.temp_team_id];
                    return (
                      <div 
                        key={team.temp_team_id}
                        className={`candidate-quick-pill ${isOut ? 'pill-out' : 'pill-in'}`}
                        onClick={() => handleScannedCode(team.temp_team_id)}
                      >
                        <div className="pill-left">
                          <span className="pill-team-id">{team.temp_team_id}</span>
                          <span className="pill-team-name">{team.team_name}</span>
                          <span className="pill-leader">{team.leader_name}</span>
                        </div>
                        <div className="pill-right">
                          <span className={`pill-status-dot ${isOut ? 'out' : 'in'}`}></span>
                          <span className="pill-action-text">{isOut ? 'Punch IN' : 'Punch OUT'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Live Active Outs Radar */}
            <div className="scanner-right-box">
              <div className="box-header-title">
                <DoorOpen size={18} className="text-orange" />
                <span>Live Active Outs ({Object.keys(activeOuts).length} Outside)</span>
              </div>

              {Object.keys(activeOuts).length === 0 ? (
                <div className="empty-outs-box">
                  <CheckCircle2 size={42} className="text-emerald" />
                  <h3>All Teams Inside SIH Arena</h3>
                  <p>Zero active exit gate passes. All registered innovators are currently stationed in the hackathon hall.</p>
                </div>
              ) : (
                <div className="live-outs-feed-list">
                  {Object.values(activeOuts).map(out => {
                    const now = Date.now();
                    const isOverdue = now > out.expected_return_timestamp;
                    const elapsedMins = Math.max(1, Math.round((now - out.out_timestamp) / 60000));
                    const remainingMins = Math.round((out.expected_return_timestamp - now) / 60000);

                    return (
                      <div key={out.team_id} className={`active-out-card ${isOverdue ? 'card-overdue' : ''}`}>
                        <div className="card-top-row">
                          <div className="card-team-id">{out.team_id}</div>
                          <span className={`card-badge-reason ${out.reason}`}>
                            {out.reason_label}
                          </span>
                        </div>

                        <div className="card-team-title">{out.team_name}</div>
                        <div className="card-person-name">
                          <User size={13} />
                          <span>{out.member_name}</span>
                        </div>

                        <div className="card-time-stats">
                          <div className="stat-time-pill">
                            <span>Left at: <strong>{out.out_time}</strong></span>
                          </div>
                          <div className="stat-time-pill">
                            <span>Expected: <strong>{out.expected_return_time}</strong></span>
                          </div>
                        </div>

                        <div className="card-timer-status">
                          {isOverdue ? (
                            <span className="overdue-tag">
                              <AlertTriangle size={13} />
                              <span>OVERDUE by {Math.abs(remainingMins)} mins (Out for {elapsedMins}m)</span>
                            </span>
                          ) : (
                            <span className="ontime-tag">
                              <Clock size={13} />
                              <span>{remainingMins} mins remaining (Out for {elapsedMins}m)</span>
                            </span>
                          )}
                        </div>

                        {out.custom_note && (
                          <div className="card-note-box">
                            <strong>Note:</strong> {out.custom_note}
                          </div>
                        )}

                        <div className="card-footer-actions">
                          <button 
                            className="btn-card-special-view"
                            onClick={() => setActiveSpecialCard(out)}
                          >
                            <QrCode size={13} />
                            <span>View Digital Card</span>
                          </button>

                          <button 
                            className="btn-card-punch-in"
                            onClick={() => handlePunchIn(out.team_id)}
                          >
                            <Check size={14} />
                            <span>Return to Arena</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: ROTATING GATE TERMINAL QR (KIOSK MODE) ================= */}
      {activeTab === 'kiosk' && (
        <div className="inout-tab-pane">
          <div className="kiosk-terminal-card">
            <div className="kiosk-header">
              <span className="kiosk-badge-live">LIVE ROTATING GATEWAY TERMINAL</span>
              <h2>SIH Arena Physical Exit Kiosk</h2>
              <p>Display this screen at physical venue exit doors or tablets. The security QR code automatically rotates every 30 seconds with cryptographic nonce tokens to prevent screenshot spoofing.</p>
            </div>

            <div className="kiosk-qr-center-box">
              <div className="kiosk-qr-frame">
                <QRCodeSVG 
                  value={`${gatewayUrl}?token=${dynamicSecurityToken}&time=${Date.now()}`}
                  size={240} 
                  level="H" 
                  includeMargin={true} 
                />
                <div className="kiosk-token-badge">
                  <KeyRound size={14} />
                  <span>Security Token: <strong>#{dynamicSecurityToken}</strong></span>
                </div>
              </div>

              <div className="kiosk-timer-bar">
                <div className="timer-text">
                  <RefreshCw size={14} className="spin-slow" />
                  <span>QR Nonce Rotates in <strong>{tokenSecondsRemaining}s</strong></span>
                </div>
                <div className="timer-progress-track">
                  <div 
                    className="timer-progress-fill" 
                    style={{ width: `${(tokenSecondsRemaining / 30) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="kiosk-instructions-grid">
              <div className="kiosk-instruction-step">
                <div className="step-num">1</div>
                <h4>Scan with Phone Camera</h4>
                <p>Candidate points any smartphone camera at the QR code to open the self-service gate pass.</p>
              </div>

              <div className="kiosk-instruction-step">
                <div className="step-num">2</div>
                <h4>Select Form-Filled Team</h4>
                <p>Choose your Team Name ({submittedCount} verified teams in Supabase) and specify who is exiting.</p>
              </div>

              <div className="kiosk-instruction-step">
                <div className="step-num">3</div>
                <h4>Pick Reason &amp; Get Card</h4>
                <p>Select Lunch, Tea, Restroom, Lab, Mentor, Medical, or Custom Reason to generate your Special Team Card.</p>
              </div>
            </div>

            <div className="kiosk-footer-actions">
              <button className="btn-kiosk-self-pass" onClick={() => setIsSelfPassModalOpen(true)}>
                <Smartphone size={16} />
                <span>Simulate Candidate Mobile Scan</span>
              </button>
              <button className="btn-kiosk-print-poster" onClick={() => setIsPosterModalOpen(true)}>
                <Printer size={16} />
                <span>Print Physical Paper Gate Poster</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: CURRENTLY OUTSIDE ================= */}
      {activeTab === 'active_out' && (
        <div className="inout-tab-pane">
          <div className="active-outs-table-card">
            <div className="table-top-bar-flex">
              <div className="table-title">
                <h3>Currently Outside SIH Arena ({Object.keys(activeOuts).length} Active Passes)</h3>
              </div>
              <div className="top-bar-actions-right">
                {isMasterAdminAuthenticated && Object.keys(activeOuts).length > 0 && (
                  <button className="btn-admin-force-return" onClick={handleAdminBulkReturnAll}>
                    <CheckCircle2 size={14} />
                    <span>Master Bulk Return All</span>
                  </button>
                )}
                <button className="btn-export-small" onClick={handleExportCSV}>
                  <Download size={13} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {Object.keys(activeOuts).length === 0 ? (
              <div className="empty-outs-box">
                <CheckCircle2 size={42} className="text-emerald" />
                <h3>All Teams Inside SIH Arena</h3>
                <p>Zero active exit gate passes. All candidates are present inside the hackathon hall.</p>
              </div>
            ) : (
              <div className="table-responsive-box">
                <table className="inout-data-table">
                  <thead>
                    <tr>
                      <th>Team ID</th>
                      <th>Team Name</th>
                      <th>Person / Scope</th>
                      <th>Reason</th>
                      <th>Out Time</th>
                      <th>Expected Return</th>
                      <th>Status &amp; Timer</th>
                      <th>Contact</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(activeOuts).map(out => {
                      const now = Date.now();
                      const isOverdue = now > out.expected_return_timestamp;
                      const elapsedMins = Math.max(1, Math.round((now - out.out_timestamp) / 60000));
                      const remainingMins = Math.round((out.expected_return_timestamp - now) / 60000);

                      return (
                        <tr key={out.team_id} className={isOverdue ? 'row-overdue' : ''}>
                          <td><code>{out.team_id}</code></td>
                          <td><strong>{out.team_name}</strong></td>
                          <td>{out.member_name}</td>
                          <td>
                            <span className={`reason-pill-tag ${out.reason}`}>
                              {out.reason_label}
                            </span>
                          </td>
                          <td>{out.out_time}</td>
                          <td><strong>{out.expected_return_time}</strong></td>
                          <td>
                            {isOverdue ? (
                              <span className="badge-overdue">
                                OVERDUE by {Math.abs(remainingMins)}m (Out {elapsedMins}m)
                              </span>
                            ) : (
                              <span className="badge-ontime">
                                {remainingMins}m left (Out {elapsedMins}m)
                              </span>
                            )}
                          </td>
                          <td>
                            {out.mobile ? (
                              <a href={`tel:${out.mobile}`} className="phone-link">
                                <Phone size={13} />
                                <span>{out.mobile}</span>
                              </a>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td>
                            <div className="table-actions-cell">
                              {isMasterAdminAuthenticated && (
                                <button 
                                  className="btn-table-extend"
                                  onClick={() => handleAdminExtendPass(out.team_id, 15)}
                                  title="Extend Pass by +15 mins"
                                >
                                  +15m
                                </button>
                              )}
                              <button 
                                className="btn-table-special-card"
                                onClick={() => setActiveSpecialCard(out)}
                                title="View Live Special Team Card"
                              >
                                <QrCode size={13} />
                              </button>
                              <button 
                                className="btn-table-punch-in"
                                onClick={() => handlePunchIn(out.team_id)}
                              >
                                Return
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 4: MOVEMENT HISTORY LOG ================= */}
      {activeTab === 'log' && (
        <div className="inout-tab-pane">
          <div className="active-outs-table-card">
            <div className="table-top-bar-flex">
              <div className="table-title">
                <h3>Chronological Movement &amp; Gate Audit Ledger ({movementLogs.length} Total Logs)</h3>
              </div>
              <button className="btn-export-small" onClick={handleExportCSV}>
                <Download size={13} />
                <span>Export CSV Audit Log</span>
              </button>
            </div>

            {movementLogs.length === 0 ? (
              <div className="empty-outs-box">
                <Clock size={42} className="text-slate" />
                <h3>No Movement History Yet</h3>
                <p>Exit and return logs will automatically record here as candidates scan their badges.</p>
              </div>
            ) : (
              <div className="table-responsive-box">
                <table className="inout-data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Team ID</th>
                      <th>Team Name</th>
                      <th>Candidate / Scope</th>
                      <th>Reason</th>
                      <th>Out Time</th>
                      <th>In Time</th>
                      <th>Total Duration</th>
                      <th>Audit Status</th>
                      <th>Token</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movementLogs.map((log, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td><code>{log.team_id}</code></td>
                        <td><strong>{log.team_name}</strong></td>
                        <td>{log.member_name}</td>
                        <td>
                          <span className={`reason-pill-tag ${log.reason}`}>
                            {log.reason_label}
                          </span>
                        </td>
                        <td>{log.out_time}</td>
                        <td>{log.in_time}</td>
                        <td>
                          <strong>{log.duration_minutes} Mins</strong>
                        </td>
                        <td>
                          {log.is_overdue ? (
                            <span className="badge-overdue">Exceeded Time</span>
                          ) : (
                            <span className="badge-on-time">On-Time Return</span>
                          )}
                        </td>
                        <td>
                          <code className="token-code">{log.security_token || 'SEC-VERIFIED'}</code>
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

      {/* ================= TAB 5: SPECIAL TEAM CARDS DIRECTORY ================= */}
      {activeTab === 'team_passes' && (
        <div className="inout-tab-pane">
          {/* Filter Bar */}
          <div className="gallery-filter-bar">
            <div className="gallery-search-box">
              <Search size={16} />
              <input 
                type="text" 
                placeholder={`Search ${displayedTeams.length} Form-Filled Teams by ID, Name, Leader, Reg No, PS ID...`} 
                value={gallerySearch}
                onChange={e => setGallerySearch(e.target.value)}
                className="gallery-search-input"
              />
              {gallerySearch && (
                <button className="btn-clear-filter" onClick={() => setGallerySearch('')}>Clear</button>
              )}
            </div>

            <div className="gallery-tier-pills">
              {['ALL', 'Shortlist', 'Bench', 'Waitlist'].map(tier => (
                <button 
                  key={tier}
                  className={`gallery-tier-btn ${galleryFilterTier === tier ? 'active' : ''}`}
                  onClick={() => setGalleryFilterTier(tier)}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          <div className="special-team-cards-grid">
            {filteredGalleryTeams.map(team => {
              const isOut = !!activeOuts[team.temp_team_id];
              const activeOutData = activeOuts[team.temp_team_id];
              const roster = getTeamRoster(team);

              return (
                <div key={team.temp_team_id} className={`special-team-card ${isOut ? 'card-is-out' : 'card-is-in'}`}>
                  <div className="card-header-strip">
                    <div className="card-team-code">{team.temp_team_id}</div>
                    <span className={`tier-badge ${team.status.toLowerCase()}`}>
                      {team.status} • Rank #{team.rank}
                    </span>
                  </div>

                  <div className="card-main-content">
                    <div className="card-qr-box" onClick={() => setQrPassTeam(team)}>
                      <QRCodeSVG 
                        value={`${team.temp_team_id}|${team.leader_name}|${team.ps_id}|SIH2026`} 
                        size={100} 
                        level="H" 
                        includeMargin={true} 
                      />
                      <span className="qr-enlarge-hint">Tap to enlarge</span>
                    </div>

                    <div className="card-meta-details">
                      <h3 className="card-team-title">{team.team_name}</h3>
                      <div className="card-ps-badge">
                        <span>PS ID: <strong>{team.ps_id}</strong></span>
                      </div>
                      <p className="card-school-name">{team.school}</p>
                      <p className="card-leader-name">
                        <strong>Leader:</strong> {team.leader_name} <code>({team.reg_no})</code>
                      </p>
                    </div>
                  </div>

                  {/* Team Roster Chips */}
                  <div className="card-roster-preview">
                    <div className="roster-title">Verified Team Roster (from Supabase Form):</div>
                    <div className="roster-chips-wrap">
                      {roster.map((m, idx) => (
                        <span key={idx} className={`roster-chip ${m.isLeader ? 'chip-leader' : ''}`}>
                          {m.isLeader ? '[Leader] ' : ''}{m.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Live Movement State */}
                  <div className="card-status-banner">
                    {isOut ? (
                      <div className="status-out-details">
                        <div className="out-lbl">OUTSIDE SIH ARENA</div>
                        <div className="out-reason-sub">{activeOutData.reason_label} • Left {activeOutData.out_time}</div>
                      </div>
                    ) : (
                      <div className="status-in-details">
                        <div className="in-lbl">INSIDE SIH ARENA</div>
                        <div className="in-venue-sub">Stationed at Hackathon Desks</div>
                      </div>
                    )}
                  </div>

                  {/* Quick Card Action Buttons */}
                  <div className="card-bottom-actions">
                    {isOut ? (
                      <>
                        <button 
                          className="btn-card-action-view"
                          onClick={() => setActiveSpecialCard(activeOutData)}
                        >
                          <QrCode size={14} />
                          <span>View Live Card</span>
                        </button>
                        <button 
                          className="btn-card-action-return"
                          onClick={() => handlePunchIn(team.temp_team_id)}
                        >
                          <Check size={14} />
                          <span>Punch Return</span>
                        </button>
                      </>
                    ) : (
                      <button 
                        className="btn-card-action-issue"
                        onClick={() => {
                          setPendingExitTarget(team);
                          setSelectedMemberName(team.leader_name);
                          setExitScope('team');
                          const rObj = MOVEMENT_REASONS.find(r => r.id === selectedReason);
                          setCustomMinutes(rObj ? rObj.defaultMins : 60);
                        }}
                      >
                        <DoorOpen size={14} />
                        <span>Issue Exit Gate Pass</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 6: MASTER ADMIN CONTROLS ================= */}
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

            {/* Quick Action Cards Grid */}
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

            {/* Live Movement State Breakdown */}
            <div className="admin-breakdown-section">
              <h3>Currently Active Out Passes ({Object.keys(activeOuts).length})</h3>
              {Object.keys(activeOuts).length === 0 ? (
                <div className="admin-empty-callout">Zero active out passes. All teams inside the arena.</div>
              ) : (
                <div className="admin-active-outs-list">
                  {Object.values(activeOuts).map(out => (
                    <div key={out.team_id} className="admin-out-row">
                      <div className="row-col-main">
                        <strong>{out.team_id}</strong> - {out.team_name} ({out.member_name})
                        <span className="admin-reason-pill">{out.reason_label}</span>
                      </div>
                      <div className="row-col-times">
                        <span>Left: {out.out_time}</span>
                        <span>Return Due: {out.expected_return_time}</span>
                      </div>
                      <div className="row-col-actions">
                        <button className="btn-admin-extend-chip" onClick={() => handleAdminExtendPass(out.team_id, 15)}>
                          +15m
                        </button>
                        <button className="btn-admin-extend-chip" onClick={() => handleAdminExtendPass(out.team_id, 30)}>
                          +30m
                        </button>
                        <button className="btn-admin-return-chip" onClick={() => handlePunchIn(out.team_id)}>
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

      {/* ================= MODAL 1: PHYSICAL PASTED PAPER GATE POSTER ================= */}
      {isPosterModalOpen && (
        <div className="inout-modal-overlay" onClick={() => setIsPosterModalOpen(false)}>
          <div className="poster-modal-card" onClick={e => e.stopPropagation()}>
            <div className="poster-modal-toolbar">
              <span className="toolbar-title">Physical Venue Gate Poster (Print &amp; Paste at Arena Doors)</span>
              <div className="toolbar-btns">
                <button className="btn-print-action" onClick={() => window.print()}>
                  <Printer size={15} />
                  <span>Print Poster</span>
                </button>
                <button className="btn-close-modal" onClick={() => setIsPosterModalOpen(false)}>✕</button>
              </div>
            </div>

            {/* The Printable Poster Canvas */}
            <div className="printable-gate-poster">
              <div className="poster-header-logos">
                <img src="/logos/sih_moe_aicte_logo.png" alt="MoE AICTE SIH" className="poster-moe-logo" />
                <div className="poster-divider"></div>
                <img src="/logos/rathinam_rgu_logo.png" alt="Rathinam Global University" className="poster-rgu-logo" />
              </div>

              <div className="poster-badge-top">OFFICIAL SIH 2026 CENTRAL HACKATHON ARENA</div>
              <h1 className="poster-headline">SIH ARENA GATE PASS &amp; ATTENDANCE TERMINAL</h1>
              <p className="poster-subheadline">Common Venue Movement Tracking • Section 65B Electronic Proof Ledger</p>

              <div className="poster-qr-container">
                <QRCodeSVG 
                  value={gatewayUrl}
                  size={260} 
                  level="H" 
                  includeMargin={true} 
                />
                <div className="poster-scan-callout">
                  <span>SCAN WITH ANY SMARTPHONE CAMERA</span>
                </div>
              </div>

              <div className="poster-steps-grid">
                <div className="poster-step-item">
                  <div className="step-circle">1</div>
                  <div className="step-text">
                    <strong>Scan QR Code</strong>
                    <span>Open the official Gate Pass portal on your phone</span>
                  </div>
                </div>

                <div className="poster-step-item">
                  <div className="step-circle">2</div>
                  <div className="step-text">
                    <strong>Select Form-Filled Team</strong>
                    <span>Choose Entire Team, Leader, or Specific Member</span>
                  </div>
                </div>

                <div className="poster-step-item">
                  <div className="step-circle">3</div>
                  <div className="step-text">
                    <strong>Pick Reason &amp; Show Card</strong>
                    <span>Lunch, Tea, Restroom, Lab, Mentor, or Custom Reason</span>
                  </div>
                </div>
              </div>

              <div className="poster-footer-note">
                <p>All candidates must show their generated Special Digital Team Card at the physical gate and punch Return upon entering.</p>
                <div className="poster-legal-stamp">Rathinam Global University • Campus Evaluation Authority</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: CANDIDATE SELF-SERVICE GATE PASS WIZARD ================= */}
      {isSelfPassModalOpen && (
        <div className="inout-modal-overlay" onClick={() => setIsSelfPassModalOpen(false)}>
          <div className="self-pass-modal-card" onClick={e => e.stopPropagation()}>
            <div className="self-pass-header">
              <div className="header-title-left">
                <Smartphone size={20} className="text-orange" />
                <div>
                  <h2>Candidate Exit Gate Pass Generator</h2>
                  <p>Step-by-step self-service pass for SIH Arena break / movement</p>
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setIsSelfPassModalOpen(false)}>✕</button>
            </div>

            <div className="self-pass-body">
              {/* Step 1: Choose Team */}
              <div className="wizard-step-box">
                <label className="wizard-step-label">
                  <span className="step-badge">Step 1</span>
                  <span>Select Your Team ({displayedTeams.length} Form-Filled Teams):</span>
                </label>

                <div className="wizard-search-container">
                  <Search size={16} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search by Team Name, Temp ID (e.g. SIH26-TM-051), Leader Name, or Reg No..."
                    value={selfPassSearch}
                    onChange={e => setSelfPassSearch(e.target.value)}
                    className="wizard-search-input"
                  />
                  {selfPassSearch && (
                    <button className="btn-clear-search" onClick={() => setSelfPassSearch('')}>Clear</button>
                  )}
                </div>

                {selfPassSelectedTeam ? (
                  <div className="selected-team-card-banner">
                    <div className="team-banner-left">
                      <div className="team-code">{selfPassSelectedTeam.temp_team_id}</div>
                      <div className="team-name">{selfPassSelectedTeam.team_name}</div>
                      <div className="team-leader">Leader: {selfPassSelectedTeam.leader_name} ({selfPassSelectedTeam.reg_no})</div>
                      <div className="team-school">{selfPassSelectedTeam.school}</div>
                    </div>
                    <button 
                      className="btn-change-team"
                      onClick={() => setSelfPassSelectedTeam(null)}
                    >
                      Change Team
                    </button>
                  </div>
                ) : (
                  <div className="team-selection-scroll-list">
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
                      .slice(0, 12)
                      .map(team => (
                        <div 
                          key={team.temp_team_id} 
                          className="team-select-pill-row"
                          onClick={() => {
                            setSelfPassSelectedTeam(team);
                            setSelectedMemberName(team.leader_name);
                          }}
                        >
                          <div className="pill-code">{team.temp_team_id}</div>
                          <div className="pill-name">{team.team_name}</div>
                          <div className="pill-leader">{team.leader_name}</div>
                          <button className="btn-select-team-action">Select</button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {selfPassSelectedTeam && (
                <>
                  {/* Step 2: Choose Who is Going Out */}
                  <div className="wizard-step-box">
                    <label className="wizard-step-label">
                      <span className="step-badge">Step 2</span>
                      <span>Who is leaving the SIH Arena?</span>
                    </label>

                    <div className="scope-selection-grid">
                      <div 
                        className={`scope-choice-card ${exitScope === 'team' ? 'selected' : ''}`}
                        onClick={() => setExitScope('team')}
                      >
                        <Users size={18} />
                        <div>
                          <strong>Entire Team (All 6 Members)</strong>
                          <p>All team members leaving together</p>
                        </div>
                      </div>

                      <div 
                        className={`scope-choice-card ${exitScope === 'leader' ? 'selected' : ''}`}
                        onClick={() => {
                          setExitScope('leader');
                          setSelectedMemberName(selfPassSelectedTeam.leader_name);
                        }}
                      >
                        <UserCheck size={18} />
                        <div>
                          <strong>Team Leader ({selfPassSelectedTeam.leader_name})</strong>
                          <p>Leader only exiting</p>
                        </div>
                      </div>

                      <div 
                        className={`scope-choice-card ${exitScope === 'member' ? 'selected' : ''}`}
                        onClick={() => setExitScope('member')}
                      >
                        <User size={18} />
                        <div>
                          <strong>Specific Team Member</strong>
                          <p>Choose from registered roster or enter name</p>
                        </div>
                      </div>
                    </div>

                    {exitScope === 'member' && (
                      <div className="member-picker-subbox">
                        <label className="sub-label">Select Member from Verified Roster:</label>
                        <div className="member-roster-options">
                          {getTeamRoster(selfPassSelectedTeam).map((m, idx) => (
                            <button 
                              key={idx}
                              className={`member-option-chip ${selectedMemberName === m.name ? 'active' : ''}`}
                              onClick={() => {
                                setSelectedMemberName(m.name);
                                setExitScope('member');
                              }}
                            >
                              <span>{m.role}: <strong>{m.name}</strong></span>
                            </button>
                          ))}
                        </div>

                        <div className="custom-member-entry">
                          <label className="sub-label">Or Type Custom Member Name:</label>
                          <input 
                            type="text" 
                            placeholder="Enter full name of candidate leaving..." 
                            value={customMemberInput}
                            onChange={e => {
                              setCustomMemberInput(e.target.value);
                              setExitScope('custom');
                            }}
                            className="custom-member-input"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 3: Choose Reason */}
                  <div className="wizard-step-box">
                    <label className="wizard-step-label">
                      <span className="step-badge">Step 3</span>
                      <span>Select Reason for Exit:</span>
                    </label>

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

                    {/* If 'other' or custom note */}
                    <div className="custom-reason-note-box">
                      <label className="sub-label">
                        {selectedReason === 'other' ? 'Specify Your Custom Reason (Required):' : 'Optional Destination Remarks / Notes:'}
                      </label>
                      <input 
                        type="text" 
                        placeholder={selectedReason === 'other' ? 'e.g. Going to Hardware Shop for Arduino, Meeting Mentor at Admin Block...' : 'e.g. Dining Hall Token #42, Component lab visit...'}
                        value={customNote}
                        onChange={e => setCustomNote(e.target.value)}
                        className="modal-note-input"
                      />
                    </div>

                    {/* Time Stepper */}
                    <div className="time-allowance-box">
                      <div className="time-allowance-row">
                        <label className="sub-label">Expected Time Outside:</label>
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
                  </div>

                  {/* Step 4: Authorize & Generate Card */}
                  <div className="wizard-action-footer">
                    <button className="btn-cancel-exit" onClick={() => setIsSelfPassModalOpen(false)}>
                      Cancel
                    </button>
                    <button className="btn-generate-special-card" onClick={handleAuthorizeExit}>
                      <Sparkles size={16} />
                      <span>Issue Pass &amp; Generate Special Team Card</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: SPECIAL LIVE DIGITAL TEAM CARD ================= */}
      {activeSpecialCard && (
        <div className="inout-modal-overlay" onClick={() => setActiveSpecialCard(null)}>
          <div className="special-card-modal-canvas" onClick={e => e.stopPropagation()}>
            <div className="special-card-ticket">
              {/* Ticket Top Strip */}
              <div className="ticket-top-header">
                <div className="ticket-org-brand">
                  <img src="/logos/sih_moe_aicte_logo.png" alt="SIH" className="ticket-mini-logo" />
                  <div className="brand-text">
                    <span className="brand-sih">SMART INDIA HACKATHON 2026</span>
                    <span className="brand-rgu">Rathinam Global University • Campus Evaluation Authority</span>
                  </div>
                </div>
                <div className="ticket-token-pill">
                  <KeyRound size={12} />
                  <span>{activeSpecialCard.security_token || 'SEC-VERIFIED'}</span>
                </div>
              </div>

              {/* Status Header */}
              <div className="ticket-status-bar">
                <div className="status-live-pill">
                  <span className="live-dot"></span>
                  <span>ACTIVE EXIT GATE PASS</span>
                </div>
                <div className="venue-name-tag">SIH Arena</div>
              </div>

              {/* Main Ticket Details */}
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

                  {activeSpecialCard.custom_note && (
                    <div className="ticket-remarks-box">
                      <strong>Remarks:</strong> {activeSpecialCard.custom_note}
                    </div>
                  )}
                </div>
              </div>

              {/* Cutout Divider Line */}
              <div className="ticket-cutout-divider">
                <div className="cutout-circle left"></div>
                <div className="cutout-dash-line"></div>
                <div className="cutout-circle right"></div>
              </div>

              {/* Ticket Footer Action */}
              <div className="ticket-footer-action">
                <div className="ticket-footer-left">
                  <p>Show this Special Digital Card to Security Guards at the SIH Arena Exit Gate.</p>
                </div>
                <div className="ticket-footer-btns">
                  <button 
                    className="btn-ticket-punch-return"
                    onClick={() => handlePunchIn(activeSpecialCard.team_id)}
                  >
                    <CheckCircle2 size={16} />
                    <span>Punch Return to Arena</span>
                  </button>
                  <button 
                    className="btn-ticket-close"
                    onClick={() => setActiveSpecialCard(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
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

      {/* ================= MODAL 5: AUTHORIZE EXIT GATE PASS (FROM SCANNER OR CARD) ================= */}
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
              {/* Who is leaving? */}
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

              {/* Reason for exit */}
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

              {/* Time allowed adjustment */}
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

              {/* Note / Remarks / Custom Reason */}
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

              {/* Authorize Action Button */}
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
