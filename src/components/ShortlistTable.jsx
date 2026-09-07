import React, { useState } from 'react';
import { Search, Filter, ArrowUpDown, Award, ExternalLink, FileText, CheckCircle2, ChevronRight } from 'lucide-react';

export default function ShortlistTable({ teams, onSelectTeam, onGenerateCertificate, title, subtitle, showStatusPills = true }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('rank');
  const [sortOrder, setSortOrder] = useState('asc');

  // Domains list
  const domains = ['All', ...new Set(teams.map(t => t.domain).filter(Boolean))];

  // Filtering
  const filteredTeams = teams.filter(t => {
    const matchesSearch = 
      t.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.leader_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ps_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ps_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.temp_team_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.reg_no.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDomain = domainFilter === 'All' || t.domain === domainFilter;
    const matchesCat = categoryFilter === 'All' || t.ps_category === categoryFilter;

    return matchesSearch && matchesDomain && matchesCat;
  });

  // Sorting
  const sortedTeams = [...filteredTeams].sort((a, b) => {
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

  const toggleSort = (colKey) => {
    if (sortBy === colKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(colKey);
      setSortOrder('asc');
    }
  };

  return (
    <div className="table-view-container">
      <div className="table-header-block">
        <div>
          <h2 className="table-title">{title}</h2>
          <p className="table-subtitle">{subtitle} • {sortedTeams.length} Teams Listed</p>
        </div>

        <div className="search-filter-row">
          <div className="search-input-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search team, leader, PS ID (e.g. SIH26131), reg no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm('')}>×</button>
            )}
          </div>

          <div className="filters-group">
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Domains ({domains.length - 1})</option>
              {domains.filter(d => d !== 'All').map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Categories</option>
              <option value="Software">Software</option>
              <option value="Hardware">Hardware</option>
            </select>
          </div>
        </div>
      </div>

      <div className="responsive-table-wrapper">
        <table className="enterprise-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort('rank')} className="sortable-th col-rank">
                <span>Rank</span>
                <ArrowUpDown size={12} />
              </th>
              <th onClick={() => toggleSort('temp_team_id')} className="sortable-th col-id">
                <span>Team ID</span>
                <ArrowUpDown size={12} />
              </th>
              <th onClick={() => toggleSort('team_name')} className="sortable-th col-team">
                <span>Team &amp; Leader</span>
                <ArrowUpDown size={12} />
              </th>
              <th onClick={() => toggleSort('ps_id')} className="sortable-th col-ps">
                <span>Problem Statement</span>
                <ArrowUpDown size={12} />
              </th>
              <th onClick={() => toggleSort('domain')} className="sortable-th col-domain">
                <span>Domain Bucket</span>
                <ArrowUpDown size={12} />
              </th>
              <th onClick={() => toggleSort('total_score_50')} className="sortable-th col-score">
                <span>Score / 50</span>
                <ArrowUpDown size={12} />
              </th>
              <th className="col-status">Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-records-cell">
                  No matching teams found for "{searchTerm}". Try refining search filters.
                </td>
              </tr>
            ) : (
              sortedTeams.map((t) => (
                <tr key={t.temp_team_id} className="table-row-item">
                  <td className="col-rank">
                    <span className="rank-badge">#{t.rank}</span>
                  </td>
                  <td className="col-id">
                    <span className="team-id-mono">{t.temp_team_id}</span>
                  </td>
                  <td className="col-team">
                    <div className="team-name-cell" onClick={() => onSelectTeam(t)}>
                      <div className="team-name-text">
                        {t.team_name}
                        {t.team_name === 'CropSignal' && <span className="spot-tag agro">Agri-Pick</span>}
                        {t.team_name === 'Phoenix' && <span className="spot-tag disaster">Disaster-Lead</span>}
                        {t.team_name === 'Hackvision' && <span className="spot-tag ai">AI-Vision</span>}
                      </div>
                      <div className="team-sub-info">
                        <span className="leader-name">Lead: {t.leader_name}</span>
                        <span className="dot-sep">•</span>
                        <span className="reg-no">{t.reg_no}</span>
                        <span className="dot-sep">•</span>
                        <span className="school-text">{t.school}</span>
                      </div>
                    </div>
                  </td>
                  <td className="col-ps">
                    <div className="ps-content-cell">
                      <div className="ps-id-badge">
                        <span className="ps-tag">{t.ps_id}</span>
                        <span className={`cat-pill ${t.ps_category.toLowerCase()}`}>{t.ps_category}</span>
                      </div>
                      <div className="ps-title-text" title={t.ps_title}>{t.ps_title}</div>
                      <div className="ps-org-text">{t.organization}</div>
                    </div>
                  </td>
                  <td className="col-domain">
                    <span className="domain-pill">{t.domain}</span>
                  </td>
                  <td className="col-score">
                    <div className="score-cell">
                      <span className="score-big">{t.total_score_50.toFixed(1)}</span>
                      <span className="score-pct">({t.score_percentage.toFixed(1)}%)</span>
                    </div>
                  </td>
                  <td className="col-status">
                    <span className={`status-pill ${t.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="action-btns-group">
                      <button
                        className="view-btn"
                        title="View Team Audit & Rubric Breakdown"
                        onClick={() => onSelectTeam(t)}
                      >
                        Details
                      </button>
                      <button
                        className="cert-btn"
                        title="Generate Section 65B Digital Certificate"
                        onClick={() => onGenerateCertificate(t)}
                      >
                        <FileText size={13} />
                        <span>Cert</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
