// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/AgentCoin.sol";

/**
 * @title Deploy Script para AgentCoin
 * @dev Script para deploy do AgentCoin em Base L2
 * 
 * Usage:
 * forge script script/Deploy.s.sol --rpc-url $BASE_RPC_URL --broadcast --verify
 * 
 * Variáveis de ambiente necessárias:
 * - PRIVATE_KEY: Private key do deployer
 * - ADMIN_ADDRESS: Endereço que receberá o DEFAULT_ADMIN_ROLE (opcional, usa deployer se não definido)
 */
contract DeployScript is Script {
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Admin pode ser especificado via env var, senão usa o deployer
        address admin;
        try vm.envAddress("ADMIN_ADDRESS") returns (address _admin) {
            admin = _admin;
        } catch {
            admin = deployer;
        }
        
        console.log("Deploying AgentCoin...");
        console.log("Deployer:", deployer);
        console.log("Admin:", admin);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy do contrato
        AgentCoin token = new AgentCoin(admin);
        
        vm.stopBroadcast();
        
        console.log("AgentCoin deployed to:", address(token));
        console.log("Initial supply:", token.totalSupply());
        console.log("Max supply:", token.maxSupply());
        console.log("Admin role granted to:", admin);
        
        // Verificar se admin é diferente do deployer e transferir role se necessário
        if (admin != deployer) {
            console.log("Note: Admin role granted to specified admin address");
        }
        
        console.log("\nNext steps:");
        console.log("1. Verify contract on block explorer");
        console.log("2. Add authorized minter contracts using addMinter()");
        console.log("3. Transfer admin role to multisig if needed");
        
        // Salvar deployment info
        string memory deploymentInfo = string.concat(
            "{\n",
            '  "contractAddress": "', vm.toString(address(token)), '",\n',
            '  "deployer": "', vm.toString(deployer), '",\n',
            '  "admin": "', vm.toString(admin), '",\n',
            '  "network": "base",\n',
            '  "blockNumber": ', vm.toString(block.number), ',\n',
            '  "timestamp": ', vm.toString(block.timestamp), '\n',
            "}"
        );
        
        vm.writeFile("deployments/base_deployment.json", deploymentInfo);
        console.log("\nDeployment info saved to: deployments/base_deployment.json");
    }
}

/**
 * @title Deploy Script para Testnet
 * @dev Versão específica para testnets com configurações extras
 */
contract DeployTestnetScript is Script {
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying AgentCoin to TESTNET...");
        console.log("Deployer:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy com deployer como admin inicial
        AgentCoin token = new AgentCoin(deployer);
        
        // Para testnet, já adicionar o deployer como minter para testes
        token.addMinter(deployer);
        
        vm.stopBroadcast();
        
        console.log("AgentCoin deployed to:", address(token));
        console.log("Deployer has both ADMIN and MINTER roles");
        
        // Test mint para verificar funcionamento
        vm.startBroadcast(deployerPrivateKey);
        token.mint(deployer, 1000 * 10**18); // Mint 1000 tokens para teste
        vm.stopBroadcast();
        
        console.log("Test mint successful - Balance:", token.balanceOf(deployer));
        console.log("Total supply:", token.totalSupply());
        
        // Salvar deployment info para testnet
        string memory network = "base_testnet";
        try vm.envString("NETWORK") returns (string memory _network) {
            network = _network;
        } catch {}
        
        string memory deploymentInfo = string.concat(
            "{\n",
            '  "contractAddress": "', vm.toString(address(token)), '",\n',
            '  "deployer": "', vm.toString(deployer), '",\n',
            '  "admin": "', vm.toString(deployer), '",\n',
            '  "network": "', network, '",\n',
            '  "blockNumber": ', vm.toString(block.number), ',\n',
            '  "timestamp": ', vm.toString(block.timestamp), ',\n',
            '  "testMintCompleted": true\n',
            "}"
        );
        
        string memory filename = string.concat("deployments/", network, "_deployment.json");
        vm.writeFile(filename, deploymentInfo);
        console.log("Deployment info saved to:", filename);
    }
}