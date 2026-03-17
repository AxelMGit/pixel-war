// eslint-disable-next-line node/no-missing-import
import Web3 from 'https://cdn.jsdelivr.net/npm/web3@4.16.0/+esm';

import abi, {
  contractAddress as abiContractAddress,
} from './ressources/contract.js';
import { GANACHE_RPC_URL, GRID_REFRESH_INTERVAL_MS } from './config.js';

let gridRefreshIntervalId = null;
// Cache pour éviter d'appeler getPseudo trop souvent
const pseudoCache = {};

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
  const {
    0: topLockers,
    1: highestAmountsLocked,
    2: colors,
  } = await contract.methods.getGrid().call();

  const pixels = [];
  for (let i = 0; i < topLockers.length; i++) {
    pixels.push({
      topLocker: topLockers[i],
      highestAmountLocked: highestAmountsLocked[i],
      color: colors[i] === '' ? '#FFFFFF' : colors[i],
    });
  }
  return pixels;
}

function startGridPolling(refreshGrid) {
  if (gridRefreshIntervalId) {
    clearInterval(gridRefreshIntervalId);
  }
  gridRefreshIntervalId = setInterval(
    refreshGrid,
    GRID_REFRESH_INTERVAL_MS
  );
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
      const { id, color, newOwner, newAmount } = event.returnValues;
      onPixelChanged({
        id: Number(id),
        color,
        owner: newOwner,
        amount: newAmount
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

async function getPseudoCached(contract, address) {
  if (!address) return '';
  if (pseudoCache[address]) return pseudoCache[address];
  try {
    const pseudo = await contract.methods.getPseudo(address).call();
    // stocker au cache même si vide pour éviter re-appels
    pseudoCache[address] = pseudo || '';
    return pseudoCache[address];
  } catch (error) {
    console.error('Erreur getPseudoCached:', error);
    return '';
  }
}

async function setPseudo(contract, web3, pseudo) {
  const accounts = await web3.eth.getAccounts();
  const account = accounts[0];
  const nonce = await web3.eth.getTransactionCount(account, 'pending');

  await contract.methods.setPseudo(pseudo).send({
    from: account,
    nonce,
  });

  // Mettre à jour le cache local
  pseudoCache[account] = pseudo;
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
    nonce,
  });
}

async function claimRefund(contract, web3) {
  const accounts = await web3.eth.getAccounts();
  const account = accounts[0];
  const nonce = await web3.eth.getTransactionCount(account, 'pending');

  await contract.methods.claimRefund().send({
    from: account,
    nonce,
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
  claimRefund,
  getPseudoCached,
  setPseudo,
};
