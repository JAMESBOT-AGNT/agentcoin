// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../contracts/AgentCoin.sol";

/**
 * @title AgentCoin Test Suite
 * @dev Testes básicos para o contrato AgentCoin
 * 
 * Para executar: forge test
 * Para executar com verbosidade: forge test -vvv
 */
contract AgentCoinTest is Test {
    AgentCoin public token;
    
    address public admin = address(0x1);
    address public minter1 = address(0x2);
    address public minter2 = address(0x3);
    address public user1 = address(0x4);
    address public user2 = address(0x5);
    
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    uint256 public constant MINT_AMOUNT = 1000 * 10**18; // 1000 tokens
    
    event TokensMinted(address indexed to, uint256 amount, address indexed minter);
    event TokensBurned(address indexed from, uint256 amount);
    event MinterAdded(address indexed minter, address indexed admin);
    event MinterRemoved(address indexed minter, address indexed admin);
    
    function setUp() public {
        // Deploy do contrato com admin
        token = new AgentCoin(admin);
        
        // Configurar minter
        vm.prank(admin);
        token.addMinter(minter1);
    }
    
    // ============ DEPLOYMENT TESTS ============
    
    function testDeployment() public {
        // Verificar metadados básicos
        assertEq(token.name(), "AgentCoin");
        assertEq(token.symbol(), "AGNT");
        assertEq(token.decimals(), 18);
        
        // Verificar supply inicial zero (zero pre-mine)
        assertEq(token.totalSupply(), 0);
        assertEq(token.totalMinted(), 0);
        
        // Verificar supply máximo
        assertEq(token.maxSupply(), MAX_SUPPLY);
        assertEq(token.remainingSupply(), MAX_SUPPLY);
        
        // Verificar roles
        assertTrue(token.isAdmin(admin));
        assertTrue(token.isMinter(minter1));
        assertFalse(token.isMinter(user1));
    }
    
    function testDeploymentWithZeroAdmin() public {
        vm.expectRevert("AgentCoin: admin cannot be zero address");
        new AgentCoin(address(0));
    }
    
    // ============ MINTING TESTS ============
    
    function testMint() public {
        vm.prank(minter1);
        vm.expectEmit(true, true, false, true);
        emit TokensMinted(user1, MINT_AMOUNT, minter1);
        
        token.mint(user1, MINT_AMOUNT);
        
        assertEq(token.balanceOf(user1), MINT_AMOUNT);
        assertEq(token.totalSupply(), MINT_AMOUNT);
        assertEq(token.totalMinted(), MINT_AMOUNT);
        assertEq(token.remainingSupply(), MAX_SUPPLY - MINT_AMOUNT);
    }
    
    function testMintOnlyMinterRole() public {
        vm.prank(user1);
        vm.expectRevert();
        token.mint(user2, MINT_AMOUNT);
    }
    
    function testMintToZeroAddress() public {
        vm.prank(minter1);
        vm.expectRevert("AgentCoin: mint to zero address");
        token.mint(address(0), MINT_AMOUNT);
    }
    
    function testMintZeroAmount() public {
        vm.prank(minter1);
        vm.expectRevert("AgentCoin: mint amount must be greater than 0");
        token.mint(user1, 0);
    }
    
    function testMintExceedMaxSupply() public {
        vm.prank(minter1);
        vm.expectRevert("AgentCoin: would exceed max supply");
        token.mint(user1, MAX_SUPPLY + 1);
    }
    
    function testBatchMint() public {
        address[] memory recipients = new address[](3);
        uint256[] memory amounts = new uint256[](3);
        
        recipients[0] = user1;
        recipients[1] = user2;
        recipients[2] = address(0x6);
        
        amounts[0] = 100 * 10**18;
        amounts[1] = 200 * 10**18;
        amounts[2] = 300 * 10**18;
        
        vm.prank(minter1);
        token.batchMint(recipients, amounts);
        
        assertEq(token.balanceOf(user1), 100 * 10**18);
        assertEq(token.balanceOf(user2), 200 * 10**18);
        assertEq(token.balanceOf(address(0x6)), 300 * 10**18);
        assertEq(token.totalSupply(), 600 * 10**18);
    }
    
    function testBatchMintArrayMismatch() public {
        address[] memory recipients = new address[](2);
        uint256[] memory amounts = new uint256[](3);
        
        vm.prank(minter1);
        vm.expectRevert("AgentCoin: arrays length mismatch");
        token.batchMint(recipients, amounts);
    }
    
    // ============ ACCESS CONTROL TESTS ============
    
    function testAddMinter() public {
        vm.prank(admin);
        vm.expectEmit(true, true, false, false);
        emit MinterAdded(minter2, admin);
        
        token.addMinter(minter2);
        assertTrue(token.isMinter(minter2));
    }
    
    function testAddMinterOnlyAdmin() public {
        vm.prank(user1);
        vm.expectRevert();
        token.addMinter(minter2);
    }
    
    function testAddMinterZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert("AgentCoin: minter cannot be zero address");
        token.addMinter(address(0));
    }
    
    function testRemoveMinter() public {
        vm.prank(admin);
        vm.expectEmit(true, true, false, false);
        emit MinterRemoved(minter1, admin);
        
        token.removeMinter(minter1);
        assertFalse(token.isMinter(minter1));
    }
    
    // ============ PAUSABLE TESTS ============
    
    function testPause() public {
        // Mint inicial
        vm.prank(minter1);
        token.mint(user1, MINT_AMOUNT);
        
        // Pausar contrato
        vm.prank(admin);
        token.pause();
        
        assertTrue(token.paused());
        
        // Transfer deve falhar
        vm.prank(user1);
        vm.expectRevert("Pausable: paused");
        token.transfer(user2, 100);
        
        // Mint deve falhar
        vm.prank(minter1);
        vm.expectRevert("Pausable: paused");
        token.mint(user2, 100);
    }
    
    function testUnpause() public {
        vm.prank(admin);
        token.pause();
        assertTrue(token.paused());
        
        vm.prank(admin);
        token.unpause();
        assertFalse(token.paused());
    }
    
    // ============ BURN TESTS ============
    
    function testBurn() public {
        // Mint tokens primeiro
        vm.prank(minter1);
        token.mint(user1, MINT_AMOUNT);
        
        uint256 burnAmount = 100 * 10**18;
        
        vm.prank(user1);
        vm.expectEmit(true, false, false, true);
        emit TokensBurned(user1, burnAmount);
        
        token.burn(burnAmount);
        
        assertEq(token.balanceOf(user1), MINT_AMOUNT - burnAmount);
        assertEq(token.totalSupply(), MINT_AMOUNT - burnAmount);
        // totalMinted não muda após burn
        assertEq(token.totalMinted(), MINT_AMOUNT);
    }
    
    function testBurnFrom() public {
        // Mint tokens
        vm.prank(minter1);
        token.mint(user1, MINT_AMOUNT);
        
        uint256 burnAmount = 100 * 10**18;
        
        // Aprovar burn
        vm.prank(user1);
        token.approve(user2, burnAmount);
        
        // Burn from
        vm.prank(user2);
        token.burnFrom(user1, burnAmount);
        
        assertEq(token.balanceOf(user1), MINT_AMOUNT - burnAmount);
        assertEq(token.totalSupply(), MINT_AMOUNT - burnAmount);
    }
    
    // ============ EDGE CASE TESTS ============
    
    function testMintUpToMaxSupply() public {
        vm.prank(minter1);
        token.mint(user1, MAX_SUPPLY);
        
        assertEq(token.totalSupply(), MAX_SUPPLY);
        assertEq(token.remainingSupply(), 0);
        
        // Próximo mint deve falhar
        vm.prank(minter1);
        vm.expectRevert("AgentCoin: would exceed max supply");
        token.mint(user2, 1);
    }
    
    function testMultipleMints() public {
        uint256 amount1 = 500_000_000 * 10**18; // 500M
        uint256 amount2 = 500_000_000 * 10**18; // 500M
        
        vm.prank(minter1);
        token.mint(user1, amount1);
        
        vm.prank(minter1);
        token.mint(user2, amount2);
        
        assertEq(token.totalSupply(), MAX_SUPPLY);
        assertEq(token.totalMinted(), MAX_SUPPLY);
    }
}