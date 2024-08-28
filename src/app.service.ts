import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    console.log(process.env.AWS_ACCESS_KEY_ID);
    return 'hELLO';
  }
}
