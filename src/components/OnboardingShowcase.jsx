import React, { useState, useMemo } from 'react';
import { 
  Sparkles, ShieldCheck, Award, Search, Users, ExternalLink, 
  ArrowRight, Filter, CheckCircle2, UserCheck, LayoutGrid, Table, 
  Building2, BookOpen, Layers, Edit3, Eye, FileText, ChevronRight,
  TrendingUp, Heart, Check, RefreshCw
} from 'lucide-react';
import { OFFICIAL_SCHOOLS, normalizeSchoolName } from '../data/sihMasterData';

export default function OnboardingShowcase({ 
  onboardedTeams = [], 
  totalMasterCount = 110,
  onViewTeamRoster,
  onEditRegistration,
  onExploreAllShortlist,
  onOpenInOutPortal,
  onOpenAdminGateway,
  isAdminLoggedIn = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // 'ALL', 'Hardware', 'Software'

  // Extract distinct schools from onboarded teams
  const schoolCounts = useMemo(() => {
    const counts = { ALL: onboardedTeams.length };
    onboardedTeams.forEach(t => {
      const reg = t.registrationData || t;
      const school = normalizeSchoolName(reg.leader_school || t.school || 'General');
      counts[school] = (counts[school] || 0) + 1;
    });
    return counts;
  }, [onboardedTeams]);

  // Comprehensive metric computations
  const metrics = useMemo(() => {
    const totalTeams = onboardedTeams.length;
    let totalInnovators = 0;
    let femaleCount = 0;
    const uniquePs = new Set();

    onboardedTeams.forEach(t => {
      const reg = t.registrationData || t;
      const members = Array.isArray(reg.members) ? reg.members : [];
      // Leader + members
      totalInnovators += (1 + members.length);
      
      if (reg.leader_gender === 'Female') femaleCount++;
      members.forEach(m => {
        if (m.gender === 'Female') femaleCount++;
      });

      const ps = reg.sih_ps_id || reg.ps_id || t.ps_id;
      if (ps) uniquePs.add(ps);
    });

    const femalePercentage = totalInnovators > 0 
      ? Math.round((femaleCount / totalInnovators) * 100) 
      : 0;

    return {
      totalTeams,
      totalInnovators,
      femaleCount,
      femalePercentage,
      uniquePsCount: uniquePs.size
    };
  }, [onboardedTeams]);

  // Filter and search logic
  const filteredTeams = useMemo(() => {
    return onboardedTeams.filter(team => {
      const reg = team.registrationData || team;
      const school = normalizeSchoolName(reg.leader_school || team.school || '');

      // School filter
      if (selectedSchool !== 'ALL' && school !== selectedSchool) {
        return false;
      }

      // Category filter (Hardware/Software)
      if (categoryFilter !== 'ALL') {
        const cat = (team.category || reg.category || '').toLowerCase();
        if (!cat.includes(categoryFilter.toLowerCase())) return false;
      }

      // Search term
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();

      const teamName = (reg.team_name || team.team_name || '').toLowerCase();
      const teamId = (team.temp_team_id || reg.temp_team_id || '').toLowerCase();
      const psId = (reg.sih_ps_id || reg.ps_id || team.ps_id || '').toLowerCase();
      const psTitle = (reg.ps_title || team.ps_title || '').toLowerCase();
      const leaderName = (reg.leader_name || team.leader_name || '').toLowerCase();
      const leaderReg = (reg.leader_reg_no || team.reg_no || '').toLowerCase();
      const mentorName = (reg.mentor_name || '').toLowerCase();

      // Search in members too
      const members = Array.isArray(reg.members) ? reg.members : [];
      const memberMatch = members.some(m => 
        (m.name || '').toLowerCase().includes(q) ||
        (m.reg_no || '').toLowerCase().includes(q) ||
        (m.dept || '').toLowerCase().includes(q)
      );

      return (
        teamName.includes(q) ||
        teamId.includes(q) ||
        psId.includes(q) ||
        psTitle.includes(q) ||
        leaderName.includes(q) ||
        leaderReg.includes(q) ||
        mentorName.includes(q) ||
        school.toLowerCase().includes(q) ||
        memberMatch
      );
    });
  }, [onboardedTeams, selectedSchool, categoryFilter, searchTerm]);

  return (
    <div className="onboarding-viewport">
      {/* Grand Onboarding Hero Section */}
      <section className="onboarding-hero-section">
        <div className="onboarding-hero-radial"></div>

        <div className="onboarding-hero-container">
          <div className="onboarding-badge-pill">
            <Sparkles size={14} className="text-amber" />
            <span>MINISTRY OF EDUCATION &bull; AICTE &bull; SMART INDIA HACKATHON 2026</span>
          </div>

          <h1 className="onboarding-hero-title">
            Smart India Hackathon 2026
            <span className="gradient-highlight-text">Officially Onboarded Teams</span>
          </h1>

          <p className="onboarding-hero-subtitle">
            Official Live Registry of <strong>{metrics.totalTeams} Form-Filled Teams</strong> ({metrics.totalInnovators} Verified Student Innovators) with Section 65B Electronic Record Compliance across 17 SIH Technology Themes.
          </p>

          {/* 3 Crisp Key Metric Highlight Cards */}
          <div className="onboarding-stats-cards-grid">
            <div className="onboarding-stat-card card-innovators">
              <div className="stat-card-top">
                <div className="stat-icon-badge indigo">
                  <Users size={22} />
                </div>
                <span className="stat-number-big">{metrics.totalInnovators}</span>
              </div>
              <div className="stat-card-title">Student Innovators</div>
              <div className="stat-card-desc">6 Members per Verified Team Roster</div>
              <div className="stat-meta-pill indigo">Full 6-Member Rosters</div>
            </div>

            <div className="onboarding-stat-card card-diversity">
              <div className="stat-card-top">
                <div className="stat-icon-badge rose">
                  <Heart size={22} />
                </div>
                <span className="stat-number-big">{metrics.femalePercentage}%</span>
              </div>
              <div className="stat-card-title">Women in STEM</div>
              <div className="stat-card-desc">{metrics.femaleCount} Female Innovators Active</div>
              <div className="stat-meta-pill rose">Mandatory Inclusivity</div>
            </div>

            <div className="onboarding-stat-card card-ps">
              <div className="stat-card-top">
                <div className="stat-icon-badge amber">
                  <Award size={22} />
                </div>
                <span className="stat-number-big">{metrics.uniquePsCount}</span>
              </div>
              <div className="stat-card-title">Problem Statements</div>
              <div className="stat-card-desc">Across 17 SIH Technology Themes</div>
              <div className="stat-meta-pill amber">Zero Duplicate PS</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Showcase */}
      <section className="onboarding-showcase-container" id="onboard-search-box">
        {/* Search & Filter Header Control Bar */}
        <div className="onboarding-control-panel">
          <div className="search-bar-unified">
            <Search size={18} className="search-icon-svg" />
            <input 
              type="text" 
              placeholder="Search by Team Name, Temp ID, PS ID, Leader, Reg No, Member Name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="onboarding-search-input"
            />
            {searchTerm && (
              <button className="btn-clear-search" onClick={() => setSearchTerm('')}>
                Clear
              </button>
            )}
          </div>

          <div className="control-panel-right">
            {/* View Mode Toggle */}
            <div className="view-mode-toggle-group">
              <button 
                className={`btn-view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Interactive Ticket Cards View"
              >
                <LayoutGrid size={16} />
                <span>Pass Cards</span>
              </button>
              <button 
                className={`btn-view-toggle ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Compact Table View"
              >
                <Table size={16} />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* School Filter Carousel / Pills */}
        <div className="school-filter-strip">
          <div className="school-filter-scroll">
            <button 
              className={`school-pill-btn ${selectedSchool === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedSchool('ALL')}
            >
              <span>All Schools</span>
              <span className="pill-counter">{onboardedTeams.length}</span>
            </button>

            {OFFICIAL_SCHOOLS.map(school => {
              const count = schoolCounts[school] || 0;
              if (count === 0 && selectedSchool !== school) return null;
              return (
                <button 
                  key={school}
                  className={`school-pill-btn ${selectedSchool === school ? 'active' : ''}`}
                  onClick={() => setSelectedSchool(school)}
                >
                  <span>{school}</span>
                  <span className="pill-counter">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Info Bar */}
        <div className="onboarding-results-bar">
          <div className="results-count-text">
            <CheckCircle2 size={16} className="text-emerald" />
            <span>
              Displaying <strong>{filteredTeams.length}</strong> of <strong>{onboardedTeams.length}</strong> Onboarded Teams
              {selectedSchool !== 'ALL' && ` in ${selectedSchool}`}
              {searchTerm && ` matching "${searchTerm}"`}
            </span>
          </div>
        </div>

        {/* VIEW 1: 3D CYBER TICKET CARDS (UIVERSE DEV PASS STYLE) */}
        {viewMode === 'grid' && (
          <div className="onboarding-tickets-grid">
            {filteredTeams.map((team, idx) => {
              const reg = team.registrationData || team;
              const members = Array.isArray(reg.members) ? reg.members : [];
              const psId = reg.sih_ps_id || reg.ps_id || team.ps_id || 'SIH26-';
              const psTitle = reg.ps_title || team.ps_title || 'Smart India Hackathon Problem Statement';
              const leaderSchool = normalizeSchoolName(reg.leader_school || team.school);
              const teamNum = (team.temp_team_id || '').replace(/\D/g, '').slice(-3) || String(idx + 1).padStart(2, '0');

              return (
                <div key={team.temp_team_id || idx} className="ticket-canvas">
                  <div className="ticket-wrapper">
                    <div className="ticket">
                      <div className="t-main">
                        <div className="t-content">
                          <div className="t-header">
                            <div className="t-logo">
                              <svg viewBox="0 0 24 24">
                                <path
                                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                ></path>
                              </svg>
                              <span>SIH '26</span>
                            </div>
                            <div className="t-type">VERIFIED ONBOARDED</div>
                          </div>
                          <div className="t-title" title={reg.team_name || team.team_name}>
                            {reg.team_name || team.team_name}
                          </div>
                          <div className="t-subtitle" title={`${psId} • ${psTitle}`}>
                            <span className="t-ps-id">{psId}</span> {psTitle}
                          </div>
                          <div className="t-details">
                            <div className="t-detail-item">
                              <span className="t-label">Leader</span>
                              <span className="t-value">{reg.leader_name || team.leader_name}</span>
                            </div>
                            <div className="t-detail-item">
                              <span className="t-label">Reg No</span>
                              <span className="t-value">{reg.leader_reg_no || team.reg_no || 'Lead'}</span>
                            </div>
                            <div className="t-detail-item">
                              <span className="t-label">School</span>
                              <span className="t-value" title={leaderSchool}>{leaderSchool}</span>
                            </div>
                            <div className="t-detail-item">
                              <span className="t-label">Roster</span>
                              <span className="t-value">{1 + members.length} Innovators</span>
                            </div>
                          </div>
                        </div>
                        <div
                          className="t-perforation"
                          style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', transform: 'translateY(50%)' }}
                        >
                          <div className="t-perf-line"></div>
                        </div>
                      </div>
                      <div className="t-stub">
                        <div className="t-barcode-container">
                          <div className="t-barcode"></div>
                          <div className="t-barcode-id">{team.temp_team_id}</div>
                        </div>
                        <div className="t-admit">
                          <div className="t-admit-text">TEAM</div>
                          <div className="t-admit-num">{teamNum}</div>
                        </div>
                      </div>
                      <div className="t-actions-strip">
                        <button 
                          className="btn-t-action roster"
                          onClick={() => onViewTeamRoster && onViewTeamRoster(team)}
                          title="View 6-Member Roster & Section 65B Record"
                        >
                          <Eye size={13} />
                          <span>View Roster</span>
                        </button>
                        <button 
                          className="btn-t-action edit"
                          onClick={() => onEditRegistration && onEditRegistration(team)}
                          title="Edit Registration Form"
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 2: DENSE TABLE VIEW */}
        {viewMode === 'table' && (
          <div className="onboarding-table-card">
            <div className="table-responsive-box">
              <table className="onboarding-matrix-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Temp Team ID</th>
                    <th>Team Name</th>
                    <th>Problem Statement</th>
                    <th>Team Leader</th>
                    <th>Members (5)</th>
                    <th>School &amp; Department</th>
                    <th>Faculty Mentor</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((team, idx) => {
                    const reg = team.registrationData || team;
                    const members = Array.isArray(reg.members) ? reg.members : [];
                    const psId = reg.sih_ps_id || reg.ps_id || team.ps_id || 'SIH26-';
                    const psTitle = reg.ps_title || team.ps_title || '';
                    const leaderSchool = normalizeSchoolName(reg.leader_school || team.school);

                    return (
                      <tr key={team.temp_team_id || idx}>
                        <td className="col-idx">{idx + 1}</td>
                        <td className="col-team-id">
                          <span className="table-id-pill">{team.temp_team_id}</span>
                          <span className="table-status-pill">{team.status || 'Shortlist'}</span>
                        </td>
                        <td className="col-team-name">
                          <strong>{reg.team_name || team.team_name}</strong>
                        </td>
                        <td className="col-ps">
                          <span className="table-ps-id">{psId}</span>
                          <div className="table-ps-title-clamp" title={psTitle}>{psTitle}</div>
                        </td>
                        <td className="col-leader">
                          <div className="table-leader-cell">
                            <strong>{reg.leader_name || team.leader_name}</strong>
                            <span className="table-reg-sub">{reg.leader_reg_no || team.reg_no}</span>
                            <span className={`gender-badge-sm ${reg.leader_gender === 'Female' ? 'female' : 'male'}`}>
                              {reg.leader_gender || 'Male'}
                            </span>
                          </div>
                        </td>
                        <td className="col-members-list">
                          <div className="table-members-summary">
                            <span className="members-badge-count">{members.length} Members</span>
                            <div className="table-members-names">
                              {members.map(m => m.name).filter(Boolean).join(', ')}
                            </div>
                          </div>
                        </td>
                        <td className="col-school">
                          <div className="table-school-cell">
                            <span className="table-school-name">{leaderSchool}</span>
                            <span className="table-dept-sub">{reg.leader_dept || team.department}</span>
                          </div>
                        </td>
                        <td className="col-mentor">
                          <span className="table-mentor-name">{reg.mentor_name || 'Faculty Guide Assigned'}</span>
                        </td>
                        <td className="col-actions">
                          <div className="table-actions-cell">
                            <button 
                              className="btn-table-action"
                              onClick={() => onViewTeamRoster && onViewTeamRoster(team)}
                              title="View Full Team Roster"
                            >
                              <Eye size={14} />
                            </button>
                            <button 
                              className="btn-table-action edit"
                              onClick={() => onEditRegistration && onEditRegistration(team)}
                              title="Edit Registration"
                            >
                              <Edit3 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty Search Results */}
        {filteredTeams.length === 0 && (
          <div className="onboarding-empty-state">
            <div className="empty-icon-circle">
              <Search size={32} className="text-slate" />
            </div>
            <h3>No matching onboarded teams found</h3>
            <p>
              {searchTerm 
                ? `No teams matched your query "${searchTerm}". Try searching by ID, leader name, or department.`
                : 'No onboarded teams found in this school filter.'
              }
            </p>
            <div className="empty-actions-row">
              <button 
                className="btn-reset-filters" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSchool('ALL');
                  setCategoryFilter('ALL');
                }}
              >
                <RefreshCw size={15} />
                <span>Reset All Filters</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Institutional Footer with subtle shortlist archive link */}
      <footer className="onboarding-site-footer">
        <div className="footer-inner-container">
          <div className="footer-left-info">
            <div className="footer-sih-tag">
              <Sparkles size={14} className="text-amber" />
              <span>Smart India Hackathon 2026 &bull; Section 65B Electronic Record</span>
            </div>
            <p className="footer-copyright-text">
              Rathinam Global University &bull; Ministry of Education &bull; AICTE MoE Innovation Cell
            </p>
          </div>

          <div className="footer-right-actions">
            <button 
              className="btn-footer-shortlist-link" 
              onClick={onExploreAllShortlist}
              title="View full 110 Candidate Selection & Standby Desk"
            >
              <span>Need to register? View Full 110 Shortlist Archive</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
