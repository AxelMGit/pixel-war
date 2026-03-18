// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PixelGrid {
    uint256 public constant SIZE = 50;

    mapping(address => uint256) public pendingRefunds;

    mapping(address => string) public pseudos;

    struct Pixel {
        address topLocker;
        uint256 highestAmountLocked;
        string color;
    }

    mapping(uint256 => Pixel) public grid;

    event PixelChanged(uint256 id, address author, string color, address newOwner, uint256 newAmount);
    event PixelOwned(uint256 id, address owner, uint256 amount);

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

        emit PixelChanged(id, msg.sender, _color, pixel.topLocker, pixel.highestAmountLocked);
    }

    function giveUpPixel(uint256 _x, uint256 _y) public {
        require(_x < SIZE && _y < SIZE, "Hors limites");
        uint256 id = _x + (_y * SIZE);
        Pixel storage pixel = grid[id];
        require(pixel.topLocker == msg.sender, "Vous devez etre le proprietaire du pixel pour le liberer");

        if (pixel.highestAmountLocked > 0) {
            pendingRefunds[msg.sender] += pixel.highestAmountLocked;
        }

        pixel.topLocker = address(0);
        pixel.highestAmountLocked = 0;
        pixel.color = "#FFFFFF"; 

        emit PixelChanged(id, msg.sender, pixel.color, address(0), 0);
    }

    function giveUpPixels(uint256[] calldata _xList, uint256[] calldata _yList) public {
        require(_xList.length == _yList.length, "Listes de tailles differentes");
        require(_xList.length > 0, "Liste vide");

        uint256 numberOfPixels = _xList.length;

        for (uint256 i = 0; i < numberOfPixels; i++) {
            uint256 _x = _xList[i];
            uint256 _y = _yList[i];

            require(_x < SIZE && _y < SIZE, "Hors limites");
            
            uint256 id = _x + (_y * SIZE);
            Pixel storage pixel = grid[id];
            require(pixel.topLocker == msg.sender, "Vous devez etre le proprietaire du pixel pour le liberer");

            if (pixel.highestAmountLocked > 0) {
                pendingRefunds[msg.sender] += pixel.highestAmountLocked;
            }

            pixel.topLocker = address(0);
            pixel.highestAmountLocked = 0;
            pixel.color = "#FFFFFF"; 

            emit PixelChanged(id, msg.sender, pixel.color, address(0), 0);
        }
    }

    function ownPixel(uint256 _x, uint256 _y) public payable {
        require(_x < SIZE && _y < SIZE, "Hors limites");
        uint256 id = _x + (_y * SIZE);
        Pixel storage pixel = grid[id];

        require(msg.value > pixel.highestAmountLocked, "Doit etre plus eleve que le montant actuel");

        if (pixel.highestAmountLocked > 0) {
            pendingRefunds[pixel.topLocker] += pixel.highestAmountLocked;
        }

        pixel.topLocker = msg.sender;
        pixel.highestAmountLocked = msg.value;
        pixel.color = "#F527C8";
        emit PixelOwned(id, msg.sender, msg.value);
        emit PixelChanged(id, msg.sender, pixel.color, msg.sender, msg.value);
    }

    function ownPixels(uint256[] calldata _xList, uint256[] calldata _yList) public payable {
        // 1. Ensure the arrays are the same length and not empty
        require(_xList.length == _yList.length, "Listes de tailles differentes");
        require(_xList.length > 0, "Liste vide");

        uint256 numberOfPixels = _xList.length;
        
        // 2. Divide the total ETH sent by the number of pixels
        uint256 amountPerPixel = msg.value / numberOfPixels;

        // 3. Loop through each pixel in the list
        for (uint256 i = 0; i < numberOfPixels; i++) {
            uint256 _x = _xList[i];
            uint256 _y = _yList[i];

            require(_x < SIZE && _y < SIZE, "Hors limites");
            
            uint256 id = _x + (_y * SIZE);
            Pixel storage pixel = grid[id];

            // Ensure the divided amount is higher than the current locked amount for THIS specific pixel
            require(amountPerPixel > pixel.highestAmountLocked, "Montant insuffisant pour un des pixels");

            // Refund the previous owner
            if (pixel.highestAmountLocked > 0) {
                pendingRefunds[pixel.topLocker] += pixel.highestAmountLocked;
            }

            // Assign to the new owner
            pixel.topLocker = msg.sender;
            pixel.highestAmountLocked = amountPerPixel;
            pixel.color = "#F527C8";
            emit PixelChanged(id, msg.sender, pixel.color, msg.sender, amountPerPixel);
        }
    }

    function getFullGrid() public view returns (Pixel[] memory) {
        Pixel[] memory allPixels = new Pixel[](SIZE * SIZE);
        for (uint256 i = 0; i < SIZE * SIZE; i++) {
            allPixels[i] = grid[i];
        }
        return allPixels;
    }

    function claimRefund() public {
        uint256 refundAmount = pendingRefunds[msg.sender];
        require(refundAmount > 0, "You have no funds to refund");

        pendingRefunds[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: refundAmount}("");
        require(success, "ETH transfer failed");
    }

    function setPseudo(string memory _pseudo) public {
        pseudos[msg.sender] = _pseudo;
    }

    function getPseudo(address _user) public view returns (string memory) {
        return pseudos[_user];
    }

    function getGrid() public view returns (address[SIZE*SIZE] memory, uint256[SIZE*SIZE] memory, string[SIZE*SIZE] memory) {
        address[SIZE*SIZE] memory topLockers;
        uint256[SIZE*SIZE] memory highestAmountsLocked;
        string[SIZE*SIZE] memory colors;

        for (uint id = 0; id < SIZE*SIZE; id++) {
            Pixel storage pixel = grid[id];
            topLockers[id] = pixel.topLocker;
            highestAmountsLocked[id] = pixel.highestAmountLocked;
            colors[id] = pixel.color;
        }

        return (topLockers, highestAmountsLocked, colors);
    }
}