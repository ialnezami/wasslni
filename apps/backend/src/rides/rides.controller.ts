import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RidesService } from './rides.service';
import { CancelRideDto, CreateRideDto, SearchRidesDto, UpdateRideDto } from './dto/rides.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '@wasslni/shared-types';

@ApiTags('rides')
@Controller('rides')
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Get()
  search(@Query() query: SearchRidesDto) {
    return this.ridesService.search(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMine(@CurrentUser() user: AuthUser) { return this.ridesService.findMine(user.userId); }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRideDto) { return this.ridesService.create(user.userId, dto); }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ridesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateRideDto) { return this.ridesService.update(id, user.userId, user.role, dto); }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: CancelRideDto) { return this.ridesService.cancel(id, user.userId, user.role, dto); }
}
