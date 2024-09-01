import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { ReqInfos } from './ocr.interfaces';

@Controller('ocr')
export class OcrController {
  constructor(private ocrService: OcrService) {}

  @Post()
  @HttpCode(201)
  postInvoceImage(
    @Body()
    { uniqueName, userName, email }: ReqInfos,
  ) {
    const response = this.ocrService.handleInvoce({
      uniqueName,
      userName,
      email,
    });
    return response;
  }
}
