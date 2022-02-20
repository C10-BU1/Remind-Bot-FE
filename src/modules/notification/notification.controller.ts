import { Body, Controller, DefaultValuePipe, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse, ApiTags } from '@nestjs/swagger';
import { NotificationDto } from './dto/notification.dto';
import { UpdateNotification } from './dto/update-notification.dto';
import { UpdateNotificationStatusDto } from './dto/update-status.dto';
import { NotificationService } from './notification.service';

@ApiTags('notification')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ schema: { example: { statusCode: 401, message: 'Access token is invalid', error: 'Unauthorized' } } })
@ApiForbiddenResponse({ schema: { example: { statusCode: 403, message: 'Access token expired', error: 'Forbidden' } } })
@ApiNotFoundResponse({ schema: { example: { statusCode: 404, message: 'Token not found', error: 'Not found' } } })
@ApiInternalServerErrorResponse({ schema: { example: { statusCode: 500, message: 'Database connection error', error: 'Internal server error' } } })
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Post('/normal')
  async createNormalNotification(@Body() notification: NotificationDto, @Request() req): Promise<any> {
    return await this.notificationService.createNormalNotification(notification, req.headers.email);
  }

  @Post('/reminder')
  async createReminderNotification(@Body() notification: NotificationDto, @Request() req): Promise<any>{
    return await this.notificationService.createReminderNotification(notification, req.headers.email);
  }

  @Get('/space/:spaceId')
  async getListNotification(@Param('spaceId') spaceId: number, @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10): Promise<any> {
    return await this.notificationService.getListNotification(limit, page, spaceId);
  }

  @Get('/space/:spaceId/search')
  async searchNotificationByName(@Param('spaceId') spaceId: number, @Query('name') name: string, @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10): Promise<any> {
    return await this.notificationService.searchNotificationByName(limit, page, spaceId, name);
  }

  @Put('/status')
  async updateStatus(@Body() data: UpdateNotificationStatusDto) {
    return this.notificationService.updateNotificationStatus(data.id, data.isEnable);
  }

  @Delete(':notificationId')
  async deleteNormalNotification(@Param('notificationId') notificationId: number): Promise<any> {
    return await this.notificationService.deleteNotification(notificationId);
  }

  @Get(':notificationId')
  async getNotification(@Param('notificationId') notificationId: number): Promise<NotificationDto> {
    return this.notificationService.getNotificationInfo(notificationId);
  }

  @Put('')
  async updateNotification(@Body() data: UpdateNotification){
    return await this.notificationService.updateNotification(data);
  }

}
