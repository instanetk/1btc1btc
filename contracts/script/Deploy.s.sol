// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {OnebtcOnebtc} from "../src/OnebtcOnebtc.sol";

contract Deploy is Script {
    function run() external {
        // Chainlink feeds — set via environment or use defaults
        // Base Mainnet: BTC=0x07DA0E54543a844a80ABE69c8A12F22B3aA59f9D, ETH=0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70
        // Base Sepolia: BTC=0x0FB99723Aee6f420beAD13e6bBB79cE7Fb6755f4, ETH=0x4aDC67d868Fc17Ed75a8882aAC4fCDA5046D15ca
        address btcUsdFeed = vm.envOr("BTC_USD_FEED", address(0x07DA0E54543a844a80ABE69c8A12F22B3aA59f9D));
        address ethUsdFeed = vm.envOr("ETH_USD_FEED", address(0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70));

        address royaltyRecipient = msg.sender;

        vm.startBroadcast();
        new OnebtcOnebtc(btcUsdFeed, ethUsdFeed, royaltyRecipient);
        vm.stopBroadcast();
    }
}
