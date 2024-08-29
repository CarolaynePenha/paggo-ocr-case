import { Company, Invoice } from '@prisma/client';

export type CreateInvoice = Omit<
  Invoice,
  'id' | 'createdAt' | 'payerId' | 'receiverId'
>;
export type CreateCompany = Omit<Company, 'id' | 'createdAt'>;
