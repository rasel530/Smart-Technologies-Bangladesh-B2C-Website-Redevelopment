import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create({
    logger: ['log', 'error', 'warn', 'debug'],
  });

  // Basic validation pipe
  app.useGlobalPipes(new ValidationPipe());

  const port = process.env.PORT || 3001;
  
  await app.listen(port, () => {
    console.log(`🚀 Application is running on port ${port}`);
    console.log(`📍 Health check: http://localhost:${port}/health`);
    console.log(`📍 API docs: http://localhost:${port}/api`);
  });
}

bootstrap().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});