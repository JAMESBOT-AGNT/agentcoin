// AgentCoin API Types
export interface AgentBalance {
  address: string;
  balance: number;
  symbol: string;
  decimals: number;
  last_updated: string;
}

export interface TransferRequest {
  to_address: string;
  amount: number;
  memo?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface TransferResponse {
  transaction_id: string;
  from_address: string;
  to_address: string;
  amount: number;
  fee: number;
  status: 'pending' | 'confirmed' | 'failed';
  block_hash?: string;
  timestamp: string;
  memo?: string;
}

export interface PaymentRequest {
  from_address: string;
  amount: number;
  memo?: string;
  expires_at?: string;
}

export interface PaymentRequestResponse {
  request_id: string;
  from_address: string;
  to_address: string;
  amount: number;
  memo?: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  created_at: string;
  expires_at?: string;
  payment_url: string;
}

export interface Job {
  job_id: string;
  title: string;
  description: string;
  assignee_address?: string;
  creator_address: string;
  amount: number;
  status: 'open' | 'assigned' | 'completed' | 'paid' | 'cancelled';
  tags?: string[];
  deadline?: string;
  created_at: string;
  updated_at: string;
  completion_proof?: string;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  amount: number;
  assignee_address?: string;
  tags?: string[];
  deadline?: string;
}

export interface Service {
  service_id: string;
  name: string;
  description: string;
  provider_address: string;
  price_per_hour?: number;
  price_per_task?: number;
  category: string;
  tags: string[];
  availability: 'available' | 'busy' | 'offline';
  rating: number;
  completed_jobs: number;
  created_at: string;
}

export interface RegisterServiceRequest {
  name: string;
  description: string;
  price_per_hour?: number;
  price_per_task?: number;
  category: string;
  tags?: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AgentCoinConfig {
  api_base_url: string;
  api_key?: string | undefined;
  agent_address?: string | undefined;
  network: 'mainnet' | 'testnet';
  timeout: number;
}

export interface TransactionLog {
  timestamp: string;
  type: 'transfer' | 'request' | 'job_payment' | 'service_payment';
  amount: number;
  counterparty: string;
  transaction_id?: string | undefined;
  job_id?: string | undefined;
  service_id?: string | undefined;
  memo?: string | undefined;
  status: string;
}

// Tool parameter types
export interface BalanceParams {
  address?: string;
}

export interface TransferParams extends TransferRequest {}

export interface RequestParams extends PaymentRequest {}

export interface JobCreateParams extends CreateJobRequest {}

export interface JobCompleteParams {
  job_id: string;
  completion_proof?: string;
}

export interface JobListParams {
  status?: Job['status'];
  assignee_address?: string;
  creator_address?: string;
  limit?: number;
}

export interface ServiceListParams {
  category?: string;
  tags?: string[];
  availability?: Service['availability'];
  limit?: number;
}

export interface ServiceRegisterParams extends RegisterServiceRequest {}