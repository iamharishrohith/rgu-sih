import React from 'react';
import { Award, Users, FileCheck2, Cpu, Sparkles, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

export default function HeroStats({ stats, onSelectFilter }) {
  const cards = [
    {
      title: 'Verified Teams',
      count: stats.totalTeams,
      subtext: '100% Deduplicated Entries',
      icon: Users,
      color: 'slate',
      id: 'all_teams'
    },
    {
      title: 'Unique Problem Statements',
      count: stats.uniquePSCount,
      subtext: 'Software & Hardware Themes',
      icon: Cpu,
      color: 'blue',
      id: 'all_teams'
    },
    {
      title: 'Primary Shortlist',
      count: stats.shortlistCount,
      subtext: '100% Unique Problem Statements',
      icon: CheckCircle2,
      color: 'emerald',
      id: 'shortlist',
      highlight: true
    },
    {
      title: 'Bench & Waitlist Standby',
      count: `${stats.benchCount} + ${stats.waitlistCount}`,
      subtext: 'Category & Domain Balancing',
      icon: TrendingUp,
      color: 'amber',
      id: 'standby'
    },
    {
      title: 'Contested Problem Statements',
      count: stats.contestedPSCount,
      subtext: 'Multi-Team Topics Partitioned',
      icon: AlertTriangle,
      color: 'purple',
      id: 'duplicate_ps'
    },
    {
      title: 'Excellence Awards',
      count: stats.awardsCount,
      subtext: 'Equal Standing across Tracks',
      icon: Award,
      color: 'gold',
      id: 'awards'
    }
  ];

  return (
    <section className="hero-stats-section">
      <div className="hero-banner">
        <div className="hero-badge">
          <Sparkles size={14} />
          <span>OFFICIAL JURY PROCLAMATION &amp; SHORTLIST NOTIFICATION</span>
        </div>
        <h1 className="hero-heading">
          SIH 2026 Internal Hackathon Results &amp; Honors
        </h1>
        <p className="hero-desc">
          Evaluated across 5 rigorous parameters under strict compliance with BSA 2023 &amp; Section 65B forensic verification. Top 80 candidates represent 80 distinct national problem statements.
        </p>
      </div>

      <div className="kpi-grid">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`kpi-card ${card.color} ${card.highlight ? 'highlight-border' : ''}`}
              onClick={() => onSelectFilter && onSelectFilter(card.id)}
            >
              <div className="kpi-top">
                <span className="kpi-title">{card.title}</span>
                <div className={`kpi-icon-wrapper ${card.color}`}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="kpi-count">{card.count}</div>
              <div className="kpi-subtext">{card.subtext}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
