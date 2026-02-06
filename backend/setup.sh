#!/bin/bash

# AgentCoin Backend Setup Script
echo "🚀 Setting up AgentCoin Backend..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Setup environment file
if [ ! -f .env ]; then
    echo -e "${YELLOW}🔧 Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env file with your configuration before continuing${NC}"
    echo -e "${YELLOW}   - Set your PostgreSQL DATABASE_URL${NC}"
    echo -e "${YELLOW}   - Configure ETHEREUM_RPC_URL${NC}"
    echo -e "${YELLOW}   - Set AGNT_TOKEN_ADDRESS${NC}"
    echo ""
    read -p "Press Enter once you've configured .env, or Ctrl+C to exit..."
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Generate Prisma client
echo -e "${YELLOW}🗄️  Generating Prisma client...${NC}"
npm run db:generate

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to generate Prisma client${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prisma client generated${NC}"

# Setup database
echo -e "${YELLOW}🗄️  Setting up database schema...${NC}"
npm run db:push

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to setup database. Check your DATABASE_URL in .env${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Database schema created${NC}"

# Ask about seeding
echo ""
read -p "🌱 Would you like to seed the database with sample data? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🌱 Seeding database...${NC}"
    npm run db:seed
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database seeded with sample data${NC}"
    else
        echo -e "${RED}❌ Failed to seed database${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "   1. Review your .env configuration"
echo "   2. Start the server: npm run dev"
echo "   3. Test API: http://localhost:3000/health"
echo "   4. View database: npm run db:studio"
echo ""
echo -e "${GREEN}🚀 Happy coding!${NC}"