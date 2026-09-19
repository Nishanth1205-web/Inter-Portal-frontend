import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { systemApi } from '../services/api';
import { Notification, Role } from '../types';
import { Bell, LogOut, Sparkles, CheckCheck } from 'lucide-react';

export const Topbar: React.FC = () => {
  const { user, logout, quickSwitch, originalRole } = useAuth();
  const effectiveRole = originalRole || user?.role;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const res = await systemApi.getNotifications();
      if (res.data?.data?.notifications) {
        setNotifications(res.data.data.notifications);
      }
    } catch (_err) {}
  };

  const markAllRead = async () => {
    try {
      await systemApi.markNotificationsRead('all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (_err) {}
  };

  const handleRoleSwitch = async (role: Role) => {
    setSwitching(true);
    try {
      await quickSwitch(role);
    } finally {
      setSwitching(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getRoleBadge = (role?: Role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="badge badge-primary">⚡ Super Admin</span>;
      case 'ADMIN':
        return <span className="badge badge-info">🛡️ Admin</span>;
      case 'STUDENT':
        return <span className="badge badge-success">🎓 Student</span>;
      default:
        return null;
    }
  };

  return (
    <header className="topbar">
      {/* Left: Role Switcher for instant demo exploration */}
      {effectiveRole !== 'STUDENT' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Sparkles size={14} color="#818cf8" />
            <span>Switch Role:</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {effectiveRole === 'SUPER_ADMIN' && (
              <button
                onClick={() => handleRoleSwitch('SUPER_ADMIN')}
                disabled={switching || user?.role === 'SUPER_ADMIN'}
                className={`btn btn-sm ${user?.role === 'SUPER_ADMIN' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                Super Admin
              </button>
            )}
            
            {(effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'ADMIN') && (
              <button
                onClick={() => handleRoleSwitch('ADMIN')}
                disabled={switching || user?.role === 'ADMIN'}
                className={`btn btn-sm ${user?.role === 'ADMIN' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                Admin
              </button>
            )}

            <button
              onClick={() => handleRoleSwitch('STUDENT')}
              disabled={switching || user?.role === 'STUDENT'}
              className={`btn btn-sm ${user?.role === 'STUDENT' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              Student
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}

      {/* Right: Notifications & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Notifications Popover */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="btn btn-ghost"
            style={{ position: 'relative', padding: '8px', borderRadius: '50%' }}
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  background: 'var(--danger)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="glass-card animate-slide"
              style={{
                position: 'absolute',
                right: 0,
                top: '48px',
                width: '340px',
                padding: '16px',
                zIndex: 50,
                boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: n.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(99, 102, 241, 0.08)',
                        borderLeft: n.isRead ? '2px solid transparent' : '2px solid var(--primary)',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '2px' }}>{n.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="avatar">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.2 }}>
              {user?.firstName} {user?.lastName}
            </span>
            <div style={{ marginTop: '3px' }}>
              {getRoleBadge(user?.role)}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="btn btn-ghost"
          style={{ padding: '8px', color: 'var(--text-dim)' }}
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};
