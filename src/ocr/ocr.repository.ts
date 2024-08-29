import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User, Prisma, Invoice } from '@prisma/client';
import { CreateInvoice } from './ocr.interfaces';

@Injectable()
export class OcrRepository {
  constructor(private prisma: PrismaService) {}

  async saveInvoiceInfos(InvoiceInfos: CreateInvoice) {
    await this.prisma.invoice.create({ data: InvoiceInfos });
    return;
  }
}
