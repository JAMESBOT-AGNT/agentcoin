// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AgentCoin.sol";

/**
 * @title AgentCoinMetadata
 * @notice Extensão do AgentCoin com metadata URI (opcional)
 * @dev Adiciona função tokenURI() para compatibilidade com carteiras
 */
contract AgentCoinMetadata is AgentCoin {
    
    string private _tokenURI;
    
    event MetadataURIUpdated(string newURI);
    
    constructor(string memory initialTokenURI) AgentCoin() {
        _tokenURI = initialTokenURI;
    }
    
    /**
     * @notice URI para metadata do token (logo, descrição, etc.)
     * @return string URI apontando para arquivo JSON com metadata
     */
    function tokenURI() external view returns (string memory) {
        return _tokenURI;
    }
    
    /**
     * @notice Atualizar URI do metadata (apenas admin)
     * @param newURI Nova URI para o arquivo de metadata
     */
    function setTokenURI(string calldata newURI) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        _tokenURI = newURI;
        emit MetadataURIUpdated(newURI);
    }
    
    /**
     * @notice Informações básicas do token para carteiras
     */
    function tokenInfo() external view returns (
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 totalSupply,
        string memory metadataURI
    ) {
        return (
            name(),
            symbol(), 
            decimals(),
            totalSupply(),
            _tokenURI
        );
    }
}