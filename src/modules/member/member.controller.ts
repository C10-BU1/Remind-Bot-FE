import { Controller, Get, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse, ApiTags } from '@nestjs/swagger';
import { MemberService } from './member.service';

@Controller('member')
@ApiTags('member')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ schema: { example: { statusCode: 401, message: 'Access token is invalid', error: 'Unauthorized' } } })
@ApiForbiddenResponse({ schema: { example: { statusCode: 403, message: 'Access token expired', error: 'Forbidden' } } })
@ApiNotFoundResponse({ schema: { example: { statusCode: 404, message: 'Token not found', error: 'Not found' } } })
@ApiInternalServerErrorResponse({ schema: { example: { statusCode: 500, message: 'Database connection error', error: 'Internal server error' } } })
export class MemberController {
  constructor(private readonly memberService: MemberService) { }


  @Get()
  @ApiOkResponse({ schema: { example: { id: 'number', email: 'string', name: 'string' } } })
  async getInfo(@Request() req) {
    return await this.memberService.getMemberInfo(req.headers.id);
  }
}
