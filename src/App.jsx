import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from './components/Navbar.jsx';
import RegistrationModal from './components/RegistrationModal.jsx';
import PasscodeModal from './components/PasscodeModal.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import TeamDetailsModal from './components/TeamDetailsModal.jsx';
import GrandLandingShowcase from './components/GrandLandingShowcase.jsx';
import FlowerConfettiRain from './components/FlowerConfettiRain.jsx';
import MidnightCountdownBanner from './components/MidnightCountdownBanner.jsx';
import PortalClosedView from './components/PortalClosedView.jsx';
import PortalTimerModal from './components/PortalTimerModal.jsx';
import InOutAttendancePortal from './components/InOutAttendancePortal.jsx';
import EvaluationQueuePortal, { DEFAULT_EVALUATION_PANELS } from './components/EvaluationQueuePortal.jsx';
import JuryStationPortal from './components/JuryStationPortal.jsx';
import AdminGatewayModal from './components/AdminGatewayModal.jsx';
import { MASTER_TEAMS, normalizeSchoolName } from './data/sihMasterData.js';
import { supabase } from './supabaseClient.js';
import { 
  Search, ArrowUpDown, UserCheck, ShieldCheck, Sparkles, Filter, Award, 
  ArrowRight, Lock, Unlock, CheckCircle2, Home, ArrowLeft, Building2, DoorOpen
} from 'lucide-react';
import './App.css';

// Strictly finalized 110 teams from Excel (80 Shortlist + 10 Bench + 20 Waitlist)
const FINALIZED_MASTER_TEAMS = MASTER_TEAMS.filter(t => 
  ['Shortlist', 'Bench', 'Waitlist'].includes(t.status)
);

