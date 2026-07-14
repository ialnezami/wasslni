import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '@wasslni/shared-types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RecurringSubscriptionsService } from './recurring-subscriptions.service';
import { CreateSubscriptionDto, SkipDateDto } from './dto/recurring-subscriptions.dto';

@ApiTags('recurring-subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class RecurringSubscriptionsController {
  constructor(private readonly subscriptionsService: RecurringSubscriptionsService) {}

  @Get('recurring-subscriptions/me')
  findMine(@CurrentUser() user: AuthUser) { return this.subscriptionsService.findMine(user.userId); }

  @Get('recurring-trips/:id/subscriptions')
  findByTrip(@Param('id') id: string) { return this.subscriptionsService.findByTrip(id); }

  @Post('recurring-trips/:id/subscribe')
  subscribe(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: CreateSubscriptionDto) { return this.subscriptionsService.subscribe(id, user.userId, dto); }

  @Post('recurring-subscriptions/:id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.subscriptionsService.approve(id, user.userId); }

  @Post('recurring-subscriptions/:id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.subscriptionsService.reject(id, user.userId); }

  @Post('recurring-subscriptions/:id/skip')
  skipDate(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: SkipDateDto) { return this.subscriptionsService.skipDate(id, user.userId, dto); }

  @Delete('recurring-subscriptions/:id')
  unsubscribe(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.subscriptionsService.unsubscribe(id, user.userId); }
}
