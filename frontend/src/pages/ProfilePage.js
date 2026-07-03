// src/pages/ProfilePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const calculateAge = (dob) => {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    dob: null,
    gender: '',
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile');
      setProfile(res.data.user);
      setForm(f => ({
        ...f,
        full_name: res.data.user.full_name,
        dob: new Date(res.data.user.dob),
        gender: res.data.user.gender
      }));
    } catch (e) {
      setError('Failed to load profile. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!form.full_name.trim()) {
      setError('Full name cannot be empty.');
      return;
    }

    if (form.new_password && form.new_password !== form.confirm_new_password) {
      setError('New passwords do not match.');
      return;
    }

    if (form.new_password && form.new_password.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (form.new_password && !form.current_password) {
      setError('Please enter your current password to change it.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name,
        dob: form.dob?.toISOString().split('T')[0],
        gender: form.gender,
      };

      if (form.new_password) {
        payload.current_password = form.current_password;
        payload.new_password = form.new_password;
      }

      const res = await api.put('/profile', payload);
      setProfile(res.data.user);
      updateUser(res.data.user);
      setSuccess('Profile updated successfully!');
      setEditing(false);
      setForm(f => ({
        ...f,
        current_password: '',
        new_password: '',
        confirm_new_password: ''
      }));
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete('/profile');
      logout();
      navigate('/login');
    } catch (e) {
      setError('Failed to delete account. Please try again.');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
          <div className="spinner" />
          <p style={{ color: '#64748B' }}>Loading profile...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: '660px' }}>

        {/* Page Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>
            👤 My Profile
          </h1>
          <p style={{ color: '#64748B' }}>View and manage your account information</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: '20px' }}>
            ✅ {success}
          </div>
        )}

        {/* ============================
            VIEW MODE
        ============================ */}
        {!editing && (
          <div className="card" style={{ marginBottom: '20px' }}>

            {/* Avatar + Name */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '20px',
              marginBottom: '28px', paddingBottom: '24px',
              borderBottom: '1px solid #E2E8F0'
            }}>
              <div style={{
                width: '80px', height: '80px',
                background: 'linear-gradient(135deg, #4F46E5, #14B8A6)',
                borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: '800', fontSize: '32px',
                flexShrink: 0
              }}>
                {profile?.full_name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>
                  {profile?.full_name}
                </h2>
                <p style={{ color: '#64748B', fontSize: '14px' }}>{profile?.email}</p>
                <div style={{
                  display: 'inline-block', marginTop: '6px',
                  background: '#EEF2FF', color: '#4F46E5',
                  padding: '3px 12px', borderRadius: '100px',
                  fontSize: '13px', fontWeight: '600'
                }}>
                  Age: {calculateAge(profile?.dob)} years
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              {[
                { icon: '👤', label: 'Full Name', value: profile?.full_name },
                { icon: '📧', label: 'Email Address', value: profile?.email },
                {
                  icon: '🎂', label: 'Date of Birth',
                  value: new Date(profile?.dob).toLocaleDateString('en-US', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })
                },
                { icon: '📅', label: 'Age', value: `${calculateAge(profile?.dob)} years old` },
                {
                  icon: '⚧', label: 'Gender',
                  value: profile?.gender?.charAt(0).toUpperCase() + profile?.gender?.slice(1)
                },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 16px', background: '#F8FAFC',
                  borderRadius: '12px', border: '1px solid #E2E8F0'
                }}>
                  <span style={{ fontSize: '22px', flexShrink: 0 }}>{icon}</span>
                  <div>
                    <p style={{
                      fontSize: '12px', color: '#94A3B8',
                      fontWeight: '600', marginBottom: '2px',
                      textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>{label}</p>
                    <p style={{ fontWeight: '600', color: '#0F172A', fontSize: '15px' }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit Button */}
            <button
              onClick={() => { setEditing(true); setError(''); setSuccess(''); }}
              className="btn btn-primary"
            >
              ✏️ Edit Profile
            </button>
          </div>
        )}

        {/* ============================
            EDIT MODE
        ============================ */}
        {editing && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #E2E8F0' }}>
              ✏️ Edit Profile
            </h3>

            {/* Full Name */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="form-input"
                placeholder="Enter your full name"
              />
            </div>

            {/* Date of Birth */}
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <DatePicker
                selected={form.dob}
                onChange={date => setForm(f => ({ ...f, dob: date }))}
                dateFormat="dd/MM/yyyy"
                maxDate={new Date()}
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                yearDropdownItemNumber={100}
                scrollableYearDropdown
              />
            </div>

            {/* Gender */}
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                value={form.gender}
                onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                className="form-input"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Password Change Section */}
            <div style={{
              borderTop: '1px solid #E2E8F0', paddingTop: '20px',
              marginTop: '8px', marginBottom: '20px'
            }}>
              <p style={{
                fontSize: '13px', fontWeight: '700', color: '#64748B',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px'
              }}>
                🔒 Change Password (optional)
              </p>

              {/* Current Password */}
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={form.current_password}
                    onChange={e => setForm(f => ({ ...f, current_password: e.target.value }))}
                    className="form-input"
                    placeholder="Enter current password"
                    style={{ paddingRight: '48px' }}
                  />
                  <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>
                    {showCurrentPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={form.new_password}
                    onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))}
                    className="form-input"
                    placeholder="Enter new password (min 8 characters)"
                    style={{ paddingRight: '48px' }}
                  />
                  <button type="button" onClick={() => setShowNewPass(!showNewPass)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>
                    {showNewPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  value={form.confirm_new_password}
                  onChange={e => setForm(f => ({ ...f, confirm_new_password: e.target.value }))}
                  className="form-input"
                  placeholder="Repeat new password"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {saving ? (
                  <>
                    <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                    Saving...
                  </>
                ) : '💾 Save Changes'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setError('');
                  setSuccess('');
                  setForm(f => ({ ...f, current_password: '', new_password: '', confirm_new_password: '' }));
                }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        )}

        {/* ============================
            DANGER ZONE — DELETE ACCOUNT
        ============================ */}
        <div className="card" style={{
          border: '2px solid #FECACA',
          background: '#FEF2F2'
        }}>
          <h3 style={{ fontWeight: '700', color: '#DC2626', fontSize: '17px', marginBottom: '8px' }}>
            ⚠️ Danger Zone
          </h3>
          <p style={{ color: '#7F1D1D', fontSize: '14px', marginBottom: '16px', lineHeight: '1.6' }}>
            Deleting your account is <strong>permanent and cannot be undone</strong>. 
            This will remove your profile, all assessment results, scores, and reports.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn btn-danger btn-sm"
          >
            🗑️ Delete My Account
          </button>
        </div>

      </div>

      {/* ============================
          DELETE CONFIRMATION MODAL
      ============================ */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '56px', marginBottom: '12px' }}>⚠️</div>
              <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', marginBottom: '10px' }}>
                Delete Account?
              </h3>
              <p style={{ color: '#64748B', fontSize: '15px', lineHeight: '1.6' }}>
                This will permanently delete your account and all your data including assessments, scores, and reports.
              </p>
              <p style={{ color: '#DC2626', fontWeight: '700', marginTop: '12px', fontSize: '14px' }}>
                This action cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn btn-danger"
                style={{ flex: 1 }}
              >
                {deleting ? (
                  <>
                    <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                    Deleting...
                  </>
                ) : '🗑️ Yes, Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default ProfilePage;
