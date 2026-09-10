import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function MidnightCountdownBanner({ onActionClick, isPortalClosed }) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      // Target: Tonight at 23:59:59 (12:00 AM Midnight)
      const targetMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23, 59, 59, 999
      ).getTime();

      const diff = targetMidnight - now.getTime();

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
  }, []);

  if (isPortalClosed || timeLeft.isExpired) {
    return null;
  }

  const isUrgent = timeLeft.hours < 2;

  return (
    <div className={`countdown-alert-strip ${isUrgent ? 'urgent-pulse' : ''}`}>
      <div className="countdown-container">
        <div className="countdown-notice-group">
          <div className="countdown-pulse-tag">
            <Clock size={15} className="text-rose" />
            <span className="deadline-badge">MIDNIGHT DEADLINE</span>
          </div>
          
          <div className="countdown-text-content">
            <strong className="countdown-title">
              Portal Closes Automatically Tonight at 12:00 AM Midnight
            </strong>
            <span className="countdown-subtitle">
              All 6-member team rosters and mentor designations must be submitted before automatic lockout.
            </span>
          </div>
        </div>

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
      </div>
    </div>
  );
}
