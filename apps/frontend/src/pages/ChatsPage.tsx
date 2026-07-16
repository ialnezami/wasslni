import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Badge, Spinner } from '@/components/ui';
import { EmptyState } from '@/components/EmptyState';
import { ChatDrawer } from '@/components/ChatDrawer';
import { messagesApi } from '@/api/messages';
import type { Conversation } from '@/api/messages';
import { useUnreadStore } from '@/store/unread.store';
import { formatDate } from '@/utils/format';
import { cn } from '@/utils/format';

function cityName(city: { nameAr: string; nameFr: string; nameEn?: string } | null, lang: string): string {
  if (!city) return '—';
  if (lang === 'fr') return city.nameFr;
  if (lang === 'en') return city.nameEn ?? city.nameFr;
  return city.nameAr;
}

export function ChatsPage() {
  const { t, i18n } = useTranslation();
  const [openBookingId, setOpenBookingId] = useState<string | null>(null);
  const setFromConversations = useUnreadStore((s) => s.setFromConversations);
  const unreadCounts = useUnreadStore((s) => s.counts);

  const { data: conversations = [], isLoading, isError } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: () => messagesApi.getConversations().then((r) => r.data),
  });

  // Seed unread store from server data on every load
  useEffect(() => {
    if (conversations.length > 0) setFromConversations(conversations);
  }, [conversations, setFromConversations]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-8 text-center text-sm text-red-500">{t('common.errorLoading')}</p>
    );
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        title={t('chat.noConversations')}
        description={t('chat.noConversationsHint')}
        actionLabel={t('nav.search')}
        actionTo="/search"
      />
    );
  }

  const openConv = openBookingId
    ? conversations.find((c) => c.bookingId === openBookingId)
    : null;

  const otherPartyLabel = openConv
    ? (openConv.isPassenger ? t('chat.driver') : t('chat.passenger'))
    : '';

  return (
    <div className="space-y-3">
      {openBookingId && (
        <ChatDrawer
          bookingId={openBookingId}
          otherPartyName={otherPartyLabel}
          onClose={() => setOpenBookingId(null)}
        />
      )}

      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('chat.inbox')}</h1>

      {conversations.map((conv) => {
        const from = cityName(conv.ride.departureCity, i18n.language);
        const to = cityName(conv.ride.destinationCity, i18n.language);
        const roleLabel = conv.isPassenger ? t('chat.asPassenger') : t('chat.asDriver');
        const unread = unreadCounts[conv.bookingId] ?? 0;
        const lastMsg = conv.lastMessage
          ? new Date(conv.lastMessage.createdAt).toLocaleTimeString(i18n.language, {
              hour: '2-digit',
              minute: '2-digit',
            })
          : null;

        return (
          <button
            key={conv.bookingId}
            className={cn(
              'w-full rounded-2xl border bg-white px-4 py-3 text-start transition hover:shadow-sm dark:bg-slate-800',
              unread > 0
                ? 'border-emerald-200 dark:border-emerald-800'
                : 'border-slate-200 dark:border-slate-700',
            )}
            onClick={() => setOpenBookingId(conv.bookingId)}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn('truncate font-semibold', unread > 0 ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300')}>
                    {from} ← {to}
                  </span>
                  <Badge variant="default">{roleLabel}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(conv.ride.date, i18n.language)} · {conv.ride.departureTime}
                </p>
                <p className={cn('mt-1 truncate text-sm', unread > 0 ? 'font-medium text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400')}>
                  {conv.lastMessage?.text
                    ? conv.lastMessage.text.length > 60
                      ? `${conv.lastMessage.text.slice(0, 60)}…`
                      : conv.lastMessage.text
                    : t('chat.noMessages')}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                {lastMsg && (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">{lastMsg}</span>
                )}
                {unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
