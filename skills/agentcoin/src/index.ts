import { AgentCoinClient } from './client.js';
import {
  BalanceParams,
  TransferParams,
  RequestParams,
  JobCreateParams,
  JobCompleteParams,
  JobListParams,
  ServiceListParams,
  ServiceRegisterParams,
} from './types.js';

export class AgentCoinTool {
  private client: AgentCoinClient;

  constructor() {
    this.client = new AgentCoinClient();
  }

  /**
   * Get balance for agent's address or specified address
   */
  async balance(params: BalanceParams = {}) {
    try {
      const balance = await this.client.getBalance(params.address);
      
      return {
        success: true,
        data: {
          address: balance.address,
          balance: balance.balance,
          symbol: balance.symbol,
          formatted: `${balance.balance} ${balance.symbol}`,
          last_updated: balance.last_updated,
        },
        message: `Balance: ${balance.balance} ${balance.symbol}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get balance',
      };
    }
  }

  /**
   * Transfer AGNT tokens to another agent
   */
  async transfer(params: TransferParams) {
    try {
      if (!params.to_address) {
        throw new Error('to_address is required');
      }
      if (!params.amount || params.amount <= 0) {
        throw new Error('amount must be greater than 0');
      }

      const transfer = await this.client.transfer(params);
      
      return {
        success: true,
        data: {
          transaction_id: transfer.transaction_id,
          from: transfer.from_address,
          to: transfer.to_address,
          amount: transfer.amount,
          fee: transfer.fee,
          status: transfer.status,
          memo: transfer.memo,
        },
        message: `Transfer of ${params.amount} AGNT to ${params.to_address} ${transfer.status}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Transfer failed',
      };
    }
  }

  /**
   * Request payment from another agent
   */
  async request(params: RequestParams) {
    try {
      if (!params.from_address) {
        throw new Error('from_address is required');
      }
      if (!params.amount || params.amount <= 0) {
        throw new Error('amount must be greater than 0');
      }

      const request = await this.client.requestPayment(params);
      
      return {
        success: true,
        data: {
          request_id: request.request_id,
          from: request.from_address,
          to: request.to_address,
          amount: request.amount,
          status: request.status,
          payment_url: request.payment_url,
          expires_at: request.expires_at,
          memo: request.memo,
        },
        message: `Payment request for ${params.amount} AGNT sent to ${params.from_address}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Payment request failed',
      };
    }
  }

  /**
   * Create a job for another agent
   */
  async jobCreate(params: JobCreateParams) {
    try {
      if (!params.title) {
        throw new Error('title is required');
      }
      if (!params.description) {
        throw new Error('description is required');
      }
      if (!params.amount || params.amount <= 0) {
        throw new Error('amount must be greater than 0');
      }

      const job = await this.client.createJob(params);
      
      return {
        success: true,
        data: {
          job_id: job.job_id,
          title: job.title,
          description: job.description,
          amount: job.amount,
          status: job.status,
          assignee: job.assignee_address,
          creator: job.creator_address,
          deadline: job.deadline,
          tags: job.tags,
        },
        message: `Job "${params.title}" created for ${params.amount} AGNT`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Job creation failed',
      };
    }
  }

  /**
   * Mark a job as complete
   */
  async jobComplete(params: JobCompleteParams) {
    try {
      if (!params.job_id) {
        throw new Error('job_id is required');
      }

      const job = await this.client.completeJob(params.job_id, params.completion_proof);
      
      return {
        success: true,
        data: {
          job_id: job.job_id,
          title: job.title,
          status: job.status,
          amount: job.amount,
          completion_proof: job.completion_proof,
          updated_at: job.updated_at,
        },
        message: `Job "${job.title}" marked as ${job.status}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Job completion failed',
      };
    }
  }

