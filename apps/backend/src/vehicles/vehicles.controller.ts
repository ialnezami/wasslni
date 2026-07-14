import {
  BadRequestException, Body, Controller, Delete, Get,
  Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '@wasslni/shared-types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicles.dto';
import { multerConfig, toPublicUrl } from '../common/upload/upload.config';

@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get('me')
  findMine(@CurrentUser() user: AuthUser) {
    return this.vehiclesService.findMine(user.userId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(user.userId, dto);
  }

  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('photo', multerConfig('vehicles')))
  async uploadPhoto(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const photoUrl = toPublicUrl('vehicles', file.filename);
    return this.vehiclesService.update(id, user.userId, { photoUrl });
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, user.userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.vehiclesService.remove(id, user.userId);
  }
}
