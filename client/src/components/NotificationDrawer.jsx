import React from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Bell, X, AlertTriangle, CheckCircle, Clock, Bus, User, Trash2 } from 'lucide-react';

export default function NotificationDrawer({ isOpen, onClose }) {
  const { user } = useAuth();
  const { notifications, clearNotifications } = useSocket();

  if (!isOpen) return null;

  const isParent = user?.role === 'parent';

  const getIcon = (type) => {
    switch (type) {
      case 'sos':
      case 'delayed':
        return <AlertTriangle size={18} color="#f43f5e" />;
      case 'student_boarded':
      case 'student_dropped':
        return <CheckCircle size={18} color="#10b981" />;
      case 'approaching_stop':
      case 'arrived_stop':
        return <Clock size={18} color="#f59e0b" />;
      default:
        return <Bus size={18} color="#6366f1" />;
    }
  };

  const formatTime = (ts) => {
    if (!ts) return 'Just now';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="clay-modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '12px', background: 'var(--bg-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24',
              boxShadow: 'var(--clay-pill-shadow)'
            }}>
              <Bell size={18} />
            </div>
            <div>
              <h2>{isParent ? "Your Child's Transit Alerts" : "Live Fleet Alerts"}</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {isParent 
                  ? "Real-time boarding, stop approach & arrival alerts for your student"
                  : "Real-time trip events, ETA alarms & boarding updates"}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {notifications.length > 0 && (
              <button 
                type="button"
                className="clay-btn clay-btn-rose"
                style={{ padding: '6px 12px', fontSize: '0.76rem', gap: '5px' }}
                onClick={clearNotifications}
                title="Clear all alerts"
              >
                <Trash2 size={13} />
                <span>Clear All</span>
              </button>
            )}
            <button className="close-btn" onClick={onClose} title="Close drawer">
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '65vh', overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No notifications yet. Alerts will appear as buses move!
            </div>
          ) : (
            notifications.map((n, i) => (
              <div 
                key={n._id || i} 
                className="clay-card" 
                style={{ 
                  padding: '14px', 
                  borderRadius: 'var(--radius-sm)', 
                  display: 'flex', 
                  gap: '12px', 
                  alignItems: 'flex-start',
                  borderLeft: n.type === 'sos' ? '4px solid #f43f5e' : (n.type.includes('student') ? '4px solid #10b981' : '4px solid #6366f1')
                }}
              >
                <div style={{ marginTop: '2px' }}>
                  {getIcon(n.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '800', fontSize: '0.88rem', color: '#ffffff' }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {formatTime(n.timestamp)}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                    {n.message}
                  </p>
                  {n.busNumber && (
                    <div style={{ marginTop: '6px', display: 'flex', gap: '6px' }}>
                      <span className="clay-badge clay-badge-yellow" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                        Bus {n.busNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
