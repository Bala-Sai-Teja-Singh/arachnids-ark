'use client';

import { useEffect } from 'react';
import { Bell, Check, Trash2, Info, CheckCircle, Clock, ExternalLink, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useNotificationStore } from '@/store/notification-store';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/shared/molecules/modal';
import { formatDistanceToNow } from 'date-fns';

export function NotificationCenter({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const { notifications, unreadCount, loadNotifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();

  useEffect(() => {
    if (user && open) {
      loadNotifications(user.id);
    }
  }, [user, open, loadNotifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'order': return <ShoppingBag className="h-4 w-4 text-blue-400" />;
      case 'booking': return <Clock className="h-4 w-4 text-brand-gold" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Modal 
      isOpen={open} 
      onClose={() => onOpenChange(false)}
      variant="side-drawer-right"
      noPadding
      title={(
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-5 w-5 text-brand-red" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-brand-red text-white border-2 border-background text-[8px] h-4 min-w-4 flex items-center justify-center p-0">
                {unreadCount}
              </Badge>
            )}
          </div>
          <span className="vibe-heading text-lg">Notifications</span>
        </div>
      )}
      footer={notifications.length > 0 ? (
        <div className="w-full px-6 pb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="vibe-button w-full text-red-400 hover:text-red-300 hover:bg-red-400/10 py-6"
            onClick={() => user && clearAll(user.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear all notifications
          </Button>
        </div>
      ) : null}
    >
      <div className="h-full flex flex-col">
        <div className="px-6 py-2">
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[10px] uppercase tracking-widest h-8 px-0 hover:bg-transparent hover:text-brand-gold"
              onClick={() => user && markAllAsRead(user.id)}
            >
              Mark all as read
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pb-4">
          {notifications.length === 0 ? (
            <div className="p-12 text-center mt-20">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                <Bell className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground font-heading uppercase tracking-widest">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notif) => (
                <motion.div 
                  key={notif.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => {
                    if (notif.link) {
                      router.push(notif.link);
                      onOpenChange(false);
                      markAsRead(notif.id);
                    }
                  }}
                  className={`p-5 transition-colors relative group cursor-pointer ${!notif.read ? 'bg-brand-red/5' : 'hover:bg-accent/30'}`}
                >
                  <div className="flex gap-4">
                    <div className="mt-1">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${!notif.read ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {notif.message}
                      </p>
                      {notif.link && (
                        <div className="flex items-center gap-1 text-[10px] text-brand-gold font-bold uppercase tracking-widest pt-1">
                          View Details <ExternalLink className="h-2 w-2" />
                        </div>
                      )}
                    </div>
                  </div>
                  {!notif.read && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notif.id);
                      }}
                      className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border p-1 rounded-md hover:text-brand-gold"
                      title="Mark as read"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
