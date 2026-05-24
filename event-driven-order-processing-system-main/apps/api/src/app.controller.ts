import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('healthz')
  healthz(): { status: 'ok'; service: 'minishop-api'; timestamp: string } {
    return {
      status: 'ok',
      service: 'minishop-api',
      timestamp: new Date().toISOString(),
    };
  }
}
