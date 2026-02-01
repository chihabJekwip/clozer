'use client';

import { useState, useEffect } from 'react';
import { Notification, NotificationType } from '@/types';
import { 
  getNotificationsAsync, 
  markNotificationRead, 
  markAllNotificationsRead,
  getUnreadCount 
} from '@/lib/storage-v2';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Bell,
  BellRing,
  Trophy,
  AlertTriangle,
  Info,
  Target,
  Gift,
  FileText,
  UserX,
  CheckCircle,
  Clock,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  reminder: <Clock className="w-5 h-5" />,
  achievement: <Trophy className="w-5 h-5" />,
  alert: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
  objective: <Target className="w-5 h-5" />,
  birthday: <Gift className="w-5 h-5" />,
  quote_expiring: <FileText className="w-5 h-5" />,
  client_inactive: <UserX className="w-5 h-5" />,
};

const notificationColors: Record<NotificationType, string> = {
  reminder: 'bg-blue-100 text-blue-600',
  achievement: 'bg-yellow-100 text-yellow-600',
  alert: 'bg-red-100 text-red-600',
  info: 'bg-gray-100 text-gray-600',
  objective: 'bg-green-100 text-green-600',
  birthday: 'bg-pink-100 text-pink-600',
  quote_expiring: 'bg-orange-100 text-orange-600',
  client_inactive: 'bg-purple-100 text-purple-600',
};

interface NotificationsPanelProps {
  asSheet?: boolean;
}

export function NotificationsPanel({ asSheet = true }: NotificationsPanelProps) {
  const { currentUser } = useUser();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
    }
  }, [currentUser]);

  const loadNotifications = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    const data = await getNotificationsAsync(currentUser.id);
    setNotifications(data);
    setUnreadCount(data.filter(n => !n.isRead).length);
    setIsLoading(false);
  };

  const handleMarkRead = async (notification: Notification) => {
    if (notification.isRead) return;
    
    await markNotificationRead(notification.id);
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    
    await markAllNotificationsRead(currentUser.id);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
    setUnreadCount(0);
  };

  const handleNotificationClick = async (notification: Notification) => {
    await handleMarkRead(notification);
    
    if (notification.actionUrl) {
      setIsOpen(false);
      router.push(notification.actionUrl);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "À l'instant";
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const NotificationsList = () => (
    <div className="space-y-2">
      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Aucune notification</p>
          <p className="text-sm text-gray-400">Vous êtes à jour !</p>
        </div>
      ) : (
        <>
          {/* Unread notifications */}
          {notifications.filter(n => !n.isRead).length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Non lues ({notifications.filter(n => !n.isRead).length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Tout marquer lu
                </Button>
              </div>
              {notifications.filter(n => !n.isRead).map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </div>
          )}

          {/* Read notifications */}
          {notifications.filter(n => n.isRead).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2 px-1">
                Lues
              </h3>
              {notifications.filter(n => n.isRead).slice(0, 20).map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  const NotificationItem = ({ 
    notification, 
    onClick 
  }: { 
    notification: Notification; 
    onClick: () => void;
  }) => (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        notification.isRead 
          ? 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800' 
          : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
      }`}
    >
      <div className={`p-2 rounded-full ${notificationColors[notification.type]}`}>
        {notificationIcons[notification.type]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`font-medium text-sm ${notification.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">{formatTime(notification.createdAt)}</p>
      </div>
      {notification.actionUrl && (
        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
      )}
    </div>
  );

  // Trigger button
  const TriggerButton = (
    <Button variant="ghost" size="icon" className="relative">
      {unreadCount > 0 ? (
        <>
          <BellRing className="w-5 h-5" />
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        </>
      ) : (
        <Bell className="w-5 h-5" />
      )}
    </Button>
  );

  if (asSheet) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          {TriggerButton}
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount}</Badge>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 -mx-6 px-6 max-h-[calc(100vh-120px)] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex gap-3 p-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <NotificationsList />
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return <NotificationsList />;
}

// Notification badge for mobile nav
export function NotificationBadge() {
  const { currentUser } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (currentUser) {
      getNotificationsAsync(currentUser.id).then(notifications => {
        setUnreadCount(notifications.filter(n => !n.isRead).length);
      });
    }
  }, [currentUser]);

  if (unreadCount === 0) return null;

  return (
    <Badge 
      className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white text-[10px]"
    >
      {unreadCount > 9 ? '9+' : unreadCount}
    </Badge>
  );
}
