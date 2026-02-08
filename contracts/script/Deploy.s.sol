// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {OnebtcOnebtc} from "../src/OnebtcOnebtc.sol";

contract Deploy is Script {
    function run() external {
        // Base Mainnet Chainlink feeds
        address btcUsdFeed = 0x07DA0E54543a844a80ABE69c8A12F22B3aA59f9D; // cbBTC/USD
        address ethUsdFeed = 0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70; // ETH/USD

        address royaltyRecipient = msg.sender;

        vm.startBroadcast();
        new OnebtcOnebtc(btcUsdFeed, ethUsdFeed, royaltyRecipient);
        vm.stopBroadcast();
    }
}
