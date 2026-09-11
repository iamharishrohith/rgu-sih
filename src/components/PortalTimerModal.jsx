import React, { useState, useEffect } from 'react';
import { 
  Lock, Unlock, Clock, AlertTriangle, CheckCircle2, Calendar, 
  Sparkles, X, ArrowRight, ShieldCheck, Hourglass, Zap
} from 'lucide-react';

export default function PortalTimerModal({ 
  isOpen, 
  onClose, 
  portalSettings, 
  onUpdatePortalSettings 
}) {
  if (!isOpen) return null;

  const isCurrentlyClosed = portalSettings?.isClosed ?? true;
  const currentTimestamp = portalSettings?.closeTimestamp ?? null;

  // Selected Option: '1pm' | '30m' | '1h' | '2h' | '4h' | '12h' | 'midnight' | 'indefinite' | 'custom'
  const [selectedPreset, setSelectedPreset] = useState('1pm');
  const [customDateTime, setCustomDateTime] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    // Format for datetime-local: YYYY-MM-DDTHH:mm
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${mins}`;
  });

  const [previewCloseTime, setPreviewCloseTime] = useState('');

  // Calculate projected closing date/time based on selection
  useEffect(() => {
    const now = new Date();
    let target = null;

    if (selectedPreset === '1pm') {
      let today1pm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0, 0);
      if (today1pm.getTime() <= now.getTime()) {
        today1pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 13, 0, 0, 0);
      }
      target = today1pm;
    } else if (selectedPreset === '30m') {
      target = new Date(now.getTime() + 30 * 60 * 1000);
    } else if (selectedPreset === '1h') {
      target = new Date(now.getTime() + 60 * 60 * 1000);
    } else if (selectedPreset === '2h') {
      target = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    } else if (selectedPreset === '4h') {
      target = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    } else if (selectedPreset === '12h') {
      target = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    } else if (selectedPreset === 'midnight') {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      if (target.getTime() <= now.getTime()) {
        target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);
      }
    } else if (selectedPreset === 'custom') {
      if (customDateTime) {
        target = new Date(customDateTime);
      }
    }

    if (selectedPreset === 'indefinite') {
      setPreviewCloseTime('Will remain open indefinitely until manually locked by Admin.');
    } else if (target && !isNaN(target.getTime())) {
      setPreviewCloseTime(target.toLocaleString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }));
    } else {
      setPreviewCloseTime('Invalid target time');
    }
  }, [selectedPreset, customDateTime]);

  const handleApplyReopen = () => {
    const now = new Date();
    let closeTimestamp = null;
    let label = '';

    if (selectedPreset === '1pm') {
      let target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0, 0);
      if (target.getTime() <= now.getTime()) {
        target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 13, 0, 0, 0);
      }
      closeTimestamp = target.getTime();
      label = 'Open until 1:00 PM Today';
    } else if (selectedPreset === '30m') {
      closeTimestamp = now.getTime() + 30 * 60 * 1000;
      label = '+30 Minutes Extension';
    } else if (selectedPreset === '1h') {
      closeTimestamp = now.getTime() + 60 * 60 * 1000;
      label = '+1 Hour Extension';
    } else if (selectedPreset === '2h') {
      closeTimestamp = now.getTime() + 2 * 60 * 60 * 1000;
      label = '+2 Hours Extension';
    } else if (selectedPreset === '4h') {
      closeTimestamp = now.getTime() + 4 * 60 * 60 * 1000;
      label = '+4 Hours Extension';
    } else if (selectedPreset === '12h') {
      closeTimestamp = now.getTime() + 12 * 60 * 60 * 1000;
      label = '+12 Hours Extension';
    } else if (selectedPreset === 'midnight') {
      let target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      if (target.getTime() <= now.getTime()) {
        target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);
      }
      closeTimestamp = target.getTime();
      label = 'Open until Midnight (12:00 AM)';
    } else if (selectedPreset === 'custom') {
      const parsed = new Date(customDateTime).getTime();
      if (isNaN(parsed) || parsed <= Date.now()) {
        alert('Please select a valid future date & time for portal closure.');
        return;
      }
      closeTimestamp = parsed;
      label = 'Custom Scheduled Deadline';
    } else if (selectedPreset === 'indefinite') {
      closeTimestamp = null;
      label = 'Open Indefinitely (Manual Lock)';
    }

    onUpdatePortalSettings({
      isClosed: false,
      closeTimestamp,
      timerPreset: selectedPreset,
      presetLabel: label,
      lastUpdated: new Date().toISOString()
    });

    onClose();
  };

  const handleForceCloseNow = () => {
    onUpdatePortalSettings({
      isClosed: true,
      closeTimestamp: null,
      timerPreset: null,
      presetLabel: 'Manually Locked by Admin',
      lastUpdated: new Date().toISOString()
    });

    onClose();
  };

  return (
    <div className="modal-backdrop-blur">
      <div className="portal-timer-modal-card">
        {/* Top Header */}
        <div className="timer-modal-header">
          <div className="timer-modal-title-group">
            <div className={`timer-modal-icon-badge ${isCurrentlyClosed ? 'closed' : 'open'}`}>
              {isCurrentlyClosed ? <Lock size={20} /> : <Unlock size={20} />}
            </div>
            <div>
              <h3>Candidate Registration Portal Access &amp; Timer</h3>
              <p>Control portal submission window and automatic closure schedule</p>
            </div>
          </div>
          <button className="timer-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Current Live State Banner */}
        <div className={`timer-status-banner ${isCurrentlyClosed ? 'status-closed' : 'status-open'}`}>
          <div className="status-banner-left">
            <div className="status-indicator-dot"></div>
            <div>
              <strong className="status-title-text">
                Current Portal Status: {isCurrentlyClosed ? 'LOCKED / CLOSED' : 'ACTIVE & ACCEPTING REGISTRATIONS'}
              </strong>
              <div className="status-subtitle-text">
                {isCurrentlyClosed 
                  ? 'Candidate desk is currently in locked / read-only mode for students.'
                  : currentTimestamp 
                    ? `Automatically scheduled to close at: ${new Date(currentTimestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                    : 'Portal is open with no automatic deadline timer.'}
              </div>
            </div>
          </div>

          {!isCurrentlyClosed && (
            <button className="btn-force-lock-now" onClick={handleForceCloseNow}>
              <Lock size={14} />
              <span>Lock Portal Now</span>
            </button>
          )}
        </div>

        {/* Timer Selection Form */}
        <div className="timer-modal-body">
          <label className="timer-section-label">
            <Clock size={15} />
            <span>Select Automatic Closure Schedule / Reopen Duration:</span>
          </label>

          <div className="timer-presets-grid">
            <button 
              type="button"
              className={`preset-pill-btn ${selectedPreset === '1pm' ? 'active' : ''}`}
              onClick={() => setSelectedPreset('1pm')}
            >
              <Sparkles size={15} className="text-emerald" />
              <div className="preset-btn-text">
                <strong>Today 1:00 PM</strong>
                <span>Official Extension</span>
              </div>
            </button>

            <button 
              type="button"
              className={`preset-pill-btn ${selectedPreset === '30m' ? 'active' : ''}`}
              onClick={() => setSelectedPreset('30m')}
            >
              <Zap size={15} />
              <div className="preset-btn-text">
                <strong>+30 Mins</strong>
                <span>Quick Extension</span>
              </div>
            </button>

            <button 
              type="button"
              className={`preset-pill-btn ${selectedPreset === '1h' ? 'active' : ''}`}
              onClick={() => setSelectedPreset('1h')}
            >
              <Clock size={15} />
              <div className="preset-btn-text">
                <strong>+1 Hour</strong>
                <span>Standard Extension</span>
              </div>
            </button>

            <button 
              type="button"
              className={`preset-pill-btn ${selectedPreset === '2h' ? 'active' : ''}`}
              onClick={() => setSelectedPreset('2h')}
            >
              <Hourglass size={15} />
              <div className="preset-btn-text">
                <strong>+2 Hours</strong>
                <span>Extended Window</span>
              </div>
            </button>

            <button 
              type="button"
              className={`preset-pill-btn ${selectedPreset === '4h' ? 'active' : ''}`}
              onClick={() => setSelectedPreset('4h')}
            >
              <Clock size={15} />
              <div className="preset-btn-text">
                <strong>+4 Hours</strong>
                <span>Half-Day Buffer</span>
              </div>
            </button>

            <button 
              type="button"
              className={`preset-pill-btn ${selectedPreset === 'midnight' ? 'active' : ''}`}
              onClick={() => setSelectedPreset('midnight')}
            >
              <ShieldCheck size={15} />
              <div className="preset-btn-text">
                <strong>Tonight 11:59 PM</strong>
                <span>Until Midnight</span>
              </div>
            </button>

            <button 
              type="button"
              className={`preset-pill-btn ${selectedPreset === 'indefinite' ? 'active' : ''}`}
              onClick={() => setSelectedPreset('indefinite')}
            >
              <Unlock size={15} />
              <div className="preset-btn-text">
                <strong>Indefinite</strong>
                <span>Manual Close Only</span>
              </div>
            </button>
          </div>

          {/* Custom Date & Time option */}
          <div className="custom-datetime-container">
            <div className="custom-radio-row" onClick={() => setSelectedPreset('custom')}>
              <input 
                type="radio" 
                id="preset-custom" 
                name="timer-preset" 
                checked={selectedPreset === 'custom'}
                onChange={() => setSelectedPreset('custom')}
              />
              <label htmlFor="preset-custom">
                <strong>Custom Date &amp; Time Deadline:</strong>
              </label>
            </div>

            {selectedPreset === 'custom' && (
              <div className="custom-input-box">
                <input 
                  type="datetime-local" 
                  value={customDateTime}
                  onChange={(e) => setCustomDateTime(e.target.value)}
                  className="datetime-input-field"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            )}
          </div>

          {/* Projected Closing Preview Box */}
          <div className="projected-preview-box">
            <div className="preview-label">
              <Calendar size={14} className="text-indigo" />
              <span>Projected Auto-Closure Time:</span>
            </div>
            <div className="preview-value-highlight">
              {previewCloseTime}
            </div>
            <p className="preview-note">
              When the clock hits this exact time, the portal will automatically transition to <strong>LOCKED</strong> mode and block new candidate form submissions.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="timer-modal-footer">
          <button className="btn-modal-cancel" onClick={onClose}>
            Cancel
          </button>

          {isCurrentlyClosed ? (
            <button className="btn-modal-reopen-confirm" onClick={handleApplyReopen}>
              <Unlock size={16} />
              <span>Reopen Portal with Selected Schedule</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <button className="btn-modal-reopen-confirm" onClick={handleApplyReopen}>
              <Clock size={16} />
              <span>Update Deadline Timer</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
