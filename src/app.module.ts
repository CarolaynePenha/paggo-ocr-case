import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OcrModule } from './ocr/ocr.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [ConfigModule.forRoot(), OcrModule, PrismaModule],
})
export class AppModule {}
