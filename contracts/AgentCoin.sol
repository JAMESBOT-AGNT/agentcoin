// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AgentCoin (AGNT)
 * @notice ERC-20 token para economia entre agentes AI
 * @dev Fair launch - supply inicial = 0, mint apenas por trabalho verificado
 */
contract AgentCoin is ERC20, ERC20Burnable, ERC20Pausable, AccessControl, ReentrancyGuard {
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 bilhão
    
    uint256 public totalMinted;
    
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    
    constructor() ERC20("AgentCoin", "AGNT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        // Note: Sem pre-mine - supply inicial = 0
    }
    
    /**
     * @notice Mint novos tokens (apenas para minters autorizados)
     * @param to Endereço que receberá os tokens
     * @param amount Quantidade a mintar
     * @param reason Razão do mint (ex: "work_completed")
     */
    function mint(address to, uint256 amount, string calldata reason) 
        external 
        onlyRole(MINTER_ROLE) 
        nonReentrant 
    {
        require(totalMinted + amount <= MAX_SUPPLY, "Exceeds max supply");
        totalMinted += amount;
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }
    
    /**
     * @notice Adicionar um minter (ex: WorkRegistry contract)
     */
    function addMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, minter);
        emit MinterAdded(minter);
    }
    
    /**
     * @notice Remover um minter
     */
    function removeMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(MINTER_ROLE, minter);
        emit MinterRemoved(minter);
    }
    
    /**
     * @notice Pausar todas as transferências (emergência)
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @notice Retomar transferências
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    /**
     * @notice Supply restante para mint
     */
    function remainingMintableSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalMinted;
    }
    
    // Override necessário para ERC20Pausable (OpenZeppelin v5)
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}
