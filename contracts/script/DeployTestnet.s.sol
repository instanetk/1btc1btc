// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {OnebtcOnebtc} from "../src/OnebtcOnebtc.sol";

/// @dev Mock Chainlink aggregator for testnets without real feeds
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
}

contract DeployTestnet is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy mock Chainlink feeds with realistic prices (8 decimals)
        // BTC ~$100,000, ETH ~$2,500
        MockAggregator btcFeed = new MockAggregator(100_000e8, 8);
        MockAggregator ethFeed = new MockAggregator(2_500e8, 8);

        new OnebtcOnebtc(address(btcFeed), address(ethFeed), msg.sender);

        vm.stopBroadcast();
    }
}
