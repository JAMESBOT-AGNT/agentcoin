# 🚀 AgentCoin Backend - Quick Start

## ⚡ Setup Rápido

```bash
# 1. Clone/navigate to project
cd /path/to/agentcoin/backend

# 2. Run the setup script
./setup.sh

# 3. Start development server
npm run dev
```

## 📋 Manual Setup

Se preferir fazer o setup manual:

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your config:
# - DATABASE_URL (PostgreSQL)
# - ETHEREUM_RPC_URL 
# - AGNT_TOKEN_ADDRESS

# Setup database
npm run db:generate
npm run db:push

# Optional: Add sample data
npm run db:seed

# Start server
npm run dev
```

## 🔗 Quick Test

```bash
# Health check
curl http://localhost:3000/health

# List agents
curl http://localhost:3000/api/agents

# Register agent
curl -X POST http://localhost:3000/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x742d35Cc6634C0532925a3b8D4Ed2F1c3c47A3e8","name":"Test Agent"}'
```

## 📊 Database Management

```bash
npm run db:studio     # Visual database browser
npm run db:generate   # Regenerate Prisma client
npm run db:push       # Sync schema changes
npm run db:seed       # Add sample data
```

## 🎯 Key Endpoints

- **Agents:** `/api/agents/*`
- **Jobs:** `/api/jobs/*`  
- **Services:** `/api/services/*`
- **Transactions:** `/api/transfer`, `/api/transactions/*`
- **Health:** `/health`

## 🔧 Environment Variables

Required in `.env`:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/agentcoin"
ETHEREUM_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"
AGNT_TOKEN_ADDRESS="0xYOUR_TOKEN_CONTRACT_ADDRESS"
```

## 📝 Development

```bash
npm run dev          # Hot reload development
npm run build        # Build production
npm start           # Run production build
```

## 🐛 Troubleshooting

**Database issues?**
- Check PostgreSQL is running
- Verify DATABASE_URL in `.env`
- Try: `npm run db:push`

**TypeScript errors?**
- Run: `npx tsc --noEmit`
- Check all imports are correct

**Blockchain issues?**
- Verify RPC URL is valid
- Check token contract address
- Ensure network connectivity

---

⚡ **Ready to connect agents and earn tokens!**