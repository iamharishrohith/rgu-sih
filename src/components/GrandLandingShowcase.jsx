import React, { useState } from 'react';
import { 
  Sparkles, ShieldCheck, Award, Filter, ArrowRight, Search, CheckCircle2, 
  Trophy, Star, Users, ExternalLink, Zap, ChevronRight, UserCheck, Flame
} from 'lucide-react';

export default function GrandLandingShowcase({ 
  onExploreShortlist, 
  onExploreBench, 
  onExploreWaitlist, 
  allTeams,
  onOpenTeamRegistration
}) {
  const [quickSearch, setQuickSearch] = useState('');
  const [searchedTeam, setSearchedTeam] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const shortlistCount = allTeams.filter(t => t.status === 'Shortlist').length || 80;
  const benchCount = allTeams.filter(t => t.status === 'Bench').length || 10;
  const waitlistCount = allTeams.filter(t => t.status === 'Waitlist').length || 23;
  const totalCount = shortlistCount + benchCount + waitlistCount;

  const handleInstantLookup = (e) => {
    e.preventDefault();
    if (!quickSearch.trim()) return;
    setHasSearched(true);

    const q = quickSearch.trim().toLowerCase();
    const match = allTeams.find(t => 
      t.reg_no.toLowerCase().includes(q) ||
      t.leader_name.toLowerCase().includes(q) ||
      t.team_name.toLowerCase().includes(q) ||
      t.temp_team_id.toLowerCase().includes(q)
    );

    setSearchedTeam(match || null);
  };

  return (
    <div className="grand-landing-viewport">
      {/* Hero Grand Announcement Section */}
      <section className="grand-hero-section">
        

        <div className="grand-hero-container">
          {/* Official Badge & Live Status */}
          <div className="grand-announcement-badge-row">
            <div className="celebrate-pill-badge">
              <Sparkles size={14} className="text-emerald" />
              <span>OFFICIAL SELECTION RESULTS ANNOUNCED</span>
            </div>
          </div>

          <h1 className="grand-main-headline">
            Smart India Hackathon <span className="gradient-text-hero">2026</span>
          </h1>
          
          <div className="grand-sub-headline">
            Campus Evaluation Authority Finalist Registry
          </div>

          <p className="grand-hero-description">
            Congratulations to all student innovators! Rathinam Global University proudly presents the finalized candidate selections. <strong>80 primary finalists</strong> with <strong>100% unique problem statements</strong>, accompanied by top-tier bench standby and waitlisted teams.
          </p>

          {/* Interactive Fast CTAs */}
          <div className="grand-cta-actions-row">
            <button className="btn-grand-primary-cta" onClick={() => onExploreShortlist('shortlist')}>
              <span>View 80 Finalists Shortlist</span>
              <ArrowRight size={18} />
            </button>

            <button className="btn-grand-secondary-cta" onClick={() => onExploreBench('bench')}>
              <Award size={18} className="text-amber" />
              <span>Bench Standby Pool (10)</span>
            </button>

            <button className="btn-grand-secondary-cta" onClick={() => onExploreWaitlist('waitlist')}>
              <Filter size={18} className="text-indigo" />
              <span>Waitlist Pool ({waitlistCount})</span>
            </button>
          </div>

          {/* 4 Big Key Stats Highlights */}
          <div className="grand-stats-cards-grid">
            <div className="grand-stat-card card-shortlist" onClick={() => onExploreShortlist('shortlist')}>
              <div className="stat-card-top">
                <div className="stat-icon-badge emerald">
                  <ShieldCheck size={22} />
                </div>
                <span className="stat-number-big">80</span>
              </div>
              <div className="stat-card-title">Shortlisted Finalists</div>
              <p className="stat-card-sub">100% Unique Problem Statements with Zero Overlap</p>
              <div className="stat-explore-link">
                <span>Open Shortlist Desk</span>
                <ChevronRight size={14} />
              </div>
            </div>

            <div className="grand-stat-card card-bench" onClick={() => onExploreBench('bench')}>
              <div className="stat-card-top">
                <div className="stat-icon-badge amber">
                  <Award size={22} />
                </div>
                <span className="stat-number-big">10</span>
              </div>
              <div className="stat-card-title">Bench Standby Teams</div>
              <p className="stat-card-sub">Tier-1 Immediate Standby Pool for National Portal</p>
              <div className="stat-explore-link">
                <span>Open Bench Pool</span>
                <ChevronRight size={14} />
              </div>
            </div>

            <div className="grand-stat-card card-waitlist" onClick={() => onExploreWaitlist('waitlist')}>
              <div className="stat-card-top">
                <div className="stat-icon-badge indigo">
                  <Filter size={22} />
                </div>
                <span className="stat-number-big">{waitlistCount}</span>
              </div>
              <div className="stat-card-title">Waitlist Pool</div>
              <p className="stat-card-sub">High-Scoring Contenders for Domain Balancing</p>
              <div className="stat-explore-link">
                <span>Open Waitlist Desk</span>
                <ChevronRight size={14} />
              </div>
            </div>

            <div className="grand-stat-card card-total">
              <div className="stat-card-top">
                <div className="stat-icon-badge violet">
                  <Trophy size={22} />
                </div>
                <span className="stat-number-big">{totalCount}</span>
              </div>
              <div className="stat-card-title">Finalized Innovators</div>
              <p className="stat-card-sub">Strictly Finalized Teams Verified by Section 65B</p>
              <div className="stat-explore-link text-violet">
                <span>Certified Electronic Proof</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Instant Result Lookup Box */}
      <section className="instant-lookup-section">
        <div className="instant-lookup-card">
          <div className="lookup-header-group">
            <div className="lookup-icon-circle">
              <Search size={22} />
            </div>
            <div>
              <h2 className="lookup-title">Check Your Team Selection Status Instantly</h2>
              <p className="lookup-desc">
                Enter your <strong>Register Number</strong> (e.g. <code>RCAS2025BCS094</code>), <strong>Leader Name</strong>, or <strong>Team Name</strong> to check your selection card.
              </p>
            </div>
          </div>

          <form onSubmit={handleInstantLookup} className="instant-lookup-form">
            <div className="lookup-input-wrap">
              <Search size={18} className="lookup-search-icon" />
              <input 
                type="text" 
                placeholder="Enter Register Number, Leader Name, or Team Name..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                className="lookup-input-field"
              />
            </div>
            <button type="submit" className="btn-lookup-submit">
              <span>Check My Result</span>
              <Sparkles size={16} />
            </button>
          </form>

          {/* Searched Result Card */}
          {hasSearched && (
            <div className="searched-result-wrapper">
              {searchedTeam ? (
                <div className={`celebration-result-card ${searchedTeam.status.toLowerCase()}`}>
                  <div className="result-card-top-strip">
                    <div className="result-status-tag">
                      <Trophy size={16} />
                      <span>{searchedTeam.status.toUpperCase()} CANDIDATE</span>
                    </div>
                    <span className="result-rank-tag">National Rank #{searchedTeam.rank}</span>
                  </div>

                  <div className="result-card-body">
                    <div className="result-team-title-row">
                      <h3 className="result-team-name">{searchedTeam.team_name}</h3>
                      <span className="result-team-id">{searchedTeam.temp_team_id}</span>
                    </div>

                    <div className="result-details-grid">
                      <div className="result-detail-item">
                        <span className="r-label">Team Leader</span>
                        <strong className="r-val">{searchedTeam.leader_name}</strong>
                      </div>
                      <div className="result-detail-item">
                        <span className="r-label">Register Number</span>
                        <strong className="r-val font-mono">{searchedTeam.reg_no}</strong>
                      </div>
                      <div className="result-detail-item">
                        <span className="r-label">School / Faculty</span>
                        <span className="r-val">{searchedTeam.school}</span>
                      </div>
                      <div className="result-detail-item">
                        <span className="r-label">Problem Statement</span>
                        <span className="r-val font-mono text-indigo font-bold">{searchedTeam.ps_id}</span>
                      </div>
                    </div>

                    <div className="result-action-strip">
                      <div className="congrats-text-note">
                        <CheckCircle2 size={16} className="text-emerald" />
                        <span>Congratulations! Your team is finalized. Complete your 6-member roster now.</span>
                      </div>
                      <button 
                        className="btn-result-register-now"
                        onClick={() => onOpenTeamRegistration(searchedTeam)}
                      >
                        <span>Complete Registration Form</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="result-not-found-card">
                  <div className="not-found-icon">
                    <Filter size={28} />
                  </div>
                  <h4>No finalized candidate found for "{quickSearch}"</h4>
                  <p>Please double-check your Register Number or browse the complete list in the Candidate Desk.</p>
                  <button className="btn-browse-all-cta" onClick={() => onExploreShortlist('shortlist')}>
                    Browse Full 110 Candidate Desk
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Domain Innovation Pillars */}
      <section className="domains-showcase-section">
        <div className="domains-container">
          <div className="domains-header">
            <span className="domains-tag">INNOVATION DOMAINS</span>
            <h2 className="domains-title">80 National Solutions Across Key Pillars</h2>
          </div>

          <div className="domains-grid">
            <div className="domain-card" onClick={() => onExploreShortlist('shortlist')}>
              <div className="domain-icon-wrap bg-emerald">
                <Flame size={20} />
              </div>
              <h3>Agriculture &amp; Rural FoodTech</h3>
              <p>Computer vision disease diagnostics, crop yield forecasting &amp; farmer advisory telemetry.</p>
            </div>

            <div className="domain-card" onClick={() => onExploreShortlist('shortlist')}>
              <div className="domain-icon-wrap bg-blue">
                <Zap size={20} />
              </div>
              <h3>AI, Space &amp; Quantum Computing</h3>
              <p>Autonomous drone navigation, satellite imagery analysis &amp; ISRO on-board experiments.</p>
            </div>

            <div className="domain-card" onClick={() => onExploreShortlist('shortlist')}>
              <div className="domain-icon-wrap bg-violet">
                <ShieldCheck size={20} />
              </div>
              <h3>Cybersecurity &amp; LegalTech</h3>
              <p>Voice cloning impersonation defenses, deepfake telemetry &amp; electronic proof ledgers.</p>
            </div>

            <div className="domain-card" onClick={() => onExploreShortlist('shortlist')}>
              <div className="domain-icon-wrap bg-amber">
                <Users size={20} />
              </div>
              <h3>Smart Governance &amp; EdTech</h3>
              <p>Adaptive personalized learning systems, student innovation &amp; disaster early warning telemetry.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
