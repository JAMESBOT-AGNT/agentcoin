// Type definitions for API requests and responses
// These complement the Prisma generated types

export interface CreateAgentRequest {
  walletAddress: string;
  name: string;
}

export interface AgentResponse {
  id: string;
  walletAddress: string;
  name: string;
  createdAt: Date;
}

export interface AgentWithStats extends AgentResponse {
  services?: ServiceResponse[];
  stats: {
    jobsRequested: number;
    jobsProvided: number;
    activeServices: number;
  };
}

export interface BalanceResponse {
  agentId: string;
  walletAddress: string;
  balance: string;
  timestamp: string;
}

export interface CreateJobRequest {
  requesterId: string;
  title: string;
  description?: string;
  amount: number;
}

export interface JobResponse {
  id: string;
  title: string;
  description?: string;
  amount: string;
  status: string;
  requester: {
    id: string;
    name: string;
    walletAddress: string;
  };
  provider?: {
    id: string;
    name: string;
    walletAddress: string;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface TransferRequest {
  fromAgent: string;
  toAgent: string;
  amount: number;
  type?: 'PAYMENT' | 'REWARD' | 'STAKE' | 'REFUND';
}

export interface TransactionResponse {
  id: string;
  sender: {
    id: string;
    name: string;
    walletAddress: string;
  };
  receiver: {
    id: string;
    name: string;
    walletAddress: string;
  };
  amount: string;
  type: string;
  status: string;
  txHash?: string;
  direction?: 'sent' | 'received';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceRequest {
  agentId: string;
  name: string;
  description?: string;
  capability: string;
  price: number;
}

export interface ServiceResponse {
  id: string;
  name: string;
  description?: string;
  capability: string;
  price: string;
  isActive: boolean;
  agent: {
    id: string;
    name: string;
    walletAddress: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceSearchQuery {
  q?: string;
  capability?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TransactionStats {
  totalVolume: string;
  totalSent: string;
  totalReceived: string;
}

export interface BlockchainTransactionDetails {
  hash: string;
  blockNumber?: number;
  confirmations: number;
  gasUsed?: string;
  status?: number;
  timestamp?: number;
}

// Enums that mirror Prisma schema
export enum JobStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED'
}

export enum TransactionType {
  PAYMENT = 'PAYMENT',
  REWARD = 'REWARD',
  STAKE = 'STAKE',
  REFUND = 'REFUND'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED'
}