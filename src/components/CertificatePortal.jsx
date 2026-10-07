import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Printer, Download, Search, Award, Sparkles, CheckCircle2, 
  User, Crown, RefreshCw, ArrowLeft
} from 'lucide-react';
import { MASTER_TEAMS } from '../data/sihMasterData.js';
import { supabase } from '../supabaseClient.js';

export default function CertificatePortal({ onBackToLanding }) {
  const [selectedTeamId, setSelectedTeamId] = useState('SIH26-TM-175'); // Default Monarchs
  const [searchQuery, setSearchQuery] = useState('');
  const [certificateType, setCertificateType] = useState('Certificate of Appreciation');
  const [dbRegistrations, setDbRegistrations] = useState([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [customSubtitle, setCustomSubtitle] = useState('Smart India Hackathon 2026 — Internal Hackathon');

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
    const seenIds = new Set();
    const uniqueTeams = [];

    for (const team of MASTER_TEAMS) {
      if (!team || !team.temp_team_id) continue;
      if (!seenIds.has(team.temp_team_id)) {
        seenIds.add(team.temp_team_id);
        uniqueTeams.push(team);
      }
    }

    return uniqueTeams.map(team => {
      const regMatch = dbRegistrations.find(r => 
        r.temp_team_id === team.temp_team_id || 
        (r.team_name && team.team_name && r.team_name.trim().toLowerCase() === team.team_name.trim().toLowerCase())
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
      t.temp_team_id.toLowerCase().includes(q) ||
      t.leader_name.toLowerCase().includes(q) ||
      (t.leader_reg_no && t.leader_reg_no.toLowerCase().includes(q))
    );
  }, [enrichedTeams, searchQuery]);

  // Selected team object
  const activeTeam = useMemo(() => {
    return enrichedTeams.find(t => t.temp_team_id === selectedTeamId) || enrichedTeams[0];
  }, [enrichedTeams, selectedTeamId]);

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
              const isSelected = team.temp_team_id === activeTeam?.temp_team_id;
              return (
                <div 
                  key={`${team.temp_team_id}-${idx}`}
                  className={`team-item-card ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedTeamId(team.temp_team_id)}
                >
                  <div className="team-item-header">
                    <span className="team-item-id">{team.temp_team_id}</span>
                    <span className={`team-item-status status-${team.status?.toLowerCase()}`}>
                      {team.status}
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
              <SingleCertificateCanvas 
                team={activeTeam} 
                certificateType={certificateType}
                subtitle={customSubtitle}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Minimal, Pristine, and High-Resolution Single Certificate Canvas
function SingleCertificateCanvas({ team, certificateType, subtitle }) {
  const certId = `SIH26-CRT-${team.temp_team_id.replace('SIH26-TM-', '')}`;
  const verificationUrl = `https://rgu-sih.web.app/#verify?id=${team.temp_team_id}`;

  return (
    <div className="official-certificate-canvas" id="print-certificate-target">
      {/* Outer Executive Border with Corner Geometrics */}
      <div className="cert-outer-border">
        <div className="cert-inner-frame">
          
          {/* Subtle Corner Ornaments */}
          <div className="corner-ornament top-left"></div>
          <div className="corner-ornament top-right"></div>
          <div className="corner-ornament bottom-left"></div>
          <div className="corner-ornament bottom-right"></div>

          {/* 1. Header Dual Brand Logos */}
          <div className="cert-header-row">
            <div className="cert-brand-rgu">
              <img 
                src="/logos/rgu_naac_logo.png" 
                alt="Rathinam Global University - NAAC Grade A++ Accredited" 
                className="cert-img-rgu"
              />
            </div>

            <div className="cert-brand-sih">
              <img 
                src="/logos/sih_moe_aicte_logo.png" 
                alt="Ministry of Education, AICTE, MoE Innovation Cell, Smart India Hackathon 2026" 
                className="cert-img-sih"
              />
            </div>
          </div>

          {/* 2. Certificate Title & Badge */}
          <div className="cert-title-section">
            <div className="cert-gold-ribbon">
              <Sparkles size={12} className="sparkle-icon" />
              <span>INTERNAL HACKATHON EVALUATION ROUND</span>
              <Sparkles size={12} className="sparkle-icon" />
            </div>
            
            <h1 className="cert-main-title">{certificateType}</h1>
            <p className="cert-subtitle">{subtitle}</p>
          </div>

          {/* 3. Minimized Core Body Statement */}
          <div className="cert-presentation-text">
            This is proudly awarded to the following team in recognition of their active participation, exemplary innovation, and high technical merit.
          </div>

          {/* 4. Team Name Showcase */}
          <div className="cert-team-banner">
            <span className="team-label-prefix">TEAM</span>
            <span className="team-display-name">{team.team_name}</span>
            <span className="team-id-badge">{team.temp_team_id}</span>
          </div>

          {/* 5. Special Team Leader & Members Roster (Clean Minimalist Layout) */}
          <div className="cert-roster-container">
            {/* Special Distinction for Team Leader */}
            <div className="leader-special-badge">
              <div className="leader-badge-pill">
                <Crown size={15} className="crown-icon" />
                <span className="leader-pill-label">TEAM LEADER:</span>
                <span className="leader-pill-name">{team.leader_name}</span>
                {team.leader_reg_no && (
                  <span className="leader-pill-reg">({team.leader_reg_no})</span>
                )}
              </div>
            </div>

            {/* Team Members Grid */}
            <div className="members-minimal-grid">
              {team.members_roster?.map((member, idx) => (
                <div key={member.id || idx} className="member-item-chip">
                  <span className="member-index">{idx + 1}.</span>
                  <span className="member-name">{member.name}</span>
                  {member.reg_no && (
                    <span className="member-reg">({member.reg_no})</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 6. Signatures Row (1st: Registrar, Center: Digital Verification, 2nd: SPOC) */}
          <div className="cert-signatures-row">
            {/* 1st Signature: Registrar */}
            <div className="sign-column sign-registrar">
              <div className="signature-img-wrap">
                <img 
                  src="/logos/registrar_sign.png" 
                  alt="Registrar Signature" 
                  className="sig-img registrar-sig"
                />
              </div>
              <div className="sign-rule"></div>
              <div className="sign-title">Registrar</div>
              <div className="sign-organization">Rathinam Global University</div>
            </div>

            {/* Center: Verification Seal & QR Code */}
            <div className="sign-column sign-verification">
              <div className="cert-qr-wrap">
                <QRCodeSVG 
                  value={verificationUrl} 
                  size={50} 
                  level="M" 
                  fgColor="#0f172a"
                  bgColor="#ffffff"
                />
              </div>
              <div className="cert-id-text">{certId}</div>
              <div className="cert-seal-text">Official Digital Authenticity</div>
            </div>

            {/* 2nd Signature: SPOC */}
            <div className="sign-column sign-spoc">
              <div className="signature-img-wrap">
                <img 
                  src="/logos/spoc_sign.png" 
                  alt="SPOC Signature" 
                  className="sig-img spoc-sig"
                />
              </div>
              <div className="sign-rule"></div>
              <div className="sign-title">Single Point of Contact (SPOC)</div>
              <div className="sign-organization">Smart India Hackathon 2026, RGU</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
