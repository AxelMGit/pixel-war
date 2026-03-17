// eslint-disable-next-line node/no-missing-import
import Web3 from 'https://cdn.jsdelivr.net/npm/web3@4.16.0/+esm';

import abi, {
  contractAddress as abiContractAddress,
} from './ressources/contract.js';
import { GANACHE_RPC_URL, GRID_REFRESH_INTERVAL_MS } from './config.js';

let gridRefreshIntervalId = null;

async function createBlockchainClient() {
  let web3;
  let connectionLabel;

  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    connectionLabel = 'Connecté via MetaMask !';
  } else {
    console.warn(
      'Wallet non détecté, tentative de connexion à Ganache (localhost).'
    );
    web3 = new Web3(GANACHE_RPC_URL);
    connectionLabel = 'Connecté à Ganache !';
  }
  const contract = new web3.eth.Contract(abi, abiContractAddress);

  return {
    web3,
    contract,
    connectionLabel,
  };
}

async function loadGrid(contract) {
  console.log('Chargement de la grille...');
  try {
    const pixels = await contract.methods.getFullGrid().call();
    console.log('Grille dessinée.');
    return pixels;
  } catch (error) {
    console.error('Échec de getFullGrid():', error);
    throw error;
  }
}

function startGridPolling(refreshGrid) {
  if (gridRefreshIntervalId !== null) {
    return;
  }

  gridRefreshIntervalId = window.setInterval(() => {
    refreshGrid();
  }, GRID_REFRESH_INTERVAL_MS);
}

function subscribeToPixelChanges(
  contract,
  { onPixelChanged, onSubscriptionUnavailable }
) {
  const subscribe = contract?.events?.PixelChanged;

  if (typeof subscribe !== 'function') {
    console.warn(
      'Les abonnements aux événements ne sont pas disponibles avec le provider actuel.'
    );
    onSubscriptionUnavailable();
    return false;
  }

  try {
    const subscription = subscribe();

    if (!subscription || typeof subscription.on !== 'function') {
      console.warn(
        'Le provider actuel ne prend pas en charge les souscriptions Web3.'
      );
      onSubscriptionUnavailable();
      return false;
    }

    subscription.on('data', (event) => {
      const { id, color } = event.returnValues;
      onPixelChanged({
        id: Number(id),
        color,
      });
    });

    subscription.on('error', (error) => {
      console.error("Erreur sur l'écoute des événements:", error);
      onSubscriptionUnavailable();
    });

    return true;
  } catch (error) {
    console.error("Impossible d'initialiser l'écoute des événements:", error);
    onSubscriptionUnavailable();
    return false;
  }
}

async function sendPixel(contract, web3, { x, y, color }) {
  const accounts = await web3.eth.getAccounts();
  const account = accounts[0];
  const nonce = await web3.eth.getTransactionCount(account, 'pending');

  await contract.methods.setPixel(x, y, color).send({
    from: account,
    nonce,
  });
}

async function getPixel(contract, x, y) {
  return await contract.methods.getPixel(x, y).call();
}

async function ownPixel(contract, web3, { x, y, amount }) {
  const accounts = await web3.eth.getAccounts();
  const account = accounts[0];
  const nonce = await web3.eth.getTransactionCount(account, 'pending');

  await contract.methods.ownPixel(x, y).send({
    from: account,
    value: web3.utils.toWei(amount, 'ether'),
    nonce,
  });
}

async function giveUpPixel(contract, web3, { x, y }) {
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
    const nonce = await web3.eth.getTransactionCount(account, 'pending');

    await contract.methods.giveUpPixel(x, y).send({
        from: account,
        nonce
    });
}

async function claimRefund(contract, web3) {
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];
    const nonce = await web3.eth.getTransactionCount(account, 'pending');

    await contract.methods.claimRefund().send({
        from: account,
        nonce
    });
}

export {
    createBlockchainClient,
    loadGrid,
    sendPixel,
    startGridPolling,
    subscribeToPixelChanges,
    getPixel,
    ownPixel,
    giveUpPixel,
    claimRefund
};
