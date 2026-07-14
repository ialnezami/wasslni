import apiClient from './client';
import type { RecurringSubscription } from '@wasslni/shared-types';

export const recurringSubscriptionsApi = {
  getMine: () => apiClient.get<RecurringSubscription[]>('/recurring-subscriptions/me'),
  approve: (id: string) => apiClient.post<RecurringSubscription>(`/recurring-subscriptions/${id}/approve`),
  reject: (id: string) => apiClient.post<RecurringSubscription>(`/recurring-subscriptions/${id}/reject`),
  skip: (id: string, date: string) =>
    apiClient.post<RecurringSubscription>(`/recurring-subscriptions/${id}/skip`, { date }),
  unsubscribe: (id: string) => apiClient.delete(`/recurring-subscriptions/${id}`),
};
