import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { apiUrl } from '../config/api';
import { 
  PackageSearch, Plus, Search, Filter, Camera, Upload, Trash2, 
  CheckCircle, Clock, MapPin, Bus, User, Phone, X, AlertCircle, 
  HelpCircle, Sparkles, Check, ChevronRight, Image as ImageIcon
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Water Bottle',
  'Bag / Backpack',
  'Lunch Box',
  'Clothing / Uniform',
  'Books & Notes',
  'Stationery & Pencil Box',
  'ID Card & Badges',
  'Electronics',
  'Other'
];

const BUS_OPTIONS = ['All', 'SW-01', 'SW-02', 'SW-03', 'SW-04', 'SW-05', 'SW-06', 'Campus'];

export default function LostAndFound({ onTabChange }) {
  const { user, role, token } = useAuth();
  const { socket, parentStudents } = useSocket();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBus, setSelectedBus] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'available', 'claimed'

  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [activeItemForClaim, setActiveItemForClaim] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Report Form state
  const [reportTitle, setReportTitle] = useState('');
  const [reportCategory, setReportCategory] = useState('Water Bottle');
  const [reportBus, setReportBus] = useState('SW-01');
  const [reportLocation, setReportLocation] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportImageBase64, setReportImageBase64] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState('');

  // Claim Form state
  const [claimParentName, setClaimParentName] = useState(user?.name || '');
  const [claimStudentName, setClaimStudentName] = useState(parentStudents?.[0]?.name || '');
  const [claimPhone, setClaimPhone] = useState(user?.phone || '');
  const [claimNotes, setClaimNotes] = useState('');
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState('');

  const fileInputRef = useRef(null);

  const canManage = role === 'admin' || role === 'driver';

  // 1. Fetch lost items from backend
  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedBus !== 'All') params.append('busNumber', selectedBus);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(apiUrl(`/api/lost-items?${params.toString()}`));
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error('[LostAndFound] Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedCategory, selectedBus, statusFilter, search]);

  // Real-time socket updates for lost items
  useEffect(() => {
    if (!socket) return;

    const handleCreated = (newItem) => {
      setItems(prev => [newItem, ...prev.filter(item => item._id !== newItem._id)]);
    };

    const handleUpdated = (updatedItem) => {
      setItems(prev => prev.map(item => item._id === updatedItem._id ? updatedItem : item));
    };

    const handleDeleted = ({ _id }) => {
      setItems(prev => prev.filter(item => item._id !== _id));
    };

    socket.on('lost_item:created', handleCreated);
    socket.on('lost_item:updated', handleUpdated);
    socket.on('lost_item:deleted', handleDeleted);

    return () => {
      socket.off('lost_item:created', handleCreated);
      socket.off('lost_item:updated', handleUpdated);
      socket.off('lost_item:deleted', handleDeleted);
    };
  }, [socket]);

  // Pre-fill parent claim details when opening claim modal
  const openClaimModal = (item) => {
    setActiveItemForClaim(item);
    setClaimParentName(user?.name || '');
    setClaimStudentName(parentStudents?.[0]?.name || '');
    setClaimPhone(user?.phone || '');
    setClaimNotes('');
    setClaimSuccess('');
    setShowClaimModal(true);
  };

  // Handle Photo selection & compression to Base64
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setReportError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setReportError('Image size exceeds 8MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress/resize for optimal transmission
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setReportImageBase64(dataUrl);
        setReportError('');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Submit new lost item report
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setReportError('');

    if (!reportTitle.trim() || !reportDescription.trim()) {
      setReportError('Please enter both item title and description.');
      return;
    }

    setReportSubmitting(true);
    try {
      const payload = {
        title: reportTitle.trim(),
        category: reportCategory,
        busNumber: reportBus,
        locationFound: reportLocation.trim() || `Bus ${reportBus}`,
        description: reportDescription.trim(),
        imageUrl: reportImageBase64 || '',
        reportedBy: {
          userId: user?._id,
          name: user ? `${user.name} (${role === 'admin' ? 'Principal' : 'Driver'})` : 'School Staff',
          role: role || 'driver',
          phone: user?.phone || ''
        }
      };

      const res = await fetch(apiUrl('/api/lost-items'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to submit report');
      }

      // Reset form
      setReportTitle('');
      setReportDescription('');
      setReportLocation('');
      setReportImageBase64('');
      setShowReportModal(false);
      fetchItems();
    } catch (err) {
      setReportError(err.message || 'Error creating lost item record.');
    } finally {
      setReportSubmitting(false);
    }
  };

  // Submit claim inquiry
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimParentName.trim() || !claimStudentName.trim() || !claimPhone.trim()) {
      alert('Please fill in parent name, student name, and contact phone.');
      return;
    }

    setClaimSubmitting(true);
    try {
      const res = await fetch(apiUrl(`/api/lost-items/${activeItemForClaim._id}/claim`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          parentName: claimParentName.trim(),
          studentName: claimStudentName.trim(),
          phone: claimPhone.trim(),
          claimNotes: claimNotes.trim()
        })
      });

      if (!res.ok) throw new Error('Claim submission failed');
      const updated = await res.json();

      setItems(prev => prev.map(item => item._id === updated._id ? updated : item));
      setClaimSuccess('Claim inquiry submitted! Please visit the school office with student ID to collect.');
      setTimeout(() => {
        setShowClaimModal(false);
      }, 1500);
    } catch (err) {
      alert(err.message || 'Error submitting claim');
    } finally {
      setClaimSubmitting(false);
    }
  };

  // Driver / Admin status update
  const handleStatusChange = async (itemId, newStatus) => {
    try {
      const res = await fetch(apiUrl(`/api/lost-items/${itemId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const updated = await res.json();
        setItems(prev => prev.map(i => i._id === updated._id ? updated : i));
      }
    } catch (err) {
      console.error('[LostAndFound] Status update error:', err);
    }
  };

  // Delete item record
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this lost item record?')) return;
    try {
      const res = await fetch(apiUrl(`/api/lost-items/${itemId}`), {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        setItems(prev => prev.filter(i => i._id !== itemId));
      }
    } catch (err) {
      console.error('[LostAndFound] Delete error:', err);
    }
  };

  const formatFoundTime = (dateStr) => {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 20px 60px' }}>
      
      {/* Page Header */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        gap: '16px', marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#1a1402', boxShadow: 'var(--clay-button-shadow)'
            }}>
              <PackageSearch size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#ffffff', fontFamily: 'var(--font-display)' }}>
                School Bus Lost & Found Desk
              </h1>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Items left behind on school buses & Ghatkesar campus. Parents can identify items and collect them from the school dispatch desk.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: Drivers and Principal can report found items */}
        {canManage && (
          <button 
            type="button"
            className="clay-btn clay-btn-amber"
            style={{ padding: '10px 18px', fontSize: '0.88rem', fontWeight: 700 }}
            onClick={() => setShowReportModal(true)}
          >
            <Plus size={16} /> Report Found Item
          </button>
        )}
      </div>

      {/* Campus Pickup Notice Banner */}
      <div style={{
        padding: '14px 18px',
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <MapPin size={20} color="#fbbf24" style={{ flexShrink: 0 }} />
          <div>
            <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#fbbf24' }}>
              Collection Location: Ghatkesar Central School — Main Admin Office / Fleet Dispatch Desk
            </span>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Pickup Hours: Monday to Saturday (8:00 AM – 4:30 PM). Please show student ID or proof of enrollment when collecting.
            </p>
          </div>
        </div>
        <div className="clay-badge clay-badge-yellow" style={{ fontSize: '0.72rem', padding: '4px 10px' }}>
          Verified School Depot
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="clay-card" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Search bar */}
          <div className="auth-input-wrapper" style={{ flex: '1 1 260px', maxWidth: '420px', margin: 0 }}>
            <Search size={16} className="auth-input-icon" />
            <input 
              type="text"
              placeholder="Search by item name, description, seat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="auth-input-field"
            />
            {search && (
              <button 
                type="button" 
                onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Bus Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Bus:</span>
            <select 
              value={selectedBus}
              onChange={(e) => setSelectedBus(e.target.value)}
              className="auth-select-field"
              style={{ padding: '8px 12px', fontSize: '0.82rem', width: 'auto' }}
            >
              <option value="All">All Buses & Campus</option>
              <option value="SW-01">Bus SW-01 (Bhongir Fwd)</option>
              <option value="SW-02">Bus SW-02 (Bhongir Rev)</option>
              <option value="SW-03">Bus SW-03 (Uppal Fwd)</option>
              <option value="SW-04">Bus SW-04 (Uppal Rev)</option>
              <option value="SW-05">Bus SW-05 (ECIL Fwd)</option>
              <option value="SW-06">Bus SW-06 (ECIL Rev)</option>
              <option value="Campus">School Campus Grounds</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{
            display: 'flex', background: 'rgba(15, 21, 36, 0.8)', padding: '4px',
            borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button 
              type="button"
              className={`clay-btn ${statusFilter === 'All' ? 'clay-btn-indigo' : 'clay-btn-dark'}`}
              style={{ padding: '6px 12px', fontSize: '0.76rem' }}
              onClick={() => setStatusFilter('All')}
            >
              All Items
            </button>
            <button 
              type="button"
              className={`clay-btn ${statusFilter === 'available' ? 'clay-btn-emerald' : 'clay-btn-dark'}`}
              style={{ padding: '6px 12px', fontSize: '0.76rem' }}
              onClick={() => setStatusFilter('available')}
            >
              Available
            </button>
            <button 
              type="button"
              className={`clay-btn ${statusFilter === 'claimed' ? 'clay-btn-yellow' : 'clay-btn-dark'}`}
              style={{ padding: '6px 12px', fontSize: '0.76rem' }}
              onClick={() => setStatusFilter('claimed')}
            >
              Claimed
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'rgba(255, 255, 255, 0.04)',
                color: selectedCategory === cat ? '#ffffff' : '#94a3b8',
                border: selectedCategory === cat ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Item List / Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div className="pulse-dot" style={{ margin: '0 auto 12px' }} />
          Loading Lost & Found catalog...
        </div>
      ) : items.length === 0 ? (
        <div className="clay-card" style={{ padding: '60px 24px', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
          <PackageSearch size={48} color="#64748b" style={{ margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>No Lost Items Found</h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            {search || selectedCategory !== 'All' || selectedBus !== 'All' 
              ? 'Try adjusting your search query or filters above.'
              : 'Great news! There are currently no recorded lost items reported on the buses.'}
          </p>
          {canManage && (
            <button 
              type="button" 
              className="clay-btn clay-btn-amber"
              style={{ margin: '18px auto 0', padding: '8px 16px', fontSize: '0.84rem' }}
              onClick={() => setShowReportModal(true)}
            >
              <Plus size={15} /> Report New Item
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {items.map(item => (
            <div 
              key={item._id} 
              className="clay-card"
              style={{
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                border: item.status === 'claimed' 
                  ? '1px solid rgba(245, 158, 11, 0.3)' 
                  : '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              {/* Photo Area or Icon Banner */}
              {item.imageUrl ? (
                <div 
                  style={{
                    position: 'relative',
                    height: '190px',
                    width: '100%',
                    background: '#090d16',
                    cursor: 'pointer',
                    overflow: 'hidden'
                  }}
                  onClick={() => setPreviewImage(item.imageUrl)}
                  title="Click to view full photo"
                >
                  <img 
                    src={item.imageUrl} 
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                    className="lost-item-img"
                  />
                  <div style={{
                    position: 'absolute', bottom: '8px', right: '8px',
                    background: 'rgba(0, 0, 0, 0.65)', padding: '4px 8px', borderRadius: '6px',
                    color: '#fff', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                    <Camera size={12} /> View Photo
                  </div>
                </div>
              ) : (
                <div style={{
                  height: '100px',
                  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.84rem'
                  }}>
                    <PackageSearch size={22} color="#818cf8" />
                    <span>{item.category}</span>
                  </div>
                </div>
              )}

              {/* Card Body */}
              <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                
                {/* Badges Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="clay-badge clay-badge-yellow" style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                      <Bus size={11} style={{ marginRight: '3px' }} />
                      {item.busNumber ? `Bus ${item.busNumber}` : 'Campus'}
                    </span>
                    <span className="clay-badge clay-badge-indigo" style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                      {item.category}
                    </span>
                  </div>

                  <span className={`clay-badge ${
                    item.status === 'available' 
                      ? 'clay-badge-emerald' 
                      : item.status === 'claimed' 
                        ? 'clay-badge-yellow' 
                        : 'clay-badge-blue'
                  }`} style={{ fontSize: '0.68rem', padding: '3px 8px' }}>
                    {item.status === 'available' ? 'Available' : item.status === 'claimed' ? 'Claimed' : 'Collected'}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: '0 0 6px', lineHeight: 1.3 }}>
                  {item.title}
                </h3>

                {/* Location Found */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '0.78rem', marginBottom: '8px' }}>
                  <MapPin size={13} style={{ flexShrink: 0 }} />
                  <span>Found at: <strong>{item.locationFound}</strong></span>
                </div>

                {/* Description */}
                <p style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  margin: '0 0 14px',
                  flex: 1
                }}>
                  {item.description}
                </p>

                {/* Found Timestamp & Reporter */}
                <div style={{
                  padding: '10px 12px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  marginBottom: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Reported by:</span>
                    <strong style={{ color: '#e2e8f0' }}>{item.reportedBy?.name || 'School Staff'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Date logged:</span>
                    <span>{formatFoundTime(item.foundDate)}</span>
                  </div>
                </div>

                {/* Claim details if claimed */}
                {item.status === 'claimed' && item.claimedBy?.parentName && (
                  <div style={{
                    padding: '8px 12px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    color: '#fef08a',
                    marginBottom: '12px'
                  }}>
                    <strong>Claim Pending:</strong> {item.claimedBy.parentName} for student <em>{item.claimedBy.studentName}</em>
                  </div>
                )}

                {/* Card Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: 'auto' }}>
                  
                  {/* Parent Claim Button */}
                  {item.status === 'available' && (
                    <button 
                      type="button"
                      className="clay-btn clay-btn-emerald"
                      style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem', justifyContent: 'center' }}
                      onClick={() => openClaimModal(item)}
                    >
                      <Check size={14} /> This is My Child's Item
                    </button>
                  )}

                  {/* Driver / Principal Status Toggle */}
                  {canManage && (
                    <div style={{ display: 'flex', gap: '6px', width: item.status === 'available' ? 'auto' : '100%' }}>
                      {item.status !== 'available' && (
                        <button 
                          type="button"
                          className="clay-btn clay-btn-dark"
                          style={{ padding: '8px 12px', fontSize: '0.74rem' }}
                          onClick={() => handleStatusChange(item._id, 'available')}
                          title="Reset to Available"
                        >
                          Mark Available
                        </button>
                      )}
                      {item.status !== 'collected' && (
                        <button 
                          type="button"
                          className="clay-btn clay-btn-indigo"
                          style={{ flex: 1, padding: '8px 12px', fontSize: '0.74rem', justifyContent: 'center' }}
                          onClick={() => handleStatusChange(item._id, 'collected')}
                          title="Mark Handed Over to Parent"
                        >
                          Mark Handed Over
                        </button>
                      )}
                      <button 
                        type="button"
                        className="clay-btn clay-btn-rose"
                        style={{ padding: '8px 10px' }}
                        onClick={() => handleDeleteItem(item._id)}
                        title="Delete Record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* REPORT MODAL (Driver / Principal) */}
      {showReportModal && (
        <div className="clay-modal-backdrop" onClick={() => setShowReportModal(false)}>
          <div 
            className="clay-modal-card auth-modal-box"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '540px', width: '92%' }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1402'
                }}>
                  <Plus size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Report Found Item
                  </h2>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Log an item left behind on a bus or campus for parent retrieval
                  </p>
                </div>
              </div>
              <button type="button" className="close-btn" onClick={() => setShowReportModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleReportSubmit} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '72vh', overflowY: 'auto' }}>
              
              {reportError && (
                <div style={{
                  padding: '10px 14px', borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  <span>{reportError}</span>
                </div>
              )}

              {/* Item Title */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Item Title / Name *
                </label>
                <div className="auth-input-wrapper">
                  <PackageSearch size={16} className="auth-input-icon" />
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Blue Milton 750ml Thermosteel Bottle"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="auth-input-field"
                  />
                </div>
              </div>

              {/* Category & Bus Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Item Category *
                  </label>
                  <select 
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="auth-select-field"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Found On Bus / Location *
                  </label>
                  <select 
                    value={reportBus}
                    onChange={(e) => setReportBus(e.target.value)}
                    className="auth-select-field"
                  >
                    <option value="SW-01">Bus SW-01 (Bhongir Route)</option>
                    <option value="SW-02">Bus SW-02 (Bhongir Inbound)</option>
                    <option value="SW-03">Bus SW-03 (Uppal Route)</option>
                    <option value="SW-04">Bus SW-04 (Uppal Inbound)</option>
                    <option value="SW-05">Bus SW-05 (ECIL Route)</option>
                    <option value="SW-06">Bus SW-06 (ECIL Inbound)</option>
                    <option value="Campus">School Campus / Assembly</option>
                  </select>
                </div>
              </div>

              {/* Precise Location on Bus */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Specific Location Where Found
                </label>
                <div className="auth-input-wrapper">
                  <MapPin size={16} className="auth-input-icon" />
                  <input 
                    type="text"
                    placeholder="e.g. Under Seat 8, Window Side or Front Overhead Rack"
                    value={reportLocation}
                    onChange={(e) => setReportLocation(e.target.value)}
                    className="auth-input-field"
                  />
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Detailed Description *
                </label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Describe color, brand, stickers, initials, condition, or items inside..."
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#090d16',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
                  }}
                />
              </div>

              {/* Photo Upload Section (Optional) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Photo of Lost Item (Optional)
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Photo or text description both supported
                  </span>
                </div>

                {reportImageBase64 ? (
                  <div style={{
                    position: 'relative', width: '100%', height: '180px',
                    borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}>
                    <img 
                      src={reportImageBase64} 
                      alt="Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <button 
                      type="button"
                      onClick={() => setReportImageBase64('')}
                      style={{
                        position: 'absolute', top: '8px', right: '8px',
                        background: 'rgba(239, 68, 68, 0.9)', color: '#fff',
                        border: 'none', borderRadius: '50%', width: '28px', height: '28px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                      }}
                      title="Remove photo"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed rgba(255, 255, 255, 0.15)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'rgba(255, 255, 255, 0.02)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Camera size={26} color="#818cf8" style={{ margin: '0 auto 8px' }} />
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>
                      Click to take photo or choose an image
                    </p>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Supports JPG, PNG, WebP (camera or file upload)
                    </span>
                    <input 
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handlePhotoSelect}
                    />
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button"
                  className="clay-btn clay-btn-dark"
                  style={{ flex: 1, padding: '12px', fontSize: '0.88rem', justifyContent: 'center' }}
                  onClick={() => setShowReportModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={reportSubmitting}
                  className="clay-btn clay-btn-amber"
                  style={{ flex: 2, padding: '12px', fontSize: '0.88rem', fontWeight: 800, justifyContent: 'center' }}
                >
                  {reportSubmitting ? 'Submitting Report...' : 'Publish to Lost & Found Desk'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CLAIM MODAL (Parent) */}
      {showClaimModal && activeItemForClaim && (
        <div className="clay-modal-backdrop" onClick={() => setShowClaimModal(false)}>
          <div 
            className="clay-modal-card auth-modal-box"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '480px', width: '92%' }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Claim Item for Your Child
                </h2>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Item: <strong>{activeItemForClaim.title}</strong>
                </p>
              </div>
              <button type="button" className="close-btn" onClick={() => setShowClaimModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleClaimSubmit} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {claimSuccess ? (
                <div style={{
                  padding: '16px', borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#6ee7b7', textAlign: 'center', fontSize: '0.88rem'
                }}>
                  <CheckCircle size={32} style={{ margin: '0 auto 8px', display: 'block' }} />
                  <strong>Claim Request Recorded!</strong>
                  <p style={{ fontSize: '0.78rem', margin: '6px 0 0', color: '#a7f3d0' }}>
                    {claimSuccess}
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Parent Full Name *
                    </label>
                    <div className="auth-input-wrapper">
                      <User size={16} className="auth-input-icon" />
                      <input 
                        type="text"
                        required
                        value={claimParentName}
                        onChange={(e) => setClaimParentName(e.target.value)}
                        className="auth-input-field"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Student Full Name & Class *
                    </label>
                    <div className="auth-input-wrapper">
                      <User size={16} className="auth-input-icon" />
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Aarav Sharma (Class 6-B)"
                        value={claimStudentName}
                        onChange={(e) => setClaimStudentName(e.target.value)}
                        className="auth-input-field"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Contact Phone Number *
                    </label>
                    <div className="auth-input-wrapper">
                      <Phone size={16} className="auth-input-icon" />
                      <input 
                        type="tel"
                        required
                        placeholder="+91 98765 12345"
                        value={claimPhone}
                        onChange={(e) => setClaimPhone(e.target.value)}
                        className="auth-input-field"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Verification Notes (e.g. stickers, contents, scratches)
                    </label>
                    <textarea 
                      rows={2}
                      placeholder="e.g. The bottle has a Batman sticker on bottom and Aarav's name scratched under lid."
                      value={claimNotes}
                      onChange={(e) => setClaimNotes(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#090d16',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '10px 12px',
                        color: '#ffffff',
                        fontSize: '0.84rem',
                        outline: 'none',
                        fontFamily: 'inherit',
                        resize: 'none'
                      }}
                    />
                  </div>

                  <div style={{
                    padding: '10px 12px', background: 'rgba(245, 158, 11, 0.08)',
                    borderRadius: '8px', fontSize: '0.74rem', color: '#fbbf24', display: 'flex', gap: '8px'
                  }}>
                    <MapPin size={16} style={{ flexShrink: 0 }} />
                    <span>Collect from Ghatkesar Central School Admin Office with student ID after submitting.</span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <button 
                      type="button"
                      className="clay-btn clay-btn-dark"
                      style={{ flex: 1, padding: '10px', fontSize: '0.84rem', justifyContent: 'center' }}
                      onClick={() => setShowClaimModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={claimSubmitting}
                      className="clay-btn clay-btn-emerald"
                      style={{ flex: 2, padding: '10px', fontSize: '0.84rem', fontWeight: 800, justifyContent: 'center' }}
                    >
                      {claimSubmitting ? 'Submitting...' : 'Submit Claim Request'}
                    </button>
                  </div>
                </>
              )}

            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN PHOTO ZOOM MODAL */}
      {previewImage && (
        <div 
          className="clay-modal-backdrop" 
          onClick={() => setPreviewImage(null)}
          style={{ zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div style={{ position: 'relative', maxWidth: '85vw', maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
            <img 
              src={previewImage} 
              alt="Lost item zoom" 
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }} 
            />
            <button 
              type="button" 
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute', top: '-14px', right: '-14px',
                background: '#ffffff', color: '#0f172a', border: 'none',
                borderRadius: '50%', width: '36px', height: '36px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)', cursor: 'pointer', fontWeight: 800
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
