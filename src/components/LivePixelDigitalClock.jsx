import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function LivePixelDigitalClock({ variant = 'banner' }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const rawHours = now.getHours();
  const hours12 = rawHours % 12 || 12;
  const hoursStr = String(hours12).padStart(2, '0');
  const minutesStr = String(now.getMinutes()).padStart(2, '0');
  const secondsStr = String(now.getSeconds()).padStart(2, '0');
  const ampm = rawHours >= 12 ? 'PM' : 'AM';

  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  
  const dayName = dayNames[now.getDay()];
  const dateNum = String(now.getDate()).padStart(2, '0');
  const monthName = monthNames[now.getMonth()];
  const yearNum = now.getFullYear();

  return (
    <div className={`pixel-clock-unit pixel-clock-${variant}`}>
      <div className="pixel-clock-screen">
        {/* Top Status LED Line */}
        <div className="pixel-clock-top-meta">
          <div className="pixel-live-indicator">
            <span className="pixel-green-dot"></span>
            <span className="pixel-live-text">LIVE VENUE TIME</span>
          </div>
          <div className="pixel-date-text">
            {dateNum} {monthName} {yearNum} • {dayName}
          </div>
        </div>

        {/* Big Pixel Digits Display */}
        <div className="pixel-digits-row">
          <span className="pixel-digit-box">{hoursStr[0]}</span>
          <span className="pixel-digit-box">{hoursStr[1]}</span>
          <span className="pixel-colon">:</span>
          <span className="pixel-digit-box">{minutesStr[0]}</span>
          <span className="pixel-digit-box">{minutesStr[1]}</span>
          <span className="pixel-colon">:</span>
          <span className="pixel-digit-box pixel-sec">{secondsStr[0]}</span>
          <span className="pixel-digit-box pixel-sec">{secondsStr[1]}</span>
          
          <div className="pixel-ampm-block">
            <span className={`pixel-ampm-tag ${ampm === 'AM' ? 'active' : ''}`}>AM</span>
            <span className={`pixel-ampm-tag ${ampm === 'PM' ? 'active' : ''}`}>PM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
