import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.ACCESS_PORT || 5500;
  await app.listen(port, () => {
    console.log(`Server is up and running on port ${port}`);
  });
}
bootstrap();
