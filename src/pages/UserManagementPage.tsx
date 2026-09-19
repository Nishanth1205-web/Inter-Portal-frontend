import React, { useState, useEffect } from 'react';
import { userApi, academicApi } from '../services/api';
import { User, Role, Department, Batch } from '../types';
import {
  Users,
  Plus,
  Trash2,
  X,
  Mail,
  Lock,
  UserCheck,
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New user form state
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'STUDENT' as Role,
    enrollmentNo: '',
    departmentId: '',
    batchId: '',
    designation: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const loadInitialData = async () => {
    try {
      const [depRes, batchRes] = await Promise.all([
        academicApi.getDepartments(),
        academicApi.getBatches(),
      ]);
      if (depRes.data?.data) {
        setDepartments(depRes.data.data);
        if (depRes.data.data.length > 0) setForm(f => ({ ...f, departmentId: depRes.data.data[0].id }));
      }
      if (batchRes.data?.data) {
        setBatches(batchRes.data.data);
        if (batchRes.data.data.length > 0) setForm(f => ({ ...f, batchId: batchRes.data.data[0].id }));
      }
      loadUsers();
    } catch (err) { console.error(err); }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (roleFilter) params.role = roleFilter;
      const res = await userApi.getUsers(params);
      if (res.data?.data?.users) {
        setUsers(res.data.data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userApi.createUser(form);
      alert('User created successfully!');
      setShowAddModal(false);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate/delete this user?')) return;
    try {
      await userApi.deleteUser(id);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>User Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Provision and administer Super Administrators, Faculty Instructors, and Student Accounts.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>Add New User</span>
        </button>
      </div>

      {/* Filter strip */}
      <div className="glass-card" style={{ padding: '14px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setRoleFilter('')}
          className={`btn btn-sm ${roleFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
        >
          All Users ({users.length})
        </button>
        <button
          onClick={() => setRoleFilter('SUPER_ADMIN')}
          className={`btn btn-sm ${roleFilter === 'SUPER_ADMIN' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Super Admins
        </button>
        <button
          onClick={() => setRoleFilter('ADMIN')}
          className={`btn btn-sm ${roleFilter === 'ADMIN' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Instructors / Admins
        </button>
        <button
          onClick={() => setRoleFilter('STUDENT')}
          className={`btn btn-sm ${roleFilter === 'STUDENT' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Students
        </button>
      </div>

      {/* Users table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Enrollment / Designation</th>
              <th>Department / Batch</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>Loading accounts...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>No users found.</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'SUPER_ADMIN' ? 'badge-primary' : u.role === 'ADMIN' ? 'badge-info' : 'badge-success'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.student?.enrollmentNo || u.admin?.designation || '-'}
                  </td>
                  <td>
                    {u.student?.department?.name ? (
                      <span style={{ fontSize: '0.85rem' }}>
                        {u.student.department.name} ({u.student.batch?.name})
                      </span>
                    ) : '-'}
                  </td>
                  <td>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#f87171' }}
                      title="Deactivate Account"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card animate-slide">
            <div className="modal-header">
              <h2 className="modal-title">Provision New User Account</h2>
              <button onClick={() => setShowAddModal(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      required
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">System Role *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                    className="form-select"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="ADMIN">Faculty / Instructor (Admin)</option>
                    <option value="SUPER_ADMIN">Institutional Super Admin</option>
                  </select>
                </div>

                {form.role === 'STUDENT' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                    <div className="form-group">
                      <label className="form-label">Enrollment Number *</label>
                      <input
                        type="text"
                        required
                        value={form.enrollmentNo}
                        onChange={(e) => setForm({ ...form, enrollmentNo: e.target.value })}
                        placeholder="e.g. CS2026042"
                        className="form-input"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Department</label>
                        <select
                          value={form.departmentId}
                          onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                          className="form-select"
                        >
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Batch</label>
                        <select
                          value={form.batchId}
                          onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                          className="form-select"
                        >
                          {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {form.role === 'ADMIN' && (
                  <div className="form-group">
                    <label className="form-label">Designation / Title</label>
                    <input
                      type="text"
                      value={form.designation}
                      onChange={(e) => setForm({ ...form, designation: e.target.value })}
                      placeholder="e.g. Senior Professor"
                      className="form-input"
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
