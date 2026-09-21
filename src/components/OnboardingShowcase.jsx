import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, ShieldCheck, Award, Search, Users, ExternalLink, 
  ArrowRight, Filter, CheckCircle2, UserCheck, LayoutGrid, Table, 
  Building2, BookOpen, Layers, Edit3, Eye, FileText, ChevronRight,
  ChevronLeft, TrendingUp, Heart, Check, RefreshCw, Quote, Play, Pause, Terminal
} from 'lucide-react';
import { OFFICIAL_SCHOOLS, normalizeSchoolName, isTestTeam } from '../data/sihMasterData';

const HACKATHON_QUOTES = [
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs", tag: "Leadership" },
  { text: "You have to dream before your dreams can come true.", author: "Dr. A.P.J. Abdul Kalam", tag: "Inspiration" },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds", tag: "Engineering" },
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay", tag: "Innovation" },
  { text: "Dream, dream, dream. Dreams transform into thoughts and thoughts result in action.", author: "Dr. A.P.J. Abdul Kalam", tag: "Youth Power" },
  { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman", tag: "Architecture" },
  { text: "Software is a great combination between artistry and engineering.", author: "Bill Gates", tag: "Craftsmanship" },
  { text: "The true sign of intelligence is not knowledge but imagination.", author: "Albert Einstein", tag: "Imagination" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson", tag: "Problem Solving" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck", tag: "Agile" },
  { text: "Technology is best when it brings people together.", author: "Matt Mullenweg", tag: "Impact" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", author: "Cory House", tag: "Clean Code" },
  { text: "If you fail, never give up because F.A.I.L. means First Attempt In Learning.", author: "Dr. A.P.J. Abdul Kalam", tag: "Resilience" },
  { text: "Empowering youth through innovation is the cornerstone of a self-reliant nation.", author: "Smart India Hackathon", tag: "Viksit Bharat" },
  { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler", tag: "Excellence" },
  { text: "Optimism is an essential ingredient of innovation.", author: "Robert Noyce", tag: "Mindset" },
  { text: "Creativity is thinking up new things. Innovation is doing new things.", author: "Theodore Levitt", tag: "Action" },
  { text: "Small aim is a crime; have great aim.", author: "Dr. A.P.J. Abdul Kalam", tag: "Big Ambition" },
  { text: "Building indigenous tech solutions today powers India’s technological sovereignty tomorrow.", author: "MoE Innovation Cell", tag: "Tech Sovereignty" },
  { text: "Fix the cause, not the symptom.", author: "Steve Maguire", tag: "Root Cause" },
  { text: "It's not about ideas. It's about making ideas happen.", author: "Scott Belsky", tag: "Execution" },
  { text: "A problem clearly stated is a problem half solved.", author: "Charles Kettering", tag: "Strategy" },
  { text: "Youth of today are the architects of tomorrow's Viksit Bharat.", author: "Smart India Hackathon 2026", tag: "Nation Building" },
  { text: "Every great developer you know got there by solving problems they were unqualified to solve.", author: "Patrick McKenzie", tag: "Growth Mindset" },
  { text: "The purpose of technology is not to replace human capability, but to amplify human potential.", author: "AICTE MoE Innovation Cell", tag: "Human Potential" }
];

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
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // 'ALL', 'Hardware', 'Software'

  // Typewriter Writing Animation State for Quotes
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [displayedQuote, setDisplayedQuote] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const activeQuote = HACKATHON_QUOTES[quoteIndex] || HACKATHON_QUOTES[0];

  useEffect(() => {
    if (isPaused) return;

    let timeout;
    const fullText = activeQuote.text;

    if (isTyping) {
      if (displayedQuote.length < fullText.length) {
        timeout = setTimeout(() => {
          setDisplayedQuote(fullText.slice(0, displayedQuote.length + 1));
        }, 32);
      } else {
        // Finished typing current quote, pause to let user read
        timeout = setTimeout(() => {
          setIsTyping(false);
        }, 4000);
      }
    } else {
      // Transition to next quote
      if (displayedQuote.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedQuote(prev => prev.slice(0, -2) || '');
        }, 15);
      } else {
        setQuoteIndex(prev => (prev + 1) % HACKATHON_QUOTES.length);
        setIsTyping(true);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedQuote, isTyping, isPaused, activeQuote]);

  const handleNextQuote = () => {
    setQuoteIndex(prev => (prev + 1) % HACKATHON_QUOTES.length);
    setDisplayedQuote('');
    setIsTyping(true);
  };

  const handlePrevQuote = () => {
    setQuoteIndex(prev => (prev - 1 + HACKATHON_QUOTES.length) % HACKATHON_QUOTES.length);
    setDisplayedQuote('');
    setIsTyping(true);
  };

  // Deduplicate incoming onboardedTeams by temp_team_id and exclude any test records
  const uniqueOnboardedTeams = useMemo(() => {
    const seen = new Set();
    return onboardedTeams.filter(t => {
      const id = (t.temp_team_id || '').trim();
      if (!id || seen.has(id) || isTestTeam(t) || isTestTeam(t.registrationData)) return false;
      seen.add(id);
      return true;
    });
  }, [onboardedTeams]);


  // Extract distinct schools from onboarded teams
  const schoolCounts = useMemo(() => {
    const counts = { ALL: uniqueOnboardedTeams.length };
    uniqueOnboardedTeams.forEach(t => {
      const reg = t.registrationData || t;
      const school = normalizeSchoolName(reg.leader_school || t.school || 'General');
      counts[school] = (counts[school] || 0) + 1;
    });
    return counts;
  }, [uniqueOnboardedTeams]);

  // Comprehensive metric computations
  const metrics = useMemo(() => {
    const totalTeams = uniqueOnboardedTeams.length;
    let totalInnovators = 0;
    let femaleCount = 0;
    const uniquePs = new Set();

    uniqueOnboardedTeams.forEach(t => {
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
  }, [uniqueOnboardedTeams]);

  // Filter and search logic
  const filteredTeams = useMemo(() => {
    const seen = new Set();
    return uniqueOnboardedTeams.filter(team => {
      const id = (team.temp_team_id || '').trim();
      if (seen.has(id)) return false;
      seen.add(id);

      const reg = team.registrationData || team;
      const school = normalizeSchoolName(reg.leader_school || team.school || '');

      // School filter
      if (selectedSchool !== 'ALL' && school !== selectedSchool) {
        return false;
      }

      // Category filter (Hardware/Software)
      if (categoryFilter !== 'ALL') {
        const cat = (team.category || reg.category || team.ps_category || '').toLowerCase();
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
  }, [uniqueOnboardedTeams, selectedSchool, categoryFilter, searchTerm]);

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

          {/* 20+ Animated Innovation & Hackathon Quote Writing Banner (Big Size) */}
          <div className="onboarding-quote-terminal-banner">
            <div className="quote-banner-header">
              <div className="quote-badge-tag">
                <Terminal size={14} className="text-emerald" />
                <span>INNOVATION DISPATCH &bull; {activeQuote.tag}</span>
              </div>
              <div className="quote-nav-controls">
                <span className="quote-counter-pill">
                  {String(quoteIndex + 1).padStart(2, '0')} / {String(HACKATHON_QUOTES.length).padStart(2, '0')}
                </span>
                <button 
                  className="btn-quote-step" 
                  onClick={handlePrevQuote} 
                  title="Previous Quote"
                  aria-label="Previous quote"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  className="btn-quote-step" 
                  onClick={() => setIsPaused(!isPaused)} 
                  title={isPaused ? "Resume auto-typing" : "Pause typing"}
                  aria-label={isPaused ? "Resume auto-typing" : "Pause typing"}
                >
                  {isPaused ? <Play size={13} /> : <Pause size={13} />}
                </button>
                <button 
                  className="btn-quote-step" 
                  onClick={handleNextQuote} 
                  title="Next Quote"
                  aria-label="Next quote"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="quote-banner-body">
              <div className="quote-text-wrapper">
                <span className="quote-opening-mark">&ldquo;</span>
                <span className="quote-main-content">
                  {displayedQuote}
                  <span className={`quote-typing-cursor ${isPaused ? 'paused' : ''}`}>|</span>
                </span>
                <span className="quote-closing-mark">&rdquo;</span>
              </div>
            </div>

            <div className="quote-banner-footer">
              <div className="quote-author-info">
                <div className="quote-author-line"></div>
                <span className="quote-author-name">{activeQuote.author}</span>
              </div>
              <div className="quote-footer-pill">
                <Sparkles size={13} className="text-amber" />
                <span>Smart India Hackathon 2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Showcase */}
      <section className="onboarding-showcase-container" id="onboard-search-box">
        {/* Search & Filter Header Control Bar */}
        <div className="onboarding-control-panel">
          <div className="search-bar-unified full-width-search">
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

        {/* 3D CYBER TICKET CARDS (UIVERSE DEV PASS STYLE) */}
        <div className="onboarding-tickets-grid">
          {filteredTeams.map((team, idx) => {
            const reg = team.registrationData || team;
            const members = Array.isArray(reg.members) ? reg.members : [];
            const psId = reg.sih_ps_id || reg.ps_id || team.ps_id || 'SIH26-';
            const psTitle = reg.ps_title || team.ps_title || 'Smart India Hackathon Problem Statement';
            const leaderSchool = normalizeSchoolName(reg.leader_school || team.school);
            const teamNum = (team.temp_team_id || '').replace(/\D/g, '').slice(-3) || String(idx + 1).padStart(2, '0');

            return (
              <div key={`${team.temp_team_id || 'ticket'}-${idx}`} className="ticket-canvas">
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
