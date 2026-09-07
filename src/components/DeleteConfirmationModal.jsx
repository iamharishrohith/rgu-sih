import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, teamToDelete }) {
  if (!isOpen || !teamToDelete) return null;

  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(teamToDelete.temp_team_id);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card delete-confirm-card" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-top">
          <div className="delete-icon-wrap">
            <AlertTriangle size={24} />
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="delete-modal-content">
          <h3>Delete Team from Finalist Registry?</h3>
          <p>
            Are you sure you want to permanently remove <strong>{teamToDelete.team_name}</strong> (<code>{teamToDelete.temp_team_id}</code>) from the active registry?
          </p>

          <div className="delete-team-preview-box">
            <div className="del-preview-row">
              <span className="del-label">Rank &amp; Tier:</span>
              <span className="del-val">#{teamToDelete.rank} • {teamToDelete.status}</span>
            </div>
            <div className="del-preview-row">
              <span className="del-label">Team Leader:</span>
              <span className="del-val">{teamToDelete.leader_name} ({teamToDelete.reg_no})</span>
            </div>
            <div className="del-preview-row">
              <span className="del-label">Problem Statement:</span>
              <span className="del-val font-mono">{teamToDelete.ps_id}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-cancel-modal" onClick={onClose} disabled={isDeleting}>
            Cancel
          </button>
          <button 
            type="button" 
            className="btn-danger-delete-action" 
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            <Trash2 size={16} />
            <span>{isDeleting ? 'Deleting Team...' : 'Permanently Delete Team'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
