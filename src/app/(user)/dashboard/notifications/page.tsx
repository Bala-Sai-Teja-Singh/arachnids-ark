'use client';

import { motion } from 'framer-motion';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/molecules/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';

const typeColors = {
  info: 'border-l-blue-400',
  success: 'border-l-green-400',
  warning: 'border-l-yellow-400',
  error: 'border-l-red-400',
};

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Notifications</h1>
          <p className="text-muted-foreground text-sm">Stay updated on your activities</p>
        </div>
        {notifications.length > 0 && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-border text-xs" onClick={() => user && markAllAsRead(user.id)}>
              <Check className="h-3 w-3 mr-1" /> Mark all read
            </Button>
            <Button size="sm" variant="outline" className="border-border text-xs text-red-400" onClick={() => user && clearAll(user.id)}>
              <Trash2 className="h-3 w-3 mr-1" /> Clear all
            </Button>
          </div>
        )}
      </motion.div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up! Notifications will appear here." />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, i) => (
            <motion.div key={notif.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
              <Card
                className={`border-border border-l-2 ${typeColors[notif.type as keyof typeof typeColors]} cursor-pointer transition-colors ${!notif.read ? 'bg-card' : 'bg-card/50 opacity-70'
                  }`}
                onClick={() => markAsRead(notif.id)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${notif.read ? 'bg-transparent' : 'bg-brand-gold'}`} />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{notif.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
