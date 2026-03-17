export const contractAddress = '0x94369Ac21E1d7d608c9cc561a3f97a939a51a2Ef';
const abi = [
  {
    inputs: [],
    name: 'claimRefund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_x',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_y',
        type: 'uint256',
      },
    ],
    name: 'ownPixel',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'author',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'color',
        type: 'string',
      },
    ],
    name: 'PixelChanged',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_x',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_y',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: '_color',
        type: 'string',
      },
    ],
    name: 'setPixel',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getFullGrid',
    outputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'topLocker',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'highestAmountLocked',
            type: 'uint256',
          },
          {
            internalType: 'string',
            name: 'color',
            type: 'string',
          },
        ],
        internalType: 'struct PixelGrid.Pixel[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_x',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_y',
        type: 'uint256',
      },
    ],
    name: 'getPixel',
    outputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'topLocker',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'highestAmountLocked',
            type: 'uint256',
          },
          {
            internalType: 'string',
            name: 'color',
            type: 'string',
          },
        ],
        internalType: 'struct PixelGrid.Pixel',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'grid',
    outputs: [
      {
        internalType: 'address',
        name: 'topLocker',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'highestAmountLocked',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'color',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'pendingRefunds',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'SIZE',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'pseudos',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_pseudo',
        type: 'string',
      },
    ],
    name: 'setPseudo',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_user',
        type: 'address',
      },
    ],
    name: 'getPseudo',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

export default abi;
