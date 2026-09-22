import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';
import { useRole } from './RoleContext.jsx';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const value = useNotificationsInternal();
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}

// Internal hook used by the provider
function useNotificationsInternal() {
  const { actor, isAdmin } = useRole();
  const bdId = isAdmin ? null : actor.bdId;
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!bdId) return;
    setLoading(true);
    try {
      const data = await api.notifications(bdId, 24);
      setNotifications(data.notifications);
      setReadIds((current) => {
        const activeIds = new Set(data.notifications.map((notification) => String(notification._id)));
        return new Set([...current].filter((id) => activeIds.has(id)));
      });
      setLastCheck(new Date());
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [bdId]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Poll every 15 seconds when viewing as BD
  useEffect(() => {
    if (!bdId) return;
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [bdId, fetchNotifications]);

  // Also poll when window regains focus
  useEffect(() => {
    if (!bdId) return;
    const onFocus = () => fetchNotifications();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [bdId, fetchNotifications]);

  const markRead = useCallback(() => {
    setReadIds((current) => new Set([
      ...current,
      ...notifications.map((notification) => String(notification._id)),
    ]));
  }, [notifications]);

  return {
    notifications,
    count: notifications.filter((notification) => !readIds.has(String(notification._id))).length,
    loading,
    lastCheck,
    markRead,
    refresh: fetchNotifications
  };
}
