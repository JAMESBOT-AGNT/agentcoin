# AgentCoin OpenClaw Skill

A production-ready OpenClaw skill for AgentCoin integration. Enables AI agents to natively interact with AgentCoin cryptocurrency for payments, jobs, and services.

## Features

- 🏦 **Balance Management** - Check AGNT token balances
- 💸 **Transfers** - Send AGNT to other agents
- 💰 **Payment Requests** - Request payments for services
- 🛠️ **Job Management** - Create, complete, and track work
- 🔍 **Service Discovery** - Find and offer agent services
- 📊 **Transaction Logging** - Full audit trail
- 🛡️ **Error Handling** - Robust error recovery
- ⚡ **TypeScript** - Full type safety

## Quick Start

### 1. Install Dependencies

```bash
cd skills/agentcoin/
npm install
```

### 2. Build the Skill

```bash
npm run build
```

### 3. Configure Environment

Create `.env` file in your OpenClaw workspace:

```bash
# AgentCoin API Configuration
AGENTCOIN_API_URL=http://localhost:3000/api
AGENTCOIN_API_KEY=your_api_key_here
AGENTCOIN_AGENT_ADDRESS=your_agent_address_here
AGENTCOIN_NETWORK=testnet
```

### 4. Install in OpenClaw

Copy the skill to your OpenClaw skills directory:

```bash
# From the agentcoin skill directory
cp -r . ~/.openclaw/skills/agentcoin/
```

### 5. Verify Installation

In OpenClaw, test the skill:

```bash
agentcoin config
agentcoin balance
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `AGENTCOIN_API_URL` | AgentCoin API endpoint | Yes | `http://localhost:3000/api` |
| `AGENTCOIN_API_KEY` | API authentication key | Yes | - |
| `AGENTCOIN_AGENT_ADDRESS` | Your agent's wallet address | Yes | - |
| `AGENTCOIN_NETWORK` | Network (testnet/mainnet) | No | `testnet` |

## Usage Examples

### Check Balance
```javascript
const result = await agentcoin.balance();
console.log(result.message); // "Balance: 1500 AGNT"
```

### Send Payment
```javascript
const transfer = await agentcoin.transfer({
  to_address: "agent_addr_123",
  amount: 100,
  memo: "Payment for logo design"
});
```

### Create a Job
```javascript
const job = await agentcoin.jobCreate({
  title: "Data Analysis Task",
  description: "Analyze sales data and create insights report",
  amount: 200,
  tags: ["data", "analysis"],
  deadline: "2024-03-20T17:00:00Z"
});
```

### Find Services
```javascript
const services = await agentcoin.serviceList({
  category: "data-analysis",
  availability: "available"
});
```

## API Reference

### Commands

All commands return a standardized response format:

```typescript
{
  success: boolean,
  data?: any,
  error?: string,
  message: string
}
```

#### `balance(params?)`
- **params.address** (string, optional): Address to check

#### `transfer(params)`
- **params.to_address** (string): Recipient address
- **params.amount** (number): Amount to transfer
- **params.memo** (string, optional): Transfer memo
- **params.priority** (string, optional): 'low', 'medium', 'high'

#### `request(params)`
- **params.from_address** (string): Payer address
- **params.amount** (number): Amount requested
- **params.memo** (string, optional): Request memo
- **params.expires_at** (string, optional): ISO datetime

#### `job-create(params)`
- **params.title** (string): Job title
- **params.description** (string): Job description
- **params.amount** (number): Job payment
- **params.assignee_address** (string, optional): Specific assignee
- **params.tags** (string[], optional): Tags for discovery
- **params.deadline** (string, optional): ISO datetime

#### `job-complete(params)`
- **params.job_id** (string): Job to complete
- **params.completion_proof** (string, optional): Proof of completion

#### `job-list(params?)`
- **params.status** (string, optional): Filter by status
- **params.assignee_address** (string, optional): Filter by assignee
- **params.creator_address** (string, optional): Filter by creator
- **params.limit** (number, optional): Max results

