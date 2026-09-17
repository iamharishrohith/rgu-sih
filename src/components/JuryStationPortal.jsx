import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Play, Pause, Plus, CheckCircle2, Clock, Users, Building2, 
  Search, ShieldCheck, Download, Sparkles, Monitor, Laptop, 
  Smartphone, FileText, Layers, ArrowLeft, Volume2, VolumeX,
  LayoutDashboard, Bot, Brain, MessageSquare, Lightbulb, CheckSquare, 
  Square, Copy, Award, HelpCircle, Check, Compass, ShieldAlert, Cpu, LogOut
} from 'lucide-react';
import { normalizeSchoolName } from '../data/sihMasterData';
import LivePixelDigitalClock from './LivePixelDigitalClock.jsx';
import PanelManagerModal from './PanelManagerModal.jsx';

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

export const DEFAULT_EVALUATION_PANELS = [
  {
    id: 'panel_1',
    name: 'Panel 1 — Software, AI & WebTech',
    code: 'P1',
    room: 'Hall A (Room 101)',
    domain: 'Software & AI',
    presentMins: 20,
    qaMins: 10,
    status: 'ACTIVE',
    juries: [
      { name: 'Dr. R. Kumar', role: 'Chief Jury', designation: 'Professor & AI Lead, RGU' },
      { name: 'Er. S. Vignesh', role: 'Technical Evaluator', designation: 'Senior Architect, TechCorp' }
    ]
  },
  {
    id: 'panel_2',
    name: 'Panel 2 — Hardware, Embedded & IoT',
    code: 'P2',
    room: 'Hardware Lab (Room 102)',
    domain: 'Hardware & IoT',
    presentMins: 20,
    qaMins: 10,
    status: 'ACTIVE',
    juries: [
      { name: 'Prof. M. Anitha', role: 'Chief Jury', designation: 'Head of Robotics, RGU' },
      { name: 'Er. K. Rajesh', role: 'Technical Evaluator', designation: 'IoT Systems Specialist' }
    ]
  },
  {
    id: 'panel_3',
    name: 'Panel 3 — AgriTech & Disaster Sentinel',
    code: 'P3',
    room: 'Hall B (Room 103)',
    domain: 'AgriTech & Disaster',
    presentMins: 20,
    qaMins: 10,
    status: 'ACTIVE',
    juries: [
      { name: 'Dr. P. Suresh', role: 'Chief Jury', designation: 'Dean of Research, RGU' },
      { name: 'Er. N. Divya', role: 'Technical Evaluator', designation: 'Data Scientist' }
    ]
  },
  {
    id: 'panel_4',
    name: 'Panel 4 — FinTech, LegalTech & Smart Governance',
    code: 'P4',
    room: 'Mini Auditorium (Room 104)',
    domain: 'FinTech & Governance',
    presentMins: 20,
    qaMins: 10,
    status: 'ACTIVE',
    juries: [
      { name: 'Dr. V. Karthik', role: 'Chief Jury', designation: 'FinTech Chair & LegalTech Consultant' },
      { name: 'Er. T. Meenakshi', role: 'Technical Evaluator', designation: 'Cybersecurity Auditor' }
    ]
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
  const [loginJuryPasscode, setLoginJuryPasscode] = useState('Smart@26');
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
    const entered = (loginJuryPasscode || '').trim().toUpperCase();
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
    try {
      sessionStorage.setItem('sih_jury_auth_session', JSON.stringify(sessionData));
    } catch (err) {}
    playSoundAlert('chime');
  };

  const handleJuryLogout = () => {
    setAuthenticatedJury(null);
    setLoginJuryPasscode('');
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

  // Ledger Filter
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerPanelFilter, setLedgerPanelFilter] = useState('ALL');

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

  // Handle Student Auto-Balanced Slot Booking
  const handleBookSlotForTeam = (team) => {
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

  // Submit Rubric Evaluation
  const handleSubmitEvaluationScore = () => {
    const current = activeSessions[activePanelObj.id];
    if (!current) return;

    const total = Object.values(rubricScores).reduce((acc, v) => acc + (parseInt(v) || 0), 0);
    const now = new Date();

    const ledgerEntry = {
      id: `EVAL-${Date.now()}`,
      panelId: activePanelObj.id,
      panelName: activePanelObj.name,
      room: activePanelObj.room,
      juries: activePanelObj.juries || [],
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

    const nextLedger = [ledgerEntry, ...(evaluationLedger || [])];
    if (onUpdateLedger) onUpdateLedger(nextLedger);

    const nextSessions = { ...activeSessions };
    delete nextSessions[activePanelObj.id];
    if (onUpdateSessions) onUpdateSessions(nextSessions);

    const nextQueue = { ...evaluationQueue };
    delete nextQueue[current.teamId];
    if (onUpdateQueue) onUpdateQueue(nextQueue);

    setRubricScores({ innovation: 8, feasibility: 8, prototype: 8, presentation: 8, defense: 8 });
    setEvalFeedback('');
    playSoundAlert('phase_switch');
    alert(`Evaluation submitted successfully for ${current.teamName}! Final Score: ${total}/50`);
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
                      placeholder='Enter Jury PIN (e.g. Smart@26)'
                      value={loginJuryPasscode}
                      onChange={e => setLoginJuryPasscode(e.target.value)}
                      required
                    />
                    <span className='input-hint-sub'>Default PIN: <code>Smart@26</code> or Panel Code (e.g. <code>P1</code> to <code>P5</code>)</span>
                  </div>

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

              <div className='jury-workspace-grid'>
                {/* LEFT COLUMN: ACTIVE SESSION + AI SUGGESTED QUESTIONS + QUEUE */}
                <div className='jury-col-left'>
                  {activeSessions[activePanelObj.id] ? (
                    (() => {
                      const currSession = activeSessions[activePanelObj.id];
                      const timing = getSessionTimingInfo(currSession);

                      return (
                        <div className='jury-live-card'>
                          <div className='jury-card-top-bar'>
                            <div className='panel-meta-badge'>
                              <span className='code-tag'>{activePanelObj.code}</span>
                              <span>{activePanelObj.name} • {activePanelObj.room}</span>
                            </div>
                            <span className={`eval-phase-tag ${timing.phase.toLowerCase()}`}>
                              {timing.phase === 'PRESENTATION' ? 'Phase 1: Pitch Presentation' : timing.phase === 'QA' ? 'Phase 2: Jury Q&A Defense' : 'Session Concluded'}
                            </span>
                          </div>

                          <div className='jury-timer-hero-box'>
                            <div className='timer-big-circle'>
                              <span className='timer-num-digits'>{timing.timeDisplay}</span>
                              <span className='timer-phase-caption'>
                                {timing.phase === 'PRESENTATION' ? 'Pitch Presentation Time' : 'Jury Q&A Defense Time'}
                              </span>
                            </div>

                            <div className='timer-buttons-row'>
                              <button 
                                className={`btn-timer-ctrl ${timing.isPaused ? 'btn-resume' : 'btn-pause'}`}
                                onClick={() => handleToggleTimerPause(activePanelObj.id)}
                              >
                                {timing.isPaused ? <Play size={16} /> : <Pause size={16} />}
                                <span>{timing.isPaused ? 'Resume Timer' : 'Pause Timer'}</span>
                              </button>

                              <button 
                                className='btn-timer-ctrl btn-extend'
                                onClick={() => handleExtendSession(activePanelObj.id, 5)}
                              >
                                <Plus size={16} />
                                <span>+5m Grace</span>
                              </button>
                            </div>
                          </div>

                          <div className='jury-team-dossier-card'>
                            <div className='dossier-header-row'>
                              <span className='dossier-id-badge'>{currSession.teamId}</span>
                              <span className='dossier-ps-id'>{currSession.psId}</span>
                            </div>
                            <h2 className='dossier-team-name'>{currSession.teamName}</h2>
                            {currSession.psTitle && (
                              <p className='dossier-ps-title'>{currSession.psTitle}</p>
                            )}
                            <div className='dossier-meta-grid'>
                              <div>
                                <span className='m-label'>Team Leader:</span>
                                <strong className='m-val'>{currSession.leaderName} ({currSession.regNo})</strong>
                              </div>
                              <div>
                                <span className='m-label'>School / College:</span>
                                <strong className='m-val'>{currSession.school}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className='jury-no-session-card'>
                      <div className='no-session-icon'>
                        <Laptop size={36} />
                      </div>
                      <h3>No Active Evaluation in {activePanelObj.name}</h3>
                      <p>Select the next team from your queue below or search any team to begin scoring.</p>

                      <div className='jury-manual-search-box'>
                        <label>Direct Team Lookup &amp; Start:</label>
                        <div className='search-input-wrap'>
                          <Search size={16} className='search-icon' />
                          <input 
                            type='text' 
                            placeholder='Search team name, leader, or team ID...'
                            value={manualSearchQuery}
                            onChange={e => setManualSearchQuery(e.target.value)}
                          />
                        </div>

                        {manualSearchQuery.trim() && (
                          <div className='manual-search-results-dropdown'>
                            {allTeams
                              .filter(t => {
                                const q = manualSearchQuery.toLowerCase();
                                return t.temp_team_id.toLowerCase().includes(q) || t.team_name.toLowerCase().includes(q) || t.leader_name.toLowerCase().includes(q);
                              })
                              .slice(0, 5)
                              .map(t => (
                                <div 
                                  key={t.temp_team_id}
                                  className='manual-search-result-row'
                                  onClick={() => setManualSelectedTeam(t)}
                                >
                                  <div>
                                    <strong>{t.team_name}</strong> ({t.temp_team_id})
                                    <span className='sub-lead'>Leader: {t.leader_name}</span>
                                  </div>
                                  <button 
                                    className='btn-quick-start-eval'
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
                    </div>
                  )}

                  {/* JURY LEFT COLUMN TABS */}
                  <div className='jury-left-nav-tabs'>
                    <button
                      type='button'
                      className={`jury-left-tab-btn ${juryLeftTab === 'copilot' ? 'active' : ''}`}
                      onClick={() => setJuryLeftTab('copilot')}
                    >
                      <Bot size={15} />
                      <span>AI Inquiry Copilot (28+)</span>
                    </button>

                    <button
                      type='button'
                      className={`jury-left-tab-btn ${juryLeftTab === 'queue' ? 'active' : ''}`}
                      onClick={() => setJuryLeftTab('queue')}
                    >
                      <Users size={15} />
                      <span>Panel Queue ({(panelQueues[activePanelObj.id] || []).length})</span>
                    </button>
                  </div>

                  {/* TAB 1: AI COPILOT */}
                  {juryLeftTab === 'copilot' && (
                    <div className='ai-questions-copilot-card'>
                      <div className='ai-copilot-header'>
                        <div className='ai-header-left'>
                          <div className='ai-sparkle-badge'>
                            <Bot size={18} className='text-primary' />
                            <Sparkles size={14} className='sparkle-sub' />
                          </div>
                          <div>
                            <h4>AI Jury Inquiry Copilot</h4>
                            <p>28+ Theme-Tailored Evaluation Questions across 10 Engineering Dimensions</p>
                          </div>
                        </div>

                        <div className='ai-search-box'>
                          <Search size={14} className='ai-search-ico' />
                          <input 
                            type='text' 
                            placeholder='Search questions (e.g. offline, patent, scale)...'
                            value={questionSearchQuery}
                            onChange={e => setQuestionSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Category Filter Pills */}
                      <div className='ai-category-filter-strip'>
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

                      {/* Questions List */}
                      <div className='ai-questions-scroll-list'>
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
                              <div key={item.id} className={`ai-question-item-card ${isAsked ? 'is-asked' : ''}`}>
                                <div className='q-top-meta-row'>
                                  <div className='q-tags-group'>
                                    <span className='q-category-tag'>{item.categoryLabel}</span>
                                    <span className='q-subtag'>{item.tag}</span>
                                  </div>
                                  <div className='q-actions-group'>
                                    <button
                                      type='button'
                                      className={`btn-mark-asked ${isAsked ? 'active' : ''}`}
                                      onClick={() => handleToggleQuestionAsked(item.id)}
                                      title={isAsked ? 'Marked as Asked' : 'Click to Mark as Asked'}
                                    >
                                      {isAsked ? <CheckSquare size={14} /> : <Square size={14} />}
                                      <span>{isAsked ? 'Asked' : 'Mark Asked'}</span>
                                    </button>

                                    <button
                                      type='button'
                                      className='btn-copy-to-feedback'
                                      onClick={() => handleInsertQuestionToFeedback(item.question, item.tag)}
                                      title='Insert question into Evaluator Feedback Remarks'
                                    >
                                      <Copy size={13} />
                                      <span>Insert to Remarks</span>
                                    </button>
                                  </div>
                                </div>

                                <p className='q-text-body'>"{item.question}"</p>
                                <div className='q-rationale-row'>
                                  <Lightbulb size={12} className='text-amber' />
                                  <span><strong>Why ask:</strong> {item.rationale}</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PANEL WAITING QUEUE */}
                  {juryLeftTab === 'queue' && (
                    <div className='jury-panel-queue-card'>
                      <div className='queue-card-header'>
                        <h4>Waiting Queue for {activePanelObj.code} ({(panelQueues[activePanelObj.id] || []).length} Teams)</h4>
                      </div>

                      {(panelQueues[activePanelObj.id] || []).length === 0 ? (
                        <div className='empty-queue-callout'>No teams currently queued for this panel. Teams can book slots in the Student Booking tab or you can look up any team above.</div>
                      ) : (
                        <div className='jury-queue-items-list'>
                          {(panelQueues[activePanelObj.id] || []).map((item) => (
                            <div key={item.teamId} className='jury-queue-item-row'>
                              <div className='item-left'>
                                <span className='item-token'>{item.tokenNumber}</span>
                                <div>
                                  <strong>{item.teamName}</strong>
                                  <span className='item-meta'>{item.leaderName} • {item.psId}</span>
                                </div>
                              </div>
                              <button 
                                className='btn-call-team-start'
                                disabled={!!activeSessions[activePanelObj.id]}
                                onClick={() => handleStartJuryEvaluation(item)}
                              >
                                <Play size={14} />
                                <span>Start Evaluation</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: RUBRIC SCORING WITH CHOOSEABLE 1-10 NUMBER PILLS */}
                <div className='jury-col-right'>
                  <div className='jury-rubric-card'>
                    <div className='rubric-header'>
                      <div>
                        <h3>Section 65B Live Evaluation Rubric</h3>
                        <p>Official 5-Parameter Campus Rubric (Choose 1 to 10 for each criteria)</p>
                      </div>
                      <div className='rubric-total-badge'>
                        <span className='total-score-num'>
                          {Object.values(rubricScores).reduce((a, b) => a + (parseInt(b) || 0), 0)}
                        </span>
                        <span className='total-score-denom'>/ 50</span>
                      </div>
                    </div>

                    <div className='rubric-parameters-list'>
                      {/* Parameter 1: Innovation */}
                      <div className='rubric-parameter-row'>
                        <div className='param-info'>
                          <div className='param-title-row'>
                            <strong>1. Innovation &amp; Novelty</strong>
                            <span className='param-selected-badge'>{rubricScores.innovation} / 10</span>
                          </div>
                          <span>Uniqueness of the approach, creativity, and original intellectual merit.</span>
                        </div>
                        <div className='param-score-pill-selector'>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <button 
                              key={num}
                              type='button'
                              className={`score-pill-btn ${rubricScores.innovation === num ? 'active-score' : ''}`}
                              onClick={() => setRubricScores(prev => ({ ...prev, innovation: num }))}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Parameter 2: Feasibility */}
                      <div className='rubric-parameter-row'>
                        <div className='param-info'>
                          <div className='param-title-row'>
                            <strong>2. Technical Architecture &amp; Feasibility</strong>
                            <span className='param-selected-badge'>{rubricScores.feasibility} / 10</span>
                          </div>
                          <span>System design, stack choices, engineering soundness, and scalability.</span>
                        </div>
                        <div className='param-score-pill-selector'>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <button 
                              key={num}
                              type='button'
                              className={`score-pill-btn ${rubricScores.feasibility === num ? 'active-score' : ''}`}
                              onClick={() => setRubricScores(prev => ({ ...prev, feasibility: num }))}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Parameter 3: Working Demo */}
                      <div className='rubric-parameter-row'>
                        <div className='param-info'>
                          <div className='param-title-row'>
                            <strong>3. Working Demo &amp; Prototype Completeness</strong>
                            <span className='param-selected-badge'>{rubricScores.prototype} / 10</span>
                          </div>
                          <span>Real implementation, live code/hardware demonstration, and functional UI.</span>
                        </div>
                        <div className='param-score-pill-selector'>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <button 
                              key={num}
                              type='button'
                              className={`score-pill-btn ${rubricScores.prototype === num ? 'active-score' : ''}`}
                              onClick={() => setRubricScores(prev => ({ ...prev, prototype: num }))}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Parameter 4: Presentation & Pitch */}
                      <div className='rubric-parameter-row'>
                        <div className='param-info'>
                          <div className='param-title-row'>
                            <strong>4. Presentation &amp; Pitch Delivery</strong>
                            <span className='param-selected-badge'>{rubricScores.presentation} / 10</span>
                          </div>
                          <span>Time management, clarity of speech, slide deck quality, and team synergy.</span>
                        </div>
                        <div className='param-score-pill-selector'>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <button 
                              key={num}
                              type='button'
                              className={`score-pill-btn ${rubricScores.presentation === num ? 'active-score' : ''}`}
                              onClick={() => setRubricScores(prev => ({ ...prev, presentation: num }))}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Parameter 5: Q&A Defense */}
                      <div className='rubric-parameter-row'>
                        <div className='param-info'>
                          <div className='param-title-row'>
                            <strong>5. Q&amp;A Defense &amp; Domain Knowledge</strong>
                            <span className='param-selected-badge'>{rubricScores.defense} / 10</span>
                          </div>
                          <span>Confidence during jury cross-examination and domain depth.</span>
                        </div>
                        <div className='param-score-pill-selector'>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <button 
                              key={num}
                              type='button'
                              className={`score-pill-btn ${rubricScores.defense === num ? 'active-score' : ''}`}
                              onClick={() => setRubricScores(prev => ({ ...prev, defense: num }))}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className='rubric-feedback-box'>
                      <label>Official Evaluator Feedback &amp; Remarks:</label>
                      <textarea 
                        rows='4'
                        placeholder='Enter constructive feedback, strengths, and areas for improvement (or click "Insert to Remarks" from AI Copilot)...'
                        value={evalFeedback}
                        onChange={e => setEvalFeedback(e.target.value)}
                      ></textarea>
                    </div>

                    <div className='rubric-submit-actions'>
                      <button 
                        className='btn-submit-evaluation-primary'
                        disabled={!activeSessions[activePanelObj.id]}
                        onClick={handleSubmitEvaluationScore}
                      >
                        <CheckCircle2 size={18} />
                        <span>Submit Score &amp; Conclude Evaluation</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
    </div>
  );
}
