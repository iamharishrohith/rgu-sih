import React, { useState } from 'react';
import { 
  X, Plus, Trash2, Edit2, Check, ShieldCheck, Users, Clock, 
  Building2, Layers, Award, Sparkles, AlertCircle 
} from 'lucide-react';

export default function PanelManagerModal({ 
  isOpen, 
  onClose, 
  panels = [], 
  onSavePanels 
}) {
  const [panelList, setPanelList] = useState(panels);
  const [newPanel, setNewPanel] = useState({
    name: '',
    code: '',
    room: '',
    domain: '',
    presentMins: 20,
    qaMins: 10,
    status: 'ACTIVE',
    juries: [{ name: '', role: 'Chief Jury', designation: '' }]
  });
  const [isAddingNew, setIsAddingNew] = useState(false);

  if (!isOpen) return null;

  const handleAddJuryRow = (panelIdx) => {
    const updated = [...panelList];
    updated[panelIdx].juries.push({ name: '', role: 'Evaluator', designation: '' });
    setPanelList(updated);
  };

  const handleRemoveJuryRow = (panelIdx, juryIdx) => {
    const updated = [...panelList];
    updated[panelIdx].juries.splice(juryIdx, 1);
    setPanelList(updated);
  };

  const handleJuryChange = (panelIdx, juryIdx, field, val) => {
    const updated = [...panelList];
    updated[panelIdx].juries[juryIdx][field] = val;
    setPanelList(updated);
  };

  const handlePanelFieldChange = (panelIdx, field, val) => {
    const updated = [...panelList];
    updated[panelIdx][field] = val;
    setPanelList(updated);
  };

  const handleDeletePanel = (panelId) => {
    if (!window.confirm('Are you sure you want to delete this evaluation panel?')) return;
    const updated = panelList.filter(p => p.id !== panelId);
    setPanelList(updated);
  };

  const handleAddNewPanelSubmit = (e) => {
    e.preventDefault();
    if (!newPanel.name.trim()) return;

    const nextId = 'panel_' + Date.now();
    const nextCode = newPanel.code.trim() || ('P' + (panelList.length + 1));
    const created = {
      ...newPanel,
      id: nextId,
      code: nextCode
    };

    const updated = [...panelList, created];
    setPanelList(updated);
    setIsAddingNew(false);
    setNewPanel({
      name: '',
      code: '',
      room: '',
      domain: '',
      presentMins: 20,
      qaMins: 10,
      status: 'ACTIVE',
      juries: [{ name: '', role: 'Chief Jury', designation: '' }]
    });
  };

  const handleSaveAll = () => {
    onSavePanels(panelList);
    onClose();
  };

  return (
    <div className='inout-modal-overlay' onClick={onClose}>
      <div className='panel-manager-modal-card' onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className='panel-modal-header'>
          <div className='modal-title-with-icon'>
            <div className='modal-icon-badge'>
              <Layers size={22} className='text-primary' />
            </div>
            <div>
              <h2>Evaluation Panels & Jury Management</h2>
              <p>Configure dynamic evaluation panels, assign jury members, allocate rooms, and define timing rules.</p>
            </div>
          </div>
          <button className='btn-close-modal' onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className='panel-modal-body'>
          {/* Top Action Bar */}
          <div className='panel-mgmt-toolbar'>
            <div className='toolbar-stats'>
              <span className='stat-pill active'>
                <ShieldCheck size={14} />
                <strong>{panelList.length} Active Panels</strong>
              </span>
              <span className='stat-pill'>
                <Clock size={14} />
                <span>Default: 20m Presentation + 10m Q&A</span>
              </span>
            </div>

            <button 
              className='btn-add-panel-primary'
              onClick={() => setIsAddingNew(!isAddingNew)}
            >
              <Plus size={16} />
              <span>{isAddingNew ? 'Cancel New Panel' : 'Add New Panel'}</span>
            </button>
          </div>

          {/* Add New Panel Form */}
          {isAddingNew && (
            <form onSubmit={handleAddNewPanelSubmit} className='add-panel-form-card'>
              <div className='form-card-title'>
                <Sparkles size={16} className='text-amber' />
                <h4>Create New Evaluation Panel</h4>
              </div>

              <div className='form-grid-2col'>
                <div className='input-group'>
                  <label>Panel Name / Title:</label>
                  <input 
                    type='text' 
                    placeholder='e.g. Panel 5 - CyberSecurity & Cloud'
                    value={newPanel.name}
                    onChange={e => setNewPanel({ ...newPanel, name: e.target.value })}
                    required
                  />
                </div>

                <div className='input-group'>
                  <label>Panel Code (Tag):</label>
                  <input 
                    type='text' 
                    placeholder='e.g. P5'
                    value={newPanel.code}
                    onChange={e => setNewPanel({ ...newPanel, code: e.target.value })}
                  />
                </div>

                <div className='input-group'>
                  <label>Assigned Room / Venue:</label>
                  <input 
                    type='text' 
                    placeholder='e.g. Room 205 (2nd Floor)'
                    value={newPanel.room}
                    onChange={e => setNewPanel({ ...newPanel, room: e.target.value })}
                  />
                </div>

                <div className='input-group'>
                  <label>Domain Focus:</label>
                  <input 
                    type='text' 
                    placeholder='e.g. CyberSecurity / Cloud / Open'
                    value={newPanel.domain}
                    onChange={e => setNewPanel({ ...newPanel, domain: e.target.value })}
                  />
                </div>

                <div className='input-group'>
                  <label>Presentation Time (Minutes):</label>
                  <input 
                    type='number' 
                    min='5' 
                    max='60'
                    value={newPanel.presentMins}
                    onChange={e => setNewPanel({ ...newPanel, presentMins: parseInt(e.target.value) || 20 })}
                  />
                </div>

                <div className='input-group'>
                  <label>Q&A Defense Time (Minutes):</label>
                  <input 
                    type='number' 
                    min='2' 
                    max='30'
                    value={newPanel.qaMins}
                    onChange={e => setNewPanel({ ...newPanel, qaMins: parseInt(e.target.value) || 10 })}
                  />
                </div>
              </div>

              <div className='form-actions-row'>
                <button type='button' className='btn-secondary-cancel' onClick={() => setIsAddingNew(false)}>
                  Cancel
                </button>
                <button type='submit' className='btn-primary-confirm'>
                  <Plus size={15} />
                  <span>Save & Create Panel</span>
                </button>
              </div>
            </form>
          )}

          {/* Panels List */}
          <div className='panels-list-container'>
            {panelList.map((panel, pIdx) => (
              <div key={panel.id} className='panel-config-card'>
                <div className='panel-config-header'>
                  <div className='panel-header-left'>
                    <span className='panel-code-badge'>{panel.code || ('P' + (pIdx+1))}</span>
                    <div>
                      <h3 className='panel-title-text'>{panel.name}</h3>
                      <div className='panel-meta-row'>
                        <span className='panel-room-tag'>
                          <Building2 size={13} />
                          {panel.room || 'Room Unassigned'}
                        </span>
                        <span className='panel-time-tag'>
                          <Clock size={13} />
                          {panel.presentMins}m Presentation + {panel.qaMins}m Q&A
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='panel-header-actions'>
                    <button 
                      className='btn-delete-panel'
                      onClick={() => handleDeletePanel(panel.id)}
                      title='Delete Panel'
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Panel Details Editor */}
                <div className='panel-config-body'>
                  <div className='panel-quick-fields-grid'>
                    <div className='quick-field'>
                      <label>Room / Booth:</label>
                      <input 
                        type='text' 
                        value={panel.room || ''}
                        onChange={e => handlePanelFieldChange(pIdx, 'room', e.target.value)}
                        placeholder='Room No'
                      />
                    </div>
                    <div className='quick-field'>
                      <label>Domain:</label>
                      <input 
                        type='text' 
                        value={panel.domain || ''}
                        onChange={e => handlePanelFieldChange(pIdx, 'domain', e.target.value)}
                        placeholder='Domain Focus'
                      />
                    </div>
                    <div className='quick-field'>
                      <label>Pitch Time (Mins):</label>
                      <input 
                        type='number' 
                        value={panel.presentMins || 20}
                        onChange={e => handlePanelFieldChange(pIdx, 'presentMins', parseInt(e.target.value) || 20)}
                      />
                    </div>
                    <div className='quick-field'>
                      <label>Q&A Time (Mins):</label>
                      <input 
                        type='number' 
                        value={panel.qaMins || 10}
                        onChange={e => handlePanelFieldChange(pIdx, 'qaMins', parseInt(e.target.value) || 10)}
                      />
                    </div>
                  </div>

                  {/* Jury Members Roster for this Panel */}
                  <div className='jury-roster-section'>
                    <div className='jury-section-header'>
                      <div className='jury-title'>
                        <Users size={15} className='text-primary' />
                        <span>Assigned Jury Members ({(panel.juries || []).length})</span>
                      </div>
                      <button 
                        type='button' 
                        className='btn-add-jury-row'
                        onClick={() => handleAddJuryRow(pIdx)}
                      >
                        <Plus size={13} />
                        <span>Add Jury Member</span>
                      </button>
                    </div>

                    <div className='jury-rows-list'>
                      {(panel.juries || []).map((jury, jIdx) => (
                        <div key={jIdx} className='jury-item-row'>
                          <input 
                            type='text' 
                            placeholder='Jury Full Name (e.g. Dr. R. Kumar)'
                            value={jury.name || ''}
                            onChange={e => handleJuryChange(pIdx, jIdx, 'name', e.target.value)}
                            className='jury-name-input'
                          />
                          <input 
                            type='text' 
                            placeholder='Role (e.g. Chief Jury)'
                            value={jury.role || ''}
                            onChange={e => handleJuryChange(pIdx, jIdx, 'role', e.target.value)}
                            className='jury-role-input'
                          />
                          <input 
                            type='text' 
                            placeholder='Designation / Affiliation'
                            value={jury.designation || ''}
                            onChange={e => handleJuryChange(pIdx, jIdx, 'designation', e.target.value)}
                            className='jury-desig-input'
                          />
                          <button 
                            type='button' 
                            className='btn-remove-jury'
                            onClick={() => handleRemoveJuryRow(pIdx, jIdx)}
                            title='Remove Jury'
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className='panel-modal-footer'>
          <button className='btn-secondary-cancel' onClick={onClose}>
            Cancel
          </button>
          <button className='btn-primary-save' onClick={handleSaveAll}>
            <Check size={16} />
            <span>Save All Panel & Jury Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
