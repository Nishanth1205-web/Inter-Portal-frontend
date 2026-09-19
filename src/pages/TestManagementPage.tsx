import React, { useState, useEffect } from 'react';
import { testApi, questionApi, academicApi, userApi } from '../services/api';
import { Test, Question, Subject, Batch, User, TestStatus } from '../types';
import {
  FileCheck2,
  Plus,
  Search,
  CheckCircle,
  Users,
  Send,
  Calendar,
  X,
  PlusCircle,
  MinusCircle,
  HelpCircle,
} from 'lucide-react';

export const TestManagementPage: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  // Test form
  const [testForm, setTestForm] = useState({
    title: '',
    description: '',
    instructions: '1. All questions are compulsory.\n2. Do not refresh or navigate away from the test window.\n3. The test will automatically submit when the timer expires.',
    subjectId: '',
    duration: 30,
    passingScore: 50,
    shuffleQuestions: false,
  });

  // Question Picker state
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Assign form
  const [assignType, setAssignType] = useState<'batch' | 'individual'>('batch');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [assignStartDate, setAssignStartDate] = useState('');
  const [assignEndDate, setAssignEndDate] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [subRes, batchRes, stuRes] = await Promise.all([
        academicApi.getSubjects(),
        academicApi.getBatches(),
        userApi.getUsers({ role: 'STUDENT', limit: 100 }),
      ]);
      if (subRes.data?.data) {
        setSubjects(subRes.data.data);
        if (subRes.data.data.length > 0) {
          setTestForm(f => ({ ...f, subjectId: subRes.data.data[0].id }));
        }
      }
      if (batchRes.data?.data) setBatches(batchRes.data.data);
      if (stuRes.data?.data?.users) setStudents(stuRes.data.data.users);
      loadTests();
    } catch (err) {
      console.error(err);
    }
  };

  const loadTests = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await testApi.getTests(params);
      if (res.data?.data?.tests) {
        setTests(res.data.data.tests);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await testApi.createTest({
        ...testForm,
        duration: Number(testForm.duration),
        passingScore: Number(testForm.passingScore),
      });
      setShowCreateModal(false);
      loadTests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create test');
    }
  };

  const handlePublish = async (id: string) => {
    if (!window.confirm('Publish this test? It will become ready for student assignment.')) return;
    try {
      await testApi.publishTest(id);
      loadTests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to publish test');
    }
  };

  // Manage Questions for a Test
  const openQuestionPicker = async (test: Test) => {
    setSelectedTest(test);
    try {
      // Load questions for the test's subject
      const qRes = await questionApi.getQuestions({ subjectId: test.subjectId, limit: 100 });
      if (qRes.data?.data?.questions) {
        setAvailableQuestions(qRes.data.data.questions);
      }
      // Load test details with attached questions
      const tRes = await testApi.getTestById(test.id);
      if (tRes.data?.data?.testQuestions) {
        setSelectedQuestionIds(tRes.data.data.testQuestions.map((tq: any) => tq.questionId));
      } else {
        setSelectedQuestionIds([]);
      }
      setShowQuestionModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleQuestionSelection = (qid: string) => {
    setSelectedQuestionIds(prev =>
      prev.includes(qid) ? prev.filter(id => id !== qid) : [...prev, qid]
    );
  };

  const saveTestQuestions = async () => {
    if (!selectedTest) return;
    try {
      const questionsPayload = selectedQuestionIds.map((qid, idx) => ({
        questionId: qid,
        sortOrder: idx,
      }));
      await testApi.updateTest(selectedTest.id, {
        questions: questionsPayload,
      });
      setShowQuestionModal(false);
      loadTests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update test questions');
    }
  };

  // Open Assign Modal
  const openAssignModal = (test: Test) => {
    setSelectedTest(test);
    setSelectedBatchId(batches[0]?.id || '');
    setSelectedStudentIds([]);
    setShowAssignModal(true);
  };

  const handleAssignTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest) return;
    try {
      const payload: any = {
        startDate: assignStartDate ? new Date(assignStartDate).toISOString() : undefined,
        endDate: assignEndDate ? new Date(assignEndDate).toISOString() : undefined,
      };

      if (assignType === 'batch') {
        payload.batchId = selectedBatchId;
      } else {
        payload.studentIds = selectedStudentIds;
      }

      const res = await testApi.assignTest(selectedTest.id, payload);
      alert(res.data?.message || 'Test assigned successfully');
      setShowAssignModal(false);
      loadTests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign test');
    }
  };

  const getStatusBadge = (status: TestStatus) => {
    switch (status) {
      case 'DRAFT': return <span className="badge badge-secondary">Draft</span>;
      case 'PUBLISHED': return <span className="badge badge-info">Published</span>;
      case 'ASSIGNED': return <span className="badge badge-primary">Assigned</span>;
      case 'COMPLETED': return <span className="badge badge-success">Completed</span>;
      default: return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Test Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Build assessments, compose questions from question bank, publish, and assign to cohorts.
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>Create Assessment</span>
        </button>
      </div>

      {/* Filter Strip */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadTests()}
            placeholder="Search assessments..."
            className="form-input"
            style={{ paddingLeft: '36px' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-select"
          style={{ width: 'auto', minWidth: '150px' }}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ASSIGNED">Assigned</option>
        </select>

        <button onClick={loadTests} className="btn btn-secondary">
          Filter
        </button>
      </div>

      {/* Tests Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Subject</th>
              <th>Questions</th>
              <th>Duration</th>
              <th>Pass Mark</th>
              <th>Status</th>
              <th>Assigned</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                  Loading assessments...
                </td>
              </tr>
            ) : tests.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                  No tests found. Click "Create Assessment" to build one!
                </td>
              </tr>
            ) : (
              tests.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{t.title}</div>
                    {t.description && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-secondary">{t.subject?.name || 'General'}</span>
                  </td>
                  <td>
                    <button
                      onClick={() => openQuestionPicker(t)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--primary)', fontWeight: 600 }}
                    >
                      <HelpCircle size={14} />
                      <span>{t._count?.testQuestions || 0} Questions</span>
                    </button>
                  </td>
                  <td>{t.duration} mins</td>
                  <td>{t.passingScore ? `${t.passingScore}%` : '-'}</td>
                  <td>{getStatusBadge(t.status)}</td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {t._count?.assignments || 0} Students
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {t.status === 'DRAFT' && (
                        <button
                          onClick={() => handlePublish(t.id)}
                          className="btn btn-sm btn-secondary"
                          title="Publish Test"
                          style={{ borderColor: 'rgba(59,130,246,0.3)', color: '#60a5fa' }}
                        >
                          <CheckCircle size={14} /> Publish
                        </button>
                      )}
                      {(t.status === 'PUBLISHED' || t.status === 'ASSIGNED') && (
                        <button
                          onClick={() => openAssignModal(t)}
                          className="btn btn-sm btn-primary"
                          title="Assign to Students"
                        >
                          <Send size={14} /> Assign
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ==========================================================================
          CREATE TEST MODAL
          ========================================================================== */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-card animate-slide">
            <div className="modal-header">
              <h2 className="modal-title">Create New Assessment</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateTest}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Test Title *</label>
                  <input
                    type="text"
                    required
                    value={testForm.title}
                    onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                    placeholder="e.g. JavaScript Mid-Term Assessment"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    rows={2}
                    value={testForm.description}
                    onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                    placeholder="Brief summary of test scope..."
                    className="form-textarea"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Subject *</label>
                    <select
                      value={testForm.subjectId}
                      onChange={(e) => setTestForm({ ...testForm, subjectId: e.target.value })}
                      className="form-select"
                      required
                    >
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Duration (Minutes)</label>
                    <input
                      type="number"
                      min="5"
                      value={testForm.duration}
                      onChange={(e) => setTestForm({ ...testForm, duration: parseInt(e.target.value) || 30 })}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Passing Score (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={testForm.passingScore}
                      onChange={(e) => setTestForm({ ...testForm, passingScore: parseInt(e.target.value) || 50 })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Student Instructions</label>
                  <textarea
                    rows={3}
                    value={testForm.instructions}
                    onChange={(e) => setTestForm({ ...testForm, instructions: e.target.value })}
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          QUESTION PICKER MODAL
          ========================================================================== */}
      {showQuestionModal && selectedTest && (
        <div className="modal-backdrop">
          <div className="modal-card animate-slide" style={{ maxWidth: '800px', maxHeight: '85vh' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Questions in: {selectedTest.title}</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Selected {selectedQuestionIds.length} questions from Question Bank
                </p>
              </div>
              <button onClick={() => setShowQuestionModal(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
              {availableQuestions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                  No questions found for subject "{selectedTest.subject?.name}". Please add questions to the Question Bank first.
                </div>
              ) : (
                availableQuestions.map((q) => {
                  const isSelected = selectedQuestionIds.includes(q.id);
                  return (
                    <div
                      key={q.id}
                      onClick={() => toggleQuestionSelection(q.id)}
                      style={{
                        padding: '14px',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                          <span className="badge badge-secondary">{q.questionType}</span>
                          <span className="badge badge-secondary">{q.difficulty}</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Marks: {q.marks}</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: isSelected ? '#fff' : 'var(--text-main)' }}>
                          {q.questionText}
                        </div>
                      </div>

                      <div>
                        {isSelected ? (
                          <MinusCircle size={20} color="#f87171" />
                        ) : (
                          <PlusCircle size={20} color="#6366f1" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowQuestionModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={saveTestQuestions} className="btn btn-primary">
                Save Selected ({selectedQuestionIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          ASSIGN TEST MODAL
          ========================================================================== */}
      {showAssignModal && selectedTest && (
        <div className="modal-backdrop">
          <div className="modal-card animate-slide" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="#818cf8" />
                <h2 className="modal-title">Assign Assessment</h2>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignTest}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Assigning <strong>{selectedTest.title}</strong>
                </div>

                {/* Assignment Target Type */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setAssignType('batch')}
                    className={`btn btn-sm ${assignType === 'batch' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    Assign to Cohort / Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignType('individual')}
                    className={`btn btn-sm ${assignType === 'individual' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    Select Individual Students
                  </button>
                </div>

                {assignType === 'batch' ? (
                  <div className="form-group">
                    <label className="form-label">Cohort / Batch *</label>
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="form-select"
                      required
                    >
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.year})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Students ({selectedStudentIds.length} selected)</label>
                    <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px' }}>
                      {students.map(s => (
                        <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(s.student?.id || '')}
                            onChange={(e) => {
                              const sId = s.student?.id;
                              if (!sId) return;
                              setSelectedStudentIds(prev =>
                                e.target.checked ? [...prev, sId] : prev.filter(id => id !== sId)
                              );
                            }}
                          />
                          <span style={{ fontSize: '0.85rem' }}>{s.firstName} {s.lastName} ({s.student?.enrollmentNo})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Start Date / Window</label>
                    <input
                      type="datetime-local"
                      value={assignStartDate}
                      onChange={(e) => setAssignStartDate(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Deadline / Expiry</label>
                    <input
                      type="datetime-local"
                      value={assignEndDate}
                      onChange={(e) => setAssignEndDate(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
