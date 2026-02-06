import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ResponseHelper {
  static success<T>(res: Response, data: T, statusCode: number = 200): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
    
    return res.status(statusCode).json(response);
  }

  static paginated<T>(
    res: Response, 
    data: T[], 
    pagination: { page: number; limit: number; total: number; totalPages: number },
    statusCode: number = 200
  ): Response {
    const response: PaginatedResponse<T> = {
      success: true,
      data,
      pagination,
      timestamp: new Date().toISOString()
    };
    
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response, 
    message: string, 
    statusCode: number = 500, 
    code?: string, 
    details?: any
  ): Response {
    const response: ApiResponse = {
      success: false,
      error: {
        message,
        code,
        details
      },
      timestamp: new Date().toISOString()
    };
    
    return res.status(statusCode).json(response);
  }

  static validationError(res: Response, details: any): Response {
    return this.error(res, 'Validation failed', 400, 'VALIDATION_ERROR', details);
  }

  static notFound(res: Response, resource: string = 'Resource'): Response {
    return this.error(res, `${resource} not found`, 404, 'NOT_FOUND');
  }

  static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
    return this.error(res, message, 401, 'UNAUTHORIZED');
  }

  static forbidden(res: Response, message: string = 'Forbidden'): Response {
    return this.error(res, message, 403, 'FORBIDDEN');
  }

  static conflict(res: Response, message: string): Response {
    return this.error(res, message, 409, 'CONFLICT');
  }

  static serverError(res: Response, message: string = 'Internal server error'): Response {
    return this.error(res, message, 500, 'INTERNAL_ERROR');
  }
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  BLOCKCHAIN_ERROR: 'BLOCKCHAIN_ERROR',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
} as const;