# AgentCoin (AGNT) - Token ERC-20 para Base L2

AgentCoin es un token ERC-20 desarrollado para Base L2 con un sistema de acuñación controlado basado en trabajo verificado. El token cuenta con cero pre-minado e implementa mecánicas deflacionarias a través de quema.

## 🎯 Características Principales

- **Cero Pre-minado**: Suministro inicial = 0
- **Suministro Máximo**: 1,000,000,000 AGNT (1 mil millones)
- **Decimales**: 18
- **Acuñación Controlada**: Solo contratos autorizados pueden acuñar
- **Sistema de Roles**: MINTER_ROLE y ADMIN_ROLE (DEFAULT_ADMIN_ROLE)
- **Deflación**: Función de quema para reducir suministro
- **Seguridad**: OpenZeppelin, ReentrancyGuard, Pausable
- **Base L2 Ready**: Optimizado para Ethereum Layer 2

## 📁 Estructura del Proyecto

```
projects/agent-coin/
├── contracts/
│   └── AgentCoin.sol          # Contrato principal
├── test/
│   └── AgentCoin.t.sol        # Pruebas en Solidity
├── README.md                  # Archivo principal (inglés)
├── README.es.md               # Este archivo (español)
├── foundry.toml              # Configuración Foundry
└── deploy/                   # Scripts de despliegue
    ├── foundry-deploy.s.sol  # Despliegue vía Foundry
    └── hardhat-deploy.js     # Despliegue vía Hardhat
```

## ⚡ Inicio Rápido

### Opción 1: Foundry (Recomendado)

```bash
# 1. Instalar Foundry (si no está instalado)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 2. Navegar al directorio del proyecto
cd /Users/andreantunes/.openclaw/workspace/projects/agent-coin

# 3. Inicializar proyecto Foundry
forge init --no-git --no-commit

# 4. Instalar dependencias OpenZeppelin
forge install OpenZeppelin/openzeppelin-contracts

# 5. Compilar contratos
forge build

# 6. Ejecutar pruebas
forge test

# 7. Ejecutar pruebas con verbosidad
forge test -vvv
```

### Opción 2: Hardhat

```bash
# 1. Inicializar proyecto Node.js
npm init -y

# 2. Instalar Hardhat y dependencias
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts

# 3. Inicializar Hardhat
npx hardhat

# 4. Compilar
npx hardhat compile

# 5. Ejecutar pruebas (después de crear pruebas en JavaScript/TypeScript)
npx hardhat test
```

## 🧪 Pruebas

Las pruebas cubren todas las funcionalidades principales:

- ✅ Despliegue correcto (cero pre-minado)
- ✅ Sistema de roles (ADMIN/MINTER)
- ✅ Acuñación controlada y validaciones
- ✅ Acuñación por lotes para optimización de gas
- ✅ Burn y burnFrom (deflación)
- ✅ Pausable para emergencias
- ✅ Validaciones de seguridad
- ✅ Casos extremos (suministro máximo, etc.)

```bash
# Ejecutar todas las pruebas
forge test

# Pruebas específicas
forge test --match-test testMint
forge test --match-test testBurn
forge test --match-test testAccessControl

# Cobertura
forge coverage
```

## 🚀 Despliegue

### Desplegar en Base Mainnet

```bash
# 1. Configurar variables de entorno
export PRIVATE_KEY="tu_clave_privada"
export BASE_RPC_URL="https://mainnet.base.org"
export ETHERSCAN_API_KEY="tu_api_key"

# 2. Desplegar vía Foundry
forge script script/Deploy.s.sol --rpc-url $BASE_RPC_URL --broadcast --verify

# 3. Verificar contrato
forge verify-contract <dirección_del_contrato> contracts/AgentCoin.sol:AgentCoin --etherscan-api-key $ETHERSCAN_API_KEY
```

### Desplegar en Base Testnet (Goerli)

