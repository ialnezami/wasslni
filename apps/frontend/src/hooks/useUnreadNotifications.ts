import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getChatSocket } from '@/lib/socket';
import { useUnreadStore } from '@/store/unread.store';
import { useAuthStore } from '@/store/auth.store';
import type { Conversation } from '@/api/messages';

export function useUnreadNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const increment = useUnreadStore((s) => s.increment);
  const setFromConversations = useUnreadStore((s) => s.setFromConversations);
  const queryClient = useQueryClient();

  // Seed counts from cached conversations whenever they refresh
  useEffect(() => {
    const unsub = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === 'updated' &&
        Array.isArray(event.query.queryKey) &&
        event.query.queryKey[0] === 'conversations'
      ) {
        const data = event.query.state.data as Conversation[] | undefined;
        if (data) setFromConversations(data);
      }
    });
    return unsub;
  }, [queryClient, setFromConversations]);

  // Listen for real-time notifications from the server
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getChatSocket();

    const onNotification = (payload: { bookingId: string }) => {
      increment(payload.bookingId);
      // Also invalidate conversations so the last message preview refreshes
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    socket.on('new-message-notification', onNotification);
    return () => {
      socket.off('new-message-notification', onNotification);
    };
  }, [isAuthenticated, increment, queryClient]);
}
