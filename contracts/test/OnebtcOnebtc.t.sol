// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {OnebtcOnebtc} from "../src/OnebtcOnebtc.sol";

// Mock Chainlink aggregator
contract MockAggregator {
    int256 public price;
    uint8 public decimals_;

    constructor(int256 _price, uint8 _decimals) {
        price = _price;
        decimals_ = _decimals;
    }

    function latestRoundData()
        external
        view
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (1, price, block.timestamp, block.timestamp, 1);
    }

    function decimals() external view returns (uint8) {
        return decimals_;
    }

    function setPrice(int256 _price) external {
        price = _price;
    }
}

contract OnebtcOnebtcTest is Test {
    OnebtcOnebtc public nft;
    MockAggregator public btcFeed;
    MockAggregator public ethFeed;

    address public owner = address(1);
    address public minter = address(2);
    address public voter = address(3);

    function setUp() public {
        // BTC/USD = $100,000 (8 decimals)
        btcFeed = new MockAggregator(100_000 * 1e8, 8);
        // ETH/USD = $3,000 (8 decimals)
        ethFeed = new MockAggregator(3_000 * 1e8, 8);

        vm.prank(owner);
        nft = new OnebtcOnebtc(address(btcFeed), address(ethFeed), owner);

        vm.deal(minter, 10 ether);
        vm.deal(voter, 10 ether);
    }

    function test_getMintPriceInEth() public view {
        uint256 price = nft.getMintPriceInEth();
        // 10000 sats = 10000/1e8 BTC = 0.0001 BTC
        // 0.0001 BTC * $100,000 = $10.00
        // $10.00 / $3,000 = 0.00333... ETH
        // = 3333333333333333 wei (approx)
        assertApproxEqRel(price, 3333333333333333, 0.01e18); // 1% tolerance
    }

    function test_mint() public {
        uint256 price = nft.getMintPriceInEth();
        string memory analogy = "A river does not ask how many buckets it equals.";

        vm.prank(minter);
        nft.mint{value: price}(analogy);

        assertEq(nft.totalSupply(), 1);
        assertEq(nft.ownerOf(0), minter);
        assertEq(keccak256(bytes(nft.analogies(0))), keccak256(bytes(analogy)));
    }

    function test_mint_refundsExcess() public {
        uint256 price = nft.getMintPriceInEth();
        uint256 overpay = price * 2;
        uint256 balanceBefore = minter.balance;

        vm.prank(minter);
        nft.mint{value: overpay}("Test analogy.");

        // Should have been refunded the excess
        uint256 spent = balanceBefore - minter.balance;
        assertApproxEqRel(spent, price, 0.01e18);
    }

    function test_mint_failsWithInsufficientPayment() public {
        uint256 price = nft.getMintPriceInEth();

        vm.prank(minter);
        vm.expectRevert("Insufficient payment");
        nft.mint{value: price / 2}("Test analogy.");
    }

    function test_mint_failsWithEmptyAnalogy() public {
        uint256 price = nft.getMintPriceInEth();

        vm.prank(minter);
        vm.expectRevert("Empty analogy");
        nft.mint{value: price}("");
    }

    function test_upvote() public {
        uint256 price = nft.getMintPriceInEth();

        vm.prank(minter);
        nft.mint{value: price}("Test analogy.");

        vm.prank(voter);
        nft.upvote(0);

        assertEq(nft.upvotes(0), 1);
        assertTrue(nft.hasVoted(0, voter));
    }

    function test_upvote_failsDoubleVote() public {
        uint256 price = nft.getMintPriceInEth();

        vm.prank(minter);
        nft.mint{value: price}("Test analogy.");

        vm.prank(voter);
        nft.upvote(0);

        vm.prank(voter);
        vm.expectRevert("Already voted");
        nft.upvote(0);
    }

    function test_upvote_failsNonExistentToken() public {
        vm.prank(voter);
        vm.expectRevert("Token does not exist");
        nft.upvote(99);
    }

    function test_tokenURI() public {
        uint256 price = nft.getMintPriceInEth();

        vm.prank(minter);
        nft.mint{value: price}("One bitcoin is one bitcoin.");

        string memory uri = nft.tokenURI(0);
        // Should start with data:application/json;base64,
        assertTrue(bytes(uri).length > 0);
        // Check it starts with the data URI prefix
        bytes memory prefix = bytes("data:application/json;base64,");
        for (uint i = 0; i < prefix.length; i++) {
            assertEq(bytes(uri)[i], prefix[i]);
        }
    }

    function test_withdraw() public {
        uint256 price = nft.getMintPriceInEth();

        vm.prank(minter);
        nft.mint{value: price}("Test analogy.");

        uint256 contractBalance = address(nft).balance;
        uint256 ownerBalanceBefore = owner.balance;

        vm.prank(owner);
        nft.withdraw();

        assertEq(address(nft).balance, 0);
        assertEq(owner.balance, ownerBalanceBefore + contractBalance);
    }

    function test_withdraw_failsNonOwner() public {
        uint256 price = nft.getMintPriceInEth();

        vm.prank(minter);
        nft.mint{value: price}("Test analogy.");

        vm.prank(minter);
        vm.expectRevert();
        nft.withdraw();
    }

    function test_royaltyInfo() public {
        uint256 price = nft.getMintPriceInEth();

        vm.prank(minter);
        nft.mint{value: price}("Test analogy.");

        (address receiver, uint256 royaltyAmount) = nft.royaltyInfo(0, 1 ether);
        assertEq(receiver, owner);
        assertEq(royaltyAmount, 0.25 ether); // 25%
    }

    function test_maxSupply() public view {
        assertEq(nft.MAX_SUPPLY(), 10000);
    }

    function test_mint_failsAtMaxSupply() public {
        // totalSupply is at storage slot 9 (after inherited ERC721/ERC2981/Ownable storage)
        // Use vm.store to set totalSupply to MAX_SUPPLY
        vm.store(address(nft), bytes32(uint256(9)), bytes32(uint256(10000)));
        assertEq(nft.totalSupply(), 10000);

        uint256 price = nft.getMintPriceInEth();
        vm.prank(minter);
        vm.expectRevert("Max supply reached");
        nft.mint{value: price}("Should fail.");
    }

    function test_multipleMints() public {
        uint256 price = nft.getMintPriceInEth();

        vm.startPrank(minter);
        nft.mint{value: price}("First thought.");
        nft.mint{value: price}("Second thought.");
        nft.mint{value: price}("Third thought.");
        vm.stopPrank();

        assertEq(nft.totalSupply(), 3);
        assertEq(nft.ownerOf(0), minter);
        assertEq(nft.ownerOf(1), minter);
        assertEq(nft.ownerOf(2), minter);
    }

    function test_tokenURI_shortText() public {
        uint256 price = nft.getMintPriceInEth();
        vm.prank(minter);
        nft.mint{value: price}("X");

        string memory uri = nft.tokenURI(0);
        bytes memory prefix = bytes("data:application/json;base64,");
        for (uint i = 0; i < prefix.length; i++) {
            assertEq(bytes(uri)[i], prefix[i]);
        }
    }

    function test_tokenURI_longText() public {
        uint256 price = nft.getMintPriceInEth();

        // Build 999-char string with spaces every 10 chars
        bytes memory text = new bytes(999);
        for (uint256 i = 0; i < 999; i++) {
            if (i > 0 && i % 10 == 0) {
                text[i] = " ";
            } else {
                text[i] = "a";
            }
        }

        vm.prank(minter);
        nft.mint{value: price}(string(text));

        string memory uri = nft.tokenURI(0);
        bytes memory prefix = bytes("data:application/json;base64,");
        for (uint i = 0; i < prefix.length; i++) {
            assertEq(bytes(uri)[i], prefix[i]);
        }
    }

    function test_tokenURI_noSpaces() public {
        uint256 price = nft.getMintPriceInEth();

        // Build 100-char string with no spaces (forces line breaks)
        bytes memory text = new bytes(100);
        for (uint256 i = 0; i < 100; i++) {
            text[i] = "x";
        }

        vm.prank(minter);
        nft.mint{value: price}(string(text));

        string memory uri = nft.tokenURI(0);
        bytes memory prefix = bytes("data:application/json;base64,");
        for (uint i = 0; i < prefix.length; i++) {
            assertEq(bytes(uri)[i], prefix[i]);
        }
    }

    function test_tokenURI_xmlEntities() public {
        uint256 price = nft.getMintPriceInEth();

        vm.prank(minter);
        nft.mint{value: price}('Testing & escaping < > " characters.');

        string memory uri = nft.tokenURI(0);
        bytes memory prefix = bytes("data:application/json;base64,");
        for (uint i = 0; i < prefix.length; i++) {
            assertEq(bytes(uri)[i], prefix[i]);
        }
    }
}