export default function App() {
  // Subbranch Routing:
  // Root URL ('/') -> 'landing' (Official Shortlist & Selection Announcement Portal)
  // '/arena' or '#arena' -> 'inout_portal' (SIH Arena In-Out Gate Pass & Movement Workplace)
  // '/queue', '/eval', '#queue', '#eval' -> 'eval_queue' (Digital Queue & Live Multi-Panel Evaluation)
  // '/jury', '#jury', '?view=jury' -> 'jury_station' (Standalone Dedicated Jury Station & Workspace)
  // '/desk' or '#desk' -> 'candidate_desk'
  // '/admin' or '#admin' -> 'admin'
  const [currentView, setCurrentView] = useState(() => {
    try {
      const pathname = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      // Check for standalone jury station page (strictly isolated)
      if (pathname.includes('/jury') || search.includes('jury') || hash.includes('jury')) {
        return 'jury_station';
      }
      // Only open inout_portal if scanning a candidate QR code (?action=out or ?action=in)
      if (search.includes('action=out') || search.includes('action=in') || hash.includes('action=out') || hash.includes('action=in')) {
        return 'inout_portal';
      }
      // Check for arena inout workplace
      if (pathname.includes('/arena') || pathname.includes('/inout') || search.includes('arena') || hash.includes('arena') || hash.includes('inout')) {
        return 'inout_portal';
      }
      // Check for eval queue, projector, student booking, ledger
      if (
        pathname.includes('/eval') || pathname.includes('/queue') || pathname.includes('/projector') || pathname.includes('/student') || pathname.includes('/ledger') ||
        search.includes('queue') || search.includes('eval') || search.includes('projector') || search.includes('student') || search.includes('ledger') ||
        hash.includes('queue') || hash.includes('eval') || hash.includes('projector') || hash.includes('student') || hash.includes('book') || hash.includes('ledger')
      ) {
        return 'eval_queue';
      }
      if (
        pathname.includes('/desk') || pathname.includes('/shortlist') || pathname.includes('/bench') || pathname.includes('/waitlist') ||
        hash.includes('desk') || hash.includes('shortlist') || hash.includes('bench') || hash.includes('waitlist')
      ) {
        return 'candidate_desk';
      }
    } catch (e) {
      // Default fallback
    }
    return 'landing';
  });
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [openTimerAfterAuth, setOpenTimerAfterAuth] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [isReadOnlyAfterClosure, setIsReadOnlyAfterClosure] = useState(false);

  // Institutional Portal Access & Dynamic Automatic Closure Timer Settings (Defaults to OPEN)
  const [portalSettings, setPortalSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('sih_portal_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only mark expired if closeTimestamp exists and was explicitly set in the future relative to its lastUpdated
        if (!parsed.isClosed && parsed.closeTimestamp && Date.now() >= parsed.closeTimestamp) {
          return { ...parsed, isClosed: false, closeTimestamp: null, presetLabel: 'Registration Window Open' };
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error loading portal settings', e);
    }
    return {
      isClosed: false,
      closeTimestamp: null,
      timerPreset: 'indefinite',
      presetLabel: 'Registration Window Open',
      lastUpdated: new Date().toISOString()
    };
  });

  const isPortalClosed = portalSettings.isClosed;

  // Active Timer Tick Handler: automatically locks portal when closeTimestamp is reached
  useEffect(() => {
    const checkTimer = () => {
      if (!portalSettings.isClosed && portalSettings.closeTimestamp) {
        if (Date.now() >= portalSettings.closeTimestamp) {
          const updated = {
            ...portalSettings,
            isClosed: true,
            presetLabel: 'Scheduled Window Concluded',
            lastUpdated: new Date().toISOString()
          };
          setPortalSettings(updated);
          localStorage.setItem('sih_portal_settings', JSON.stringify(updated));
          // Also sync to Supabase
          supabase
            .from('app_settings')
            .upsert([{ key: 'portal_settings', value: updated, updated_at: new Date().toISOString() }], { onConflict: 'key' })
            .then(() => {})
            .catch(() => {});
        }
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [portalSettings]);

  const handleUpdatePortalSettings = async (newSettings) => {
    const merged = { ...portalSettings, ...newSettings };
    setPortalSettings(merged);
    try {
      localStorage.setItem('sih_portal_settings', JSON.stringify(merged));
    } catch (e) {
      console.error('Failed to save portal settings', e);
    }

    try {
      await supabase
        .from('app_settings')
        .upsert([{ 
          key: 'portal_settings', 
          value: merged, 
          updated_at: new Date().toISOString() 
        }], { onConflict: 'key' });
    } catch (err) {
      console.error('Supabase portal_settings sync error', err);
    }
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTier, setActiveTier] = useState('shortlist');
  const [hiddenTeamIds, setHiddenTeamIds] = useState(() => {
    try {
      const saved = localStorage.getItem('sih_hidden_teams');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Custom & Dynamic Teams State (CRUD Persistence)
  const [customTeamsMap, setCustomTeamsMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sih_custom_teams') || '{}');
    } catch {
      return {};
    }
  });
  const [deletedTeamIds, setDeletedTeamIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sih_deleted_teams') || '[]');
      return new Set(saved);
    } catch {
      return new Set();
    }
  });

  // Registrations Map & Team Contacts Map
  const [registrationsMap, setRegistrationsMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sih_registrations') || '{}');
    } catch {
      return {};
    }
  });
  const [teamContactsMap, setTeamContactsMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sih_team_contacts') || '{}');
    } catch {
      return {};
    }
  });

  const [activeRegTeam, setActiveRegTeam] = useState(null);
  const [activeDetailsTeam, setActiveDetailsTeam] = useState(null);
  const [sortBy, setSortBy] = useState('rank');
  const [sortOrder, setSortOrder] = useState('asc');

  // Real-Time Arena Presence, Active Passes, and Movement Audit Logs State
  const [arenaTeamSessions, setArenaTeamSessions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sih_arena_team_sessions') || '{}');
    } catch {
      return {};
    }
  });
  const [arenaActiveOuts, setArenaActiveOuts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sih_inout_active_outs') || '{}');
    } catch {
      return {};
    }
  });
  const [arenaMovementLogs, setArenaMovementLogs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sih_inout_logs') || '[]');
    } catch {
      return [];
    }
  });

  // Digital Evaluation Queue, Panels, Active Sessions, and Rubric Ledger State
  const [evaluationPanels, setEvaluationPanels] = useState(() => {
    try {
      const saved = localStorage.getItem('sih_evaluation_panels');
      return saved ? JSON.parse(saved) : DEFAULT_EVALUATION_PANELS;
    } catch {
      return DEFAULT_EVALUATION_PANELS;
    }
  });
  const [evaluationQueue, setEvaluationQueue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sih_evaluation_queue') || '{}');
    } catch {
      return {};
    }
  });
  const [evaluationLedger, setEvaluationLedger] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sih_evaluation_ledger') || '[]');
    } catch {
      return [];
    }
  });
  const [evaluationSessions, setEvaluationSessions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sih_evaluation_sessions') || '{}');
    } catch {
      return {};
    }
  });

  const syncTimersRef = useRef({});
  const lastSyncedJsonRef = useRef({});

  const syncArenaToSupabase = (key, value) => {
    try {
      const jsonStr = JSON.stringify(value);
      if (lastSyncedJsonRef.current[key] === jsonStr) return; // Skip duplicate payload sync

      if (syncTimersRef.current[key]) {
        clearTimeout(syncTimersRef.current[key]);
      }

      syncTimersRef.current[key] = setTimeout(async () => {
        try {
          lastSyncedJsonRef.current[key] = jsonStr;
          await supabase
            .from('app_settings')
            .upsert([{ 
              key, 
              value, 
              updated_at: new Date().toISOString() 
            }], { onConflict: 'key' });
        } catch (err) {
          console.warn(`Supabase ${key} sync warning:`, err);
        }
      }, 400); // 400ms debounce prevents socket exhaustion
    } catch (e) {
      console.warn('syncArenaToSupabase error:', e);
    }
  };

  const handleUpdateArenaSessions = (newSessions) => {
    setArenaTeamSessions(newSessions);
    try {
      localStorage.setItem('sih_arena_team_sessions', JSON.stringify(newSessions));
    } catch (e) {}
    syncArenaToSupabase('arena_team_sessions', newSessions);
  };

  const handleUpdateArenaActiveOuts = (newActiveOuts) => {
    setArenaActiveOuts(newActiveOuts);
    try {
      localStorage.setItem('sih_inout_active_outs', JSON.stringify(newActiveOuts));
    } catch (e) {}
    syncArenaToSupabase('arena_active_outs', newActiveOuts);
  };

  const handleUpdateArenaMovementLogs = (newLogs) => {
    setArenaMovementLogs(newLogs);
    try {
      localStorage.setItem('sih_inout_logs', JSON.stringify(newLogs));
    } catch (e) {}
    syncArenaToSupabase('arena_movement_logs', newLogs);
  };

  const handleUpdateEvaluationPanels = (newPanels) => {
    setEvaluationPanels(newPanels);
    try {
      localStorage.setItem('sih_evaluation_panels', JSON.stringify(newPanels));
    } catch (e) {}
    syncArenaToSupabase('evaluation_panels', newPanels);
  };

  const handleUpdateEvaluationQueue = (newQueue) => {
    setEvaluationQueue(newQueue);
    try {
      localStorage.setItem('sih_evaluation_queue', JSON.stringify(newQueue));
    } catch (e) {}
    syncArenaToSupabase('evaluation_queue', newQueue);
  };

  const handleUpdateEvaluationLedger = (newLedger) => {
    setEvaluationLedger(newLedger);
    try {
      localStorage.setItem('sih_evaluation_ledger', JSON.stringify(newLedger));
    } catch (e) {}
    syncArenaToSupabase('evaluation_ledger', newLedger);
  };

  const handleUpdateEvaluationSessions = (newSessions) => {
    setEvaluationSessions(newSessions);
    try {
      localStorage.setItem('sih_evaluation_sessions', JSON.stringify(newSessions));
    } catch (e) {}
    syncArenaToSupabase('evaluation_sessions', newSessions);
  };

  // Combined Active Finalized Master Teams (Merged with latest submitted form details)
  const masterTeamsList = useMemo(() => {
    const mergeWithReg = (teamObj) => {
      const reg = registrationsMap[teamObj.temp_team_id];
      if (!reg) return { ...teamObj, isRegistered: false };
      return {
        ...teamObj,
        isRegistered: true,
        team_name: reg.team_name || teamObj.team_name,
        ps_id: reg.sih_ps_id || reg.ps_id || teamObj.ps_id,
        ps_title: reg.ps_title || teamObj.ps_title,
        leader_name: reg.leader_name || teamObj.leader_name,
        reg_no: reg.leader_reg_no || reg.reg_no || teamObj.reg_no,
        school: normalizeSchoolName(reg.leader_school || reg.leader_dept || teamObj.school),
        mobile: reg.leader_phone || teamObj.mobile,
        status: reg.status || teamObj.status
      };
    };

    const baseList = FINALIZED_MASTER_TEAMS
      .filter(t => !deletedTeamIds.has(t.temp_team_id))
      .map(t => {
        const custom = customTeamsMap[t.temp_team_id] || t;
        return mergeWithReg(custom);
      });

    const baseIds = new Set(FINALIZED_MASTER_TEAMS.map(t => t.temp_team_id));
    const newlyCreated = Object.values(customTeamsMap)
      .filter(t => !baseIds.has(t.temp_team_id) && !deletedTeamIds.has(t.temp_team_id) && !t.is_deleted)
      .map(t => mergeWithReg(t));

    return [...baseList, ...newlyCreated];
  }, [customTeamsMap, deletedTeamIds, registrationsMap]);

  // Public Teams List for Students (excludes teams marked as Hidden by Admin)
  const publicTeamsList = useMemo(() => {
    const hiddenArr = Array.isArray(hiddenTeamIds) ? hiddenTeamIds : [];
    return masterTeamsList.filter(t => !hiddenArr.includes(t.temp_team_id));
  }, [masterTeamsList, hiddenTeamIds]); // strictly: 'shortlist' | 'bench' | 'waitlist'

  
  // Subbranch URL / Hash listener & Secret Keyboard Listener (Ctrl + Shift + A for Master Admin Gateway)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        triggerSecretAdmin();
      }
    };

    const syncRouteFromUrl = () => {
      const pathname = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      // Standalone Jury Station check (strictly isolated)
      if (pathname.includes('/jury') || search.includes('jury') || hash.includes('jury')) {
        setCurrentView('jury_station');
        return;
      }
      // Gate Pass action check
      if (search.includes('action=out') || search.includes('action=in') || hash.includes('action=out') || hash.includes('action=in')) {
        setCurrentView('inout_portal');
      } else if (pathname.includes('/arena') || pathname.includes('/inout') || search.includes('arena') || hash.includes('arena') || hash.includes('inout')) {
        setCurrentView('inout_portal');
      } else if (
        pathname.includes('/eval') || pathname.includes('/queue') || pathname.includes('/projector') || pathname.includes('/student') || pathname.includes('/ledger') ||
        search.includes('queue') || search.includes('eval') || search.includes('projector') || search.includes('student') || search.includes('ledger') ||
        hash.includes('queue') || hash.includes('eval') || hash.includes('projector') || hash.includes('student') || hash.includes('book') || hash.includes('ledger')
      ) {
        setCurrentView('eval_queue');
      } else if (pathname.includes('/admin') || pathname.includes('/gateway') || hash.includes('admin') || hash.includes('gateway') || search.includes('admin')) {
        triggerSecretAdmin();
      } else if (
        pathname.includes('/desk') || pathname.includes('/shortlist') || pathname.includes('/bench') || pathname.includes('/waitlist') ||
        hash.includes('desk') || hash.includes('shortlist') || hash.includes('bench') || hash.includes('waitlist')
      ) {
        setCurrentView('candidate_desk');
      } else {
        setCurrentView('landing');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', syncRouteFromUrl);
    window.addEventListener('popstate', syncRouteFromUrl);

    syncRouteFromUrl();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', syncRouteFromUrl);
      window.removeEventListener('popstate', syncRouteFromUrl);
    };
  }, [isAdminLoggedIn]);

  const triggerSecretAdmin = () => {
    if (isAdminLoggedIn) {
      setIsGatewayModalOpen(true);
    } else {
      setIsPasscodeModalOpen(true);
    }
  };

  // Hydrate registrations, contacts, custom teams, and app settings from Supabase & LocalStorage on boot
  useEffect(() => {
    async function loadData() {
      // 1. Load LocalStorage first
      try {
        const localRegs = JSON.parse(localStorage.getItem('sih_registrations') || '{}');
        const localContacts = JSON.parse(localStorage.getItem('sih_team_contacts') || '{}');
        const localCustom = JSON.parse(localStorage.getItem('sih_custom_teams') || '{}');
        const localDeleted = JSON.parse(localStorage.getItem('sih_deleted_teams') || '[]');
        const localHidden = JSON.parse(localStorage.getItem('sih_hidden_teams') || '[]');

        setRegistrationsMap(localRegs);
        setTeamContactsMap(localContacts);
        setCustomTeamsMap(prev => ({ ...prev, ...localCustom }));
        setDeletedTeamIds(prev => new Set([...prev, ...localDeleted]));
        if (Array.isArray(localHidden) && localHidden.length > 0) {
          setHiddenTeamIds(localHidden);
        }
      } catch (e) {
        console.error('LocalStorage load error', e);
      }

      // 2. Fetch from Supabase
      try {
        const { data: regData, error: regError } = await supabase
          .from('registrations')
          .select('*');

        if (!regError && regData) {
          const remoteRegMap = {};
          regData.forEach(r => {
            remoteRegMap[r.temp_team_id] = r;
          });
          setRegistrationsMap(prev => ({ ...prev, ...remoteRegMap }));
        }

        const { data: contactData, error: contactError } = await supabase
          .from('team_contacts')
          .select('*');

        if (!contactError && contactData) {
          const remoteContactMap = {};
          contactData.forEach(c => {
            remoteContactMap[c.temp_team_id] = c;
          });
          setTeamContactsMap(prev => ({ ...prev, ...remoteContactMap }));
        }

        // Fetch custom teams
        const { data: customData } = await supabase
          .from('custom_teams')
          .select('*');

        if (customData) {
          const remoteCustom = {};
          const remoteDeleted = [];
          customData.forEach(c => {
            if (c.is_deleted) {
              remoteDeleted.push(c.temp_team_id);
            } else {
              remoteCustom[c.temp_team_id] = c;
            }
          });
          setCustomTeamsMap(prev => ({ ...prev, ...remoteCustom }));
          setDeletedTeamIds(prev => new Set([...prev, ...remoteDeleted]));
        }

        // Fetch app settings (hidden team ids & live portal settings)
        const { data: settingsData } = await supabase
          .from('app_settings')
          .select('*');

        if (settingsData) {
          const hiddenEntry = settingsData.find(s => s.key === 'hidden_team_ids');
          if (hiddenEntry && Array.isArray(hiddenEntry.value)) {
            setHiddenTeamIds(hiddenEntry.value);
            localStorage.setItem('sih_hidden_teams', JSON.stringify(hiddenEntry.value));
          }

          const portalEntry = settingsData.find(s => s.key === 'portal_settings');
          if (portalEntry && portalEntry.value) {
            const pVal = portalEntry.value;
            const isNowExpired = !pVal.isClosed && pVal.closeTimestamp && Date.now() >= pVal.closeTimestamp;
            const liveSettings = isNowExpired 
              ? { ...pVal, isClosed: true, presetLabel: 'Scheduled Deadline Concluded' }
              : pVal;
            setPortalSettings(liveSettings);
            localStorage.setItem('sih_portal_settings', JSON.stringify(liveSettings));
          }

          // Hydrate Arena Team Sessions, Active Outs, Movement Logs
          const arenaSessionsEntry = settingsData.find(s => s.key === 'arena_team_sessions');
          if (arenaSessionsEntry && arenaSessionsEntry.value) {
            setArenaTeamSessions(prev => ({ ...prev, ...arenaSessionsEntry.value }));
            localStorage.setItem('sih_arena_team_sessions', JSON.stringify(arenaSessionsEntry.value));
          }

          const arenaOutsEntry = settingsData.find(s => s.key === 'arena_active_outs');
          if (arenaOutsEntry && arenaOutsEntry.value) {
            setArenaActiveOuts(arenaOutsEntry.value);
            localStorage.setItem('sih_inout_active_outs', JSON.stringify(arenaOutsEntry.value));
          }

          const arenaLogsEntry = settingsData.find(s => s.key === 'arena_movement_logs');
          if (arenaLogsEntry && Array.isArray(arenaLogsEntry.value)) {
            setArenaMovementLogs(prev => {
              const existingSet = new Set(prev.map(l => `${l.team_id}-${l.out_time}-${l.in_time}-${l.log_type}`));
              const incoming = arenaLogsEntry.value.filter(l => !existingSet.has(`${l.team_id}-${l.out_time}-${l.in_time}-${l.log_type}`));
              const merged = [...incoming, ...prev];
              localStorage.setItem('sih_inout_logs', JSON.stringify(merged));
              return merged;
            });
          }
          // Hydrate Evaluation Panels, Queue, Ledger, Sessions
          const evalPanelsEntry = settingsData.find(s => s.key === 'evaluation_panels');
          if (evalPanelsEntry && Array.isArray(evalPanelsEntry.value)) {
            setEvaluationPanels(evalPanelsEntry.value);
            localStorage.setItem('sih_evaluation_panels', JSON.stringify(evalPanelsEntry.value));
          }

          const evalQueueEntry = settingsData.find(s => s.key === 'evaluation_queue');
          if (evalQueueEntry && evalQueueEntry.value) {
            setEvaluationQueue(evalQueueEntry.value);
            localStorage.setItem('sih_evaluation_queue', JSON.stringify(evalQueueEntry.value));
          }

          const evalLedgerEntry = settingsData.find(s => s.key === 'evaluation_ledger');
          if (evalLedgerEntry && Array.isArray(evalLedgerEntry.value)) {
            setEvaluationLedger(evalLedgerEntry.value);
            localStorage.setItem('sih_evaluation_ledger', JSON.stringify(evalLedgerEntry.value));
          }

          const evalSessionsEntry = settingsData.find(s => s.key === 'evaluation_sessions');
          if (evalSessionsEntry && evalSessionsEntry.value) {
            setEvaluationSessions(evalSessionsEntry.value);
            localStorage.setItem('sih_evaluation_sessions', JSON.stringify(evalSessionsEntry.value));
          }
        }
      } catch (err) {
        console.warn('Supabase fetch error, running on cached dataset:', err);
      }
    }

    loadData();

    // Background Polling Loop for Multi-Device Arena & Evaluation Sync (every 5 seconds, JSON-diff guarded)
    const arenaInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('key, value')
          .in('key', [
            'arena_team_sessions', 'arena_active_outs', 'arena_movement_logs',
            'evaluation_panels', 'evaluation_queue', 'evaluation_ledger', 'evaluation_sessions'
          ]);

        if (!error && data) {
          data.forEach(item => {
            if (item.key === 'arena_team_sessions' && item.value) {
              const incoming = JSON.stringify(item.value);
              setArenaTeamSessions(prev => {
                if (JSON.stringify(prev) === incoming) return prev;
                try { localStorage.setItem('sih_arena_team_sessions', incoming); } catch (e) {}
                lastSyncedJsonRef.current['arena_team_sessions'] = incoming;
                return item.value;
              });
            } else if (item.key === 'arena_active_outs' && item.value) {
              const incoming = JSON.stringify(item.value);
              setArenaActiveOuts(prev => {
                if (JSON.stringify(prev) === incoming) return prev;
                try { localStorage.setItem('sih_inout_active_outs', incoming); } catch (e) {}
                lastSyncedJsonRef.current['arena_active_outs'] = incoming;
                return item.value;
              });
            } else if (item.key === 'arena_movement_logs' && Array.isArray(item.value)) {
              const incoming = JSON.stringify(item.value);
              setArenaMovementLogs(prev => {
                if (JSON.stringify(prev) === incoming) return prev;
                try { localStorage.setItem('sih_inout_logs', incoming); } catch (e) {}
                lastSyncedJsonRef.current['arena_movement_logs'] = incoming;
                return item.value;
              });
            } else if (item.key === 'evaluation_panels' && Array.isArray(item.value)) {
              const incoming = JSON.stringify(item.value);
              setEvaluationPanels(prev => {
                if (JSON.stringify(prev) === incoming) return prev;
                try { localStorage.setItem('sih_evaluation_panels', incoming); } catch (e) {}
                lastSyncedJsonRef.current['evaluation_panels'] = incoming;
                return item.value;
              });
            } else if (item.key === 'evaluation_queue' && item.value) {
              const incoming = JSON.stringify(item.value);
              setEvaluationQueue(prev => {
                if (JSON.stringify(prev) === incoming) return prev;
                try { localStorage.setItem('sih_evaluation_queue', incoming); } catch (e) {}
                lastSyncedJsonRef.current['evaluation_queue'] = incoming;
                return item.value;
              });
            } else if (item.key === 'evaluation_ledger' && Array.isArray(item.value)) {
              const incoming = JSON.stringify(item.value);
              setEvaluationLedger(prev => {
                if (JSON.stringify(prev) === incoming) return prev;
                try { localStorage.setItem('sih_evaluation_ledger', incoming); } catch (e) {}
                lastSyncedJsonRef.current['evaluation_ledger'] = incoming;
                return item.value;
              });
            } else if (item.key === 'evaluation_sessions' && item.value) {
              const incoming = JSON.stringify(item.value);
              setEvaluationSessions(prev => {
                if (JSON.stringify(prev) === incoming) return prev;
                try { localStorage.setItem('sih_evaluation_sessions', incoming); } catch (e) {}
                lastSyncedJsonRef.current['evaluation_sessions'] = incoming;
                return item.value;
              });
            }
          });
        }
      } catch (e) {
        console.warn('Arena background polling error:', e);
      }
    }, 5000);

    return () => clearInterval(arenaInterval);
  }, []);

  // Per-Team Visibility Toggle Handler (Supabase & LocalStorage)
  const handleToggleTeamVisibility = async (tempTeamId) => {
    setHiddenTeamIds(prev => {
      const currentArr = Array.isArray(prev) ? prev : [];
      const next = currentArr.includes(tempTeamId)
        ? currentArr.filter(id => id !== tempTeamId)
        : [...currentArr, tempTeamId];

      try {
        localStorage.setItem('sih_hidden_teams', JSON.stringify(next));
      } catch (e) {
        console.warn('LocalStorage error:', e);
      }

      supabase
        .from('app_settings')
        .upsert([{ key: 'hidden_team_ids', value: next, updated_at: new Date().toISOString() }], { onConflict: 'key' })
        .then(() => {})
        .catch(err => console.warn('Supabase hidden_teams sync error:', err));

      return next;
    });
  };

  // 1. Create Team Handler
  const handleCreateTeam = async (newTeam) => {
    const localCustom = JSON.parse(localStorage.getItem('sih_custom_teams') || '{}');
    localCustom[newTeam.temp_team_id] = newTeam;
    localStorage.setItem('sih_custom_teams', JSON.stringify(localCustom));

    setCustomTeamsMap(prev => ({ ...prev, [newTeam.temp_team_id]: newTeam }));

    try {
      await supabase
        .from('custom_teams')
        .upsert([{ ...newTeam, is_deleted: false, updated_at: new Date().toISOString() }]);
    } catch (e) {
      console.warn('Supabase custom_teams upsert error:', e);
    }
  };

  // 2. Update Team Handler
  const handleUpdateTeam = async (tempTeamId, updatedTeam) => {
    const fullTeam = { ...updatedTeam, temp_team_id: tempTeamId };
    const localCustom = JSON.parse(localStorage.getItem('sih_custom_teams') || '{}');
    localCustom[tempTeamId] = fullTeam;
    localStorage.setItem('sih_custom_teams', JSON.stringify(localCustom));

    setCustomTeamsMap(prev => ({ ...prev, [tempTeamId]: fullTeam }));

    // If registration exists, synchronize registration fields
    if (registrationsMap[tempTeamId]) {
      const updatedReg = {
        ...registrationsMap[tempTeamId],
        team_name: updatedTeam.team_name,
        sih_ps_id: updatedTeam.ps_id,
        ps_id: updatedTeam.ps_id,
        ps_title: updatedTeam.ps_title || registrationsMap[tempTeamId].ps_title,
        leader_name: updatedTeam.leader_name,
        leader_reg_no: updatedTeam.reg_no,
        leader_school: updatedTeam.school,
        leader_phone: updatedTeam.mobile || registrationsMap[tempTeamId].leader_phone,
        leader_whatsapp: updatedTeam.mobile || registrationsMap[tempTeamId].leader_whatsapp,
        status: updatedTeam.status,
        updated_at: new Date().toISOString()
      };

      setRegistrationsMap(prev => {
        const next = { ...prev, [tempTeamId]: updatedReg };
        localStorage.setItem('sih_registrations', JSON.stringify(next));
        return next;
      });

      try {
        await supabase
          .from('registrations')
          .upsert([updatedReg], { onConflict: 'temp_team_id' });
      } catch (e) {
        console.warn('Supabase registration sync warning:', e);
      }
    }

    try {
      await supabase
        .from('custom_teams')
        .upsert([{ ...fullTeam, is_deleted: false, updated_at: new Date().toISOString() }]);
    } catch (e) {
      console.warn('Supabase custom_teams update error:', e);
    }
  };

  // 3. Delete Team Handler
  const handleDeleteTeam = async (tempTeamId) => {
    const localDeleted = JSON.parse(localStorage.getItem('sih_deleted_teams') || '[]');
    if (!localDeleted.includes(tempTeamId)) {
      localDeleted.push(tempTeamId);
      localStorage.setItem('sih_deleted_teams', JSON.stringify(localDeleted));
    }

    const localCustom = JSON.parse(localStorage.getItem('sih_custom_teams') || '{}');
    if (localCustom[tempTeamId]) {
      delete localCustom[tempTeamId];
      localStorage.setItem('sih_custom_teams', JSON.stringify(localCustom));
    }

    setDeletedTeamIds(prev => new Set([...prev, tempTeamId]));
    setCustomTeamsMap(prev => {
      const next = { ...prev };
      delete next[tempTeamId];
      return next;
    });

    try {
      await supabase
        .from('custom_teams')
        .upsert([{ temp_team_id: tempTeamId, is_deleted: true, updated_at: new Date().toISOString() }]);
    } catch (e) {
      console.warn('Supabase custom_teams delete error:', e);
    }
  };

  // Update contact number handler
  const handleUpdateContact = async (tempTeamId, phone, whatsapp) => {
    const contactObj = {
      temp_team_id: tempTeamId,
      phone_number: phone,
      whatsapp_number: whatsapp,
      updated_at: new Date().toISOString()
    };

    setTeamContactsMap(prev => {
      const updated = { ...prev, [tempTeamId]: contactObj };
      localStorage.setItem('sih_team_contacts', JSON.stringify(updated));
      return updated;
    });

    try {
      await supabase
        .from('team_contacts')
        .upsert(contactObj, { onConflict: 'temp_team_id' });
    } catch (e) {
      console.warn('Supabase contact upsert warning:', e);
    }
  };

  // Live Tier Counts (excludes hidden teams)
  const tierCounts = useMemo(() => {
    const s = publicTeamsList.filter(t => t.status === 'Shortlist').length;
    const b = publicTeamsList.filter(t => t.status === 'Bench').length;
    const w = publicTeamsList.filter(t => t.status === 'Waitlist').length;
    return {
      shortlist: s,
      bench: b,
      waitlist: w,
      totalFinalized: s + b + w
    };
  }, [publicTeamsList]);

  // Submitted forms among public visible teams
  const finalizedSubmittedCount = useMemo(() => {
    const publicIds = new Set(publicTeamsList.map(t => t.temp_team_id));
    return Object.keys(registrationsMap).filter(id => publicIds.has(id)).length;
  }, [registrationsMap, publicTeamsList]);

  // Handle Search Input with Secret Code Detection
  const handleSearchChange = (e) => {
    const val = e.target.value;
    if (val.trim().toLowerCase() === '//admin' || val.trim().toLowerCase() === 'retriever') {
      setSearchTerm('');
      triggerSecretAdmin();
      return;
    }
    setSearchTerm(val);
  };

  // Cross-tier search matches detector
  const crossTierMatches = useMemo(() => {
    if (!searchTerm.trim()) {
      return { shortlist: 0, bench: 0, waitlist: 0, total: 0 };
    }
    const q = searchTerm.toLowerCase();
    const matchFn = (t) => {
      const regRecord = registrationsMap[t.temp_team_id];
      const teamName = regRecord?.team_name || t.team_name;
      return (
        t.temp_team_id.toLowerCase().includes(q) ||
        teamName.toLowerCase().includes(q) ||
        t.leader_name.toLowerCase().includes(q) ||
        t.reg_no.toLowerCase().includes(q) ||
        t.ps_id.toLowerCase().includes(q) ||
        t.school.toLowerCase().includes(q)
      );
    };

    const s = publicTeamsList.filter(t => t.status === 'Shortlist' && matchFn(t)).length;
    const b = publicTeamsList.filter(t => t.status === 'Bench' && matchFn(t)).length;
    const w = publicTeamsList.filter(t => t.status === 'Waitlist' && matchFn(t)).length;
    return { shortlist: s, bench: b, waitlist: w, total: s + b + w };
  }, [searchTerm, registrationsMap, publicTeamsList]);

  // Filtered strictly to active tier from public visible teams
  const baseList = useMemo(() => {
    if (activeTier === 'shortlist') return publicTeamsList.filter(t => t.status === 'Shortlist');
    if (activeTier === 'bench') return publicTeamsList.filter(t => t.status === 'Bench');
    if (activeTier === 'waitlist') return publicTeamsList.filter(t => t.status === 'Waitlist');
    return [];
  }, [activeTier, publicTeamsList]);

  // Search filter inside active tier
  const filteredTeams = useMemo(() => {
    if (!searchTerm.trim()) return baseList;
    const q = searchTerm.toLowerCase();
    return baseList.filter(t => {
      const regRecord = registrationsMap[t.temp_team_id];
      const teamName = regRecord?.team_name || t.team_name;
      return (
        t.temp_team_id.toLowerCase().includes(q) ||
        teamName.toLowerCase().includes(q) ||
        t.leader_name.toLowerCase().includes(q) ||
        t.reg_no.toLowerCase().includes(q) ||
        t.ps_id.toLowerCase().includes(q) ||
        t.school.toLowerCase().includes(q)
      );
    });
  }, [baseList, searchTerm, registrationsMap]);

  // Sorted
  const sortedTeams = useMemo(() => {
    return [...filteredTeams].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTeams, sortBy, sortOrder]);

  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const handleConfirmReg = (teamId, registrationPayload) => {
    setRegistrationsMap(prev => {
      const next = {
        ...prev,
        [teamId]: registrationPayload
      };
      try {
        localStorage.setItem('sih_registrations', JSON.stringify(next));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
      return next;
    });
  };

  const handlePasscodeSuccess = () => {
    setIsAdminLoggedIn(true);
    setIsPasscodeModalOpen(false);
    if (openTimerAfterAuth) {
      setOpenTimerAfterAuth(false);
      setIsTimerModalOpen(true);
    } else {
      setIsGatewayModalOpen(true);
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setCurrentView('landing');
    window.location.hash = '';
  };

  const openTierDesk = (tier) => {
    setActiveTier(tier);
    setCurrentView('candidate_desk');
  };

  return (
    <div className="app-shell">
      {/* Flower Petals & Confetti Shower (Only on Landing/Desk) */}
      {currentView !== 'inout_portal' && currentView !== 'eval_queue' && currentView !== 'jury_station' && <FlowerConfettiRain />}

      {/* Common Institutional Header (All views EXCEPT isolated jury_station) */}
      {currentView !== 'jury_station' && (
        <Navbar
          registeredCount={finalizedSubmittedCount}
          totalFinalizedCount={tierCounts.totalFinalized}
          onSecretAdminTrigger={triggerSecretAdmin}
          onOpenAdminGateway={triggerSecretAdmin}
          isAdminLoggedIn={isAdminLoggedIn}
          onOpenLandingView={() => {
            setIsReadOnlyAfterClosure(false);
            setCurrentView('landing');
          }}
          onOpenCandidateDesk={() => setCurrentView('candidate_desk')}
          onOpenInOutPortal={() => {
            setIsReadOnlyAfterClosure(false);
            setCurrentView('inout_portal');
          }}
          onOpenEvaluationQueue={() => {
            setIsReadOnlyAfterClosure(false);
            setCurrentView('eval_queue');
          }}
          currentView={currentView}
          isPortalClosed={isPortalClosed}
          onOpenTimerModal={() => {
            if (isAdminLoggedIn) {
              setIsTimerModalOpen(true);
            } else {
              setOpenTimerAfterAuth(true);
              setIsPasscodeModalOpen(true);
            }
          }}
        />
      )}

      {/* Live Midnight Closure Countdown Banner (Only on Landing/Desk) */}
      {currentView !== 'inout_portal' && currentView !== 'eval_queue' && currentView !== 'jury_station' && (
        <MidnightCountdownBanner 
          onActionClick={() => {
            if (currentView !== 'candidate_desk') {
              setCurrentView('candidate_desk');
            }
          }}
          isPortalClosed={isPortalClosed}
          portalSettings={portalSettings}
        />
      )}

      {/* VIEW 0: STANDALONE DEDICATED JURY STATION (ZERO OTHER BUTTON ACCESS) */}
      {currentView === 'jury_station' ? (
        <JuryStationPortal
          allTeams={masterTeamsList}
          registrationsMap={registrationsMap}
          evaluationPanels={evaluationPanels}
          evaluationQueue={evaluationQueue}
          evaluationLedger={evaluationLedger}
          activeSessions={evaluationSessions}
          onUpdateSessions={handleUpdateEvaluationSessions}
          onUpdateQueue={handleUpdateEvaluationQueue}
          onUpdateLedger={handleUpdateEvaluationLedger}
        />
      ) : currentView === 'admin' && isAdminLoggedIn ? (
        /* VIEW 1: ADMIN DASHBOARD */
        <AdminDashboard
          allMasterTeams={masterTeamsList}
          registrationsMap={registrationsMap}
          teamContactsMap={teamContactsMap}
          arenaTeamSessions={arenaTeamSessions}
          arenaActiveOuts={arenaActiveOuts}
          arenaMovementLogs={arenaMovementLogs}
          onUpdateArenaSessions={handleUpdateArenaSessions}
          onUpdateArenaActiveOuts={handleUpdateArenaActiveOuts}
          onUpdateArenaMovementLogs={handleUpdateArenaMovementLogs}
          onUpdateContact={handleUpdateContact}
          onLogout={handleAdminLogout}
          onViewTeamDetails={(team) => setActiveDetailsTeam(team)}
          onOpenTeamForm={(team) => setActiveRegTeam(team)}
          onCreateTeam={handleCreateTeam}
          onUpdateTeam={handleUpdateTeam}
          onDeleteTeam={handleDeleteTeam}
          hiddenTeamIds={hiddenTeamIds}
          onToggleTeamVisibility={handleToggleTeamVisibility}
          portalSettings={portalSettings}
          onOpenTimerModal={() => setIsTimerModalOpen(true)}
          onUpdatePortalSettings={handleUpdatePortalSettings}
          onOpenEvaluationQueue={() => setCurrentView('eval_queue')}
          onOpenAdminGateway={triggerSecretAdmin}
        />
      ) : currentView === 'eval_queue' ? (
        /* VIEW 2: DIGITAL EVALUATION QUEUE & MULTI-PANEL LIVE TIMING */
        <EvaluationQueuePortal
          allTeams={masterTeamsList}
          registrationsMap={registrationsMap}
          evaluationPanels={evaluationPanels}
          evaluationQueue={evaluationQueue}
          evaluationLedger={evaluationLedger}
          activeSessions={evaluationSessions}
          onUpdatePanels={handleUpdateEvaluationPanels}
          onUpdateQueue={handleUpdateEvaluationQueue}
          onUpdateLedger={handleUpdateEvaluationLedger}
          onUpdateSessions={handleUpdateEvaluationSessions}
          isAdminLoggedIn={isAdminLoggedIn}
          onOpenAdminGateway={isAdminLoggedIn ? triggerSecretAdmin : null}
          onBackToMain={() => {
            window.history.pushState(null, '', '/');
            setCurrentView('landing');
          }}
        />
      ) : currentView === 'inout_portal' ? (
        /* VIEW 3: SIH COMMON VENUE IN-OUT GATE PASS & ATTENDANCE WORKPLACE */
        <InOutAttendancePortal
          allTeams={masterTeamsList}
          registrationsMap={registrationsMap}
          parentSessions={arenaTeamSessions}
          parentActiveOuts={arenaActiveOuts}
          parentMovementLogs={arenaMovementLogs}
          onUpdateSessions={handleUpdateArenaSessions}
          onUpdateActiveOuts={handleUpdateArenaActiveOuts}
          onUpdateLogs={handleUpdateArenaMovementLogs}
          onBackToMain={() => {
            window.history.pushState(null, '', '/');
            setCurrentView('landing');
          }}
          onOpenEvaluationQueue={() => {
            setIsReadOnlyAfterClosure(false);
            setCurrentView('eval_queue');
          }}
          onOpenAdminGateway={triggerSecretAdmin}
        />
      ) : isPortalClosed && !isReadOnlyAfterClosure ? (
        /* PORTAL CLOSED VIEW (Active when portal is locked) */
        <PortalClosedView
          onSecretAdminTrigger={triggerSecretAdmin}
          registeredCount={finalizedSubmittedCount}
          totalFinalizedCount={tierCounts.totalFinalized}
          isAdminLoggedIn={isAdminLoggedIn}
          onOpenTimerModal={() => {
            if (isAdminLoggedIn) {
              setIsTimerModalOpen(true);
            } else {
              setOpenTimerAfterAuth(true);
              setIsPasscodeModalOpen(true);
            }
          }}
          onGoToAdmin={() => setCurrentView('admin')}
          onViewShortlist={() => {
            setIsReadOnlyAfterClosure(true);
            setCurrentView('candidate_desk');
          }}
        />
      ) : currentView === 'landing' ? (
        /* VIEW 3: GRAND ANNOUNCEMENT LANDING SHOWCASE */
        <GrandLandingShowcase
          onExploreShortlist={() => openTierDesk('shortlist')}
          onExploreBench={() => openTierDesk('bench')}
          onExploreWaitlist={() => openTierDesk('waitlist')}
          onOpenInOutPortal={() => {
            setIsReadOnlyAfterClosure(false);
            setCurrentView('inout_portal');
          }}
          onOpenEvaluationQueue={() => {
            setIsReadOnlyAfterClosure(false);
            setCurrentView('eval_queue');
          }}
          onOpenAdminGateway={triggerSecretAdmin}
          allTeams={publicTeamsList}
          onOpenTeamRegistration={(team) => {
            if (!isPortalClosed) setActiveRegTeam(team);
          }}
        />
      ) : (
        /* VIEW 4: CANDIDATE REGISTRATION DESK TABLE */
        <main className="main-viewport">
          <div className="desk-top-navigation-strip">
            <button className="btn-back-to-landing" onClick={() => setCurrentView('inout_portal')}>
              <DoorOpen size={16} className="text-orange" />
              <span>Back to Gate Pass Workplace</span>
            </button>
            <div className="desk-announcement-pill">
              <Sparkles size={14} className="text-amber" />
              <span>{tierCounts.shortlist} Unique Problem Statements Locked</span>
            </div>
            <button 
              className="btn-back-to-landing" 
              onClick={() => setCurrentView('landing')}
              style={{ marginLeft: 'auto' }}
            >
              <ArrowLeft size={16} />
              <span>Announcement Landing</span>
            </button>
          </div>

          {/* 3 Clean Tier Navigation Cards */}
          <section className="portal-hero-card">
            <div className="hero-mesh-bg"></div>
            
            <div className="hero-content-wrapper">
              <div className="hero-badge-tag">
                <Sparkles size={13} />
                <span>SMART INDIA HACKATHON 2026 CANDIDATE DESK</span>
              </div>

              <h1 className="hero-title">
                Candidate Selection &amp; Registration Portal
              </h1>

              <p className="hero-subtitle">
                Official finalist registry for {tierCounts.total} finalized teams ({tierCounts.shortlist} Shortlisted Teams with 100% unique problem statements, {tierCounts.bench} Bench Standby, and {tierCounts.waitlist} Waitlist). Verify and complete your 6-member team roster.
              </p>

              <div className="three-tier-navigator">
                {/* Shortlist Card */}
                <div
                  className={`tier-nav-card shortlist-card ${activeTier === 'shortlist' ? 'selected' : ''}`}
                  onClick={() => setActiveTier('shortlist')}
                >
                  <div className="tier-nav-top">
                    <div className="tier-icon-circle emerald">
                      <ShieldCheck size={18} />
                    </div>
                    <span className="tier-pill-count emerald">{tierCounts.shortlist} Teams</span>
                  </div>
                  <div className="tier-card-title">Shortlist</div>
                  <div className="tier-card-desc">Primary {tierCounts.shortlist} Finalists (100% Unique PS)</div>
                  {activeTier === 'shortlist' && <div className="active-glow-indicator emerald"></div>}
                </div>

                {/* Bench Card */}
                <div
                  className={`tier-nav-card bench-card ${activeTier === 'bench' ? 'selected' : ''}`}
                  onClick={() => setActiveTier('bench')}
                >
                  <div className="tier-nav-top">
                    <div className="tier-icon-circle amber">
                      <Award size={18} />
                    </div>
                    <span className="tier-pill-count amber">{tierCounts.bench} Teams</span>
                  </div>
                  <div className="tier-card-title">Bench</div>
                  <div className="tier-card-desc">Tier-1 Immediate Standby Pool</div>
                  {activeTier === 'bench' && <div className="active-glow-indicator amber"></div>}
                </div>

                {/* Waitlist Card */}
                <div
                  className={`tier-nav-card waitlist-card ${activeTier === 'waitlist' ? 'selected' : ''}`}
                  onClick={() => setActiveTier('waitlist')}
                >
                  <div className="tier-nav-top">
                    <div className="tier-icon-circle indigo">
                      <Filter size={18} />
                    </div>
                    <span className="tier-pill-count indigo">{tierCounts.waitlist} Teams</span>
                  </div>
                  <div className="tier-card-title">Waitlist</div>
                  <div className="tier-card-desc">Tier-2 Domain Balancing Pool</div>
                  {activeTier === 'waitlist' && <div className="active-glow-indicator indigo"></div>}
                </div>
              </div>
            </div>
          </section>

          {/* Search Controls */}
          <section className="search-bar-panel">
            <div className="search-input-container">
              <Search size={18} className="search-icon-element" />
              <input
                type="text"
                placeholder={`Search ${activeTier === 'shortlist' ? `Shortlisted (${tierCounts.shortlist})` : activeTier === 'bench' ? `Bench (${tierCounts.bench})` : `Waitlist (${tierCounts.waitlist})`} candidates by ID, Name, Leader, Reg No...`}
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-field-modern"
              />
              {searchTerm && (
                <button className="clear-btn-pill" onClick={() => setSearchTerm('')}>
                  Clear
                </button>
              )}
            </div>
          </section>

          {/* Clean Data Table */}
          <section className="table-wrapper-card">
            <div className="table-top-bar">
              <div className="table-viewing-title">
                <span className={`active-tier-bullet ${activeTier}`}></span>
                <span>
                  Viewing <strong>{sortedTeams.length}</strong> {activeTier.toUpperCase()} Candidates
                  {searchTerm && ` (matching "${searchTerm}")`}
                </span>
              </div>
              {searchTerm && (
                <button className="reset-search-btn" onClick={() => setSearchTerm('')}>
                  Reset Search
                </button>
              )}
            </div>

            <div className="table-scroll-box">
              <table className="modern-teams-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort('rank')} className="sort-th col-rank">
                      <span>Rank</span>
                      <ArrowUpDown size={12} />
                    </th>
                    <th onClick={() => toggleSort('temp_team_id')} className="sort-th col-id">
                      <span>Temp Team ID</span>
                      <ArrowUpDown size={12} />
                    </th>
                    <th onClick={() => toggleSort('team_name')} className="sort-th col-team">
                      <span>Team Name</span>
                      <ArrowUpDown size={12} />
                    </th>
                    <th onClick={() => toggleSort('leader_name')} className="sort-th col-leader">
                      <span>Team Leader</span>
                      <ArrowUpDown size={12} />
                    </th>
                    <th onClick={() => toggleSort('reg_no')} className="sort-th col-reg">
                      <span>Leader Reg No</span>
                      <ArrowUpDown size={12} />
                    </th>
                    <th className="col-status">Status</th>
                    <th className="col-action">Registration</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTeams.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-state-cell">
                        <div className="smart-empty-search-box">
                          <div className="empty-search-icon-circle">
                            <Search size={32} />
                          </div>
                          
                          <h3 className="empty-title">
                            No matching teams in {activeTier.toUpperCase()} for "{searchTerm}"
                          </h3>
                          
                          <p className="empty-subtitle">
                            {crossTierMatches.total > 0 ? (
                              <span>
                                Candidate found in another tier! Click below to check:
                              </span>
                            ) : (
                              <span>
                                Check if this candidate is listed under Bench Standby or Waitlist:
                              </span>
                            )}
                          </p>

                          {/* Smart Redirect Buttons */}
                          <div className="tier-redirect-grid">
                            {activeTier !== 'shortlist' && (
                              <button 
                                className={`btn-tier-redirect-action shortlist ${crossTierMatches.shortlist > 0 ? 'highlight-match' : ''}`}
                                onClick={() => setActiveTier('shortlist')}
                              >
                                <div className="redirect-btn-left">
                                  <ShieldCheck size={18} className="text-emerald" />
                                  <div className="redirect-text">
                                    <span className="redirect-name">Check in Shortlist</span>
                                    <span className="redirect-count-sub">80 Teams</span>
                                  </div>
                                </div>
                                <div className="redirect-btn-right">
                                  {crossTierMatches.shortlist > 0 ? (
                                    <span className="found-badge emerald">
                                      {crossTierMatches.shortlist} Found <ArrowRight size={12} />
                                    </span>
                                  ) : (
                                    <ArrowRight size={15} />
                                  )}
                                </div>
                              </button>
                            )}

                            {activeTier !== 'bench' && (
                              <button 
                                className={`btn-tier-redirect-action bench ${crossTierMatches.bench > 0 ? 'highlight-match' : ''}`}
                                onClick={() => setActiveTier('bench')}
                              >
                                <div className="redirect-btn-left">
                                  <Award size={18} className="text-amber" />
                                  <div className="redirect-text">
                                    <span className="redirect-name">Check in Bench Standby</span>
                                    <span className="redirect-count-sub">10 Teams</span>
                                  </div>
                                </div>
                                <div className="redirect-btn-right">
                                  {crossTierMatches.bench > 0 ? (
                                    <span className="found-badge amber">
                                      {crossTierMatches.bench} Found <ArrowRight size={12} />
                                    </span>
                                  ) : (
                                    <ArrowRight size={15} />
                                  )}
                                </div>
                              </button>
                            )}

                            {activeTier !== 'waitlist' && (
                              <button 
                                className={`btn-tier-redirect-action waitlist ${crossTierMatches.waitlist > 0 ? 'highlight-match' : ''}`}
                                onClick={() => setActiveTier('waitlist')}
                              >
                                <div className="redirect-btn-left">
                                  <Filter size={18} className="text-indigo" />
                                  <div className="redirect-text">
                                    <span className="redirect-name">Check in Waitlist Pool</span>
                                    <span className="redirect-count-sub">20 Teams</span>
                                  </div>
                                </div>
                                <div className="redirect-btn-right">
                                  {crossTierMatches.waitlist > 0 ? (
                                    <span className="found-badge indigo">
                                      {crossTierMatches.waitlist} Found <ArrowRight size={12} />
                                    </span>
                                  ) : (
                                    <ArrowRight size={15} />
                                  )}
                                </div>
                              </button>
                            )}
                          </div>

                          <div className="empty-footer-action">
                            <button className="btn-clear-empty-search" onClick={() => setSearchTerm('')}>
                              Clear Search Query
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedTeams.map((team) => {
                      const regRecord = registrationsMap[team.temp_team_id];
                      const isRegistered = !!regRecord;

                      return (
                        <tr key={`${activeTier}-${team.temp_team_id}-${team.rank}`} className={`table-row ${isRegistered ? 'row-confirmed' : ''}`}>
                          <td className="col-rank">
                            <span className="rank-badge">#{team.rank}</span>
                          </td>

                          <td className="col-id">
                            <span className="team-id-badge">{team.temp_team_id}</span>
                          </td>

                          <td className="col-team">
                            <div className="team-name-strong">
                              {team.team_name}
                            </div>
                            <div className="ps-info-sub">
                              <span className="ps-id-tag">{team.ps_id}</span>
                              {team.ps_title && (
                                <span className="ps-title-tag" title={team.ps_title}>
                                  • {team.ps_title}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="col-leader">
                            <div className="leader-name-bold">{team.leader_name}</div>
                            <div className="school-name-sub">{team.school}</div>
                          </td>

                          <td className="col-reg">
                            <span className="reg-no-mono">{team.reg_no}</span>
                          </td>

                          <td className="col-status">
                            <span className={`status-badge ${team.status.toLowerCase().replace(/\s+/g, '-')}`}>
                              {team.status}
                            </span>
                          </td>

                          <td className="col-action">
                            {isRegistered ? (
                              <div 
                                className="badge-status-confirmed"
                                title="Registration officially completed & locked"
                              >
                                <CheckCircle2 size={14} className="text-emerald" />
                                <span>Form Submitted</span>
                              </div>
                            ) : isPortalClosed ? (
                              <div 
                                className="badge-status-closed"
                                title="Candidate registration closed at 12:00 AM Midnight"
                              >
                                <Lock size={13} className="text-rose" />
                                <span>Window Closed</span>
                              </div>
                            ) : (
                              <button
                                className="btn-register-vibrant"
                                onClick={() => setActiveRegTeam(team)}
                              >
                                <span>Register Team</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* MOBILE CANDIDATE CARDS (Visible only on Mobile Viewports < 768px) */}
              <div className="mobile-candidate-cards-list mobile-only-cards">
                {sortedTeams.length === 0 ? (
                  <div className="smart-empty-search-box mobile-empty-card">
                    <div className="empty-search-icon-circle">
                      <Search size={26} />
                    </div>
                    <h3 className="empty-title">
                      No teams in {activeTier.toUpperCase()} matching "{searchTerm}"
                    </h3>
                    <div className="tier-redirect-grid">
                      {activeTier !== 'shortlist' && (
                        <button 
                          className="btn-tier-redirect-action shortlist"
                          onClick={() => setActiveTier('shortlist')}
                        >
                          <ShieldCheck size={16} className="text-emerald" />
                          <span>Check Shortlist ({tierCounts.shortlist})</span>
                        </button>
                      )}
                      {activeTier !== 'bench' && (
                        <button 
                          className="btn-tier-redirect-action bench"
                          onClick={() => setActiveTier('bench')}
                        >
                          <Award size={16} className="text-amber" />
                          <span>Check Bench ({tierCounts.bench})</span>
                        </button>
                      )}
                      {activeTier !== 'waitlist' && (
                        <button 
                          className="btn-tier-redirect-action waitlist"
                          onClick={() => setActiveTier('waitlist')}
                        >
                          <Filter size={16} className="text-indigo" />
                          <span>Check Waitlist ({tierCounts.waitlist})</span>
                        </button>
                      )}
                    </div>
                    <button className="btn-clear-empty-search" onClick={() => setSearchTerm('')}>
                      Clear Search
                    </button>
                  </div>
                ) : (
                  sortedTeams.map((team) => {
                    const regRecord = registrationsMap[team.temp_team_id];
                    const isRegistered = !!regRecord;

                    return (
                      <div 
                        key={`mob-${activeTier}-${team.temp_team_id}-${team.rank}`} 
                        className={`mobile-team-card ${isRegistered ? 'card-confirmed' : ''}`}
                      >
                        <div className="mob-card-top-bar">
                          <div className="mob-badges-left">
                            <span className="rank-badge">#{team.rank}</span>
                            <span className="team-id-badge">{team.temp_team_id}</span>
                          </div>
                          <span className={`status-badge ${team.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {team.status}
                          </span>
                        </div>

                        <div className="mob-team-name">
                          {team.team_name}
                        </div>

                        <div className="mob-ps-sub">
                          <span className="ps-id-tag">{team.ps_id}</span>
                          {team.ps_title && (
                            <span className="mob-ps-title-text" title={team.ps_title}>
                              {team.ps_title}
                            </span>
                          )}
                        </div>

                        <div className="mob-details-grid">
                          <div className="mob-detail-row">
                            <span className="mob-detail-label">Leader:</span>
                            <strong className="mob-detail-val">{team.leader_name}</strong>
                          </div>
                          <div className="mob-detail-row">
                            <span className="mob-detail-label">Reg No:</span>
                            <span className="mob-detail-val font-mono">{team.reg_no}</span>
                          </div>
                          <div className="mob-detail-row">
                            <span className="mob-detail-label">School:</span>
                            <span className="mob-detail-val school-text">{team.school}</span>
                          </div>
                          <div className="mob-detail-row">
                            <span className="mob-detail-label">PS ID:</span>
                            <span className="mob-detail-val font-mono font-bold text-indigo">{team.ps_id}</span>
                          </div>
                        </div>

                        <div className="mob-card-action">
                          {isRegistered ? (
                            <div 
                              className="badge-status-confirmed mob-badge-full"
                              title="Registration officially completed & locked"
                            >
                              <CheckCircle2 size={15} className="text-emerald" />
                              <span>Form Submitted &amp; Locked</span>
                            </div>
                          ) : isPortalClosed ? (
                            <div 
                              className="badge-status-closed mob-badge-full"
                              title="Candidate registration closed at 12:00 AM Midnight"
                            >
                              <Lock size={15} className="text-rose" />
                              <span>Registration Window Closed</span>
                            </div>
                          ) : (
                            <button
                              className="btn-register-vibrant mob-btn-full"
                              onClick={() => setActiveRegTeam(team)}
                            >
                              <span>Register Team</span>
                              <ArrowRight size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </main>
      )}

      {currentView !== 'jury_station' && (
        <footer className="portal-footer">
          <div className="footer-inner-box">
            <div className="footer-left">
              <div className="footer-brand">Smart India Hackathon 2026</div>
              <p>Rathinam Global University • Campus Evaluation Authority</p>
            </div>
            <div className="footer-right">
              <p 
                className="secret-footer-trigger"
                onClick={triggerSecretAdmin}
                title="Section 65B Electronic Proof Ledger Verified"
                style={{ cursor: 'pointer' }}
              >
                <Lock size={11} style={{ verticalAlign: 'middle', marginRight: '4px', opacity: 0.6 }} />
                Section 65B Electronic Proof Ledger Verified
              </p>
              <p>{tierCounts.total} Finalized Teams ({tierCounts.shortlist} Shortlist • {tierCounts.bench} Bench • {tierCounts.waitlist} Waitlist)</p>
            </div>
          </div>
        </footer>
      )}

      {/* Registration Modal */}
      {activeRegTeam && (
        <RegistrationModal
          team={activeRegTeam}
          existingRegistration={registrationsMap[activeRegTeam.temp_team_id]}
          onClose={() => setActiveRegTeam(null)}
          onConfirmRegistration={handleConfirmReg}
        />
      )}

      {/* Passcode Modal */}
      <PasscodeModal
        isOpen={isPasscodeModalOpen}
        onClose={() => setIsPasscodeModalOpen(false)}
        onSuccess={handlePasscodeSuccess}
      />

      {/* Admin Details Modal */}
      {activeDetailsTeam && (
        <TeamDetailsModal
          team={{
            ...activeDetailsTeam,
            registrationData: registrationsMap[activeDetailsTeam.temp_team_id]
          }}
          onClose={() => setActiveDetailsTeam(null)}
          onEditForm={(team) => {
            setActiveDetailsTeam(null);
            setActiveRegTeam(team);
          }}
        />
      )}

      {/* Portal Timer & Access Modal */}
      <PortalTimerModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
        portalSettings={portalSettings}
        onUpdatePortalSettings={handleUpdatePortalSettings}
      />

      {/* Master Admin Gateway Modal */}
      <AdminGatewayModal
        isOpen={isGatewayModalOpen}
        onClose={() => setIsGatewayModalOpen(false)}
        onSelectView={(v) => {
          setIsReadOnlyAfterClosure(false);
          setCurrentView(v);
          try {
            if (v === 'eval_queue') {
              window.history.pushState(null, '', '#queue');
            } else if (v === 'inout_portal') {
              window.history.pushState(null, '', '#arena');
            } else if (v === 'candidate_desk') {
              window.history.pushState(null, '', '#desk');
            } else if (v === 'admin') {
              window.history.pushState(null, '', '#admin');
            } else {
              window.history.pushState(null, '', '/');
            }
          } catch (e) {}
        }}
        onOpenTimer={() => setIsTimerModalOpen(true)}
        onAdminLogout={handleAdminLogout}
        currentView={currentView}
        isPortalClosed={isPortalClosed}
        totalTeamsCount={tierCounts.totalFinalized}
        submittedCount={finalizedSubmittedCount}
      />
    </div>
  );
}
