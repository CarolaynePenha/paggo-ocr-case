import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CreateBankInfo,
  CreateCompany,
  CreateInvoice,
  ReqInfos,
} from './ocr.interfaces';

@Injectable()
export class OcrRepository {
  constructor(private prisma: PrismaService) {}

  async saveInvoiceInfos(
    invoiceInfos: CreateInvoice,
    payerData: CreateCompany,
    receiverData: CreateCompany,
    bankInfo: CreateBankInfo,
    userInfo: ReqInfos,
  ) {
    const shouldCreateBankInfo =
      bankInfo.bankName ||
      bankInfo.account ||
      bankInfo.agency ||
      bankInfo.pixKey;

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
        ...(shouldCreateBankInfo && {
          bankInfo: {
            create: bankInfo,
          },
        }),
        user: {
          connectOrCreate: {
            where: { email: userInfo.email },
            create: { name: userInfo.userName, email: userInfo.email },
          },
        },
      },
    });
    return;
  }
}
