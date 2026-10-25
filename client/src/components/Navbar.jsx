import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Bus, Bell, Shield, User, LogOut, UserPlus, LogIn, PackageSearch } from 'lucide-react';
import AuthModal from './AuthModal';
import NotificationDrawer from './NotificationDrawer';

export default function Navbar({ activeTab, onTabChange }) {
  const { user, role, logout } = useAuth();
  const { notifications } = useSocket();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);

  const openAuth = (tab = 'login') => {
    setAuthModalTab(tab);
    setShowAuthModal(true);
  };

  const getGreetingName = () => {
    if (!user) return '';
    if (role === 'admin') {
      if (user.name.toLowerCase().includes('principal')) {
        return user.name.replace(/\(admin\)/i, '').trim();
      }
      return `Principal ${user.name}`;
    }
    return user.name;
  };

  return (
    <>
      <nav className="app-navbar">
        {/* Brand */}
        <div className="nav-brand" onClick={() => onTabChange('live')}>
          <div className="brand-icon">
            <Bus size={24} />
          </div>
          <div className="brand-text">
            <h1>SchoolWay</h1>
            <span className="brand-tag">Ghatkesar Central School</span>
          </div>
        </div>

        {/* Center / Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            type="button"
            className={`clay-btn ${activeTab === 'live' ? 'clay-btn-indigo' : 'clay-btn-dark'}`}
            style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            onClick={() => onTabChange('live')}
            title="Live Bus Fleet & City Map"
          >
            <Bus size={14} /> Live Fleet
          </button>

          <button 
            type="button"
            className={`clay-btn ${activeTab === 'lost_found' ? 'clay-btn-amber' : 'clay-btn-dark'}`}
            style={{ padding: '8px 14px', fontSize: '0.82rem' }}
            onClick={() => onTabChange('lost_found')}
            title="School Bus Lost & Found Desk"
          >
            <PackageSearch size={14} /> Lost & Found
          </button>
        </div>

        {/* Right Actions */}
        <div className="nav-actions">

          {/* Notification Bell */}
          <button 
            type="button"
            className="clay-btn clay-btn-dark"
            style={{ padding: '9px 12px', position: 'relative' }}
            onClick={() => setShowNotifDrawer(true)}
            title={role === 'parent' ? "Student Transit Alerts" : "Fleet Notifications"}
          >
            <Bell size={16} />
            {notifications.length > 0 && (
              <span style={{ 
                position: 'absolute', top: '-4px', right: '-4px', width: '18px', height: '18px', 
                borderRadius: '50%', background: 'var(--clay-rose)', color: '#fff', fontSize: '0.65rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800'
              }}>
                {notifications.length}
              </span>
            )}
          </button>

          {/* User Profile / Status OR Sign In & Register */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              
              {/* Respective welcome back greeting */}
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                onClick={() => onTabChange(role)}
                title="Go to your dashboard"
              >
                <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500 }}>
                  Welcome back,
                </span>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
                  {getGreetingName()}!
                </span>
              </div>

              {/* Role Badge */}
              <div 
                className={`clay-badge ${
                  role === 'admin' 
                    ? 'clay-badge-amber' 
                    : role === 'driver' 
                      ? 'clay-badge-yellow' 
                      : 'clay-badge-emerald'
                }`}
                style={{ padding: '5px 10px', cursor: 'pointer', fontSize: '0.74rem' }}
                onClick={() => onTabChange(role)}
                title="Go to Dashboard"
              >
                <span>{role === 'admin' ? 'Principal' : role === 'driver' ? 'Driver' : 'Parent'}</span>
              </div>

              {/* Sign Out */}
              <button 
                type="button"
                className="clay-btn clay-btn-dark"
                style={{ padding: '8px 10px' }}
                onClick={logout}
                title="Sign Out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                type="button"
                className="clay-btn clay-btn-dark"
                style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                onClick={() => openAuth('login')}
              >
                <LogIn size={14} /> Sign In
              </button>
              <button 
                type="button"
                className="clay-btn clay-btn-indigo"
                style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                onClick={() => openAuth('register')}
              >
                <UserPlus size={14} /> Register
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Auth Modal (Login / Register) */}
      <AuthModal 
        isOpen={showAuthModal}
        initialTab={authModalTab}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(role) => onTabChange(role)}
      />

      <NotificationDrawer 
        isOpen={showNotifDrawer} 
        onClose={() => setShowNotifDrawer(false)}
      />
    </>
  );
}
