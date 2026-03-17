import { shorten } from './utils.js';
import { showToast } from './modals.js';
import Web3 from 'https://cdn.jsdelivr.net/npm/web3@4.16.0/+esm';

export async function connectWallet() {
  if (window.ethereum) {
    try {
      await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      return { web3, account: accounts[0] };
    } catch (err) {
      showToast('Connexion refusée');
      throw new Error('Connection refused');
    }
  } else {
    showToast('Aucun provider web3 détecté (Metamask ?)');
    throw new Error('No web3 provider detected');
  }
}

export async function connectWalletUI() {
  try {
    const { account } = await connectWallet();
    const wa = document.getElementById('walletAddress');
    const ns = document.getElementById('networkStatus');
    if (wa) wa.textContent = shorten(account);
    if (ns) ns.textContent = 'Connecté';
    showToast('Wallet connecté');
    window.dispatchEvent(
      new CustomEvent('ui:walletConnected', { detail: { address: account } })
    );
  } catch (err) {
    // errors are already displayed in connectWallet
  }
}

export default { connectWallet, connectWalletUI };
