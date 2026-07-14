import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '@wasslni/shared-types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RecurringTripsService } from './recurring-trips.service';
import { CreateRecurringTripDto, UpdateRecurringTripDto } from './dto/recurring-trips.dto';

@ApiTags('recurring-trips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recurring-trips')
export class RecurringTripsController {
  constructor(private readonly recurringTripsService: RecurringTripsService) {}

  @Get('me')
  findMine(@CurrentUser() user: AuthUser) { return this.recurringTripsService.findMine(user.userId); }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRecurringTripDto) { return this.recurringTripsService.create(user.userId, dto); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.recurringTripsService.findOne(id); }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateRecurringTripDto) { return this.recurringTripsService.update(id, user.userId, dto); }
}
