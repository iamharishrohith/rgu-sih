import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar.jsx';
import RegistrationModal from './components/RegistrationModal.jsx';
import PasscodeModal from './components/PasscodeModal.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import TeamDetailsModal from './components/TeamDetailsModal.jsx';
import GrandLandingShowcase from './components/GrandLandingShowcase.jsx';
import ConfettiCanvas from './components/ConfettiCanvas.jsx';
import { MASTER_TEAMS } from './data/sihMasterData.js';
import { supabase } from './supabaseClient.js';
import { 
  Search, ArrowUpDown, UserCheck, ShieldCheck, Sparkles, Filter, Award, 
  ArrowRight, Lock, CheckCircle2, Home, ArrowLeft
} from 'lucide-react';
import './App.css';

// Strictly finalized 110 teams from Excel (80 Shortlist + 10 Bench + 20 Waitlist)
const FINALIZED_MASTER_TEAMS = MASTER_TEAMS.filter(t => 
  ['Shortlist', 'Bench', 'Waitlist'].includes(t.status)
);

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'candidate_desk' | 'admin'
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [isConfettiActive, setIsConfettiActive] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTier, setActiveTier] = useState('shortlist'); // strictly: 'shortlist' | 'bench' | 'waitlist'
  
  // Registrations Map & Team Contacts Map
  const [registrationsMap, setRegistrationsMap] = useState({});
  const [teamContactsMap, setTeamContactsMap] = useState({});

  const [activeRegTeam, setActiveRegTeam] = useState(null);
  const [activeDetailsTeam, setActiveDetailsTeam] = useState(null);
  const [sortBy, setSortBy] = useState('rank');
  const [sortOrder, setSortOrder] = useState('asc');

  // Trigger celebration confetti
  const triggerConfetti = () => {
    setIsConfettiActive(true);
  };

  // Secret keyboard listener (Ctrl + Shift + A) & Hash listener (#admin)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        triggerSecretAdmin();
      }
    };

    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        triggerSecretAdmin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleHashChange);

    if (window.location.hash === '#admin') {
      triggerSecretAdmin();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [isAdminLoggedIn]);

  const triggerSecretAdmin = () => {
    if (isAdminLoggedIn) {
      setCurrentView('admin');
    } else {
      setIsPasscodeModalOpen(true);
    }
  };

  // Hydrate registrations & contacts from Supabase & LocalStorage on boot
  useEffect(() => {
    async function loadData() {
      // 1. Load LocalStorage first
      try {
        const localRegs = JSON.parse(localStorage.getItem('sih_registrations') || '{}');
        const localContacts = JSON.parse(localStorage.getItem('sih_team_contacts') || '{}');
        setRegistrationsMap(localRegs);
        setTeamContactsMap(localContacts);
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
      } catch (err) {
        console.warn('Supabase fetch error, running on cached dataset:', err);
      }
    }

    loadData();
  }, []);

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

  // Exact 110 Finalized Tier counts
  const tierCounts = useMemo(() => {
    return {
      shortlist: FINALIZED_MASTER_TEAMS.filter(t => t.status === 'Shortlist').length, // 80
      bench: FINALIZED_MASTER_TEAMS.filter(t => t.status === 'Bench').length, // 10
      waitlist: FINALIZED_MASTER_TEAMS.filter(t => t.status === 'Waitlist').length, // 20
      totalFinalized: FINALIZED_MASTER_TEAMS.length // 110
    };
  }, []);

  // Submitted forms among the 110 finalized teams
  const finalizedSubmittedCount = useMemo(() => {
    const finalizedIds = new Set(FINALIZED_MASTER_TEAMS.map(t => t.temp_team_id));
    return Object.keys(registrationsMap).filter(id => finalizedIds.has(id)).length;
  }, [registrationsMap]);

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

    const s = FINALIZED_MASTER_TEAMS.filter(t => t.status === 'Shortlist' && matchFn(t)).length;
    const b = FINALIZED_MASTER_TEAMS.filter(t => t.status === 'Bench' && matchFn(t)).length;
    const w = FINALIZED_MASTER_TEAMS.filter(t => t.status === 'Waitlist' && matchFn(t)).length;
    return { shortlist: s, bench: b, waitlist: w, total: s + b + w };
  }, [searchTerm, registrationsMap]);

  // Filtered strictly to active tier (Shortlist = 80, Bench = 10, Waitlist = 20)
  const baseList = useMemo(() => {
    if (activeTier === 'shortlist') return FINALIZED_MASTER_TEAMS.filter(t => t.status === 'Shortlist');
    if (activeTier === 'bench') return FINALIZED_MASTER_TEAMS.filter(t => t.status === 'Bench');
    if (activeTier === 'waitlist') return FINALIZED_MASTER_TEAMS.filter(t => t.status === 'Waitlist');
    return [];
  }, [activeTier]);

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
    setRegistrationsMap(prev => ({
      ...prev,
      [teamId]: registrationPayload
    }));
    triggerConfetti();
  };

  const handlePasscodeSuccess = () => {
    setIsAdminLoggedIn(true);
    setIsPasscodeModalOpen(false);
    setCurrentView('admin');
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
      {/* Celebration Confetti Engine */}
      <ConfettiCanvas 
        active={isConfettiActive} 
        duration={3500} 
        onComplete={() => setIsConfettiActive(false)} 
      />

      <Navbar
        registeredCount={finalizedSubmittedCount}
        totalFinalizedCount={tierCounts.totalFinalized}
        onSecretAdminTrigger={triggerSecretAdmin}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenLandingView={() => setCurrentView('landing')}
        onOpenCandidateDesk={() => setCurrentView('candidate_desk')}
        currentView={currentView}
      />

      {/* VIEW 1: ADMIN DASHBOARD */}
      {currentView === 'admin' && isAdminLoggedIn ? (
        <AdminDashboard
          allMasterTeams={FINALIZED_MASTER_TEAMS}
          registrationsMap={registrationsMap}
          teamContactsMap={teamContactsMap}
          onUpdateContact={handleUpdateContact}
          onLogout={handleAdminLogout}
          onViewTeamDetails={(team) => setActiveDetailsTeam(team)}
          onOpenTeamForm={(team) => setActiveRegTeam(team)}
        />
      ) : currentView === 'landing' ? (
        /* VIEW 2: GRAND ANNOUNCEMENT LANDING SHOWCASE */
        <GrandLandingShowcase
          onExploreShortlist={() => openTierDesk('shortlist')}
          onExploreBench={() => openTierDesk('bench')}
          onExploreWaitlist={() => openTierDesk('waitlist')}
          allTeams={FINALIZED_MASTER_TEAMS}
          onOpenTeamRegistration={(team) => setActiveRegTeam(team)}
          onTriggerConfetti={triggerConfetti}
        />
      ) : (
        /* VIEW 3: CANDIDATE REGISTRATION DESK TABLE */
        <main className="main-viewport">
          <div className="desk-top-navigation-strip">
            <button className="btn-back-to-landing" onClick={() => setCurrentView('landing')}>
              <ArrowLeft size={16} />
              <span>Back to Grand Announcement</span>
            </button>
            <div className="desk-announcement-pill">
              <Sparkles size={14} className="text-amber" />
              <span>80 Unique Problem Statements Locked</span>
            </div>
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
                Official finalist registry for 110 finalized teams (80 Shortlisted Teams with 100% unique problem statements, 10 Bench Standby, and 20 Waitlist). Verify and complete your 6-member team roster.
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
                  <div className="tier-card-desc">Primary 80 Finalists (100% Unique PS)</div>
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
                placeholder={`Search ${activeTier === 'shortlist' ? 'Shortlisted (80)' : activeTier === 'bench' ? 'Bench (10)' : 'Waitlist (20)'} candidates by ID, Name, Leader, Reg No...`}
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
                              {regRecord?.team_name || team.team_name}
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
                              <button
                                className="btn-status-confirmed"
                                onClick={() => setActiveRegTeam(team)}
                              >
                                <UserCheck size={14} />
                                <span>Form Submitted</span>
                              </button>
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
            </div>
          </section>
        </main>
      )}

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
            <p>110 Finalized Teams (80 Shortlist • 10 Bench • 20 Waitlist)</p>
          </div>
        </div>
      </footer>

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
        />
      )}
    </div>
  );
}
