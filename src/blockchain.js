import Web3 from 'https://cdn.jsdelivr.net/npm/web3@4.1.1/+esm';

import abi, { contractAddress as abiContractAddress } from './ressources/contract.js';
import {
    GANACHE_RPC_URL,
    GRID_REFRESH_INTERVAL_MS
} from './config.js';

let gridRefreshIntervalId = null;
const normalizeAddress = (address) => typeof address === 'string'
    ? address.toLowerCase()
    : '';
const parseLockAmount = (amount) => {
    if (typeof amount === 'bigint') {
        return amount;
    }
    if (typeof amount === 'number') {
        return BigInt(amount);
    }
    if (typeof amount === 'string' && amount.length > 0) {
        return BigInt(amount);
    }
    throw new Error(`Montant de verrouillage invalide: ${amount}`);
};

async function createBlockchainClient() {
    let web3;
    let connectionLabel;

    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        connectionLabel = 'Connecté via MetaMask !';
    } else {
        console.warn('Wallet non détecté, tentative de connexion à Ganache (localhost).');
        web3 = new Web3(GANACHE_RPC_URL);
        connectionLabel = 'Connecté à Ganache !';
    }
    const contract = new web3.eth.Contract(abi, abiContractAddress);

    return {
        web3,
        contract,
        connectionLabel
    };
}

async function loadGrid(contract) {
    console.log('Chargement de la grille...');
    const pixels = await contract.methods.getFullGrid().call();
    console.log('Grille dessinée.');
    return pixels;
}

function startGridPolling(refreshGrid) {
    if (gridRefreshIntervalId !== null) {
        return;
    }

    gridRefreshIntervalId = window.setInterval(() => {
        refreshGrid();
    }, GRID_REFRESH_INTERVAL_MS);
}

function subscribeToPixelChanges(contract, { onPixelChanged, onSubscriptionUnavailable }) {
    const subscribe = contract?.events?.PixelChanged;

    if (typeof subscribe !== 'function') {
        console.warn('Les abonnements aux événements ne sont pas disponibles avec le provider actuel.');
        onSubscriptionUnavailable();
        return false;
    }

    try {
        const subscription = subscribe();

        if (!subscription || typeof subscription.on !== 'function') {
            console.warn('Le provider actuel ne prend pas en charge les souscriptions Web3.');
            onSubscriptionUnavailable();
            return false;
        }

        subscription.on('data', (event) => {
            const { id, color } = event.returnValues;
            onPixelChanged({
                id: Number(id),
                color
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
    console.log(`Envoi de la transaction pour le pixel (${x}, ${y}) avec la couleur ${color}...`);
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];

    if (!account) {
        throw new Error('Aucun compte disponible pour envoyer la transaction.');
    }

    console.log(`Adresse utilisée pour la transaction: ${account}`);
    console.log(`Contrat ciblé: ${contract.options.address}`);

    const pixel = await contract.methods.getPixel(x, y).call();
    const isPixelOwner = normalizeAddress(pixel.topLocker) === normalizeAddress(account);

    if (!isPixelOwner) {
        let nextLockAmount = parseLockAmount(pixel.highestAmountLocked) + 1n;

        for (let attempt = 0; attempt < 2; attempt += 1) {
            try {
                console.log(`Le compte ${account} ne possède pas ce pixel, tentative d'acquisition pour ${nextLockAmount} wei...`);
                await contract.methods.ownPixel(x, y).send({
                    from: account,
                    value: nextLockAmount.toString()
                });
                break;
            } catch (error) {
                if (attempt === 1) {
                    throw error;
                }

                const latestPixel = await contract.methods.getPixel(x, y).call();
                const latestOwner = normalizeAddress(latestPixel.topLocker);

                if (latestOwner === normalizeAddress(account)) {
                    break;
                }

                nextLockAmount = parseLockAmount(latestPixel.highestAmountLocked) + 1n;
            }
        }
    }

    await contract.methods.setPixel(x, y, color).send({
        from: account
    });

    console.log("Transaction réussie !");
}

export {
    createBlockchainClient,
    loadGrid,
    sendPixel,
    startGridPolling,
    subscribeToPixelChanges
};
