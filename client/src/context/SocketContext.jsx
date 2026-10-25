import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { apiUrl, API_BASE_URL } from '../config/api';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const [buses, setBuses] = useState([]);
  const [busesMap, setBusesMap] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [simMode, setSimMode] = useState('demo');
  const [connected, setConnected] = useState(false);
  const [parentStudents, setParentStudents] = useState([]);

  const socketRef = useRef(null);
  const userRef = useRef(user);
  const parentStudentsRef = useRef([]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Fetch notifications based on role
  const fetchNotifications = useCallback(async () => {
    try {
      const currentUser = userRef.current;
      const url = currentUser?.role === 'parent' && currentUser?._id
        ? `/api/notifications?parentId=${currentUser._id}&limit=40`
        : '/api/notifications?limit=30';
      
      const notifRes = await fetch(apiUrl(url));
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData);
      }
    } catch (err) {
      console.error('[SocketContext] Notif fetch error:', err.message);
    }
  }, []);

  // Fetch live buses and simulator mode
  const fetchLiveFleet = useCallback(async () => {
    try {
      const [busRes, simRes] = await Promise.all([
        fetch(apiUrl('/api/buses/live')),
        fetch(apiUrl('/api/simulator/mode'))
      ]);

      if (busRes.ok) {
        const busData = await busRes.json();
        setBuses(busData);
        const map = {};
        busData.forEach(b => { map[b._id] = b; });
        setBusesMap(map);
      }

      if (simRes.ok) {
        const simData = await simRes.json();
        setSimMode(simData.mode || 'demo');
      }
    } catch (err) {
      console.error('[SocketContext] Initial fetch error:', err.message);
    }
  }, []);

  // Sync parent's students when user or token updates
  useEffect(() => {
    if (user?.role === 'parent' && token) {
      fetch(apiUrl('/api/students'), {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setParentStudents(data);
            parentStudentsRef.current = data;
          }
          fetchNotifications();
        })
        .catch(err => {
          console.error('[SocketContext] Error fetching parent students:', err);
          fetchNotifications();
        });
    } else {
      setParentStudents([]);
      parentStudentsRef.current = [];
      fetchNotifications();
    }
  }, [user?._id, user?.role, token, fetchNotifications]);

  useEffect(() => {
    fetchLiveFleet();

    // Setup Socket.IO connection (points to Render URL in production or '/' in local dev)
    const socket = io(API_BASE_URL || '/', {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_fleet');
      if (userRef.current?.role === 'parent' && userRef.current?._id) {
        socket.emit('join_parent', userRef.current._id);
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // Real-time bus GPS telemetry update
    socket.on('bus:location_update', (update) => {
      setBuses((prevBuses) => {
        return prevBuses.map((bus) => {
          if (bus._id === update.busId || bus.busNumber === update.busNumber) {
            return {
              ...bus,
              routeCode: update.routeCode || bus.routeCode || bus.route?.code || '',
              route: bus.route ? {
                ...bus.route,
                name: update.routeName || bus.route.name,
                code: update.routeCode || bus.route.code
              } : bus.route,
              lastLocation: {
                ...bus.lastLocation,
                lat: update.lat,
                lng: update.lng,
                heading: update.heading,
                speed: update.speed,
                currentStopId: update.currentStopId || bus.lastLocation?.currentStopId,
                currentStopName: update.currentStopName || bus.lastLocation?.currentStopName,
                lastStopName: update.lastStopName || bus.lastLocation?.lastStopName,
                nextStopId: update.nextStopId,
                nextStopName: update.nextStopName,
                etaMinutes: update.etaMinutes,
                distanceToNextStopMeters: update.distanceToNextStopMeters,
                dwellUntil: update.dwellUntil,
                currentStopSequence: update.currentStopSequence,
                totalStops: update.totalStops,
                lastUpdated: update.lastUpdated
              },
              status: update.status || bus.status
            };
          }
          return bus;
        });
      });

      setBusesMap((prev) => {
        const current = prev[update.busId];
        if (!current) return prev;
        return {
          ...prev,
          [update.busId]: {
            ...current,
            lastLocation: {
              ...current.lastLocation,
              lat: update.lat,
              lng: update.lng,
              heading: update.heading,
              speed: update.speed,
              nextStopId: update.nextStopId,
              nextStopName: update.nextStopName,
              etaMinutes: update.etaMinutes,
              distanceToNextStopMeters: update.distanceToNextStopMeters,
              dwellUntil: update.dwellUntil,
              lastUpdated: update.lastUpdated
            },
            status: update.status || current.status
          }
        };
      });
    });

    // Real-time notification with strict parent student filtering
    socket.on('notification:new', (notif) => {
      const currentUser = userRef.current;
      if (currentUser?.role === 'parent') {
        const students = parentStudentsRef.current || [];
        const studentIds = students.map(s => String(s._id));
        const studentNames = students.map(s => (s.name || '').toLowerCase());
        const childBuses = students.map(s => s.busNumber);

        const isChildNotification = (
          (notif.studentId && studentIds.includes(String(notif.studentId))) ||
          (notif.studentName && studentNames.includes(String(notif.studentName).toLowerCase())) ||
          (notif.recipientId && String(notif.recipientId) === String(currentUser._id))
        );
        const isChildBusNotification = (
          notif.busNumber && childBuses.includes(notif.busNumber)
        );

        if (!isChildNotification && !isChildBusNotification) {
          // Skip notifications that do not relate to this parent's child
          return;
        }
      }

      setNotifications((prev) => {
        if (notif._id && prev.some(n => n._id === notif._id)) return prev;
        return [notif, ...prev.slice(0, 40)];
      });
    });

    // Simulator mode changed
    socket.on('simulator:mode_changed', ({ mode }) => {
      setSimMode(mode || 'live');
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchLiveFleet]);

  // Keep socket parent room joined when user logs in
  useEffect(() => {
    if (socketRef.current && user?.role === 'parent' && user?._id) {
      socketRef.current.emit('join_parent', user._id);
    }
  }, [user?._id, user?.role]);

  const changeSimMode = async (newMode = 'live') => {
    try {
      setSimMode('live');
      if (socketRef.current) {
        socketRef.current.emit('simulator:set_mode', 'live');
      }
    } catch (err) {
      console.error('[SocketContext] Error toggling simulator mode:', err);
    }
  };

  const clearNotifications = async () => {
    try {
      await fetch(apiUrl('/api/notifications'), { method: 'DELETE' });
      setNotifications([]);
    } catch (err) {
      console.error('[SocketContext] Error clearing notifications:', err);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
        buses,
        busesMap,
        notifications,
        parentStudents,
        simMode,
        changeSimMode,
        clearNotifications,
        refreshFleet: fetchLiveFleet,
        refreshNotifications: fetchNotifications
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
