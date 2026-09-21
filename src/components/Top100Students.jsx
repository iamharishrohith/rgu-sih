import React, { useState, useMemo } from 'react';
import { TOP_20_AWARDS } from '../data/top20AwardsData';
import '../styles/top100.css';
import { 
  Award, 
  ShieldCheck, 
  Search, 
  LayoutGrid, 
  List, 
  X, 
  Printer, 
  ArrowUpRight,
  CheckCircle2,
  Copy,
  Users,
  Target,
  Sparkles,
  Cpu,
  Layers,
  FileText
} from 'lucide-react';

const DOMAIN_OPTIONS = [
  "All Specializations",
  "Cybersecurity & Artificial Intelligence",
  "Drones & Autonomous Systems",
  "Smart Cities & Mobility",
  "AgriTech & Climate",
  "FinTech & Governance",
  "Deep Tech & Quantum"
];

export default function Top100Students({ onBackToMain }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All Specializations');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [activeAwardee, setActiveAwardee] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Filtered list
  const filteredAwards = useMemo(() => {
    return TOP_20_AWARDS.filter(a => {
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        a.student_name.toLowerCase().includes(q) ||
        a.award_title.toLowerCase().includes(q) ||
        a.specialization.toLowerCase().includes(q) ||
        a.ps_id.toLowerCase().includes(q) ||
        a.team_name.toLowerCase().includes(q) ||
        a.skills.some(sk => sk.toLowerCase().includes(q));
      
      const matchDomain = selectedDomain === "All Specializations" || a.award_category === selectedDomain;
      return matchSearch && matchDomain;
    });
  }, [searchQuery, selectedDomain]);

  // Handle Copy Hash
  const handleCopyHash = (hash) => {
    navigator.clipboard?.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="top100-container">
      <div className="top100-grid-bg" />

      {/* HEADER SECTION */}
      <header className="top100-header">
        <div>
          <div className="top100-badge-track">
            <span className="top100-badge-dot" />
            <span>SIH 2026 &bull; NATIONAL SPECIALIZATION LAUREATES</span>
          </div>
          <h1 className="top100-title">
            TOP 20 <span className="gold-accent">SPECIALIZATION AWARDS</span>
          </h1>
          <p className="top100-subtitle">
            Equal-honor national recognition celebrating breakthrough technical depth, systems architecture, and domain innovation across core engineering disciplines. No rank hierarchy &bull; No numerical scores.
          </p>
        </div>

        <div className="top100-header-actions">
          {onBackToMain && (
            <button className="top100-btn" onClick={onBackToMain}>
              <ArrowUpRight size={14} /> Back to Arena
            </button>
          )}
          <button 
            className="top100-btn"
            onClick={() => window.print()}
          >
            <Printer size={14} /> Export Citations
          </button>
        </div>
      </header>

      {/* KPI SUMMARY RIBBON */}
      <section className="top100-kpi-ribbon">
        <div className="kpi-tile">
          <div className="kpi-tile-lbl">
            <Award size={12} color="var(--px-gold)" /> National Laureates
          </div>
          <div className="kpi-tile-val">20</div>
          <div className="kpi-tile-sub">Equal Prestige Honors</div>
        </div>

        <div className="kpi-tile">
          <div className="kpi-tile-lbl">
            <Target size={12} color="var(--px-blue)" /> Domain Categories
          </div>
          <div className="kpi-tile-val">6</div>
          <div className="kpi-tile-sub">Core Tech Specializations</div>
        </div>

        <div className="kpi-tile">
          <div className="kpi-tile-lbl">
            <Layers size={12} color="var(--px-purple)" /> Problem Statements
          </div>
          <div className="kpi-tile-val">20</div>
          <div className="kpi-tile-sub">Full Technical Coverage</div>
        </div>

        <div className="kpi-tile">
          <div className="kpi-tile-lbl">
            <ShieldCheck size={12} color="var(--px-emerald)" /> Ledger Status
          </div>
          <div className="kpi-tile-val" style={{ color: 'var(--px-emerald)', fontSize: '20px' }}>100% SEC-65B</div>
          <div className="kpi-tile-sub">SHA-256 Hash Tamper-Proof</div>
        </div>
      </section>

      {/* FILTER & SEARCH COMMAND BAR */}
      <section className="top100-controls">
        <div className="controls-top-row">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input 
              type="text"
              placeholder="Search by laureate name, award title, specialization, or skill tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="top100-input"
            />
          </div>

          <div className="domain-filters">
            {DOMAIN_OPTIONS.map(dom => (
              <button
                key={dom}
                className={`filter-chip ${selectedDomain === dom ? 'active' : ''}`}
                onClick={() => setSelectedDomain(dom)}
              >
                {dom}
              </button>
            ))}
          </div>
        </div>

        <div className="view-toggle-row">
          <div>
            Displaying <strong>{filteredAwards.length}</strong> of <strong>20</strong> Specialization Excellence Awards
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`top100-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              style={{ padding: '6px 12px' }}
            >
              <LayoutGrid size={13} /> Awards Grid
            </button>
            <button 
              className={`top100-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              style={{ padding: '6px 12px' }}
            >
              <List size={13} /> Citations Table
            </button>
          </div>
        </div>
      </section>

      {/* VIEW 1: EQUAL PRESTIGE AWARDS GRID */}
      {viewMode === 'grid' ? (
        <div className="top20-awards-grid">
          {filteredAwards.map(award => (
            <div 
              key={award.id} 
              className="award-card"
              onClick={() => setActiveAwardee(award)}
            >
              <div>
                <div className="award-card-header">
                  <div className="award-category-pill">
                    <Award size={12} /> {award.award_category}
                  </div>
                  <h3 className="award-title">{award.award_title}</h3>
                </div>

                <div className="awardee-block">
                  <h4 className="awardee-name">{award.student_name}</h4>
                  <div className="awardee-role">{award.role} &bull; {award.team_name}</div>
                </div>

                <div className="awardee-specialization-box">
                  <div className="spec-label">Area of Specialization</div>
                  <div className="spec-value">{award.specialization}</div>
                </div>

                <div className="award-citation-box">
                  "{award.citation}"
                </div>

                <div className="skills-row">
                  {award.skills.map(sk => (
                    <span key={sk} className="skill-tag">{sk}</span>
                  ))}
                </div>
              </div>

              <div className="award-card-footer">
                <span className="ps-chip">{award.ps_id}</span>
                <span className="proof-verified-pill">
                  <ShieldCheck size={13} color="var(--px-emerald)" /> SHA-256 Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* VIEW 2: CITATIONS DATA TABLE */
        <div className="top100-table-container">
          <table className="top100-table">
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Award ID</th>
                <th>Award Title</th>
                <th>Laureate Name</th>
                <th>Specialization Focus</th>
                <th>Category</th>
                <th>Problem Statement</th>
                <th style={{ textAlign: 'center' }}>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {filteredAwards.map(award => (
                <tr key={award.id} onClick={() => setActiveAwardee(award)}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', fontWeight: 800, color: 'var(--px-ink-muted)' }}>
                    {award.id}
                  </td>
                  <td>
                    <strong style={{ color: 'var(--px-ink-primary)' }}>{award.award_title}</strong>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--px-gold)' }}>{award.student_name}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--px-ink-muted)' }}>{award.team_name}</div>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--px-ink-secondary)' }}>
                    {award.specialization}
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--px-blue)' }}>
                      {award.award_category}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--px-ink-secondary)', fontSize: '12px', fontWeight: 700 }}>
                      {award.ps_id}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="top100-btn" style={{ padding: '4px 10px', fontSize: '11px' }}>
                      Citation
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* LAUREATE DOSSIER MODAL DRAWER */}
      {activeAwardee && (
        <div className="top100-modal-overlay" onClick={() => setActiveAwardee(null)}>
          <div className="top100-dossier-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="dossier-header">
              <div>
                <span className="top100-badge-track" style={{ marginBottom: '6px' }}>
                  {activeAwardee.id} &bull; NATIONAL EXCELLENCE LAUREATE
                </span>
                <h2 style={{ margin: '4px 0', fontSize: '20px', fontWeight: 900, color: 'var(--px-ink-primary)' }}>
                  {activeAwardee.award_title}
                </h2>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--px-gold)', marginTop: '4px' }}>
                  {activeAwardee.student_name} &bull; {activeAwardee.role}
                </div>
              </div>
              <button className="dossier-close-btn" onClick={() => setActiveAwardee(null)}>
                <X size={14} />
              </button>
            </div>

            <div className="dossier-section">
              <div className="dossier-sec-title">Domain Specialization</div>
              <div style={{ fontWeight: '800', color: 'var(--px-ink-primary)', fontSize: '15px', marginBottom: '4px' }}>
                {activeAwardee.specialization}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--px-blue)', fontWeight: 700 }}>
                {activeAwardee.award_category}
              </div>
            </div>

            <div className="dossier-section">
              <div className="dossier-sec-title">Official Award Citation</div>
              <div style={{ fontSize: '13.5px', color: 'var(--px-ink-primary)', lineHeight: '1.65', fontWeight: 500, fontStyle: 'italic' }}>
                "{activeAwardee.citation}"
              </div>
            </div>

            <div className="dossier-section">
              <div className="dossier-sec-title">Problem Statement Assignment</div>
              <div style={{ fontWeight: '700', color: 'var(--px-ink-primary)', marginBottom: '4px' }}>
                {activeAwardee.ps_id}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--px-ink-secondary)', lineHeight: '1.5', fontWeight: 500 }}>
                {activeAwardee.ps_title}
              </div>
            </div>

            <div className="dossier-section">
              <div className="dossier-sec-title">Core Competencies & Stack</div>
              <div className="skills-row" style={{ marginTop: '8px' }}>
                {activeAwardee.skills.map(sk => (
                  <span key={sk} className="skill-tag" style={{ fontSize: '11px', padding: '4px 8px' }}>
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            <div className="dossier-section">
              <div className="dossier-sec-title">Institutional Metadata</div>
              <div style={{ fontSize: '12.5px', color: 'var(--px-ink-secondary)', lineHeight: 1.6 }}>
                <strong>Team:</strong> {activeAwardee.team_name} ({activeAwardee.team_id})<br />
                <strong>Department:</strong> {activeAwardee.department}<br />
                <strong>Institution:</strong> {activeAwardee.institution}
              </div>
            </div>

            <div className="dossier-section">
              <div className="dossier-sec-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} color="var(--px-emerald)" />
                  Section 65B Cryptographic Proof Hash
                </span>
                <button 
                  className="top100-btn"
                  style={{ padding: '2px 8px', fontSize: '10px' }}
                  onClick={() => handleCopyHash(activeAwardee.proof_hash)}
                >
                  {copiedHash ? <CheckCircle2 size={10} color="var(--px-emerald)" /> : <Copy size={10} />}
                  {copiedHash ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="hash-box">
                SHA256:{activeAwardee.proof_hash}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
