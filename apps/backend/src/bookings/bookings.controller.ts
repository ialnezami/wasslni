import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '@wasslni/shared-types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/bookings.dto';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('me')
  findMine(@CurrentUser() user: AuthUser) {
    return this.bookingsService.findMine(user.userId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto) { return this.bookingsService.create(user.userId, dto); }

  @Get('ride/:rideId')
  findForRide(@Param('rideId') rideId: string, @CurrentUser() user: AuthUser) { return this.bookingsService.findForRide(rideId, user.userId); }

  @Post(':id/accept')
  accept(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.bookingsService.accept(id, user.userId); }
  @Post(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.bookingsService.reject(id, user.userId); }
  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.bookingsService.cancel(id, user.userId); }
}
