import controls from './ui/controls.js';
import {
  showEditPseudoModal,
  showReturnPopup,
} from './ui/modals.js';
import { qs, shorten } from './ui/utils.js';
import { removeDomModal } from './dom.js';

const ADMIN_WALLET_ADDRESS = '0xda1eb582986d35966e879970a7eBd1172260f29E';
let isConnected = false;

function updateWalletStatus(address) {
  const wa = document.getElementById('walletAddress');
  const ns = document.getElementById('networkStatus');
  const connectBtn = qs('connectWallet');
  const adminLink = document.getElementById('adminLink');

  if (wa) wa.textContent = shorten(address);
  if (ns) ns.textContent = 'Connecté';
  if (connectBtn) {
    connectBtn.textContent = 'Se déconnecter';
    isConnected = true;
  }

  if (adminLink && address.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()) {
    adminLink.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  controls.init();
  const connectBtn = qs('connectWallet');
  const mintBtn = qs('mintSnapshotButton');
  if (connectBtn) {
    connectBtn.addEventListener('click', () => {
      if (isConnected) {
        window.location.reload();
      }
    });
  }
  if (mintBtn) {
    mintBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('ui:mintGridSnapshot'));
    });
  }
});

window.addEventListener('ui:walletConnected', (ev) => {
  const address = ev.detail && ev.detail.address;
  if (address) {
    updateWalletStatus(address);
  }
});

window.addEventListener('ui:refundAmountLoaded', (ev) => {
  const amount = ev.detail && ev.detail.amount;
  const claimBtn = document.getElementById('claimRefundButton');
  console.log('Montant de remboursement chargé :', amount);
  if (claimBtn) {
    if (Number(amount) > 0) {
      claimBtn.textContent = `Réclamer ${Number(amount).toFixed(4)} ETH`;
      claimBtn.style.display = '';
    } else {
      claimBtn.style.display = 'none';
    }
  }
});

window.addEventListener('ui:showEditPseudo', () => showEditPseudoModal());

window.addEventListener('ui:confirmReturn', (ev) => {
  const d = ev.detail || {};
  showReturnPopup(d.x, d.y);
});

window.addEventListener('ui:notOwner', () => {
  const root = document.getElementById('modalRoot') || document.body;
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const card = document.createElement('div');
  card.className = 'modal-card';
  card.innerHTML = `
    <h3>Action non autorisée</h3>
    <div class="modal-row">Vous ne pouvez rendre cette case car vous n'en êtes pas le propriétaire.</div>
    <div class="modal-actions">
      <button class="btn primary" id="modalOk">OK</button>
    </div>
  `;
  backdrop.appendChild(card);
  root.appendChild(backdrop);
  const btnOk = card.querySelector('#modalOk');
  btnOk.addEventListener('click', () => removeDomModal(backdrop));
});
