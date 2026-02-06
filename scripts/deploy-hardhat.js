/**
 * Deploy script para AgentCoin usando Hardhat
 * 
 * Usage:
 * npx hardhat run scripts/deploy-hardhat.js --network base
 * npx hardhat run scripts/deploy-hardhat.js --network base_goerli
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying AgentCoin to", hre.network.name);
    
    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    console.log("Deployer balance:", hre.ethers.utils.formatEther(await deployer.getBalance()), "ETH");
    
    // Admin address (use environment variable or deployer)
    const adminAddress = process.env.ADMIN_ADDRESS || deployer.address;
    console.log("Admin address:", adminAddress);
    
    // Deploy AgentCoin
    console.log("\n📄 Deploying AgentCoin contract...");
    const AgentCoin = await hre.ethers.getContractFactory("AgentCoin");
    const token = await AgentCoin.deploy(adminAddress);
    
    await token.deployed();
    
    console.log("✅ AgentCoin deployed to:", token.address);
    console.log("Transaction hash:", token.deployTransaction.hash);
    
    // Wait for a few confirmations
    console.log("⏳ Waiting for confirmations...");
    await token.deployTransaction.wait(2);
    
    // Verify contract details
    console.log("\n📊 Contract Details:");
    console.log("Name:", await token.name());
    console.log("Symbol:", await token.symbol());
    console.log("Decimals:", await token.decimals());
    console.log("Total Supply:", hre.ethers.utils.formatEther(await token.totalSupply()));
    console.log("Max Supply:", hre.ethers.utils.formatEther(await token.maxSupply()));
    console.log("Admin role:", await token.isAdmin(adminAddress));
    
    // For testnet, add deployer as minter and do a test mint
    if (hre.network.name.includes("goerli") || hre.network.name.includes("sepolia") || hre.network.name.includes("test")) {
        console.log("\n🧪 Testnet detected - Setting up for testing...");
        
        if (adminAddress === deployer.address) {
            // Add deployer as minter
            await token.addMinter(deployer.address);
            console.log("Added deployer as minter");
            
            // Test mint
            const mintAmount = hre.ethers.utils.parseEther("1000");
            await token.mint(deployer.address, mintAmount);
            console.log("Test mint completed:", hre.ethers.utils.formatEther(mintAmount), "AGNT");
            
            const balance = await token.balanceOf(deployer.address);
            console.log("Deployer balance:", hre.ethers.utils.formatEther(balance), "AGNT");
        }
    }
    
    // Save deployment info
    const deploymentInfo = {
        contractAddress: token.address,
        deployer: deployer.address,
        admin: adminAddress,
        network: hre.network.name,
        blockNumber: token.deployTransaction.blockNumber,
        transactionHash: token.deployTransaction.hash,
        timestamp: Math.floor(Date.now() / 1000),
        gasUsed: token.deployTransaction.gasLimit?.toString(),
        gasPrice: token.deployTransaction.gasPrice?.toString()
    };
    
    // Ensure deployments directory exists
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    // Save deployment info
    const filename = `${hre.network.name}_deployment.json`;
    const filepath = path.join(deploymentsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`\n💾 Deployment info saved to: deployments/${filename}`);
    
    // Contract verification instructions
    console.log("\n🔍 To verify the contract, run:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${token.address} "${adminAddress}"`);
    
    console.log("\n✅ Deployment completed successfully!");
    
    console.log("\n📋 Next Steps:");
    console.log("1. Verify the contract on block explorer");
    console.log("2. Add authorized minter contracts using addMinter()");
    console.log("3. Consider transferring admin role to a multisig");
    
    return {
        contractAddress: token.address,
        deployer: deployer.address,
        admin: adminAddress
    };
}

// Error handling
main()
    .then((result) => {
        console.log("\n🎉 Deployment script completed successfully!");
        console.log("Contract Address:", result.contractAddress);
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });