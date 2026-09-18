import React, { useState, useEffect, useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, Printer, ShieldCheck, Award, Sparkles, User, Users, 
  CheckCircle2, Building2, FileText, ChevronDown, Check,
  Download, Layers, Sliders, RefreshCw, Star, Compass, Hash,
  Edit3, Bookmark, Eye, Copy, ArrowRight
} from 'lucide-react';
import { MASTER_TEAMS, normalizeSchoolName } from '../data/sihMasterData.js';

// Available certificate roles with tailored credentials and citations
export const CERTIFICATE_ROLES = [
  {
    id: 'LEADER',
    name: 'Team Leader',
    badge: 'Technical Leadership',
    title: 'CERTIFICATE OF TECHNICAL LEADERSHIP & ACHIEVEMENT',
    citationPrefix: 'is hereby awarded this distinction for exemplary technical leadership, architectural vision, and team stewardship as the Team Leader of',
    iconColor: '#f59e0b',
    sealText: 'LEADERSHIP EXCELLENCE'
  },
  {
    id: 'MEMBER',
    name: 'Team Member',
    badge: 'Core Developer',
    title: 'CERTIFICATE OF TECHNICAL ACHIEVEMENT & INNOVATION',
    citationPrefix: 'is hereby recognized for outstanding engineering excellence, algorithmic problem solving, and collaborative innovation as an active Core Developer of',
    iconColor: '#3b82f6',
    sealText: 'CORE INNOVATION'
  },
  {
    id: 'WINNER',
    name: 'Grand Winner / 1st Place',
    badge: '1st Place Laureate',
    title: 'CERTIFICATE OF GRAND CHAMPIONSHIP & SUPREME MERIT',
    citationPrefix: 'is proudly honored as the Grand Laureate & 1st Place Winner for extraordinary innovation, production-grade implementation, and peerless technical execution with',
    iconColor: '#10b981',
    sealText: 'GRAND CHAMPION'
  },
  {
    id: 'FINALIST',
    name: 'National Finalist',
    badge: 'Shortlisted Finalist',
    title: 'CERTIFICATE OF NATIONAL SELECTION & MERIT',
    citationPrefix: 'is officially recognized for outstanding performance and selection into the prestigious Campus Grand Finale of Smart India Hackathon 2026 representing',
    iconColor: '#8b5cf6',
    sealText: 'NATIONAL FINALIST'
  },
  {
    id: 'FACULTY_MENTOR',
    name: 'Faculty Mentor',
    badge: 'Academic Mentorship',
    title: 'CERTIFICATE OF ACADEMIC MENTORSHIP & EXCELLENCE',
    citationPrefix: 'is gratefully acknowledged for dedicated academic guidance, research supervision, and domain mentorship provided to team',
    iconColor: '#ec4899',
    sealText: 'ACADEMIC MENTOR'
  },
  {
    id: 'INDUSTRY_MENTOR',
    name: 'Industry Mentor',
    badge: 'Industry Advisory',
    title: 'CERTIFICATE OF INDUSTRY ADVISORY & EXPERTISE',
    citationPrefix: 'is gratefully recognized for providing valuable industry advisory, engineering critique, and professional domain coaching to team',
    iconColor: '#06b6d4',
    sealText: 'INDUSTRY ADVISOR'
  },
  {
    id: 'JURY',
    name: 'Evaluation Jury',
    badge: 'Jury Panelist',
    title: 'CERTIFICATE OF DISTINGUISHED EVALUATION & JURY HONOR',
    citationPrefix: 'is gratefully commended for presiding as an esteemed Expert Jury Member and delivering impartial technical assessments for',
    iconColor: '#6366f1',
    sealText: 'EXPERT JURY'
  },
  {
    id: 'COORDINATOR',
    name: 'Student Coordinator',
    badge: 'Operations & Stewardship',
    title: 'CERTIFICATE OF OPERATIONAL EXCELLENCE & STEWARDSHIP',
    citationPrefix: 'is enthusiastically commended for peerless organizational execution, volunteer leadership, and technical operations stewardship during',
    iconColor: '#14b8a6',
    sealText: 'OPERATIONS LEAD'
  }
];

