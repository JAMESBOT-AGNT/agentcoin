// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/AgentCoin.sol";

contract AgentCoinTest is Test {
    AgentCoin public token;
    address public admin = address(1);
    address public minter = address(2);
    address public user1 = address(3);
    address public user2 = address(4);

    function setUp() public {
        vm.startPrank(admin);
        token = new AgentCoin();
        token.addMinter(minter);
        vm.stopPrank();
    }

    function test_InitialState() public view {
        assertEq(token.name(), "AgentCoin");
        assertEq(token.symbol(), "AGNT");
        assertEq(token.totalSupply(), 0); // Fair launch - zero initial supply
        assertEq(token.MAX_SUPPLY(), 1_000_000_000 * 10**18);
    }

    function test_MintByMinter() public {
        vm.prank(minter);
        token.mint(user1, 1000 * 10**18, "work_completed");
        
        assertEq(token.balanceOf(user1), 1000 * 10**18);
        assertEq(token.totalMinted(), 1000 * 10**18);
    }

    function test_MintFailsForNonMinter() public {
        vm.prank(user1);
        vm.expectRevert();
        token.mint(user1, 1000 * 10**18, "unauthorized");
    }

    function test_Transfer() public {
        // Mint first
        vm.prank(minter);
        token.mint(user1, 1000 * 10**18, "work_completed");
        
        // Transfer
        vm.prank(user1);
        token.transfer(user2, 500 * 10**18);
        
        assertEq(token.balanceOf(user1), 500 * 10**18);
        assertEq(token.balanceOf(user2), 500 * 10**18);
    }

    function test_Burn() public {
        vm.prank(minter);
        token.mint(user1, 1000 * 10**18, "work_completed");
        
        vm.prank(user1);
        token.burn(300 * 10**18);
        
        assertEq(token.balanceOf(user1), 700 * 10**18);
    }

    function test_PauseUnpause() public {
        vm.prank(minter);
        token.mint(user1, 1000 * 10**18, "work_completed");
        
        // Pause
        vm.prank(admin);
        token.pause();
        
        // Transfer should fail when paused
        vm.prank(user1);
        vm.expectRevert();
        token.transfer(user2, 100 * 10**18);
        
        // Unpause
        vm.prank(admin);
        token.unpause();
        
        // Transfer should work now
        vm.prank(user1);
        token.transfer(user2, 100 * 10**18);
        assertEq(token.balanceOf(user2), 100 * 10**18);
    }

    function test_MaxSupplyLimit() public {
        // First mint almost all supply
        uint256 almostAll = token.MAX_SUPPLY() - 100;
        vm.prank(minter);
        token.mint(user1, almostAll, "first_mint");
        
        // Try to mint more than remaining
        vm.prank(minter);
        vm.expectRevert(bytes("Exceeds max supply"));
        token.mint(user1, 200, "too_much"); // Only 100 remaining, trying 200
    }

    function test_RemainingMintableSupply() public {
        vm.prank(minter);
        token.mint(user1, 1000 * 10**18, "work_completed");
        
        uint256 remaining = token.remainingMintableSupply();
        assertEq(remaining, token.MAX_SUPPLY() - 1000 * 10**18);
    }
}
