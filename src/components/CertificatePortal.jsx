import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Printer, Download, Search, Award, Sparkles, CheckCircle2, 
  User, Crown, RefreshCw, ArrowLeft, ShieldCheck, Star, FileText, Image as ImageIcon, Loader2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { MASTER_TEAMS } from '../data/sihMasterData.js';
import { supabase } from '../supabaseClient.js';

export default function CertificatePortal({ onBackToLanding }) {
  const [selectedTeamName, setSelectedTeamName] = useState('Monarchs');
  const [searchQuery, setSearchQuery] = useState('');
  const [certificateTitle, setCertificateTitle] = useState('CERTIFICATE OF APPRECIATION');
  const [awardRibbonText, setAwardRibbonText] = useState('INTERNAL HACKATHON FINALIST');
  const [dbRegistrations, setDbRegistrations] = useState([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [selectedRecipientIdx, setSelectedRecipientIdx] = useState(0);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

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

  // List of all recipients for active team (Leader + 5 Members)
  const recipientsList = useMemo(() => {
    if (!activeTeam) return [];
    
    const list = [
      {
        id: 'leader',
        name: activeTeam.leader_name,
        reg_no: activeTeam.leader_reg_no,
        role: 'Team Leader',
        isLeader: true,
        dept: activeTeam.department || ''
      }
    ];

    if (Array.isArray(activeTeam.members_roster)) {
      activeTeam.members_roster.forEach((m, idx) => {
        list.push({
          id: `member-${m.id || idx + 2}`,
          name: m.name,
          reg_no: m.reg_no,
          role: 'Team Member',
          isLeader: false,
          dept: m.dept || ''
        });
      });
    }

    return list;
  }, [activeTeam]);

  // Reset selected recipient index if out of bounds
  useEffect(() => {
    if (selectedRecipientIdx >= recipientsList.length) {
      setSelectedRecipientIdx(0);
    }
  }, [selectedTeamName, recipientsList.length, selectedRecipientIdx]);

  // Direct PDF Export (Single or Multi-Page Batch)
  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportMessage(isBatchMode ? 'Generating Multi-Page PDF (All 6 Members)...' : 'Generating High-Res A4 PDF...');
    
    try {
      if (isBatchMode) {
        // Multi-page batch export
        const elements = document.querySelectorAll('.batch-certificate-page-item .exact-certificate-canvas-root');
        if (!elements || elements.length === 0) throw new Error('No certificates found for batch export');

        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        for (let i = 0; i < elements.length; i++) {
          setExportMessage(`Rendering page ${i + 1} of ${elements.length}...`);
          const canvas = await html2canvas(elements[i], {
            scale: 2.2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.98);
          if (i > 0) pdf.addPage('a4', 'landscape');
          pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
        }

        const safeTeam = activeTeam.team_name.replace(/[^a-zA-Z0-9_-]/g, '_');
        pdf.save(`SIH2026_AllCertificates_Team_${safeTeam}.pdf`);
        setExportMessage('Batch PDF Downloaded!');
      } else {
        // Single certificate export
        const targetElement = document.getElementById('print-certificate-target');
        if (!targetElement) throw new Error('Certificate element not found');

        const canvas = await html2canvas(targetElement, {
          scale: 2.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);

        const currentRecipient = recipientsList[selectedRecipientIdx] || recipientsList[0];
        const safeName = (currentRecipient?.name || activeTeam.team_name).replace(/[^a-zA-Z0-9_-]/g, '_');
        pdf.save(`SIH2026_Certificate_${safeName}.pdf`);
        setExportMessage('PDF Downloaded!');
      }
    } catch (err) {
      console.error('PDF Export Error:', err);
      window.print();
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMessage(''), 2500);
    }
  };

  // Direct High-Res PNG Image Export
  const handleExportPNG = async () => {
    setIsExporting(true);
    setExportMessage('Generating HD PNG Image (300 DPI)...');
    try {
      const targetElement = document.getElementById('print-certificate-target');
      if (!targetElement) throw new Error('Certificate element not found');

      const canvas = await html2canvas(targetElement, {
        scale: 3.0,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const currentRecipient = recipientsList[selectedRecipientIdx] || recipientsList[0];
      const safeName = (currentRecipient?.name || activeTeam.team_name).replace(/[^a-zA-Z0-9_-]/g, '_');
      
      const link = document.createElement('a');
      link.download = `SIH2026_Certificate_${safeName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setExportMessage('PNG Downloaded!');
    } catch (err) {
      console.error('PNG Export Error:', err);
      alert('Could not export PNG image. Please use PDF or Print option.');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMessage(''), 2500);
    }
  };

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
                <span>SIH 2026 Internal Hackathon Studio</span>
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
                  if (e.target.value.includes('EXCELLENCE')) setAwardRibbonText('INTERNAL HACKATHON WINNER');
                  else if (e.target.value.includes('APPRECIATION')) setAwardRibbonText('INTERNAL HACKATHON FINALIST');
                  else if (e.target.value.includes('PARTICIPATION')) setAwardRibbonText('HACKATHON PARTICIPATION HONOUR');
                  else setAwardRibbonText('CAMPUS SHORTLIST AWARD');
                }}
                className="select-cert-type"
              >
                <option value="CERTIFICATE OF APPRECIATION">CERTIFICATE OF APPRECIATION</option>
                <option value="CERTIFICATE OF EXCELLENCE">CERTIFICATE OF EXCELLENCE</option>
                <option value="CERTIFICATE OF SHORTLIST">CERTIFICATE OF SHORTLIST</option>
                <option value="CERTIFICATE OF PARTICIPATION">CERTIFICATE OF PARTICIPATION</option>
              </select>
            </div>

            {/* Direct Export & Print Action Buttons */}
            <div className="studio-action-buttons-group">
              <button 
                className="btn-studio-export-pdf" 
                onClick={handleExportPDF} 
                disabled={isExporting}
                title="Direct PDF Download"
              >
                {isExporting ? <Loader2 size={16} className="spin" /> : <FileText size={16} />}
                <span>{isBatchMode ? 'Download Batch PDF (All 6)' : 'Download PDF'}</span>
              </button>

              <button 
                className="btn-studio-export-png" 
                onClick={handleExportPNG} 
                disabled={isExporting || isBatchMode}
                title="Direct High-Res PNG Image Download"
              >
                <ImageIcon size={16} />
                <span>Download PNG</span>
              </button>

              <button 
                className="btn-studio-print" 
                onClick={handlePrint}
                disabled={isExporting}
                title="Browser System Print Dialog"
              >
                <Printer size={16} />
                <span>Print Dialog</span>
              </button>
            </div>
          </div>
        </div>

        {exportMessage && (
          <div className="export-status-toast">
            <Sparkles size={14} className="text-amber" />
            <span>{exportMessage}</span>
          </div>
        )}
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
                  onClick={() => {
                    setSelectedTeamName(team.team_name);
                    setSelectedRecipientIdx(0);
                  }}
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
              
              {/* Recipient Member Selector Toolbar */}
              <div className="recipient-selector-toolbar no-print">
                <div className="recipient-selector-header">
                  <div className="recipient-title-tag">
                    <Sparkles size={14} className="text-amber" />
                    <span>Select Certificate Recipient ({recipientsList.length} Members)</span>
                  </div>
                  
                  <button 
                    className={`btn-batch-toggle ${isBatchMode ? 'active' : ''}`}
                    onClick={() => setIsBatchMode(!isBatchMode)}
                  >
                    <Printer size={14} />
                    <span>{isBatchMode ? 'Viewing All 6 Certificates (Batch)' : 'Batch Mode: Print All 6 Members'}</span>
                  </button>
                </div>

                <div className="recipient-pills-row">
                  {recipientsList.map((rec, idx) => {
                    const isSelected = selectedRecipientIdx === idx && !isBatchMode;
                    return (
                      <button
                        key={rec.id}
                        className={`recipient-pill-btn ${isSelected ? 'active' : ''} ${rec.isLeader ? 'is-leader' : ''}`}
                        onClick={() => {
                          setSelectedRecipientIdx(idx);
                          setIsBatchMode(false);
                        }}
                      >
                        {rec.isLeader ? <Crown size={14} className="pill-crown" /> : <User size={14} className="pill-user" />}
                        <div className="pill-text-col">
                          <span className="pill-name">{rec.name}</span>
                          <span className="pill-role">{rec.role}</span>
                        </div>
                        {isSelected && <CheckCircle2 size={13} className="pill-check" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Certificate Canvas: Single or Batch */}
              {isBatchMode ? (
                <div className="batch-certificates-list">
                  {recipientsList.map((rec) => (
                    <div key={rec.id} className="batch-certificate-page-item">
                      <ExactOfficialCertificateCanvas 
                        team={activeTeam} 
                        recipient={rec}
                        certificateTitle={certificateTitle}
                        awardRibbonText={awardRibbonText}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <ExactOfficialCertificateCanvas 
                  team={activeTeam} 
                  recipient={recipientsList[selectedRecipientIdx] || recipientsList[0]}
                  certificateTitle={certificateTitle}
                  awardRibbonText={awardRibbonText}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Ornate Royal Gold Filigree Corner Ornament (Sharp Right-Angle Stepped Corner)
function GoldCornerFlourish({ position }) {
  return (
    <div className={`exact-gold-corner ${position}`}>
      <svg viewBox="0 0 80 80" className="gold-flourish-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`goldGrad-${position}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d4af37" />
            <stop offset="28%" stopColor="#fff4c2" />
            <stop offset="50%" stopColor="#c59b27" />
            <stop offset="78%" stopColor="#fdf6c7" />
            <stop offset="100%" stopColor="#996515" />
          </linearGradient>
        </defs>
        {/* Sharp right-angle geometric outer corner */}
        <path d="M4 64 V4 H64" stroke={`url(#goldGrad-${position})`} strokeWidth="3.5" strokeLinecap="square" strokeLinejoin="miter" />
        <path d="M10 52 V10 H52" stroke={`url(#goldGrad-${position})`} strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" />
        
        {/* Inner filigree scroll work */}
        <path d="M12 12 Q30 12 34 26 Q38 40 52 42 Q36 44 24 34 Q12 26 12 12 Z" fill={`url(#goldGrad-${position})`} fillOpacity="0.3" stroke={`url(#goldGrad-${position})`} strokeWidth="0.8" />
        <path d="M20 20 C28 14 36 18 42 24 C34 28 26 26 20 20 Z" fill={`url(#goldGrad-${position})`} fillOpacity="0.6" />
        
        {/* Sharp corner diamond / square jewel */}
        <rect x="7" y="7" width="6" height="6" transform="rotate(45 10 10)" fill={`url(#goldGrad-${position})`} />
        
        {/* Finial sharp square / diamond accents */}
        <rect x="62" y="2" width="4" height="4" transform="rotate(45 64 4)" fill={`url(#goldGrad-${position})`} />
        <rect x="2" y="62" width="4" height="4" transform="rotate(45 4 64)" fill={`url(#goldGrad-${position})`} />
        
        {/* Sharp dashed inner geometric line */}
        <path d="M16 46 V16 H46" stroke={`url(#goldGrad-${position})`} strokeWidth="0.9" strokeDasharray="2 2" strokeLinejoin="miter" />
      </svg>
    </div>
  );
}

// EXACT Clean, Powerful Certificate Canvas with Internal Hackathon Recognition, Gold Frame & 2-Column Signatures
function ExactOfficialCertificateCanvas({ team, recipient, certificateTitle, awardRibbonText }) {
  if (!team) return null;

  const activeRecipient = recipient || {
    name: team.leader_name,
    role: 'Team Leader',
    isLeader: true
  };

  return (
    <div className="exact-certificate-canvas-root" id="print-certificate-target">
      {/* Outer Stepped Frame with Triple Gold Inlay & Ornate Corner Filigrees */}
      <div className="exact-cert-outer-box">
        <div className="exact-cert-mid-gold-border">
          <div className="exact-cert-inner-box">
            
            {/* Ornate Gold Filigree Corner Badges */}
            <GoldCornerFlourish position="tl" />
            <GoldCornerFlourish position="tr" />
            <GoldCornerFlourish position="bl" />
            <GoldCornerFlourish position="br" />

            {/* 1. Header Dual Brand Logos Bar (Centered) */}
            <div className="exact-cert-header-row centered">
            {/* Left: MoE + AICTE + Innovation Cell + SIH 2026 */}
            <div className="exact-logo-left-group">
              <img 
                src="/logos/sih_moe_aicte_logo.png" 
                alt="Ministry of Education, AICTE, MoE Innovation Cell, Smart India Hackathon 2026" 
                className="exact-img-moe-sih"
              />
            </div>

            <div className="exact-header-logo-divider"></div>

            {/* Right: Updated RGU + NAAC Grade A++ Accredited */}
            <div className="exact-logo-right-group">
              <img 
                src="/logos/rgu_naac_logo.png" 
                alt="RGU Rathinam Global University - NAAC Grade A++ Accredited" 
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
                ✦ INTERNAL HACKATHON - RATHINAM GLOBAL UNIVERSITY ✦
              </span>
              <div className="exact-ribbon-line-right"></div>
            </div>

            <h2 className="exact-cert-honor-heading">{certificateTitle}</h2>
          </div>

          {/* 3. Conferral Line */}
          <div className="exact-conferral-intro">
            This certificate is proudly awarded to
          </div>

          {/* 4. Large Calligraphy Recipient Name */}
          <div className="exact-recipient-calligraphy-wrap">
            <span className="exact-calligraphy-name">{activeRecipient.name}</span>
            <div className="exact-recipient-team-sub">
              {activeRecipient.role || 'Team Member'} - <strong>Team {team.team_name}</strong>
            </div>
          </div>

          {/* 5. Award Ribbon Pill */}
          <div className="exact-award-ribbon-wrap">
            <div className="exact-award-ribbon-pill">
              <span className="ribbon-icon">🎖</span>
              <span className="ribbon-text">{awardRibbonText}</span>
            </div>
          </div>

          {/* 6. Simple, Powerful Body Statement (With Internal Hackathon & Innovation Best Wishes) */}
          <div className="exact-body-boxed-card">
            <p className="exact-citation-p1">
              In formal recognition of pioneering technical ingenuity, collaborative problem-solving, and commendable performance in the <strong>Smart India Hackathon (SIH) 2026 - Internal Hackathon</strong> conducted at Rathinam Global University. We commend your passion for breakthrough innovation and extend our warmest wishes for your continuous growth, technical leadership, and future impactful solutions.
            </p>
          </div>

          {/* 7. Signatures Row (2 Clean Balanced Columns - No Center Seal) */}
          <div className="exact-signatures-bottom-row two-col">
            
            {/* Left Signatory: Dr. S Manikandan (SPOC) */}
            <div className="exact-sign-col left">
              <div className="exact-sig-script-box">
                <img 
                  src="/logos/spoc_sign.png?v=5" 
                  alt="S. Manikandan Signature" 
                  className="exact-sig-image"
                />
              </div>
              <div className="exact-sig-underline"></div>
              <div className="exact-sig-person-name">Dr. S Manikandan</div>
              <div className="exact-sig-person-desig">SPOC - Smart India Hackathon 2026, RGU</div>
            </div>

            {/* Right Signatory: Dr. C Krishnaraj (Registrar) */}
            <div className="exact-sign-col right">
              <div className="exact-sig-script-box">
                <img 
                  src="/logos/registrar_sign.png?v=5" 
                  alt="C. Krishnaraj Signature" 
                  className="exact-sig-image"
                />
              </div>
              <div className="exact-sig-underline"></div>
              <div className="exact-sig-person-name">Dr. C Krishnaraj</div>
              <div className="exact-sig-person-desig">Registrar, Rathinam Global University</div>
            </div>

          </div>

          </div>
        </div>
      </div>
    </div>
  );
}
