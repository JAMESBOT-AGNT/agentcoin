// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/AgentCoin.sol";
import "../contracts/WorkRegistry.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying from:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy AgentCoin
        AgentCoin token = new AgentCoin();
        console.log("AgentCoin deployed at:", address(token));
        
        // Deploy WorkRegistry
        WorkRegistry registry = new WorkRegistry(
            address(token),
            deployer,  // arbitrator
            deployer   // fee recipient
        );
        console.log("WorkRegistry deployed at:", address(registry));
        
        // Grant MINTER_ROLE to WorkRegistry
        token.addMinter(address(registry));
        console.log("WorkRegistry granted MINTER_ROLE");
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("Token:", address(token));
        console.log("Registry:", address(registry));
    }
}
