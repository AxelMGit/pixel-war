export const contractAddress = '0xcD1893B5B2B0F0b4ab5110EEE86643CEd1124fAB';
const abi = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "author",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "color",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "newAmount",
				"type": "uint256"
			}
		],
		"name": "PixelChanged",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "PixelOwned",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "SIZE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "claimRefund",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getFullGrid",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "topLocker",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "highestAmountLocked",
						"type": "uint256"
					},
					{
						"internalType": "string",
						"name": "color",
						"type": "string"
					}
				],
				"internalType": "struct PixelGrid.Pixel[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getGrid",
		"outputs": [
			{
				"internalType": "address[2500]",
				"name": "",
				"type": "address[2500]"
			},
			{
				"internalType": "uint256[2500]",
				"name": "",
				"type": "uint256[2500]"
			},
			{
				"internalType": "string[2500]",
				"name": "",
				"type": "string[2500]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_x",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_y",
				"type": "uint256"
			}
		],
		"name": "getPixel",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "topLocker",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "highestAmountLocked",
						"type": "uint256"
					},
					{
						"internalType": "string",
						"name": "color",
						"type": "string"
					}
				],
				"internalType": "struct PixelGrid.Pixel",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "getPseudo",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_x",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_y",
				"type": "uint256"
			}
		],
		"name": "giveUpPixel",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "grid",
		"outputs": [
			{
				"internalType": "address",
				"name": "topLocker",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "highestAmountLocked",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "color",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_x",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_y",
				"type": "uint256"
			}
		],
		"name": "ownPixel",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256[]",
				"name": "_xList",
				"type": "uint256[]"
			},
			{
				"internalType": "uint256[]",
				"name": "_yList",
				"type": "uint256[]"
			}
		],
		"name": "ownPixels",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "pendingRefunds",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "pseudos",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_x",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_y",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "_color",
				"type": "string"
			}
		],
		"name": "setPixel",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256[]",
				"name": "_xs",
				"type": "uint256[]"
			},
			{
				"internalType": "uint256[]",
				"name": "_ys",
				"type": "uint256[]"
			},
			{
				"internalType": "string[]",
				"name": "_colors",
				"type": "string[]"
			}
		],
		"name": "setPixels",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_pseudo",
				"type": "string"
			}
		],
		"name": "setPseudo",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

export default abi;
