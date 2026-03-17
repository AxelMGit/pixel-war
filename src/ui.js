import controls from './ui/controls.js';
import { connectWallet } from './ui/wallet.js';
import {
  showEditPseudoModal,
  showReturnPopup,
} from './ui/modals.js';
import { qs } from './ui/utils.js';
import { removeDomModal } from './dom.js';

document.addEventListener('DOMContentLoaded', () => {
  controls.init();
  const connectBtn = qs('connectWallet');
  if (connectBtn) connectBtn.addEventListener('click', connectWallet);
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
