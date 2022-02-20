import { Controller, Get, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

}
