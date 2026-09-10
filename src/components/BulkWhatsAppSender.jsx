import React, { useState, useMemo } from 'react';
import { 
  Send, MessageSquare, CheckCircle2, Clock, Filter, AlertCircle, 
  ExternalLink, Users, Copy, Check, Sparkles, RefreshCw, Smartphone,
  Play, ChevronRight, SkipForward, X, Globe, PhoneForwarded, Edit3, Save
} from 'lucide-react';

export default function BulkWhatsAppSender({ teamRecords, onUpdateContact }) {
  // Target Filter: 'pending' (default) | 'all' | 'shortlist' | 'bench' | 'waitlist' | 'registered'
  const [targetFilter, setTargetFilter] = useState('pending');
  const [platformMode, setPlatformMode] = useState('api'); // 'api' (Universal/Mobile/Desktop) | 'web' (WhatsApp Web) | 'wame'
  
  // Custom Message Template
  const [templateType, setTemplateType] = useState('deadline'); // 'deadline' | 'shortlist_congrats' | 'custom'
  const [customMsgText, setCustomMsgText] = useState(
    'Hello {leader_name} (Team: {team_name}, ID: {temp_team_id}),\n\nThis is an urgent announcement from Rathinam Global University for Smart India Hackathon 2026.\n\nYour team is selected under [{tier_status}] for Problem Statement {ps_id}.\n\nPlease complete your mandatory 6-member student roster and mentor details on the official portal before tonight 12:00 AM Midnight:\nhttps://rgu-sih.vercel.app\n\n*NOTE FOR TEAMS WITH ISSUES / SHORTAGE OF MEMBERS:*\nThose who have issues or shortage of team members - post your team details and issue:\n\nTeam Name: {team_name}\nPS ID: {ps_id}\nStatus of Team: {tier_status}\nIssue: \n\nRegards,\nSIH 2026 Campus Evaluation Authority'
  );

  // Sent Tracking state (Session-based)
  const [sentSet, setSentSet] = useState(() => new Set());
  const [copiedId, setCopiedId] = useState(null);

  // Quick Queue Modal state
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);

  // Inline Number Editor State
  const [editingId, setEditingId] = useState(null);
  const [editingPhone, setEditingPhone] = useState('');

  // Predefined Templates
  const templates = {
    deadline: 'Hello {leader_name} (Team: {team_name}, ID: {temp_team_id}),\n\nUrgent Reminder from Rathinam Global University for Smart India Hackathon 2026.\n\nYour team is selected under [{tier_status}] for Problem Statement {ps_id}.\n\nThe portal closes tonight at 12:00 AM Midnight. Please complete your 6-member roster & mentor details immediately:\nhttps://rgu-sih.vercel.app\n\n*NOTE FOR TEAMS WITH ISSUES / SHORTAGE OF MEMBERS:*\nThose who have issues or shortage of team members - post your team details and issue:\n\nTeam Name: {team_name}\nPS ID: {ps_id}\nStatus of Team: {tier_status}\nIssue: \n\nRegards,\nSIH 2026 Coordination Desk',
    shortlist_congrats: 'Congratulations {leader_name}!\n\nYour team {team_name} ({temp_team_id}) has been officially SHORTLISTED for Smart India Hackathon 2026 for Problem Statement {ps_id}.\n\nPlease complete your official team roster verification on the portal before midnight:\nhttps://rgu-sih.vercel.app\n\n*NOTE FOR TEAMS WITH ISSUES / SHORTAGE OF MEMBERS:*\nThose who have issues or shortage of team members - post your team details and issue:\n\nTeam Name: {team_name}\nPS ID: {ps_id}\nStatus of Team: {tier_status}\nIssue: \n\nRegards,\nRathinam Global University',
    custom: customMsgText
  };

  const activeTemplate = templateType === 'custom' ? customMsgText : templates[templateType];

  // Robust Phone Number Sanitization
  const cleanPhoneNumber = (raw) => {
    if (!raw) return '';
    let p = String(raw).replace(/\D/g, '');
    if (p.startsWith('0')) p = p.substring(1);
    if (p.length === 10) p = '91' + p;
    return p;
  };

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

  const teamsWithNumber = useMemo(() => {
    return targetTeams.filter(t => !!cleanPhoneNumber(t.effectiveWhatsapp || t.effectivePhone));
  }, [targetTeams]);

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

  // Construct WhatsApp URL with platform fallback
  const getWhatsAppLink = (team) => {
    const cleanPhone = cleanPhoneNumber(team.effectiveWhatsapp || team.effectivePhone);
    if (!cleanPhone) return null;
    const msg = encodeURIComponent(buildTeamMessage(team));

    if (platformMode === 'web') {
      return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
    } else if (platformMode === 'wame') {
      return `https://wa.me/${cleanPhone}?text=${msg}`;
    }
    // Default universal API link
    return `https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${msg}&type=phone_number&app_absent=0`;
  };

  const handleMarkSent = (teamId) => {
    setSentSet(prev => new Set([...prev, teamId]));
  };

  // Direct 1-Click Launch
  const handleLaunchWhatsApp = (team) => {
    const url = getWhatsAppLink(team);
    if (!url) {
      alert('No valid phone number for this team leader. Please add a contact number.');
      return;
    }
    handleMarkSent(team.temp_team_id);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyMessage = (team) => {
    const msg = buildTeamMessage(team);
    navigator.clipboard.writeText(msg);
    setCopiedId(team.temp_team_id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Interactive Queue Runner
  const handleStartQueue = () => {
    if (teamsWithNumber.length === 0) return;
    setQueueIndex(0);
    setIsQueueModalOpen(true);
  };

  const activeQueueTeam = teamsWithNumber[queueIndex] || null;

  const handleSendAndAdvance = () => {
    if (!activeQueueTeam) return;
    handleLaunchWhatsApp(activeQueueTeam);
    if (queueIndex < teamsWithNumber.length - 1) {
      setQueueIndex(prev => prev + 1);
    }
  };

  const handleSkipQueue = () => {
    if (queueIndex < teamsWithNumber.length - 1) {
      setQueueIndex(prev => prev + 1);
    }
  };

  const handleSaveInlinePhone = async (tempTeamId) => {
    if (!editingPhone.trim() || !onUpdateContact) return;
    await onUpdateContact(tempTeamId, editingPhone, editingPhone);
    setEditingId(null);
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

        <div className="wa-header-right-actions">
          <button 
            type="button" 
            className="btn-launch-auto-queue"
            onClick={handleStartQueue}
            disabled={teamsWithNumber.length === 0}
          >
            <Play size={16} fill="currentColor" />
            <span>Start 1-Click Queue Runner ({teamsWithNumber.length})</span>
          </button>
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

          {/* Platform URL Selector */}
          <div className="wa-platform-selector">
            <span className="platform-label">Launch Mode:</span>
            <button 
              type="button" 
              className={`platform-pill ${platformMode === 'api' ? 'active' : ''}`}
              onClick={() => setPlatformMode('api')}
              title="Universal Desktop & Mobile Link"
            >
              Universal (Auto)
            </button>
            <button 
              type="button" 
              className={`platform-pill ${platformMode === 'web' ? 'active' : ''}`}
              onClick={() => setPlatformMode('web')}
              title="Direct web.whatsapp.com Link"
            >
              WhatsApp Web
            </button>
            <button 
              type="button" 
              className={`platform-pill ${platformMode === 'wame' ? 'active' : ''}`}
              onClick={() => setPlatformMode('wame')}
              title="wa.me Short Link"
            >
              wa.me
            </button>
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
              rows={5}
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
            <h4>Recipient Queue ({teamsWithNumber.length} Leaders Ready with Numbers)</h4>
            <span className="header-subtext">Click 'Send WhatsApp' to instantly launch chat in WhatsApp with pre-filled message text.</span>
          </div>

          <div className="header-right-tools">
            <button 
              type="button"
              className="btn-reset-sent-state"
              onClick={() => setSentSet(new Set())}
              title="Reset dispatched tracker"
            >
              <RefreshCw size={13} />
              <span>Reset Dispatched ({sentSet.size})</span>
            </button>
          </div>
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
                <th>One-Click Send Action</th>
              </tr>
            </thead>
            <tbody>
              {targetTeams.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state-box">
                    No recipients found for the selected filter.
                  </td>
                </tr>
              ) : (
                targetTeams.map((team) => {
                  const isSent = sentSet.has(team.temp_team_id);
                  const cleanPhone = cleanPhoneNumber(team.effectiveWhatsapp || team.effectivePhone);
                  const isCopied = copiedId === team.temp_team_id;
                  const isInlineEditing = editingId === team.temp_team_id;

                  return (
                    <tr key={`wa-${team.temp_team_id}`} className={`table-row ${isSent ? 'row-sent-done' : ''}`}>
                      <td>
                        {isSent ? (
                          <span className="badge-wa-sent">
                            <Check size={12} /> Dispatched
                          </span>
                        ) : cleanPhone ? (
                          <span className="badge-wa-queued">
                            <Clock size={12} /> Ready
                          </span>
                        ) : (
                          <span className="badge-wa-missing">
                            No Number
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
                        {isInlineEditing ? (
                          <div className="inline-num-edit-wrap">
                            <input 
                              type="tel"
                              value={editingPhone}
                              onChange={(e) => setEditingPhone(e.target.value)}
                              placeholder="10-digit number"
                              className="inline-tel-input"
                              autoFocus
                            />
                            <button 
                              type="button"
                              className="btn-inline-save"
                              onClick={() => handleSaveInlinePhone(team.temp_team_id)}
                            >
                              <Save size={12} />
                            </button>
                            <button 
                              type="button"
                              className="btn-inline-cancel"
                              onClick={() => setEditingId(null)}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="num-pill-box">
                            <Smartphone size={13} className={cleanPhone ? "text-emerald" : "text-gray"} />
                            <span className="font-mono font-bold">{cleanPhone || 'Missing'}</span>
                            <button 
                              type="button"
                              className="btn-mini-edit"
                              onClick={() => {
                                setEditingId(team.temp_team_id);
                                setEditingPhone(cleanPhone || '');
                              }}
                              title="Edit number"
                            >
                              <Edit3 size={11} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="wa-action-cell-buttons">
                          {cleanPhone ? (
                            <button
                              type="button"
                              className={`btn-send-wa-action ${isSent ? 'already-sent' : ''}`}
                              onClick={() => handleLaunchWhatsApp(team)}
                              title={`Send WhatsApp message to ${team.leader_name}`}
                            >
                              <Send size={14} />
                              <span>{isSent ? 'Resend WA' : 'Send WhatsApp'}</span>
                            </button>
                          ) : (
                            <button 
                              type="button"
                              className="btn-add-number-quick"
                              onClick={() => {
                                setEditingId(team.temp_team_id);
                                setEditingPhone('');
                              }}
                            >
                              + Add Number
                            </button>
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

      {/* Quick Queue Runner Modal */}
      {isQueueModalOpen && activeQueueTeam && (
        <div className="queue-modal-overlay">
          <div className="queue-modal-card">
            <div className="queue-modal-header">
              <div className="queue-modal-badge">
                <Play size={15} fill="currentColor" />
                <span>Automated Queue Dispatcher</span>
              </div>
              <button 
                type="button" 
                className="btn-close-queue"
                onClick={() => setIsQueueModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="queue-progress-bar-wrap">
              <div 
                className="queue-progress-fill" 
                style={{ width: `${((queueIndex + 1) / teamsWithNumber.length) * 100}%` }}
              ></div>
            </div>

            <div className="queue-modal-content">
              <div className="queue-team-info-banner">
                <div className="queue-info-left">
                  <span className="queue-step-num">Team {queueIndex + 1} of {teamsWithNumber.length}</span>
                  <h3>{activeQueueTeam.team_name} ({activeQueueTeam.temp_team_id})</h3>
                  <p>Leader: <strong>{activeQueueTeam.leader_name}</strong> • PS: {activeQueueTeam.ps_id} • Status: {activeQueueTeam.status}</p>
                </div>
                <div className="queue-phone-tag">
                  <Smartphone size={16} />
                  <span>{cleanPhoneNumber(activeQueueTeam.effectiveWhatsapp || activeQueueTeam.effectivePhone)}</span>
                </div>
              </div>

              <div className="queue-preview-message-box">
                <label>Personalized Message Preview:</label>
                <pre>{buildTeamMessage(activeQueueTeam)}</pre>
              </div>
            </div>

            <div className="queue-modal-actions">
              <button 
                type="button" 
                className="btn-queue-skip"
                onClick={handleSkipQueue}
              >
                <SkipForward size={15} />
                <span>Skip</span>
              </button>

              <button 
                type="button" 
                className="btn-queue-send-primary"
                onClick={handleSendAndAdvance}
              >
                <Send size={16} />
                <span>Send WhatsApp &amp; Next Team &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
