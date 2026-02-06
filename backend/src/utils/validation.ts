import { z } from 'zod';

// Common validation schemas that can be reused

export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format');

export const cuidSchema = z
  .string()
  .cuid('Invalid ID format');

export const positiveNumberSchema = z
  .number()
  .positive('Amount must be positive');

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, 'Start date must be before end date');

// Helper functions

export function validatePagination(query: any) {
  const page = parseInt(query.page as string) || 1;
  const limit = Math.min(parseInt(query.limit as string) || 20, 100);
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
}

export function sanitizeAddress(address: string): string {
  return address.toLowerCase();
}

export function formatAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toFixed(8); // 8 decimal places for crypto precision
}

export function isValidCUID(id: string): boolean {
  return cuidSchema.safeParse(id).success;
}

export function isValidEthereumAddress(address: string): boolean {
  return ethereumAddressSchema.safeParse(address).success;
}