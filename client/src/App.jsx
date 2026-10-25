import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import LiveBusesPage from './pages/LiveBusesPage';
import ParentDashboard from './pages/ParentDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LostAndFound from './pages/LostAndFound';

function MainApp() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'live';
  });

  // Sync tab with role on login unless explicit hash is provided
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setActiveTab(hash);
      return;
    }
    if (role === 'admin') setActiveTab('admin');
    else if (role === 'driver') setActiveTab('driver');
    else if (role === 'parent') setActiveTab('parent');
    else setActiveTab('live');
  }, [role]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <div style={{ flex: 1 }}>
        {activeTab === 'live' && <LiveBusesPage />}
        {activeTab === 'parent' && <ParentDashboard />}
        {activeTab === 'driver' && <DriverDashboard />}
        {activeTab === 'admin' && <AdminDashboard />}
        {activeTab === 'lost_found' && <LostAndFound onTabChange={setActiveTab} />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainApp />
      </SocketProvider>
    </AuthProvider>
  );
}
