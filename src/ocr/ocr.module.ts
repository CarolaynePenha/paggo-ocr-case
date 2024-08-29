import { Module } from '@nestjs/common';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { OcrRepository } from './ocr.repository';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [OcrController],
  providers: [OcrService, OcrRepository, PrismaService],
})
export class OcrModule {}
