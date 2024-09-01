import { BankInfo, Company, Invoice } from '@prisma/client';

export type CreateInvoice = Omit<
  Invoice,
  'id' | 'createdAt' | 'payerId' | 'receiverId' | 'bankInfoId' | 'userId'
>;
export type CreateCompany = Omit<Company, 'id' | 'createdAt'>;
export type CreateBankInfo = Omit<BankInfo, 'id' | 'createdAt'>;

export type ReqInfos = {
  uniqueName?: string;
  userName?: string;
  email: string;
};
export interface OpenAiResponse {
  invoice: CreateInvoice;
  bankInfo: CreateBankInfo;
  payerData: CreateCompany;
  receiverData: CreateCompany;
}
