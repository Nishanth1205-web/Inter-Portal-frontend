import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  HelpCircle,
  FileCheck2,
  BookOpen,
  GraduationCap,
  BarChart3,
  Users,
  Building2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  return (
    <aside className="sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="brand-logo">
          <GraduationCap size={22} />
        </div>
        <div>
          <div className="brand-title">INTER Portal</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span className="brand-badge">AI Powered</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Main Menu</div>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        {/* Student-specific Navigation */}
        {role === 'STUDENT' && (
          <>
            <div className="nav-section-title">Student Portal</div>
            <NavLink
              to="/student/assessments"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <FileCheck2 size={18} />
              <span>My Assessments</span>
            </NavLink>
            <NavLink
              to="/student/learning"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <BookOpen size={18} />
              <span>Learning Materials</span>
            </NavLink>
          </>
        )}

        {/* Admin & Super Admin Navigation */}
        {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
          <>
            <div className="nav-section-title">Assessment Studio</div>
            <NavLink
              to="/questions"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <HelpCircle size={18} />
              <span>Question Bank</span>
            </NavLink>
            <NavLink
              to="/tests"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <FileCheck2 size={18} />
              <span>Test Management</span>
            </NavLink>
            <NavLink
              to="/materials"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <BookOpen size={18} />
              <span>Learning Materials</span>
            </NavLink>
            <NavLink
              to="/evaluations"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Sparkles size={18} />
              <span>Submissions & Grading</span>
            </NavLink>
            <NavLink
              to="/reports"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <BarChart3 size={18} />
              <span>Reports & Analytics</span>
            </NavLink>
          </>
        )}

        {/* Super Admin Only Administration */}
        {role === 'SUPER_ADMIN' && (
          <>
            <div className="nav-section-title">System Administration</div>
            <NavLink
              to="/users"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Users size={18} />
              <span>User Management</span>
            </NavLink>
            <NavLink
              to="/academics"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Building2 size={18} />
              <span>Departments & Batches</span>
            </NavLink>
            <NavLink
              to="/audit-logs"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <ShieldCheck size={18} />
              <span>Audit Logs</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer Info */}
      <div className="sidebar-footer">
        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
          <div>INTER Platform v1.0.0</div>
          <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></span>
            System Online
          </div>
        </div>
      </div>
    </aside>
  );
};
