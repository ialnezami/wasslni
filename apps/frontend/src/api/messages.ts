import apiClient from './client';
import type { Message } from '@wasslni/shared-types';

export const messagesApi = {
  getHistory: (bookingId: string) =>
    apiClient.get<Message[]>(`/messages/${bookingId}`),
};
