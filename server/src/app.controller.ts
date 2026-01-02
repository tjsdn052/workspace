import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('rooms')
  getRooms() {
    return this.appService.getRooms();
  }

  @Post('execute')
  executeCode(@Body() body: { code: string }) {
    console.log('Execute endpoint called with:', body);
    return this.appService.executeCode(body.code);
  }
}
