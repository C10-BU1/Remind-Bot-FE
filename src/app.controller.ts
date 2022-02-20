import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('bot')

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('bot')
  @ApiOperation({ summary: 'This API will handle the event from spaces' })
  handleEvents(@Request() req){
    console.log(req.body)
    return this.appService.handleEvents(req.body);
  }
}
