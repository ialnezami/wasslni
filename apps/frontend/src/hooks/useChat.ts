import { useEffect, useRef, useState } from 'react';
import type { Message } from '@wasslni/shared-types';
import { getChatSocket } from '@/lib/socket';
import { messagesApi } from '@/api/messages';

export function useChat(bookingId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const activeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setMessages([]);
      return;
    }

    activeRef.current = bookingId;
    const socket = getChatSocket();

    setIsLoading(true);
    messagesApi
      .getHistory(bookingId)
      .then((r) => {
        if (activeRef.current === bookingId) setMessages(r.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));

    socket.emit('join-booking', { bookingId });

    const onMessage = (msg: Message) => {
      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg],
      );
    };
    socket.on('new-message', onMessage);

    return () => {
      socket.emit('leave-booking', { bookingId });
      socket.off('new-message', onMessage);
      activeRef.current = null;
    };
  }, [bookingId]);

  const send = (text: string) => {
    if (!bookingId || !text.trim()) return;
    getChatSocket().emit('send-message', { bookingId, text: text.trim() });
  };

  return { messages, isLoading, send };
}