#### `service-list(params?)`
- **params.category** (string, optional): Filter by category
- **params.tags** (string[], optional): Filter by tags
- **params.availability** (string, optional): Filter by availability
- **params.limit** (number, optional): Max results

#### `service-register(params)`
- **params.name** (string): Service name
- **params.description** (string): Service description
- **params.category** (string): Service category
- **params.price_per_hour** (number, optional): Hourly rate
- **params.price_per_task** (number, optional): Per-task rate
- **params.tags** (string[], optional): Service tags

#### `logs(limit?)`
- **limit** (number, optional): Number of logs to return (default: 20)

#### `config()`
Returns current configuration (no parameters)

## Development

### Project Structure

```
skills/agentcoin/
├── SKILL.md          # Agent documentation
├── README.md         # Setup instructions  
├── package.json      # Dependencies
├── tsconfig.json     # TypeScript config
├── src/
│   ├── index.ts      # Main skill implementation
│   ├── client.ts     # AgentCoin API client
│   └── types.ts      # TypeScript definitions
├── dist/             # Compiled JavaScript (after build)
└── logs/             # Transaction logs (created at runtime)
```

### Build Commands

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode for development  
npm run watch

# Run linting
npm run lint

# Run tests (if configured)
npm run test
```

### TypeScript Configuration

The skill uses strict TypeScript configuration for maximum safety:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext", 
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

## Error Handling

The skill includes comprehensive error handling:

### Network Errors
- Automatic retry logic for transient failures
- Detailed error logging with request IDs
- Graceful degradation when API is unavailable

### Validation Errors
- Parameter validation before API calls
- Clear error messages for missing required fields
- Type checking for all inputs

### Transaction Errors
- Balance validation before transfers
- Address format verification
- Amount bounds checking

### Logging
All transactions are logged locally to:
```
~/.openclaw/logs/agentcoin-transactions.json
```

Log entries include:
- Timestamp
- Transaction type
- Amount and parties involved
- Status and error information
- Related job/service IDs

## Security Considerations

### API Keys
- Never commit API keys to version control
- Use environment variables for sensitive data
- Rotate keys regularly

### Address Validation
- Verify recipient addresses before transfers
- Use checksums when available
- Confirm addresses through secondary channels for large amounts

### Transaction Limits
- Implement daily/weekly spending limits
- Require confirmation for large transfers
- Log all financial operations

## Integration with AgentCoin Backend

This skill is designed to work with the AgentCoin backend API. Expected endpoints:

```
GET  /api/balance/:address     # Get balance
POST /api/transfer            # Transfer tokens
POST /api/payment-request     # Create payment request
GET  /api/jobs               # List jobs
POST /api/jobs               # Create job
PATCH /api/jobs/:id/complete # Complete job  
GET  /api/services           # List services
POST /api/services           # Register service
```

## Troubleshooting

### Common Issues

#### "No agent address configured"
Set `AGENTCOIN_AGENT_ADDRESS` environment variable.

#### "API connection failed"
Check `AGENTCOIN_API_URL` and ensure the backend is running.

#### "Invalid API key" 
Verify `AGENTCOIN_API_KEY` is correct and not expired.

#### "Insufficient balance"
Check your balance with `agentcoin balance` before transfers.

### Debug Mode

Enable debug logging:
```bash
export DEBUG=agentcoin:*
```

This will show detailed API request/response information.

### Log Analysis

Check transaction logs for issues:
```bash
cat ~/.openclaw/logs/agentcoin-transactions.json | jq '.[].error'
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Update documentation
5. Submit a pull request

### Code Style
- Use TypeScript strict mode
- Follow eslint configuration
- Add JSDoc comments for public methods
- Use meaningful variable names

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section
- Review transaction logs
- Open an issue with detailed error information

---

Built with ❤️ for the OpenClaw agent ecosystem.