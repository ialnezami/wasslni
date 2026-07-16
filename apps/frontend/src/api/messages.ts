import apiClient from './client';
import type { Message } from '@wasslni/shared-types';

export interface CityRef {
  nameAr: string;
  nameFr: string;
  nameEn?: string;
}

export interface Conversation {
  bookingId: string;
  status: string;
  seats: number;
  isPassenger: boolean;
  ride: {
    _id: string;
    date: string;
    departureTime: string;
    departureCity: CityRef | null;
    destinationCity: CityRef | null;
  };
  lastMessage: { text: string; senderId: string; createdAt: string } | null;
  unreadCount: number;
  createdAt: string;
}

export const messagesApi = {
  getHistory: (bookingId: string) =>
    apiClient.get<Message[]>(`/messages/${bookingId}`),
  getConversations: () =>
    apiClient.get<Conversation[]>('/messages/conversations'),
  markAllRead: (bookingId: string) =>
    apiClient.post(`/messages/${bookingId}/read`),
};
