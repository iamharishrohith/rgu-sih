import React, { useState } from 'react';
import { Award, Trophy, Sparkles, Shield, Cpu, Leaf, HeartPulse, Compass, Zap, Search, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AwardsShowcase({ awards, onSelectTeam, onGenerateCertificate }) {
  const [searchTerm, setSearchTerm] = useState('');

  const triggerCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const filteredAwards = awards.filter(a => 
    a.award_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.winning_team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.team_leader_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.theme_domain_scope.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.problem_statement_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="awards-showcase-container">
      <div className="awards-header-section">
        <div className="awards-title-box">
          <div className="awards-badge" onClick={triggerCelebration}>
            <Trophy size={16} />
            <span>20 SPECIAL EXCELLENCE AWARDS • EQUAL PRESTIGE STANDING</span>
          </div>
          <h2 className="section-main-title">Excellence &amp; Innovation Honors</h2>
          <p className="section-main-desc">
            Celebrating domain breakthroughs, cutting-edge hardware, female leadership, and interdisciplinary engineering across all schools.
          </p>
        </div>

        <div className="search-input-box awards-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search award, winning team, domain, leader..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="awards-grid">
        {filteredAwards.map((aw, idx) => (
          <div key={aw.award_id} className="award-card">
            <div className="award-card-header">
              <span className="award-id-tag">{aw.award_id}</span>
              <span className="award-theme-pill">{aw.theme_domain_scope}</span>
            </div>

            <h3 className="award-card-title">{aw.award_title}</h3>

            <div className="winner-box">
              <div className="winner-label">Conferred to</div>
              <div className="winner-name-row">
                <span className="winner-team-name">{aw.winning_team_name}</span>
                <span className="winner-team-id">{aw.winning_team_id}</span>
              </div>
              <div className="winner-details">
                <span>Leader: <strong>{aw.team_leader_name}</strong></span>
                <span>•</span>
                <span>{aw.school_department}</span>
              </div>
            </div>

            <div className="award-ps-info">
              <div className="award-ps-header">
                <span className="ps-code">{aw.problem_statement_id}</span>
                <span className="score-highlight">{aw.total_score_50.toFixed(1)} / 50 ({aw.score_percentage.toFixed(1)}%)</span>
              </div>
              <div className="award-ps-title">{aw.problem_statement_title}</div>
            </div>

            <div className="award-citation">
              <strong>Jury Citation:</strong> "{aw.citation_merit_rationale}"
            </div>

            <div className="award-card-footer">
              <button
                className="award-cert-btn"
                onClick={() => onGenerateCertificate({
                  temp_team_id: aw.winning_team_id,
                  team_name: aw.winning_team_name,
                  leader_name: aw.team_leader_name,
                  reg_no: aw.register_no,
                  school: aw.school_department,
                  ps_id: aw.problem_statement_id,
                  ps_title: aw.problem_statement_title,
                  total_score_50: aw.total_score_50,
                  score_percentage: aw.score_percentage,
                  award_title: aw.award_title
                })}
              >
                <FileText size={13} />
                <span>Download Award Certificate</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
