import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiInternalServerErrorResponse, ApiOkResponse, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthLoginDto } from './dto/auth-login.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @ApiOkResponse({ schema: { example: { accessToken: 'string', refreshToken: 'string' } } })
  @ApiUnauthorizedResponse({ schema: { example: { statusCode: 404, message: 'Email or password is incorrect', error: 'Unauthorized' } } })
  @ApiInternalServerErrorResponse({ schema: { example: { statusCode: 500, message: 'Database connection error', error: 'Internal server error' } } })
  async login(@Body() authLogin: AuthLoginDto): Promise<any> {
    return await this.authService.login(authLogin);
  }
}
