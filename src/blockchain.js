// eslint-disable-next-line node/no-missing-import
import abi, {
  contractAddress as abiContractAddress,
} from './ressources/contract.js';
import { GRID_REFRESH_INTERVAL_MS } from './config.js';

let gridRefreshIntervalId = null;
// Cache pour éviter d'appeler getPseudo trop souvent
const pseudoCache = {};

import { connectWallet } from './ui/wallet.js';

async function createBlockchainClient() {
  const { web3, account } = await connectWallet();
  const contract = new web3.eth.Contract(abi, abiContractAddress);

  if (account) {
    window.dispatchEvent(
      new CustomEvent('ui:walletConnected', {
        detail: { address: account },
      })
    );
  }

  return {
    web3,
    contract,
    connectionLabel: 'MetaMask',
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
  gridRefreshIntervalId = setInterval(refreshGrid, GRID_REFRESH_INTERVAL_MS);
}

function subscribeToPixelChanges(
  contract,
  { onPixelChanged, onPixelOwnerChanged, onSubscriptionUnavailable }
) {
  const subscribe = contract?.events?.PixelChanged;

  if (typeof subscribe !== 'function') {
    console.warn(
      "Les abonnements aux événements ne sont pas disponibles avec le provider actuel."
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
      if (newOwner === '0x0000000000000000000000000000000000000000') {
        onPixelChanged({
          id: Number(id),
          color,
        });
      } else {
        onPixelChanged({
          id: Number(id),
          color,
          owner: newOwner,
          amount: newAmount,
        });
        if (onPixelOwnerChanged) {
          onPixelOwnerChanged({
            id: Number(id),
            owner: newOwner,
            amount: newAmount,
          });
        }
      }
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

async function setPixels(contract, web3, { xList, yList, colorList }) {
  const accounts = await web3.eth.getAccounts();
  const account = accounts[0];
  const nonce = await web3.eth.getTransactionCount(account, 'pending');

  await contract.methods.setPixels(xList, yList, colorList[0]).send({
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

async function ownPixels(contract, web3, { xList, yList, amount }) {
  const accounts = await web3.eth.getAccounts();
  const account = accounts[0];
  const nonce = await web3.eth.getTransactionCount(account, 'pending');

  await contract.methods.ownPixels(xList, yList).send({
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

async function giveUpPixels(contract, web3, { xList, yList }) {
  const accounts = await web3.eth.getAccounts();
  const account = accounts[0];
  const nonce = await web3.eth.getTransactionCount(account, 'pending');

  await contract.methods.giveUpPixels(xList, yList).send({
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

async function claimAdminRefunds(contract, web3) {
  const accounts = await web3.eth.getAccounts();
  const account = accounts[0];
  const nonce = await web3.eth.getTransactionCount(account, 'pending');

  await contract.methods.claimAdminRefunds().send({
    from: account,
    nonce,
  });
}

async function getAdminRefunds(contract, web3){
  const accounts = await web3.eth.getAccounts();
  if (accounts.length === 0) return '0';
  const account = accounts[0];
  const amountWei = await contract.methods.getAdminRefunds().call({ from: account });
  return web3.utils.fromWei(amountWei, 'ether');
}

async function getPendingRefund(contract, web3) {
  const accounts = await web3.eth.getAccounts();
  if (accounts.length === 0) return '0';
  const account = accounts[0];
  const amountWei = await contract.methods.pendingRefunds(account).call();
  const amountWeiFloat = parseFloat(amountWei);
  const amountToRefund = Math.floor(amountWeiFloat * 0.95);
  return web3.utils.fromWei(amountToRefund, 'ether');
}

async function getPastEvents(contract) {
  const pastEvents = await contract.getPastEvents('PixelChanged', {
    fromBlock: 0,
    toBlock: 'latest',
  });
  return pastEvents;
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
  giveUpPixels,
  claimRefund,
  getPendingRefund,
  getPseudoCached,
  setPseudo,
  ownPixels,
  setPixels,
  getPastEvents,
  claimAdminRefunds,
  getAdminRefunds,
};
