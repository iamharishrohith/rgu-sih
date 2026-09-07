import React, { useState } from 'react';
import { Layers, AlertCircle, CheckCircle, Clock, Search, HelpCircle, ArrowRight } from 'lucide-react';

export default function DuplicatePSExplorer({ duplicateData, onSelectTeam }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCount, setFilterCount] = useState('All');

  const filteredData = duplicateData.filter(d => {
    const matchesSearch = 
      d.problem_statement_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.problem_statement_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.domain_bucket.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.shortlisted_team_1st_rank.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCount = 
      filterCount === 'All' || 
      (filterCount === 'high' && d.total_competing_teams >= 5) ||
      (filterCount === 'med' && d.total_competing_teams >= 3 && d.total_competing_teams < 5) ||
      (filterCount === 'low' && d.total_competing_teams === 2);

    return matchesSearch && matchesCount;
  });

  return (
    <div className="duplicate-ps-container">
      <div className="dup-header-box">
        <div>
          <div className="dup-badge">
            <Layers size={15} />
            <span>GOVERNANCE &amp; ALLOCATION POLICY NOTE</span>
          </div>
          <h2 className="section-main-title">Contested Problem Statement Audit</h2>
          <p className="section-main-desc">
            Full transparency report on the 43 Problem Statements contested by multiple teams. The #1 highest-scoring team was prioritized for Shortlist to maximize diversity (80 unique PS). Duplicate competitors are allocated to Bench and Waitlist.
          </p>
        </div>

        <div className="search-filter-row">
          <div className="search-input-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search PS ID, Title, Domain, Competing Teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={filterCount}
            onChange={(e) => setFilterCount(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Contested PS ({duplicateData.length})</option>
            <option value="high">High Competition (≥ 5 Teams)</option>
            <option value="med">Medium Competition (3 - 4 Teams)</option>
            <option value="low">Dual Competing (2 Teams)</option>
          </select>
        </div>
      </div>

      <div className="dup-cards-list">
        {filteredData.map((item) => (
          <div key={item.problem_statement_id} className="dup-card">
            <div className="dup-card-top">
              <div className="dup-ps-tags">
                <span className="ps-id-bold">{item.problem_statement_id}</span>
                <span className="ps-cat-tag">{item.category}</span>
                <span className="ps-domain-tag">{item.domain_bucket}</span>
              </div>
              <div className="dup-count-badge">
                <span className="count-num">{item.total_competing_teams}</span>
                <span className="count-label">Competing Teams</span>
              </div>
            </div>

            <h3 className="dup-ps-title">{item.problem_statement_title}</h3>
            <div className="dup-ministry">{item.ministry_organization}</div>

            <div className="allocation-breakdown-grid">
              {/* Shortlist Pick */}
              <div className="tier-box shortlist-pick">
                <div className="tier-header">
                  <CheckCircle size={14} />
                  <span>1st Rank (Shortlisted to Finals)</span>
                </div>
                <div className="tier-body">
                  {item.shortlisted_team_1st_rank || 'None (Allocated to Bench)'}
                </div>
              </div>

              {/* Bench Standby */}
              <div className="tier-box bench-pick">
                <div className="tier-header">
                  <Clock size={14} />
                  <span>2nd Rank (Bench Standby)</span>
                </div>
                <div className="tier-body">
                  {item.bench_team_2nd_rank || 'None'}
                </div>
              </div>

              {/* Waitlist Pick */}
              <div className="tier-box waitlist-pick">
                <div className="tier-header">
                  <Layers size={14} />
                  <span>2nd / 3rd Rank (Waitlist Pool)</span>
                </div>
                <div className="tier-body">
                  {item.waitlisted_team_2nd_3rd_rank || 'None'}
                </div>
              </div>

              {/* Duplicate Overflow */}
              {item.not_shortlisted_teams_3rd_plus && item.not_shortlisted_teams_3rd_plus !== 'None' && (
                <div className="tier-box overflow-pick">
                  <div className="tier-header">
                    <AlertCircle size={14} />
                    <span>3rd+ Rank (Not Shortlisted)</span>
                  </div>
                  <div className="tier-body">
                    {item.not_shortlisted_teams_3rd_plus}
                  </div>
                </div>
              )}
            </div>

            <div className="dup-card-footer">
              <span className="policy-note-text">
                <strong>Allocation Directive:</strong> {item.resolution_policy}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
