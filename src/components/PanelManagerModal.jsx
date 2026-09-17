import React, { useState } from 'react';
import { 
  X, Plus, Trash2, Check, ShieldCheck, Users, Clock, 
  Building2, Layers, Award, Sparkles, Briefcase, GraduationCap, 
  Tag, Compass
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
    juries: [
      { 
        name: '', 
        designation: '', 
        experience: '10 Years', 
        domainExpertise: '', 
        themeEvaluator: 'Theme Evaluator',
        role: 'Chief Jury' 
      }
    ]
  });
  const [isAddingNew, setIsAddingNew] = useState(false);

  if (!isOpen) return null;

  const handleAddJuryRow = (panelIdx) => {
    const updated = [...panelList];
    if (!updated[panelIdx].juries) updated[panelIdx].juries = [];
    updated[panelIdx].juries.push({ 
      name: '', 
      designation: '', 
      experience: '5 Years', 
      domainExpertise: updated[panelIdx].domain || '', 
      themeEvaluator: 'Theme Evaluator',
      role: 'Technical Evaluator' 
    });
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
    const p = panelList.find(item => item.id === panelId);
    const pName = p?.name || 'this panel';
    if (!window.confirm(`Are you sure you want to delete "${pName}"? This will remove all associated jury assignments.`)) return;
    const updated = panelList.filter(item => item.id !== panelId);
    setPanelList(updated);
  };

  const handleAddNewJuryRow = () => {
    setNewPanel(prev => ({
      ...prev,
      juries: [
        ...prev.juries,
        {
          name: '',
          designation: '',
          experience: '5 Years',
          domainExpertise: prev.domain || '',
          themeEvaluator: 'Theme Evaluator',
          role: 'Technical Evaluator'
        }
      ]
    }));
  };

  const handleRemoveNewJuryRow = (jIdx) => {
    setNewPanel(prev => {
      const copy = [...prev.juries];
      copy.splice(jIdx, 1);
      return { ...prev, juries: copy };
    });
  };

  const handleNewJuryChange = (jIdx, field, val) => {
    setNewPanel(prev => {
      const copy = [...prev.juries];
      copy[jIdx][field] = val;
      return { ...prev, juries: copy };
    });
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
      juries: [
        { 
          name: '', 
          designation: '', 
          experience: '10 Years', 
          domainExpertise: '', 
          themeEvaluator: 'Theme Evaluator',
          role: 'Chief Jury' 
        }
      ]
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
              <h2>Evaluation Panels &amp; Jury Management</h2>
              <p>Configure evaluation panels, assign multi-member jury panels, set domain expertise &amp; theme evaluators, and set timing rules.</p>
            </div>
          </div>
          <button className='btn-close-modal' onClick={onClose} title='Close'>
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
                <Users size={14} />
                <span>
                  {panelList.reduce((acc, p) => acc + (p.juries?.length || 0), 0)} Registered Juries
                </span>
              </span>
              <span className='stat-pill'>
                <Clock size={14} />
                <span>20m Pitch + 10m Q&amp;A Default</span>
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
                  <label>Panel Name / Title *</label>
                  <input 
                    type='text' 
                    placeholder='e.g. Panel 5 — CyberSecurity, Cloud &amp; Blockchain'
                    value={newPanel.name}
                    onChange={e => setNewPanel({ ...newPanel, name: e.target.value })}
                    required
                  />
                </div>

                <div className='input-group'>
                  <label>Panel Code (Tag)</label>
                  <input 
                    type='text' 
                    placeholder='e.g. P5'
                    value={newPanel.code}
                    onChange={e => setNewPanel({ ...newPanel, code: e.target.value })}
                  />
                </div>

                <div className='input-group'>
                  <label>Assigned Room / Venue</label>
                  <input 
                    type='text' 
                    placeholder='e.g. Cyber Security Lab (Room 204)'
                    value={newPanel.room}
                    onChange={e => setNewPanel({ ...newPanel, room: e.target.value })}
                  />
                </div>

                <div className='input-group'>
                  <label>Hackathon Domain Focus</label>
                  <input 
                    type='text' 
                    placeholder='e.g. CyberSecurity / Cloud / FinTech'
                    value={newPanel.domain}
                    onChange={e => setNewPanel({ ...newPanel, domain: e.target.value })}
                  />
                </div>

                <div className='input-group'>
                  <label>Presentation Time (Minutes)</label>
                  <input 
                    type='number' 
                    min='5' 
                    max='60'
                    value={newPanel.presentMins}
                    onChange={e => setNewPanel({ ...newPanel, presentMins: parseInt(e.target.value) || 20 })}
                  />
                </div>

                <div className='input-group'>
                  <label>Q&amp;A Defense Time (Minutes)</label>
                  <input 
                    type='number' 
                    min='2' 
                    max='30'
                    value={newPanel.qaMins}
                    onChange={e => setNewPanel({ ...newPanel, qaMins: parseInt(e.target.value) || 10 })}
                  />
                </div>
              </div>

              {/* Multi-Jury Assignment for New Panel */}
              <div className='new-panel-juries-wrapper'>
                <div className='jury-section-header'>
                  <div className='jury-title'>
                    <Users size={15} className='text-primary' />
                    <span>Jury Members &amp; Evaluators Roster</span>
                  </div>
                  <button 
                    type='button' 
                    className='btn-add-jury-row'
                    onClick={handleAddNewJuryRow}
                  >
                    <Plus size={13} />
                    <span>Add Jury Member</span>
                  </button>
                </div>

                <div className='jury-cards-list'>
                  {newPanel.juries.map((j, jIdx) => (
                    <div key={jIdx} className='jury-editor-card'>
                      <div className='jury-card-top-bar'>
                        <span className='jury-seq-badge'>Jury #{jIdx + 1}</span>
                        {newPanel.juries.length > 1 && (
                          <button 
                            type='button' 
                            className='btn-remove-jury-chip'
                            onClick={() => handleRemoveNewJuryRow(jIdx)}
                            title='Remove this Jury'
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <div className='jury-fields-grid'>
                        <div className='jury-field-item'>
                          <label><Users size={12} /> Jury Full Name</label>
                          <input 
                            type='text' 
                            placeholder='e.g. Dr. R. Kumar'
                            value={j.name}
                            onChange={e => handleNewJuryChange(jIdx, 'name', e.target.value)}
                            required
                          />
                        </div>

                        <div className='jury-field-item'>
                          <label><GraduationCap size={12} /> Designation / Institution</label>
                          <input 
                            type='text' 
                            placeholder='e.g. Professor &amp; AI Lead, RGU'
                            value={j.designation}
                            onChange={e => handleNewJuryChange(jIdx, 'designation', e.target.value)}
                          />
                        </div>

                        <div className='jury-field-item'>
                          <label><Briefcase size={12} /> Years of Experience</label>
                          <input 
                            type='text' 
                            placeholder='e.g. 12 Years Exp'
                            value={j.experience}
                            onChange={e => handleNewJuryChange(jIdx, 'experience', e.target.value)}
                          />
                        </div>

                        <div className='jury-field-item'>
                          <label><Compass size={12} /> Domain Expertise</label>
                          <input 
                            type='text' 
                            placeholder='e.g. AI, Cloud &amp; Distributed Systems'
                            value={j.domainExpertise}
                            onChange={e => handleNewJuryChange(jIdx, 'domainExpertise', e.target.value)}
                          />
                        </div>

                        <div className='jury-field-item'>
                          <label><Tag size={12} /> Hackathon Theme Evaluator</label>
                          <input 
                            type='text' 
                            placeholder='e.g. Theme Evaluator — Smart Automation'
                            value={j.themeEvaluator}
                            onChange={e => handleNewJuryChange(jIdx, 'themeEvaluator', e.target.value)}
                          />
                        </div>

                        <div className='jury-field-item'>
                          <label><Award size={12} /> Evaluation Role</label>
                          <select 
                            value={j.role || 'Chief Jury'}
                            onChange={e => handleNewJuryChange(jIdx, 'role', e.target.value)}
                          >
                            <option value='Chief Jury'>Chief Jury</option>
                            <option value='Technical Evaluator'>Technical Evaluator</option>
                            <option value='Industry Specialist'>Industry Specialist</option>
                            <option value='Academic Reviewer'>Academic Reviewer</option>
                            <option value='Theme Lead'>Theme Lead</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='form-actions-row'>
                <button type='button' className='btn-secondary-cancel' onClick={() => setIsAddingNew(false)}>
                  Cancel
                </button>
                <button type='submit' className='btn-primary-confirm'>
                  <Plus size={15} />
                  <span>Save &amp; Create Panel</span>
                </button>
              </div>
            </form>
          )}

          {/* Existing Panels List */}
          <div className='panels-list-container'>
            {panelList.map((panel, pIdx) => (
              <div key={panel.id} className='panel-config-card'>
                <div className='panel-config-header'>
                  <div className='panel-header-left'>
                    <span className='panel-code-badge'>{panel.code || ('P' + (pIdx + 1))}</span>
                    <div className='panel-title-meta-wrap'>
                      <input 
                        type='text'
                        value={panel.name}
                        onChange={e => handlePanelFieldChange(pIdx, 'name', e.target.value)}
                        className='panel-title-input'
                        placeholder='Panel Name'
                      />
                      <div className='panel-meta-row'>
                        <span className='panel-room-tag'>
                          <Building2 size={13} />
                          {panel.room || 'Room Unassigned'}
                        </span>
                        <span className='panel-time-tag'>
                          <Clock size={13} />
                          {panel.presentMins}m Pitch + {panel.qaMins}m Q&amp;A
                        </span>
                        <span className='panel-juries-count-tag'>
                          <Users size={13} />
                          {(panel.juries || []).length} Juries
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='panel-header-actions'>
                    <button 
                      type='button'
                      className='btn-delete-panel'
                      onClick={() => handleDeletePanel(panel.id)}
                      title='Delete this Evaluation Panel'
                    >
                      <Trash2 size={15} />
                      <span>Delete Panel</span>
                    </button>
                  </div>
                </div>

                {/* Panel Quick Fields Editor */}
                <div className='panel-config-body'>
                  <div className='panel-quick-fields-grid'>
                    <div className='quick-field'>
                      <label>Room / Venue</label>
                      <input 
                        type='text' 
                        value={panel.room || ''}
                        onChange={e => handlePanelFieldChange(pIdx, 'room', e.target.value)}
                        placeholder='Room No / Hall'
                      />
                    </div>
                    <div className='quick-field'>
                      <label>Domain Focus</label>
                      <input 
                        type='text' 
                        value={panel.domain || ''}
                        onChange={e => handlePanelFieldChange(pIdx, 'domain', e.target.value)}
                        placeholder='e.g. Software &amp; AI'
                      />
                    </div>
                    <div className='quick-field'>
                      <label>Pitch Time (Mins)</label>
                      <input 
                        type='number' 
                        min='5'
                        max='60'
                        value={panel.presentMins || 20}
                        onChange={e => handlePanelFieldChange(pIdx, 'presentMins', parseInt(e.target.value) || 20)}
                      />
                    </div>
                    <div className='quick-field'>
                      <label>Q&amp;A Time (Mins)</label>
                      <input 
                        type='number' 
                        min='2' 
                        max='30'
                        value={panel.qaMins || 10}
                        onChange={e => handlePanelFieldChange(pIdx, 'qaMins', parseInt(e.target.value) || 10)}
                      />
                    </div>
                  </div>

                  {/* Multi-Jury Roster for this Panel */}
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

                    <div className='jury-cards-list'>
                      {(panel.juries || []).map((jury, jIdx) => (
                        <div key={jIdx} className='jury-editor-card'>
                          <div className='jury-card-top-bar'>
                            <span className='jury-seq-badge'>Jury #{jIdx + 1} — {jury.role || 'Evaluator'}</span>
                            <button 
                              type='button' 
                              className='btn-remove-jury-chip'
                              onClick={() => handleRemoveJuryRow(pIdx, jIdx)}
                              title='Remove Jury'
                            >
                              <Trash2 size={13} />
                              <span>Remove Jury</span>
                            </button>
                          </div>

                          <div className='jury-fields-grid'>
                            <div className='jury-field-item'>
                              <label><Users size={12} /> Jury Full Name</label>
                              <input 
                                type='text' 
                                placeholder='e.g. Dr. R. Kumar'
                                value={jury.name || ''}
                                onChange={e => handleJuryChange(pIdx, jIdx, 'name', e.target.value)}
                              />
                            </div>

                            <div className='jury-field-item'>
                              <label><GraduationCap size={12} /> Designation &amp; Organization</label>
                              <input 
                                type='text' 
                                placeholder='e.g. Professor &amp; AI Lead, RGU'
                                value={jury.designation || ''}
                                onChange={e => handleJuryChange(pIdx, jIdx, 'designation', e.target.value)}
                              />
                            </div>

                            <div className='jury-field-item'>
                              <label><Briefcase size={12} /> Years of Experience</label>
                              <input 
                                type='text' 
                                placeholder='e.g. 15 Years Exp'
                                value={jury.experience || ''}
                                onChange={e => handleJuryChange(pIdx, jIdx, 'experience', e.target.value)}
                              />
                            </div>

                            <div className='jury-field-item'>
                              <label><Compass size={12} /> Domain Expertise</label>
                              <input 
                                type='text' 
                                placeholder='e.g. AI / ML / Cloud / Hardware'
                                value={jury.domainExpertise || ''}
                                onChange={e => handleJuryChange(pIdx, jIdx, 'domainExpertise', e.target.value)}
                              />
                            </div>

                            <div className='jury-field-item'>
                              <label><Tag size={12} /> Hackathon Theme Evaluator</label>
                              <input 
                                type='text' 
                                placeholder='e.g. Theme Evaluator — Smart Automation'
                                value={jury.themeEvaluator || ''}
                                onChange={e => handleJuryChange(pIdx, jIdx, 'themeEvaluator', e.target.value)}
                              />
                            </div>

                            <div className='jury-field-item'>
                              <label><Award size={12} /> Role</label>
                              <select 
                                value={jury.role || 'Chief Jury'}
                                onChange={e => handleJuryChange(pIdx, jIdx, 'role', e.target.value)}
                              >
                                <option value='Chief Jury'>Chief Jury</option>
                                <option value='Technical Evaluator'>Technical Evaluator</option>
                                <option value='Industry Specialist'>Industry Specialist</option>
                                <option value='Academic Reviewer'>Academic Reviewer</option>
                                <option value='Theme Lead'>Theme Lead</option>
                              </select>
                            </div>
                          </div>
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
            <span>Save All Panel &amp; Jury Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
