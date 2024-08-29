import {
  Controller,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OcrService } from './ocr.service';

@Controller('ocr')
export class OcrController {
  constructor(private ocrService: OcrService) {}

  @Post()
  @UseInterceptors(FileInterceptor('invoiceImage'))
  @HttpCode(201)
  postInvoceImage(@UploadedFile() invoiceImage: Express.Multer.File) {
    const response = this.ocrService.handleInvoce(
      invoiceImage.originalname,
      invoiceImage.buffer,
    );
    return response;
  }
}
