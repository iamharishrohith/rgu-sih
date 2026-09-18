import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Play, Pause, Plus, CheckCircle2, Clock, Users, Building2, 
  Search, ShieldCheck, Download, Sparkles, Monitor, 
  Smartphone, FileText, Layers, ArrowLeft, Volume2, VolumeX,
  LayoutDashboard, Check, Award, Trash2, Tag, Hash, X,
  GripVertical, ArrowUp, ArrowDown, ArrowRightLeft, Megaphone, Radio, Square,
  ArrowRight, ChevronRight, BarChart3, TrendingUp, Activity, FastForward, RotateCcw, AlertTriangle, UserCheck, PieChart,
  Phone, MessageSquare, Filter, Eye, ExternalLink, HelpCircle, FileSpreadsheet, UserX, AlertCircle, RefreshCw, Mail, Calendar, Edit3
} from 'lucide-react';
import { normalizeSchoolName } from '../data/sihMasterData';
import LivePixelDigitalClock from './LivePixelDigitalClock.jsx';
import PanelManagerModal from './PanelManagerModal.jsx';
import { playEvalSound } from '../utils/evalSoundEffects.js';

export const DEFAULT_EVALUATION_PANELS = [
  {
    id: 'panel_1',
    name: 'Panel 1 — AI, Data Science & Deep Learning',
    code: 'P1',
    room: 'Hall A (Room 101)',
    domain: 'Data Engineering, Data Science & AIML',
    presentMins: 20,
    qaMins: 10,
    status: 'ACTIVE',
    themes: [
      'Smart Automation',
      'MedTech / BioTech / HealthTech',
      'Space Technology',
      'Miscellaneous (Open Innovation)'
    ],
    juries: [
      { name: 'Mr. Manikandan S', role: 'Chief Jury', designation: 'Data Engineering / Data Science / Deep Learning', theme: 'Data Science & Deep Learning' },
      { name: 'Mr. Rajesh Kumar G', role: 'Technical Evaluator', designation: 'Python / Data Analytics / AIML', theme: 'Python / AIML & Analytics' }
    ]
  },
  {
    id: 'panel_2',
    name: 'Panel 2 — Cloud Architecture & Smart Education',
    code: 'P2',
    room: 'Hall B (Room 102)',
    domain: 'Cloud Infrastructure & Smart Education',
    presentMins: 20,
    qaMins: 10,
    status: 'ACTIVE',
    themes: [
      'Smart Education',
      'Tourism',
      'Heritage & Culture',
      'Fitness & Sports'
    ],
    juries: [
      { name: 'Mr. Selvarajalingam S', role: 'Chief Jury', designation: 'Cloud & Smart Education', theme: 'Cloud & Smart Education' },
      { name: 'Mr. Aravind S', role: 'Technical Evaluator', designation: 'Cloud', theme: 'Cloud Architecture' }
    ]
  },
  {
    id: 'panel_3',
    name: 'Panel 3 — Blockchain, Cybersecurity & Disaster Sentinel',
    code: 'P3',
    room: 'Hardware Lab (Room 103)',
    domain: 'Blockchain, Cyber Security & Disaster Management',
    presentMins: 20,
    qaMins: 10,
    status: 'ACTIVE',
    themes: [
      'Blockchain & Cybersecurity',
      'Disaster Management',
      'Clean & Green Technology'
    ],
    juries: [
      { name: 'Harish Rohith S', role: 'Chief Jury', designation: 'Blockchain / Disaster Management', theme: 'Blockchain & Disaster Management' },
      { name: 'Mr. Sunil Kumar S', role: 'Technical Evaluator', designation: 'Cyber Security', theme: 'Cyber Security' }
    ]
  },
  {
    id: 'panel_4',
    name: 'Panel 4 — IoT, Robotics & Smart Automation',
    code: 'P4',
    room: 'Mini Auditorium (Room 104)',
    domain: 'IoT & Smart Automation',
    presentMins: 20,
    qaMins: 10,
    status: 'ACTIVE',
    themes: [
      'Robotics and Drones',
      'Smart Vehicles',
      'Renewable / Sustainable Energy',
      'Agriculture, FoodTech & Rural Development'
    ],
    juries: [
      { name: 'Mr. Ramesh Marivendhan', role: 'Chief Jury', designation: 'IoT & Automation', theme: 'IoT & Automation' }
    ]
  },
  {
    id: 'panel_5',
    name: 'Panel 5 — Full Stack WebTech & Cybersecurity',
    code: 'P5',
    room: 'Seminar Hall (Room 105)',
    domain: 'MERN Full Stack & Cyber Security',
    presentMins: 20,
    qaMins: 10,
    status: 'ACTIVE',
    themes: [
      'Transportation & Logistics',
      'Toys & Games'
    ],
    juries: [
      { name: 'Mr. Raja G', role: 'Chief Jury', designation: 'Cyber Security', theme: 'Cyber Security' },
      { name: 'Mr. Rajesh T', role: 'Technical Evaluator', designation: 'MERN Full Stack', theme: 'MERN Full Stack' }
    ]
  }
];

export const ALL_17_SIH_THEMES = [
  'Smart Automation',
  'MedTech / BioTech / HealthTech',
  'Space Technology',
  'Miscellaneous (Open Innovation)',
  'Smart Education',
  'Tourism',
  'Heritage & Culture',
  'Fitness & Sports',
  'Blockchain & Cybersecurity',
  'Disaster Management',
  'Clean & Green Technology',
  'Robotics and Drones',
  'Smart Vehicles',
  'Renewable / Sustainable Energy',
  'Agriculture, FoodTech & Rural Development',
  'Transportation & Logistics',
  'Toys & Games'
];

export const POPULAR_TECH_TAGS = [
  '#AI', '#MachineLearning', '#DeepLearning', '#Python',
  '#Cloud', '#AWS', '#IoT', '#Robotics',
  '#Blockchain', '#CyberSecurity', '#MERN', '#FullStack',
  '#React', '#NodeJS', '#Embedded', '#EV',
  '#SmartAgriculture', '#DataScience', '#Web3', '#ComputerVision',
  '#NLP', '#MobileApp', '#FastAPI', '#Hardware'
];

export const THEME_TECH_HASHTAG_MAP = {
  // Panel 1: AI, Data Science & Deep Learning
  'Smart Automation': ['#SmartAutomation', '#AI', '#DeepLearning', '#MachineLearning', '#NLP', '#ComputerVision', '#LLM', '#NeuralNetworks', '#Python'],
  'MedTech / BioTech / HealthTech': ['#MedTech', '#HealthTech', '#BioTech', '#HealthcareAI', '#Diagnostics', '#Telemedicine', '#BioInformatics'],
  'Space Technology': ['#SpaceTech', '#SatelliteAI', '#Geospatial', '#GIS', '#RemoteSensing', '#Astrophysics'],
  'Miscellaneous (Open Innovation)': ['#OpenInnovation', '#DataScience', '#Analytics', '#Python', '#DeepTech', '#BigData', '#Research'],

  // Panel 2: Cloud Architecture & Smart Education
  'Smart Education': ['#SmartEducation', '#EdTech', '#Elearning', '#AdaptiveLearning', '#CampusTech', '#LMS', '#DigitalClassroom'],
  'Tourism': ['#Tourism', '#SmartTravel', '#VirtualTourism', '#ARVR', '#Hospitality', '#HeritageTourism'],
  'Heritage & Culture': ['#Heritage', '#Culture', '#IndianArt', '#LinguisticTech', '#DigitalPreservation', '#IndigenousTech'],
  'Fitness & Sports': ['#Fitness', '#SportsTech', '#AthleteAnalytics', '#Wearables', '#HealthTracking'],

  // Panel 3: Blockchain, Cybersecurity & Disaster Sentinel
  'Blockchain & Cybersecurity': ['#Blockchain', '#CyberSecurity', '#SmartContracts', '#Web3', '#Cryptography', '#ZeroTrust', '#PenTesting', '#Forensics', '#Security'],
  'Disaster Management': ['#DisasterManagement', '#EarlyWarning', '#FloodAlert', '#Earthquake', '#EmergencyRelay', '#CrisisResponse', '#Resilience'],
  'Clean & Green Technology': ['#CleanTech', '#GreenTech', '#Sustainability', '#WasteManagement', '#CarbonFootprint', '#WaterPurification', '#EcoTech'],

  // Panel 4: IoT, Robotics & Smart Automation
  'Robotics and Drones': ['#Robotics', '#Drones', '#UAV', '#AutonomousSystems', '#ROS', '#Hardware', '#Embedded', '#Sensors'],
  'Smart Vehicles': ['#SmartVehicles', '#EV', '#BatteryManagement', '#ADAS', '#ConnectedCars', '#Automotive'],
  'Renewable / Sustainable Energy': ['#RenewableEnergy', '#SolarTech', '#WindEnergy', '#SmartGrid', '#EnergyStorage', '#Microgrid'],
  'Agriculture, FoodTech & Rural Development': ['#AgriTech', '#FoodTech', '#SmartFarming', '#CropMonitoring', '#RuralTech', '#PrecisionAgri', '#IoT'],

  // Panel 5: Full Stack WebTech & Cybersecurity
  'Transportation & Logistics': ['#Logistics', '#Transportation', '#SupplyChain', '#FleetTracking', '#TransitRouting', '#SmartFreight', '#FleetMgmt'],
  'Toys & Games': ['#ToysAndGames', '#GameDev', '#STEMToys', '#Unity', '#Unreal', '#Gamification', '#FullStack', '#MERN', '#React', '#NodeJS', '#WebDev']
};

export const getMatchingPanelsForTeam = (team, panels = [], customTheme = null, customTags = []) => {
  if (!team || !panels || panels.length === 0) return [];
  
  const tagsText = (customTags || []).join(' ');
  const textCorpus = [
    customTheme || '',
    tagsText,
    team.ps_title || '',
    team.domain || '',
    team.ps_category || '',
    team.team_name || '',
    team.ps_id || ''
  ].join(' ').toLowerCase();

  const scoredPanels = panels.map((panel, idx) => {
    let score = 0;
    const matchedPanelTags = [];

    const panelThemes = panel.themes || [];

    // Exact Custom Theme Matching (+50 points)
    if (customTheme && panelThemes.some(th => th.toLowerCase() === customTheme.toLowerCase())) {
      score += 50;
    }

    panelThemes.forEach(th => {
      const thLower = th.toLowerCase();
      if (textCorpus.includes(thLower)) {
        score += 35;
      }
      const relatedTags = THEME_TECH_HASHTAG_MAP[th] || [];
      relatedTags.forEach(tag => {
        const rawKw = tag.replace('#', '').toLowerCase();
        if (rawKw.length > 2 && textCorpus.includes(rawKw)) {
          score += 18;
          if (!matchedPanelTags.includes(tag)) matchedPanelTags.push(tag);
        }
      });
    });

    // Explicit User Selected Hashtag Matching (+20 points per match)
    (customTags || []).forEach(userTag => {
      const cleanUserTag = userTag.startsWith('#') ? userTag : `#${userTag}`;
      const rawUserKw = cleanUserTag.replace('#', '').toLowerCase();
      
      let matchesThisPanel = false;
      panelThemes.forEach(th => {
        const related = THEME_TECH_HASHTAG_MAP[th] || [];
        if (related.some(r => r.toLowerCase() === cleanUserTag.toLowerCase())) {
          matchesThisPanel = true;
        }
      });
      
      const panelDomainLower = (panel.domain || '').toLowerCase();
      if (panelDomainLower.includes(rawUserKw)) {
        matchesThisPanel = true;
      }

      if (matchesThisPanel) {
        score += 20;
        if (!matchedPanelTags.includes(cleanUserTag)) matchedPanelTags.push(cleanUserTag);
      }
    });

    const panelDomainLower = (panel.domain || '').toLowerCase();
    const domainWords = panelDomainLower.split(/[\s,&/]+/).filter(w => w.length > 2);
    domainWords.forEach(w => {
      if (textCorpus.includes(w)) score += 12;
    });

    // Match percentage calculation with multi-criteria weighting
    const matchPercentage = Math.min(99, Math.max(35, score > 0 ? Math.min(98, 55 + score) : (50 - idx * 4)));
    const displayTags = matchedPanelTags.length > 0 ? matchedPanelTags : (customTags && customTags.length > 0 ? customTags : []);

    return {
      panel,
      matchScore: matchPercentage,
      matchedTags: displayTags.slice(0, 6),
      criteriaSummary: displayTags.length > 0 ? displayTags.join(' ') : (panel.themes?.[0] ? `#${panel.themes[0].replace(/\s+/g, '')}` : `#${panel.code}`)
    };
  });

  scoredPanels.sort((a, b) => b.matchScore - a.matchScore);
  return scoredPanels;
};

