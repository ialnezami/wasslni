import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@wasslni/shared-types';
import { NotificationsRepository } from './repositories/notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  findMine(userId: string) {
    return this.notificationsRepository.findByUser(userId);
  }

  create(userId: string, type: NotificationType, title: string, message: string, metadata?: Record<string, unknown>) {
    return this.notificationsRepository.create({ userId: userId as never, type, title, message, metadata } as Partial<import('./schemas/notification.schema').Notification>);
  }

  async markRead(id: string, userId: string) {
    const notification = await this.notificationsRepository.markRead(id, userId);
    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }
}
