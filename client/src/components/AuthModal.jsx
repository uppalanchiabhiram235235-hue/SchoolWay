import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, User, Phone, Eye, EyeOff, Shield, Bus, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialTab = 'login', onAuthSuccess }) {
  const { loginWithCredentials, register } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab); // 'login' or 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState('parent');
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('Class 5');
  const [selectedStop, setSelectedStop] = useState('ST-BG4');

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await loginWithCredentials(loginEmail.trim(), loginPassword.trim());
      if (onAuthSuccess) onAuthSuccess(loggedUser.role);
      onClose();
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (regRole === 'parent' && !studentName.trim()) {
      setError('Please enter your child’s name for bus tracking.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: regRole,
        phone: regPhone.trim(),
        studentName: regRole === 'parent' ? studentName.trim() : undefined,
        grade: regRole === 'parent' ? studentGrade : undefined,
        stopId: regRole === 'parent' ? selectedStop : undefined
      };

      const newUser = await register(payload);
      if (onAuthSuccess) onAuthSuccess(newUser.role);
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed. Email might already be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clay-modal-backdrop" onClick={onClose}>
      <div 
        className="clay-modal-card auth-modal-box" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px', width: '92%' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#1a1402', boxShadow: 'var(--clay-button-shadow)'
            }}>
              <Bus size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.18rem', fontWeight: '800', color: '#ffffff', fontFamily: 'var(--font-display)', margin: 0 }}>
                SchoolWay Portal
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                Ghatkesar Central School &bull; Live Fleet Access
              </p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} title="Close Modal">
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          padding: '6px', background: 'rgba(15, 21, 36, 0.8)',
          borderRadius: '12px', margin: '20px 24px 16px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <button 
            type="button"
            className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
          >
            Sign In
          </button>
          <button 
            type="button"
            className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => { setActiveTab('register'); setError(''); setSuccessMsg(''); }}
          >
            Create Account
          </button>
        </div>

        {/* Alerts */}
        <div style={{ padding: '0 24px' }}>
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px',
              marginBottom: '14px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              padding: '10px 14px', borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#6ee7b7', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px',
              marginBottom: '14px'
            }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Body Content */}
        <div style={{ padding: '0 24px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Email Address
                </label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-input-icon" />
                  <input 
                    type="email"
                    name="schoolway_portal_email"
                    autoComplete="new-password"
                    required
                    placeholder=""
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="auth-input-field"
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                    Password
                  </label>
                </div>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-input-icon" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    name="schoolway_portal_password"
                    autoComplete="new-password"
                    required
                    placeholder=""
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="auth-input-field"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="clay-btn clay-btn-indigo"
                style={{ width: '100%', padding: '12px', fontSize: '0.92rem', marginTop: '12px', justifyContent: 'center' }}
              >
                {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <div className="auth-input-wrapper">
                  <User size={16} className="auth-input-icon" />
                  <input 
                    type="text"
                    required
                    placeholder=""
                    autoComplete="off"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="auth-input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Email Address *
                  </label>
                  <div className="auth-input-wrapper">
                    <Mail size={16} className="auth-input-icon" />
                    <input 
                      type="email"
                      required
                      placeholder=""
                      autoComplete="off"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="auth-input-field"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Phone Number
                  </label>
                  <div className="auth-input-wrapper">
                    <Phone size={16} className="auth-input-icon" />
                    <input 
                      type="tel"
                      placeholder=""
                      autoComplete="off"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="auth-input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Account Role Selector */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Register As
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <button 
                    type="button"
                    className={`role-select-card ${regRole === 'parent' ? 'active' : ''}`}
                    onClick={() => setRegRole('parent')}
                  >
                    <User size={16} />
                    <span>Parent</span>
                  </button>
                  <button 
                    type="button"
                    className={`role-select-card ${regRole === 'driver' ? 'active' : ''}`}
                    onClick={() => setRegRole('driver')}
                  >
                    <Bus size={16} />
                    <span>Bus Driver</span>
                  </button>
                  <button 
                    type="button"
                    className={`role-select-card ${regRole === 'admin' ? 'active' : ''}`}
                    onClick={() => setRegRole('admin')}
                  >
                    <Shield size={16} />
                    <span>School Staff</span>
                  </button>
                </div>
              </div>

              {/* Parent specific: Student details */}
              {regRole === 'parent' && (
                <div style={{
                  padding: '12px 14px', background: 'rgba(99, 102, 241, 0.08)',
                  borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)',
                  display: 'flex', flexDirection: 'column', gap: '10px'
                }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Child Information (Ghatkesar Campus)</span>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Student Full Name *
                    </label>
                    <div className="auth-input-wrapper">
                      <User size={15} className="auth-input-icon" />
                      <input 
                        type="text"
                        placeholder="e.g. Aarav Sharma"
                        autoComplete="off"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="auth-input-field"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        Grade / Class
                      </label>
                      <select 
                        value={studentGrade} 
                        onChange={(e) => setStudentGrade(e.target.value)}
                        className="auth-select-field"
                      >
                        <option value="Class 1">Class 1</option>
                        <option value="Class 2">Class 2</option>
                        <option value="Class 3">Class 3</option>
                        <option value="Class 4">Class 4</option>
                        <option value="Class 5">Class 5</option>
                        <option value="Class 6">Class 6</option>
                        <option value="Class 7">Class 7</option>
                        <option value="Class 8">Class 8</option>
                        <option value="Class 9">Class 9</option>
                        <option value="Class 10">Class 10</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                        Designated Bus Stop
                      </label>
                      <select 
                        value={selectedStop} 
                        onChange={(e) => setSelectedStop(e.target.value)}
                        className="auth-select-field"
                      >
                        <option value="ST-BG2">Ghatkesar RTC Stand (Bhongir Route)</option>
                        <option value="ST-BG4">Bibinagar AIIMS (Bhongir Route)</option>
                        <option value="ST-BG6">Bhongir Bypass (Bhongir Route)</option>
                        <option value="ST-BG7">Bhongir Bus Station & Fort</option>
                        <option value="ST-UP2">Pocharam Infosys SEZ (Uppal Route)</option>
                        <option value="ST-UP3">Narapally Junction (Uppal Route)</option>
                        <option value="ST-UP4">Medipally Junction (Uppal Route)</option>
                        <option value="ST-UP6">Boduppal X Roads (Uppal Route)</option>
                        <option value="ST-UP7">Uppal Ring Road & Metro</option>
                        <option value="ST-EC3">Rampally X Roads (ECIL Route)</option>
                        <option value="ST-EC4">Nagaram Junction (ECIL Route)</option>
                        <option value="ST-EC6">ECIL Depot (ECIL Route)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Passwords */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Password (min 6 chars) *
                  </label>
                  <div className="auth-input-wrapper">
                    <Lock size={16} className="auth-input-icon" />
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder=""
                      autoComplete="off"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="auth-input-field"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Confirm Password *
                  </label>
                  <div className="auth-input-wrapper">
                    <Lock size={16} className="auth-input-icon" />
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder=""
                      autoComplete="off"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="auth-input-field"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="clay-btn clay-btn-emerald"
                style={{ width: '100%', padding: '12px', fontSize: '0.92rem', marginTop: '6px', justifyContent: 'center' }}
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
