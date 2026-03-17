// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PixelGrid {
    uint256 public constant SIZE = 50;

    // Track ETH owed to people who were outbid
    mapping(address => uint256) public pendingRefunds;

    struct Pixel {
        address topLocker;
        uint256 highestAmountLocked;
        string color;
    }

    mapping(uint256 => Pixel) public grid;

    event PixelChanged(uint256 id, address author, string color);

    function getPixel(uint256 _x, uint256 _y) public view returns (Pixel memory) {
        require(_x < SIZE && _y < SIZE, "Hors limites");
        uint256 id = _x + (_y * SIZE);
        return grid[id];
    }

    function setPixel(uint256 _x, uint256 _y, string memory _color) public {
        require(_x < SIZE && _y < SIZE, "Hors limites");
        uint256 id = _x + (_y * SIZE);
        Pixel storage pixel = grid[id];
        require(pixel.topLocker == msg.sender, "Vous devez etre le proprietaire du pixel pour le modifier");
        pixel.color = _color;

        emit PixelChanged(id, msg.sender, _color);
    }

    function ownPixel(uint256 _x, uint256 _y) public payable {
        require(_x < SIZE && _y < SIZE, "Hors limites");
        uint256 id = _x + (_y * SIZE);
        Pixel storage pixel = grid[id];

        // Si le pixel est déjà possédé, le nouveau montant doit être plus élevé
        require(msg.value > pixel.highestAmountLocked, "Doit etre plus eleve que le montant actuel");

        // Si quelqu'un était déjà le propriétaire, ajouter son montant à ses remboursements
        if (pixel.highestAmountLocked > 0) {
            pendingRefunds[pixel.topLocker] += pixel.highestAmountLocked;
        }

        // Mettre à jour le pixel avec le nouveau propriétaire et montant
        pixel.topLocker = msg.sender;
        pixel.highestAmountLocked = msg.value;
        emit PixelChanged(id, msg.sender, pixel.color); 
    }

    function getFullGrid() public view returns (Pixel[] memory) {
        Pixel[] memory allPixels = new Pixel[](SIZE * SIZE);
        for (uint256 i = 0; i < SIZE * SIZE; i++) {
            allPixels[i] = grid[i];
        }
        return allPixels;
    }

    // 2. Function for outbid users to get their ETH back (The "Pull" pattern)
    function claimRefund() public {
        uint256 refundAmount = pendingRefunds[msg.sender];
        require(refundAmount > 0, "You have no funds to refund");

        // ALWAYS zero out the balance BEFORE sending the ETH (prevents reentrancy)
        pendingRefunds[msg.sender] = 0;

        // Send the ETH
        (bool success, ) = msg.sender.call{value: refundAmount}("");
        require(success, "ETH transfer failed");
    }
}