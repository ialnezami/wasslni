// apps/frontend/src/components/ChatDrawer.tsx
import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { useChat } from '@/hooks/useChat';
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
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

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
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      <div className="fixed inset-y-0 end-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-semibold text-slate-900">{otherPartyName}</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          )}
          {!isLoading && messages.length === 0 && !error && (
            <p className="py-8 text-center text-sm text-slate-400">
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
              <div
                key={msg._id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    isOwn
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  <p>{msg.text}</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      isOwn ? 'text-emerald-200' : 'text-slate-400'
                    }`}
                  >
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

        <div className="flex gap-2 border-t px-4 py-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('chat.placeholder')}
            className="flex-1 rounded-full border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Button onClick={handleSend} disabled={!text.trim()}>
            {t('chat.send')}
          </Button>
        </div>
      </div>
    </>
  );
}
