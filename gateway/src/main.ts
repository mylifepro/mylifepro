// gateway/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('gateway');
  // Configuration CORS
  app.enableCors({
    origin: ['http://localhost:3002', 'http://localhost:3003'], // URL de votre frontend Next.js
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  await app.listen(5000);
  console.log('Gateway is running on port 5000');
}
bootstrap();
