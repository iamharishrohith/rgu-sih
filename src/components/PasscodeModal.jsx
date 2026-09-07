import React, { useState } from 'react';
import { X, Lock, KeyRound, AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import { verifyPasscodeSecure } from '../crypto_security';

export default function PasscodeModal({ isOpen, onClose, onSuccess }) {
  if (!isOpen) return null;

  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (isLockedOut) return;

    setIsVerifying(true);
    setError('');

    const isValid = await verifyPasscodeSecure(passcode);
    setIsVerifying(false);

    if (isValid) {
      setError('');
      setAttempts(0);
      onSuccess();
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (nextAttempts >= 5) {
        setIsLockedOut(true);
        setError('Maximum failed attempts exceeded. Access locked for 30 seconds.');
        setTimeout(() => {
          setIsLockedOut(false);
          setAttempts(0);
          setError('');
        }, 30000);
      } else {
        setError(`Access denied. Incorrect security passcode. (${5 - nextAttempts} attempts remaining)`);
      }
    }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="modal-dialog-box passcode-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top-bar">
          <div className="modal-title-left">
            <div className="modal-icon-badge lock-badge">
              <Lock size={18} />
            </div>
            <span className="modal-title-text">Admin Authentication</span>
          </div>
          <button className="btn-close-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="passcode-modal-body">
          <div className="passcode-intro">
            <div className="passcode-icon-large">
              <KeyRound size={32} />
            </div>
            <h3>Backend Administration Desk</h3>
            <p>Enter the master security passcode to access candidate analytics and roster management.</p>
          </div>

          <form onSubmit={handleVerify} className="passcode-form">
            <div className="input-group">
              <label>Master Passcode</label>
              <input 
                type="password"
                autoFocus
                required
                disabled={isLockedOut || isVerifying}
                placeholder="Enter passcode..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="input-passcode"
              />
            </div>

            {error && (
              <div className="passcode-error-box">
                {isLockedOut ? <ShieldAlert size={15} /> : <AlertCircle size={15} />}
                <span>{error}</span>
              </div>
            )}

            <div className="passcode-actions">
              <button type="button" className="btn-cancel-action" onClick={onClose}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-passcode-submit" 
                disabled={isLockedOut || isVerifying}
              >
                <span>{isVerifying ? 'Verifying...' : 'Unlock Dashboard'}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
