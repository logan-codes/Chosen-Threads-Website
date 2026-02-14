import React from 'react';
import { Bell, Package, User, MessageSquare, AlertTriangle, Star, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const notificationIcons: Record<string, React.ReactNode> = {
  new_order: <Package className="w-4 h-4" />,
  new_user: <User className="w-4 h-4" />,
  order_status_changed: <Bell className="w-4 h-4" />,
  low_stock: <AlertTriangle className="w-4 h-4" />,
  review_submitted: <Star className="w-4 h-4" />,
};

const notificationColors: Record<string, string> = {
  new_order: 'bg-blue-100 text-blue-600',
  new_user: 'bg-green-100 text-green-600',
  order_status_changed: 'bg-purple-100 text-purple-600',
  low_stock: 'bg-red-100 text-red-600',
  review_submitted: 'bg-yellow-100 text-yellow-600',
};

export function NotificationBadge() {
  const { unreadCount } = useNotifications();

  return (
    <div className="relative">
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  );
}

export function NotificationPanel() {
  const { notifications, unreadCount, loading, markAsRead, fetchNotifications } = useNotifications();
  const [open, setOpen] = React.useState(false);

  const handleMarkAllAsRead = () => {
    markAsRead();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead([notification.id]);
    }
    
    // Navigate to relevant page based on entity type
    if (notification.entity_type === 'order' && notification.entity_id) {
      window.location.href = `/admin/orders`;
    } else if (notification.entity_type === 'user' && notification.entity_id) {
      window.location.href = `/admin/customers`;
    }
    
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <NotificationBadge />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              <Check className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {loading ? (
            <div className="flex items-center justify-center h-20">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <Bell className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full text-left p-4 hover:bg-gray-50 transition-colors",
                    !notification.read && "bg-blue-50/50"
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      notificationColors[notification.type] || 'bg-gray-100 text-gray-600'
                    )}>
                      {notificationIcons[notification.type] || <Bell className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium",
                        !notification.read && "text-gray-900"
                      )}>
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-4 border-t">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => fetchNotifications()}>
              Refresh
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
