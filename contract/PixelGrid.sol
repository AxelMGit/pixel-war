// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Notice the @4.9.3 added to the paths below!
import "@openzeppelin/contracts@4.9.3/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts@4.9.3/utils/Strings.sol";

contract PixelGrid is ERC721 {
    uint256 public constant SIZE = 50;

    address public adminAccount = 0xda1eb582986d35966e879970a7eBd1172260f29E;

    uint256 public pendingAdminRefunds;

    mapping(address => uint256) public pendingRefunds;
    mapping(address => string) public pseudos;

    // --- NFT Variables ---
    uint256 private _nextTokenId;
    mapping(uint256 => uint256) public snapshotBlocks; // Maps Token ID to the block it was minted

    struct Pixel {
        address topLocker;
        uint256 highestAmountLocked;
        string color;
    }

    // Initialize the ERC721 collection
    constructor() ERC721("PixelGrid Snapshots", "PIXSNAP") {}

    mapping(uint256 => Pixel) public grid;

    event PixelChanged(uint256 indexed id, address indexed author, string color, address indexed newOwner, uint256 newAmount);
    event PixelOwned(uint256 indexed id, address indexed owner, uint256 amount);
    event SnapshotMinted(uint256 indexed tokenId, address indexed minter, uint256 blockNumber);

    uint256 public constant COMMISSION_PERCENTAGE = 5;

    error OutOfBounds();
    error NotOwner();
    error Unauthorized();
    error InsufficientAmount();
    error ArrayLengthMismatch();
    error EmptyArray();
    error NothingToRefund();
    error TransferFailed();
    error IncorrectMintPrice();

    // ==========================================
    // Internal Helpers
    // ==========================================

    function _getIdAndVerify(uint256 _x, uint256 _y) internal pure returns (uint256) {
        if (_x >= SIZE || _y >= SIZE) revert OutOfBounds();
        return _x + (_y * SIZE);
    }

    function _giveUp(uint256 id) internal {
        Pixel storage pixel = grid[id];
        if (pixel.topLocker != msg.sender) revert NotOwner();

        if (pixel.highestAmountLocked > 0) {
            pendingRefunds[msg.sender] += pixel.highestAmountLocked;
        }

        pixel.topLocker = address(0);
        pixel.highestAmountLocked = 0;
        pixel.color = "#FFFFFF"; 

        emit PixelChanged(id, msg.sender, pixel.color, address(0), 0);
    }

    function _own(uint256 id, uint256 amount) internal {
        Pixel storage pixel = grid[id];

        if (amount <= pixel.highestAmountLocked) revert InsufficientAmount();

        if (pixel.highestAmountLocked > 0) {
            pendingRefunds[pixel.topLocker] += pixel.highestAmountLocked;
        }

        pixel.topLocker = msg.sender;
        pixel.highestAmountLocked = amount;
        pixel.color = "#F527C8";
        
        emit PixelOwned(id, msg.sender, amount);
        emit PixelChanged(id, msg.sender, pixel.color, msg.sender, amount);
    }

    // ==========================================
    // Public Functions
    // ==========================================

    function getPixel(uint256 _x, uint256 _y) public view returns (Pixel memory) {
        return grid[_getIdAndVerify(_x, _y)];
    }

    function setPixel(uint256 _x, uint256 _y, string memory _color) public {
        uint256 id = _getIdAndVerify(_x, _y);
        Pixel storage pixel = grid[id];
        if (pixel.topLocker != msg.sender) revert NotOwner();
        
        pixel.color = _color;

        emit PixelChanged(id, msg.sender, _color, pixel.topLocker, pixel.highestAmountLocked);
    }

    function giveUpPixel(uint256 _x, uint256 _y) public {
        _giveUp(_getIdAndVerify(_x, _y));
    }

    function giveUpPixels(uint256[] calldata _xList, uint256[] calldata _yList) public {
        if (_xList.length != _yList.length) revert ArrayLengthMismatch();
        if (_xList.length == 0) revert EmptyArray();

        uint256 numberOfPixels = _xList.length;
        for (uint256 i = 0; i < numberOfPixels; i++) {
            _giveUp(_getIdAndVerify(_xList[i], _yList[i]));
        }
    }

    function ownPixel(uint256 _x, uint256 _y) public payable {
        _own(_getIdAndVerify(_x, _y), msg.value);
    }

    function ownPixels(uint256[] calldata _xList, uint256[] calldata _yList) public payable {
        if (_xList.length != _yList.length) revert ArrayLengthMismatch();
        if (_xList.length == 0) revert EmptyArray();

        uint256 numberOfPixels = _xList.length;
        uint256 amountPerPixel = msg.value / numberOfPixels;

        for (uint256 i = 0; i < numberOfPixels; i++) {
            _own(_getIdAndVerify(_xList[i], _yList[i]), amountPerPixel);
        }
    }

    function claimRefund() public {
        uint256 totalRefundAmount = pendingRefunds[msg.sender];
        if (totalRefundAmount == 0) revert NothingToRefund();

        uint256 userRefundAmount = (totalRefundAmount * (100 - COMMISSION_PERCENTAGE)) / 100;
        uint256 commission = totalRefundAmount - userRefundAmount;

        pendingRefunds[msg.sender] = 0;
        pendingAdminRefunds += commission;

        (bool success, ) = msg.sender.call{value: userRefundAmount}("");
        if (!success) revert TransferFailed();
    }

    function getAdminRefunds() public view returns (uint256) {
        return pendingAdminRefunds;
    }

    function claimAdminRefunds() public {
        if (msg.sender != adminAccount) revert Unauthorized();
        uint256 amountToClaim = pendingAdminRefunds;
        if (amountToClaim == 0) revert NothingToRefund();
        pendingAdminRefunds = 0;
        (bool success, ) = adminAccount.call{value: amountToClaim}("");
        if (!success) revert TransferFailed();
    }

    function setPseudo(string memory _pseudo) public {
        pseudos[msg.sender] = _pseudo;
    }

    function getPseudo(address _user) public view returns (string memory) {
        return pseudos[_user];
    }

    function getFullGrid() public view returns (Pixel[] memory) {
        Pixel[] memory allPixels = new Pixel[](SIZE * SIZE);
        for (uint256 i = 0; i < SIZE * SIZE; i++) {
            allPixels[i] = grid[i];
        }
        return allPixels;
    }

    function getGrid() public view returns (address[2500] memory, uint256[2500] memory, string[2500] memory) {
        address[2500] memory topLockers;
        uint256[2500] memory highestAmountsLocked;
        string[2500] memory colors;

        for (uint id = 0; id < 2500; id++) {
            Pixel storage pixel = grid[id];
            topLockers[id] = pixel.topLocker;
            highestAmountsLocked[id] = pixel.highestAmountLocked;
            colors[id] = pixel.color;
        }

        return (topLockers, highestAmountsLocked, colors);
    }

    function mintGridSnapshot() public payable {
        if (msg.value != 1 ether) revert IncorrectMintPrice();

        uint256 tokenId = _nextTokenId++;
        
        // Record the exact block number to freeze the state in time for this NFT
        snapshotBlocks[tokenId] = block.number;
        
        // Add the 1 ETH to the admin's revenue pool
        pendingAdminRefunds += msg.value;

        _safeMint(msg.sender, tokenId);

        emit SnapshotMinted(tokenId, msg.sender, block.number);
    }

   // Tells marketplaces where to find the JSON metadata and image for the NFT
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        
        // Change _requireOwned to _requireMinted for v4.9 compatibility
        _requireMinted(tokenId); 
        
        // Point to your backend server which will render the SVG based on the snapshot block
        return string(abi.encodePacked("https://your-api.com/api/metadata/", Strings.toString(tokenId)));
    }
}