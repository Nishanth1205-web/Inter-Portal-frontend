import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../services/api';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  HelpCircle,
  FileCheck2,
  BookOpen,
  Award,
  Clock,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [liveStats, setLiveStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [user?.role]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      let res;
      if (user?.role === 'SUPER_ADMIN') {
        res = await dashboardApi.getSuperAdmin();
        dashboardApi.getLiveStats().then(r => setLiveStats(r.data?.data)).catch(() => {});
      } else if (user?.role === 'ADMIN') {
        res = await dashboardApi.getAdmin();
        dashboardApi.getLiveStats().then(r => setLiveStats(r.data?.data)).catch(() => {});
      } else {
        res = await dashboardApi.getStudent();
      }
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Optional: Poll live stats every 30 seconds for Admins/SuperAdmins
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
      const interval = setInterval(() => {
        dashboardApi.getLiveStats().then(r => setLiveStats(r.data?.data)).catch(() => {});
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.role]);

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
        <p>Loading your dashboard analytics...</p>
      </div>
    );
  }

  // ============================================
  // SUPER ADMIN DASHBOARD
  // ============================================
  if (user?.role === 'SUPER_ADMIN') {
    const stats = data?.stats || {};
    const charts = data?.charts || {};
    const submissions = data?.recentSubmissions || [];

    return (
      <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Welcome Banner */}
        <div
          className="glass-card"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.05))',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>
              Welcome back, {user.firstName}! 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Here is your central institution overview and real-time assessment telemetry.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/questions" className="btn btn-primary btn-sm">
              <HelpCircle size={16} /> Question Bank
            </Link>
            <Link to="/tests" className="btn btn-secondary btn-sm">
              <FileCheck2 size={16} /> Create Test
            </Link>
          </div>
        </div>

        {/* Live Monitoring Dashboard (Super Admin) */}
        {liveStats && (
          <div className="glass-card" style={{ display: 'flex', gap: '24px', alignItems: 'center', padding: '16px 24px', borderLeft: '4px solid var(--success)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={24} color="var(--success)" className="animate-pulse" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Live Telemetry <span className="badge badge-success" style={{ animation: 'pulse 2s infinite' }}>● LIVE</span>
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Real-time student portal activity</p>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '32px', justifyContent: 'flex-end' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)' }}>{liveStats.activeStudentsCount || 0}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Students Online</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>{liveStats.activeTestsCount || 0}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active Tests</div>
              </div>
            </div>
          </div>
        )}

        {/* Metric KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Total Students</span>
              <div className="stat-icon"><GraduationCap size={20} /></div>
            </div>
            <div className="stat-value">{stats.totalStudents || 0}</div>
            <div className="stat-subtitle">Enrolled across batches</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Instructors & Admins</span>
              <div className="stat-icon"><Users size={20} /></div>
            </div>
            <div className="stat-value">{stats.totalAdmins || 0}</div>
            <div className="stat-subtitle">Active faculty members</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Question Repository</span>
              <div className="stat-icon"><HelpCircle size={20} /></div>
            </div>
            <div className="stat-value">{stats.totalQuestions || 0}</div>
            <div className="stat-subtitle">Multi-type curated items</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Total Tests</span>
              <div className="stat-icon"><FileCheck2 size={20} /></div>
            </div>
            <div className="stat-value">{stats.totalTests || 0}</div>
            <div className="stat-subtitle">{stats.assignedTests || 0} actively assigned</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Completed Submissions</span>
              <div className="stat-icon"><Award size={20} /></div>
            </div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>
              {stats.completedSubmissions || 0}
            </div>
            <div className="stat-subtitle">{stats.pendingSubmissions || 0} pending grading</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Learning Modules</span>
              <div className="stat-icon"><BookOpen size={20} /></div>
            </div>
            <div className="stat-value">{stats.totalMaterials || 0}</div>
            <div className="stat-subtitle">PPT, Video, Docs, Diagrams</div>
          </div>
        </div>

        {/* Telemetry Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
          {/* Chart 1: Monthly Test Completions */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Assessment Activity Trend</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Completed submissions over past months</p>
              </div>
              <TrendingUp size={20} color="#6366f1" />
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={charts.testCompletionByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="var(--text-dim)" fontSize={12} />
                  <YAxis stroke="var(--text-dim)" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#111622', border: '1px solid var(--border)', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Subject Performance */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Average Score by Subject</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Mean student performance percentage</p>
              </div>
              <Sparkles size={20} color="#10b981" />
            </div>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={charts.subjectPerformance || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="subject" stroke="var(--text-dim)" fontSize={12} />
                  <YAxis stroke="var(--text-dim)" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: '#111622', border: '1px solid var(--border)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="avg_score" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Submissions Feed */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Recent Student Submissions</h3>
            <Link to="/evaluations" className="btn btn-ghost btn-sm">
              <span>View All</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Test Title</th>
                  <th>Submitted At</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>
                      No submissions recorded yet.
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub: any) => (
                    <tr key={sub.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {sub.assignment?.student?.user?.firstName} {sub.assignment?.student?.user?.lastName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {sub.assignment?.student?.enrollmentNo}
                        </div>
                      </td>
                      <td>{sub.assignment?.test?.title}</td>
                      <td>{new Date(sub.submittedAt || sub.createdAt).toLocaleDateString()}</td>
                      <td>
                        {sub.result ? (
                          <span style={{ fontWeight: 700, color: sub.result.percentage >= 50 ? 'var(--success)' : 'var(--danger)' }}>
                            {sub.result.percentage}% ({sub.result.obtainedMarks}/{sub.result.totalMarks})
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>Pending</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${sub.status === 'EVALUATED' ? 'badge-success' : 'badge-warning'}`}>
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // ADMIN DASHBOARD
  // ============================================
  if (user?.role === 'ADMIN') {
    const stats = data?.stats || {};
    const submissions = data?.recentSubmissions || [];

    return (
      <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), transparent)' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>
            Instructor Dashboard — {user.firstName} {user.lastName}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage authored assessments, assign tests to cohorts, and grade subjective submissions.
          </p>
        </div>

        {/* Live Monitoring Dashboard (Admin) */}
        {liveStats && (
          <div className="glass-card" style={{ display: 'flex', gap: '24px', alignItems: 'center', padding: '16px 24px', borderLeft: '4px solid var(--success)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={24} color="var(--success)" className="animate-pulse" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Live Telemetry <span className="badge badge-success" style={{ animation: 'pulse 2s infinite' }}>● LIVE</span>
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Real-time student portal activity</p>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '32px', justifyContent: 'flex-end' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)' }}>{liveStats.activeStudentsCount || 0}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Students Online</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>{liveStats.activeTestsCount || 0}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active Tests</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Tests Created</span>
              <div className="stat-icon"><FileCheck2 size={20} /></div>
            </div>
            <div className="stat-value">{stats.totalTests || 0}</div>
            <div className="stat-subtitle">Created under your account</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Student Assignments</span>
              <div className="stat-icon"><Users size={20} /></div>
            </div>
            <div className="stat-value">{stats.totalAssignments || 0}</div>
            <div className="stat-subtitle">Total students assigned</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Pending Grading</span>
              <div className="stat-icon"><Clock size={20} /></div>
            </div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>
              {stats.pendingEvaluations || 0}
            </div>
            <div className="stat-subtitle">Descriptive/Programming answers</div>
          </div>
        </div>

        {/* Recent Submissions for this admin */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>Submissions for Review</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Test</th>
                  <th>Submitted At</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>
                      No submissions awaiting evaluation.
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub: any) => (
                    <tr key={sub.id}>
                      <td>{sub.assignment?.student?.user?.firstName} {sub.assignment?.student?.user?.lastName}</td>
                      <td>{sub.assignment?.test?.title}</td>
                      <td>{new Date(sub.submittedAt || sub.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${sub.status === 'EVALUATED' ? 'badge-success' : 'badge-warning'}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td>
                        <Link to="/evaluations" className="btn btn-secondary btn-sm">
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // STUDENT DASHBOARD
  // ============================================
  const assessment = data?.assessment || {};
  const learning = data?.learning || {};
  const assignments = assessment?.assignments || [];

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Student Welcome */}
      <div
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(99, 102, 241, 0.08))',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>
            Hello, {user?.firstName}! 🎯
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Track your assigned evaluations, review past test performances, and access personalized AI study materials.
          </p>
        </div>
        <Link to="/student/assessments" className="btn btn-primary">
          <FileCheck2 size={18} />
          <span>Go to Assessments</span>
        </Link>
      </div>

      {/* Student Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Assigned Tests</span>
            <div className="stat-icon"><FileCheck2 size={20} /></div>
          </div>
          <div className="stat-value">{assessment.totalTests || 0}</div>
          <div className="stat-subtitle">{assessment.completedTests || 0} completed</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Average Score</span>
            <div className="stat-icon"><Award size={20} /></div>
          </div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>
            {assessment.averageScore || 0}%
          </div>
          <div className="stat-subtitle">Across evaluated submissions</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Pending Tests</span>
            <div className="stat-icon"><Clock size={20} /></div>
          </div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>
            {assessment.pendingTests || 0}
          </div>
          <div className="stat-subtitle">Ready to be attempted</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Learning Materials</span>
            <div className="stat-icon"><BookOpen size={20} /></div>
          </div>
          <div className="stat-value">{learning.totalMaterials || 0}</div>
          <div className="stat-subtitle">{learning.completedMaterials || 0} completed</div>
        </div>
      </div>

      {/* Assigned Tests Table */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>My Assessment Schedule</h3>
          <Link to="/student/assessments" className="btn btn-ghost btn-sm">
            View All
          </Link>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Test Title</th>
                <th>Subject</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>
                    No assessments assigned right now. Enjoy your study time!
                  </td>
                </tr>
              ) : (
                assignments.map((asgn: any) => {
                  const submission = asgn.submissions?.[0];
                  const isDone = asgn.status === 'SUBMITTED' || asgn.status === 'EVALUATED';
                  return (
                    <tr key={asgn.id}>
                      <td style={{ fontWeight: 600 }}>{asgn.test?.title}</td>
                      <td>
                        <span className="badge badge-secondary">{asgn.test?.subject?.name || 'General'}</span>
                      </td>
                      <td>{asgn.test?.duration} mins</td>
                      <td>
                        <span className={`badge ${isDone ? 'badge-success' : 'badge-primary'}`}>
                          {asgn.status}
                        </span>
                      </td>
                      <td>
                        {submission?.result ? (
                          <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                            {submission.result.percentage}%
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>-</span>
                        )}
                      </td>
                      <td>
                        {!isDone ? (
                          <Link
                            to={`/assessment/${asgn.testId}`}
                            className="btn btn-primary btn-sm"
                          >
                            Start Test
                          </Link>
                        ) : (
                          <Link
                            to={`/assessment/${asgn.testId}/result`}
                            className="btn btn-secondary btn-sm"
                          >
                            <CheckCircle2 size={14} /> Review
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
