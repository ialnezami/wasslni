import { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { useChat } from '@/hooks/useChat';
import { useUnreadStore } from '@/store/unread.store';
import { messagesApi } from '@/api/messages';
import { Button } from '@wasslni/shared-ui';
import { Spinner } from '@/components/ui';

interface ChatDrawerProps {
  bookingId: string;
  otherPartyName: string;
  onClose: () => void;
}

export function ChatDrawer({ bookingId, otherPartyName, onClose }: ChatDrawerProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { messages, isLoading, error, send } = useChat(bookingId);
  const clearUnread = useUnreadStore((s) => s.clear);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Mark messages read when drawer opens and when new messages arrive
  useEffect(() => {
    messagesApi.markAllRead(bookingId).catch(() => {/* best-effort */});
    clearUnread(bookingId);
  }, [bookingId, messages.length, clearUnread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    send(trimmed);
    setText('');
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="flex h-[75vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">{otherPartyName}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            aria-label="close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          )}
          {!isLoading && messages.length === 0 && !error && (
            <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
              {t('chat.empty')}
            </p>
          )}
          {!isLoading && error && (
            <p className="py-8 text-center text-sm text-red-500">
              {t('chat.errorLoad')}
            </p>
          )}
          {messages.map((msg) => {
            const isOwn = msg.senderId === user?.userId;
            return (
              <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    isOwn
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                  }`}
                >
                  <p>{msg.text}</p>
                  <p className={`mt-1 text-[10px] ${isOwn ? 'text-emerald-200' : 'text-slate-400 dark:text-slate-500'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('ar', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-700">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('chat.placeholder')}
            className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <Button onClick={handleSend} disabled={!text.trim()}>
            {t('chat.send')}
          </Button>
        </div>
        </div>
      </div>
    </>
  );
}
