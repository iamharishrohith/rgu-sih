import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, ArrowRight, ShieldCheck, Zap, Unlock } from 'lucide-react';

export default function MidnightCountdownBanner({ onActionClick, isPortalClosed, portalSettings }) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    isExpired: false
  });

  const closeTimestamp = portalSettings?.closeTimestamp;

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      
      let targetTime;
      if (closeTimestamp) {
        targetTime = typeof closeTimestamp === 'number' ? closeTimestamp : new Date(closeTimestamp).getTime();
      } else {
        // Fallback default: today midnight
        const d = new Date();
        targetTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
        if (targetTime <= now) {
          targetTime = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 23, 59, 59, 999).getTime();
        }
      }

      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalSeconds: 0,
          isExpired: true
        });
        return;
      }

      const totalSec = Math.floor(diff / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      setTimeLeft({
        hours,
        minutes,
        seconds,
        totalSeconds: totalSec,
        isExpired: false
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [closeTimestamp]);

  if (isPortalClosed || (closeTimestamp && timeLeft.isExpired)) {
    return null;
  }

  const isUrgent = timeLeft.hours < 2 && closeTimestamp;
  const isIndefinite = !closeTimestamp && !isPortalClosed;

  return (
    <div className={`countdown-alert-strip ${isUrgent ? 'urgent-pulse' : ''}`}>
      <div className="countdown-container">
        <div className="countdown-notice-group">
          <div className="countdown-pulse-tag">
            {isIndefinite ? (
              <>
                <Unlock size={15} className="text-emerald" />
                <span className="deadline-badge open-extended">WINDOW EXTENDED</span>
              </>
            ) : (
              <>
                <Clock size={15} className="text-rose" />
                <span className="deadline-badge">REGISTRATION DEADLINE</span>
              </>
            )}
          </div>
          
          <div className="countdown-text-content">
            <strong className="countdown-title">
              {isIndefinite 
                ? 'Candidate Registration Window is Open by Authority Extension'
                : `Portal Closes Automatically in ${timeLeft.hours}h ${timeLeft.minutes}m (${portalSettings?.presetLabel || 'Scheduled Deadline'})`}
            </strong>
            <span className="countdown-subtitle">
              All 6-member team rosters and mentor designations must be submitted before automatic lockout.
            </span>
          </div>
        </div>

        {!isIndefinite && (
          <div className="countdown-timer-boxes-row">
            <div className="timer-unit-box">
              <span className="timer-digit">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="timer-label">HRS</span>
            </div>
            <span className="timer-colon">:</span>
            <div className="timer-unit-box">
              <span className="timer-digit">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="timer-label">MIN</span>
            </div>
            <span className="timer-colon">:</span>
            <div className="timer-unit-box highlight-sec">
              <span className="timer-digit">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="timer-label">SEC</span>
            </div>

            {onActionClick && (
              <button className="btn-countdown-cta" onClick={onActionClick}>
                <span>Complete Form</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