  /**
   * List jobs based on filters
   */
  async jobList(params: JobListParams = {}) {
    try {
      const jobs = await this.client.listJobs(params);
      
      return {
        success: true,
        data: {
          jobs: jobs.map(job => ({
            job_id: job.job_id,
            title: job.title,
            description: job.description,
            amount: job.amount,
            status: job.status,
            assignee: job.assignee_address,
            creator: job.creator_address,
            deadline: job.deadline,
            tags: job.tags,
            created_at: job.created_at,
          })),
          count: jobs.length,
        },
        message: `Found ${jobs.length} jobs`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to list jobs',
      };
    }
  }

  /**
   * List available services
   */
  async serviceList(params: ServiceListParams = {}) {
    try {
      const services = await this.client.listServices(params);
      
      return {
        success: true,
        data: {
          services: services.map(service => ({
            service_id: service.service_id,
            name: service.name,
            description: service.description,
            provider: service.provider_address,
            price_per_hour: service.price_per_hour,
            price_per_task: service.price_per_task,
            category: service.category,
            tags: service.tags,
            availability: service.availability,
            rating: service.rating,
            completed_jobs: service.completed_jobs,
          })),
          count: services.length,
        },
        message: `Found ${services.length} services`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to list services',
      };
    }
  }

  /**
   * Register a new service
   */
  async serviceRegister(params: ServiceRegisterParams) {
    try {
      if (!params.name) {
        throw new Error('name is required');
      }
      if (!params.description) {
        throw new Error('description is required');
      }
      if (!params.category) {
        throw new Error('category is required');
      }

      const service = await this.client.registerService(params);
      
      return {
        success: true,
        data: {
          service_id: service.service_id,
          name: service.name,
          description: service.description,
          price_per_hour: service.price_per_hour,
          price_per_task: service.price_per_task,
          category: service.category,
          tags: service.tags,
          availability: service.availability,
          provider: service.provider_address,
        },
        message: `Service "${params.name}" registered successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Service registration failed',
      };
    }
  }

  /**
   * Get transaction logs
   */
  async logs(limit: number = 20) {
    try {
      const logs = await this.client.getTransactionLogs(limit);
      
      return {
        success: true,
        data: {
          logs: logs.map(log => ({
            timestamp: log.timestamp,
            type: log.type,
            amount: log.amount,
            counterparty: log.counterparty,
            transaction_id: log.transaction_id,
            job_id: log.job_id,
            service_id: log.service_id,
            memo: log.memo,
            status: log.status,
          })),
          count: logs.length,
        },
        message: `Retrieved ${logs.length} transaction logs`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get transaction logs',
      };
    }
  }

  /**
   * Get current configuration
   */
  async config() {
    try {
      const config = this.client.getConfig();
      
      return {
        success: true,
        data: {
          api_base_url: config.api_base_url,
          network: config.network,
          agent_address: config.agent_address,
          timeout: config.timeout,
          has_api_key: !!config.api_key,
        },
        message: 'Current configuration',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get configuration',
      };
    }
  }
}

// Export default instance
export const agentCoinTool = new AgentCoinTool();

// Export for OpenClaw skill system
export default {
  name: 'agentcoin',
  description: 'AgentCoin cryptocurrency integration for AI agents',
  version: '1.0.0',
  commands: {
    balance: agentCoinTool.balance.bind(agentCoinTool),
    transfer: agentCoinTool.transfer.bind(agentCoinTool),
    request: agentCoinTool.request.bind(agentCoinTool),
    'job-create': agentCoinTool.jobCreate.bind(agentCoinTool),
    'job-complete': agentCoinTool.jobComplete.bind(agentCoinTool),
    'job-list': agentCoinTool.jobList.bind(agentCoinTool),
    'service-list': agentCoinTool.serviceList.bind(agentCoinTool),
    'service-register': agentCoinTool.serviceRegister.bind(agentCoinTool),
    logs: agentCoinTool.logs.bind(agentCoinTool),
    config: agentCoinTool.config.bind(agentCoinTool),
  },
};