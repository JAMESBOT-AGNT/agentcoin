# AgentCoin (AGNT) - ERC-20 Token for Base L2

AgentCoin is an ERC-20 token developed for Base L2 with a controlled minting system based on verified work. The token features zero pre-mine and implements deflationary mechanics through burning.

## 🎯 Key Features

- **Zero Pre-mine**: Initial supply = 0
- **Maximum Supply**: 1,000,000,000 AGNT (1 billion)
- **Decimals**: 18
- **Controlled Minting**: Only authorized contracts can mint
- **Role System**: MINTER_ROLE and ADMIN_ROLE (DEFAULT_ADMIN_ROLE)
- **Deflation**: Burn function to reduce supply
- **Security**: OpenZeppelin, ReentrancyGuard, Pausable
- **Base L2 Ready**: Optimized for Ethereum Layer 2

## 📁 Project Structure

```
projects/agent-coin/
├── contracts/
│   └── AgentCoin.sol          # Main contract
├── test/
│   └── AgentCoin.t.sol        # Solidity tests
├── README.md                  # This file
├── foundry.toml              # Foundry configuration
└── deploy/                   # Deploy scripts
    ├── foundry-deploy.s.sol  # Deploy via Foundry
    └── hardhat-deploy.js     # Deploy via Hardhat
```

## ⚡ Quick Start

### Option 1: Foundry (Recommended)

```bash
# 1. Install Foundry (if not installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 2. Navigate to project directory
cd /Users/andreantunes/.openclaw/workspace/projects/agent-coin

# 3. Initialize Foundry project
forge init --no-git --no-commit

# 4. Install OpenZeppelin dependencies
forge install OpenZeppelin/openzeppelin-contracts

# 5. Compile contracts
forge build

# 6. Run tests
forge test

# 7. Run tests with verbosity
forge test -vvv
```

### Option 2: Hardhat

```bash
# 1. Initialize Node.js project
npm init -y

# 2. Install Hardhat and dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts

# 3. Initialize Hardhat
npx hardhat

# 4. Compile
npx hardhat compile

# 5. Run tests (after creating tests in JavaScript/TypeScript)
npx hardhat test
```

## 🧪 Testing

The tests cover all main functionalities:

- ✅ Correct deployment (zero pre-mine)
- ✅ Role system (ADMIN/MINTER)
- ✅ Controlled minting and validations
- ✅ Batch minting for gas optimization
- ✅ Burn and burnFrom (deflation)
- ✅ Pausable for emergencies
- ✅ Security validations
- ✅ Edge cases (max supply, etc.)

```bash
# Run all tests
forge test

# Specific tests
forge test --match-test testMint
forge test --match-test testBurn
forge test --match-test testAccessControl

# Coverage
forge coverage
```

## 🚀 Deployment

### Deploy to Base Mainnet

```bash
# 1. Configure environment variables
export PRIVATE_KEY="your_private_key"
export BASE_RPC_URL="https://mainnet.base.org"
export ETHERSCAN_API_KEY="your_api_key"

# 2. Deploy via Foundry
forge script script/Deploy.s.sol --rpc-url $BASE_RPC_URL --broadcast --verify

# 3. Verify contract
forge verify-contract <contract_address> contracts/AgentCoin.sol:AgentCoin --etherscan-api-key $ETHERSCAN_API_KEY
```

### Deploy to Base Testnet (Goerli)

```bash
export BASE_GOERLI_RPC="https://goerli.base.org"
forge script script/Deploy.s.sol --rpc-url $BASE_GOERLI_RPC --broadcast
```

## 🔐 Security

### Implemented Controls

1. **Access Control**: Granular roles with OpenZeppelin AccessControl
2. **ReentrancyGuard**: Protection against reentrancy attacks
3. **Pausable**: Emergency pause capability
4. **Max Supply**: Hard cap of 1 billion tokens
5. **Validations**: Zero addresses, amounts, overflows

### Roles and Permissions

- **DEFAULT_ADMIN_ROLE**: 
  - Add/remove MINTERs
  - Pause/unpause contract
  - Transfer admin role (governance)

- **MINTER_ROLE**:
  - Mint tokens to valid addresses
  - Batch mint for optimization

## 📊 Contract Functionalities

### Mint (MINTER_ROLE Only)
```solidity
// Individual mint
function mint(address to, uint256 amount) external

// Batch mint (gas savings)
function batchMint(address[] recipients, uint256[] amounts) external
```

### Burn (Deflation)
```solidity
// Burn own tokens
function burn(uint256 amount) external

// Burn third-party tokens (with allowance)  
function burnFrom(address account, uint256 amount) external
```

### Administration (ADMIN_ROLE Only)
```solidity
// Manage minters
function addMinter(address minter) external
function removeMinter(address minter) external

// Emergencies
function pause() external
function unpause() external
```

### Views
```solidity
function maxSupply() external pure returns (uint256)
function remainingSupply() external view returns (uint256)
function totalMinted() external view returns (uint256)
function isMinter(address account) external view returns (bool)
function isAdmin(address account) external view returns (bool)
```

## 🔄 Typical Workflow

1. **Deploy**: Admin deploys the contract
2. **Setup**: Admin adds verified work contracts as MINTERs
3. **Mint**: Verifier contracts mint based on proven work
4. **Deflation**: Users can voluntarily burn or through protocol mechanics
5. **Governance**: Admin role eventually transferred to multisig/DAO

## 📈 Tokenomics

- **Initial Supply**: 0 AGNT (zero pre-mine)
- **Maximum Supply**: 1,000,000,000 AGNT
- **Issuance**: Only through verified work
- **Deflation**: Voluntary or protocol-driven burn
- **No Inflation**: Hard cap, no minting beyond maximum

## 🌐 Base L2 Integration

The contract is optimized for Base L2:
- Reduced gas fees
- Faster transactions  
- Compatible with Ethereum tooling
- Verification via Basescan

## 🛠 Development

### Adding New Features

1. Implement in main contract
2. Add corresponding tests
3. Update documentation
4. Test on testnet before mainnet

### Best Practices

- Always use roles for access control
- Implement pausable in critical functions
- Add events for off-chain tracking
- Validate all inputs
- Test edge cases

## 🔗 Useful Links

- [Base Documentation](https://docs.base.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Foundry Book](https://book.getfoundry.sh/)
- [Basescan](https://basescan.org/)

## 📄 License

MIT License - see LICENSE file for details.

---

**⚠️ IMPORTANT**: This contract has not been audited yet. Use at your own risk. Professional auditing is recommended before production use.