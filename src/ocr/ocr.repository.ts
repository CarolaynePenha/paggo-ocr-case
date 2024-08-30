import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBankInfo, CreateCompany, CreateInvoice } from './ocr.interfaces';

@Injectable()
export class OcrRepository {
  constructor(private prisma: PrismaService) {}

  async saveInvoiceInfos(
    invoiceInfos: CreateInvoice,
    payerData: CreateCompany,
    receiverData: CreateCompany,
    bankInfo: CreateBankInfo,
  ) {
    await this.prisma.invoice.create({
      data: {
        ...invoiceInfos,
        payer: {
          connectOrCreate: {
            where: { cpfCnpj: payerData.cpfCnpj },
            create: payerData,
          },
        },
        receiver: {
          connectOrCreate: {
            where: { cpfCnpj: receiverData.cpfCnpj },
            create: receiverData,
          },
        },
        bankInfo: {
          create: bankInfo,
        },
      },
    });
    return;
  }
}
