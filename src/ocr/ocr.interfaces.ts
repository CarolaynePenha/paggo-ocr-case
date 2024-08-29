import { Invoice } from '@prisma/client';

export type CreateInvoice = Omit<Invoice, 'id' | 'createdAt'>;
