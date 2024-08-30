import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { OcrService } from './ocr.service';

@Controller('ocr')
export class OcrController {
  constructor(private ocrService: OcrService) {}

  @Post()
  @HttpCode(201)
  postInvoceImage(@Body() { uniqueName }: { uniqueName: string }) {
    console.log('uniqueName: ', uniqueName);
    const response = this.ocrService.handleInvoce(uniqueName);
    return response;
  }
}
