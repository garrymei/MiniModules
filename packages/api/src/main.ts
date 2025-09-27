import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('MiniModules API')
    .setDescription('MiniModules 微服务架构 API 文档')
    .setVersion('1.0')
    .addTag('health', '健康检查')
    .addTag('tenant', '租户管理')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 API server running on localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/healthz`);
  console.log(`📚 API docs: http://localhost:${port}/docs`);
}

bootstrap();
