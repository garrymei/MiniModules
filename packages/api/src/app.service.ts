import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!'
  }

  getHealth() {
    return {
      ok: true,
      ts: Date.now(),
    }
  }
}
