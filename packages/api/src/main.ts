import { config as loadEnv } from 'dotenv'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

loadEnv()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const port = Number(process.env.PORT) || 3000
  await app.listen(port)
}
bootstrap()
