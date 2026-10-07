import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Printer, Download, Search, Award, Sparkles, CheckCircle2, 
  User, Crown, RefreshCw, ArrowLeft, ShieldCheck, Star
} from 'lucide-react';
import { MASTER_TEAMS } from '../data/sihMasterData.js';
import { supabase } from '../supabaseClient.js';

export default function CertificatePortal({ onBackToLanding }) {
  const [selectedTeamName, setSelectedTeamName] = useState('Monarchs');
  const [searchQuery, setSearchQuery] = useState('');
  const [certificateType, setCertificateType] = useState('Certificate of Appreciation');
  const [dbRegistrations, setDbRegistrations] = useState([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  // Fetch full registrations from Supabase to get complete member rosters
  useEffect(() => {
    async function loadRegistrations() {
      setIsLoadingDb(true);
      try {
        const { data, error } = await supabase
          .from('registrations')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (!error && data) {
          setDbRegistrations(data);
        }
      } catch (err) {
        console.error('Error fetching registered rosters:', err);
      } finally {
        setIsLoadingDb(false);
      }
    }
    loadRegistrations();
  }, []);

  // Map unique master teams with registered member details
  const enrichedTeams = useMemo(() => {
    const seenNames = new Set();
    const uniqueTeams = [];

    for (const team of MASTER_TEAMS) {
      if (!team || !team.team_name) continue;
      const normalizedName = team.team_name.trim().toLowerCase();
      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        uniqueTeams.push(team);
      }
    }

    return uniqueTeams.map(team => {
      const regMatch = dbRegistrations.find(r => 
        (r.team_name && team.team_name && r.team_name.trim().toLowerCase() === team.team_name.trim().toLowerCase()) ||
        r.temp_team_id === team.temp_team_id
      );

      let leaderName = team.leader_name;
      let leaderRegNo = team.reg_no;
      let members = [];

      if (regMatch) {
        leaderName = regMatch.leader_name || team.leader_name;
        leaderRegNo = regMatch.leader_reg_no || team.reg_no;
        if (Array.isArray(regMatch.members) && regMatch.members.length > 0) {
          members = regMatch.members.map((m, idx) => ({
            id: m.id || idx + 2,
            name: m.name || `Member ${idx + 2}`,
            reg_no: m.reg_no || '',
            dept: m.dept || ''
          }));
        }
      }

      // If no members registered yet, provide default fallback structure
      if (members.length === 0) {
        members = [
          { id: 2, name: 'Team Member 2', reg_no: 'Pending Reg' },
          { id: 3, name: 'Team Member 3', reg_no: 'Pending Reg' },
          { id: 4, name: 'Team Member 4', reg_no: 'Pending Reg' },
          { id: 5, name: 'Team Member 5', reg_no: 'Pending Reg' },
          { id: 6, name: 'Team Member 6', reg_no: 'Pending Reg' },
        ];
      }

      return {
        ...team,
        leader_name: leaderName,
        leader_reg_no: leaderRegNo,
        members_roster: members,
        hasLiveRoster: Boolean(regMatch && regMatch.members?.length > 0)
      };
    });
  }, [dbRegistrations]);

  // Filtered teams list for search
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return enrichedTeams;
    const q = searchQuery.toLowerCase().trim();
    return enrichedTeams.filter(t => 
      t.team_name.toLowerCase().includes(q) ||
      t.leader_name.toLowerCase().includes(q) ||
      (t.leader_reg_no && t.leader_reg_no.toLowerCase().includes(q))
    );
  }, [enrichedTeams, searchQuery]);

  // Selected team object
  const activeTeam = useMemo(() => {
    return enrichedTeams.find(t => t.team_name.trim().toLowerCase() === selectedTeamName.trim().toLowerCase()) || enrichedTeams[0];
  }, [enrichedTeams, selectedTeamName]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="certificate-studio-root">
      {/* Studio Header & Controls (Hidden during print) */}
      <div className="studio-topbar no-print">
        <div className="studio-topbar-inner">
          <div className="studio-brand">
            <button className="btn-studio-back" onClick={onBackToLanding}>
              <ArrowLeft size={16} />
              <span>Back to Portal</span>
            </button>
            <div className="studio-title-block">
              <div className="studio-badge">
                <Award size={14} className="text-amber" />
                <span>SIH 2026 Executive Studio</span>
              </div>
              <h1 className="studio-title">Institutional Certificate Generator</h1>
            </div>
          </div>

          <div className="studio-actions">
            <div className="studio-type-selector">
              <label>Certificate Title:</label>
              <select 
                value={certificateType} 
                onChange={(e) => setCertificateType(e.target.value)}
                className="select-cert-type"
              >
                <option value="Certificate of Appreciation">Certificate of Appreciation</option>
                <option value="Certificate of Shortlist & Nominee">Certificate of Shortlist</option>
                <option value="Certificate of Excellence & Merit">Certificate of Excellence</option>
                <option value="Certificate of Participation">Certificate of Participation</option>
              </select>
            </div>

            <button className="btn-studio-print" onClick={handlePrint}>
              <Printer size={16} />
              <span>Print / Export PDF (A4 Landscape)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="studio-layout-container">
        {/* Left Control Sidebar (Hidden during print) */}
        <aside className="studio-sidebar no-print">
          <div className="sidebar-search-box">
            <Search size={16} className="text-muted" />
            <input 
              type="text"
              placeholder="Search team or leader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="studio-search-input"
            />
          </div>

          <div className="sidebar-meta-counter">
            <span>Showing <strong>{filteredTeams.length}</strong> Teams</span>
            {isLoadingDb && <span className="text-amber sync-pulse"><RefreshCw size={12} className="spin" /> Syncing DB...</span>}
          </div>

          <div className="sidebar-teams-list">
            {filteredTeams.map((team, idx) => {
              const isSelected = team.team_name.trim().toLowerCase() === activeTeam?.team_name.trim().toLowerCase();
              return (
                <div 
                  key={`${team.team_name}-${idx}`}
                  className={`team-item-card ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedTeamName(team.team_name)}
                >
                  <div className="team-item-header">
                    <span className="team-item-status status-shortlist">
                      {team.status || 'Finalist'}
                    </span>
                  </div>
                  <div className="team-item-name">{team.team_name}</div>
                  <div className="team-item-leader">
                    <User size={13} className="text-muted" />
                    <span>{team.leader_name}</span>
                  </div>
                  {team.hasLiveRoster && (
                    <div className="team-item-roster-tag">
                      <CheckCircle2 size={11} className="text-emerald" />
                      <span>Live 6-Member Roster Verified</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Certificate Viewport */}
        <main className="certificate-viewport">
          {activeTeam && (
            <div className="certificate-sheet-wrapper">
              <PreviousGuillocheCertificateCanvas 
                team={activeTeam} 
                certificateType={certificateType}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Previous Classic Guilloche Security Certificate Canvas (Without Team ID, Minimized Content, Special Leader)
function PreviousGuillocheCertificateCanvas({ team, certificateType }) {
  if (!team) return null;

  const verificationUrl = `https://rgu-sih.web.app/#verify?team=${encodeURIComponent(team.team_name)}`;
  const certNumber = `SIH26-CRT-${Math.abs(team.team_name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 1000))}`;

  return (
    <div className="certificate-a4-canvas theme-classic-white" id="print-certificate-target">
      {/* Outer Security Border with Double Gold/Navy Frame */}
      <div className="cert-outer-security-border">
        
        {/* Mathematical Guilloche Security Corners */}
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
        
        {/* Inner Guilloche Security Margin Frame */}
        <div className="cert-inner-content-frame">
          
          {/* 1. Header Row: Dual Institutional Emblems & Hackathon Title */}
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
                <span className="event-gold-tag">SMART INDIA HACKATHON 2026 — INTERNAL HACKATHON</span>
              </div>
            </div>

            <div className="cert-header-right-emblem">
              <img 
                src="/logos/rgu_naac_logo.png" 
                alt="Rathinam Global University Crest" 
                className="cert-partner-logo rgu-logo"
              />
            </div>
          </div>

          {/* 2. Certificate Title Section */}
          <div className="cert-title-section">
            <div className="cert-gold-ribbon-line">
              <div className="ribbon-glow-diamond"></div>
            </div>
            <h1 className="cert-main-honor-title">{certificateType}</h1>
            <div className="cert-statutory-clause">
              <span>Section 65B Electronic Proof Ledger Record • Bharatiya Sakshya Adhiniyam 2023</span>
            </div>
          </div>

          {/* 3. Minimized Body Content (NO Team ID) */}
          <div className="cert-canvas-body">
            <p className="cert-proclamation-text">This official credential of distinction is proudly conferred upon</p>
            
            {/* Team Showcase */}
            <div className="cert-team-showcase-title">
              <span className="team-prefix-gold">TEAM</span>
              <h2 className="team-name-bold">{team.team_name}</h2>
            </div>

            {/* Special Team Leader & Members Roster Box */}
            <div className="cert-roster-box-clean">
              {/* Leader Special Highlight */}
              <div className="cert-leader-pill-gold">
                <Crown size={15} className="crown-icon-gold" />
                <span className="leader-title-tag">👑 TEAM LEADER:</span>
                <span className="leader-name-tag">{team.leader_name}</span>
                {team.leader_reg_no && (
                  <span className="leader-reg-tag">({team.leader_reg_no})</span>
                )}
              </div>

              {/* Members Grid */}
              <div className="cert-members-pills-row">
                {team.members_roster?.map((m, idx) => (
                  <div key={m.id || idx} className="member-pill-chip">
                    <span className="m-num">{idx + 1}.</span>
                    <span className="m-name">{m.name}</span>
                    {m.reg_no && <span className="m-reg">({m.reg_no})</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Concise Recognition Citation */}
            <p className="cert-narrative-citation">
              In recognition of their commendable innovation, technical excellence, and active participation in the Smart India Hackathon 2026 Internal Evaluation Round.
            </p>
          </div>

          {/* 4. Footer: Signatories, Holographic Cryptographic Seal & Verification QR */}
          <div className="cert-canvas-footer">
            
            {/* 1st Signature: Registrar */}
            <div className="cert-signatory-col">
              <div className="sig-img-box">
                <img 
                  src="/logos/registrar_sign.png" 
                  alt="Registrar Sign" 
                  className="sig-img-canvas"
                />
              </div>
              <div className="sig-divider-line"></div>
              <p className="sig-name">Registrar</p>
              <p className="sig-title">Rathinam Global University</p>
            </div>

            {/* Center: Holographic Security Seal */}
            <div className="cert-center-security-seal">
              <div className="holographic-foil-medallion">
                <div className="medallion-crest-core">
                  <ShieldCheck size={26} className="medallion-shield-icon" />
                  <span className="medallion-seal-caption">OFFICIAL VERIFIED</span>
                  <span className="medallion-year">SIH 2026</span>
                </div>
              </div>
              <div className="cert-hash-footer-strip">
                <span className="hash-lbl">RECORD ID:</span>
                <code className="hash-code-mono">{certNumber}</code>
              </div>
            </div>

            {/* 2nd Signature: SPOC & QR Code */}
            <div className="cert-signatory-col right">
              <div className="cert-qr-sig-group">
                <div className="cert-qr-box" title="Scan to verify electronic authenticity">
                  <QRCodeSVG 
                    value={verificationUrl}
                    size={52}
                    level="M"
                    fgColor="#0f172a"
                    bgColor="#ffffff"
                  />
                  <span className="qr-caption-tag">SCAN TO VERIFY</span>
                </div>
                <div className="sig-text-block">
                  <div className="sig-img-box right-align">
                    <img 
                      src="/logos/spoc_sign.png" 
                      alt="SPOC Sign" 
                      className="sig-img-canvas"
                    />
                  </div>
                  <div className="sig-divider-line"></div>
                  <p className="sig-name">Single Point of Contact (SPOC)</p>
                  <p className="sig-title">Smart India Hackathon 2026, RGU</p>
                </div>
              </div>
            </div>

          </div>

          {/* Micro Legal Security Ribbon */}
          <div className="cert-bottom-legal-ribbon">
            <span>ISSUED: OCTOBER 2026</span>
            <span>•</span>
            <span>RATHINAM GLOBAL UNIVERSITY • SMART INDIA HACKATHON 2026</span>
            <span>•</span>
            <span>TAMPER-PROOF ELECTRONIC CREDENTIAL</span>
          </div>

        </div>
      </div>
    </div>
  );
}
