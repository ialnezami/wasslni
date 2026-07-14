import {
  Body, Controller, Get, Param, Patch, Post,
  UseGuards, UseInterceptors, UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '@wasslni/shared-types';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/users.dto';
import { multerConfig, toPublicUrl } from '../common/upload/upload.config';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser() user: AuthUser) {
    return this.usersService.getProfile(user.userId);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.userId, dto);
  }

  @Post('me/photo')
  @UseInterceptors(FileInterceptor('photo', multerConfig('profiles')))
  async uploadPhoto(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const photoUrl = toPublicUrl('profiles', file.filename);
    await this.usersService.updateProfile(user.userId, { photoUrl });
    return { photoUrl };
  }

  @Post('me/license')
  @UseInterceptors(FileInterceptor('photo', multerConfig('licenses')))
  async uploadLicense(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const licensePhotoUrl = toPublicUrl('licenses', file.filename);
    await this.usersService.updateProfile(user.userId, { licensePhotoUrl });
    return { licensePhotoUrl };
  }

  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