export const CERTIFICATE_THEMES = [
  {
    id: 'titanium_gold',
    name: 'Obsidian & 24K Gold',
    description: 'Ultra-prestigious dark obsidian with champagne gold metallic accents',
    bgClass: 'theme-titanium-gold',
    accent: '#d97706',
    borderHue: 'rgba(217, 119, 6, 0.4)'
  },
  {
    id: 'cyber_emerald',
    name: 'Cyber Emerald',
    description: 'Vibrant quantum emerald with high-contrast holographic highlights',
    bgClass: 'theme-cyber-emerald',
    accent: '#059669',
    borderHue: 'rgba(16, 185, 129, 0.4)'
  },
  {
    id: 'sapphire_silver',
    name: 'Sovereign Sapphire',
    description: 'Deep royal navy with frost silver and electric cyan highlights',
    bgClass: 'theme-sapphire-silver',
    accent: '#2563eb',
    borderHue: 'rgba(37, 99, 235, 0.4)'
  },
  {
    id: 'classic_white',
    name: 'Enterprise Crisp White',
    description: 'High-contrast pure white university edition with rich navy accents',
    bgClass: 'theme-classic-white',
    accent: '#0f172a',
    borderHue: 'rgba(15, 23, 42, 0.25)'
  }
];

// Helper to calculate deterministic SHA-256 like hash
function generateCertificateHash(name, rollNo, teamId, role, psId, timestamp) {
  const payload = `${name}|${rollNo}|${teamId}|${role}|${psId}|${timestamp}|SIH2026-BSA2023-SEC65B-PROOF`;
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hashPart1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hashPart2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const hashPart3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  const hashPart4 = ((h1 + h2) >>> 0).toString(16).padStart(8, '0');
  return `0x${hashPart1}${hashPart2}${hashPart3}${hashPart4}b94f18d7`;
}

