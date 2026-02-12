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

    AggregatorV3Interface public immutable BTC_USD_FEED;
    AggregatorV3Interface public immutable ETH_USD_FEED;

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
    ) ERC721("1BTC1BTC", "ONEBTC") Ownable(msg.sender) {
        BTC_USD_FEED = AggregatorV3Interface(_btcUsdFeed);
        ETH_USD_FEED = AggregatorV3Interface(_ethUsdFeed);
        _setDefaultRoyalty(_royaltyRecipient, 2500); // 25%
    }

    /// @notice Returns the current mint price in wei (ETH equivalent of 1000 SATS)
    function getMintPriceInEth() public view returns (uint256) {
        (, int256 btcUsdPrice,,,) = BTC_USD_FEED.latestRoundData();
        (, int256 ethUsdPrice,,,) = ETH_USD_FEED.latestRoundData();

        require(btcUsdPrice > 0 && ethUsdPrice > 0, "Invalid oracle price");

        uint8 btcDecimals = BTC_USD_FEED.decimals();
        uint8 ethDecimals = ETH_USD_FEED.decimals();

        // 1000 sats = 1000 / 1e8 BTC
        // Value in USD = (1000 / 1e8) * btcUsdPrice / 10^btcDecimals
        // Value in ETH = valueInUSD / (ethUsdPrice / 10^ethDecimals)
        // Value in wei = valueInETH * 1e18

        // Combined: (1000 * btcUsdPrice * 10^ethDecimals * 1e18) / (1e8 * ethUsdPrice * 10^btcDecimals)
        // forge-lint: disable-next-line(unsafe-typecast)
        uint256 numerator = uint256(MINT_COST_SATS) * uint256(btcUsdPrice) * (10 ** ethDecimals) * 1e18;
        // forge-lint: disable-next-line(unsafe-typecast)
        uint256 denominator = 1e8 * uint256(ethUsdPrice) * (10 ** btcDecimals);

        return numerator / denominator;
    }

    /// @notice Mint an analogy as an NFT
    function mint(string calldata analogy) external payable {
        require(bytes(analogy).length > 0, "Empty analogy");
        require(bytes(analogy).length <= 1000, "Analogy too long");

        uint256 price = getMintPriceInEth();
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

        // 1BTC1BTC logo — top center brand mark
        string memory logo =
            '<svg x="325" y="110" width="150" height="73" viewBox="170 330 685 332">'
            '<path fill="#F7931A" d="M345.78,341.34C403.53,345.22 449.71,371.24 488.27,412.47C491.56,415.99 494.94,419.51 497.69,423.44C498.7,424.89 498.92,428.25 497.93,429.51C492.82,436.02 487.2,442.12 481.3,448.89C478.17,445.23 475.5,442.09 472.81,438.98C450.89,413.65 426.12,392.07 395.14,378.19C337.63,352.43 271.07,365.41 228.67,411.45C207.86,434.06 197.94,461.4 195.99,491.78C193.71,527.12 202.16,559.64 225.19,586.84C254.63,621.63 293.33,635.99 338.35,632.36C377.47,629.21 411.57,612.39 443.51,590.63C473.8,570 500.53,545.18 526.71,519.71C530.54,515.99 534.37,512.28 538.23,508.6C544.33,502.78 545.87,502.62 551.87,508.36C562.82,518.85 573.57,529.54 584.41,540.13C605.42,560.63 626.74,580.77 651.79,596.41C657.55,600.01 663.68,603.01 669.57,606.68C642.24,607.1 616.19,600.4 590.58,591.23C590.38,591.73 590.18,592.24 589.98,592.74C592.45,594.53 594.86,596.41 597.4,598.1C624.97,616.47 654.65,629.36 687.98,632.48C744.75,637.79 810.47,608.12 826.85,534.44C835.75,494.39 830.77,456.27 806.01,422.59C781.57,389.35 748.25,370.34 707.09,366.09C662.26,361.46 624.06,377.32 590.1,405.38C563.05,427.73 541.43,455.01 519.95,482.47C501.79,505.68 483.76,529.05 464.35,551.2C445.7,572.49 422.76,588.62 395.96,598.53C381.04,604.05 365.61,607.38 348.57,607.46C350.24,606.27 351.14,605.46 352.18,604.92C383.71,588.53 410.33,565.91 432.7,538.66C459.23,506.36 484.39,472.94 510.44,440.24C531.33,414.03 554.85,390.5 583.45,372.62C632.28,342.1 684.71,331.96 740.38,348.7C783.25,361.59 816.8,387.56 837.37,428.17C853.21,459.44 857.52,492.76 852.52,527.34C847.85,559.61 835.01,588.13 811.98,611.38C784.34,639.29 750.4,653.96 711.33,656.86C659.3,660.73 614.5,642.23 574.23,611.21C559.5,599.86 546.22,586.63 532.46,574.06C527.45,569.48 527.67,568.84 532.14,563.44C534.68,560.36 537.23,557.29 540.31,553.56C538.55,551.64 536.82,549.5 534.83,547.65C531.45,544.52 528.6,544.75 525.05,548.22C507.9,564.97 491.08,582.14 472.97,597.81C448,619.43 420.15,636.74 388.6,647.39C353.44,659.25 317.73,661.8 281.98,650.9C222.33,632.72 185.83,592.52 174.6,531.34C166.23,485.71 174.63,442.54 203.32,405.04C230.07,370.1 266.22,350.09 309.46,343.25C321.22,341.39 333.35,341.89 345.78,341.34z"/>'
            '<path fill="#F7931A" fill-rule="evenodd" d="M364.76,502.21C386.06,515.04 387.91,552.75 365.73,569.99C356.26,577.35 345.5,580.81 333.8,581.35C328.9,581.57 327.65,583.28 327.89,587.89C328.26,595.01 327.99,602.17 327.99,609.74C320.43,609.74 313.21,609.74 305.37,609.74C305.37,600.89 305.37,591.99 305.37,583.49C304.51,582.93 304.25,582.62 303.99,582.62C290.95,582.68 293.39,580.56 293.13,593.1C293.01,598.56 293.11,604.02 293.11,609.83C285.71,609.83 278.79,609.83 271.03,609.83C271.03,605.01 271.04,600.09 271.02,595.17C271,591.5 271.21,587.81 270.75,584.19C270.6,582.98 268.66,581.03 267.58,581.06C255.38,581.44 243.18,582.13 230.55,582.77C230.55,573.71 230.55,565.63 230.55,557.14C235.8,556.75 241.21,556.3 246.63,555.97C249.42,555.8 250.75,554.73 250.74,551.66C250.66,516.17 250.68,480.69 250.65,445.2C250.65,444.72 250.46,444.24 250.23,443.12C243.79,442.76 237.21,442.39 230.25,442.01C230.25,433.87 230.25,425.8 230.25,416.93C236.21,416.93 242.14,416.95 248.06,416.92C254.06,416.88 260.06,416.6 266.05,416.79C269.62,416.9 270.66,415.53 270.59,412.14C270.42,404.17 270.54,396.19 270.54,387.3C277.17,387.3 283.42,387.14 289.64,387.48C290.46,387.53 291.73,390.1 291.77,391.53C291.98,399.32 291.87,407.11 291.87,415.08C296.23,415.08 299.95,415.08 304.25,415.08C304.25,405.78 304.25,396.86 304.25,387.21C311.23,387.21 317.65,387.07 324.05,387.4C324.86,387.44 326.12,390.03 326.16,391.46C326.36,399.44 326.25,407.42 326.25,415.8C330.34,416.56 334.41,417.13 338.38,418.09C368.88,425.43 377.65,451.43 369.64,474.67C367.14,481.9 361.98,487.04 355.68,491.12C353.61,492.46 351.45,493.67 349.2,495.01C354.45,497.42 359.45,499.72 364.76,502.21M341.71,522.95C337.66,517.79 332.14,515.01 325.83,514.53C316.55,513.82 307.23,513.77 297.92,513.52C293.66,513.41 289.4,513.5 285.18,513.5C285.18,528.09 285.18,541.65 285.18,555.45C286.57,555.58 287.53,555.78 288.49,555.74C300.79,555.31 313.14,555.4 325.37,554.24C341.63,552.68 349.11,538.42 341.71,522.95M284.62,468.5C284.62,474.24 284.62,479.98 284.62,486.05C294.12,486.05 302.58,486.15 311.03,486C313.67,485.95 316.3,485.32 318.91,484.84C330.04,482.79 336.72,475.49 337.11,464.98C337.49,454.9 331.33,446.29 320.32,444.64C308.78,442.91 296.96,443.12 284.62,442.45C284.62,451.62 284.62,459.56 284.62,468.5z"/>'
            '<path fill="#F7931A" fill-rule="evenodd" d="M697.95,580.63C684.16,580.61 670.85,580.61 657.21,580.61C657.21,572.3 657.21,564.44 657.21,556.47C663.84,556.1 670.25,555.74 677.19,555.34C677.19,517.22 677.19,479.63 677.19,441.17C670.86,441.17 664.17,441.17 657.25,441.17C657.25,432.55 657.25,424.77 657.25,416.25C671.78,416.25 686.32,416.25 701.44,416.25C701.44,406.32 701.44,397.1 701.44,387.55C708.58,387.55 715.15,387.55 722.41,387.55C722.41,396.48 722.41,405.4 722.41,414.72C726.79,414.72 730.51,414.72 734.89,414.72C734.89,405.91 734.89,396.99 734.89,387.58C742.22,387.58 748.95,387.58 756.48,387.58C756.48,396.91 756.48,406.45 756.48,415.92C776.78,419.59 793.41,427.43 797.85,448.87C802.05,469.08 794.87,484.88 774.94,494.84C800.85,502.04 812.16,518.34 807.6,544.21C803.88,565.32 788.85,575.91 756.96,580.66C756.96,589.58 756.96,598.63 756.96,608C749.29,608 742.37,608 734.82,608C734.82,599 734.82,590.1 734.82,580.94C730.61,580.94 727.01,580.94 722.76,580.94C722.76,589.88 722.76,598.78 722.76,608.04C715.23,608.04 708.33,608.04 700.29,608.04C700.29,600.29 700.39,592.67 700.21,585.06C700.17,583.58 699.06,582.13 697.95,580.63M717.72,554.8C730.01,554.24 742.36,554.29 754.56,552.91C764.85,551.75 771.4,543.55 771.72,533.82C772.06,523.13 766.74,515.29 755.51,513.95C741.09,512.24 726.45,512.44 711.23,511.79C711.23,525.12 711.44,537.24 711.12,549.35C710.99,553.89 712.5,555.46 717.72,554.8M748.88,444.45C740.82,443.73 732.76,442.62 724.68,442.38C711.32,441.98 711.31,442.21 711.29,455.75C711.27,465.35 711.29,474.94 711.29,485.94C723.63,484.97 735.6,484.88 747.24,482.88C757.77,481.07 762.72,474.48 763.34,465.29C764.03,455.08 760.16,449.28 748.88,444.45z"/>'
            '</svg>';

        // Build SVG in parts to stay within stack limits
        string memory svgStart = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">'
                '<rect width="800" height="800" fill="#0A0A0A"/>'
                '<rect x="16" y="16" width="768" height="768" rx="8" fill="none" stroke="#FFF" stroke-opacity="0.06"/>'
                '<circle cx="400" cy="420" r="200" fill="#F7931A" opacity="0.02"/>'
                '<circle cx="400" cy="420" r="350" fill="#F7931A" opacity="0.01"/>',
                _buildOrbitals(tokenId),
                logo,
                '<text x="400" y="200" text-anchor="middle" fill="#F7931A" opacity="0.5" '
                'font-family="sans-serif" font-size="14" textLength="150" lengthAdjust="spacing">'
                "1 BTC = 1 BTC"
                "</text>"
                '<foreignObject x="80" y="190" width="640" height="510">'
                '<div xmlns="http://www.w3.org/1999/xhtml" '
                'style="display:flex;align-items:center;justify-content:center;height:100%">'
                '<p style="color:#F5F0E8;font-family:Georgia,serif;font-size:22px;'
                'text-align:center;line-height:1.6;margin:0;">',
                analogy,
                "</p></div></foreignObject>"
            )
        );

        string memory svgEnd = string(
            abi.encodePacked(
                '<text x="80" y="756" fill="#555" '
                'font-family="sans-serif" font-size="12">#',
                tokenIdStr,
                "</text>"
                '<text x="720" y="756" text-anchor="end" fill="#555" '
                'font-family="sans-serif" font-size="12">1BTC1BTC.money</text></svg>'
            )
        );

        string memory svg = string(abi.encodePacked(svgStart, svgEnd));

        string memory json = string(
            abi.encodePacked(
                '{"name":"1BTC1BTC #',
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

    /// @dev Builds 4 randomized orbital ellipses with dots, unique per tokenId
    function _buildOrbitals(uint256 tokenId) private pure returns (string memory) {
        uint256 h = uint256(keccak256(abi.encodePacked(tokenId)));
        return string(
            abi.encodePacked(
                _buildOrbital(h, 0, 320, 200),
                _buildOrbital(h, 1, 260, 150),
                _buildOrbital(h, 2, 380, 220),
                _buildOrbital(h, 3, 200, 110)
            )
        );
    }

    /// @dev Builds a single orbital ellipse + dot with randomized rotation and dot position
    function _buildOrbital(uint256 h, uint256 idx, uint256 rx, uint256 ry) private pure returns (string memory) {
        uint256 bits = (h >> (idx * 32)) & 0xFFFFFFFF;
        uint256 rot = bits % 360;
        uint256 pos = (bits >> 9) % 8;

        // Dot at one of 8 positions on the ellipse (cos/sin * 707/1000 ≈ 0.707 for 45° increments)
        uint256 dotX;
        uint256 dotY;
        if (pos == 0) { dotX = 400 + rx; dotY = 400; }
        else if (pos == 1) { dotX = 400 + (rx * 707) / 1000; dotY = 400 + (ry * 707) / 1000; }
        else if (pos == 2) { dotX = 400; dotY = 400 + ry; }
        else if (pos == 3) { dotX = 400 - (rx * 707) / 1000; dotY = 400 + (ry * 707) / 1000; }
        else if (pos == 4) { dotX = 400 - rx; dotY = 400; }
        else if (pos == 5) { dotX = 400 - (rx * 707) / 1000; dotY = 400 - (ry * 707) / 1000; }
        else if (pos == 6) { dotX = 400; dotY = 400 - ry; }
        else { dotX = 400 + (rx * 707) / 1000; dotY = 400 - (ry * 707) / 1000; }

        string memory ellipseSvg = string(
            abi.encodePacked(
                '<g transform="rotate(',
                rot.toString(),
                ' 400 400)"><ellipse cx="400" cy="400" rx="',
                rx.toString(),
                '" ry="',
                ry.toString(),
                '" fill="none" stroke="#F7931A" stroke-width="1" opacity="0.15"/>'
            )
        );

        return string(
            abi.encodePacked(
                ellipseSvg,
                '<circle cx="',
                dotX.toString(),
                '" cy="',
                dotY.toString(),
                '" r="4" fill="#F7931A" opacity="0.4"/></g>'
            )
        );
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
