import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@wasslni/shared-types';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminService } from './admin.service';
import { BanUserDto } from './dto/ban-user.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Patch('users/:id/ban')
  banUser(@Param('id') id: string, @Body() dto: BanUserDto) {
    return this.adminService.toggleBan(id, dto.ban);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteUser(@Param('id') id: string) {
    return this.adminService.softDeleteUser(id);
  }

  @Get('reports')
  getReports() {
    return this.adminService.getReports();
  }

  @Get('reviews')
  getReviews() {
    return this.adminService.getReviews();
  }

  @Delete('reports/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteReport(@Param('id') id: string) {
    return this.adminService.deleteReport(id);
  }
}
