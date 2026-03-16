export const contractAddress = '0x1293Bc2B07d3b87C536E28A4F97D7678D9AA5450';
export const abi = [
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
            name: 'author',
            type: 'address',
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
        name: '',
        type: 'uint256',
      },
    ],
    name: 'grid',
    outputs: [
      {
        internalType: 'address',
        name: 'author',
        type: 'address',
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
];
