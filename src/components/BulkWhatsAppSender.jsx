import React, { useState, useMemo } from 'react';
import { 
  Send, MessageSquare, CheckCircle2, Clock, Filter, AlertCircle, 
  ExternalLink, Users, Copy, Check, Sparkles, RefreshCw, Smartphone
} from 'lucide-react';

export default function BulkWhatsAppSender({ teamRecords, onUpdateContact }) {
  // Target Filter: 'pending' (default) | 'all' | 'shortlist' | 'bench' | 'waitlist' | 'registered'
  const [targetFilter, setTargetFilter] = useState('pending');
  
  // Custom Message Template
  const [templateType, setTemplateType] = useState('deadline'); // 'deadline' | 'shortlist_congrats' | 'custom'
  const [customMsgText, setCustomMsgText] = useState(
    'Hello {leader_name} (Team: {team_name}, ID: {temp_team_id}),\n\nThis is an urgent announcement from Rathinam Global University for Smart India Hackathon 2026.\n\nYour team is selected under [{tier_status}] for Problem Statement {ps_id}.\n\nPlease complete your mandatory 6-member student roster and mentor details on the official portal before tonight 12:00 AM Midnight:\nhttps://rgu-sih.vercel.app\n\nRegards,\nSIH 2026 Campus Evaluation Authority'
  );

  // Sent Tracking state (Session-based)
  const [sentSet, setSentSet] = useState(() => new Set());
  const [copiedId, setCopiedId] = useState(null);

  // Predefined Templates
  const templates = {
    deadline: 'Hello {leader_name} (Team: {team_name}, ID: {temp_team_id}),\n\nUrgent Reminder from Rathinam Global University for Smart India Hackathon 2026.\n\nYour team is selected under [{tier_status}] for Problem Statement {ps_id}.\n\nThe portal closes tonight at 12:00 AM Midnight. Please complete your 6-member roster & mentor details immediately:\nhttps://rgu-sih.vercel.app\n\nRegards,\nSIH 2026 Coordination Desk',
    shortlist_congrats: 'Congratulations {leader_name}!\n\nYour team {team_name} ({temp_team_id}) has been officially SHORTLISTED for Smart India Hackathon 2026 for Problem Statement {ps_id}.\n\nPlease complete your official team roster verification on the portal before midnight:\nhttps://rgu-sih.vercel.app\n\nRegards,\nRathinam Global University',
    custom: customMsgText
  };

  const activeTemplate = templateType === 'custom' ? customMsgText : templates[templateType];

  // Filtered recipient candidates
  const targetTeams = useMemo(() => {
    return teamRecords.filter(t => {
      if (targetFilter === 'pending') return !t.isRegistered;
      if (targetFilter === 'registered') return t.isRegistered;
      if (targetFilter === 'shortlist') return t.status === 'Shortlist';
      if (targetFilter === 'bench') return t.status === 'Bench';
      if (targetFilter === 'waitlist') return t.status === 'Waitlist';
      return true; // 'all'
    });
  }, [teamRecords, targetFilter]);

  const teamsWithNumber = useMemo(() => targetTeams.filter(t => !!t.effectiveWhatsapp || !!t.effectivePhone), [targetTeams]);
  const teamsWithoutNumber = useMemo(() => targetTeams.filter(t => !t.effectiveWhatsapp && !t.effectivePhone), [targetTeams]);

  // Interpolate message for a specific team
  const buildTeamMessage = (team) => {
    const rawMsg = activeTemplate;
    return rawMsg
      .replace(/{leader_name}/g, team.leader_name || 'Team Leader')
      .replace(/{team_name}/g, team.team_name || 'Innovators')
      .replace(/{temp_team_id}/g, team.temp_team_id || '')
      .replace(/{ps_id}/g, team.ps_id || 'SIH2026')
      .replace(/{tier_status}/g, team.status || 'Finalist')
      .replace(/{school}/g, team.school || 'RGU');
  };

  const getWhatsAppLink = (team) => {
    const phone = (team.effectiveWhatsapp || team.effectivePhone || '').replace(/\D/g, '');
    if (!phone) return null;
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const msg = encodeURIComponent(buildTeamMessage(team));
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  };

  const handleMarkSent = (teamId) => {
    setSentSet(prev => new Set([...prev, teamId]));
  };

  const handleCopyMessage = (team) => {
    const msg = buildTeamMessage(team);
    navigator.clipboard.writeText(msg);
    setCopiedId(team.temp_team_id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bulk-whatsapp-dashboard">
      {/* Top Banner & Header */}
      <div className="whatsapp-master-header">
        <div className="wa-header-left">
          <div className="wa-icon-badge-big">
            <MessageSquare size={26} />
          </div>
          <div>
            <h3>Bulk WhatsApp Dispatch &amp; Broadcast Desk</h3>
            <p>One-click direct WhatsApp message launcher to Team Leaders with dynamic personalized placeholders.</p>
          </div>
        </div>

        <div className="wa-header-stats-strip">
          <div className="wa-stat-pill">
            <Users size={14} className="text-indigo" />
            <span>Target Pool: <strong>{targetTeams.length}</strong> TLs</span>
          </div>
          <div className="wa-stat-pill">
            <Smartphone size={14} className="text-emerald" />
            <span>With Numbers: <strong>{teamsWithNumber.length}</strong></span>
          </div>
          <div className="wa-stat-pill">
            <CheckCircle2 size={14} className="text-emerald" />
            <span>Dispatched: <strong>{sentSet.size}</strong></span>
          </div>
        </div>
      </div>

      {/* Control Grid: Filters & Message Composer */}
      <div className="wa-composer-grid">
        {/* Step 1: Filter Target Audience */}
        <div className="wa-card audience-card">
          <div className="wa-card-header">
            <Filter size={16} className="text-indigo" />
            <h4>1. Select Recipient Audience</h4>
          </div>

          <div className="audience-options-grid">
            <button 
              type="button"
              className={`audience-btn ${targetFilter === 'pending' ? 'selected' : ''}`}
              onClick={() => setTargetFilter('pending')}
            >
              <div className="aud-btn-title">Pending Forms Only</div>
              <span className="aud-btn-sub">{teamRecords.filter(t => !t.isRegistered).length} Teams</span>
            </button>

            <button 
              type="button"
              className={`audience-btn ${targetFilter === 'shortlist' ? 'selected' : ''}`}
              onClick={() => setTargetFilter('shortlist')}
            >
              <div className="aud-btn-title">Shortlist Finalists</div>
              <span className="aud-btn-sub">{teamRecords.filter(t => t.status === 'Shortlist').length} Teams</span>
            </button>

            <button 
              type="button"
              className={`audience-btn ${targetFilter === 'bench' ? 'selected' : ''}`}
              onClick={() => setTargetFilter('bench')}
            >
              <div className="aud-btn-title">Bench Standby</div>
              <span className="aud-btn-sub">{teamRecords.filter(t => t.status === 'Bench').length} Teams</span>
            </button>

            <button 
              type="button"
              className={`audience-btn ${targetFilter === 'waitlist' ? 'selected' : ''}`}
              onClick={() => setTargetFilter('waitlist')}
            >
              <div className="aud-btn-title">Waitlist Pool</div>
              <span className="aud-btn-sub">{teamRecords.filter(t => t.status === 'Waitlist').length} Teams</span>
            </button>

            <button 
              type="button"
              className={`audience-btn ${targetFilter === 'all' ? 'selected' : ''}`}
              onClick={() => setTargetFilter('all')}
            >
              <div className="aud-btn-title">All Finalized TLs</div>
              <span className="aud-btn-sub">{teamRecords.length} Teams</span>
            </button>
          </div>

          {/* Quick Stats Note */}
          <div className="audience-note-box">
            <Sparkles size={14} className="text-amber" />
            <span>Targeting <strong>{teamsWithNumber.length}</strong> leaders with active WhatsApp phone numbers.</span>
          </div>
        </div>

        {/* Step 2: Message Template & Variables */}
        <div className="wa-card template-card">
          <div className="wa-card-header">
            <MessageSquare size={16} className="text-emerald" />
            <h4>2. Broadcast Message Template</h4>
          </div>

          <div className="template-pills-row">
            <button 
              type="button"
              className={`tpl-pill ${templateType === 'deadline' ? 'active' : ''}`}
              onClick={() => setTemplateType('deadline')}
            >
              Midnight Deadline
            </button>
            <button 
              type="button"
              className={`tpl-pill ${templateType === 'shortlist_congrats' ? 'active' : ''}`}
              onClick={() => setTemplateType('shortlist_congrats')}
            >
              Shortlist Congrats
            </button>
            <button 
              type="button"
              className={`tpl-pill ${templateType === 'custom' ? 'active' : ''}`}
              onClick={() => setTemplateType('custom')}
            >
              Custom Editor
            </button>
          </div>

          {templateType === 'custom' ? (
            <textarea
              rows={6}
              className="wa-template-textarea"
              value={customMsgText}
              onChange={(e) => setCustomMsgText(e.target.value)}
              placeholder="Type custom message with {leader_name}, {team_name}, {temp_team_id}, {ps_id}..."
            />
          ) : (
            <div className="wa-template-preview-box">
              <pre>{activeTemplate}</pre>
            </div>
          )}

          <div className="wa-tags-legend">
            <span className="legend-label">Placeholders:</span>
            <code>{'{leader_name}'}</code>
            <code>{'{team_name}'}</code>
            <code>{'{temp_team_id}'}</code>
            <code>{'{ps_id}'}</code>
            <code>{'{tier_status}'}</code>
          </div>
        </div>
      </div>

      {/* Step 3: Recipient Action Table */}
      <div className="wa-recipients-card">
        <div className="wa-recipients-header">
          <div className="header-title-wrap">
            <h4>Recipient Queue ({teamsWithNumber.length} Ready to Send)</h4>
            <span className="header-subtext">Click 'Send WhatsApp' to launch official chat in WhatsApp Web / App with pre-filled message.</span>
          </div>

          <button 
            type="button"
            className="btn-reset-sent-state"
            onClick={() => setSentSet(new Set())}
            title="Reset dispatched tracker"
          >
            <RefreshCw size={13} />
            <span>Reset Tracker</span>
          </button>
        </div>

        <div className="table-scroll-box">
          <table className="modern-teams-table wa-queue-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Team ID</th>
                <th>Team Name</th>
                <th>Team Leader</th>
                <th>Tier</th>
                <th>Form Status</th>
                <th>WhatsApp Phone</th>
                <th>Message Action</th>
              </tr>
            </thead>
            <tbody>
              {teamsWithNumber.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state-box">
                    No recipients with phone numbers found for the selected filter.
                  </td>
                </tr>
              ) : (
                teamsWithNumber.map((team) => {
                  const isSent = sentSet.has(team.temp_team_id);
                  const waUrl = getWhatsAppLink(team);
                  const isCopied = copiedId === team.temp_team_id;

                  return (
                    <tr key={`wa-${team.temp_team_id}`} className={`table-row ${isSent ? 'row-sent-done' : ''}`}>
                      <td>
                        {isSent ? (
                          <span className="badge-wa-sent">
                            <Check size={12} /> Sent
                          </span>
                        ) : (
                          <span className="badge-wa-queued">
                            <Clock size={12} /> Ready
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="team-id-badge">{team.temp_team_id}</span>
                      </td>
                      <td>
                        <strong className="team-name-strong">{team.team_name}</strong>
                      </td>
                      <td>
                        <div className="leader-name-bold">{team.leader_name}</div>
                        <div className="school-name-sub">{team.reg_no}</div>
                      </td>
                      <td>
                        <span className={`status-badge ${team.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {team.status}
                        </span>
                      </td>
                      <td>
                        {team.isRegistered ? (
                          <span className="badge-form-done">Completed</span>
                        ) : (
                          <span className="badge-form-pending">Pending</span>
                        )}
                      </td>
                      <td>
                        <div className="num-pill-box">
                          <Smartphone size={13} className="text-emerald" />
                          <span className="font-mono font-bold">{team.effectiveWhatsapp || team.effectivePhone}</span>
                        </div>
                      </td>
                      <td>
                        <div className="wa-action-cell-buttons">
                          {waUrl ? (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`btn-send-wa-action ${isSent ? 'already-sent' : ''}`}
                              onClick={() => handleMarkSent(team.temp_team_id)}
                            >
                              <Send size={13} />
                              <span>{isSent ? 'Resend WA' : 'Send WhatsApp'}</span>
                            </a>
                          ) : (
                            <span className="no-num-tag">No Number</span>
                          )}

                          <button 
                            type="button"
                            className="btn-copy-msg-pill"
                            onClick={() => handleCopyMessage(team)}
                            title="Copy personalized text to clipboard"
                          >
                            {isCopied ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
