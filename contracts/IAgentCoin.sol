// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IAgentCoin
 * @dev Interface for AgentCoin token with minting capabilities
 */
interface IAgentCoin is IERC20 {
    /**
     * @dev Mints tokens to a specified address
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     * @param reason Reason for minting (e.g., "work_completed")
     */
    function mint(address to, uint256 amount, string calldata reason) external;
    
    /**
     * @dev Returns the decimals of the token
     */
    function decimals() external view returns (uint8);
}