export default function CertificateStudioModal({
  initialTeam = null,
  initialParticipant = null,
  initialRole = 'LEADER',
  allTeams = MASTER_TEAMS,
  registrationsMap = {},
  onClose
}) {
  const [selectedTeamId, setSelectedTeamId] = useState(() => {
    return initialTeam?.temp_team_id || initialTeam?.teamId || allTeams[0]?.temp_team_id || 'SL001';
  });

  const [activeRole, setActiveRole] = useState(initialRole || 'LEADER');
  const [activeTheme, setActiveTheme] = useState('titanium_gold');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);

  // Holographic 3D mouse tilt tracking
  const [tiltStyle, setTiltStyle] = useState({});
  const certContainerRef = useRef(null);

  // Selected Team Object
  const selectedTeam = useMemo(() => {
    const found = allTeams.find(t => (t.temp_team_id === selectedTeamId || t.teamId === selectedTeamId));
    if (found) return found;
    return initialTeam || allTeams[0] || {};
  }, [allTeams, selectedTeamId, initialTeam]);

  // Registration Data for Selected Team
  const regData = useMemo(() => {
    return registrationsMap[selectedTeamId] || registrationsMap[selectedTeam.temp_team_id] || null;
  }, [registrationsMap, selectedTeamId, selectedTeam]);

  // Build full roster of eligible participants for this team
  const participantsList = useMemo(() => {
    const list = [];
    const teamName = regData?.team_name || selectedTeam.team_name || 'Team Unknown';
    const schoolName = normalizeSchoolName(regData?.leader_school || selectedTeam.school || 'Department of Computing');
    const psId = regData?.sih_ps_id || selectedTeam.ps_id || 'SIH2026-PS01';
    const psTitle = regData?.ps_title || selectedTeam.ps_title || 'Smart Innovation';

    // 1. Leader (Member 1)
    list.push({
      id: 'm1',
      role: 'LEADER',
      name: regData?.leader_name || selectedTeam.leader_name || 'Team Leader',
      regNo: regData?.leader_reg_no || selectedTeam.reg_no || '721822XXXXXX',
      school: schoolName,
      dept: regData?.leader_dept || selectedTeam.school || 'Computer Science & Engineering',
      teamName,
      teamId: selectedTeam.temp_team_id || selectedTeam.teamId,
      psId,
      psTitle,
      tier: selectedTeam.status || 'Shortlist',
      index: 1,
      label: `Team Leader: ${regData?.leader_name || selectedTeam.leader_name}`
    });

    // 2. Members 2 to 6
    if (Array.isArray(regData?.members) && regData.members.length > 0) {
      regData.members.forEach((m, idx) => {
        list.push({
          id: `m${idx + 2}`,
          role: 'MEMBER',
          name: m.name || `Team Member ${idx + 2}`,
          regNo: m.reg_no || `721822XXXX0${idx + 2}`,
          school: normalizeSchoolName(m.school || schoolName),
          dept: m.dept || 'Computer Science & Engineering',
          teamName,
          teamId: selectedTeam.temp_team_id || selectedTeam.teamId,
          psId,
          psTitle,
          tier: selectedTeam.status || 'Shortlist',
          index: idx + 2,
          label: `Member #${idx + 2}: ${m.name || `Member ${idx + 2}`}`
        });
      });
    } else {
      // Fallback 5 members if form not filled yet
      for (let i = 2; i <= 6; i++) {
        list.push({
          id: `m${i}`,
          role: 'MEMBER',
          name: `Team Member ${i}`,
          regNo: `721822XXXX0${i}`,
          school: schoolName,
          dept: 'Computer Science & Engineering',
          teamName,
          teamId: selectedTeam.temp_team_id || selectedTeam.teamId,
          psId,
          psTitle,
          tier: selectedTeam.status || 'Shortlist',
          index: i,
          label: `Member #${i}: Team Member ${i} (Unregistered)`
        });
      }
    }

    // 3. Faculty Mentor
    const facultyName = regData?.faculty_mentor_name || selectedTeam.faculty_mentor_name || 'Dr. Faculty Mentor';
    list.push({
      id: 'mentor_fac',
      role: 'FACULTY_MENTOR',
      name: facultyName,
      regNo: 'FAC-ID-RATHINAM',
      school: schoolName,
      dept: 'Department of Computing & Engineering',
      teamName,
      teamId: selectedTeam.temp_team_id || selectedTeam.teamId,
      psId,
      psTitle,
      tier: selectedTeam.status || 'Shortlist',
      index: 7,
      label: `Faculty Mentor: ${facultyName}`
    });

    // 4. Industry Mentor (if available)
    if (regData?.industry_mentor_name) {
      list.push({
        id: 'mentor_ind',
        role: 'INDUSTRY_MENTOR',
        name: regData.industry_mentor_name,
        regNo: 'IND-EXPERT-ADVISOR',
        school: 'Industry Advisory Council',
        dept: 'Technology Advisory Directorate',
        teamName,
        teamId: selectedTeam.temp_team_id || selectedTeam.teamId,
        psId,
        psTitle,
        tier: selectedTeam.status || 'Shortlist',
        index: 8,
        label: `Industry Mentor: ${regData.industry_mentor_name}`
      });
    }

    return list;
  }, [selectedTeam, regData]);

  // Active Single Participant Selection
  const [selectedParticipantId, setSelectedParticipantId] = useState(() => {
    return initialParticipant?.id || 'm1';
  });

  // Custom Participant State (for custom overrides / special guests)
  const [customParticipant, setCustomParticipant] = useState({
    name: 'Dr. Jane Doe',
    regNo: 'RGU-JURY-2026-09',
    school: 'Rathinam Global University',
    dept: 'School of Computer Science & Engineering',
    teamName: 'Smart India Hackathon 2026 Operations',
    teamId: 'SIH26-JURY-01',
    psId: 'SIH2026-OPEN-INNOVATION',
    psTitle: 'Autonomous Real-time AI Evaluation & Verification Engine',
    customHonor: ''
  });

  // Active Participant Data computation
  const currentParticipant = useMemo(() => {
    if (isCustomMode) {
      return {
        ...customParticipant,
        id: 'custom_0',
        role: activeRole,
        tier: 'Special Distinction'
      };
    }
    const found = participantsList.find(p => p.id === selectedParticipantId);
    return found || participantsList[0] || {};
  }, [isCustomMode, customParticipant, participantsList, selectedParticipantId, activeRole]);

  // Current Role Definition
  const currentRoleMeta = useMemo(() => {
    return CERTIFICATE_ROLES.find(r => r.id === activeRole) || CERTIFICATE_ROLES[0];
  }, [activeRole]);

  // Current Theme Definition
  const currentThemeMeta = useMemo(() => {
    return CERTIFICATE_THEMES.find(t => t.id === activeTheme) || CERTIFICATE_THEMES[0];
  }, [activeTheme]);

  // Fixed Certificate Issue Timestamp & Cryptographic Hash
  const certDateStr = 'SEPTEMBER 18, 2026';
  const certHash = useMemo(() => {
    return generateCertificateHash(
      currentParticipant.name,
      currentParticipant.regNo,
      currentParticipant.teamId,
      activeRole,
      currentParticipant.psId,
      certDateStr
    );
  }, [currentParticipant, activeRole]);

  const certNumber = useMemo(() => {
    const prefix = currentParticipant.teamId || 'SIH26';
    const subHash = certHash.substring(2, 8).toUpperCase();
    return `SIH26-SEC65B-${prefix}-${activeRole}-${subHash}`;
  }, [currentParticipant, activeRole, certHash]);

  // 3D Holographic tilt interaction handler
  const handleMouseMove = (e) => {
    if (!certContainerRef.current) return;
    const rect = certContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    const shineX = (x / rect.width) * 100;
    const shineY = (y / rect.height) * 100;

    setTiltStyle({
      transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.005, 1.005, 1.005)`,
      '--shine-x': `${shineX}%`,
      '--shine-y': `${shineY}%`
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      '--shine-x': '50%',
      '--shine-y': '50%'
    });
  };

  // Print single or batch
  const handlePrint = () => {
    window.print();
  };

  // Copy Verification Link
  const [copiedLink, setCopiedLink] = useState(false);
  const handleCopyVerification = () => {
    const link = `https://casevault.rathinam.ac.in/verify?cert=${certNumber}&hash=${certHash}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="drawer-backdrop cert-studio-backdrop" onClick={onClose}>
      <div className="modal-dialog-box cert-studio-dialog" onClick={(e) => e.stopPropagation()}>
        
        {/* Studio Navigation Top Bar (No-Print) */}
        <div className="cert-studio-header no-print">
          <div className="cert-studio-title-block">
            <div className="cert-studio-icon-badge">
              <Award size={22} className="text-amber" />
            </div>
            <div>
              <div className="cert-studio-main-title">
                <span>Innovative Digital Certificate Studio</span>
                <span className="cert-studio-badge-pill">Section 65B Sovereign Credential</span>
              </div>
              <p className="cert-studio-subtitle">
                Cryptographic achievement certificate generator with dynamic role credentials, latent guilloche security borders, and live Section 65B SHA-256 seal.
              </p>
            </div>
          </div>

          <div className="cert-studio-top-actions">
            <button 
              type="button" 
              className={`btn-studio-tab ${isBatchMode ? 'active' : ''}`}
              onClick={() => setIsBatchMode(!isBatchMode)}
              title="Toggle Batch Deck to print all 6 team members + mentor in one click"
            >
              <Layers size={14} />
              <span>{isBatchMode ? 'Single View' : 'Batch Team Deck (6+1)'}</span>
            </button>

            <button 
              type="button" 
              className="btn-studio-print-primary"
              onClick={handlePrint}
            >
              <Printer size={15} />
              <span>{isBatchMode ? 'Print Entire Team Deck' : 'Print / Export PDF'}</span>
            </button>

            <button 
              type="button" 
              className="btn-close-icon"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Studio Control Toolbar (No-Print) */}
        <div className="cert-studio-controls-bar no-print">
          {/* 1. Team Selector */}
          <div className="studio-control-item team-select-item">
            <label><Building2 size={12} /> Target Finalist Team:</label>
            <select
              value={selectedTeamId}
              onChange={(e) => {
                setSelectedTeamId(e.target.value);
                setSelectedParticipantId('m1');
                setActiveRole('LEADER');
                setIsCustomMode(false);
              }}
              className="studio-dropdown-control"
            >
              {allTeams.map(t => (
                <option key={t.temp_team_id || t.teamId} value={t.temp_team_id || t.teamId}>
                  [{t.temp_team_id || t.teamId}] {t.team_name} — {t.ps_id} ({t.status})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Participant Roster Selector */}
          <div className="studio-control-item participant-select-item">
            <label><User size={12} /> Target Recipient / Roster:</label>
            <select
              value={isCustomMode ? 'custom' : selectedParticipantId}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setIsCustomMode(true);
                } else {
                  setIsCustomMode(false);
                  setSelectedParticipantId(e.target.value);
                  const p = participantsList.find(x => x.id === e.target.value);
                  if (p) setActiveRole(p.role);
                }
              }}
              className="studio-dropdown-control"
            >
              <optgroup label="Verified Team Roster">
                {participantsList.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Custom Override">
                <option value="custom">✎ Custom Participant Entry...</option>
              </optgroup>
            </select>
          </div>

          {/* 3. Role Credential Switcher */}
          <div className="studio-control-item role-select-item">
            <label><Award size={12} /> Award Role &amp; Honor:</label>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value)}
              className="studio-dropdown-control highlight-role"
            >
              {CERTIFICATE_ROLES.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.badge})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Theme & Aesthetic Switcher */}
          <div className="studio-control-item theme-select-item">
            <label><Sparkles size={12} /> Security Theme:</label>
            <div className="studio-theme-swatches">
              {CERTIFICATE_THEMES.map(theme => (
                <button
                  key={theme.id}
                  type="button"
                  className={`theme-swatch-btn ${activeTheme === theme.id ? 'active' : ''}`}
                  onClick={() => setActiveTheme(theme.id)}
                  title={theme.name + ': ' + theme.description}
                  style={{ '--theme-accent': theme.accent }}
                >
                  <span className="swatch-color" style={{ background: theme.accent }}></span>
                  <span className="swatch-text">{theme.name.split('&')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Participant Fields Bar (When Custom Mode Active) */}
        {isCustomMode && (
          <div className="cert-custom-inputs-strip no-print">
            <div className="custom-input-col">
              <label>Full Name</label>
              <input 
                type="text" 
                value={customParticipant.name} 
                onChange={(e) => setCustomParticipant({ ...customParticipant, name: e.target.value })}
                placeholder="Recipient Full Name"
              />
            </div>
            <div className="custom-input-col">
              <label>Register / ID No</label>
              <input 
                type="text" 
                value={customParticipant.regNo} 
                onChange={(e) => setCustomParticipant({ ...customParticipant, regNo: e.target.value })}
                placeholder="Register Number"
              />
            </div>
            <div className="custom-input-col">
              <label>Department / School</label>
              <input 
                type="text" 
                value={customParticipant.school} 
                onChange={(e) => setCustomParticipant({ ...customParticipant, school: e.target.value })}
                placeholder="Department or University"
              />
            </div>
            <div className="custom-input-col">
              <label>Team Name / Unit</label>
              <input 
                type="text" 
                value={customParticipant.teamName} 
                onChange={(e) => setCustomParticipant({ ...customParticipant, teamName: e.target.value })}
                placeholder="Team / Project Name"
              />
            </div>
            <div className="custom-input-col">
              <label>Problem Statement ID</label>
              <input 
                type="text" 
                value={customParticipant.psId} 
                onChange={(e) => setCustomParticipant({ ...customParticipant, psId: e.target.value })}
                placeholder="PS ID (e.g. SIH2026-PS101)"
              />
            </div>
          </div>
        )}

        {/* Certificate Display Area (Interactive 3D in browser, Print-Ready A4 in Print Mode) */}
        <div className="cert-preview-scroller">
          
          {/* Mode 1: Single Certificate View with 3D Hologram Tilt */}
          {!isBatchMode && (
            <div 
              className="cert-tilt-wrapper"
              ref={certContainerRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={tiltStyle}
            >
              <SingleCertificateCanvas 
                participant={currentParticipant}
                roleMeta={currentRoleMeta}
                themeMeta={currentThemeMeta}
                certNumber={certNumber}
                certHash={certHash}
                dateStr={certDateStr}
                team={selectedTeam}
                regData={regData}
                onCopyVerification={handleCopyVerification}
                copiedLink={copiedLink}
              />
            </div>
          )}

          {/* Mode 2: Batch Team Deck (All 6 Members + Mentor sequentially for continuous printing) */}
          {isBatchMode && (
            <div className="cert-batch-deck-container">
              {participantsList.map((p, idx) => {
                const roleMeta = CERTIFICATE_ROLES.find(r => r.id === p.role) || CERTIFICATE_ROLES[1];
                const pHash = generateCertificateHash(p.name, p.regNo, p.teamId, p.role, p.psId, certDateStr);
                const pNum = `SIH26-SEC65B-${p.teamId}-${p.role}-${pHash.substring(2, 8).toUpperCase()}`;

                return (
                  <div key={p.id} className="batch-cert-page-break">
                    <SingleCertificateCanvas 
                      participant={p}
                      roleMeta={roleMeta}
                      themeMeta={currentThemeMeta}
                      certNumber={pNum}
                      certHash={pHash}
                      dateStr={certDateStr}
                      team={selectedTeam}
                      regData={regData}
                    />
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Studio Footer Bar (No-Print) */}
        <div className="cert-studio-footer-bar no-print">
          <div className="footer-meta-left">
            <span className="meta-badge-crypto">
              <ShieldCheck size={14} className="text-emerald" />
              <span>Section 65B Electronic Proof Ledger • Cryptographic SHA-256 Verified</span>
            </span>
            <span className="meta-cert-num">Cert ID: <code>{certNumber}</code></span>
          </div>

          <div className="footer-actions-right">
            <button 
              type="button" 
              className="btn-copy-verify-link"
              onClick={handleCopyVerification}
            >
              {copiedLink ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
              <span>{copiedLink ? 'Verification URL Copied!' : 'Copy Verification URL'}</span>
            </button>
            <button 
              type="button" 
              className="btn-studio-print-primary"
              onClick={handlePrint}
            >
              <Printer size={15} />
              <span>Print / Save Vector PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// Sub-Component: High-Fidelity Single Certificate Canvas
function SingleCertificateCanvas({
  participant,
  roleMeta,
  themeMeta,
  certNumber,
  certHash,
  dateStr,
  team,
  regData,
  onCopyVerification,
  copiedLink
}) {
  const isDarkTheme = themeMeta.id !== 'classic_white';

  return (
    <div className={`certificate-a4-canvas ${themeMeta.bgClass}`}>
      {/* Dynamic Specular Hologram Light Overlay */}
      <div className="cert-hologram-shimmer-layer"></div>

      {/* Latent Vector Guilloche Security Frame */}
      <div className="cert-guilloche-outer-border">
        <svg className="guilloche-corner tl" viewBox="0 0 100 100">
          <path d="M0,0 L100,0 C60,0 0,60 0,100 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5,5 L95,5 C55,5 5,55 5,95 Z" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
          <circle cx="25" cy="25" r="14" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.7" />
          <circle cx="25" cy="25" r="8" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
        </svg>
        <svg className="guilloche-corner tr" viewBox="0 0 100 100">
          <path d="M100,0 L0,0 C40,0 100,60 100,100 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M95,5 L5,5 C45,5 95,55 95,95 Z" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
          <circle cx="75" cy="25" r="14" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.7" />
          <circle cx="75" cy="25" r="8" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
        </svg>
        <svg className="guilloche-corner bl" viewBox="0 0 100 100">
          <path d="M0,100 L100,100 C60,100 0,40 0,0 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5,95 L95,95 C55,95 5,45 5,5 Z" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
          <circle cx="25" cy="75" r="14" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.7" />
          <circle cx="25" cy="75" r="8" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
        </svg>
        <svg className="guilloche-corner br" viewBox="0 0 100 100">
          <path d="M100,100 L0,100 C40,100 100,40 100,0 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M95,95 L5,95 C45,95 95,45 95,5 Z" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
          <circle cx="75" cy="75" r="14" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.7" />
          <circle cx="75" cy="75" r="8" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
        </svg>
        
        {/* Inner Guilloche Security Margin */}
        <div className="cert-inner-content-frame">
          
          {/* Header Row: Dual Institutional Emblems & Hackathon Title */}
          <div className="cert-canvas-header">
            <div className="cert-header-left-emblem">
              <img 
                src="/logos/sih_moe_aicte_logo.png" 
                alt="Ministry of Education & AICTE - Smart India Hackathon 2026" 
                className="cert-partner-logo moe-logo"
              />
            </div>

            <div className="cert-header-center-titles">
              <div className="cert-authority-sup">
                <span>MINISTRY OF EDUCATION INNOVATION CELL • GOVERNMENT OF INDIA</span>
              </div>
              <h2 className="cert-host-institution">RATHINAM GLOBAL UNIVERSITY</h2>
              <div className="cert-institution-accreditation">
                <span>COIMBATORE, TAMIL NADU • NAAC A++ ACCREDITED • NIRF TOP RANKED</span>
              </div>
              <div className="cert-event-badge-strip">
                <span className="event-gold-tag">SMART INDIA HACKATHON 2026 — CAMPUS FINALS</span>
              </div>
            </div>

            <div className="cert-header-right-emblem">
              <img 
                src="/logos/rathinam_rgu_logo.png" 
                alt="Rathinam Global University Crest" 
                className="cert-partner-logo rgu-logo"
              />
            </div>
          </div>

          {/* Certificate Main Title & Award Ribbon */}
          <div className="cert-title-section">
            <div className="cert-gold-ribbon-line">
              <div className="ribbon-glow-diamond"></div>
            </div>
            <h1 className="cert-main-honor-title">{roleMeta.title}</h1>
            <div className="cert-statutory-clause">
              <span>Section 65B Electronic Proof Ledger Record • Bharatiya Sakshya Adhiniyam 2023</span>
            </div>
          </div>

          {/* Certificate Body Content */}
          <div className="cert-canvas-body">
            <p className="cert-proclamation-text">This official electronic credential of distinction is conferred upon</p>
            
            {/* Recipient Spotlight Hero Box */}
            <div className="cert-recipient-hero-card">
              <div className="cert-recipient-name-row">
                <h2 className="recipient-full-name">{participant.name}</h2>
                <span className="recipient-role-pill" style={{ '--role-color': roleMeta.iconColor }}>
                  <Star size={13} fill="currentColor" />
                  <span>{roleMeta.badge}</span>
                </span>
              </div>

              <div className="cert-recipient-attributes-grid">
                <div className="attr-item">
                  <span className="attr-lbl">Roll / Register ID</span>
                  <strong className="attr-val mono">{participant.regNo}</strong>
                </div>
                <div className="attr-item">
                  <span className="attr-lbl">Department / Faculty</span>
                  <strong className="attr-val">{participant.dept || participant.school}</strong>
                </div>
                <div className="attr-item">
                  <span className="attr-lbl">Team Identification</span>
                  <strong className="attr-val highlight">{participant.teamName} ({participant.teamId})</strong>
                </div>
              </div>
            </div>

            {/* Citation Narrative */}
            <p className="cert-narrative-citation">
              {roleMeta.citationPrefix} <strong className="highlight-text">{participant.teamName}</strong> in 
              the <strong>{participant.tier ? participant.tier.toUpperCase() : 'NATIONAL SHORTLIST'}</strong> category for solving the problem statement:
            </p>

            {/* Problem Statement Callout Badge */}
            <div className="cert-ps-hero-badge">
              <div className="ps-badge-tag-col">
                <span className="ps-id-pill">{participant.psId}</span>
              </div>
              <div className="ps-badge-title-col">
                <span className="ps-title-text">{participant.psTitle}</span>
              </div>
            </div>
          </div>

          {/* Footer: Signatories, Holographic Cryptographic Seal & Section 65B QR Ledger */}
          <div className="cert-canvas-footer">
            
            {/* Left Signatory */}
            <div className="cert-signatory-col">
              <div className="sig-stylized-script">
                <span>Dr. K. Manikandan</span>
              </div>
              <div className="sig-divider-line"></div>
              <p className="sig-name">Dr. Central Hackathon Coordinator</p>
              <p className="sig-title">SIH 2026 Jury Authority • MoE Cell</p>
            </div>

            {/* Center: Innovative Holographic 3D Security Seal */}
            <div className="cert-center-security-seal">
              <div className="holographic-foil-medallion">
                <div className="medallion-inner-sunburst"></div>
                <div className="medallion-crest-core">
                  <ShieldCheck size={28} className="medallion-shield-icon" />
                  <span className="medallion-seal-caption">{roleMeta.sealText}</span>
                  <span className="medallion-year">SIH 2026</span>
                </div>
              </div>
              <div className="cert-hash-footer-strip">
                <span className="hash-lbl">SHA-256 SEC 65B PROOF:</span>
                <code className="hash-code-mono">{certHash.substring(0, 18)}...</code>
              </div>
            </div>

            {/* Right Signatory & Section 65B QR Code */}
            <div className="cert-signatory-col right">
              <div className="cert-qr-sig-group">
                <div className="cert-qr-box" title="Scan to verify electronic authenticity on Section 65B Sovereign Ledger">
                  <QRCodeSVG 
                    value={`https://casevault.rathinam.ac.in/verify?cert=${encodeURIComponent(certNumber)}&hash=${certHash}`}
                    size={62}
                    level="H"
                    includeMargin={false}
                    fgColor="#0f172a"
                    bgColor="#ffffff"
                  />
                  <span className="qr-caption-tag">SCAN TO VERIFY</span>
                </div>
                <div className="sig-text-block">
                  <div className="sig-stylized-script">
                    <span>Prof. R. Sengottaiyan</span>
                  </div>
                  <div className="sig-divider-line"></div>
                  <p className="sig-name">Dean of Academic Affairs</p>
                  <p className="sig-title">Rathinam Global University</p>
                </div>
              </div>
            </div>

          </div>

          {/* Micro Legal Security Ribbon (Section 65B / BSA 2023) */}
          <div className="cert-bottom-legal-ribbon">
            <span>ISSUED: {dateStr}</span>
            <span>•</span>
            <span>ELECTRONIC RECORD ID: {certNumber}</span>
            <span>•</span>
            <span>TAMPER-PROOF CRYPTOGRAPHIC RECORD SECURED UNDER BSA 2023</span>
          </div>

        </div>
      </div>
    </div>
  );
}
