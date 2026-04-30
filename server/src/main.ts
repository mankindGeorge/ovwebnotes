import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const port = process.env.PORT || 3000;

  const app = await NestFactory.create(AppModule);

  // 全局前缀 (可选)
  // app.setGlobalPrefix('api');

  // CORS 配置 - 允许前端访问
  app.enableCors({
    origin: [
      'http://localhost:5173',  // Vite 默认端口
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局响应转换拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger 文档配置
  const config = new DocumentBuilder()
    .setTitle('Ovwebnotes API')
    .setDescription('Obsidian 混合存储笔记系统后端 API 文档')
    .setVersion('1.0')
    .addTag('App', '应用信息与健康检查')
    .addTag('Notes', '笔记 CRUD 操作')
    .addTag('Files', '文件上传/下载')
    .addTag('AI', 'AI 智能摘要')
    .addTag('Ingest', 'Web 剪藏')
    .addTag('Webhooks', 'Webhook 通知')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