```bash
export BASE_GOERLI_RPC="https://goerli.base.org"
forge script script/Deploy.s.sol --rpc-url $BASE_GOERLI_RPC --broadcast
```

## 🔐 Seguridad

### Controles Implementados

1. **Control de Acceso**: Roles granulares con OpenZeppelin AccessControl
2. **ReentrancyGuard**: Protección contra ataques de reentrada
3. **Pausable**: Capacidad de pausa de emergencia
4. **Suministro Máximo**: Límite rígido de 1 mil millones de tokens
5. **Validaciones**: Direcciones cero, cantidades, desbordamientos

### Roles y Permisos

- **DEFAULT_ADMIN_ROLE**: 
  - Agregar/eliminar MINTERs
  - Pausar/despausar contrato
  - Transferir rol admin (gobernanza)

- **MINTER_ROLE**:
  - Acuñar tokens a direcciones válidas
  - Acuñación por lotes para optimización

## 📊 Funcionalidades del Contrato

### Acuñar (Solo MINTER_ROLE)
```solidity
// Acuñación individual
function mint(address to, uint256 amount) external

// Acuñación por lotes (ahorro de gas)
function batchMint(address[] recipients, uint256[] amounts) external
```

### Quemar (Deflación)
```solidity
// Quemar tokens propios
function burn(uint256 amount) external

// Quemar tokens de terceros (con allowance)  
function burnFrom(address account, uint256 amount) external
```

### Administración (Solo ADMIN_ROLE)
```solidity
// Gestionar acuñadores
function addMinter(address minter) external
function removeMinter(address minter) external

// Emergencias
function pause() external
function unpause() external
```

### Vistas
```solidity
function maxSupply() external pure returns (uint256)
function remainingSupply() external view returns (uint256)
function totalMinted() external view returns (uint256)
function isMinter(address account) external view returns (bool)
function isAdmin(address account) external view returns (bool)
```

## 🔄 Flujo de Trabajo Típico

1. **Despliegue**: El admin despliega el contrato
2. **Configuración**: El admin añade contratos de trabajo verificado como MINTERs
3. **Acuñación**: Los contratos verificadores acuñan basado en trabajo probado
4. **Deflación**: Los usuarios pueden quemar voluntariamente o a través de mecánicas del protocolo
5. **Gobernanza**: El rol admin se transfiere eventualmente a multisig/DAO

## 📈 Tokenomics

- **Suministro Inicial**: 0 AGNT (cero pre-minado)
- **Suministro Máximo**: 1,000,000,000 AGNT
- **Emisión**: Solo a través de trabajo verificado
- **Deflación**: Quema voluntaria o impulsada por protocolo
- **Sin Inflación**: Límite rígido, no se acuña más allá del máximo

## 🌐 Integración Base L2

El contrato está optimizado para Base L2:
- Tarifas de gas reducidas
- Transacciones más rápidas  
- Compatible con herramientas Ethereum
- Verificación vía Basescan

## 🛠 Desarrollo

### Agregar Nuevas Características

1. Implementar en el contrato principal
2. Añadir pruebas correspondientes
3. Actualizar documentación
4. Probar en testnet antes de mainnet

### Mejores Prácticas

- Usar siempre roles para control de acceso
- Implementar pausable en funciones críticas
- Añadir eventos para seguimiento off-chain
- Validar todas las entradas
- Probar casos extremos

## 🔗 Enlaces Útiles

- [Documentación de Base](https://docs.base.org/)
- [Contratos OpenZeppelin](https://docs.openzeppelin.com/contracts/)
- [Libro de Foundry](https://book.getfoundry.sh/)
- [Basescan](https://basescan.org/)

## 📄 Licencia

Licencia MIT - ver archivo LICENSE para detalles.

---

**⚠️ IMPORTANTE**: Este contrato aún no ha sido auditado. Úsalo bajo tu propio riesgo. Se recomienda auditoría profesional antes del uso en producción.