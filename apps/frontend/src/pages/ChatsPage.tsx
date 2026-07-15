import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, Badge, Spinner } from '@/components/ui';
import { Button } from '@wasslni/shared-ui';
import { EmptyState } from '@/components/EmptyState';
import { ChatDrawer } from '@/components/ChatDrawer';
import { messagesApi } from '@/api/messages';
import type { Conversation } from '@/api/messages';
import { formatDate } from '@/utils/format';

function cityName(city: { nameAr: string; nameFr: string; nameEn?: string } | null, lang: string): string {
  if (!city) return '—';
  if (lang === 'fr') return city.nameFr;
  if (lang === 'en') return city.nameEn ?? city.nameFr;
  return city.nameAr;
}

export function ChatsPage() {
  const { t, i18n } = useTranslation();
  const [openBookingId, setOpenBookingId] = useState<string | null>(null);
  const [openOtherParty, setOpenOtherParty] = useState('');

  const { data: conversations = [], isLoading, isError } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: () => messagesApi.getConversations().then((r) => r.data),
  });

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
    : openOtherParty;

  return (
    <div className="space-y-4">
      {openBookingId && (
        <ChatDrawer
          bookingId={openBookingId}
          otherPartyName={otherPartyLabel}
          onClose={() => setOpenBookingId(null)}
        />
      )}

      <h1 className="text-xl font-semibold">{t('chat.inbox')}</h1>

      {conversations.map((conv) => {
        const from = cityName(conv.ride.departureCity, i18n.language);
        const to = cityName(conv.ride.destinationCity, i18n.language);
        const roleLabel = conv.isPassenger ? t('chat.asPassenger') : t('chat.asDriver');
        const lastMsg = conv.lastMessage
          ? new Date(conv.lastMessage.createdAt).toLocaleTimeString(i18n.language, {
              hour: '2-digit',
              minute: '2-digit',
            })
          : null;

        return (
          <Card key={conv.bookingId}>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 truncate">
                    {from} → {to}
                  </span>
                  <Badge variant="default">{roleLabel}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDate(conv.ride.date, i18n.language)} · {conv.ride.departureTime}
                </p>
                <p className="mt-1 truncate text-sm text-slate-600">
                  {conv.lastMessage?.text
                    ? conv.lastMessage.text.length > 60
                      ? `${conv.lastMessage.text.slice(0, 60)}…`
                      : conv.lastMessage.text
                    : t('chat.noMessages')}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                {lastMsg && (
                  <span className="text-[11px] text-slate-400">{lastMsg}</span>
                )}
                <Button
                  variant="secondary"
                  onClick={() => {
                    setOpenOtherParty(conv.isPassenger ? t('chat.driver') : t('chat.passenger'));
                    setOpenBookingId(conv.bookingId);
                  }}
                >
                  {t('chat.open')}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
