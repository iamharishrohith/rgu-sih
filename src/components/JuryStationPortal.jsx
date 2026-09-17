import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Play, Pause, Plus, CheckCircle2, Clock, Users, Building2, 
  Search, ShieldCheck, Download, Sparkles, Monitor, Laptop, 
  Smartphone, FileText, Layers, ArrowLeft, Volume2, VolumeX,
  LayoutDashboard, Bot, Brain, MessageSquare, Lightbulb, CheckSquare, 
  Square, Copy, Award, HelpCircle, Check, Compass, ShieldAlert, Cpu, LogOut, Megaphone, FastForward, AlertTriangle, RotateCcw, X
} from 'lucide-react';
import { normalizeSchoolName } from '../data/sihMasterData';
import LivePixelDigitalClock from './LivePixelDigitalClock.jsx';
import PanelManagerModal from './PanelManagerModal.jsx';
import { DEFAULT_EVALUATION_PANELS } from './EvaluationQueuePortal.jsx';
import { playEvalSound } from '../utils/evalSoundEffects.js';

export const AI_EVALUATION_QUESTIONS_BY_THEME = [
  // 1. Field Research & Ground Reality
  {
    id: 'fr_1',
    category: 'Field Research',
    categoryLabel: 'Field Research & Ground Reality',
    tag: 'User Validation',
    question: 'Did your team conduct primary field research or ground interviews with actual end-users, domain officers, or beneficiaries?',
    rationale: 'Validates that the problem is authentic and not based solely on theoretical assumptions.'
  },
  {
    id: 'fr_2',
    category: 'Field Research',
    categoryLabel: 'Field Research & Ground Reality',
    tag: 'Persona & Pain Point',
    question: 'What specific demographic or geographic friction did you observe on the ground that is missing from existing portals?',
    rationale: 'Tests depth of empathy and user-centric problem understanding.'
  },
  {
    id: 'fr_3',
    category: 'Field Research',
    categoryLabel: 'Field Research & Ground Reality',
    tag: 'Ground Constraints',
    question: 'How does your solution adapt to rural or low-bandwidth field environments (e.g. 2G networks, intermittent power, offline workers)?',
    rationale: 'Evaluates resilience in real-world deployment conditions.'
  },
  {
    id: 'fr_4',
    category: 'Field Research',
    categoryLabel: 'Field Research & Ground Reality',
    tag: 'Feedback Loop',
    question: 'What was the most critical feedback received when testing the earliest prototype with a non-technical pilot user?',
    rationale: 'Reveals iterative design discipline and ability to pivot based on user evidence.'
  },

  // 2. Solution & Core Workflow
  {
    id: 'sol_1',
    category: 'Solution',
    categoryLabel: 'Solution & Value Proposition',
    tag: 'Problem-Solution Fit',
    question: 'Can you demonstrate the single primary workflow from problem trigger to final resolution in under 3 user clicks or 30 seconds?',
    rationale: 'Tests user friction, UI clarity, and workflow conciseness.'
  },
  {
    id: 'sol_2',
    category: 'Solution',
    categoryLabel: 'Solution & Value Proposition',
    tag: 'Quantifiable ROI',
    question: 'What is the quantifiable outcome of using this solution (e.g. % turnaround time saved, operational cost reduced, error drop)?',
    rationale: 'Verifies tangible value metrics rather than subjective claims.'
  },
  {
    id: 'sol_3',
    category: 'Solution',
    categoryLabel: 'Solution & Value Proposition',
    tag: 'Accessibility & Vernacular',
    question: 'How is multilingual support and vernacular speech/text handled for citizens across different Indian languages?',
    rationale: 'Aligns with national inclusive governance benchmarks (Bhashini/DIKSHA).'
  },

  // 3. Innovation & Novelty
  {
    id: 'inn_1',
    category: 'Innovation',
    categoryLabel: 'Innovation & Intellectual Merit',
    tag: 'Proprietary IP',
    question: 'What is the core proprietary innovation or algorithmic breakthrough in your design that cannot be replicated with a generic web app?',
    rationale: 'Differentiates original innovation from basic boilerplate wrappers.'
  },
  {
    id: 'inn_2',
    category: 'Innovation',
    categoryLabel: 'Innovation & Intellectual Merit',
    tag: 'AI/ML Integrity',
    question: 'Are you using a fine-tuned edge model, custom heuristics, or calling external public APIs? How do you prevent hallucination?',
    rationale: 'Assesses technical depth and integrity of AI integrations.'
  },
  {
    id: 'inn_3',
    category: 'Innovation',
    categoryLabel: 'Innovation & Intellectual Merit',
    tag: 'Patentability',
    question: 'Is any subsystem (data pipeline, hardware schematic, consensus logic) novel enough to qualify for patent or IP filing?',
    rationale: 'Evaluates commercial and academic research impact.'
  },

  // 4. Tech Stack & Architecture
  {
    id: 'tech_1',
    category: 'Tech Stack',
    categoryLabel: 'Tech Stack & Architecture',
    tag: 'Stack Justification',
    question: 'Why did you choose this specific tech stack and database over standard alternatives? What engineering trade-offs were made?',
    rationale: 'Tests architectural maturity and engineering reasoning.'
  },
  {
    id: 'tech_2',
    category: 'Tech Stack',
    categoryLabel: 'Tech Stack & Architecture',
    tag: 'State & Concurrency',
    question: 'How is state synchronization and database locking handled across concurrent mobile and web clients during high-throughput bursts?',
    rationale: 'Exposes database locking or race condition vulnerabilities.'
  },
  {
    id: 'tech_3',
    category: 'Tech Stack',
    categoryLabel: 'Tech Stack & Architecture',
    tag: 'Decoupled Design',
    question: 'Are your backend microservices decoupled, containerized, and capable of independent auto-scaling under sudden load spikes?',
    rationale: 'Evaluates DevOps and cloud readiness.'
  },

  // 5. Technical Feasibility & Working Demo
  {
    id: 'feas_1',
    category: 'Feasibility',
    categoryLabel: 'Feasibility & Working Demo',
    tag: 'Live Demo Proof',
    question: 'Can you execute a live end-to-end data transmission right now with arbitrary test inputs chosen by the jury?',
    rationale: 'Validates genuine functional build vs pre-recorded mock simulations.'
  },
  {
    id: 'feas_2',
    category: 'Feasibility',
    categoryLabel: 'Feasibility & Working Demo',
    tag: 'Edge Cases',
    question: 'What happens when a user enters malformed input, disconnects the internet mid-transaction, or submits duplicate payloads?',
    rationale: 'Tests exception handling, transaction rollback, and error recovery.'
  },
  {
    id: 'feas_3',
    category: 'Feasibility',
    categoryLabel: 'Feasibility & Working Demo',
    tag: 'Hardware / Edge',
    question: 'If hardware sensors or IoT nodes are involved, what is the power consumption, battery lifecycle, and firmware update mechanism?',
    rationale: 'Crucial for IoT, Embedded, and AgriTech solutions.'
  },

  // 6. Viability & Operational Model
  {
    id: 'viab_1',
    category: 'Viability',
    categoryLabel: 'Viability & Business Model',
    tag: 'Unit Economics',
    question: 'What is the estimated cloud compute and operational maintenance cost to run this solution per 1,000 active daily users?',
    rationale: 'Assesses financial feasibility and cloud billing sustainability.'
  },
  {
    id: 'viab_2',
    category: 'Viability',
    categoryLabel: 'Viability & Business Model',
    tag: 'Adoption Barriers',
    question: 'What institutional, bureaucratic, or behavioral barriers might prevent field personnel or government departments from adopting this?',
    rationale: 'Tests realistic stakeholder mapping and operational readiness.'
  },

  // 7. Scalability & Performance
  {
    id: 'scal_1',
    category: 'Scalability',
    categoryLabel: 'Scalability & Performance',
    tag: 'Scale Bottleneck',
    question: 'What is the primary architectural bottleneck when scaling from 100 teams to 100,000 concurrent citizen requests?',
    rationale: 'Reveals depth of database indexing, caching strategies, and CDN architecture.'
  },
  {
    id: 'scal_2',
    category: 'Scalability',
    categoryLabel: 'Scalability & Performance',
    tag: 'Latency & Caching',
    question: 'What is the 95th percentile (P95) latency for critical endpoints, and how are cold starts minimized in serverless setups?',
    rationale: 'Measures latency profiling and performance tuning.'
  },

  // 8. Reliability, Security & Compliance
  {
    id: 'rel_1',
    category: 'Reliability',
    categoryLabel: 'Reliability & Legal Compliance',
    tag: 'Section 65B Audit',
    question: 'How are immutable audit trails, SHA-256 cryptographic hashes, and Section 65B legal admissibility ensured for system logs?',
    rationale: 'Ensures compliance with Indian Evidence Act & BSA 2023.'
  },
  {
    id: 'rel_2',
    category: 'Reliability',
    categoryLabel: 'Reliability & Legal Compliance',
    tag: 'DPDP & PII',
    question: 'How does your database handle Personally Identifiable Information (PII) encryption at rest and in transit under Digital Personal Data Protection Act?',
    rationale: 'Verifies zero PII leakage and zero trust architecture.'
  },
  {
    id: 'rel_3',
    category: 'Reliability',
    categoryLabel: 'Reliability & Legal Compliance',
    tag: 'RBAC Security',
    question: 'What prevents an authenticated ordinary user from privilege-escalating to inspect other candidates’ private evaluation records?',
    rationale: 'Tests OWASP Top 10 defenses (IDOR, Broken Object Level Authorization).'
  },

  // 9. Competitor & Existing Solution Analysis
  {
    id: 'comp_1',
    category: 'Competitors',
    categoryLabel: 'Existing Solutions & Competitors',
    tag: 'Market Benchmark',
    question: 'What existing commercial or open-source solutions solve parts of this problem, and why is your system demonstrably superior?',
    rationale: 'Tests market awareness and competitor intelligence.'
  },
  {
    id: 'comp_2',
    category: 'Competitors',
    categoryLabel: 'Existing Solutions & Competitors',
    tag: 'Switching Cost',
    question: 'Why should a ministry or enterprise replace their legacy enterprise workflow with your proposed application?',
    rationale: 'Evaluates switching cost advantages and ROI proposition.'
  },

  // 10. Risk Analysis & Mitigation
  {
    id: 'risk_1',
    category: 'Risk Analysis',
    categoryLabel: 'Risk Assessment & Mitigation',
    tag: 'Single Point of Failure',
    question: 'What is the single biggest point of failure in your architecture, and what automated failover or disaster recovery exists?',
    rationale: 'Tests disaster recovery planning and fault tolerance.'
  },
  {
    id: 'risk_2',
    category: 'Risk Analysis',
    categoryLabel: 'Risk Assessment & Mitigation',
    tag: 'Malicious Abuse',
    question: 'How do you prevent malicious actors or bots from submitting spam telemetry, fake submissions, or poisoned training data?',
    rationale: 'Exposes input sanitization, rate limiting, and anomaly detection safeguards.'
  }
];

