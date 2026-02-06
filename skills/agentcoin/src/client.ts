import axios, { AxiosInstance, AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import {
  AgentCoinConfig,
  AgentBalance,
  TransferRequest,
  TransferResponse,
  PaymentRequest,
  PaymentRequestResponse,
  CreateJobRequest,
  Job,
  Service,
  RegisterServiceRequest,
  ApiResponse,
  TransactionLog,
  JobListParams,
  ServiceListParams,
} from './types.js';

export class AgentCoinClient {
  private client: AxiosInstance;
  private config: AgentCoinConfig;
  private logFile: string;

  constructor(config?: Partial<AgentCoinConfig>) {
    this.config = {
      api_base_url: process.env.AGENTCOIN_API_URL || 'http://localhost:3000/api',
      api_key: process.env.AGENTCOIN_API_KEY,
      agent_address: process.env.AGENTCOIN_AGENT_ADDRESS,
      network: (process.env.AGENTCOIN_NETWORK as 'mainnet' | 'testnet') || 'testnet',
      timeout: 30000,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.api_base_url,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OpenClaw-AgentCoin-Skill/1.0.0',
        ...(this.config.api_key && { 'Authorization': `Bearer ${this.config.api_key}` }),
      },
    });

    // Setup request/response interceptors
    this.client.interceptors.request.use((config) => {
      if (this.config.agent_address && !config.headers['X-Agent-Address']) {
        config.headers['X-Agent-Address'] = this.config.agent_address;
      }
      config.headers['X-Request-ID'] = uuidv4();
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('AgentCoin API Error:', {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );

    // Setup transaction logging
    this.logFile = join(homedir(), '.openclaw', 'logs', 'agentcoin-transactions.json');
    this.ensureLogFile();
  }

  private ensureLogFile(): void {
    const logsDir = join(homedir(), '.openclaw', 'logs');
    if (!existsSync(logsDir)) {
      require('fs').mkdirSync(logsDir, { recursive: true });
    }
    if (!existsSync(this.logFile)) {
      writeFileSync(this.logFile, JSON.stringify([], null, 2));
    }
  }

  private logTransaction(log: Omit<TransactionLog, 'timestamp'>): void {
    try {
      const logs: TransactionLog[] = existsSync(this.logFile)
        ? JSON.parse(readFileSync(this.logFile, 'utf-8'))
        : [];
      
      logs.push({
        timestamp: new Date().toISOString(),
        ...log,
      });

      // Keep only last 1000 transactions
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }

      writeFileSync(this.logFile, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.warn('Failed to log transaction:', error);
    }
  }

  async getBalance(address?: string): Promise<AgentBalance> {
    const targetAddress = address || this.config.agent_address;
    if (!targetAddress) {
      throw new Error('No agent address configured. Set AGENTCOIN_AGENT_ADDRESS or pass address parameter.');
    }

    const response = await this.client.get<ApiResponse<AgentBalance>>(`/balance/${targetAddress}`);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to get balance');
    }

    return response.data.data!;
  }

  async transfer(params: TransferRequest): Promise<TransferResponse> {
    const response = await this.client.post<ApiResponse<TransferResponse>>('/transfer', params);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Transfer failed');
    }

    const transfer = response.data.data!;
    
    this.logTransaction({
      type: 'transfer',
      amount: -params.amount,
      counterparty: params.to_address,
      transaction_id: transfer.transaction_id,
      memo: params.memo,
      status: transfer.status,
    });

    return transfer;
  }

  async requestPayment(params: PaymentRequest): Promise<PaymentRequestResponse> {
    const response = await this.client.post<ApiResponse<PaymentRequestResponse>>('/payment-request', params);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Payment request failed');
    }

    const request = response.data.data!;
    
    this.logTransaction({
      type: 'request',
      amount: params.amount,
      counterparty: params.from_address,
      memo: params.memo,
      status: request.status,
    });

    return request;
  }

  async createJob(params: CreateJobRequest): Promise<Job> {
    const response = await this.client.post<ApiResponse<Job>>('/jobs', params);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Job creation failed');
    }

    return response.data.data!;
  }

  async completeJob(jobId: string, completionProof?: string): Promise<Job> {
    const response = await this.client.patch<ApiResponse<Job>>(`/jobs/${jobId}/complete`, {
      completion_proof: completionProof,
    });
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Job completion failed');
    }

    const job = response.data.data!;
    
    if (job.status === 'completed' || job.status === 'paid') {
      this.logTransaction({
        type: 'job_payment',
        amount: job.assignee_address === this.config.agent_address ? job.amount : -job.amount,
        counterparty: job.assignee_address === this.config.agent_address ? job.creator_address : job.assignee_address!,
        job_id: job.job_id,
        status: job.status,
      });
    }

    return job;
  }

  async listJobs(params?: JobListParams): Promise<Job[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.assignee_address) searchParams.set('assignee_address', params.assignee_address);
    if (params?.creator_address) searchParams.set('creator_address', params.creator_address);
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const response = await this.client.get<ApiResponse<Job[]>>(`/jobs?${searchParams.toString()}`);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to list jobs');
    }

    return response.data.data!;
  }

  async listServices(params?: ServiceListParams): Promise<Service[]> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.tags) searchParams.set('tags', params.tags.join(','));
    if (params?.availability) searchParams.set('availability', params.availability);
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const response = await this.client.get<ApiResponse<Service[]>>(`/services?${searchParams.toString()}`);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to list services');
    }

    return response.data.data!;
  }

  async registerService(params: RegisterServiceRequest): Promise<Service> {
    const response = await this.client.post<ApiResponse<Service>>('/services', params);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Service registration failed');
    }

    return response.data.data!;
  }

  async getTransactionLogs(limit: number = 50): Promise<TransactionLog[]> {
    try {
      const logs: TransactionLog[] = existsSync(this.logFile)
        ? JSON.parse(readFileSync(this.logFile, 'utf-8'))
        : [];
      
      return logs.slice(-limit);
    } catch (error) {
      console.warn('Failed to read transaction logs:', error);
      return [];
    }
  }

  getConfig(): AgentCoinConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<AgentCoinConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Update axios instance if needed
    if (updates.api_base_url) {
      this.client.defaults.baseURL = updates.api_base_url;
    }
    if (updates.timeout) {
      this.client.defaults.timeout = updates.timeout;
    }
    if (updates.api_key) {
      this.client.defaults.headers['Authorization'] = `Bearer ${updates.api_key}`;
    }
    if (updates.agent_address) {
      this.client.defaults.headers['X-Agent-Address'] = updates.agent_address;
    }
  }
}