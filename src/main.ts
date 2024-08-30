import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  const port = process.env.ACCESS_PORT || 5500;
  await app.listen(port, () => {
    console.log(`Server is up and running on port ${port}`);
  });
}
bootstrap();