export default function JuryStationPortal({
  allTeams = [],
  registrationsMap = {},
  evaluationPanels = DEFAULT_EVALUATION_PANELS,
  evaluationQueue = {},
  evaluationLedger = [],
  activeSessions = {},
  onUpdateSessions,
  onUpdateQueue,
  onUpdateLedger
}) {
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Jury Workspace State
  const [authenticatedJury, setAuthenticatedJury] = useState(() => {
    try {
      const saved = sessionStorage.getItem('sih_jury_auth_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loginPanelId, setLoginPanelId] = useState(evaluationPanels[0]?.id || 'panel_1');
  const [loginJuryName, setLoginJuryName] = useState('');
  const [loginJuryPasscode, setLoginJuryPasscode] = useState('');
  const [loginAuthError, setLoginAuthError] = useState('');

  // AI Copilot Questions State
  const [selectedQuestionCategory, setSelectedQuestionCategory] = useState('ALL');
  const [questionSearchQuery, setQuestionSearchQuery] = useState('');
  const [askedQuestionIds, setAskedQuestionIds] = useState(new Set());
  const [juryLeftTab, setJuryLeftTab] = useState('copilot'); // 'copilot' | 'queue'

  const [selectedJuryPanelId, setSelectedJuryPanelId] = useState(() => {
    try {
      const saved = sessionStorage.getItem('sih_jury_auth_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.panelId) return parsed.panelId;
      }
    } catch (e) {}
    return evaluationPanels[0]?.id || 'panel_1';
  });

  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [manualSelectedTeam, setManualSelectedTeam] = useState(null);

  const [rubricScores, setRubricScores] = useState({
    innovation: 8,
    feasibility: 8,
    prototype: 8,
    presentation: 8,
    defense: 8
  });
  const [evalFeedback, setEvalFeedback] = useState('');

  const handleJuryLogin = (e) => {
    e.preventDefault();
    setLoginAuthError('');
    const entered = (loginJuryPasscode || '').trim();
    if (!entered) {
      setLoginAuthError('Please enter the Jury Access Passcode.');
      return;
    }
    if (entered.toUpperCase() !== 'SMART@26' && entered.toUpperCase() !== 'SMART26' && entered.toUpperCase() !== 'SIH2026') {
      setLoginAuthError('Invalid Jury Access Passcode. Please enter the authorized passcode.');
      return;
    }

    const panel = evaluationPanels.find(p => p.id === loginPanelId) || evaluationPanels[0];
    
    // Pick the chosen jury or default to first member of panel
    const juryMember = (panel.juries || []).find(j => j.name === loginJuryName) || panel.juries?.[0] || {
      name: loginJuryName || 'Evaluator Jury',
      role: 'Evaluator',
      designation: 'Faculty Evaluator'
    };

    const sessionData = {
      panelId: panel.id,
      panelName: panel.name,
      panelCode: panel.code,
      room: panel.room,
      juryName: juryMember.name,
      role: juryMember.role || 'Evaluator',
      designation: juryMember.designation || '',
      loginTimestamp: Date.now()
    };
    setAuthenticatedJury(sessionData);
    setSelectedJuryPanelId(panel.id);
    setLoginJuryPasscode('');
    try {
      sessionStorage.setItem('sih_jury_auth_session', JSON.stringify(sessionData));
    } catch (err) {}
    playSoundAlert('chime');
  };

  const handleJuryLogout = () => {
    setAuthenticatedJury(null);
    setLoginJuryPasscode('');
    setLoginAuthError('');
    try {
      sessionStorage.removeItem('sih_jury_auth_session');
    } catch (err) {}
  };

  const handleToggleQuestionAsked = (qId) => {
    setAskedQuestionIds(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const handleInsertQuestionToFeedback = (questionText, tag) => {
    const addition = `[Inquiry - ${tag}]: ${questionText}\n`;
    setEvalFeedback(prev => prev ? `${prev}\n${addition}` : addition);
  };

  // Student Booking State
  const [studentSearchInput, setStudentSearchInput] = useState('');
  const [bookingSuccessToken, setBookingSuccessToken] = useState(null);

  // Ledger Filter & View Mode
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerPanelFilter, setLedgerPanelFilter] = useState('ALL');
  const [ledgerViewMode, setLedgerViewMode] = useState('individual'); // 'individual' | 'consolidated'

  // AI Question Suggestion Copilot Pop-up Modal State
  const [isAiCopilotModalOpen, setIsAiCopilotModalOpen] = useState(false);

  // Non-blocking Toast Feedback State (replaces blocking alerts)
  const [toastFeedback, setToastFeedback] = useState(null);

  const triggerToast = (msg, type = 'success', duration = 3500) => {
    setToastFeedback({ msg, type, id: Date.now() });
  };

  useEffect(() => {
    if (!toastFeedback) return;
    const t = setTimeout(() => setToastFeedback(null), 3500);
    return () => clearTimeout(t);
  }, [toastFeedback]);

  // Active Evaluator within Current Panel (supports multi-jury scoring per panel)
  const [activeEvaluatorName, setActiveEvaluatorName] = useState(() => {
    return authenticatedJury?.juryName || '';
  });

  useEffect(() => {
    if (authenticatedJury?.juryName) {
      setActiveEvaluatorName(authenticatedJury.juryName);
    } else {
      const p = evaluationPanels.find(item => item.id === selectedJuryPanelId) || evaluationPanels[0];
      if (p && p.juries?.length > 0) {
        setActiveEvaluatorName(p.juries[0].name);
      }
    }
  }, [authenticatedJury, selectedJuryPanelId, evaluationPanels]);

  // Live Timer Tick
  const [currentTimeMs, setCurrentTimeMs] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimeMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activePanelObj = useMemo(() => {
    return evaluationPanels.find(p => p.id === selectedJuryPanelId) || evaluationPanels[0] || {};
  }, [evaluationPanels, selectedJuryPanelId]);

  const playSoundAlert = (type = 'chime') => {
    if (!soundEnabled) return;
    playEvalSound(type);
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

  // Handle Student Auto-Balanced Slot Booking
  const handleBookSlotForTeam = (team) => {
    const teamId = team.temp_team_id;

    if (evaluationQueue[teamId]) {
      setBookingSuccessToken(evaluationQueue[teamId]);
      return;
    }

    const alreadyEvaluated = (evaluationLedger || []).find(l => l.teamId === teamId);
    if (alreadyEvaluated) {
      triggerToast(`Team ${team.team_name} (${teamId}) has already completed evaluation with score ${alreadyEvaluated.totalScore}/50.`, 'warning');
      return;
    }

    let targetPanel = evaluationPanels[0];
    let minQueueCount = Infinity;

    evaluationPanels.forEach(p => {
      const qLen = (panelQueues[p.id] || []).length;
      if (qLen < minQueueCount) {
        minQueueCount = qLen;
        targetPanel = p;
      }
    });

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
      panelId: targetPanel.id,
      panelName: targetPanel.name,
      panelCode: targetPanel.code,
      room: targetPanel.room,
      tokenNumber,
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

  // Handle Jury Start Evaluation
  const handleStartJuryEvaluation = (targetTeamObj) => {
    if (!targetTeamObj) return;
    const teamId = targetTeamObj.temp_team_id || targetTeamObj.teamId;
    const enriched = getEnrichedTeam(teamId) || targetTeamObj;

    const presentMins = activePanelObj.presentMins || 20;
    const qaMins = activePanelObj.qaMins || 10;
    const totalMs = (presentMins + qaMins) * 60000;
    const now = Date.now();

    const newSession = {
      panelId: activePanelObj.id,
      panelName: activePanelObj.name,
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
      [activePanelObj.id]: newSession
    };

    if (onUpdateSessions) onUpdateSessions(nextSessions);

    if (evaluationQueue[teamId]) {
      const nextQ = {
        ...evaluationQueue,
        [teamId]: { ...evaluationQueue[teamId], status: 'PRESENTING' }
      };
      if (onUpdateQueue) onUpdateQueue(nextQ);
    }

    setManualSelectedTeam(null);
    setManualSearchQuery('');
    playSoundAlert('start');
  };

  // Timer Controls (Shared across Panel Juries)
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

  // Stop Active Session Timer (Manual Stop)
  const handleStopSessionOnly = (panelId) => {
    const nextSessions = { ...activeSessions };
    delete nextSessions[panelId];
    if (onUpdateSessions) onUpdateSessions(nextSessions);
    playSoundAlert('pause');
  };

  // Delay / Skip Active Team (Moves to End of Waiting Queue)
  const handleDelayActiveTeam = () => {
    const current = activeSessions[activePanelObj.id];
    if (!current) return;

    const teamId = current.teamId;
    const item = evaluationQueue[teamId];
    if (item) {
      const currentList = panelQueues[activePanelObj.id] || [];
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
      if (onUpdateQueue) onUpdateQueue(nextQueue);
    }

    // Clear active session
    const nextSessions = { ...activeSessions };
    delete nextSessions[activePanelObj.id];
    if (onUpdateSessions) onUpdateSessions(nextSessions);

    playSoundAlert('delete');

    // Announce next team if available
    const remaining = (panelQueues[activePanelObj.id] || []).filter(t => t.teamId !== teamId && t.status !== 'DELAYED');
    if (remaining.length > 0) {
      setTimeout(() => {
        playSoundAlert('call');
      }, 500);
    }

    triggerToast(`⏱ Team ${current.teamName} moved to waiting queue (Delayed). Panel ready for next team.`, 'info');
  };

  // Delay / Skip a waiting queue item
  const handleDelayQueueItem = (teamId) => {
    const item = evaluationQueue[teamId];
    if (!item) return;
    const currentList = panelQueues[activePanelObj.id] || [];
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
    if (onUpdateQueue) onUpdateQueue(nextQueue);
    playSoundAlert('delete');
    triggerToast(`Team moved to back of queue.`, 'info');
  };

  // Submit Rubric Evaluation (Separate Marks for Each Individual Jury)
  const handleSubmitEvaluationScore = (forceConclude = false) => {
    const current = activeSessions[activePanelObj.id];
    if (!current) {
      triggerToast('No active presentation session currently running in this panel.', 'warning');
      return;
    }

    const total = Object.values(rubricScores).reduce((acc, v) => acc + (parseInt(v) || 0), 0);
    const now = new Date();

    const selectedJuryObj = (activePanelObj.juries || []).find(j => j.name === activeEvaluatorName) || 
      activePanelObj.juries?.[0] || { name: activeEvaluatorName || 'Evaluator Jury', role: 'Evaluator' };

    const ledgerEntry = {
      id: `EVAL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      panelId: activePanelObj.id,
      panelName: activePanelObj.name,
      room: activePanelObj.room,
      juries: activePanelObj.juries || [],
      evaluatorName: selectedJuryObj.name,
      evaluatorRole: selectedJuryObj.role || selectedJuryObj.designation || 'Evaluator',
      teamId: current.teamId,
      teamName: current.teamName,
      leaderName: current.leaderName,
      regNo: current.regNo,
      psId: current.psId,
      school: current.school,
      scores: { ...rubricScores },
      totalScore: total,
      maxScore: 50,
      percentage: Math.round((total / 50) * 100),
      feedback: evalFeedback.trim() || 'Evaluation completed successfully.',
      evaluatedAtStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      evaluatedAtMs: now.getTime()
    };

    // 1. Save this Jury's Individual Section 65B evaluation to ledger
    const nextLedger = [ledgerEntry, ...(evaluationLedger || [])];
    if (onUpdateLedger) onUpdateLedger(nextLedger);

    const teamEvaluations = nextLedger.filter(l => l.teamId === current.teamId);
    const scoredJuryNames = new Set(teamEvaluations.map(l => l.evaluatorName));
    const allPanelJuriesSubmitted = (activePanelObj.juries || []).length > 0 && 
      (activePanelObj.juries || []).every(j => scoredJuryNames.has(j.name));

    // Reset current evaluator's form for next use
    setRubricScores({ innovation: 8, feasibility: 8, prototype: 8, presentation: 8, defense: 8 });
    setEvalFeedback('');

    // If all juries in this panel have now submitted their scores, OR if force conclude was triggered:
    if (forceConclude || allPanelJuriesSubmitted) {
      // Auto-complete and clear active session (stops timing)
      const nextSessions = { ...activeSessions };
      delete nextSessions[activePanelObj.id];
      if (onUpdateSessions) onUpdateSessions(nextSessions);

      // Remove evaluated team from queue
      const nextQueue = { ...evaluationQueue };
      delete nextQueue[current.teamId];
      if (onUpdateQueue) onUpdateQueue(nextQueue);

      playSoundAlert('team_conclude');

      // Next Team Audio Chime Call (Pure Sound, Zero TTS)
      const remainingQueued = (panelQueues[activePanelObj.id] || []).filter(item => item.teamId !== current.teamId && (item.status === 'WAITING' || item.status === 'CALLING'));
      if (remainingQueued.length > 0) {
        setTimeout(() => {
          playSoundAlert('call');
        }, 600);
      }

      triggerToast(`🎉 Pitch completed for ${current.teamName} (${total}/50)! Session concluded and advanced to next team.`, 'success');
    } else {
      // Score recorded for this jury, keep session active for the 2nd jury
      playSoundAlert('score_submit');
      const unsubmittedJury = (activePanelObj.juries || []).find(j => !scoredJuryNames.has(j.name));
      if (unsubmittedJury) {
        setActiveEvaluatorName(unsubmittedJury.name);
      }
      triggerToast(`✓ Score of ${total}/50 saved for ${selectedJuryObj.name}. Switched to ${unsubmittedJury?.name || 'Co-Evaluator'}.`, 'info');
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
        (item.school && item.school.toLowerCase().includes(q))
      );
    });
  }, [evaluationLedger, ledgerPanelFilter, ledgerSearch]);

  return (
    <div className="eval-queue-viewport jury-isolated-page">
      {/* ISOLATED JURY TOP NAVBAR — ZERO OTHER PAGE BUTTONS */}
      <header className='eval-top-navbar jury-standalone-nav'>
        <div className='eval-nav-left'>
          <div className='eval-portal-brand'>
            <div className='eval-pulse-indicator'>
              <span className='eval-live-ring'></span>
              <span className='eval-live-dot'></span>
            </div>
            <div>
              <span className='eval-brand-title'>
                SIH 2026 • JURY EVALUATION STATION
              </span>
              <span className='eval-brand-sub'>
                Dedicated Confidential Evaluator Terminal
              </span>
            </div>
          </div>
        </div>

        <div className='eval-nav-right'>
          <button 
            className='btn-sound-toggle'
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute Sounds' : 'Enable Sound Alerts'}
          >
            {soundEnabled ? <Volume2 size={16} className='text-emerald' /> : <VolumeX size={16} className='text-muted' />}
          </button>
        </div>
      </header>

      <div className='eval-jury-workspace-container'>
        {!authenticatedJury ? (
          /* DEDICATED JURY PANEL LOGIN GATEWAY */
          <div className='jury-login-portal-screen'>
            <div className='jury-login-card'>
                <div className='jury-login-header'>
                  <div className='jury-login-icon-badge'>
                    <Laptop size={28} className='text-primary' />
                  </div>
                  <h2>Jury Evaluation Station Portal</h2>
                  <p>Secure individual login for official hackathon evaluators and chief juries.</p>
                </div>

                <form onSubmit={handleJuryLogin} className='jury-login-form'>
                  {loginAuthError && (
                    <div className='jury-login-error-pill'>
                      <ShieldAlert size={15} />
                      <span>{loginAuthError}</span>
                    </div>
                  )}

                  <div className='input-group'>
                    <label>Select Assigned Evaluation Panel:</label>
                    <select 
                      value={loginPanelId}
                      onChange={e => {
                        setLoginPanelId(e.target.value);
                        const p = evaluationPanels.find(item => item.id === e.target.value);
                        if (p && p.juries?.length > 0) {
                          setLoginJuryName(p.juries[0].name);
                        }
                      }}
                      className='jury-login-select'
                    >
                      {evaluationPanels.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.code} — {p.name} ({p.room})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='input-group'>
                    <label>Select Evaluator / Jury Member:</label>
                    {(() => {
                      const currPanel = evaluationPanels.find(p => p.id === loginPanelId) || evaluationPanels[0];
                      const juryRoster = currPanel?.juries || [];
                      if (juryRoster.length > 0) {
                        return (
                          <select 
                            value={loginJuryName || juryRoster[0]?.name}
                            onChange={e => setLoginJuryName(e.target.value)}
                            className='jury-login-select'
                          >
                            {juryRoster.map((j, idx) => (
                              <option key={idx} value={j.name}>
                                {j.name} ({j.role || 'Evaluator'} • {j.designation || 'Faculty'})
                              </option>
                            ))}
                          </select>
                        );
                      }
                      return (
                        <input 
                          type='text' 
                          placeholder='Enter Evaluator Full Name'
                          value={loginJuryName}
                          onChange={e => setLoginJuryName(e.target.value)}
                          required
                        />
                      );
                    })()}
                  </div>

                  <div className='input-group'>
                    <label>Jury Access PIN / Passcode:</label>
                    <input 
                      type='password'
                      placeholder='Enter Jury Access Passcode'
                      value={loginJuryPasscode}
                      onChange={e => setLoginJuryPasscode(e.target.value)}
                      autoComplete='new-password'
                      required
                    />
                  </div>

                  {loginAuthError && (
                    <div className='jury-auth-error-msg'>
                      <AlertTriangle size={14} />
                      <span>{loginAuthError}</span>
                    </div>
                  )}

                  <button type='submit' className='btn-enter-jury-station'>
                    <Laptop size={18} />
                    <span>Authenticate &amp; Open Evaluation Station</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* AUTHENTICATED DEDICATED JURY WORKSPACE */
            <>
              {/* Authenticated Jury Station Header Bar */}
              <div className='jury-station-auth-banner'>
                <div className='station-info-left'>
                  <div className='station-badge'>
                    <span className='station-dot'></span>
                    <strong>{activePanelObj.code} EVALUATION STATION</strong>
                  </div>
                  <div className='station-meta-text'>
                    <span className='station-panel-title'>{activePanelObj.name}</span>
                    <span className='station-room'>• {activePanelObj.room}</span>
                  </div>
                </div>

                <div className='station-info-right'>
                  <div className='evaluator-profile-pill'>
                    <Award size={15} className='text-primary' />
                    <span>
                      Evaluator: <strong>{authenticatedJury.juryName}</strong> ({authenticatedJury.role})
                    </span>
                  </div>

                  <button 
                    className='btn-jury-logout-station'
                    onClick={handleJuryLogout}
                    title='Exit this Jury Panel Station'
                  >
                    <LogOut size={14} />
                    <span>Exit Station</span>
                  </button>
                </div>
              </div>

              {/* AUTHENTICATED BENTO GRID WORKSPACE */}
              <div className='jury-bento-workspace'>
                {/* Live Non-Blocking Action Toast */}
                {toastFeedback && (
                  <div className={`bento-toast-banner ${toastFeedback.type || 'info'}`}>
                    <div className='toast-left'>
                      <CheckCircle2 size={16} />
                      <span>{toastFeedback.msg}</span>
                    </div>
                    <button 
                      type='button' 
                      onClick={() => setToastFeedback(null)} 
                      className='btn-toast-close'
                      title='Dismiss'
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {/* BENTO ROW 1: PRESENTATION & TIMER HERO + EVALUATOR TERMINAL */}
                <div className='bento-row-top'>
                  {/* BENTO TILE 1: PRESENTATION & TIMER HERO (Wide) */}
                  <div className='bento-card bento-hero-timer-card'>
                    {activeSessions[activePanelObj.id] ? (
                      (() => {
                        const currSession = activeSessions[activePanelObj.id];
                        const timing = getSessionTimingInfo(currSession);

                        return (
                          <div className='bento-timer-content'>
                            <div className='bento-timer-top-bar'>
                              <div className='bento-team-token-badge'>
                                <span className='token-lbl'>ACTIVE PITCH</span>
                                <strong className='token-val'>{currSession.teamId}</strong>
                                <span className='token-ps'>{currSession.psId}</span>
                              </div>

                              <div className='bento-top-actions'>
                                <button
                                  type='button'
                                  className='btn-bento-ai-copilot-trigger'
                                  onClick={() => setIsAiCopilotModalOpen(true)}
                                  title='Open AI Inquiry Question Copilot'
                                >
                                  <Bot size={15} />
                                  <span>AI Questions (28+)</span>
                                  <Sparkles size={13} className='text-amber' />
                                </button>

                                <span className={`bento-phase-badge ${timing.phase.toLowerCase()}`}>
                                  {timing.phase === 'PRESENTATION' ? '● Phase 1: Presentation' : timing.phase === 'QA' ? '● Phase 2: Q&A Defense' : 'Concluded'}
                                </span>
                              </div>
                            </div>

                            <div className='bento-timer-center-row'>
                              <div className='bento-clock-dial'>
                                <span className='bento-digits'>{timing.timeDisplay}</span>
                                <span className='bento-phase-caption'>
                                  {timing.phase === 'PRESENTATION' ? 'Pitch Presentation Time' : 'Jury Q&A Defense Time'}
                                </span>
                              </div>

                              <div className='bento-timer-controls-col'>
                                <button 
                                  className={`btn-bento-timer-ctrl ${timing.isPaused ? 'resume' : 'pause'}`}
                                  onClick={() => handleToggleTimerPause(activePanelObj.id)}
                                >
                                  {timing.isPaused ? <Play size={15} /> : <Pause size={15} />}
                                  <span>{timing.isPaused ? 'Resume Timer' : 'Pause Timer'}</span>
                                </button>

                                <button 
                                  className='btn-bento-timer-ctrl extend'
                                  onClick={() => handleExtendSession(activePanelObj.id, 5)}
                                >
                                  <Plus size={15} />
                                  <span>+5m Grace Time</span>
                                </button>

                                <button 
                                  type='button'
                                  className='btn-bento-timer-ctrl delay'
                                  onClick={handleDelayActiveTeam}
                                  title='Skip & Move active team to back of waiting queue'
                                >
                                  <FastForward size={15} />
                                  <span>Skip / Move to Back</span>
                                </button>
                              </div>
                            </div>

                            <div className='bento-team-dossier-strip'>
                              <h2 className='dossier-main-title'>{currSession.teamName}</h2>
                              {currSession.psTitle && (
                                <p className='dossier-ps-desc'>{currSession.psTitle}</p>
                              )}
                              <div className='dossier-meta-chips'>
                                <span className='d-chip'>
                                  <strong>Leader:</strong> {currSession.leaderName} ({currSession.regNo})
                                </span>
                                <span className='d-chip'>
                                  <strong>College:</strong> {currSession.school}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className='bento-idle-content'>
                        <div className='idle-badge'>
                          <Laptop size={28} className='text-primary' />
                          <span>PANEL STANDBY</span>
                        </div>
                        <h3>Station Ready — Awaiting Next Presentation</h3>
                        <p>Select a team from the waiting queue on the right or search directly below to begin scoring.</p>

                        <div className='bento-search-box'>
                          <Search size={15} className='search-icon' />
                          <input 
                            type='text' 
                            placeholder='Search team name, leader, or team ID to start...'
                            value={manualSearchQuery}
                            onChange={e => setManualSearchQuery(e.target.value)}
                          />
                        </div>

                        {manualSearchQuery.trim() && (
                          <div className='bento-search-results-list'>
                            {allTeams
                              .filter(t => {
                                const q = manualSearchQuery.toLowerCase();
                                return t.temp_team_id.toLowerCase().includes(q) || t.team_name.toLowerCase().includes(q) || t.leader_name.toLowerCase().includes(q);
                              })
                              .slice(0, 4)
                              .map(t => (
                                <div key={t.temp_team_id} className='bento-search-res-item'>
                                  <div>
                                    <strong>{t.team_name}</strong> ({t.temp_team_id})
                                    <span className='res-lead'>Leader: {t.leader_name}</span>
                                  </div>
                                  <button 
                                    className='btn-bento-start-pitch'
                                    onClick={() => handleStartJuryEvaluation(t)}
                                  >
                                    <Play size={13} />
                                    <span>Start Pitch</span>
                                  </button>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* BENTO TILE 2: ACTIVE EVALUATOR TERMINAL & SCORE METER */}
                  <div className='bento-card bento-evaluator-card'>
                    <div className='bento-eval-header'>
                      <div className='bento-sec-kicker'>
                        <ShieldCheck size={14} className='text-primary' />
                        <span>ACTIVE JURY TERMINAL</span>
                      </div>
                      <span className='bento-sec-hint'>Switch evaluator to enter separate score</span>
                    </div>

                    <div className='bento-evaluator-selector-grid'>
                      {(activePanelObj.juries || []).map((j, idx) => {
                        const isSelected = activeEvaluatorName === j.name;
                        const currentTeamId = activeSessions[activePanelObj.id]?.teamId;
                        const alreadyScored = (evaluationLedger || []).some(l => l.teamId === currentTeamId && (l.evaluatorName === j.name || l.juries?.[0]?.name === j.name));
                        return (
                          <button
                            key={idx}
                            type='button'
                            className={`bento-eval-pill ${isSelected ? 'selected' : ''}`}
                            onClick={() => setActiveEvaluatorName(j.name)}
                          >
                            <div className='bento-eval-avatar'>
                              {j.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div className='bento-eval-info'>
                              <strong className='eval-name'>{j.name}</strong>
                              <span className='eval-role'>{j.role || j.designation}</span>
                            </div>
                            {alreadyScored ? (
                              <span className='bento-scored-pill'>✓ Scored</span>
                            ) : isSelected ? (
                              <span className='bento-active-pill'>Active</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>

                    {/* Live Score Meter */}
                    {(() => {
                      const totalScore = Object.values(rubricScores).reduce((a, b) => a + (parseInt(b) || 0), 0);
                      const pct = Math.round((totalScore / 50) * 100);
                      const isTop = pct >= 80;
                      const isMid = pct >= 60;
                      return (
                        <div className={`bento-score-gauge-card ${isTop ? 'tier-top' : isMid ? 'tier-mid' : 'tier-base'}`}>
                          <div className='gauge-left'>
                            <span className='gauge-lbl'>Running Total Score</span>
                            <div className='gauge-digits-row'>
                              <span className='gauge-num'>{totalScore}</span>
                              <span className='gauge-denom'>/ 50 Max</span>
                            </div>
                          </div>
                          <div className='gauge-right'>
                            <span className='gauge-pct-badge'>{pct}% Standing</span>
                            <span className='gauge-verdict-lbl'>{isTop ? '🌟 Distinction' : isMid ? '🟢 Proficient' : '🟡 Standard'}</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Prior Evaluations list for current team */}
                    {(() => {
                      const currentTeamId = activeSessions[activePanelObj.id]?.teamId;
                      if (!currentTeamId) return null;
                      const teamRecords = (evaluationLedger || []).filter(l => l.teamId === currentTeamId);
                      if (teamRecords.length === 0) return null;
                      return (
                        <div className='bento-prior-evals-wrap'>
                          <span className='prior-title'>Team Scorecards ({teamRecords.length}):</span>
                          <div className='prior-chips-list'>
                            {teamRecords.map((rec, rIdx) => (
                              <div key={rec.id || rIdx} className='prior-chip'>
                                <strong>{rec.evaluatorName?.split(' ')[0] || 'Jury'}:</strong>
                                <span className='sc'>{rec.totalScore}/50</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* BENTO ROW 2: 5-PARAMETER RUBRIC SCORING TILES (Interactive Grid) */}
                <div className='bento-rubric-section'>
                  <div className='bento-rubric-sec-header'>
                    <div className='sec-title-left'>
                      <Award size={18} className='text-primary' />
                      <div>
                        <h3>Section 65B Digital Rubric Matrix</h3>
                        <p>Grade all 5 parameters from 1 (lowest) to 10 (highest)</p>
                      </div>
                    </div>

                    <button 
                      type='button' 
                      className='btn-rubric-ai-copilot-pill'
                      onClick={() => setIsAiCopilotModalOpen(true)}
                    >
                      <Bot size={15} />
                      <span>AI Question Copilot (28+)</span>
                      <Sparkles size={13} className='text-amber' />
                    </button>
                  </div>

                  <div className='bento-parameters-grid'>
                    {[
                      {
                        key: 'innovation',
                        num: '01',
                        title: 'Innovation & Novelty',
                        desc: 'Uniqueness of approach, creativity, and original intellectual merit.'
                      },
                      {
                        key: 'feasibility',
                        num: '02',
                        title: 'Technical Architecture & Feasibility',
                        desc: 'System design, stack choices, engineering soundness, and scalability.'
                      },
                      {
                        key: 'prototype',
                        num: '03',
                        title: 'Working Demo & Prototype Completeness',
                        desc: 'Real implementation, live code/hardware demo, and UI completeness.'
                      },
                      {
                        key: 'presentation',
                        num: '04',
                        title: 'Presentation & Pitch Delivery',
                        desc: 'Time management, clarity of speech, slide deck quality, and team synergy.'
                      },
                      {
                        key: 'defense',
                        num: '05',
                        title: 'Q&A Defense & Domain Knowledge',
                        desc: 'Confidence during jury cross-examination and domain depth.'
                      }
                    ].map(param => {
                      const score = rubricScores[param.key] || 0;
                      const getBadgeTier = (s) => {
                        if (s >= 9) return { label: 'Outstanding', cls: 'tier-high' };
                        if (s >= 7) return { label: 'Good', cls: 'tier-good' };
                        if (s >= 5) return { label: 'Moderate', cls: 'tier-mod' };
                        return { label: 'Needs Work', cls: 'tier-low' };
                      };
                      const tier = getBadgeTier(score);

                      return (
                        <div key={param.key} className='bento-param-tile'>
                          <div className='param-tile-header'>
                            <div className='param-title-wrap'>
                              <span className='param-num-chip'>{param.num}</span>
                              <div>
                                <h4 className='param-title-text'>{param.title}</h4>
                                <p className='param-desc-text'>{param.desc}</p>
                              </div>
                            </div>

                            <div className={`param-score-chip ${tier.cls}`}>
                              <span className='num-val'>{score} <span className='denom'>/ 10</span></span>
                              <span className='tier-lbl'>{tier.label}</span>
                            </div>
                          </div>

                          {/* 10-Score Matrix Buttons */}
                          <div className='bento-score-buttons-row'>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                              const isSelected = score === num;
                              return (
                                <button
                                  key={num}
                                  type='button'
                                  className={`bento-score-btn ${isSelected ? 'selected' : ''}`}
                                  onClick={() => setRubricScores(prev => ({ ...prev, [param.key]: num }))}
                                  title={`Grade ${num}/10`}
                                >
                                  <span>{num}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Quick Preset Buttons */}
                          <div className='bento-preset-strip'>
                            <span className='preset-kicker'>Quick:</span>
                            <button type='button' className='btn-bento-preset' onClick={() => setRubricScores(prev => ({ ...prev, [param.key]: 4 }))}>Pass (4)</button>
                            <button type='button' className='btn-bento-preset' onClick={() => setRubricScores(prev => ({ ...prev, [param.key]: 6 }))}>Avg (6)</button>
                            <button type='button' className='btn-bento-preset' onClick={() => setRubricScores(prev => ({ ...prev, [param.key]: 8 }))}>Good (8)</button>
                            <button type='button' className='btn-bento-preset' onClick={() => setRubricScores(prev => ({ ...prev, [param.key]: 10 }))}>Max (10)</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* BENTO ROW 3: OFFICIAL REMARKS & PANEL WAITING QUEUE */}
                <div className='bento-row-bottom'>
                  {/* BENTO CARD: OFFICIAL REMARKS & SUBMIT */}
                  <div className='bento-card bento-remarks-card'>
                    <div className='remarks-header'>
                      <div className='remarks-title-group'>
                        <MessageSquare size={16} className='text-primary' />
                        <h4>Official Evaluator Feedback &amp; Remarks</h4>
                      </div>
                      <span className='remarks-hint'>Auto-populated by AI Copilot or typed directly</span>
                    </div>

                    <textarea
                      rows='4'
                      placeholder='Enter constructive feedback, key strengths, architecture notes, or insert questions from AI Copilot...'
                      value={evalFeedback}
                      onChange={e => setEvalFeedback(e.target.value)}
                      className='bento-remarks-textarea'
                    ></textarea>

                    <div className='bento-submit-actions'>
                      <button 
                        type='button'
                        className='btn-bento-submit-primary'
                        disabled={!activeSessions[activePanelObj.id]}
                        onClick={() => handleSubmitEvaluationScore(false)}
                      >
                        <CheckCircle2 size={18} />
                        <span>Submit Score as {activeEvaluatorName || 'Evaluator'} ({Object.values(rubricScores).reduce((a, b) => a + (parseInt(b) || 0), 0)}/50)</span>
                      </button>

                      <button 
                        type='button'
                        className='btn-bento-submit-secondary'
                        disabled={!activeSessions[activePanelObj.id]}
                        onClick={() => handleSubmitEvaluationScore(true)}
                        title='Conclude evaluation immediately and call next team from queue'
                      >
                        <Square size={14} />
                        <span>Conclude Pitch &amp; Call Next</span>
                      </button>
                    </div>
                  </div>

                  {/* BENTO CARD: PANEL WAITING QUEUE */}
                  <div className='bento-card bento-queue-card'>
                    <div className='queue-header-row'>
                      <div className='q-head-title'>
                        <Users size={16} className='text-indigo' />
                        <h4>Waiting Queue for {activePanelObj.code}</h4>
                      </div>
                      <span className='q-count-badge'>{(panelQueues[activePanelObj.id] || []).length} Teams</span>
                    </div>

                    {(panelQueues[activePanelObj.id] || []).length === 0 ? (
                      <div className='bento-empty-queue'>
                        <p>No teams currently queued for {activePanelObj.name}.</p>
                        <span className='sub'>Teams can book slots in the Student Booking portal.</span>
                      </div>
                    ) : (
                      <div className='bento-queue-items-scroll'>
                        {(panelQueues[activePanelObj.id] || []).map((item) => (
                          <div key={item.teamId} className={`bento-queue-item ${item.status === 'DELAYED' ? 'is-delayed' : ''}`}>
                            <div className='q-item-info-col'>
                              <div className='q-token-row'>
                                <span className='q-token'>{item.tokenNumber}</span>
                                {item.status === 'DELAYED' && <span className='q-delayed-tag'>⏱ Delayed</span>}
                              </div>
                              <strong className='q-name'>{item.teamName}</strong>
                              <span className='q-meta'>{item.leaderName} • {item.psId}</span>
                            </div>

                            <div className='q-item-actions-col'>
                              <button 
                                type='button'
                                className='btn-q-skip'
                                onClick={() => handleDelayQueueItem(item.teamId)}
                                title='Skip team & move to back of waiting queue'
                              >
                                <FastForward size={13} />
                                <span>Skip</span>
                              </button>
                              <button 
                                className='btn-q-start'
                                disabled={!!activeSessions[activePanelObj.id]}
                                onClick={() => handleStartJuryEvaluation(item)}
                                title={activeSessions[activePanelObj.id] ? 'Session currently in progress' : 'Start pitch presentation'}
                              >
                                <Play size={13} />
                                <span>Start</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* POP-UP AI INQUIRY COPILOT MODAL PANEL */}
              {isAiCopilotModalOpen && (
                <div className='ai-copilot-modal-backdrop' onClick={() => setIsAiCopilotModalOpen(false)}>
                  <div className='ai-copilot-modal-container' onClick={e => e.stopPropagation()}>
                    <div className='ai-copilot-modal-header'>
                      <div className='ai-modal-header-left'>
                        <div className='ai-modal-badge'>
                          <Bot size={22} className='text-primary' />
                          <Sparkles size={16} className='text-amber' />
                        </div>
                        <div>
                          <h3>AI Jury Inquiry Copilot</h3>
                          <p>28+ Theme-Tailored Evaluation Questions across 10 Engineering Dimensions</p>
                        </div>
                      </div>

                      <div className='ai-modal-header-right'>
                        <div className='ai-modal-search'>
                          <Search size={14} className='search-ico' />
                          <input 
                            type='text' 
                            placeholder='Search questions (e.g. offline, patent, scale)...'
                            value={questionSearchQuery}
                            onChange={e => setQuestionSearchQuery(e.target.value)}
                          />
                        </div>

                        <button 
                          type='button' 
                          className='btn-close-ai-modal'
                          onClick={() => setIsAiCopilotModalOpen(false)}
                          title='Close AI Copilot'
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Category Filter Pills */}
                    <div className='ai-modal-categories-bar'>
                      {[
                        { id: 'ALL', label: 'All (28+)' },
                        { id: 'Field Research', label: 'Field Research' },
                        { id: 'Solution', label: 'Solution & Flow' },
                        { id: 'Innovation', label: 'Innovation / IP' },
                        { id: 'Tech Stack', label: 'Tech Stack' },
                        { id: 'Feasibility', label: 'Feasibility Demo' },
                        { id: 'Viability', label: 'Viability' },
                        { id: 'Scalability', label: 'Scalability' },
                        { id: 'Reliability', label: 'Security / 65B' },
                        { id: 'Competitors', label: 'Competitors' },
                        { id: 'Risk Analysis', label: 'Risk Analysis' },
                      ].map(cat => (
                        <button
                          key={cat.id}
                          type='button'
                          className={`ai-cat-pill ${selectedQuestionCategory === cat.id ? 'active' : ''}`}
                          onClick={() => setSelectedQuestionCategory(cat.id)}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Questions Scrollable List */}
                    <div className='ai-modal-questions-scroll'>
                      {AI_EVALUATION_QUESTIONS_BY_THEME
                        .filter(q => {
                          if (selectedQuestionCategory !== 'ALL' && q.category !== selectedQuestionCategory) return false;
                          if (!questionSearchQuery.trim()) return true;
                          const term = questionSearchQuery.toLowerCase();
                          return (
                            q.question.toLowerCase().includes(term) ||
                            q.tag.toLowerCase().includes(term) ||
                            q.categoryLabel.toLowerCase().includes(term) ||
                            q.rationale.toLowerCase().includes(term)
                          );
                        })
                        .map(item => {
                          const isAsked = askedQuestionIds.has(item.id);

                          return (
                            <div key={item.id} className={`ai-question-card ${isAsked ? 'is-asked' : ''}`}>
                              <div className='q-card-meta'>
                                <div className='q-tags'>
                                  <span className='cat-tag'>{item.categoryLabel}</span>
                                  <span className='sub-tag'>{item.tag}</span>
                                </div>
                                <div className='q-actions'>
                                  <button
                                    type='button'
                                    className={`btn-toggle-asked ${isAsked ? 'active' : ''}`}
                                    onClick={() => handleToggleQuestionAsked(item.id)}
                                  >
                                    {isAsked ? <CheckSquare size={14} /> : <Square size={14} />}
                                    <span>{isAsked ? 'Asked' : 'Mark Asked'}</span>
                                  </button>

                                  <button
                                    type='button'
                                    className='btn-insert-remarks'
                                    onClick={() => {
                                      handleInsertQuestionToFeedback(item.question, item.tag);
                                      playSoundAlert('chime');
                                    }}
                                    title='Insert this question directly into remarks'
                                  >
                                    <Copy size={13} />
                                    <span>Insert to Remarks</span>
                                  </button>
                                </div>
                              </div>

                              <p className='q-prompt-text'>"{item.question}"</p>
                              <div className='q-why-ask-box'>
                                <Lightbulb size={13} className='text-amber' />
                                <span><strong>Why ask:</strong> {item.rationale}</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
    </div>
  );
}