export default function EvaluationQueuePortal({
  allTeams = [],
  registrationsMap = {},
  evaluationPanels = DEFAULT_EVALUATION_PANELS,
  evaluationQueue = {},
  evaluationLedger = [],
  activeSessions = {},
  isAdminLoggedIn = false,
  onOpenRegistrationForm,
  onUpdatePanels,
  onUpdateQueue,
  onUpdateLedger,
  onUpdateSessions,
  onResetAllEvaluationData,
  onOpenAdminGateway,
  onBackToMain
}) {
  const [activeView, setActiveView] = useState(() => {
    try {
      const pathname = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (pathname.includes('/student') || pathname.includes('/book') || search.includes('view=student') || hash.includes('book') || hash.includes('student')) return 'student';
      if (pathname.includes('/pending') || search.includes('view=pending') || hash.includes('pending')) return 'pending';
      if (isAdminLoggedIn && (pathname.includes('/analytics') || search.includes('view=analytics') || hash.includes('analytics') || hash.includes('dashboard') || hash.includes('kpi'))) return 'analytics';
      if (isAdminLoggedIn && (pathname.includes('/ledger') || search.includes('view=ledger') || hash.includes('ledger'))) return 'ledger';
      if (pathname.includes('/projector') || pathname.includes('/live') || search.includes('view=projector') || hash.includes('live-queue') || hash.includes('projector') || hash.includes('live')) return 'projector';
    } catch (e) {}
    return 'projector';
  });

  // Sync internal active tab with hash changes
  useEffect(() => {
    const handleUrlSync = () => {
      try {
        const pathname = window.location.pathname.toLowerCase();
        const search = window.location.search.toLowerCase();
        const hash = window.location.hash.toLowerCase();
        if (pathname.includes('/student') || pathname.includes('/book') || search.includes('view=student') || hash.includes('book') || hash.includes('student')) {
          setActiveView('student');
        } else if (pathname.includes('/pending') || search.includes('view=pending') || hash.includes('pending')) {
          setActiveView('pending');
        } else if (isAdminLoggedIn && (pathname.includes('/analytics') || search.includes('view=analytics') || hash.includes('analytics') || hash.includes('dashboard') || hash.includes('kpi'))) {
          setActiveView('analytics');
        } else if (isAdminLoggedIn && (pathname.includes('/ledger') || search.includes('view=ledger') || hash.includes('ledger'))) {
          setActiveView('ledger');
        } else {
          setActiveView('projector');
        }
      } catch (e) {}
    };

    window.addEventListener('hashchange', handleUrlSync);
    window.addEventListener('popstate', handleUrlSync);
    return () => {
      window.removeEventListener('hashchange', handleUrlSync);
      window.removeEventListener('popstate', handleUrlSync);
    };
  }, [isAdminLoggedIn]);

  // Ensure unauthenticated users are kept out of ledger & analytics view
  useEffect(() => {
    if (!isAdminLoggedIn && (activeView === 'ledger' || activeView === 'analytics')) {
      setActiveView('projector');
    }
  }, [isAdminLoggedIn, activeView]);

  const handleSwitchTab = (tabName) => {
    setActiveView(tabName);
    try {
      window.history.replaceState(null, '', `#${tabName}`);
    } catch (e) {}
  };

  const [isPanelModalOpen, setIsPanelModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Student Booking State & 3-Step Wizard Flow
  const [bookingStep, setBookingStep] = useState(1); // 1 = Choose Team, 2 = Select Theme & Hashtags, 3 = Confirm
  const [selectedTeamForBooking, setSelectedTeamForBooking] = useState(null);
  const [selectedOverridePanelId, setSelectedOverridePanelId] = useState('');
  const [studentSearchInput, setStudentSearchInput] = useState('');
  const [bookingSuccessToken, setBookingSuccessToken] = useState(null);
  const [studentSelectedThemes, setStudentSelectedThemes] = useState({});
  const [studentSelectedTags, setStudentSelectedTags] = useState({});
  const [studentCustomTagInputs, setStudentCustomTagInputs] = useState({});

  // Next Team Calling & Broadcast Automation State
  const [callingTeamAlert, setCallingTeamAlert] = useState(null);

  // Admin Drag & Drop / Reordering State
  const [draggedTeamId, setDraggedTeamId] = useState(null);
  const [draggedSourcePanelId, setDraggedSourcePanelId] = useState(null);
  const [dragOverPanelId, setDragOverPanelId] = useState(null);

  // Ledger Filter & View Mode
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerPanelFilter, setLedgerPanelFilter] = useState('ALL');
  const [ledgerViewMode, setLedgerViewMode] = useState('individual'); // 'individual' | 'consolidated'

  // Pending Teams Directory Filters & Modal State
  const [pendingSearchTerm, setPendingSearchTerm] = useState('');
  const [pendingFormFilter, setPendingFormFilter] = useState('ALL'); // 'ALL' | 'FILLED' | 'UNFILLED'
  const [pendingQueueFilter, setPendingQueueFilter] = useState('ALL'); // 'ALL' | 'NOT_BOOKED' | 'IN_QUEUE' | 'IN_PROGRESS' | 'DELAYED'
  const [pendingTierFilter, setPendingTierFilter] = useState('ALL'); // 'ALL' | 'shortlist' | 'bench' | 'waitlist'
  const [pendingSchoolFilter, setPendingSchoolFilter] = useState('ALL');
  const [pendingModalTeam, setPendingModalTeam] = useState(null);

  const handleResetAllEvaluation = () => {
    if (window.confirm('Are you sure you want to RESET ALL EVALUATION DATA (Queues, Tokens, Active Pitch Timers, and Ledger Scores)? Panels and theme configurations will be preserved.')) {
      if (onResetAllEvaluationData) {
        onResetAllEvaluationData();
      } else {
        if (onUpdateQueue) onUpdateQueue({});
        if (onUpdateLedger) onUpdateLedger([]);
        if (onUpdateSessions) onUpdateSessions({});
      }
      setCallingTeamAlert(null);
      setBookingSuccessToken(null);
      setSelectedTeamForBooking(null);
      setStudentSearchInput('');
      setStudentSelectedThemes({});
      setStudentSelectedTags({});
      setStudentCustomTagInputs({});
      setBookingStep(1);
      try {
        localStorage.setItem('sih_evaluation_queue', '{}');
        localStorage.setItem('sih_evaluation_ledger', '[]');
        localStorage.setItem('sih_evaluation_sessions', '{}');
        localStorage.removeItem('sih_eval_calling_team');
      } catch (e) {}
    }
  };

  // Live Timer Tick
  const [currentTimeMs, setCurrentTimeMs] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimeMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 8:00 AM Slot Booking Opening Countdown Gate
  const [adminBookingOverride, setAdminBookingOverride] = useState(false);

  const getSlotBookingOpeningTime = () => {
    const d = new Date(currentTimeMs);
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 8, 0, 0, 0);
    return target.getTime();
  };

  const slotOpeningTimeMs = useMemo(() => getSlotBookingOpeningTime(), [currentTimeMs]);
  const isBookingOpen = currentTimeMs >= slotOpeningTimeMs || adminBookingOverride || isAdminLoggedIn;
  const timeUntilOpenMs = Math.max(0, slotOpeningTimeMs - currentTimeMs);

  const openCountdown = useMemo(() => {
    const totalSecs = Math.floor(timeUntilOpenMs / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return {
      hrs: String(hrs).padStart(2, '0'),
      mins: String(mins).padStart(2, '0'),
      secs: String(secs).padStart(2, '0'),
      totalSecs
    };
  }, [timeUntilOpenMs]);

  // 9:45 AM Live Panel Reveal Countdown Gate (Admin override syncs across all screens)
  const [adminPanelOverride, setAdminPanelOverride] = useState(() => {
    try {
      return localStorage.getItem('sih_arena_panel_revealed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState('');

  const handleToggleArenaReveal = (revealedState) => {
    setAdminPanelOverride(revealedState);
    try {
      localStorage.setItem('sih_arena_panel_revealed', revealedState ? 'true' : 'false');
    } catch (e) {}
  };

  const handleAdminRevealClick = () => {
    if (isAdminLoggedIn || adminPanelOverride) {
      handleToggleArenaReveal(!isPanelRevealed);
    } else {
      setShowAdminPinModal(true);
      setAdminPinInput('');
      setAdminPinError('');
    }
  };

  const handleVerifyAdminPinAndReveal = (e) => {
    if (e) e.preventDefault();
    const pin = adminPinInput.trim().toLowerCase();
    if (pin === 'admin' || pin === 'sih2026' || pin === 'eval' || pin === 'jury' || pin === '1234') {
      handleToggleArenaReveal(true);
      setShowAdminPinModal(false);
      setAdminPinInput('');
    } else {
      setAdminPinError('Invalid Passcode. Enter "admin" or master password.');
    }
  };

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'sih_arena_panel_revealed') {
        setAdminPanelOverride(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getPanelRevealTime = () => {
    const d = new Date(currentTimeMs);
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 45, 0, 0);
    return target.getTime();
  };

  const panelRevealTimeMs = useMemo(() => getPanelRevealTime(), [currentTimeMs]);
  const isTimeRevealed = currentTimeMs >= panelRevealTimeMs;
  const isPanelRevealed = isTimeRevealed || adminPanelOverride;
  const timeUntilPanelRevealMs = Math.max(0, panelRevealTimeMs - currentTimeMs);

  const panelRevealCountdown = useMemo(() => {
    const totalSecs = Math.floor(timeUntilPanelRevealMs / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return {
      hrs: String(hrs).padStart(2, '0'),
      mins: String(mins).padStart(2, '0'),
      secs: String(secs).padStart(2, '0'),
      totalSecs
    };
  }, [timeUntilPanelRevealMs]);

  const playSoundAlert = (type = 'chime') => {
    if (!soundEnabled) return;
    playEvalSound(type);
  };

  // Next Team Audio Broadcast Announcer (Zero TTS, Pure Audio Alert Chime)
  const announceTeamCall = (team, panel) => {
    if (!team || !panel) return;
    const alertObj = {
      teamId: team.teamId || team.temp_team_id,
      teamName: team.teamName || team.team_name,
      tokenNumber: team.tokenNumber,
      panelId: panel.id,
      panelCode: panel.code,
      panelName: panel.name,
      room: panel.room,
      leaderName: team.leaderName || team.leader_name,
      timestamp: Date.now()
    };
    setCallingTeamAlert(alertObj);

    if (soundEnabled) {
      playSoundAlert('call');
    }
  };

  const getEnrichedTeam = (teamId) => {
    const raw = allTeams.find(t => t.temp_team_id === teamId);
    if (!raw) return null;
    const reg = registrationsMap[teamId] || {};
    return {
      ...raw,
      team_name: reg.team_name || raw.team_name,
      leader_name: reg.leader_name || raw.leader_name,
      reg_no: reg.leader_reg_no || raw.reg_no,
      school: normalizeSchoolName(reg.leader_school || raw.school),
      ps_id: reg.sih_ps_id || raw.ps_id,
      ps_title: reg.ps_title || raw.ps_title
    };
  };

  const panelQueues = useMemo(() => {
    const map = {};
    evaluationPanels.forEach(p => {
      map[p.id] = [];
    });

    Object.values(evaluationQueue || {}).forEach(item => {
      if (map[item.panelId]) {
        map[item.panelId].push(item);
      }
    });

    Object.keys(map).forEach(pId => {
      map[pId].sort((a, b) => a.bookedTimestamp - b.bookedTimestamp);
    });

    return map;
  }, [evaluationPanels, evaluationQueue]);

  // Helper to get default initial theme
  const getInitialThemeForTeam = (team) => {
    if (!team) return 'Smart Automation';
    const text = `${team.domain || ''} ${team.ps_title || ''} ${team.ps_category || ''}`.toLowerCase();
    const matched = ALL_17_SIH_THEMES.find(th => 
      text.includes(th.toLowerCase().replace(/[^\w]/g, '')) || 
      text.includes(th.toLowerCase().split(' ')[0])
    );
    return matched || team.domain || 'Smart Automation';
  };

  // Helper to get default initial hashtags
  const getInitialTagsForTeam = (team) => {
    if (!team) return ['#AI', '#Python'];
    const text = `${team.domain || ''} ${team.ps_title || ''} ${team.ps_category || ''}`.toLowerCase();
    const tags = [];
    Object.values(THEME_TECH_HASHTAG_MAP).forEach(tagList => {
      tagList.forEach(t => {
        const clean = t.replace('#', '').toLowerCase();
        if (clean.length > 2 && text.includes(clean) && !tags.includes(t)) {
          tags.push(t);
        }
      });
    });
    if (tags.length === 0 && team.domain) {
      tags.push(`#${team.domain.replace(/[\s/&-]+/g, '')}`);
    }
    return tags.slice(0, 4);
  };

  // Handle Student Theme & Hashtags Criteria-Balanced Slot Booking
  const handleBookSlotForTeam = (team, preferredPanelId = null, matchedTags = [], selectedTheme = '') => {
    const teamId = team.temp_team_id;

    if (evaluationQueue[teamId]) {
      setBookingSuccessToken(evaluationQueue[teamId]);
      return;
    }

    const alreadyEvaluated = (evaluationLedger || []).find(l => l.teamId === teamId);
    if (alreadyEvaluated) {
      alert(`Team ${team.team_name} (${teamId}) has already completed evaluation with score ${alreadyEvaluated.totalScore}/50.`);
      return;
    }

    let targetPanel = null;
    let targetCriteria = '';
    
    if (preferredPanelId) {
      targetPanel = evaluationPanels.find(p => p.id === preferredPanelId);
    }
    
    if (!targetPanel) {
      const rankedMatches = getMatchingPanelsForTeam(team, evaluationPanels, selectedTheme, matchedTags);
      targetPanel = rankedMatches[0]?.panel || evaluationPanels[0];
      targetCriteria = rankedMatches[0]?.criteriaSummary || '';
    }

    const now = Date.now();
    const tokenSeq = (panelQueues[targetPanel.id] || []).length + 1;
    const tokenNumber = `${targetPanel.code || 'PX'}-${String(tokenSeq).padStart(2, '0')}`;

    const newQueueItem = {
      teamId,
      teamName: team.team_name,
      leaderName: team.leader_name,
      regNo: team.reg_no,
      psId: team.ps_id,
      school: team.school,
      domain: team.domain || '',
      theme: selectedTheme || team.domain || 'Smart Automation',
      panelId: targetPanel.id,
      panelName: targetPanel.name,
      panelCode: targetPanel.code,
      room: targetPanel.room,
      tokenNumber,
      matchedHashtags: matchedTags.length > 0 ? matchedTags : (targetCriteria ? targetCriteria.split(' ') : []),
      bookedTimestamp: now,
      bookedTimeStr: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'WAITING'
    };

    const nextQueue = {
      ...evaluationQueue,
      [teamId]: newQueueItem
    };

    if (onUpdateQueue) onUpdateQueue(nextQueue);
    setBookingSuccessToken(newQueueItem);
    playSoundAlert('chime');
  };

  // Handle Start Evaluation for a Panel
  const handleStartPanelEvaluation = (panel, targetTeamObj) => {
    if (!targetTeamObj || !panel) return;
    const teamId = targetTeamObj.temp_team_id || targetTeamObj.teamId;
    const enriched = getEnrichedTeam(teamId) || targetTeamObj;

    const presentMins = panel.presentMins || 20;
    const qaMins = panel.qaMins || 10;
    const totalMs = (presentMins + qaMins) * 60000;
    const now = Date.now();

    const newSession = {
      panelId: panel.id,
      panelName: panel.name,
      teamId,
      teamName: enriched.team_name || enriched.teamName,
      leaderName: enriched.leader_name || enriched.leaderName,
      regNo: enriched.reg_no || enriched.regNo,
      psId: enriched.ps_id || enriched.psId,
      psTitle: enriched.ps_title || enriched.psTitle || '',
      school: enriched.school || '',
      startMs: now,
      presentationEndMs: now + presentMins * 60000,
      totalEndMs: now + totalMs,
      presentMins,
      qaMins,
      isPaused: false,
      pausedRemainingMs: null,
      currentPhase: 'PRESENTATION'
    };

    const nextSessions = {
      ...activeSessions,
      [panel.id]: newSession
    };

    if (onUpdateSessions) onUpdateSessions(nextSessions);

    if (evaluationQueue[teamId]) {
      const nextQ = {
        ...evaluationQueue,
        [teamId]: { ...evaluationQueue[teamId], status: 'PRESENTING' }
      };
      if (onUpdateQueue) onUpdateQueue(nextQ);
    }

    playSoundAlert('start');
  };

  // Calling Automation: Call next waiting team in panel queue
  const handleCallNextTeamInPanel = (panelId, autoStart = false) => {
    const panel = evaluationPanels.find(p => p.id === panelId);
    if (!panel) return;
    const queued = (panelQueues[panelId] || []).filter(item => item.status === 'WAITING' || item.status === 'CALLING');
    if (queued.length === 0) {
      alert(`No waiting teams remaining in ${panel.name} queue.`);
      return;
    }
    const nextTeam = queued[0];
    
    // Set status to CALLING
    const nextQueue = {
      ...evaluationQueue,
      [nextTeam.teamId]: {
        ...evaluationQueue[nextTeam.teamId],
        status: 'CALLING',
        calledTimestamp: Date.now()
      }
    };
    if (onUpdateQueue) onUpdateQueue(nextQueue);

    // Announce Audio/Speech Broadcast
    announceTeamCall(nextTeam, panel);

    if (autoStart) {
      handleStartPanelEvaluation(panel, nextTeam);
    }
  };

  // Drag & Drop / Reordering & Swapping Handler
  const handleMoveTeam = (teamId, targetPanelId, targetPosition = null) => {
    const item = evaluationQueue[teamId];
    if (!item) return;

    const targetPanel = evaluationPanels.find(p => p.id === targetPanelId) || evaluationPanels[0];
    const sourcePanelId = item.panelId;
    const nextQueue = { ...evaluationQueue };

    if (sourcePanelId === targetPanelId) {
      // Reordering within the same panel
      const currentList = [...(panelQueues[sourcePanelId] || [])];
      const itemIndex = currentList.findIndex(t => t.teamId === teamId);
      if (itemIndex === -1) return;

      const [moved] = currentList.splice(itemIndex, 1);
      const insertIdx = targetPosition !== null ? Math.max(0, Math.min(targetPosition, currentList.length)) : currentList.length;
      currentList.splice(insertIdx, 0, moved);

      // Preserve linear timestamps for sorting
      const baseTime = Date.now() - (currentList.length * 60000);
      currentList.forEach((t, i) => {
        nextQueue[t.teamId] = {
          ...nextQueue[t.teamId],
          bookedTimestamp: baseTime + (i * 60000),
          tokenNumber: `${targetPanel.code || 'PX'}-${String(i + 1).padStart(2, '0')}`
        };
      });
    } else {
      // Moving across panels
      const targetList = [...(panelQueues[targetPanelId] || [])];
      const tokenSeq = targetList.length + 1;
      const tokenNumber = `${targetPanel.code || 'PX'}-${String(tokenSeq).padStart(2, '0')}`;

      nextQueue[teamId] = {
        ...item,
        panelId: targetPanel.id,
        panelName: targetPanel.name,
        panelCode: targetPanel.code,
        room: targetPanel.room,
        tokenNumber,
        bookedTimestamp: Date.now()
      };
    }

    if (onUpdateQueue) onUpdateQueue(nextQueue);
    playSoundAlert('chime');
  };

  const handleSwapQueueOrder = (teamId, direction = 'up') => {
    const item = evaluationQueue[teamId];
    if (!item) return;
    const panelId = item.panelId;
    const list = [...(panelQueues[panelId] || [])];
    const idx = list.findIndex(t => t.teamId === teamId);
    if (idx === -1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const nextQueue = { ...evaluationQueue };
    const currentList = [...list];
    const [moved] = currentList.splice(idx, 1);
    currentList.splice(targetIdx, 0, moved);

    const targetPanel = evaluationPanels.find(p => p.id === panelId) || evaluationPanels[0];
    const baseTime = Date.now() - (currentList.length * 60000);
    currentList.forEach((t, i) => {
      nextQueue[t.teamId] = {
        ...nextQueue[t.teamId],
        bookedTimestamp: baseTime + (i * 60000),
        tokenNumber: `${targetPanel.code || 'PX'}-${String(i + 1).padStart(2, '0')}`
      };
    });

    if (onUpdateQueue) onUpdateQueue(nextQueue);
    playSoundAlert('chime');
  };

  const handleDeleteFromQueue = (teamId) => {
    if (window.confirm('Are you sure you want to cancel/remove this team from the evaluation queue?')) {
      const nextQueue = { ...evaluationQueue };
      delete nextQueue[teamId];
      if (onUpdateQueue) onUpdateQueue(nextQueue);
      playSoundAlert('delete');
    }
  };

  // Delay / Skip Team Slot (Moves Delayed Team to End of Waiting Queue without losing token)
  const handleDelayTeamSlot = (teamId, panelId) => {
    const item = evaluationQueue[teamId];
    if (!item) return;

    const currentList = panelQueues[panelId] || [];
    const maxTimestamp = currentList.reduce((max, t) => Math.max(max, t.bookedTimestamp || 0), Date.now());

    const nextQueue = {
      ...evaluationQueue,
      [teamId]: {
        ...item,
        status: 'DELAYED',
        bookedTimestamp: maxTimestamp + 60000,
        delayedCount: (item.delayedCount || 0) + 1,
        lastDelayedAt: Date.now()
      }
    };

    // If this team was actively presenting in this panel, clear session
    if (activeSessions[panelId]?.teamId === teamId) {
      const nextSessions = { ...activeSessions };
      delete nextSessions[panelId];
      if (onUpdateSessions) onUpdateSessions(nextSessions);
    }

    if (onUpdateQueue) onUpdateQueue(nextQueue);
    playSoundAlert('delete');

    // Immediately call next ready waiting team if available
    const nextReady = currentList.filter(t => t.teamId !== teamId && t.status !== 'DELAYED')[0] || currentList.filter(t => t.teamId !== teamId)[0];
    if (nextReady) {
      setTimeout(() => {
        handleCallNextTeamInPanel(panelId, false);
      }, 500);
    }
  };

  // Timer Controls
  const handleToggleTimerPause = (panelId) => {
    const current = activeSessions[panelId];
    if (!current) return;

    const now = Date.now();
    let updated;
    if (current.isPaused) {
      const remaining = current.pausedRemainingMs || 0;
      updated = {
        ...current,
        isPaused: false,
        totalEndMs: now + remaining,
        presentationEndMs: current.currentPhase === 'PRESENTATION' ? now + Math.min(remaining, current.presentMins * 60000) : current.presentationEndMs,
        pausedRemainingMs: null
      };
      playSoundAlert('resume');
    } else {
      const remaining = Math.max(0, current.totalEndMs - now);
      updated = {
        ...current,
        isPaused: true,
        pausedRemainingMs: remaining
      };
      playSoundAlert('pause');
    }

    const nextSessions = { ...activeSessions, [panelId]: updated };
    if (onUpdateSessions) onUpdateSessions(nextSessions);
  };

  const handleExtendSession = (panelId, addMinutes = 5) => {
    const current = activeSessions[panelId];
    if (!current) return;

    const addMs = addMinutes * 60000;
    const updated = {
      ...current,
      totalEndMs: current.totalEndMs + addMs,
      presentationEndMs: current.currentPhase === 'PRESENTATION' ? current.presentationEndMs + addMs : current.presentationEndMs
    };

    const nextSessions = { ...activeSessions, [panelId]: updated };
    if (onUpdateSessions) onUpdateSessions(nextSessions);
    playSoundAlert('extend');
  };

  // Conclude Panel Evaluation & Save to Ledger (Auto-completes timing & calls next team)
  const handleConcludeSession = (panelId, autoCallNext = true) => {
    const current = activeSessions[panelId];
    if (!current) return;
    const p = evaluationPanels.find(item => item.id === panelId) || { id: panelId, name: 'Panel', room: 'Hall', juries: [] };

    const now = new Date();
    const defaultScores = { innovation: 9, feasibility: 9, prototype: 8, presentation: 9, defense: 9 };
    const total = Object.values(defaultScores).reduce((a, b) => a + b, 0);

    const ledgerEntry = {
      id: `EVAL-${Date.now()}`,
      panelId: p.id,
      panelName: p.name,
      room: p.room,
      juries: p.juries || [],
      teamId: current.teamId,
      teamName: current.teamName,
      leaderName: current.leaderName,
      regNo: current.regNo,
      psId: current.psId,
      school: current.school,
      scores: defaultScores,
      totalScore: total,
      maxScore: 50,
      percentage: Math.round((total / 50) * 100),
      feedback: 'Official Section 65B evaluation successfully concluded and verified.',
      evaluatedAtStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      evaluatedAtMs: now.getTime()
    };

    const nextLedger = [ledgerEntry, ...(evaluationLedger || [])];
    if (onUpdateLedger) onUpdateLedger(nextLedger);

    const nextSessions = { ...activeSessions };
    delete nextSessions[panelId];
    if (onUpdateSessions) onUpdateSessions(nextSessions);

    const nextQueue = { ...evaluationQueue };
    delete nextQueue[current.teamId];
    if (onUpdateQueue) onUpdateQueue(nextQueue);

    playSoundAlert('team_conclude');

    // Next Team Calling Automation
    if (autoCallNext) {
      const remaining = (panelQueues[panelId] || []).filter(t => t.teamId !== current.teamId && (t.status === 'WAITING' || t.status === 'CALLING'));
      if (remaining.length > 0) {
        setTimeout(() => {
          handleCallNextTeamInPanel(panelId, false);
        }, 800);
      }
    }
  };

  const getSessionTimingInfo = (session) => {
    if (!session) return null;
    const now = currentTimeMs;
    const isPaused = session.isPaused;
    const totalRemainingMs = isPaused 
      ? (session.pausedRemainingMs || 0) 
      : Math.max(0, session.totalEndMs - now);

    const isPresentationOver = now >= session.presentationEndMs;
    const phase = totalRemainingMs === 0 ? 'FINISHED' : (isPresentationOver ? 'QA' : 'PRESENTATION');

    const totalSecs = Math.floor(totalRemainingMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const timeDisplay = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const totalDurationMs = (session.presentMins + session.qaMins) * 60000;
    const progressPct = Math.min(100, Math.max(0, ((totalDurationMs - totalRemainingMs) / totalDurationMs) * 100));

    return {
      phase,
      timeDisplay,
      isPaused,
      progressPct,
      totalRemainingMs
    };
  };

  const filteredLedger = useMemo(() => {
    return (evaluationLedger || []).filter(item => {
      if (ledgerPanelFilter !== 'ALL' && item.panelId !== ledgerPanelFilter) return false;
      if (!ledgerSearch.trim()) return true;
      const q = ledgerSearch.toLowerCase().trim();
      return (
        item.teamId.toLowerCase().includes(q) ||
        item.teamName.toLowerCase().includes(q) ||
        item.leaderName.toLowerCase().includes(q) ||
        item.psId.toLowerCase().includes(q) ||
        (item.evaluatorName && item.evaluatorName.toLowerCase().includes(q)) ||
        (item.school && item.school.toLowerCase().includes(q))
      );
    });
  }, [evaluationLedger, ledgerPanelFilter, ledgerSearch]);

  // Multi-Jury Consolidated Team Averages Leaderboard
  const consolidatedLedger = useMemo(() => {
    const map = {};
    (filteredLedger || []).forEach(entry => {
      if (!map[entry.teamId]) {
        map[entry.teamId] = {
          teamId: entry.teamId,
          teamName: entry.teamName,
          leaderName: entry.leaderName,
          regNo: entry.regNo,
          psId: entry.psId,
          panelId: entry.panelId,
          panelName: entry.panelName,
          room: entry.room,
          evaluations: []
        };
      }
      map[entry.teamId].evaluations.push(entry);
    });

    return Object.values(map).map(team => {
      const evals = team.evaluations;
      const count = evals.length;
      const totalSum = evals.reduce((acc, ev) => acc + (ev.totalScore || 0), 0);
      const avgScore = count > 0 ? (totalSum / count).toFixed(1) : '0';
      const avgPct = count > 0 ? Math.round((parseFloat(avgScore) / 50) * 100) : 0;
      return {
        ...team,
        evalCount: count,
        avgScore: parseFloat(avgScore),
        avgScoreStr: avgScore,
        avgPercentage: avgPct
      };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [filteredLedger]);

  // Set of evaluated team IDs (from evaluationLedger)
  const evaluatedTeamIds = useMemo(() => {
    return new Set((evaluationLedger || []).map(l => l.teamId));
  }, [evaluationLedger]);

  // All Pending Teams (teams from master roster that haven't had an evaluation recorded)
  const allPendingTeams = useMemo(() => {
    return (allTeams || []).filter(t => !evaluatedTeamIds.has(t.temp_team_id)).map(team => {
      const teamId = team.temp_team_id;
      const reg = registrationsMap[teamId] || null;
      const isFormFilled = Boolean(reg && (reg.team_name || reg.leader_name || (Array.isArray(reg.members) && reg.members.length > 0)));
      const queueItem = evaluationQueue[teamId] || null;

      // Check if team is currently in an active pitch session on any panel
      let activePanelSession = null;
      Object.entries(activeSessions || {}).forEach(([pId, session]) => {
        if (session && session.teamId === teamId) {
          activePanelSession = { panelId: pId, session };
        }
      });

      let queueStatus = 'NOT_BOOKED';
      let queueStatusLabel = 'Not Booked';
      if (activePanelSession) {
        queueStatus = 'IN_PROGRESS';
        queueStatusLabel = 'Pitching Live';
      } else if (queueItem) {
        if (queueItem.status === 'DELAYED') {
          queueStatus = 'DELAYED';
          queueStatusLabel = `Delayed (${queueItem.delayedCount || 1}x)`;
        } else {
          queueStatus = 'IN_QUEUE';
          queueStatusLabel = `Token ${queueItem.tokenNumber}`;
        }
      }

      // Determine Tier
      const tier = team.tier || (teamId.startsWith('SL') ? 'Shortlist' : teamId.startsWith('BN') ? 'Bench' : 'Waitlist');

      // Contact details
      const leaderName = reg?.leader_name || team.leader_name || '—';
      const leaderPhone = reg?.leader_phone || reg?.mobile || team.mobile || team.phone || '—';
      const leaderEmail = reg?.leader_email || team.email || '—';
      const leaderRegNo = reg?.leader_reg_no || team.reg_no || '—';
      const school = normalizeSchoolName(reg?.leader_school || reg?.leader_dept || team.school || '—');
      const teamName = reg?.team_name || team.team_name || '—';
      const psId = reg?.sih_ps_id || team.ps_id || '—';
      const psTitle = reg?.ps_title || team.ps_title || '—';
      const domain = team.domain || reg?.ps_category || team.ps_category || '—';
      const members = Array.isArray(reg?.members) && reg.members.length > 0 ? reg.members : (team.members || []);
      const memberCount = members.length > 0 ? members.length : 6;

      return {
        ...team,
        rawTeam: team,
        teamId,
        teamName,
        leaderName,
        leaderPhone,
        leaderEmail,
        leaderRegNo,
        school,
        psId,
        psTitle,
        domain,
        tier,
        isFormFilled,
        registrationData: reg,
        queueItem,
        queueStatus,
        queueStatusLabel,
        activePanelSession,
        members,
        memberCount,
        facultyMentor: reg?.faculty_mentor_name || team.faculty_mentor_name || '—',
        facultyMentorPhone: reg?.faculty_mentor_phone || team.faculty_mentor_phone || '—',
        submittedAt: reg?.submitted_at || reg?.timestamp || null
      };
    });
  }, [allTeams, evaluatedTeamIds, registrationsMap, evaluationQueue, activeSessions]);

  // Statistics KPI computation for pending directory
  const pendingStats = useMemo(() => {
    const total = allPendingTeams.length;
    const formFilled = allPendingTeams.filter(t => t.isFormFilled).length;
    const formUnfilled = total - formFilled;
    const inQueue = allPendingTeams.filter(t => t.queueStatus === 'IN_QUEUE' || t.queueStatus === 'IN_PROGRESS').length;
    const notBooked = allPendingTeams.filter(t => t.queueStatus === 'NOT_BOOKED').length;
    const delayed = allPendingTeams.filter(t => t.queueStatus === 'DELAYED').length;
    return { total, formFilled, formUnfilled, inQueue, notBooked, delayed };
  }, [allPendingTeams]);

  // Unique list of schools for school filter
  const pendingSchoolOptions = useMemo(() => {
    const schools = new Set();
    allPendingTeams.forEach(t => {
      if (t.school && t.school !== '—') schools.add(t.school);
    });
    return Array.from(schools).sort();
  }, [allPendingTeams]);

  // Filtered pending teams based on active filters
  const filteredPendingTeams = useMemo(() => {
    return allPendingTeams.filter(team => {
      // Form filter
      if (pendingFormFilter === 'FILLED' && !team.isFormFilled) return false;
      if (pendingFormFilter === 'UNFILLED' && team.isFormFilled) return false;

      // Queue status filter
      if (pendingQueueFilter !== 'ALL') {
        if (pendingQueueFilter === 'IN_QUEUE' && team.queueStatus !== 'IN_QUEUE' && team.queueStatus !== 'IN_PROGRESS') return false;
        if (pendingQueueFilter === 'NOT_BOOKED' && team.queueStatus !== 'NOT_BOOKED') return false;
        if (pendingQueueFilter === 'DELAYED' && team.queueStatus !== 'DELAYED') return false;
        if (pendingQueueFilter === 'IN_PROGRESS' && team.queueStatus !== 'IN_PROGRESS') return false;
      }

      // Tier filter
      if (pendingTierFilter !== 'ALL') {
        if (pendingTierFilter.toLowerCase() !== (team.tier || '').toLowerCase()) return false;
      }

      // School filter
      if (pendingSchoolFilter !== 'ALL' && team.school !== pendingSchoolFilter) {
        return false;
      }

      // Search query
      if (pendingSearchTerm.trim()) {
        const q = pendingSearchTerm.toLowerCase().trim();
        const match = 
          team.teamId.toLowerCase().includes(q) ||
          team.teamName.toLowerCase().includes(q) ||
          team.leaderName.toLowerCase().includes(q) ||
          team.leaderPhone.toLowerCase().includes(q) ||
          team.leaderRegNo.toLowerCase().includes(q) ||
          team.psId.toLowerCase().includes(q) ||
          team.psTitle.toLowerCase().includes(q) ||
          team.school.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [allPendingTeams, pendingFormFilter, pendingQueueFilter, pendingTierFilter, pendingSchoolFilter, pendingSearchTerm]);

  // Quick Assign pending team to a panel
  const handleQuickAssignPendingTeam = (team, targetPanelId) => {
    const teamId = team.temp_team_id || team.teamId;
    const targetPanel = evaluationPanels.find(p => p.id === targetPanelId);
    if (!targetPanel) return;

    const existingQueueItem = evaluationQueue[teamId];
    const now = Date.now();
    const tokenSeq = (panelQueues[targetPanel.id] || []).length + 1;
    const tokenNumber = `${targetPanel.code || 'PX'}-${String(tokenSeq).padStart(2, '0')}`;

    const newQueueItem = {
      teamId,
      teamName: team.team_name || team.teamName,
      leaderName: team.leader_name || team.leaderName,
      regNo: team.reg_no || team.leaderRegNo || '',
      psId: team.ps_id || team.psId || '',
      school: team.school || '',
      domain: team.domain || '',
      theme: team.theme || team.domain || 'Smart Automation',
      panelId: targetPanel.id,
      panelName: targetPanel.name,
      panelCode: targetPanel.code,
      room: targetPanel.room,
      tokenNumber,
      matchedHashtags: existingQueueItem?.matchedHashtags || getInitialTagsForTeam(team.rawTeam || team),
      bookedTimestamp: now,
      bookedTimeStr: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'WAITING'
    };

    const nextQueue = {
      ...evaluationQueue,
      [teamId]: newQueueItem
    };

    if (onUpdateQueue) onUpdateQueue(nextQueue);
    if (soundEnabled) playSoundAlert('chime');
  };

  // Batch Auto-Assign all unbooked pending teams across panels based on theme matching
  const handleBatchAutoAssignUnbooked = () => {
    const unbookedTeams = allPendingTeams.filter(t => t.queueStatus === 'NOT_BOOKED');
    if (unbookedTeams.length === 0) {
      alert('All pending teams already have queue tokens booked!');
      return;
    }
    if (!window.confirm(`Auto-assign and balance slots for all ${unbookedTeams.length} unbooked pending teams across panels based on domain matching?`)) {
      return;
    }

    const currentQueue = { ...evaluationQueue };
    const queueCounts = {};
    evaluationPanels.forEach(p => {
      queueCounts[p.id] = (panelQueues[p.id] || []).length;
    });

    const now = Date.now();
    unbookedTeams.forEach((team, idx) => {
      const rankedMatches = getMatchingPanelsForTeam(team.rawTeam || team, evaluationPanels, getInitialThemeForTeam(team.rawTeam || team), getInitialTagsForTeam(team.rawTeam || team));
      const targetPanel = rankedMatches[0]?.panel || evaluationPanels[0];
      queueCounts[targetPanel.id] = (queueCounts[targetPanel.id] || 0) + 1;
      const tokenNumber = `${targetPanel.code || 'PX'}-${String(queueCounts[targetPanel.id]).padStart(2, '0')}`;

      currentQueue[team.teamId] = {
        teamId: team.teamId,
        teamName: team.teamName,
        leaderName: team.leaderName,
        regNo: team.leaderRegNo,
        psId: team.psId,
        school: team.school,
        domain: team.domain,
        theme: team.domain || 'Smart Automation',
        panelId: targetPanel.id,
        panelName: targetPanel.name,
        panelCode: targetPanel.code,
        room: targetPanel.room,
        tokenNumber,
        matchedHashtags: getInitialTagsForTeam(team.rawTeam || team),
        bookedTimestamp: now + (idx * 50),
        bookedTimeStr: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'WAITING'
      };
    });

    if (onUpdateQueue) onUpdateQueue(currentQueue);
    if (soundEnabled) playSoundAlert('chime');
    alert(`Successfully assigned ${unbookedTeams.length} pending teams across evaluation panels!`);
  };

  // Export Pending Teams to CSV
  const handleExportPendingTeamsCSV = () => {
    if (filteredPendingTeams.length === 0) {
      alert('No pending teams to export.');
      return;
    }

    const headers = [
      'Team ID',
      'Team Name',
      'Tier',
      'Registration Form Status',
      'Queue Status',
      'Assigned Panel',
      'Room',
      'Token Number',
      'Leader Name',
      'Leader Reg No',
      'Leader Mobile',
      'Leader Email',
      'School / Department',
      'Problem Statement ID',
      'Problem Statement Title',
      'Domain / Theme',
      'Faculty Mentor Name',
      'Faculty Mentor Mobile',
      'Total Members',
      'Form Submitted Timestamp'
    ];

    const rows = filteredPendingTeams.map(t => [
      `"${t.teamId}"`,
      `"${(t.teamName || '').replace(/"/g, '""')}"`,
      `"${t.tier}"`,
      `"${t.isFormFilled ? 'Form Submitted' : 'Form NOT Filled'}"`,
      `"${t.queueStatusLabel}"`,
      `"${t.queueItem?.panelName || '—'}"`,
      `"${t.queueItem?.room || '—'}"`,
      `"${t.queueItem?.tokenNumber || '—'}"`,
      `"${(t.leaderName || '').replace(/"/g, '""')}"`,
      `"${t.leaderRegNo || '—'}"`,
      `"${t.leaderPhone || '—'}"`,
      `"${t.leaderEmail || '—'}"`,
      `"${(t.school || '').replace(/"/g, '""')}"`,
      `"${t.psId || '—'}"`,
      `"${(t.psTitle || '').replace(/"/g, '""')}"`,
      `"${(t.domain || '').replace(/"/g, '""')}"`,
      `"${(t.facultyMentor || '').replace(/"/g, '""')}"`,
      `"${t.facultyMentorPhone || '—'}"`,
      t.memberCount || 6,
      `"${t.submittedAt ? new Date(t.submittedAt).toLocaleString() : 'Not Submitted'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sih2026_pending_evaluation_teams_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Master Analytics & Real-Time Performance KPIs
  const analyticsData = useMemo(() => {
    const totalTeamsCount = allTeams.length || 0;
    const evaluatedTeamsCount = consolidatedLedger.length;
    const inQueueCount = Object.keys(evaluationQueue || {}).length;
    const activeSessionsCount = Object.keys(activeSessions || {}).length;
    const completionPct = totalTeamsCount > 0 ? Math.round((evaluatedTeamsCount / totalTeamsCount) * 100) : 0;

    const allLedger = evaluationLedger || [];
    const totalIndividualEvals = allLedger.length;
    const overallAvgScore = totalIndividualEvals > 0 
      ? (allLedger.reduce((sum, e) => sum + (e.totalScore || 0), 0) / totalIndividualEvals).toFixed(1)
      : '0.0';
    const overallAvgPct = totalIndividualEvals > 0 ? Math.round((parseFloat(overallAvgScore) / 50) * 100) : 0;

    // Panel stats
    const panelStats = evaluationPanels.map(panel => {
      const panelEvals = allLedger.filter(e => e.panelId === panel.id);
      const uniqueTeams = new Set(panelEvals.map(e => e.teamId)).size;
      const qCount = (panelQueues[panel.id] || []).length;
      const activeSession = activeSessions[panel.id];
      const avg = panelEvals.length > 0
        ? (panelEvals.reduce((s, e) => s + (e.totalScore || 0), 0) / panelEvals.length).toFixed(1)
        : '—';
      return {
        panel,
        evalCount: panelEvals.length,
        uniqueTeams,
        qCount,
        activeSession,
        avgScore: avg
      };
    });

    // Score distribution tiers
    const tiers = {
      outstanding: allLedger.filter(e => e.totalScore >= 45).length,
      excellent: allLedger.filter(e => e.totalScore >= 40 && e.totalScore < 45).length,
      good: allLedger.filter(e => e.totalScore >= 35 && e.totalScore < 40).length,
      satisfactory: allLedger.filter(e => e.totalScore >= 28 && e.totalScore < 35).length,
      needsImprovement: allLedger.filter(e => e.totalScore < 28).length,
    };

    // Jury Activity
    const juryActivityMap = {};
    evaluationPanels.forEach(p => {
      (p.juries || []).forEach(j => {
        juryActivityMap[j.name] = {
          name: j.name,
          role: j.role || j.designation,
          panelCode: p.code,
          panelName: p.name,
          count: 0,
          totalSum: 0
        };
      });
    });

    allLedger.forEach(e => {
      const name = e.evaluatorName || e.juries?.[0]?.name;
      if (name) {
        if (!juryActivityMap[name]) {
          juryActivityMap[name] = {
            name,
            role: e.evaluatorRole || 'Evaluator',
            panelCode: e.panelId || 'P',
            panelName: e.panelName || 'Panel',
            count: 0,
            totalSum: 0
          };
        }
        juryActivityMap[name].count += 1;
        juryActivityMap[name].totalSum += (e.totalScore || 0);
      }
    });

    const juryActivityList = Object.values(juryActivityMap).map(j => ({
      ...j,
      avgScore: j.count > 0 ? (j.totalSum / j.count).toFixed(1) : '—'
    })).sort((a, b) => b.count - a.count);

    // Delayed Teams
    const delayedTeams = Object.values(evaluationQueue || {}).filter(t => t.status === 'DELAYED');

    return {
      totalTeamsCount,
      evaluatedTeamsCount,
      inQueueCount,
      activeSessionsCount,
      completionPct,
      totalIndividualEvals,
      overallAvgScore,
      overallAvgPct,
      panelStats,
      tiers,
      juryActivityList,
      delayedTeams
    };
  }, [allTeams, consolidatedLedger, evaluationLedger, evaluationQueue, activeSessions, evaluationPanels, panelQueues]);

  const handleExportLedgerCSV = () => {
    const headers = ['Evaluation ID', 'Panel', 'Room', 'Evaluator Jury', 'Role', 'Team ID', 'Team Name', 'Leader Name', 'Reg No', 'PS ID', 'Innovation (10)', 'Feasibility (10)', 'Prototype (10)', 'Pitch (10)', 'Q&A Defense (10)', 'Total / 50', 'Score %', 'Time', 'Feedback'];
    const rows = (evaluationLedger || []).map(l => [
      `"${l.id}"`,
      `"${l.panelName}"`,
      `"${l.room}"`,
      `"${l.evaluatorName || l.juries?.[0]?.name || 'Evaluator Jury'}"`,
      `"${l.evaluatorRole || 'Evaluator'}"`,
      `"${l.teamId}"`,
      `"${(l.teamName || '').replace(/"/g, '""')}"`,
      `"${(l.leaderName || '').replace(/"/g, '""')}"`,
      `"${l.regNo || ''}"`,
      `"${l.psId || ''}"`,
      l.scores?.innovation || 0,
      l.scores?.feasibility || 0,
      l.scores?.prototype || 0,
      l.scores?.presentation || 0,
      l.scores?.defense || 0,
      l.totalScore,
      `${l.percentage}%`,
      `"${l.evaluatedAtStr}"`,
      `"${(l.feedback || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(',')).join('\n')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SIH_MultiJury_Evaluation_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Single Score Deletion from Ledger
  const handleDeleteScoreEntry = (scoreIdOrIndex, teamName = 'this team', evaluatorName = '') => {
    const confirmMsg = evaluatorName 
      ? `Are you sure you want to delete the evaluation score submitted by "${evaluatorName}" for team "${teamName}"? This action cannot be undone.`
      : `Are you sure you want to delete this evaluation score for team "${teamName}"?`;

    if (window.confirm(confirmMsg)) {
      const newLedger = (evaluationLedger || []).filter((item, idx) => {
        if (item.id && typeof scoreIdOrIndex === 'string') {
          return item.id !== scoreIdOrIndex;
        }
        return idx !== scoreIdOrIndex;
      });

      if (onUpdateLedger) onUpdateLedger(newLedger);
      try {
        localStorage.setItem('sih_evaluation_ledger', JSON.stringify(newLedger));
      } catch (e) {}
    }
  };

  // Handle Deleting all evaluations for a specific team
  const handleDeleteAllTeamScores = (teamId, teamName = 'this team') => {
    if (window.confirm(`Are you sure you want to delete ALL recorded evaluation scores for team "${teamName}" (${teamId})?`)) {
      const newLedger = (evaluationLedger || []).filter(item => item.teamId !== teamId);
      if (onUpdateLedger) onUpdateLedger(newLedger);
      try {
        localStorage.setItem('sih_evaluation_ledger', JSON.stringify(newLedger));
      } catch (e) {}
    }
  };

  return (
    <div className="eval-queue-viewport">
      <header className='eval-top-navbar'>
        <div className='eval-nav-left'>
          <button className='btn-eval-back' onClick={onBackToMain}>
            <ArrowLeft size={16} />
            <span>Main Portal</span>
          </button>
          <div className='eval-portal-brand'>
            <div className='eval-pulse-indicator'>
              <span className='eval-live-ring'></span>
              <span className='eval-live-dot'></span>
            </div>
            <div>
              <span className='eval-brand-title'>
                SIH 2026 • DIGITAL EVALUATION QUEUE
              </span>
              <span className='eval-brand-sub'>
                Multi-Panel Synchronous Evaluation &amp; Live Timing
              </span>
            </div>
          </div>
        </div>

        {/* Center Mode Switcher Tabs */}
        <div className='eval-nav-center'>
          <div className='eval-mode-tabs'>
            <button 
              className={`eval-tab-btn ${activeView === 'projector' ? 'active projector' : ''}`}
              onClick={() => handleSwitchTab('projector')}
            >
              <Monitor size={15} />
              <span>Live Panel Evaluation</span>
            </button>
            <button 
              className={`eval-tab-btn ${activeView === 'student' ? 'active student' : ''}`}
              onClick={() => handleSwitchTab('student')}
            >
              <Smartphone size={15} />
              <span>Student Slot Booking</span>
            </button>
            <button 
              className={`eval-tab-btn ${activeView === 'pending' ? 'active pending' : ''}`}
              onClick={() => handleSwitchTab('pending')}
            >
              <Users size={15} />
              <span>Pending Teams ({pendingStats.total})</span>
            </button>
            {isAdminLoggedIn && (
              <>
                <button 
                  className={`eval-tab-btn ${activeView === 'analytics' ? 'active analytics' : ''}`}
                  onClick={() => handleSwitchTab('analytics')}
                >
                  <BarChart3 size={15} />
                  <span>Master Analytics &amp; KPIs</span>
                </button>
                <button 
                  className={`eval-tab-btn ${activeView === 'ledger' ? 'active ledger' : ''}`}
                  onClick={() => handleSwitchTab('ledger')}
                >
                  <FileText size={15} />
                  <span>Evaluation Ledger ({(evaluationLedger || []).length})</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className='eval-nav-right'>
          {/* Admin Live Arena Reveal / Relock Control Button (Always Accessible) */}
          <button 
            className={`btn-eval-arena-reveal-toggle ${isPanelRevealed ? 'is-revealed' : 'is-locked'}`}
            onClick={handleAdminRevealClick}
            title={isPanelRevealed ? 'Live Arena Screen is REVEALED. Click to Re-lock to 09:45 AM countdown.' : 'Live Arena Screen is LOCKED until 09:45 AM. Click to Reveal early.'}
          >
            <Radio size={14} className={isPanelRevealed ? 'animate-pulse' : ''} />
            <span>{isPanelRevealed ? 'Arena: Revealed (Live)' : '⚡ Reveal Arena (Admin)'}</span>
          </button>

          {/* Admin Management Actions */}
          {isAdminLoggedIn && (
            <>
              <button 
                className='btn-eval-manage-panels' 
                onClick={() => setIsPanelModalOpen(true)}
                title='Configure Panels, Juries, and Timing'
              >
                <Layers size={15} />
                <span>Manage Panels</span>
              </button>

              <button 
                className='btn-eval-reset-data' 
                onClick={handleResetAllEvaluation}
                title='Reset All Evaluation Queues, Tokens, and Ledger Scores (Preserves Panels & Themes)'
                style={{
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1.5px solid #fecaca',
                  padding: '7px 12px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={14} />
                <span>Reset Eval Data</span>
              </button>

              {onOpenAdminGateway && (
                <button 
                  className='btn-nav-admin active-admin'
                  onClick={onOpenAdminGateway}
                  title='Open Master Admin Gateway (Ctrl+Shift+A)'
                >
                  <LayoutDashboard size={15} />
                  <span>Admin Gateway</span>
                </button>
              )}
            </>
          )}

          <button 
            className='btn-sound-toggle'
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute Sounds' : 'Enable Sound Alerts'}
          >
            {soundEnabled ? <Volume2 size={16} className='text-emerald' /> : <VolumeX size={16} className='text-muted' />}
          </button>
        </div>
      </header>

      {/* VIEW 1: ARENA PROJECTOR BIG SCREEN */}
      {activeView === 'projector' && (
        <div className='eval-projector-container'>
          {/* Live High-Priority Broadcast Calling Banner */}
          {callingTeamAlert && (
            <div className='eval-broadcast-calling-banner'>
              <div className='calling-banner-left'>
                <div className='calling-pulse-badge'>
                  <Radio size={16} className='animate-pulse text-amber' />
                  <span>NOW CALLING TO PANEL</span>
                </div>
                <div className='calling-details'>
                  <strong className='calling-team-name'>
                    {callingTeamAlert.teamName} (Token: {callingTeamAlert.tokenNumber})
                  </strong>
                  <span className='calling-dest'>
                    Please proceed immediately to <strong>{callingTeamAlert.panelCode} — {callingTeamAlert.panelName}</strong> ({callingTeamAlert.room}) • Lead: {callingTeamAlert.leaderName}
                  </span>
                </div>
              </div>
              <div className='calling-banner-actions'>
                <button 
                  className='btn-start-called-pitch'
                  onClick={() => {
                    const panel = evaluationPanels.find(p => p.id === callingTeamAlert.panelId || p.code === callingTeamAlert.panelCode);
                    const team = evaluationQueue[callingTeamAlert.teamId];
                    if (panel && team) {
                      handleStartPanelEvaluation(panel, team);
                    }
                    setCallingTeamAlert(null);
                  }}
                >
                  <Play size={14} />
                  <span>Start Pitch Now</span>
                </button>
                <button 
                  className='btn-dismiss-call'
                  onClick={() => setCallingTeamAlert(null)}
                  title='Dismiss Announcement'
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          <div className='projector-header-row'>
            <div className='projector-title-block'>
              <span className='projector-tag'>CAMPUS EVALUATION AUTHORITY</span>
              <h1>LIVE MULTI-PANEL EVALUATION STATIONS</h1>
            </div>

            <div className='projector-clock-block'>
              <LivePixelDigitalClock variant='mini' />
            </div>

            <div className='projector-stats-pills'>
              <div className='projector-stat-box'>
                <span className='stat-val'>{(evaluationLedger || []).length}</span>
                <span className='stat-lbl'>Evaluated</span>
              </div>
              <div className='projector-stat-box'>
                <span className='stat-val'>{Object.keys(evaluationQueue || {}).length}</span>
                <span className='stat-lbl'>In Queue</span>
              </div>
              <div className='projector-stat-box'>
                <span className='stat-val'>{evaluationPanels.length}</span>
                <span className='stat-lbl'>Active Panels</span>
              </div>
            </div>
          </div>

          {!isPanelRevealed ? (
            /* PRE-EVALUATION 09:45 AM LIVE PANEL REVEAL GATE */
            <div className='projector-reveal-gate-card'>
              <div className='reveal-gate-header'>
                <div className='reveal-status-pill'>
                  <Radio size={16} className='pulse-dot live' />
                  <span>ARENA LIVE BROADCAST • 09:45 AM STAGE REVEAL</span>
                </div>
                <h2>Live Multi-Panel Arena Reveals at 9:45 AM</h2>
                <p>Live presentation clocks, active jury scoring indicators, and real-time station queues across all 5 evaluation panels will officially reveal on this arena display in:</p>
              </div>

              {/* Digital Countdown Dial Deck */}
              <div className='projector-reveal-countdown-deck'>
                <div className='reveal-dial-unit'>
                  <span className='dial-digits'>{panelRevealCountdown.hrs}</span>
                  <span className='dial-unit-lbl'>HOURS</span>
                </div>
                <span className='dial-sep'>:</span>
                <div className='reveal-dial-unit'>
                  <span className='dial-digits'>{panelRevealCountdown.mins}</span>
                  <span className='dial-unit-lbl'>MINUTES</span>
                </div>
                <span className='dial-sep'>:</span>
                <div className='reveal-dial-unit'>
                  <span className='dial-digits'>{panelRevealCountdown.secs}</span>
                  <span className='dial-unit-lbl'>SECONDS</span>
                </div>
              </div>

              {/* Panel Status & Venue Overview Grid */}
              <div className='reveal-panels-preview-grid'>
                {evaluationPanels.map((p, idx) => (
                  <div key={p.id} className='reveal-panel-preview-card'>
                    <div className='preview-card-header'>
                      <span className='preview-code-tag'>{p.code || `P${idx + 1}`}</span>
                      <span className='preview-room-tag'>{p.room}</span>
                    </div>
                    <h4>{p.name.split('—')[1] || p.name}</h4>
                    <div className='preview-jury-meta'>
                      <span>👨‍⚖️ {p.juries ? p.juries.length : 2} Evaluators Assigned</span>
                      <span>⏱ {p.presentMins || 20}m Pitch + {p.qaMins || 10}m Q&amp;A</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Admin Early Access Unlock */}
              <div className='reveal-override-strip'>
                <span>⚡ <strong>Evaluation Authority:</strong> Live arena wall scheduled to reveal at 09:45 AM.</span>
                <button 
                  type='button'
                  className='btn-reveal-override-preview admin'
                  onClick={handleAdminRevealClick}
                >
                  <Play size={13} />
                  <span>⚡ Admin Reveal Arena Wall</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Admin Relock Option Bar */}
              <div className='admin-arena-status-bar'>
                <span>📺 <strong>Arena Wall Status:</strong> Live evaluation stations are actively revealed on the display.</span>
                <button
                  type='button'
                  className='btn-relock-arena-countdown'
                  onClick={handleAdminRevealClick}
                  title='Re-lock to 09:45 AM Countdown Gate'
                >
                  <Clock size={13} />
                  <span>Re-lock to 09:45 AM Countdown</span>
                </button>
              </div>

              <div className='projector-panels-grid'>
              {evaluationPanels.map((panel, idx) => {
                const currentSession = activeSessions[panel.id];
                const timing = getSessionTimingInfo(currentSession);
                const queuedTeams = panelQueues[panel.id] || [];
                const isDragOver = dragOverPanelId === panel.id;

                return (
                  <div 
                    key={panel.id} 
                    className={`projector-panel-card ${currentSession ? 'is-evaluating' : 'is-idle'} ${isDragOver ? 'drag-over-active' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverPanelId !== panel.id) setDragOverPanelId(panel.id);
                    }}
                    onDragLeave={() => setDragOverPanelId(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedTeamId) {
                        handleMoveTeam(draggedTeamId, panel.id);
                      }
                      setDraggedTeamId(null);
                      setDraggedSourcePanelId(null);
                      setDragOverPanelId(null);
                    }}
                  >
                    <div className='panel-card-top'>
                      <div className='panel-badge-group'>
                        <span className='panel-code-pill'>{panel.code || (`P${idx+1}`)}</span>
                        <span className='panel-room-tag'>{panel.room}</span>
                      </div>
                      <span className={`panel-status-pill ${currentSession ? 'live' : 'idle'}`}>
                        {currentSession ? 'LIVE EVALUATING' : 'AWAITING TEAM'}
                      </span>
                    </div>

                    <h3 className='panel-name-heading'>{panel.name}</h3>
                    <div className='panel-juries-row'>
                      <span className='jury-label'>Jury Panel:</span>
                      <span className='jury-names'>{(panel.juries || []).map(j => j.name).filter(Boolean).join(' • ') || 'Faculty Evaluators'}</span>
                    </div>

                    {currentSession && timing ? (
                      <div className='panel-active-eval-box'>
                        <div className='active-eval-header'>
                          <span className='live-eval-tag'>NOW PRESENTING</span>
                          <span className={`phase-pill ${timing.phase.toLowerCase()}`}>
                            {timing.phase === 'PRESENTATION' ? 'Pitch Phase' : timing.phase === 'QA' ? 'Jury Q&A' : 'Time Up'}
                          </span>
                        </div>

                        <div className={`projector-timer-display ${timing.phase === 'QA' ? 'qa-phase' : ''}`}>
                          <Clock size={28} className='timer-ico' />
                          <span className='big-countdown-digits'>{timing.timeDisplay}</span>
                          {timing.isPaused && <span className='paused-label'>[PAUSED]</span>}
                        </div>

                        <div className='projector-progress-bar-wrap'>
                          <div 
                            className={`projector-progress-bar-fill ${timing.phase === 'QA' ? 'qa' : ''}`}
                            style={{ width: `${timing.progressPct}%` }}
                          ></div>
                        </div>

                        <div className='active-team-details'>
                          <div className='active-team-id-row'>
                            <span className='badge-team-id'>{currentSession.teamId}</span>
                            <span className='active-ps-id'>{currentSession.psId}</span>
                          </div>
                          <h2 className='active-team-name-title'>{currentSession.teamName}</h2>
                          {currentSession.psTitle && (
                            <p className='active-ps-title'>{currentSession.psTitle}</p>
                          )}
                          <div className='active-leader-school'>
                            <span>Leader: <strong>{currentSession.leaderName}</strong></span>
                            <span>• {currentSession.school}</span>
                          </div>
                        </div>

                        {/* Admin Timing Controls */}
                        {isAdminLoggedIn && (
                          <div className='admin-session-controls-strip'>
                            <button 
                              className='btn-session-ctrl pause'
                              onClick={() => handleToggleTimerPause(panel.id)}
                              title={timing.isPaused ? 'Resume Timer' : 'Pause Timer'}
                            >
                              {timing.isPaused ? <Play size={13} /> : <Pause size={13} />}
                              <span>{timing.isPaused ? 'Resume' : 'Pause'}</span>
                            </button>
                            <button 
                              className='btn-session-ctrl extend'
                              onClick={() => handleExtendSession(panel.id, 5)}
                              title='Extend +5 Minutes'
                            >
                              <Plus size={13} />
                              <span>+5 Min</span>
                            </button>
                            <button 
                              className='btn-session-ctrl delay'
                              onClick={() => {
                                if (window.confirm(`Skip & Delay active team "${activeSession.teamName}"? They will be placed at the end of the queue.`)) {
                                  handleDelayTeamSlot(activeSession.teamId, panel.id);
                                }
                              }}
                              title='Skip / Delay Slot (Move active team to back of waiting queue)'
                            >
                              <FastForward size={13} />
                              <span>Skip / Delay</span>
                            </button>
                            <button 
                              className='btn-session-ctrl stop'
                              onClick={() => handleConcludeSession(panel.id, true)}
                              title='Stop & Auto-Complete Evaluation'
                            >
                              <Square size={13} />
                              <span>Stop &amp; Conclude</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className='panel-idle-eval-box'>
                        <div className='idle-icon-wrap'>
                          <Users size={32} />
                        </div>
                        <h4>Panel Ready &amp; Standing By</h4>
                        <p>Jury is awaiting next assigned team from the digital queue.</p>
                        {queuedTeams.length > 0 && (
                          isAdminLoggedIn ? (
                            <button 
                              className='btn-call-first-team'
                              onClick={() => handleCallNextTeamInPanel(panel.id, false)}
                            >
                              <Megaphone size={14} />
                              <span>Call Next: {queuedTeams[0].teamName} ({queuedTeams[0].tokenNumber})</span>
                            </button>
                          ) : (
                            <div className='idle-next-team-tag'>
                              <span>Next on Deck: <strong>{queuedTeams[0].teamName} ({queuedTeams[0].tokenNumber})</strong></span>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {/* Panel Queue Preview with Drag & Drop / Reordering */}
                    <div className='panel-queue-preview-section'>
                      <div className='queue-section-title'>
                        <div className='q-title-left'>
                          <span>QUEUE ({queuedTeams.length})</span>
                          {isAdminLoggedIn && <span className='drag-hint-pill'>Drag &amp; Swap</span>}
                        </div>
                        {queuedTeams.length > 0 && isAdminLoggedIn && (
                          <button 
                            className='btn-mini-call-next'
                            onClick={() => handleCallNextTeamInPanel(panel.id, false)}
                            title='Call next team over speaker'
                          >
                            <Megaphone size={12} />
                            <span>Call Next</span>
                          </button>
                        )}
                      </div>

                      {queuedTeams.length === 0 ? (
                        <div className='empty-queue-msg'>No teams in queue. Drag a team here to assign.</div>
                      ) : (
                        <div className='queued-teams-compact-list'>
                          {queuedTeams.map((item, qIdx) => (
                            <div 
                              key={item.teamId} 
                              className={`queued-team-item-row ${item.status === 'CALLING' ? 'is-calling' : ''} ${item.status === 'DELAYED' ? 'is-delayed' : ''} ${draggedTeamId === item.teamId ? 'is-dragging' : ''} ${isAdminLoggedIn ? 'is-admin' : 'is-viewer'}`}
                              draggable={isAdminLoggedIn}
                              onDragStart={() => {
                                if (!isAdminLoggedIn) return;
                                setDraggedTeamId(item.teamId);
                                setDraggedSourcePanelId(panel.id);
                              }}
                              onDragEnd={() => {
                                setDraggedTeamId(null);
                                setDraggedSourcePanelId(null);
                                setDragOverPanelId(null);
                              }}
                            >
                              <div className='q-item-main-content'>
                                <div className='q-item-top-header'>
                                  {isAdminLoggedIn && (
                                    <span className='drag-handle-grip' title='Drag to reorder or move across panels'>
                                      <GripVertical size={13} />
                                    </span>
                                  )}
                                  <span className='q-token-badge'>{item.tokenNumber}</span>
                                  <strong className='q-team-title' title={item.teamName}>{item.teamName}</strong>
                                  {item.status === 'CALLING' ? (
                                    <span className='calling-indicator-badge'>📢 CALLING</span>
                                  ) : item.status === 'DELAYED' ? (
                                    <span className='delayed-indicator-badge'>⏳ DELAYED ({item.delayedCount || 1}x)</span>
                                  ) : (
                                    <span className='q-status-tag'>#{qIdx + 1}</span>
                                  )}
                                </div>
                                <div className='q-item-sub-info'>
                                  <span className='q-lead-sub'>{item.leaderName} ({item.teamId})</span>
                                </div>
                              </div>

                              {isAdminLoggedIn && (
                                <div className='q-item-admin-actions'>
                                  {/* Quick Reorder Up / Down */}
                                  <button 
                                    className='btn-q-action'
                                    onClick={() => handleSwapQueueOrder(item.teamId, 'up')}
                                    disabled={qIdx === 0}
                                    title='Move Up in Queue'
                                  >
                                    <ArrowUp size={11} />
                                  </button>
                                  <button 
                                    className='btn-q-action'
                                    onClick={() => handleSwapQueueOrder(item.teamId, 'down')}
                                    disabled={qIdx === queuedTeams.length - 1}
                                    title='Move Down in Queue'
                                  >
                                    <ArrowDown size={11} />
                                  </button>

                                  {/* Transfer Dropdown */}
                                  <select 
                                    className='q-panel-transfer-select'
                                    value={panel.id}
                                    onChange={(e) => handleMoveTeam(item.teamId, e.target.value)}
                                    title='Transfer to another panel'
                                  >
                                    {evaluationPanels.map(p => (
                                      <option key={p.id} value={p.id}>
                                        {p.code}: {p.name.split('—')[1] || p.name}
                                      </option>
                                    ))}
                                  </select>

                                  {/* Skip / Delay Team */}
                                  <button 
                                    className='btn-q-action delay'
                                    onClick={() => handleDelayTeamSlot(item.teamId, panel.id)}
                                    title='Skip / Delay Slot (Move to End of Queue)'
                                  >
                                    <FastForward size={11} />
                                  </button>

                                  {/* Call Now */}
                                  <button 
                                    className='btn-q-action call'
                                    onClick={() => announceTeamCall(item, panel)}
                                    title='Announce / Call Team'
                                  >
                                    <Megaphone size={11} />
                                  </button>

                                  {/* Start Evaluation */}
                                  <button 
                                    className='btn-q-action start'
                                    onClick={() => handleStartPanelEvaluation(panel, item)}
                                    title='Start Presentation'
                                  >
                                    <Play size={11} />
                                  </button>

                                  {/* Delete */}
                                  <button 
                                    className='btn-q-action delete'
                                    onClick={() => handleDeleteFromQueue(item.teamId)}
                                    title='Cancel & Remove from Queue'
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          )}
        </div>
      )}

      {/* VIEW 3: STUDENT SLOT BOOKING — 3-STEP PROGRESSIVE WIZARD FLOW */}
      {activeView === 'student' && (
        <div className='eval-student-container'>
          {!isBookingOpen && !bookingSuccessToken ? (
            /* PRE-EVALUATION 08:00 AM COUNTDOWN GATE */
            <div className='student-booking-card student-countdown-gate-card'>
              <div className='countdown-gate-header'>
                <div className='countdown-status-pill'>
                  <Clock size={15} className='pulse-dot' />
                  <span>PRE-EVALUATION GATEWAY • 08:00 AM DISPATCH</span>
                </div>
                <h2>Evaluation Slot Booking Opens at 8:00 AM</h2>
                <p>The automated smart load-balanced queue for all 109 teams across 5 Panels will officially unlock in:</p>
              </div>

              {/* Digital Countdown Dial Deck */}
              <div className='booking-countdown-deck'>
                <div className='countdown-dial-unit'>
                  <span className='dial-digits'>{openCountdown.hrs}</span>
                  <span className='dial-unit-lbl'>HOURS</span>
                </div>
                <span className='dial-sep'>:</span>
                <div className='countdown-dial-unit'>
                  <span className='dial-digits'>{openCountdown.mins}</span>
                  <span className='dial-unit-lbl'>MINUTES</span>
                </div>
                <span className='dial-sep'>:</span>
                <div className='countdown-dial-unit'>
                  <span className='dial-digits'>{openCountdown.secs}</span>
                  <span className='dial-unit-lbl'>SECONDS</span>
                </div>
              </div>

              {/* Info & Rule Chips */}
              <div className='countdown-info-chips-grid'>
                <div className='c-info-chip'>
                  <strong>👥 109 Finalized Teams</strong>
                  <span>Pre-registered in Master Roster</span>
                </div>
                <div className='c-info-chip'>
                  <strong>🏛 5 Expert Panels</strong>
                  <span>Smart Load-Balanced Allocation</span>
                </div>
                <div className='c-info-chip'>
                  <strong>⏱ 20m Pitch + 10m Q&amp;A</strong>
                  <span>Section 65B Digital Rubric</span>
                </div>
              </div>

              {/* Admin Early Access Unlock */}
              {isAdminLoggedIn && (
                <div className='admin-countdown-override-bar'>
                  <span>⚡ <strong>Admin Override:</strong> You have master administrative access.</span>
                  <button 
                    type='button' 
                    className='btn-admin-unlock-early'
                    onClick={() => setAdminBookingOverride(true)}
                  >
                    <Play size={13} />
                    <span>Unlock Booking Desk Now</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
          <div className='student-booking-card'>
            <div className='student-header-block'>
              <div className='student-badge'>
                <Sparkles size={14} className='text-emerald' />
                <span>EVALUATION SLOT DISPATCHER</span>
              </div>
              <h2>Book Evaluation Slot &amp; Get Token</h2>
              <p>Step-by-step dispatch workflow: Choose your team, select theme &amp; tech hashtags, and confirm your smart load-balanced panel allocation.</p>
            </div>

            {/* Visual Step Progress Indicator */}
            {!bookingSuccessToken && (
              <div className='student-wizard-stepper'>
                <div 
                  className={`wizard-step-node ${bookingStep >= 1 ? 'active' : ''} ${bookingStep > 1 ? 'completed' : ''}`}
                  onClick={() => { if (bookingStep > 1) setBookingStep(1); }}
                >
                  <div className='step-node-num'>{bookingStep > 1 ? <Check size={14} /> : '1'}</div>
                  <div className='step-node-content'>
                    <span className='step-label'>STEP 1</span>
                    <strong className='step-title'>Choose Team</strong>
                  </div>
                </div>

                <div className={`wizard-step-line ${bookingStep >= 2 ? 'active' : ''}`} />

                <div 
                  className={`wizard-step-node ${bookingStep >= 2 ? 'active' : ''} ${bookingStep > 2 ? 'completed' : ''}`}
                  onClick={() => { if (selectedTeamForBooking && bookingStep > 2) setBookingStep(2); }}
                >
                  <div className='step-node-num'>{bookingStep > 2 ? <Check size={14} /> : '2'}</div>
                  <div className='step-node-content'>
                    <span className='step-label'>STEP 2</span>
                    <strong className='step-title'>Theme &amp; Tech Tags</strong>
                  </div>
                </div>

                <div className={`wizard-step-line ${bookingStep >= 3 ? 'active' : ''}`} />

                <div className={`wizard-step-node ${bookingStep >= 3 ? 'active' : ''}`}>
                  <div className='step-node-num'>3</div>
                  <div className='step-node-content'>
                    <span className='step-label'>STEP 3</span>
                    <strong className='step-title'>Review &amp; Confirm</strong>
                  </div>
                </div>
              </div>
            )}

            {bookingSuccessToken ? (
              <div className='student-token-success-box'>
                <div className='token-card-header'>
                  <div className='token-org'>
                    <strong>SMART INDIA HACKATHON 2026</strong>
                    <span>Rathinam Global University</span>
                  </div>
                  <div className='token-number-hero'>
                    {bookingSuccessToken.tokenNumber}
                  </div>
                </div>

                <div className='token-card-body'>
                  <div className='token-detail-row'>
                    <span className='lbl'>Team Name:</span>
                    <strong className='val'>{bookingSuccessToken.teamName}</strong>
                  </div>
                  <div className='token-detail-row'>
                    <span className='lbl'>Assigned Panel:</span>
                    <strong className='val text-primary'>{bookingSuccessToken.panelName}</strong>
                  </div>
                  <div className='token-detail-row'>
                    <span className='lbl'>Allotted Room / Venue:</span>
                    <strong className='val text-emerald'>{bookingSuccessToken.room}</strong>
                  </div>
                  <div className='token-detail-row'>
                    <span className='lbl'>SIH Theme:</span>
                    <strong className='val text-indigo'>{bookingSuccessToken.theme || 'Smart Automation'}</strong>
                  </div>
                  <div className='token-detail-row'>
                    <span className='lbl'>Team Leader:</span>
                    <span className='val'>{bookingSuccessToken.leaderName} ({bookingSuccessToken.regNo})</span>
                  </div>
                  <div className='token-detail-row'>
                    <span className='lbl'>Problem Statement:</span>
                    <span className='val font-mono'>{bookingSuccessToken.psId}</span>
                  </div>
                  {bookingSuccessToken.matchedHashtags && bookingSuccessToken.matchedHashtags.length > 0 && (
                    <div className='token-detail-row hashtags-token-row'>
                      <span className='lbl'>Tech Hashtags:</span>
                      <div className='token-hashtags-list'>
                        {bookingSuccessToken.matchedHashtags.map((h, idx) => (
                          <span key={idx} className='token-h-tag'>{h}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className='token-qr-wrap'>
                  <QRCodeSVG 
                    value={`SIH26-EVAL|${bookingSuccessToken.teamId}|${bookingSuccessToken.tokenNumber}|${bookingSuccessToken.panelCode}|${bookingSuccessToken.theme || ''}`}
                    size={140}
                  />
                  <span className='token-qr-caption'>Show this Token QR at the Panel Entrance</span>
                </div>

                <button 
                  className='btn-book-another'
                  onClick={() => {
                    setBookingSuccessToken(null);
                    setSelectedTeamForBooking(null);
                    setStudentSearchInput('');
                    setBookingStep(1);
                  }}
                >
                  Book Slot for Another Team
                </button>
              </div>
            ) : bookingStep === 1 ? (
              /* STEP 1: CHOOSE TEAM */
              <div className='wizard-step-body step-1'>
                <div className='step-heading-row'>
                  <span className='step-badge-num'>Step 1</span>
                  <div>
                    <h3>Find &amp; Select Your Team</h3>
                    <p>Search by Team ID (e.g. T-042), Roll No, Register No, or Leader Name.</p>
                  </div>
                </div>

                <div className='slot-search-input-wrap'>
                  <Search size={18} className='search-ico' />
                  <input 
                    type='text' 
                    placeholder='Type Roll No (e.g. 23BCS041), Reg No, or Team ID...'
                    value={studentSearchInput}
                    onChange={e => setStudentSearchInput(e.target.value)}
                    autoFocus
                  />
                  {studentSearchInput && (
                    <button className='btn-clear' onClick={() => setStudentSearchInput('')}>✕</button>
                  )}
                </div>

                {!studentSearchInput.trim() ? (
                  <div className='empty-search-callout'>
                    <Search size={28} className='text-muted' />
                    <p>Enter your Roll Number or Team ID above to look up your registration.</p>
                  </div>
                ) : (
                  <div className='student-matched-teams-list'>
                    {allTeams
                      .filter(t => {
                        const q = studentSearchInput.toLowerCase().trim();
                        return (
                          t.temp_team_id.toLowerCase().includes(q) ||
                          t.team_name.toLowerCase().includes(q) ||
                          t.leader_name.toLowerCase().includes(q) ||
                          t.reg_no.toLowerCase().includes(q)
                        );
                      })
                      .slice(0, 6)
                      .map(team => {
                        const teamId = team.temp_team_id;
                        const isQueued = evaluationQueue[teamId];
                        const teamEvals = (evaluationLedger || []).filter(l => l.teamId === teamId);
                        const isEvaluated = teamEvals.length > 0;

                        return (
                          <div 
                            key={teamId} 
                            className={`student-team-selection-card ${isQueued || isEvaluated ? 'is-disabled' : ''}`}
                            onClick={() => {
                              if (!isQueued && !isEvaluated) {
                                setSelectedTeamForBooking(team);
                                setBookingStep(2);
                              }
                            }}
                          >
                            <div className='team-opt-left-head'>
                              <div className='team-code-title'>
                                <span className='code-pill'>{team.temp_team_id}</span>
                                <strong>{team.team_name}</strong>
                              </div>
                              <span className='team-leader-sub'>Lead: {team.leader_name} ({team.reg_no}) • {team.ps_id}</span>
                              {team.ps_title && (
                                <div className='team-ps-title-sub' title={team.ps_title}>
                                  {team.ps_title}
                                </div>
                              )}
                            </div>

                            <div className='team-opt-actions'>
                              {isEvaluated ? (
                                <span className='status-evaluated-badge'>
                                  <CheckCircle2 size={14} />
                                  <span>{teamEvals.length} Evaluation{teamEvals.length > 1 ? 's' : ''} Completed</span>
                                </span>
                              ) : isQueued ? (
                                <button 
                                  className='btn-view-existing-token'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setBookingSuccessToken(isQueued);
                                  }}
                                >
                                  View Token #{isQueued.tokenNumber}
                                </button>
                              ) : (
                                <button 
                                  className='btn-select-team-cta'
                                  onClick={() => {
                                    setSelectedTeamForBooking(team);
                                    setBookingStep(2);
                                  }}
                                >
                                  <span>Select Team</span>
                                  <ArrowRight size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            ) : bookingStep === 2 && selectedTeamForBooking ? (
              /* STEP 2: SELECT THEME & DOMAIN #HASHTAGS */
              (() => {
                const team = selectedTeamForBooking;
                const teamId = team.temp_team_id;
                const currentTheme = studentSelectedThemes[teamId] || getInitialThemeForTeam(team);
                const currentTags = studentSelectedTags[teamId] || getInitialTagsForTeam(team);
                const currentCustomInput = studentCustomTagInputs[teamId] || '';

                const rankedMatches = getMatchingPanelsForTeam(team, evaluationPanels, currentTheme, currentTags);
                const bestMatch = rankedMatches[0] || { panel: evaluationPanels[0], matchScore: 90, matchedTags: [] };

                const handleAddCustomTag = (e) => {
                  if (e) e.preventDefault();
                  if (!currentCustomInput.trim()) return;
                  const raw = currentCustomInput.trim();
                  const formatted = raw.startsWith('#') ? raw : `#${raw}`;
                  if (!currentTags.includes(formatted)) {
                    setStudentSelectedTags(prev => ({
                      ...prev,
                      [teamId]: [...currentTags, formatted]
                    }));
                  }
                  setStudentCustomTagInputs(prev => ({ ...prev, [teamId]: '' }));
                };

                const handleToggleTag = (tag) => {
                  const exists = currentTags.includes(tag);
                  const nextTags = exists 
                    ? currentTags.filter(t => t !== tag) 
                    : [...currentTags, tag];
                  setStudentSelectedTags(prev => ({
                    ...prev,
                    [teamId]: nextTags
                  }));
                };

                const handleRemoveTag = (tagToRemove) => {
                  setStudentSelectedTags(prev => ({
                    ...prev,
                    [teamId]: currentTags.filter(t => t !== tagToRemove)
                  }));
                };

                const handleThemeChange = (newTheme) => {
                  setStudentSelectedThemes(prev => ({
                    ...prev,
                    [teamId]: newTheme
                  }));
                  const themeTags = THEME_TECH_HASHTAG_MAP[newTheme] || [];
                  if (themeTags.length > 0) {
                    const merged = Array.from(new Set([...currentTags, ...themeTags.slice(0, 2)]));
                    setStudentSelectedTags(prev => ({
                      ...prev,
                      [teamId]: merged
                    }));
                  }
                };

                return (
                  <div className='wizard-step-body step-2'>
                    {/* Selected Team Header Pill */}
                    <div className='wizard-selected-team-banner'>
                      <div className='w-team-left'>
                        <span className='code-pill'>{team.temp_team_id}</span>
                        <div>
                          <strong>{team.team_name}</strong>
                          <span className='sub'>Lead: {team.leader_name} ({team.reg_no}) • {team.ps_id}</span>
                        </div>
                      </div>
                      <button 
                        className='btn-change-team-link'
                        onClick={() => setBookingStep(1)}
                      >
                        Change Team
                      </button>
                    </div>

                    <div className='step-heading-row'>
                      <span className='step-badge-num'>Step 2</span>
                      <div>
                        <h3>Select Theme &amp; Domain Tech Hashtags</h3>
                        <p>Customize your SIH domain and technology tags to match with the ideal specialist jury panel.</p>
                      </div>
                    </div>

                    <div className='student-config-workbench'>
                      {/* 1. Theme Selector */}
                      <div className='student-config-section'>
                        <div className='config-sec-label'>
                          <Layers size={14} className='text-primary' />
                          <span>Select SIH Competition Theme (1 of 17 Themes):</span>
                        </div>
                        <select 
                          className='student-theme-select-dropdown'
                          value={currentTheme}
                          onChange={(e) => handleThemeChange(e.target.value)}
                        >
                          {ALL_17_SIH_THEMES.map((themeName, tIdx) => {
                            const hostingPanel = evaluationPanels.find(p => (p.themes || []).includes(themeName));
                            return (
                              <option key={tIdx} value={themeName}>
                                {themeName} {hostingPanel ? `— [${hostingPanel.code}: ${hostingPanel.name.split('—')[1] || hostingPanel.name}]` : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* 2. Tech Stack Hashtags & Custom Input */}
                      <div className='student-config-section'>
                        <div className='config-sec-label'>
                          <Hash size={14} className='text-indigo' />
                          <span>Tech Stack &amp; Innovation Hashtags:</span>
                          <span className='config-hint'>(Click pills to toggle or type custom tags)</span>
                        </div>

                        {/* Active Chosen Tags */}
                        <div className='student-active-tags-strip'>
                          {currentTags.map((tag, idx) => (
                            <span key={idx} className='active-tag-chip'>
                              <span>{tag}</span>
                              <button 
                                type='button' 
                                className='btn-tag-remove'
                                onClick={() => handleRemoveTag(tag)}
                                title={`Remove ${tag}`}
                              >
                                <X size={11} />
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Quick Popular Hashtag Pills */}
                        <div className='student-quick-tags-wrap'>
                          {POPULAR_TECH_TAGS.map((tag) => {
                            const isSelected = currentTags.includes(tag);
                            return (
                              <button
                                key={tag}
                                type='button'
                                className={`quick-tag-pill ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleToggleTag(tag)}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>

                        {/* Custom Hashtag Input */}
                        <div className='custom-tag-input-row'>
                          <div className='custom-tag-input-box'>
                            <Tag size={13} className='text-muted' />
                            <input 
                              type='text'
                              placeholder='Add custom tech tag (e.g. Flutter, PyTorch, ROS)...'
                              value={currentCustomInput}
                              onChange={(e) => setStudentCustomTagInputs(prev => ({ ...prev, [teamId]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCustomTag();
                                }
                              }}
                            />
                          </div>
                          <button 
                            type='button' 
                            className='btn-add-custom-tag'
                            onClick={handleAddCustomTag}
                          >
                            <Plus size={13} />
                            <span>Add Tag</span>
                          </button>
                        </div>
                      </div>

                      {/* 3. Real-Time Dynamic AI Panel Match Banner */}
                      <div className='panel-criteria-recommendation-box-live'>
                        <div className='rec-match-header'>
                          <div className='rec-left'>
                            <span className='recommend-tag'>🎯 AI Panel Match</span>
                            <strong>{bestMatch.panel.code} — {bestMatch.panel.name}</strong>
                          </div>
                          <span className='match-pct-pill'>{bestMatch.matchScore}% Match</span>
                        </div>
                        <div className='rec-match-sub'>
                          <span>📍 {bestMatch.panel.room}</span>
                          <span>👨‍⚖️ Juries: {bestMatch.panel.juries?.map(j => j.name).join(', ')}</span>
                        </div>
                        {bestMatch.matchedTags && bestMatch.matchedTags.length > 0 && (
                          <div className='rec-matched-tags-row'>
                            <span className='rec-tags-lbl'>Matched Criteria:</span>
                            <div className='rec-tags-list'>
                              {bestMatch.matchedTags.map((t, idx) => (
                                <span key={idx} className='rec-tag-pill'>{t}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 2 Navigation Footer */}
                    <div className='wizard-nav-footer'>
                      <button 
                        className='btn-wizard-back'
                        onClick={() => setBookingStep(1)}
                      >
                        <ArrowLeft size={15} />
                        <span>Back to Choose Team</span>
                      </button>
                      <button 
                        className='btn-wizard-next'
                        onClick={() => setBookingStep(3)}
                      >
                        <span>Continue to Confirmation</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : bookingStep === 3 && selectedTeamForBooking ? (
              /* STEP 3: REVIEW & CONFIRM SLOT BOOKING */
              (() => {
                const team = selectedTeamForBooking;
                const teamId = team.temp_team_id;
                const currentTheme = studentSelectedThemes[teamId] || getInitialThemeForTeam(team);
                const currentTags = studentSelectedTags[teamId] || getInitialTagsForTeam(team);

                const rankedMatches = getMatchingPanelsForTeam(team, evaluationPanels, currentTheme, currentTags);
                const bestMatch = rankedMatches[0] || { panel: evaluationPanels[0], matchScore: 90, matchedTags: [] };
                const assignedPanel = selectedOverridePanelId 
                  ? (evaluationPanels.find(p => p.id === selectedOverridePanelId) || bestMatch.panel)
                  : bestMatch.panel;

                return (
                  <div className='wizard-step-body step-3'>
                    <div className='step-heading-row'>
                      <span className='step-badge-num'>Step 3</span>
                      <div>
                        <h3>Review &amp; Confirm Slot Booking</h3>
                        <p>Please review your team information and panel assignment before generating your official token.</p>
                      </div>
                    </div>

                    <div className='confirmation-review-card'>
                      <div className='review-section-block'>
                        <span className='review-sec-title'>TEAM INFORMATION</span>
                        <div className='review-grid-2col'>
                          <div className='review-field'>
                            <span className='lbl'>Team ID:</span>
                            <span className='val font-mono'>{team.temp_team_id}</span>
                          </div>
                          <div className='review-field'>
                            <span className='lbl'>Team Name:</span>
                            <strong className='val'>{team.team_name}</strong>
                          </div>
                          <div className='review-field'>
                            <span className='lbl'>Leader Name:</span>
                            <span className='val'>{team.leader_name} ({team.reg_no})</span>
                          </div>
                          <div className='review-field'>
                            <span className='lbl'>Problem Statement:</span>
                            <span className='val font-mono'>{team.ps_id}</span>
                          </div>
                          {team.ps_title && (
                            <div className='review-field full-width'>
                              <span className='lbl'>PS Title:</span>
                              <span className='val'>{team.ps_title}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className='review-section-block'>
                        <span className='review-sec-title'>THEME &amp; TECH STACK</span>
                        <div className='review-grid-2col'>
                          <div className='review-field full-width'>
                            <span className='lbl'>Selected SIH Theme:</span>
                            <strong className='val text-indigo'>{currentTheme}</strong>
                          </div>
                          <div className='review-field full-width'>
                            <span className='lbl'>Tech Hashtags:</span>
                            <div className='token-hashtags-list'>
                              {currentTags.map((t, idx) => (
                                <span key={idx} className='token-h-tag'>{t}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className='review-section-block highlight-panel-block'>
                        <span className='review-sec-title'>ASSIGNED EVALUATION STATION</span>
                        <div className='assigned-panel-hero-box'>
                          <div className='assigned-panel-main'>
                            <span className='panel-code-hero'>{assignedPanel.code}</span>
                            <div>
                              <h4>{assignedPanel.name}</h4>
                              <p className='assigned-room-venue'>📍 {assignedPanel.room}</p>
                              <p className='assigned-juries-sub'>
                                👨‍⚖️ Evaluators: {assignedPanel.juries?.map(j => j.name).join(' • ')}
                              </p>
                            </div>
                          </div>
                          <span className='assigned-match-badge'>
                            {bestMatch.matchScore}% Domain Fit
                          </span>
                        </div>

                        {/* Optional Panel Override Switcher */}
                        <div className='review-alt-panel-row'>
                          <span className='alt-label'>Need a different panel?</span>
                          <select 
                            className='alt-panel-select-dropdown'
                            value={selectedOverridePanelId || assignedPanel.id}
                            onChange={(e) => setSelectedOverridePanelId(e.target.value)}
                          >
                            {evaluationPanels.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.code}: {p.name} ({p.room})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 Action Buttons */}
                    <div className='wizard-nav-footer'>
                      <button 
                        className='btn-wizard-back'
                        onClick={() => setBookingStep(2)}
                      >
                        <ArrowLeft size={15} />
                        <span>Edit Theme &amp; Tags</span>
                      </button>
                      <button 
                        className='btn-wizard-confirm-final'
                        onClick={() => handleBookSlotForTeam(team, assignedPanel.id, bestMatch.matchedTags, currentTheme)}
                      >
                        <Sparkles size={16} />
                        <span>Confirm Slot Booking &amp; Generate Token</span>
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : null}
          </div>
          )}
        </div>
      )}

      {/* VIEW: MASTER ADMIN ANALYTICS & MANAGING DASHBOARD */}
      {activeView === 'analytics' && (
        <div className='eval-master-analytics-container'>
          {/* Header Banner */}
          <div className='analytics-header-banner'>
            <div className='analytics-header-left'>
              <div className='analytics-pill-badge'>
                <BarChart3 size={15} className='text-indigo' />
                <span>EXECUTIVE OPERATIONS COMMAND</span>
              </div>
              <h2>Hackathon Evaluation Analytics &amp; Master Throughput</h2>
              <p>Real-time telemetry across Panels 1–5, multi-jury throughput, delay tracking, and score distributions.</p>
            </div>
            <div className='analytics-header-right'>
              <div className='analytics-live-pulse-badge'>
                <span className='pulse-dot-green'></span>
                <span>Telemetry Live (Sync: 1s)</span>
              </div>
            </div>
          </div>

          {/* 4 Top KPI Cards */}
          <div className='analytics-kpis-grid'>
            <div className='analytics-kpi-card'>
              <div className='kpi-icon-badge blue'>
                <CheckCircle2 size={22} />
              </div>
              <div className='kpi-info'>
                <span className='kpi-label'>Teams Evaluated</span>
                <div className='kpi-value-row'>
                  <span className='kpi-num'>{analyticsData.evaluatedTeamsCount}</span>
                  <span className='kpi-sub-total'>/ {analyticsData.totalTeamsCount} Teams</span>
                </div>
                <div className='kpi-progress-bar-wrap'>
                  <div className='kpi-progress-fill blue' style={{ width: `${analyticsData.completionPct}%` }}></div>
                </div>
                <span className='kpi-footer-note'>{analyticsData.completionPct}% Campus Completion</span>
              </div>
            </div>

            <div className='analytics-kpi-card'>
              <div className='kpi-icon-badge amber'>
                <Activity size={22} />
              </div>
              <div className='kpi-info'>
                <span className='kpi-label'>Live Workload</span>
                <div className='kpi-value-row'>
                  <span className='kpi-num'>{analyticsData.activeSessionsCount}</span>
                  <span className='kpi-sub-total'>Active Slots</span>
                </div>
                <span className='kpi-highlight-tag amber'>
                  {analyticsData.inQueueCount} Teams Waiting in Queue
                </span>
                <span className='kpi-footer-note'>{analyticsData.delayedTeams.length} Teams on Hold / Delayed</span>
              </div>
            </div>

            <div className='analytics-kpi-card'>
              <div className='kpi-icon-badge emerald'>
                <TrendingUp size={22} />
              </div>
              <div className='kpi-info'>
                <span className='kpi-label'>Campus Average Score</span>
                <div className='kpi-value-row'>
                  <span className='kpi-num'>{analyticsData.overallAvgScore}</span>
                  <span className='kpi-sub-total'>/ 50.0</span>
                </div>
                <div className='kpi-progress-bar-wrap'>
                  <div className='kpi-progress-fill emerald' style={{ width: `${analyticsData.overallAvgPct}%` }}></div>
                </div>
                <span className='kpi-footer-note'>{analyticsData.overallAvgPct}% Overall Performance Benchmark</span>
              </div>
            </div>

            <div className='analytics-kpi-card'>
              <div className='kpi-icon-badge purple'>
                <ShieldCheck size={22} />
              </div>
              <div className='kpi-info'>
                <span className='kpi-label'>Multi-Jury Scorecards</span>
                <div className='kpi-value-row'>
                  <span className='kpi-num'>{analyticsData.totalIndividualEvals}</span>
                  <span className='kpi-sub-total'>Recorded Entries</span>
                </div>
                <span className='kpi-highlight-tag purple'>
                  100% Section 65B Certified
                </span>
                <span className='kpi-footer-note'>Independent Evaluator Marks</span>
              </div>
            </div>
          </div>

          {/* Panel Throughput & Status Cards Grid (Panels 1–5) */}
          <div className='analytics-panel-section'>
            <div className='analytics-sec-header'>
              <div className='sec-title-group'>
                <Layers size={18} className='text-indigo' />
                <h3>Station-Wise Throughput &amp; Live Velocity</h3>
              </div>
              <span className='sec-hint'>Individual real-time monitoring of Panels 1 to 5</span>
            </div>

            <div className='analytics-panel-cards-grid'>
              {analyticsData.panelStats.map(stat => {
                const isSessionActive = !!stat.activeSession;
                return (
                  <div key={stat.panel.id} className={`analytics-panel-card ${isSessionActive ? 'is-active-now' : 'is-standing-by'}`}>
                    <div className='panel-card-top'>
                      <div className='panel-code-title'>
                        <span className='p-badge'>{stat.panel.code}</span>
                        <div className='p-details'>
                          <h4>{stat.panel.name.split('—')[1] || stat.panel.name}</h4>
                          <span className='p-room'>📍 {stat.panel.room}</span>
                        </div>
                      </div>
                      <span className={`status-pill ${isSessionActive ? 'active' : 'idle'}`}>
                        {isSessionActive ? '● Presenting' : '○ Standby'}
                      </span>
                    </div>

                    <div className='panel-stats-metrics-row'>
                      <div className='p-metric'>
                        <span className='m-num'>{stat.uniqueTeams}</span>
                        <span className='m-lbl'>Teams Done</span>
                      </div>
                      <div className='p-metric'>
                        <span className='m-num'>{stat.qCount}</span>
                        <span className='m-lbl'>In Queue</span>
                      </div>
                      <div className='p-metric'>
                        <span className='m-num font-mono'>{stat.avgScore}</span>
                        <span className='m-lbl'>Avg / 50</span>
                      </div>
                    </div>

                    {isSessionActive ? (
                      <div className='panel-current-eval-pill'>
                        <span className='curr-lbl'>Current:</span>
                        <strong className='curr-team'>{stat.activeSession.teamName}</strong>
                        <span className='curr-token'>({stat.activeSession.teamId})</span>
                      </div>
                    ) : (
                      <div className='panel-idle-eval-pill'>
                        <span>Awaiting Next Presentation</span>
                      </div>
                    )}

                    <div className='panel-juries-roster-list'>
                      <span className='j-roster-lbl'>Evaluator Roster:</span>
                      <div className='j-roster-chips'>
                        {(stat.panel.juries || []).map((j, jIdx) => (
                          <span key={jIdx} className='j-roster-chip'>
                            {j.name.split(' ')[0]} ({j.role})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Two-Column Analytics: Score Distribution & Jury Performance */}
          <div className='analytics-charts-grid'>
            {/* Score Distribution Breakdown */}
            <div className='analytics-chart-card'>
              <div className='chart-card-header'>
                <div className='card-title-group'>
                  <PieChart size={18} className='text-primary' />
                  <h3>Score Tier Distribution</h3>
                </div>
                <span className='card-subtitle'>Distribution of all {analyticsData.totalIndividualEvals} recorded evaluations</span>
              </div>

              <div className='tier-distribution-list'>
                <div className='tier-item'>
                  <div className='tier-info-row'>
                    <span className='tier-label outstanding'>🌟 Outstanding (45 – 50)</span>
                    <strong className='tier-count'>{analyticsData.tiers.outstanding} evals ({analyticsData.totalIndividualEvals > 0 ? Math.round((analyticsData.tiers.outstanding / analyticsData.totalIndividualEvals) * 100) : 0}%)</strong>
                  </div>
                  <div className='tier-bar-track'>
                    <div className='tier-bar-fill outstanding' style={{ width: `${analyticsData.totalIndividualEvals > 0 ? (analyticsData.tiers.outstanding / analyticsData.totalIndividualEvals) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div className='tier-item'>
                  <div className='tier-info-row'>
                    <span className='tier-label excellent'>🟢 Excellent (40 – 44)</span>
                    <strong className='tier-count'>{analyticsData.tiers.excellent} evals ({analyticsData.totalIndividualEvals > 0 ? Math.round((analyticsData.tiers.excellent / analyticsData.totalIndividualEvals) * 100) : 0}%)</strong>
                  </div>
                  <div className='tier-bar-track'>
                    <div className='tier-bar-fill excellent' style={{ width: `${analyticsData.totalIndividualEvals > 0 ? (analyticsData.tiers.excellent / analyticsData.totalIndividualEvals) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div className='tier-item'>
                  <div className='tier-info-row'>
                    <span className='tier-label good'>🔵 Good (35 – 39)</span>
                    <strong className='tier-count'>{analyticsData.tiers.good} evals ({analyticsData.totalIndividualEvals > 0 ? Math.round((analyticsData.tiers.good / analyticsData.totalIndividualEvals) * 100) : 0}%)</strong>
                  </div>
                  <div className='tier-bar-track'>
                    <div className='tier-bar-fill good' style={{ width: `${analyticsData.totalIndividualEvals > 0 ? (analyticsData.tiers.good / analyticsData.totalIndividualEvals) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div className='tier-item'>
                  <div className='tier-info-row'>
                    <span className='tier-label satisfactory'>🟡 Satisfactory (28 – 34)</span>
                    <strong className='tier-count'>{analyticsData.tiers.satisfactory} evals ({analyticsData.totalIndividualEvals > 0 ? Math.round((analyticsData.tiers.satisfactory / analyticsData.totalIndividualEvals) * 100) : 0}%)</strong>
                  </div>
                  <div className='tier-bar-track'>
                    <div className='tier-bar-fill satisfactory' style={{ width: `${analyticsData.totalIndividualEvals > 0 ? (analyticsData.tiers.satisfactory / analyticsData.totalIndividualEvals) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div className='tier-item'>
                  <div className='tier-info-row'>
                    <span className='tier-label needs-improvement'>🔴 Bench / Needs Work (&lt; 28)</span>
                    <strong className='tier-count'>{analyticsData.tiers.needsImprovement} evals ({analyticsData.totalIndividualEvals > 0 ? Math.round((analyticsData.tiers.needsImprovement / analyticsData.totalIndividualEvals) * 100) : 0}%)</strong>
                  </div>
                  <div className='tier-bar-track'>
                    <div className='tier-bar-fill needs-improvement' style={{ width: `${analyticsData.totalIndividualEvals > 0 ? (analyticsData.tiers.needsImprovement / analyticsData.totalIndividualEvals) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Evaluator Activity Tracker */}
            <div className='analytics-chart-card'>
              <div className='chart-card-header'>
                <div className='card-title-group'>
                  <UserCheck size={18} className='text-indigo' />
                  <h3>Evaluator Activity Tracker</h3>
                </div>
                <span className='card-subtitle'>Evaluator individual submissions and scoring index</span>
              </div>

              <div className='jury-activity-table-wrap'>
                <table className='analytics-mini-table'>
                  <thead>
                    <tr>
                      <th>Evaluator</th>
                      <th>Panel</th>
                      <th>Evals Logged</th>
                      <th>Avg Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.juryActivityList.map((j, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{j.name}</strong>
                          <div className='text-muted small'>{j.role}</div>
                        </td>
                        <td>
                          <span className='panel-chip-small'>{j.panelCode}</span>
                        </td>
                        <td>
                          <span className='eval-count-badge'>{j.count}</span>
                        </td>
                        <td>
                          <strong className='font-mono'>{j.avgScore}</strong> <span className='text-muted small'>/ 50</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Delayed / On-Hold Teams Monitor */}
          {analyticsData.delayedTeams.length > 0 && (
            <div className='analytics-delayed-section'>
              <div className='delayed-section-header'>
                <div className='sec-title-group'>
                  <AlertTriangle size={18} className='text-amber' />
                  <h3>Delayed &amp; On-Hold Teams ({analyticsData.delayedTeams.length})</h3>
                </div>
                <span className='sec-hint'>Teams skipped by jury or moved to waiting pool</span>
              </div>

              <div className='delayed-teams-grid'>
                {analyticsData.delayedTeams.map(team => (
                  <div key={team.teamId} className='delayed-team-card'>
                    <div className='delayed-card-top'>
                      <span className='delayed-token'>{team.tokenNumber}</span>
                      <span className='delayed-count-badge'>{team.delayedCount || 1}x Delayed</span>
                    </div>
                    <h4 className='delayed-team-name'>{team.teamName}</h4>
                    <p className='delayed-meta'>{team.leaderName} ({team.teamId}) • {team.psId}</p>
                    <div className='delayed-card-actions'>
                      <button 
                        className='btn-delayed-action call'
                        onClick={() => {
                          const panel = evaluationPanels.find(p => p.id === team.panelId);
                          if (panel) announceTeamCall(team, panel);
                        }}
                      >
                        <Megaphone size={12} />
                        <span>Re-Announce</span>
                      </button>
                      <button 
                        className='btn-delayed-action start'
                        onClick={() => {
                          const panel = evaluationPanels.find(p => p.id === team.panelId);
                          if (panel) handleStartPanelEvaluation(panel, team);
                        }}
                      >
                        <Play size={12} />
                        <span>Start Slot</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: PENDING ALL TEAMS DIRECTORY */}
      {activeView === 'pending' && (
        <div className='eval-pending-container'>
          {/* Header Banner */}
          <div className='pending-header-banner'>
            <div className='pending-header-info'>
              <div className='pending-badge-top'>
                <Clock size={15} className='text-amber' />
                <span>UNATTENDED / PENDING DIRECTORY</span>
              </div>
              <h2 className='pending-main-title'>Master Evaluation — Pending Teams Directory</h2>
              <p className='pending-sub-desc'>
                Comprehensive real-time status of all {pendingStats.total} teams yet to complete jury evaluation. Inspect registration form submissions, verified member rosters, immediate contact channels, and dispatch slots directly to panels.
              </p>
            </div>

            <div className='pending-header-actions'>
              <button 
                type='button'
                className='btn-pending-auto-assign'
                onClick={handleBatchAutoAssignUnbooked}
                title='Auto-balance and allocate queue tokens to all unscheduled teams based on domain and jury matching'
              >
                <Sparkles size={15} />
                <span>Auto-Dispatch Unbooked ({pendingStats.notBooked})</span>
              </button>

              <button 
                type='button'
                className='btn-pending-export-csv'
                onClick={handleExportPendingTeamsCSV}
                title='Download CSV of all pending teams with contact info and registration status'
              >
                <Download size={15} />
                <span>Export Pending CSV</span>
              </button>
            </div>
          </div>

          {/* KPI Counters Bar */}
          <div className='pending-kpis-grid'>
            <div 
              className={`pending-kpi-card total ${pendingFormFilter === 'ALL' && pendingQueueFilter === 'ALL' ? 'active-filter' : ''}`}
              onClick={() => {
                setPendingFormFilter('ALL');
                setPendingQueueFilter('ALL');
              }}
            >
              <div className='pending-kpi-icon-wrap blue'>
                <Users size={20} />
              </div>
              <div className='pending-kpi-content'>
                <span className='pending-kpi-value'>{pendingStats.total}</span>
                <span className='pending-kpi-label'>Total Pending Teams</span>
              </div>
            </div>

            <div 
              className={`pending-kpi-card filled ${pendingFormFilter === 'FILLED' ? 'active-filter' : ''}`}
              onClick={() => {
                setPendingFormFilter(prev => prev === 'FILLED' ? 'ALL' : 'FILLED');
              }}
            >
              <div className='pending-kpi-icon-wrap emerald'>
                <CheckCircle2 size={20} />
              </div>
              <div className='pending-kpi-content'>
                <span className='pending-kpi-value'>{pendingStats.formFilled}</span>
                <span className='pending-kpi-label'>Form Submitted (Ready)</span>
              </div>
            </div>

            <div 
              className={`pending-kpi-card unfilled ${pendingFormFilter === 'UNFILLED' ? 'active-filter' : ''}`}
              onClick={() => {
                setPendingFormFilter(prev => prev === 'UNFILLED' ? 'ALL' : 'UNFILLED');
              }}
            >
              <div className='pending-kpi-icon-wrap amber'>
                <AlertTriangle size={20} />
              </div>
              <div className='pending-kpi-content'>
                <span className='pending-kpi-value'>{pendingStats.formUnfilled}</span>
                <span className='pending-kpi-label'>Form NOT Filled (Awaiting)</span>
              </div>
            </div>

            <div 
              className={`pending-kpi-card in-queue ${pendingQueueFilter === 'IN_QUEUE' ? 'active-filter' : ''}`}
              onClick={() => {
                setPendingQueueFilter(prev => prev === 'IN_QUEUE' ? 'ALL' : 'IN_QUEUE');
              }}
            >
              <div className='pending-kpi-icon-wrap indigo'>
                <Clock size={20} />
              </div>
              <div className='pending-kpi-content'>
                <span className='pending-kpi-value'>{pendingStats.inQueue}</span>
                <span className='pending-kpi-label'>In Queue / Active Slot</span>
              </div>
            </div>

            <div 
              className={`pending-kpi-card unbooked ${pendingQueueFilter === 'NOT_BOOKED' ? 'active-filter' : ''}`}
              onClick={() => {
                setPendingQueueFilter(prev => prev === 'NOT_BOOKED' ? 'ALL' : 'NOT_BOOKED');
              }}
            >
              <div className='pending-kpi-icon-wrap gray'>
                <UserX size={20} />
              </div>
              <div className='pending-kpi-content'>
                <span className='pending-kpi-value'>{pendingStats.notBooked}</span>
                <span className='pending-kpi-label'>Not Booked (No Token)</span>
              </div>
            </div>
          </div>

          {/* Filters and Search Bar */}
          <div className='pending-filters-panel'>
            <div className='pending-search-input-wrap'>
              <Search size={16} className='pending-search-icon' />
              <input 
                type='text' 
                placeholder='Search pending teams by ID, name, leader, phone, PS ID, school...'
                value={pendingSearchTerm}
                onChange={(e) => setPendingSearchTerm(e.target.value)}
                className='pending-search-input'
              />
              {pendingSearchTerm && (
                <button 
                  type='button'
                  className='btn-clear-pending-search' 
                  onClick={() => setPendingSearchTerm('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className='pending-dropdowns-group'>
              <div className='pending-select-wrap'>
                <label className='pending-filter-lbl'>Form Status:</label>
                <select 
                  value={pendingFormFilter}
                  onChange={(e) => setPendingFormFilter(e.target.value)}
                  className='pending-select-control'
                >
                  <option value='ALL'>All Form Statuses ({pendingStats.total})</option>
                  <option value='FILLED'>✓ Form Submitted ({pendingStats.formFilled})</option>
                  <option value='UNFILLED'>✕ Form NOT Filled ({pendingStats.formUnfilled})</option>
                </select>
              </div>

              <div className='pending-select-wrap'>
                <label className='pending-filter-lbl'>Queue Status:</label>
                <select 
                  value={pendingQueueFilter}
                  onChange={(e) => setPendingQueueFilter(e.target.value)}
                  className='pending-select-control'
                >
                  <option value='ALL'>All Queue Statuses</option>
                  <option value='NOT_BOOKED'>○ Not Booked ({pendingStats.notBooked})</option>
                  <option value='IN_QUEUE'>⏳ In Panel Queue ({pendingStats.inQueue})</option>
                  <option value='IN_PROGRESS'>⚡ Live Pitch In Progress</option>
                  <option value='DELAYED'>⚠️ Delayed ({pendingStats.delayed})</option>
                </select>
              </div>

              <div className='pending-select-wrap'>
                <label className='pending-filter-lbl'>Tier:</label>
                <select 
                  value={pendingTierFilter}
                  onChange={(e) => setPendingTierFilter(e.target.value)}
                  className='pending-select-control'
                >
                  <option value='ALL'>All Tiers</option>
                  <option value='shortlist'>Shortlist</option>
                  <option value='bench'>Bench</option>
                  <option value='waitlist'>Waitlist</option>
                </select>
              </div>

              <div className='pending-select-wrap'>
                <label className='pending-filter-lbl'>School/Dept:</label>
                <select 
                  value={pendingSchoolFilter}
                  onChange={(e) => setPendingSchoolFilter(e.target.value)}
                  className='pending-select-control'
                >
                  <option value='ALL'>All Schools / Depts</option>
                  {pendingSchoolOptions.map(sch => (
                    <option key={sch} value={sch}>{sch}</option>
                  ))}
                </select>
              </div>

              {(pendingSearchTerm || pendingFormFilter !== 'ALL' || pendingQueueFilter !== 'ALL' || pendingTierFilter !== 'ALL' || pendingSchoolFilter !== 'ALL') && (
                <button 
                  type='button'
                  className='btn-clear-all-pending-filters'
                  onClick={() => {
                    setPendingSearchTerm('');
                    setPendingFormFilter('ALL');
                    setPendingQueueFilter('ALL');
                    setPendingTierFilter('ALL');
                    setPendingSchoolFilter('ALL');
                  }}
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Master Table */}
          <div className='pending-table-container'>
            <table className='pending-master-table'>
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Team ID</th>
                  <th>Team &amp; Problem Statement</th>
                  <th style={{ width: '170px' }}>Registration Form</th>
                  <th>Team Leader &amp; Contact</th>
                  <th style={{ width: '190px' }}>Queue / Evaluation Status</th>
                  <th style={{ width: '210px', textAlign: 'center' }}>Actions &amp; Dispatch</th>
                </tr>
              </thead>
              <tbody>
                {filteredPendingTeams.map(team => {
                  const isRegistered = team.isFormFilled;
                  const queue = team.queueItem;
                  const tierLower = (team.tier || '').toLowerCase();

                  return (
                    <tr key={team.teamId} className={`pending-row ${isRegistered ? 'is-filled' : 'is-unfilled'}`}>
                      {/* Team ID & Tier */}
                      <td className='pending-col-id'>
                        <span className='pending-id-badge'>{team.teamId}</span>
                        <span className={`pending-tier-badge ${tierLower}`}>
                          {team.tier}
                        </span>
                      </td>

                      {/* Team & PS */}
                      <td className='pending-col-team'>
                        <div className='pending-team-name-row'>
                          <strong className='pending-team-title'>{team.teamName}</strong>
                        </div>
                        <div className='pending-ps-row'>
                          <span className='pending-ps-id-tag'>{team.psId}</span>
                          <span className='pending-ps-title-sub' title={team.psTitle}>
                            {team.psTitle}
                          </span>
                        </div>
                        <div className='pending-school-sub'>
                          <Building2 size={12} className='text-muted' />
                          <span>{team.school}</span>
                        </div>
                      </td>

                      {/* Registration Form Status */}
                      <td className='pending-col-form'>
                        {isRegistered ? (
                          <div className='form-status-box filled'>
                            <div className='form-status-badge filled'>
                              <CheckCircle2 size={13} />
                              <span>Form Submitted</span>
                            </div>
                            {onOpenRegistrationForm && (
                              <button
                                type='button'
                                className='btn-edit-form-micro'
                                onClick={() => onOpenRegistrationForm(team.rawTeam || team)}
                                title='Edit or update candidate registration form'
                              >
                                <Edit3 size={11} />
                                <span>Edit Form</span>
                              </button>
                            )}
                            <span className='form-status-detail'>
                              {team.members?.length || 6} Members Verified
                            </span>
                            {team.submittedAt && (
                              <span className='form-status-time'>
                                {new Date(team.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className='form-status-box unfilled'>
                            <div className='form-status-badge unfilled'>
                              <AlertTriangle size={13} />
                              <span>Form NOT Filled</span>
                            </div>
                            {onOpenRegistrationForm && (
                              <button
                                type='button'
                                className='btn-fill-form-micro'
                                onClick={() => onOpenRegistrationForm(team.rawTeam || team)}
                                title='Fill candidate registration form now'
                              >
                                <FileText size={11} />
                                <span>Fill Form</span>
                              </button>
                            )}
                            <span className='form-status-detail warn'>
                              Awaiting submission
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Leader & Contact Info */}
                      <td className='pending-col-leader'>
                        <div className='pending-leader-name'>
                          {team.leaderName}
                        </div>
                        {team.leaderRegNo && team.leaderRegNo !== '—' && (
                          <div className='pending-leader-reg'>
                            Reg: <code>{team.leaderRegNo}</code>
                          </div>
                        )}
                        <div className='pending-contact-actions'>
                          {team.leaderPhone && team.leaderPhone !== '—' ? (
                            <>
                              <a 
                                href={`tel:${team.leaderPhone.replace(/[^\d+]/g, '')}`} 
                                className='btn-contact-pill phone'
                                title={`Call Leader (${team.leaderPhone})`}
                              >
                                <Phone size={11} />
                                <span>{team.leaderPhone}</span>
                              </a>
                              <a 
                                href={`https://wa.me/91${team.leaderPhone.replace(/[^\d]/g, '').slice(-10)}?text=Hello%20${encodeURIComponent(team.leaderName)}%20(Team%20${encodeURIComponent(team.teamName)}%20-%20${team.teamId}),%20please%20report%20to%20the%20SIH%20Evaluation%20desk.`}
                                target='_blank'
                                rel='noreferrer'
                                className='btn-contact-pill whatsapp'
                                title='Message on WhatsApp'
                              >
                                <MessageSquare size={11} />
                                <span>WhatsApp</span>
                              </a>
                            </>
                          ) : (
                            <span className='text-muted' style={{ fontSize: '0.78rem' }}>No phone recorded</span>
                          )}
                        </div>
                      </td>

                      {/* Queue & Evaluation Status */}
                      <td className='pending-col-queue'>
                        {team.queueStatus === 'IN_PROGRESS' ? (
                          <div className='pending-queue-badge in-progress animate-pulse'>
                            <Activity size={13} />
                            <span>Pitching on {team.activePanelSession?.session?.panelName || 'Panel'}</span>
                          </div>
                        ) : team.queueStatus === 'IN_QUEUE' ? (
                          <div className='pending-queue-badge in-queue'>
                            <Clock size={13} />
                            <div className='queue-badge-text'>
                              <strong>{queue?.tokenNumber}</strong>
                              <span>{queue?.panelCode || 'PX'} • {queue?.room}</span>
                            </div>
                          </div>
                        ) : team.queueStatus === 'DELAYED' ? (
                          <div className='pending-queue-badge delayed'>
                            <AlertTriangle size={13} />
                            <div className='queue-badge-text'>
                              <strong>{queue?.tokenNumber}</strong>
                              <span>Delayed ({queue?.delayedCount || 1}x)</span>
                            </div>
                          </div>
                        ) : (
                          <div className='pending-queue-badge not-booked'>
                            <span>○ Not Booked</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className='pending-col-actions'>
                        <div className='pending-actions-row'>
                          <button 
                            type='button'
                            className='btn-pending-action-details'
                            onClick={() => setPendingModalTeam(team)}
                            title='View complete team member breakdown, registration form data, and mentor info'
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>

                          {team.queueStatus === 'NOT_BOOKED' ? (
                            <div className='pending-quick-assign-wrap'>
                              <select 
                                className='pending-panel-quick-select'
                                defaultValue=''
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleQuickAssignPendingTeam(team, e.target.value);
                                    e.target.value = '';
                                  }
                                }}
                              >
                                <option value='' disabled>+ Assign Panel</option>
                                {evaluationPanels.map(p => (
                                  <option key={p.id} value={p.id}>{p.code} - {p.name.split('—')[0]}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className='pending-quick-assign-wrap'>
                              <select 
                                className='pending-panel-quick-select reassigned'
                                defaultValue=''
                                onChange={(e) => {
                                  if (e.target.value) {
                                    if (window.confirm(`Move team ${team.teamName} (${team.teamId}) to ${evaluationPanels.find(p => p.id === e.target.value)?.name}?`)) {
                                      handleQuickAssignPendingTeam(team, e.target.value);
                                    }
                                    e.target.value = '';
                                  }
                                }}
                              >
                                <option value='' disabled>Move Panel...</option>
                                {evaluationPanels.map(p => (
                                  <option key={p.id} value={p.id}>{p.code} - {p.name.split('—')[0]}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredPendingTeams.length === 0 && (
                  <tr>
                    <td colSpan='6' className='empty-pending-table-cell'>
                      <div className='empty-pending-state'>
                        <UserCheck size={36} className='text-emerald' />
                        <h4>No Pending Teams Found</h4>
                        <p>
                          {allPendingTeams.length === 0 
                            ? 'All teams across all tiers have successfully attended and completed their evaluation!'
                            : 'No pending teams match the active search and filter criteria.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: EVALUATION LEDGER */}
      {activeView === 'ledger' && (
        <div className='eval-ledger-container'>
          <div className='ledger-table-card'>
            <div className='ledger-card-header'>
              <div className='ledger-title-group'>
                <h3>Section 65B Cryptographic Evaluation Ledger</h3>
                <span className='ledger-count-pill'>{(evaluationLedger || []).length} Recorded Evaluations</span>
              </div>

              {/* View Mode Toggle: Individual Records vs Consolidated Team Averages */}
              <div className='ledger-mode-toggle-group'>
                <button
                  type='button'
                  className={`btn-ledger-mode ${ledgerViewMode === 'individual' ? 'active' : ''}`}
                  onClick={() => setLedgerViewMode('individual')}
                >
                  All Evaluator Logs ({(evaluationLedger || []).length})
                </button>
                <button
                  type='button'
                  className={`btn-ledger-mode ${ledgerViewMode === 'consolidated' ? 'active' : ''}`}
                  onClick={() => setLedgerViewMode('consolidated')}
                >
                  Consolidated Team Averages ({consolidatedLedger.length})
                </button>
              </div>

              <div className='ledger-actions-group'>
                <select 
                  value={ledgerPanelFilter}
                  onChange={e => setLedgerPanelFilter(e.target.value)}
                  className='ledger-select-filter'
                >
                  <option value='ALL'>All Panels</option>
                  {evaluationPanels.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <input 
                  type='text' 
                  placeholder='Filter by team, jury or leader...'
                  value={ledgerSearch}
                  onChange={e => setLedgerSearch(e.target.value)}
                  className='ledger-search-input'
                />

                <button className='btn-export-ledger-csv' onClick={handleExportLedgerCSV}>
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>

                {isAdminLoggedIn && (evaluationLedger || []).length > 0 && (
                  <button 
                    className='btn-reset-ledger-danger' 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to completely RESET and CLEAR the entire Evaluation Ledger? All recorded scores will be purged.')) {
                        if (onUpdateLedger) onUpdateLedger([]);
                      }
                    }}
                    style={{
                      background: '#fee2e2',
                      color: '#b91c1c',
                      border: '1px solid #fca5a5',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title='Purge all evaluation scores and reset ledger'
                  >
                    <Trash2 size={14} />
                    <span>Reset Ledger</span>
                  </button>
                )}
              </div>
            </div>

            {ledgerViewMode === 'individual' ? (
              /* TAB 1: INDIVIDUAL EVALUATOR ENTRIES */
              <table className='eval-master-table'>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Panel &amp; Room</th>
                    <th>Evaluator Jury</th>
                    <th>Team &amp; Problem Statement</th>
                    <th>Scores Breakdown</th>
                    <th>Total / 50</th>
                    <th>Verdict</th>
                    <th>Evaluator Remarks</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLedger.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td className='col-time font-mono'>{row.evaluatedAtStr}</td>
                      <td>
                        <strong>{row.panelName}</strong>
                        <div className='text-muted small'>{row.room}</div>
                      </td>
                      <td>
                        <strong>{row.evaluatorName || row.juries?.[0]?.name || 'Evaluator Jury'}</strong>
                        <div className='text-muted small'>{row.evaluatorRole || 'Jury Member'}</div>
                      </td>
                      <td>
                        <strong>{row.teamName}</strong>
                        <div className='text-muted small'>{row.teamId} • {row.leaderName} ({row.psId})</div>
                      </td>
                      <td>
                        <div className='scores-mini-pills'>
                          <span>Innov: {row.scores?.innovation}/10</span>
                          <span>Tech: {row.scores?.feasibility}/10</span>
                          <span>Demo: {row.scores?.prototype}/10</span>
                          <span>Pitch: {row.scores?.presentation}/10</span>
                          <span>Q&amp;A: {row.scores?.defense}/10</span>
                        </div>
                      </td>
                      <td>
                        <span className='total-score-badge'>{row.totalScore} / 50</span>
                      </td>
                      <td>
                        <span className={`verdict-pill ${row.percentage >= 80 ? 'top' : row.percentage >= 60 ? 'pass' : 'bench'}`}>
                          {row.percentage}% Score
                        </span>
                      </td>
                      <td className='col-remarks'>{row.feedback}</td>
                      <td className='col-ledger-action'>
                        <button
                          className='btn-delete-ledger-entry'
                          onClick={() => handleDeleteScoreEntry(row.id || idx, row.teamName, row.evaluatorName || row.juries?.[0]?.name)}
                          title={`Delete score entry for ${row.teamName}`}
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredLedger.length === 0 && (
                    <tr>
                      <td colSpan='9' className='empty-ledger-cell'>
                        No evaluations recorded yet. Juries can start evaluations in the Jury Workspace.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              /* TAB 2: CONSOLIDATED MULTI-JURY TEAM AVERAGES */
              <table className='eval-master-table'>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Team &amp; Problem Statement</th>
                    <th>Panel &amp; Room</th>
                    <th>Evaluations &amp; Jury Breakdown</th>
                    <th>Consolidated Average</th>
                    <th>Overall Standing</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidatedLedger.map((team, idx) => (
                    <tr key={team.teamId}>
                      <td className='col-rank'>
                        <span className='rank-pill'>#{idx + 1}</span>
                      </td>
                      <td>
                        <strong>{team.teamName}</strong>
                        <div className='text-muted small'>{team.teamId} • {team.leaderName} ({team.psId})</div>
                      </td>
                      <td>
                        <strong>{team.panelName}</strong>
                        <div className='text-muted small'>{team.room}</div>
                      </td>
                      <td>
                        <div className='multi-jury-eval-pills-list'>
                          {team.evaluations.map((ev, eIdx) => (
                            <span key={eIdx} className='jury-individual-score-chip'>
                              <strong>{ev.evaluatorName || `Jury ${eIdx + 1}`}:</strong> {ev.totalScore}/50 ({ev.percentage}%)
                              <button
                                type='button'
                                className='btn-chip-delete-score'
                                onClick={() => handleDeleteScoreEntry(ev.id, team.teamName, ev.evaluatorName)}
                                title={`Delete score submitted by ${ev.evaluatorName || 'this jury'}`}
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className='consolidated-score-box'>
                          <span className='avg-total-badge'>{team.avgScoreStr} / 50</span>
                          <span className='text-muted small'>({team.evalCount} Evaluation{team.evalCount > 1 ? 's' : ''})</span>
                        </div>
                      </td>
                      <td>
                        <span className={`verdict-pill ${team.avgPercentage >= 80 ? 'top' : team.avgPercentage >= 60 ? 'pass' : 'bench'}`}>
                          {team.avgPercentage}% Average
                        </span>
                      </td>
                      <td className='col-ledger-action'>
                        <button
                          className='btn-delete-ledger-entry team-all'
                          onClick={() => handleDeleteAllTeamScores(team.teamId, team.teamName)}
                          title={`Delete all scores for team ${team.teamName}`}
                        >
                          <Trash2 size={13} />
                          <span>Delete All</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {consolidatedLedger.length === 0 && (
                    <tr>
                      <td colSpan='7' className='empty-ledger-cell'>
                        No evaluations recorded yet. Juries can start evaluations in the Jury Workspace.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Full Team Detailed Inspection Modal */}
      {pendingModalTeam && (
        <div className='modal-backdrop' onClick={() => setPendingModalTeam(null)}>
          <div className='modal-container pending-team-full-modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <div className='modal-title-group'>
                <span className={`pending-modal-tier-pill ${(pendingModalTeam.tier || '').toLowerCase()}`}>
                  {pendingModalTeam.tier}
                </span>
                <span className='pending-modal-id-pill'>{pendingModalTeam.teamId}</span>
                <h3 className='pending-modal-title'>{pendingModalTeam.teamName}</h3>
              </div>
              <button 
                type='button' 
                className='btn-modal-close' 
                onClick={() => setPendingModalTeam(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className='pending-modal-body'>
              {/* Form & Queue Status Strip */}
              <div className='pending-modal-status-strip'>
                <div className={`modal-status-item form ${pendingModalTeam.isFormFilled ? 'filled' : 'unfilled'}`}>
                  <div className='status-icon-bubble'>
                    {pendingModalTeam.isFormFilled ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  </div>
                  <div className='status-info-col'>
                    <span className='status-caption'>Registration Form Status</span>
                    <strong className='status-val'>
                      {pendingModalTeam.isFormFilled ? 'Form Submitted & Verified' : 'Form NOT Filled (Pending Submission)'}
                    </strong>
                    {pendingModalTeam.submittedAt && (
                      <span className='status-sub'>Submitted: {new Date(pendingModalTeam.submittedAt).toLocaleString()}</span>
                    )}
                    {onOpenRegistrationForm && (
                      <button
                        type='button'
                        className='btn-modal-form-edit-action'
                        onClick={() => {
                          onOpenRegistrationForm(pendingModalTeam.rawTeam || pendingModalTeam);
                          setPendingModalTeam(null);
                        }}
                      >
                        <Edit3 size={13} />
                        <span>{pendingModalTeam.isFormFilled ? 'Edit & Update Registration Form' : 'Fill Registration Form Now'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className={`modal-status-item queue ${pendingModalTeam.queueStatus.toLowerCase()}`}>
                  <div className='status-icon-bubble'>
                    <Clock size={18} />
                  </div>
                  <div className='status-info-col'>
                    <span className='status-caption'>Evaluation Queue Status</span>
                    <strong className='status-val'>
                      {pendingModalTeam.queueStatus === 'NOT_BOOKED' && 'Not Booked (Awaiting Slot)'}
                      {pendingModalTeam.queueStatus === 'IN_QUEUE' && `In Queue: Token ${pendingModalTeam.queueItem?.tokenNumber} (${pendingModalTeam.queueItem?.panelCode})`}
                      {pendingModalTeam.queueStatus === 'IN_PROGRESS' && 'Pitch Session Currently Active!'}
                      {pendingModalTeam.queueStatus === 'DELAYED' && `Delayed (${pendingModalTeam.queueItem?.delayedCount || 1}x)`}
                    </strong>
                    {pendingModalTeam.queueItem && (
                      <span className='status-sub'>
                        Room: {pendingModalTeam.queueItem.room} • Booked: {pendingModalTeam.queueItem.bookedTimeStr}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 2-Column Info Grid */}
              <div className='pending-modal-info-grid'>
                {/* Section 1: Problem Statement & Domain */}
                <div className='pending-info-card'>
                  <h4 className='pending-card-heading'>
                    <FileText size={15} />
                    <span>Problem Statement &amp; Domain</span>
                  </h4>
                  <div className='info-row'>
                    <span className='info-lbl'>PS ID:</span>
                    <span className='info-val ps-id-badge'>{pendingModalTeam.psId}</span>
                  </div>
                  <div className='info-row'>
                    <span className='info-lbl'>PS Title:</span>
                    <span className='info-val bold'>{pendingModalTeam.psTitle}</span>
                  </div>
                  <div className='info-row'>
                    <span className='info-lbl'>Category / Domain:</span>
                    <span className='info-val'>{pendingModalTeam.domain}</span>
                  </div>
                  <div className='info-row'>
                    <span className='info-lbl'>Institute / School:</span>
                    <span className='info-val'>{pendingModalTeam.school}</span>
                  </div>
                  {pendingModalTeam.registrationData?.idea_title && (
                    <div className='info-row'>
                      <span className='info-lbl'>Project Title:</span>
                      <span className='info-val font-semibold'>{pendingModalTeam.registrationData.idea_title}</span>
                    </div>
                  )}
                  {pendingModalTeam.registrationData?.synopsis && (
                    <div className='info-row full-span'>
                      <span className='info-lbl'>Idea Synopsis:</span>
                      <div className='info-synopsis-box'>{pendingModalTeam.registrationData.synopsis}</div>
                    </div>
                  )}
                </div>

                {/* Section 2: Team Leader Contact & Instant Quick Actions */}
                <div className='pending-info-card'>
                  <h4 className='pending-card-heading'>
                    <UserCheck size={15} />
                    <span>Team Leader &amp; Immediate Contact</span>
                  </h4>
                  <div className='info-row'>
                    <span className='info-lbl'>Leader Name:</span>
                    <span className='info-val bold'>{pendingModalTeam.leaderName}</span>
                  </div>
                  <div className='info-row'>
                    <span className='info-lbl'>Registration No:</span>
                    <span className='info-val mono'>{pendingModalTeam.leaderRegNo}</span>
                  </div>
                  <div className='info-row'>
                    <span className='info-lbl'>Mobile Number:</span>
                    <span className='info-val bold text-indigo'>{pendingModalTeam.leaderPhone}</span>
                  </div>
                  <div className='info-row'>
                    <span className='info-lbl'>Email Address:</span>
                    <span className='info-val'>{pendingModalTeam.leaderEmail}</span>
                  </div>

                  <div className='pending-modal-quick-call-actions'>
                    {pendingModalTeam.leaderPhone && pendingModalTeam.leaderPhone !== '—' && (
                      <>
                        <a 
                          href={`tel:${pendingModalTeam.leaderPhone.replace(/[^\d+]/g, '')}`}
                          className='btn-modal-call-action phone'
                        >
                          <Phone size={14} />
                          <span>Direct Voice Call ({pendingModalTeam.leaderPhone})</span>
                        </a>
                        <a 
                          href={`https://wa.me/91${pendingModalTeam.leaderPhone.replace(/[^\d]/g, '').slice(-10)}?text=Hello%20${encodeURIComponent(pendingModalTeam.leaderName)}%20(Team%20${encodeURIComponent(pendingModalTeam.teamName)}%20-%20${pendingModalTeam.teamId}),%20this%20is%20from%20the%20SIH%20Evaluation%20Desk.`}
                          target='_blank'
                          rel='noreferrer'
                          className='btn-modal-call-action whatsapp'
                        >
                          <MessageSquare size={14} />
                          <span>WhatsApp Immediate Message</span>
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Registered Team Members (All 6 Members) */}
              <div className='pending-members-section'>
                <h4 className='pending-card-heading'>
                  <Users size={15} />
                  <span>Team Members Roster ({pendingModalTeam.members?.length || (pendingModalTeam.isFormFilled ? 6 : 0)} Members)</span>
                </h4>

                {pendingModalTeam.members && pendingModalTeam.members.length > 0 ? (
                  <div className='pending-members-grid'>
                    {pendingModalTeam.members.map((mem, idx) => (
                      <div key={idx} className={`pending-member-card ${idx === 0 ? 'is-lead' : ''}`}>
                        <div className='member-card-header'>
                          <span className='member-index-tag'>#{idx + 1} {idx === 0 ? '• Team Leader' : '• Member'}</span>
                          {mem.gender && <span className='member-gender-tag'>{mem.gender}</span>}
                        </div>
                        <h5 className='member-name'>{mem.name || mem.member_name || `Member ${idx + 1}`}</h5>
                        <div className='member-meta-line'>
                          <span>Reg: <code>{mem.reg_no || mem.regNo || '—'}</code></span>
                          {(mem.dept || mem.department || mem.year) && (
                            <span>Dept: {mem.dept || mem.department} {mem.year ? `(${mem.year})` : ''}</span>
                          )}
                        </div>
                        {mem.mobile && (
                          <div className='member-phone-line'>
                            <Phone size={11} className='text-muted' />
                            <a href={`tel:${mem.mobile}`}>{mem.mobile}</a>
                          </div>
                        )}
                        {mem.email && (
                          <div className='member-email-line'>
                            <Mail size={11} className='text-muted' />
                            <span>{mem.email}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='pending-unfilled-members-notice'>
                    <AlertCircle size={20} className='text-amber' />
                    <div>
                      <strong>No individual member roster registered yet.</strong>
                      <p>
                        Candidate registration form has not been filled for this team. Only team leader record ({pendingModalTeam.leaderName}) is currently available from master shortlist.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 4: Faculty & Industry Mentors */}
              <div className='pending-mentors-section'>
                <h4 className='pending-card-heading'>
                  <Award size={15} />
                  <span>Mentors &amp; Institutional Guides</span>
                </h4>
                <div className='pending-mentors-grid'>
                  <div className='pending-mentor-card'>
                    <span className='mentor-role-badge'>Faculty Mentor</span>
                    <h5 className='mentor-name'>{pendingModalTeam.facultyMentor || 'Not Assigned / Unfilled'}</h5>
                    {pendingModalTeam.facultyMentorPhone && pendingModalTeam.facultyMentorPhone !== '—' && (
                      <div className='mentor-contact-item'>
                        <Phone size={12} className='text-muted' />
                        <a href={`tel:${pendingModalTeam.facultyMentorPhone}`}>{pendingModalTeam.facultyMentorPhone}</a>
                      </div>
                    )}
                    {pendingModalTeam.registrationData?.faculty_mentor_email && (
                      <div className='mentor-contact-item'>
                        <Mail size={12} className='text-muted' />
                        <span>{pendingModalTeam.registrationData.faculty_mentor_email}</span>
                      </div>
                    )}
                  </div>

                  <div className='pending-mentor-card'>
                    <span className='mentor-role-badge'>Industry / External Mentor</span>
                    <h5 className='mentor-name'>
                      {pendingModalTeam.registrationData?.industry_mentor_name || 'Not Assigned'}
                    </h5>
                    {pendingModalTeam.registrationData?.industry_mentor_phone && (
                      <div className='mentor-contact-item'>
                        <Phone size={12} className='text-muted' />
                        <a href={`tel:${pendingModalTeam.registrationData.industry_mentor_phone}`}>
                          {pendingModalTeam.registrationData.industry_mentor_phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 5: Instant Dispatch to Panel */}
              <div className='pending-modal-dispatch-bar'>
                <div className='dispatch-left'>
                  <Sparkles size={16} className='text-indigo' />
                  <span><strong>Instant Dispatch to Evaluation Panel:</strong></span>
                </div>
                <div className='dispatch-right'>
                  <select 
                    className='dispatch-panel-dropdown'
                    defaultValue={pendingModalTeam.queueItem?.panelId || ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleQuickAssignPendingTeam(pendingModalTeam, e.target.value);
                        setPendingModalTeam(null);
                      }
                    }}
                  >
                    <option value='' disabled>Choose Panel to Allocate Slot...</option>
                    {evaluationPanels.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name} ({p.room})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className='modal-footer'>
              <button 
                type='button' 
                className='btn-modal-cancel' 
                onClick={() => setPendingModalTeam(null)}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      <PanelManagerModal 
        isOpen={isPanelModalOpen}
        onClose={() => setIsPanelModalOpen(false)}
        panels={evaluationPanels}
        onSavePanels={(newPanels) => {
          if (onUpdatePanels) onUpdatePanels(newPanels);
        }}
      />

      {/* Quick Admin Passcode Modal for Instant Arena Unlock */}
      {showAdminPinModal && (
        <div className='modal-backdrop' onClick={() => setShowAdminPinModal(false)}>
          <div className='modal-container admin-pin-mini-modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <div className='modal-title-group'>
                <ShieldCheck size={20} className='text-indigo' />
                <h3>Admin Authorization</h3>
              </div>
              <button className='btn-modal-close' onClick={() => setShowAdminPinModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleVerifyAdminPinAndReveal} className='admin-pin-form'>
              <p className='pin-modal-desc'>
                Enter Administrator Passcode to reveal the live arena multi-panel display before 09:45 AM:
              </p>
              <div className='pin-input-wrap'>
                <input
                  type='password'
                  className='pin-input-field'
                  placeholder='Enter admin passcode (e.g. admin)'
                  value={adminPinInput}
                  onChange={(e) => {
                    setAdminPinInput(e.target.value);
                    setAdminPinError('');
                  }}
                  autoFocus
                  autoComplete='current-password'
                />
              </div>
              {adminPinError && (
                <div className='pin-error-msg'>{adminPinError}</div>
              )}
              <div className='pin-modal-actions'>
                <button 
                  type='button' 
                  className='btn-pin-cancel'
                  onClick={() => setShowAdminPinModal(false)}
                >
                  Cancel
                </button>
                <button type='submit' className='btn-pin-submit'>
                  <Play size={14} />
                  <span>Unlock &amp; Reveal Arena</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
