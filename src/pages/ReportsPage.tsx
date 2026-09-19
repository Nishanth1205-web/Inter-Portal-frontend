import React, { useState, useEffect } from 'react';
import { reportApi, academicApi, testApi } from '../services/api';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  FileCode,
  Filter,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<'student' | 'test'>('student');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [departments, setDepartments] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedTest, setSelectedTest] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadReport();
  }, [reportType, selectedDepartment, selectedTest]);

  const loadFilters = async () => {
    try {
      const [depRes, testRes] = await Promise.all([
        academicApi.getDepartments(),
        testApi.getTests({ limit: 100 }),
      ]);
      if (depRes.data?.data) setDepartments(depRes.data.data);
      if (testRes.data?.data?.tests) setTests(testRes.data.data.tests);
    } catch (err) {
      console.error(err);
    }
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      if (reportType === 'student') {
        const res = await reportApi.getStudentReport({ departmentId: selectedDepartment || undefined });
        if (res.data?.data?.students) {
          setData(res.data.data.students);
        }
      } else {
        const res = await reportApi.getTestReport(selectedTest || undefined);
        if (res.data?.data) {
          setData(Array.isArray(res.data.data) ? res.data.data : [res.data.data]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setExporting(true);
    try {
      const params: any = {};
      if (selectedDepartment) params.departmentId = selectedDepartment;
      if (selectedTest) params.testId = selectedTest;

      const res = await reportApi.exportReport(reportType, format, params);
      // Create blob download
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inter_${reportType}_report_${Date.now()}.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export generation failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Institutional Reports & Export</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Comprehensive performance dossiers with instant CSV, Excel (.xlsx) and printable PDF downloads.
          </p>
        </div>

        {/* Real Export Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            disabled={exporting}
            onClick={() => handleExport('csv')}
            className="btn btn-secondary btn-sm"
          >
            <FileCode size={15} /> Export CSV
          </button>
          <button
            disabled={exporting}
            onClick={() => handleExport('excel')}
            className="btn btn-secondary btn-sm"
            style={{ color: '#34d399', borderColor: 'rgba(16,185,129,0.3)' }}
          >
            <FileSpreadsheet size={15} /> Export Excel
          </button>
          <button
            disabled={exporting}
            onClick={() => handleExport('pdf')}
            className="btn btn-primary btn-sm"
          >
            <FileText size={15} /> Download PDF
          </button>
        </div>
      </div>

      {/* Report Controls Strip */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setReportType('student')}
            className={`btn btn-sm ${reportType === 'student' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Student-Wise Roster
          </button>
          <button
            onClick={() => setReportType('test')}
            className={`btn btn-sm ${reportType === 'test' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Assessment Summary
          </button>
        </div>

        {reportType === 'student' ? (
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="form-select"
            style={{ width: 'auto', minWidth: '180px' }}
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        ) : (
          <select
            value={selectedTest}
            onChange={(e) => setSelectedTest(e.target.value)}
            className="form-select"
            style={{ width: 'auto', minWidth: '220px' }}
          >
            <option value="">All Tests</option>
            {tests.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table Data Render */}
      <div className="table-container">
        <table className="data-table">
          {reportType === 'student' ? (
            <>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Enrollment No</th>
                  <th>Department</th>
                  <th>Cohort</th>
                  <th>Tests Attempted</th>
                  <th>Passed</th>
                  <th>Average Percentage</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>Loading student report...</td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>No student records found.</td>
                  </tr>
                ) : (
                  data.map((stu) => (
                    <tr key={stu.id}>
                      <td style={{ fontWeight: 600 }}>{stu.name}</td>
                      <td>{stu.enrollmentNo}</td>
                      <td><span className="badge badge-secondary">{stu.department}</span></td>
                      <td>{stu.batch}</td>
                      <td>{stu.testsAttempted}</td>
                      <td><span style={{ color: 'var(--success)' }}>{stu.testsPassed}</span></td>
                      <td style={{ fontWeight: 700, color: stu.averagePercentage >= 50 ? 'var(--success)' : 'var(--danger)' }}>
                        {stu.averagePercentage}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </>
          ) : (
            <>
              <thead>
                <tr>
                  <th>Assessment Title</th>
                  <th>Subject</th>
                  <th>Total Enrolled</th>
                  <th>Submissions</th>
                  <th>Passed</th>
                  <th>Highest Score</th>
                  <th>Lowest Score</th>
                  <th>Average Score</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>Loading test metrics...</td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>No assessment metrics available.</td>
                  </tr>
                ) : (
                  data.map((t, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{t.title}</td>
                      <td><span className="badge badge-secondary">{t.subject}</span></td>
                      <td>{t.totalAssigned}</td>
                      <td>{t.totalSubmissions}</td>
                      <td style={{ color: 'var(--success)' }}>{t.passedCount}</td>
                      <td>{t.highestScore}%</td>
                      <td>{t.lowestScore}%</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{t.averageScore}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </>
          )}
        </table>
      </div>
    </div>
  );
};
