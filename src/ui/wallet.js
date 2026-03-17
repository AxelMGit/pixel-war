import { shorten } from './utils.js';
import { showToast } from './modals.js';

export async function connectWallet() {
  if (window.ethereum) {
    try {
      const acc = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      const addr = acc[0];
      const wa = document.getElementById('walletAddress');
      const ns = document.getElementById('networkStatus');
      if (wa) wa.textContent = shorten(addr);
      if (ns) ns.textContent = 'Connecté';
      showToast('Wallet connecté');
      window.dispatchEvent(
        new CustomEvent('ui:walletConnected', { detail: { address: addr } })
      );
    } catch (err) {
      showToast('Connexion refusée');
    }
  } else {
    showToast('Aucun provider web3 détecté (Metamask ?)');
  }
}

export default { connectWallet };
