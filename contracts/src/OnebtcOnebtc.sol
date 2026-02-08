// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);

    function decimals() external view returns (uint8);
}

contract OnebtcOnebtc is ERC721, ERC2981, Ownable {
    using Strings for uint256;
    using Strings for address;

    uint256 public constant MINT_COST_SATS = 1000;
    uint256 public constant TOLERANCE_BPS = 100; // 1% tolerance

    AggregatorV3Interface public immutable btcUsdFeed;
    AggregatorV3Interface public immutable ethUsdFeed;

    uint256 public totalSupply;

    mapping(uint256 => string) public analogies;
    mapping(uint256 => uint256) public upvotes;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event AnalogyMinted(uint256 indexed tokenId, address indexed minter, string analogy);
    event Upvoted(uint256 indexed tokenId, address indexed voter);

    constructor(
        address _btcUsdFeed,
        address _ethUsdFeed,
        address _royaltyRecipient
    ) ERC721("1BTC=1BTC", "ONEBTC") Ownable(msg.sender) {
        btcUsdFeed = AggregatorV3Interface(_btcUsdFeed);
        ethUsdFeed = AggregatorV3Interface(_ethUsdFeed);
        _setDefaultRoyalty(_royaltyRecipient, 2500); // 25%
    }

    /// @notice Returns the current mint price in wei (ETH equivalent of 1000 SATS)
    function getMintPriceInETH() public view returns (uint256) {
        (, int256 btcUsdPrice,,,) = btcUsdFeed.latestRoundData();
        (, int256 ethUsdPrice,,,) = ethUsdFeed.latestRoundData();

        require(btcUsdPrice > 0 && ethUsdPrice > 0, "Invalid oracle price");

        uint8 btcDecimals = btcUsdFeed.decimals();
        uint8 ethDecimals = ethUsdFeed.decimals();

        // 1000 sats = 1000 / 1e8 BTC
        // Value in USD = (1000 / 1e8) * btcUsdPrice / 10^btcDecimals
        // Value in ETH = valueInUSD / (ethUsdPrice / 10^ethDecimals)
        // Value in wei = valueInETH * 1e18

        // Combined: (1000 * btcUsdPrice * 10^ethDecimals * 1e18) / (1e8 * ethUsdPrice * 10^btcDecimals)
        uint256 numerator = uint256(MINT_COST_SATS) * uint256(btcUsdPrice) * (10 ** ethDecimals) * 1e18;
        uint256 denominator = 1e8 * uint256(ethUsdPrice) * (10 ** btcDecimals);

        return numerator / denominator;
    }

    /// @notice Mint an analogy as an NFT
    function mint(string calldata analogy) external payable {
        require(bytes(analogy).length > 0, "Empty analogy");
        require(bytes(analogy).length <= 1000, "Analogy too long");

        uint256 price = getMintPriceInETH();
        uint256 minPrice = (price * (10000 - TOLERANCE_BPS)) / 10000;
        require(msg.value >= minPrice, "Insufficient payment");

        uint256 tokenId = totalSupply;
        totalSupply++;

        analogies[tokenId] = analogy;
        _safeMint(msg.sender, tokenId);

        emit AnalogyMinted(tokenId, msg.sender, analogy);

        // Refund excess
        if (msg.value > price) {
            uint256 refund = msg.value - price;
            (bool success,) = msg.sender.call{value: refund}("");
            require(success, "Refund failed");
        }
    }

    /// @notice Upvote a minted analogy (one vote per wallet per token)
    function upvote(uint256 tokenId) external {
        require(tokenId < totalSupply, "Token does not exist");
        require(!hasVoted[tokenId][msg.sender], "Already voted");

        hasVoted[tokenId][msg.sender] = true;
        upvotes[tokenId]++;

        emit Upvoted(tokenId, msg.sender);
    }

    /// @notice Returns the analogy text for a token
    function getAnalogy(uint256 tokenId) external view returns (string memory) {
        require(tokenId < totalSupply, "Token does not exist");
        return analogies[tokenId];
    }

    /// @notice Returns the upvote count for a token
    function getUpvotes(uint256 tokenId) external view returns (uint256) {
        require(tokenId < totalSupply, "Token does not exist");
        return upvotes[tokenId];
    }

    /// @notice Returns fully onchain metadata with embedded SVG
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId < totalSupply, "Token does not exist");

        string memory analogy = analogies[tokenId];
        string memory tokenIdStr = tokenId.toString();

        string memory svg = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">'
                '<rect width="800" height="800" fill="#0A0A0A"/>'
                '<text x="400" y="80" text-anchor="middle" fill="#F7931A" '
                'font-family="sans-serif" font-size="18" letter-spacing="4">'
                "1 BTC = 1 BTC"
                "</text>"
                '<foreignObject x="80" y="200" width="640" height="500">'
                '<p xmlns="http://www.w3.org/1999/xhtml" '
                'style="color:#F5F0E8;font-family:Georgia,serif;font-size:22px;'
                'text-align:center;line-height:1.6;">',
                analogy,
                "</p></foreignObject>"
                '<text x="400" y="740" text-anchor="middle" fill="#333" '
                'font-family="sans-serif" font-size="12">#',
                tokenIdStr,
                unicode" \u00b7 1BTC1BTC.money</text></svg>"
            )
        );

        string memory json = string(
            abi.encodePacked(
                '{"name":"1BTC=1BTC #',
                tokenIdStr,
                '","description":"',
                analogy,
                '","image":"data:image/svg+xml;base64,',
                Base64.encode(bytes(svg)),
                '"}'
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    /// @notice Withdraw accumulated ETH (owner only)
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        (bool success,) = owner().call{value: balance}("");
        require(success, "Withdraw failed");
    }

    /// @dev Required override for ERC721 + ERC2981
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
