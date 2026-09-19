import React, { useState, useEffect } from 'react';
import { testApi } from '../services/api';
import { TestAssignment } from '../types';
import { Link } from 'react-router-dom';
import {
  FileCheck2,
  Clock,
  Award,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export const StudentAssessmentPage: React.FC = () => {
  const [assignments, setAssignments] = useState<TestAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const res = await testApi.getStudentAssignments();
      if (res.data?.data) {
        setAssignments(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pending = assignments.filter(a => a.status === 'NOT_STARTED' || a.status === 'IN_PROGRESS');
  const completed = assignments.filter(a => a.status === 'SUBMITTED' || a.status === 'EVALUATED');

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>My Assessments</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Attempt your assigned assessments, track submission timelines, and review detailed scores.
        </p>
      </div>

      {/* Pending / Available Assessments */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="#6366f1" />
          <span>Active & Upcoming Assessments ({pending.length})</span>
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
            Loading assignments...
          </div>
        ) : pending.length === 0 ? (
          <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <CheckCircle2 size={36} color="#10b981" style={{ marginBottom: '10px' }} />
            <p>You have no pending tests! All caught up.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {pending.map((asgn) => {
              const test = asgn.test;
              return (
                <div key={asgn.id} className="glass-card glass-card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span className="badge badge-secondary">{test.subject?.name || 'General'}</span>
                      <span className="badge badge-primary">{asgn.status}</span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>
                      {test.title}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                      {test.description || 'Comprehensive evaluation covering subject concepts.'}
                    </p>

                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                      <div>⏱️ {test.duration} mins</div>
                      <div>📝 {test._count?.testQuestions || 0} Questions</div>
                      {test.passingScore && <div>🎯 Pass: {test.passingScore}%</div>}
                    </div>
                  </div>

                  <Link
                    to={`/assessment/${test.id}`}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    <span>{asgn.status === 'IN_PROGRESS' ? 'Resume Test' : 'Start Assessment'}</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Assessments */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={18} color="#10b981" />
          <span>Completed Evaluations ({completed.length})</span>
        </h2>

        {completed.length === 0 ? (
          <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
            No past completed tests yet.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Test Title</th>
                  <th>Subject</th>
                  <th>Submitted At</th>
                  <th>Score</th>
                  <th>Outcome</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((asgn) => {
                  const submission = asgn.submissions?.[0];
                  const result = submission?.result;
                  return (
                    <tr key={asgn.id}>
                      <td style={{ fontWeight: 600 }}>{asgn.test.title}</td>
                      <td>
                        <span className="badge badge-secondary">{asgn.test.subject?.name || 'General'}</span>
                      </td>
                      <td>
                        {submission?.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : '-'}
                      </td>
                      <td>
                        {result ? (
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                            {result.percentage}% ({result.obtainedMarks}/{result.totalMarks})
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>Pending Evaluation</span>
                        )}
                      </td>
                      <td>
                        {result ? (
                          <span className={`badge ${result.isPassed ? 'badge-success' : 'badge-danger'}`}>
                            {result.isPassed ? 'Passed' : 'Failed'}
                          </span>
                        ) : (
                          <span className="badge badge-warning">Grading</span>
                        )}
                      </td>
                      <td>
                        <Link
                          to={`/assessment/${asgn.test.id}/result`}
                          className="btn btn-secondary btn-sm"
                        >
                          View Results & Solutions
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
