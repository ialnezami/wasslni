import { create } from 'zustand';

interface UnreadState {
  counts: Record<string, number>; // bookingId → unread count
  total: number;
  setFromConversations: (convs: Array<{ bookingId: string; unreadCount: number }>) => void;
  increment: (bookingId: string) => void;
  clear: (bookingId: string) => void;
}

export const useUnreadStore = create<UnreadState>((set, get) => ({
  counts: {},
  total: 0,

  setFromConversations(convs) {
    const counts: Record<string, number> = {};
    let total = 0;
    for (const c of convs) {
      if (c.unreadCount > 0) {
        counts[c.bookingId] = c.unreadCount;
        total += c.unreadCount;
      }
    }
    set({ counts, total });
  },

  increment(bookingId) {
    const prev = get().counts[bookingId] ?? 0;
    set((s) => ({
      counts: { ...s.counts, [bookingId]: prev + 1 },
      total: s.total + 1,
    }));
  },

  clear(bookingId) {
    const prev = get().counts[bookingId] ?? 0;
    if (prev === 0) return;
    set((s) => {
      const counts = { ...s.counts };
      delete counts[bookingId];
      return { counts, total: Math.max(0, s.total - prev) };
    });
  },
}));
