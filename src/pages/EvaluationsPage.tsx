import React, { useState, useEffect } from 'react';
import { testApi } from '../services/api';
import {
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  X,
  FileCheck2,
  Send,
  User,
} from 'lucide-react';

export const EvaluationsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showGradingModal, setShowGradingModal] = useState(false);

  // Manual grading state: answers list with assigned marks and feedback
  const [grades, setGrades] = useState<Record<string, { marks: number; feedback?: string }>>({});
  const [teacherGeneralFeedback, setTeacherGeneralFeedback] = useState('');
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const res = await testApi.getAssignments({ limit: 100 });
      if (res.data?.data?.assignments) {
        // Collect submissions from assignments
        const subs: any[] = [];
        res.data.data.assignments.forEach((asgn: any) => {
          if (asgn.submissions && asgn.submissions.length > 0) {
            asgn.submissions.forEach((s: any) => {
              subs.push({
                ...s,
                student: asgn.student,
                test: asgn.test,
              });
            });
          }
        });
        setSubmissions(subs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openGradingModal = async (sub: any) => {
    setSelectedSubmission(sub);
    // Initialize grading inputs with current awarded marks
    const initialGrades: Record<string, any> = {};
    if (sub.answers) {
      sub.answers.forEach((ans: any) => {
        initialGrades[ans.questionId] = {
          marks: ans.marksObtained ?? (ans.isCorrect ? ans.question?.marks : 0),
          feedback: '',
        };
      });
    }
    setGrades(initialGrades);
    setTeacherGeneralFeedback(sub.result?.feedback || '');
    setShowGradingModal(true);
  };

  const handleSaveEvaluation = async () => {
    if (!selectedSubmission) return;
    setEvaluating(true);
    try {
      const answersPayload = Object.entries(grades).map(([questionId, g]) => ({
        questionId,
        marksObtained: Number(g.marks),
        feedback: g.feedback || undefined,
      }));

      await testApi.evaluateAnswer(selectedSubmission.id, {
        answers: answersPayload,
        feedback: teacherGeneralFeedback,
      });

      alert('Evaluation submitted successfully!');
      setShowGradingModal(false);
      loadSubmissions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit evaluation');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Student Submissions & Evaluation</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Review test attempts, verify automated MCQ scorings, and manually grade subjective & programming submissions.
        </p>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Assessment</th>
              <th>Submitted Date</th>
              <th>Status</th>
              <th>Calculated Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                  Loading submissions...
                </td>
              </tr>
            ) : submissions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                  No candidate submissions recorded yet.
                </td>
              </tr>
            ) : (
              submissions.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{sub.student?.user?.firstName} {sub.student?.user?.lastName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{sub.student?.enrollmentNo}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{sub.test?.title}</div>
                    <span className="badge badge-secondary">{sub.test?.subject?.name || 'General'}</span>
                  </td>
                  <td>{new Date(sub.submittedAt || sub.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${sub.status === 'EVALUATED' ? 'badge-success' : 'badge-warning'}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td>
                    {sub.result ? (
                      <span style={{ fontWeight: 700, color: sub.result.isPassed ? 'var(--success)' : 'var(--danger)' }}>
                        {sub.result.percentage}% ({sub.result.obtainedMarks}/{sub.result.totalMarks})
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>Awaiting Review</span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => openGradingModal(sub)}
                      className="btn btn-primary btn-sm"
                    >
                      <Sparkles size={14} /> Grade & Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Grading Modal */}
      {showGradingModal && selectedSubmission && (
        <div className="modal-backdrop">
          <div className="modal-card animate-slide" style={{ maxWidth: '820px', maxHeight: '88vh' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Evaluate Candidate Submission</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Student: {selectedSubmission.student?.user?.firstName} {selectedSubmission.student?.user?.lastName} • Test: {selectedSubmission.test?.title}
                </div>
              </div>
              <button onClick={() => setShowGradingModal(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              {selectedSubmission.answers?.map((ans: any, idx: number) => {
                const q = ans.question;
                const maxMarks = q?.marks || 1;
                const currentGrade = grades[ans.questionId]?.marks ?? (ans.marksObtained ?? 0);

                return (
                  <div
                    key={ans.id || idx}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                        Question {idx + 1} ({q?.questionType}) • Max: {maxMarks} Marks
                      </span>
                      {ans.isCorrect !== null && ans.isCorrect !== undefined && (
                        <span className={`badge ${ans.isCorrect ? 'badge-success' : 'badge-danger'}`}>
                          {ans.isCorrect ? 'Auto-Verified Correct' : 'Auto-Verified Incorrect'}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '10px' }}>
                      {q?.questionText}
                    </div>

                    {/* Student's answer display */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '12px', fontSize: '0.88rem' }}>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem', display: 'block', marginBottom: '4px' }}>
                        Candidate Answer:
                      </span>
                      {ans.selectedOptionId ? (
                        <span>
                          Selected Option: {q?.options?.find((o: any) => o.id === ans.selectedOptionId)?.optionText || ans.selectedOptionId}
                        </span>
                      ) : (
                        <span style={{ fontFamily: q?.questionType === 'PROGRAMMING' ? 'var(--font-mono)' : 'inherit', whiteSpace: 'pre-wrap' }}>
                          {ans.answer || '<No response submitted>'}
                        </span>
                      )}
                    </div>

                    {/* Instructor Marks Awarding */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '0.84rem', fontWeight: 600 }}>Marks Awarded:</label>
                        <input
                          type="number"
                          min="0"
                          max={maxMarks}
                          step="0.5"
                          value={currentGrade}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setGrades(prev => ({
                              ...prev,
                              [ans.questionId]: {
                                ...prev[ans.questionId],
                                marks: Math.min(val, maxMarks),
                              },
                            }));
                          }}
                          className="form-input"
                          style={{ width: '80px', padding: '6px 10px' }}
                        />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>/ {maxMarks}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Overall Feedback */}
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label className="form-label">Teacher Evaluation Feedback & Notes</label>
                <textarea
                  rows={3}
                  value={teacherGeneralFeedback}
                  onChange={(e) => setTeacherGeneralFeedback(e.target.value)}
                  placeholder="Provide feedback on candidate's strengths and areas for improvement..."
                  className="form-textarea"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowGradingModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                disabled={evaluating}
                onClick={handleSaveEvaluation}
                className="btn btn-primary"
              >
                <Send size={15} />
                <span>{evaluating ? 'Saving...' : 'Finalize & Post Grades'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
