import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Printer, Download, Search, Award, Sparkles, CheckCircle2, 
  User, Crown, RefreshCw, ArrowLeft, ShieldCheck, Star, Ribbon
} from 'lucide-react';
import { MASTER_TEAMS } from '../data/sihMasterData.js';
import { supabase } from '../supabaseClient.js';

export default function CertificatePortal({ onBackToLanding }) {
  const [selectedTeamName, setSelectedTeamName] = useState('Monarchs');
  const [searchQuery, setSearchQuery] = useState('');
  const [certificateTitle, setCertificateTitle] = useState('CERTIFICATE OF EXCELLENCE');
  const [awardRibbonText, setAwardRibbonText] = useState('NATIONAL INNOVATION EXCELLENCE AWARD');
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
              <h1 className="studio-title">Official Certificate Generator</h1>
            </div>
          </div>

          <div className="studio-actions">
            <div className="studio-type-selector">
              <label>Title:</label>
              <select 
                value={certificateTitle} 
                onChange={(e) => {
                  setCertificateTitle(e.target.value);
                  if (e.target.value.includes('EXCELLENCE')) setAwardRibbonText('NATIONAL INNOVATION EXCELLENCE AWARD');
                  else if (e.target.value.includes('APPRECIATION')) setAwardRibbonText('INNOVATION APPRECIATION AWARD');
                  else if (e.target.value.includes('PARTICIPATION')) setAwardRibbonText('HACKATHON PARTICIPATION HONOUR');
                  else setAwardRibbonText('CAMPUS FINALIST AWARD');
                }}
                className="select-cert-type"
              >
                <option value="CERTIFICATE OF EXCELLENCE">CERTIFICATE OF EXCELLENCE</option>
                <option value="CERTIFICATE OF APPRECIATION">CERTIFICATE OF APPRECIATION</option>
                <option value="CERTIFICATE OF SHORTLIST">CERTIFICATE OF SHORTLIST</option>
                <option value="CERTIFICATE OF PARTICIPATION">CERTIFICATE OF PARTICIPATION</option>
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
              <ExactOfficialCertificateCanvas 
                team={activeTeam} 
                certificateTitle={certificateTitle}
                awardRibbonText={awardRibbonText}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// EXACT Certificate Canvas mirroring the user's reference design
function ExactOfficialCertificateCanvas({ team, certificateTitle, awardRibbonText }) {
  if (!team) return null;

  const domainText = team.domain || 'Smart Education, EdTech & Skill Development';
  const psTitleText = team.ps_title || 'A resilient, AI-powered system enabling proactive risk mitigation and technical innovation.';
  const schoolText = team.school || 'School of Quantum Science, Computing & AI';

  return (
    <div className="exact-certificate-canvas-root" id="print-certificate-target">
      {/* Outer Stepped Frame with Double Borders & Corner Notches */}
      <div className="exact-cert-outer-box">
        <div className="exact-cert-inner-box">
          
          {/* Top Corner Notches */}
          <div className="exact-corner-bracket tl"></div>
          <div className="exact-corner-bracket tr"></div>
          <div className="exact-corner-bracket bl"></div>
          <div className="exact-corner-bracket br"></div>

          {/* 1. Header Dual Brand Logos Bar */}
          <div className="exact-cert-header-row">
            {/* Left: MoE + AICTE + Innovation Cell + SIH 2026 */}
            <div className="exact-logo-left-group">
              <img 
                src="/logos/sih_moe_aicte_logo.png" 
                alt="Ministry of Education, AICTE, MoE Innovation Cell, Smart India Hackathon 2026" 
                className="exact-img-moe-sih"
              />
            </div>

            {/* Right: Rathinam + RGU + NAAC Grade A++ + 1st in TN */}
            <div className="exact-logo-right-group">
              <img 
                src="/logos/rgu_naac_logo.png" 
                alt="RGU Rathinam Global University - NAAC Grade A++ Accredited - 1st in Tamil Nadu" 
                className="exact-img-rgu-naac"
              />
            </div>
          </div>

          {/* 2. Main Event Title & Sub-Ribbon */}
          <div className="exact-cert-titles-block">
            <h1 className="exact-main-sih-title">SMART INDIA HACKATHON 2026</h1>
            
            <div className="exact-sub-ribbon-row">
              <div className="exact-ribbon-line-left"></div>
              <span className="exact-ribbon-tag-text">
                ✦ PIONEERING TECHNICAL INGENUITY &bull; SHAPING THE FUTURE OF INNOVATION ✦
              </span>
              <div className="exact-ribbon-line-right"></div>
            </div>

            <h2 className="exact-cert-honor-heading">{certificateTitle}</h2>
          </div>

          {/* 3. Conferral Intro */}
          <div className="exact-conferral-intro">
            This prestigious national honour is proudly conferred upon
          </div>

          {/* 4. Large Calligraphy Recipient Name */}
          <div className="exact-recipient-calligraphy-wrap">
            <span className="exact-calligraphy-name">{team.leader_name}</span>
          </div>

          {/* 5. Award Ribbon Pill */}
          <div className="exact-award-ribbon-wrap">
            <div className="exact-award-ribbon-pill">
              <span className="ribbon-icon">🎗</span>
              <span className="ribbon-text">{awardRibbonText}</span>
            </div>
          </div>

          {/* 6. Body Paragraph Box */}
          <div className="exact-body-boxed-card">
            <p className="exact-citation-p1">
              In formal recognition of pioneering technical innovation and outstanding national contribution representing <strong>Team {team.team_name}</strong> from <strong>Rathinam Global University</strong> • <strong>{schoolText}</strong> under the <strong>{domainText}</strong> theme for "{psTitleText}".
            </p>
            <p className="exact-citation-p2">
              Honoured as <strong>Team Leader &amp; Lead Architect</strong>: "Demonstrated exemplary leadership, strategic technical direction, and end-to-end sprint orchestration, steering the squad to deliver a breakthrough national solution under extreme competition."
            </p>
            {team.members_roster && team.members_roster.length > 0 && (
              <div className="exact-members-compact-strip">
                <span className="members-strip-label">Team Squad:</span>
                {team.members_roster.map((m, idx) => (
                  <span key={m.id || idx} className="member-compact-item">
                    {m.name}{m.reg_no && ` (${m.reg_no})`}{idx < team.members_roster.length - 1 ? ' • ' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 7. Signatures Row & Center Official RGU Emblem */}
          <div className="exact-signatures-bottom-row">
            
            {/* Left Signatory: Dr. S Manikandan (SPOC) */}
            <div className="exact-sign-col left">
              <div className="exact-sig-script-box">
                <img 
                  src="/logos/spoc_sign.png" 
                  alt="S. Manikandan Signature" 
                  className="exact-sig-image"
                />
              </div>
              <div className="exact-sig-underline"></div>
              <div className="exact-sig-person-name">Dr. S Manikandan</div>
              <div className="exact-sig-person-desig">SPOC &amp; Dean, School of Quantum Science, Computing &amp; AI</div>
            </div>

            {/* Center Official Emblem Seal */}
            <div className="exact-center-emblem-col">
              <div className="exact-emblem-seal-shield">
                <div className="exact-shield-inner">
                  <span className="emblem-brand-text">RGU</span>
                  <div className="emblem-sih-tag">SMART INDIA HACKATHON 2026</div>
                  <ShieldCheck size={20} className="emblem-check-icon" />
                </div>
              </div>
            </div>

            {/* Right Signatory: Dr. C Krishnaraj (Registrar) */}
            <div className="exact-sign-col right">
              <div className="exact-sig-script-box">
                <img 
                  src="/logos/registrar_sign.png" 
                  alt="C. Krishnaraj Signature" 
                  className="exact-sig-image"
                />
              </div>
              <div className="exact-sig-underline"></div>
              <div className="exact-sig-person-name">Dr. C Krishnaraj</div>
              <div className="exact-sig-person-desig">Registrar, Rathinam Global University (RGU)</div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
