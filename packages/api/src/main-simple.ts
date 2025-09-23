import { NestFactory } from '@nestjs/core';
import { AppSimpleModule } from './app-simple.module';

async function bootstrap() {
  const app = await NestFactory.create(AppSimpleModule);
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}
bootstrap();
