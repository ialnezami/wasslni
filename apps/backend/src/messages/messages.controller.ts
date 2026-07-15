import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '@wasslni/shared-types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseMongoIdPipe } from '../common/pipes/parse-mongo-id.pipe';
import { MessagesService } from './messages.service';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  getConversations(@CurrentUser() user: AuthUser) {
    return this.messagesService.getConversations(user.userId);
  }

  @Get(':bookingId')
  getHistory(
    @Param('bookingId', ParseMongoIdPipe) bookingId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messagesService.getHistory(bookingId, user.userId);
  }
}
