import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { SpaceInfoDto } from './dto/space-info.dto';
import { SpaceService } from './space.service';

@ApiTags('space')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ schema: { example: { statusCode: 401, message: 'Access token is invalid', error: 'Unauthorized' } } })
@ApiForbiddenResponse({ schema: { example: { statusCode: 403, message: 'Access token expired', error: 'Forbidden' } } })
@ApiNotFoundResponse({ schema: { example: { statusCode: 404, message: 'Token not found', error: 'Not found' } } })
@ApiInternalServerErrorResponse({ schema: { example: { statusCode: 500, message: 'Database connection error', error: 'Internal server error' } } })
@Controller('space')
export class SpaceController {
  constructor(private readonly spaceService: SpaceService) { }

  @Get()
  async getListSpace(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10, @Request() req) {
    limit = limit > 20 ? 20 : limit;
    return await this.spaceService.getListSpace(limit, page, req.headers.id);
  }

  @Get('/search')
  async searchByName(@Query('name') name: string, @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10) {
    return await this.spaceService.searchByDisplayName(limit, page, name);
  }

  @Get(':spaceId')
  async getSpaceInfo(@Param('spaceId') spaceId: number, @Request() req): Promise<SpaceInfoDto> {
    return await this.spaceService.getSpaceInfo(spaceId, req.headers.id);
  }
}
