import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OcrModule } from './ocr/ocr.module';

@Module({
  imports: [ConfigModule.forRoot(), OcrModule],
})
export class AppModule {}
