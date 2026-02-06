# AgentCoin (AGNT) - ERC-20 Token para Base L2

AgentCoin é um token ERC-20 desenvolvido para Base L2 com sistema de mint controlado baseado em trabalho verificado. O token possui zero pre-mine e implementa mecânicas deflacionárias através de burn.

## 🎯 Características Principais

- **Zero Pre-mine**: Supply inicial = 0
- **Supply Máximo**: 1,000,000,000 AGNT (1 bilhão)
- **Decimais**: 18
- **Mint Controlado**: Apenas contratos autorizados podem fazer mint
- **Sistema de Roles**: MINTER_ROLE e ADMIN_ROLE (DEFAULT_ADMIN_ROLE)
- **Deflação**: Função burn para reduzir supply
- **Segurança**: OpenZeppelin, ReentrancyGuard, Pausable
- **Base L2 Ready**: Otimizado para Ethereum Layer 2

## 📁 Estrutura do Projeto

```
projects/agent-coin/
├── contracts/
│   └── AgentCoin.sol          # Contrato principal
├── test/
│   └── AgentCoin.t.sol        # Testes em Solidity
├── README.md                  # Este arquivo
├── foundry.toml              # Configuração Foundry
└── deploy/                   # Scripts de deploy
    ├── foundry-deploy.s.sol  # Deploy via Foundry
    └── hardhat-deploy.js     # Deploy via Hardhat
```

## ⚡ Quick Start

### Opção 1: Foundry (Recomendado)

```bash
# 1. Instalar Foundry (se não tiver)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 2. Navegar para o diretório do projeto
cd /Users/andreantunes/.openclaw/workspace/projects/agent-coin

# 3. Inicializar projeto Foundry
forge init --no-git --no-commit

# 4. Instalar dependências OpenZeppelin
forge install OpenZeppelin/openzeppelin-contracts

# 5. Compilar contratos
forge build

# 6. Rodar testes
forge test

# 7. Rodar testes com verbosidade
forge test -vvv
```

### Opção 2: Hardhat

```bash
# 1. Inicializar projeto Node.js
npm init -y

# 2. Instalar Hardhat e dependências
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts

# 3. Inicializar Hardhat
npx hardhat

# 4. Compilar
npx hardhat compile

# 5. Rodar testes (após criar testes em JavaScript/TypeScript)
npx hardhat test
```

## 🧪 Testes

Os testes cobrem todas as funcionalidades principais:

- ✅ Deployment correto (zero pre-mine)
- ✅ Sistema de roles (ADMIN/MINTER)
- ✅ Mint controlado e validações
- ✅ Batch mint para otimização de gas
- ✅ Burn e burnFrom (deflação)
- ✅ Pausable para emergências
- ✅ Validações de segurança
- ✅ Edge cases (max supply, etc.)

```bash
# Rodar todos os testes
forge test

# Testes específicos
forge test --match-test testMint
forge test --match-test testBurn
forge test --match-test testAccessControl

# Coverage
forge coverage
```

## 🚀 Deploy

### Deploy para Base Mainnet

```bash
# 1. Configurar variáveis de ambiente
export PRIVATE_KEY="sua_private_key"
export BASE_RPC_URL="https://mainnet.base.org"
export ETHERSCAN_API_KEY="sua_api_key"

# 2. Deploy via Foundry
forge script script/Deploy.s.sol --rpc-url $BASE_RPC_URL --broadcast --verify

# 3. Verificar contrato
forge verify-contract <endereço_do_contrato> contracts/AgentCoin.sol:AgentCoin --etherscan-api-key $ETHERSCAN_API_KEY
```

### Deploy para Base Testnet (Goerli)

```bash
export BASE_GOERLI_RPC="https://goerli.base.org"
forge script script/Deploy.s.sol --rpc-url $BASE_GOERLI_RPC --broadcast
```

## 🔐 Segurança

### Controles Implementados

1. **Access Control**: Roles granulares com OpenZeppelin AccessControl
2. **ReentrancyGuard**: Proteção contra ataques de reentrância
3. **Pausable**: Capacidade de pausar em emergências
4. **Max Supply**: Cap rígido de 1 bilhão de tokens
5. **Validações**: Endereços zero, amounts, overflows

### Roles e Permissões

- **DEFAULT_ADMIN_ROLE**: 
  - Adicionar/remover MINTERs
  - Pausar/despausar contrato
  - Transferir admin role (governance)

- **MINTER_ROLE**:
  - Mint tokens para endereços válidos
  - Batch mint para otimização

## 📊 Funcionalidades do Contrato

### Mint (Apenas MINTER_ROLE)
```solidity
// Mint individual
function mint(address to, uint256 amount) external

// Batch mint (economia de gas)
function batchMint(address[] recipients, uint256[] amounts) external
```

### Burn (Deflação)
```solidity
// Burn próprios tokens
function burn(uint256 amount) external

// Burn tokens de terceiros (com allowance)  
function burnFrom(address account, uint256 amount) external
```

### Administração (Apenas ADMIN_ROLE)
```solidity
// Gerenciar minters
function addMinter(address minter) external
function removeMinter(address minter) external

// Emergências
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

## 🔄 Workflow Típico

1. **Deploy**: Admin deploye o contrato
2. **Setup**: Admin adiciona contratos de trabalho verificado como MINTERs
3. **Mint**: Contratos verificadores fazem mint baseado em trabalho comprovado
4. **Deflação**: Usuários podem fazer burn voluntário ou através de mecânicas do protocolo
5. **Governance**: Admin role eventualmente transferido para multisig/DAO

## 📈 Tokenomics

- **Supply Inicial**: 0 AGNT (zero pre-mine)
- **Supply Máximo**: 1,000,000,000 AGNT
- **Emissão**: Apenas por trabalho verificado
- **Deflação**: Burn voluntário ou por protocolo
- **Sem Inflação**: Cap rígido, sem mint além do máximo

## 🌐 Integração Base L2

O contrato está otimizado para Base L2:
- Gas fees reduzidas
- Transações mais rápidas  
- Compatível com Ethereum tooling
- Verificação via Basescan

## 🛠 Desenvolvimento

### Adicionar Novas Funcionalidades

1. Implementar no contrato principal
2. Adicionar testes correspondentes
3. Atualizar documentação
4. Testar em testnet antes de mainnet

### Melhores Práticas

- Sempre usar roles para controle de acesso
- Implementar pausable em funções críticas
- Adicionar events para tracking off-chain
- Validar todos os inputs
- Testar edge cases

## 🔗 Links Úteis

- [Base Documentation](https://docs.base.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Foundry Book](https://book.getfoundry.sh/)
- [Basescan](https://basescan.org/)

## 📄 License

MIT License - veja arquivo LICENSE para detalhes.

---

**⚠️ IMPORTANTE**: Este contrato ainda não foi auditado. Use por sua própria conta e risco. Recomenda-se auditoria profissional antes de uso em produção.