import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Notification {
  id: number;
  created_at: string;
  type: 'new_order' | 'new_user' | 'order_status_changed' | 'low_stock' | 'review_submitted';
  title: string;
  message?: string;
  entity_id?: string;
  entity_type?: string;
  read: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/notifications?unread=${unreadOnly}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch notifications');
      
      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (ids?: number[]) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(ids ? { ids } : { markAll: true })
      });

      if (!response.ok) throw new Error('Failed to mark notifications as read');

      // Update local state
      if (ids) {
        setNotifications(prev => 
          prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - ids.length));
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, []);

  const createNotification = useCallback(async (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(notification)
      });

      if (!response.ok) throw new Error('Failed to create notification');

      const data = await response.json();
      setNotifications(prev => [data.notification, ...prev]);
      if (!data.notification.read) {
        setUnreadCount(prev => prev + 1);
      }
      
      return data.notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }, []);

  // Subscribe to real-time notifications
  useEffect(() => {
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications' 
      }, (payload) => {
        const newNotification = payload.new as Notification;
        setNotifications(prev => [newNotification, ...prev]);
        if (!newNotification.read) {
          setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe();

    // Initial fetch
    fetchNotifications();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    createNotification
  };
}
