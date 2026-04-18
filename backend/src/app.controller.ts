import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getApiRoot(): { message: string; status: string } {
    return {
      message: 'Vein ATM backend is running',
      status: 'ok',
    };
  }
}
