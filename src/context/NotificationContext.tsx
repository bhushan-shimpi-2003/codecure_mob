import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '../api/endpoints';
import { isApiSuccess, extractApiData, getApiError } from '../api/response';
import { useAuth } from './AuthContext';

interface Notification {
  id: string;
  _id?: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  createdAt?: string;
  read_at?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await notificationsApi.my();
      if (isApiSuccess(res.data)) {
        const data = extractApiData<Notification[]>(res.data, []);
        setNotifications(data);
        // Calculate unread count from notifications
        const count = data.filter(n => !n.is_read).length;
        setUnreadCount(count);
      } else {
        const err = getApiError(res.data);
        setError(err);
        console.error('Error fetching notifications:', err);
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to fetch notifications';
      setError(errorMsg);
      console.error('Error fetching notifications:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      const res = await notificationsApi.markAsRead(id);
      if (isApiSuccess(res.data)) {
        setNotifications(prev => 
          prev.map(n => (n.id === id || n._id === id) ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        console.error('Error marking as read:', getApiError(res.data));
      }
    } catch (e) {
      console.error('Error marking as read:', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await notificationsApi.markAllAsRead();
      if (isApiSuccess(res.data)) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
        setUnreadCount(0);
      } else {
        console.error('Error marking all as read:', getApiError(res.data));
      }
    } catch (e) {
      console.error('Error marking all as read:', e);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const res = await notificationsApi.delete(id);
      if (isApiSuccess(res.data)) {
        setNotifications(prev => prev.filter(n => n.id !== id && n._id !== id));
        setUnreadCount(prev => {
          const deleted = notifications.find(n => n.id === id || n._id === id);
          return deleted && !deleted.is_read ? Math.max(0, prev - 1) : prev;
        });
      } else {
        console.error('Error deleting notification:', getApiError(res.data));
      }
    } catch (e) {
      console.error('Error deleting notification:', e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll every 60 seconds
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      isLoading, 
      error,
      fetchNotifications, 
      markAsRead, 
      markAllAsRead,
      deleteNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
