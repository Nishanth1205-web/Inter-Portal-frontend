import React, { useState, useEffect } from 'react';
import { academicApi } from '../services/api';
import { Department, Batch, Subject } from '../types';
import { Building2, Plus, X, GraduationCap, BookOpen } from 'lucide-react';

export const AcademicsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'depts' | 'batches' | 'subjects'>('depts');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  // Forms
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '' });
  const [batchForm, setBatchForm] = useState({ name: '', year: 2026 });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', description: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [depRes, batRes, subRes] = await Promise.all([
        academicApi.getDepartments(),
        academicApi.getBatches(),
        academicApi.getSubjects(),
      ]);
      if (depRes.data?.data) setDepartments(depRes.data.data);
      if (batRes.data?.data) setBatches(batRes.data.data);
      if (subRes.data?.data) setSubjects(subRes.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await academicApi.createDepartment(deptForm);
      setShowDeptModal(false);
      setDeptForm({ name: '', code: '', description: '' });
      loadData();
    } catch (err: any) { alert(err.response?.data?.message || 'Error creating department'); }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await academicApi.createBatch({ ...batchForm, year: Number(batchForm.year) });
      setShowBatchModal(false);
      setBatchForm({ name: '', year: 2026 });
      loadData();
    } catch (err: any) { alert(err.response?.data?.message || 'Error creating batch'); }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await academicApi.createSubject(subjectForm);
      setShowSubjectModal(false);
      setSubjectForm({ name: '', code: '', description: '' });
      loadData();
    } catch (err: any) { alert(err.response?.data?.message || 'Error creating subject'); }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Academic Structure</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Configure organizational hierarchies, academic departments, graduation cohorts, and curricula.
          </p>
        </div>

        {activeTab === 'depts' && (
          <button onClick={() => setShowDeptModal(true)} className="btn btn-primary">
            <Plus size={16} /> Add Department
          </button>
        )}
        {activeTab === 'batches' && (
          <button onClick={() => setShowBatchModal(true)} className="btn btn-primary">
            <Plus size={16} /> Add Batch
          </button>
        )}
        {activeTab === 'subjects' && (
          <button onClick={() => setShowSubjectModal(true)} className="btn btn-primary">
            <Plus size={16} /> Add Subject
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setActiveTab('depts')}
          className={`btn btn-sm ${activeTab === 'depts' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Building2 size={15} /> Departments ({departments.length})
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          className={`btn btn-sm ${activeTab === 'batches' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <GraduationCap size={15} /> Cohorts & Batches ({batches.length})
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`btn btn-sm ${activeTab === 'subjects' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <BookOpen size={15} /> Subjects & Modules ({subjects.length})
        </button>
      </div>

      {/* Table views */}
      <div className="table-container">
        {activeTab === 'depts' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Department Name</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {departments.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.code}</strong></td>
                  <td>{d.name}</td>
                  <td>{d.description || '-'}</td>
                  <td><span className="badge badge-success">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'batches' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch / Cohort Name</th>
                <th>Academic Year</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(b => (
                <tr key={b.id}>
                  <td><strong>{b.name}</strong></td>
                  <td>{b.year}</td>
                  <td><span className="badge badge-success">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'subjects' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject Code</th>
                <th>Subject Name</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.code}</strong></td>
                  <td>{s.name}</td>
                  <td>{s.description || '-'}</td>
                  <td><span className="badge badge-success">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Dept Modal */}
      {showDeptModal && (
        <div className="modal-backdrop">
          <div className="modal-card animate-slide">
            <div className="modal-header">
              <h2 className="modal-title">Create Department</h2>
              <button onClick={() => setShowDeptModal(false)} className="btn btn-ghost btn-sm"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateDept}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Department Name *</label>
                  <input type="text" required value={deptForm.name} onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Code (e.g. CSE) *</label>
                  <input type="text" required value={deptForm.code} onChange={e => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea rows={2} value={deptForm.description} onChange={e => setDeptForm({ ...deptForm, description: e.target.value })} className="form-textarea" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowDeptModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Batch Modal */}
      {showBatchModal && (
        <div className="modal-backdrop">
          <div className="modal-card animate-slide">
            <div className="modal-header">
              <h2 className="modal-title">Create Batch</h2>
              <button onClick={() => setShowBatchModal(false)} className="btn btn-ghost btn-sm"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateBatch}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Batch Name *</label>
                  <input type="text" required placeholder="e.g. 2023-2027" value={batchForm.name} onChange={e => setBatchForm({ ...batchForm, name: e.target.value })} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Year *</label>
                  <input type="number" required value={batchForm.year} onChange={e => setBatchForm({ ...batchForm, year: parseInt(e.target.value) || 2026 })} className="form-input" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowBatchModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Batch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showSubjectModal && (
        <div className="modal-backdrop">
          <div className="modal-card animate-slide">
            <div className="modal-header">
              <h2 className="modal-title">Create Subject</h2>
              <button onClick={() => setShowSubjectModal(false)} className="btn btn-ghost btn-sm"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateSubject}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Subject Name *</label>
                  <input type="text" required placeholder="e.g. Distributed Systems" value={subjectForm.name} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Code *</label>
                  <input type="text" required placeholder="e.g. CS501" value={subjectForm.code} onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })} className="form-input" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowSubjectModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
