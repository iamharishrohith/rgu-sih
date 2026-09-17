import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Play, Pause, Plus, CheckCircle2, Clock, Users, Building2, 
  Search, ShieldCheck, Download, Sparkles, Monitor, 
  Smartphone, FileText, Layers, ArrowLeft, Volume2, VolumeX,
  LayoutDashboard, Check, Award, Trash2, Tag, Hash, X
} from 'lucide-react';
import { normalizeSchoolName } from '../data/sihMasterData';
import LivePixelDigitalClock from './LivePixelDigitalClock.jsx';
import PanelManagerModal from './PanelManagerModal.jsx';

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
  onUpdatePanels,
  onUpdateQueue,
  onUpdateLedger,
  onUpdateSessions,
  onOpenAdminGateway,
  onBackToMain
}) {
  const [activeView, setActiveView] = useState(() => {
    try {
      const pathname = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (pathname.includes('/student') || pathname.includes('/book') || search.includes('view=student') || hash.includes('book') || hash.includes('student')) return 'student';
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

  // Ensure unauthenticated users are kept out of ledger view
  useEffect(() => {
    if (!isAdminLoggedIn && activeView === 'ledger') {
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

  // Student Booking State
  const [studentSearchInput, setStudentSearchInput] = useState('');
  const [bookingSuccessToken, setBookingSuccessToken] = useState(null);
  const [studentSelectedThemes, setStudentSelectedThemes] = useState({});
  const [studentSelectedTags, setStudentSelectedTags] = useState({});
  const [studentCustomTagInputs, setStudentCustomTagInputs] = useState({});

  // Ledger Filter
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerPanelFilter, setLedgerPanelFilter] = useState('ALL');

  // Live Timer Tick
  const [currentTimeMs, setCurrentTimeMs] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimeMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const playSoundAlert = (type = 'chime') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'phase_switch') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } else {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {}
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

    playSoundAlert('phase_switch');
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
    } else {
      const remaining = Math.max(0, current.totalEndMs - now);
      updated = {
        ...current,
        isPaused: true,
        pausedRemainingMs: remaining
      };
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
    playSoundAlert('chime');
  };

  // Conclude Panel Evaluation & Save to Ledger
  const handleConcludeSession = (panelId) => {
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

    playSoundAlert('phase_switch');
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
        (item.school && item.school.toLowerCase().includes(q))
      );
    });
  }, [evaluationLedger, ledgerPanelFilter, ledgerSearch]);

  const handleExportLedgerCSV = () => {
    const headers = ['Evaluation ID', 'Panel', 'Room', 'Team ID', 'Team Name', 'Leader Name', 'Reg No', 'PS ID', 'Innovation (10)', 'Feasibility (10)', 'Prototype (10)', 'Pitch (10)', 'Q&A Defense (10)', 'Total / 50', 'Score %', 'Time', 'Feedback'];
    const rows = (evaluationLedger || []).map(l => [
      `"${l.id}"`,
      `"${l.panelName}"`,
      `"${l.room}"`,
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
    link.setAttribute('download', `SIH_Evaluation_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            {isAdminLoggedIn && (
              <button 
                className={`eval-tab-btn ${activeView === 'ledger' ? 'active ledger' : ''}`}
                onClick={() => handleSwitchTab('ledger')}
              >
                <FileText size={15} />
                <span>Evaluation Ledger ({(evaluationLedger || []).length})</span>
              </button>
            )}
          </div>
        </div>

        <div className='eval-nav-right'>
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

          <div className='projector-panels-grid'>
            {evaluationPanels.map((panel, idx) => {
              const currentSession = activeSessions[panel.id];
              const timing = getSessionTimingInfo(currentSession);
              const queuedTeams = panelQueues[panel.id] || [];

              return (
                <div key={panel.id} className={`projector-panel-card ${currentSession ? 'is-evaluating' : 'is-idle'}`}>
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
                    </div>
                  ) : (
                    <div className='panel-idle-eval-box'>
                      <div className='idle-icon-wrap'>
                        <Users size={32} />
                      </div>
                      <h4>Panel Ready &amp; Standing By</h4>
                      <p>Jury is awaiting next assigned team from the digital queue.</p>
                    </div>
                  )}

                  <div className='panel-queue-preview-section'>
                    <div className='queue-section-title'>
                      <span>UP NEXT (ON DECK):</span>
                      <span className='queue-count-pill'>{queuedTeams.length} Waiting</span>
                    </div>

                    {queuedTeams.length === 0 ? (
                      <div className='empty-queue-msg'>No teams waiting in this panel queue.</div>
                    ) : (
                      <div className='queued-teams-compact-list'>
                        {queuedTeams.slice(0, 3).map((item) => (
                          <div key={item.teamId} className='queued-team-item-row'>
                            <div className='q-item-left'>
                              <span className='q-token-badge'>{item.tokenNumber}</span>
                              <div>
                                <strong className='q-team-title'>{item.teamName}</strong>
                                <span className='q-lead-sub'>{item.leaderName} ({item.teamId})</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: STUDENT SLOT BOOKING */}
      {activeView === 'student' && (
        <div className='eval-student-container'>
          <div className='student-booking-card'>
            <div className='student-header-block'>
              <div className='student-badge'>
                <Sparkles size={14} className='text-emerald' />
                <span>EVALUATION SLOT DISPATCHER</span>
              </div>
              <h2>Book Evaluation Slot &amp; Get Token</h2>
              <p>Enter your Roll No, Register No, or Team ID. Our smart load balancer will instantly assign you to the best available panel.</p>
            </div>

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
                    setStudentSearchInput('');
                  }}
                >
                  Lookup Another Team
                </button>
              </div>
            ) : (
              <div className='student-search-slot-form'>
                <label className='slot-input-label'>Enter Team Identifier:</label>
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

                <div className='student-matched-teams-list'>
                  {allTeams
                    .filter(t => {
                      if (!studentSearchInput.trim()) return false;
                      const q = studentSearchInput.toLowerCase().trim();
                      return (
                        t.temp_team_id.toLowerCase().includes(q) ||
                        t.team_name.toLowerCase().includes(q) ||
                        t.leader_name.toLowerCase().includes(q) ||
                        t.reg_no.toLowerCase().includes(q)
                      );
                    })
                    .slice(0, 5)
                    .map(team => {
                      const teamId = team.temp_team_id;
                      const isQueued = evaluationQueue[teamId];
                      const isEvaluated = (evaluationLedger || []).find(l => l.teamId === teamId);

                      // Current student-chosen theme & tags for this team
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
                        <div key={teamId} className='student-team-option-card modern-match-card-expanded'>
                          <div className='team-opt-header-row'>
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

                            {isEvaluated ? (
                              <span className='status-evaluated-badge'>
                                <CheckCircle2 size={14} />
                                <span>Evaluation Completed</span>
                              </span>
                            ) : isQueued ? (
                              <button 
                                className='btn-view-existing-token'
                                onClick={() => setBookingSuccessToken(isQueued)}
                              >
                                View Token #{isQueued.tokenNumber}
                              </button>
                            ) : null}
                          </div>

                          {!isQueued && !isEvaluated && (
                            <div className='student-config-workbench'>
                              {/* 1. Interactive Theme Selector */}
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

                              {/* 2. Interactive Tech Stack Hashtags & Custom Input */}
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

                              {/* 4. Slot Booking CTAs */}
                              <div className='student-booking-footer-row'>
                                <button 
                                  className='btn-book-slot-primary'
                                  onClick={() => handleBookSlotForTeam(team, bestMatch.panel.id, bestMatch.matchedTags, currentTheme)}
                                >
                                  <Sparkles size={15} />
                                  <span>Confirm &amp; Book {bestMatch.panel.code} Slot</span>
                                </button>

                                {rankedMatches.length > 1 && (
                                  <select 
                                    className='alt-panel-select-dropdown'
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        const selected = rankedMatches.find(m => m.panel.id === e.target.value);
                                        handleBookSlotForTeam(team, e.target.value, selected?.matchedTags || [], currentTheme);
                                      }
                                    }}
                                    defaultValue=''
                                  >
                                    <option value='' disabled>Or switch to another panel...</option>
                                    {rankedMatches.slice(1).map(m => (
                                      <option key={m.panel.id} value={m.panel.id}>
                                        {m.panel.code}: {m.panel.name} ({m.matchScore}% match)
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
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
                <span className='ledger-count-pill'>{(evaluationLedger || []).length} Completed Evaluations</span>
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
                  placeholder='Filter by team or leader...'
                  value={ledgerSearch}
                  onChange={e => setLedgerSearch(e.target.value)}
                  className='ledger-search-input'
                />

                <button className='btn-export-ledger-csv' onClick={handleExportLedgerCSV}>
                  <Download size={14} />
                  <span>Export Scores CSV</span>
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

            <table className='eval-master-table'>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Panel & Room</th>
                  <th>Team & Problem Statement</th>
                  <th>Scores Breakdown</th>
                  <th>Total / 50</th>
                  <th>Verdict</th>
                  <th>Evaluator Remarks</th>
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
                      <strong>{row.teamName}</strong>
                      <div className='text-muted small'>{row.teamId} • {row.leaderName} ({row.psId})</div>
                    </td>
                    <td>
                      <div className='scores-mini-pills'>
                        <span>Innov: {row.scores?.innovation}/10</span>
                        <span>Tech: {row.scores?.feasibility}/10</span>
                        <span>Demo: {row.scores?.prototype}/10</span>
                        <span>Pitch: {row.scores?.presentation}/10</span>
                        <span>Q&A: {row.scores?.defense}/10</span>
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
                  </tr>
                ))}
                {filteredLedger.length === 0 && (
                  <tr>
                    <td colSpan='7' className='empty-ledger-cell'>
                      No evaluations recorded yet. Juries can start evaluations in the Jury Workspace tab.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
    </div>
  );
}
