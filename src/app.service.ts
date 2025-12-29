import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  wai(): any {
    return { conn: "cloud" };
  }
}
