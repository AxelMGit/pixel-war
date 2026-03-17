import { removeDomModal } from '../dom.js';
import { qs, shorten } from './utils.js';

export function showToast(msg, ms = 3000) {
  const t = qs('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => {
    t.style.display = 'none';
  }, ms);
}

export function showBuyPopup(
  x,
  y,
  color,
  lastPixelInfo = null,
  myAddress = null
) {
  const root = document.getElementById('modalRoot') || document.body;
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const card = document.createElement('div');
  card.className = 'modal-card';

  const ownedByMe =
    lastPixelInfo &&
    myAddress &&
    lastPixelInfo.topLocker &&
    lastPixelInfo.topLocker.toLowerCase() === myAddress.toLowerCase();

  if (ownedByMe) {
    card.innerHTML = `
      <h3>Changer la couleur</h3>
      <div class="modal-row">Coordonnées: <strong>${x}, ${y}</strong></div>
      <div class="modal-row">Couleur actuelle: <div class="color-swatch-lg" style="background:${color}"></div></div>
      <div class="modal-row">Choisir une couleur: <input type="color" id="modalColorInput" class="modal-input" value="${color}" style="width:60px;height:36px;padding:2px;border-radius:6px;border:none;" /></div>
      <div class="modal-actions">
        <button class="btn secondary" id="modalCancel">Annuler</button>
        <button class="btn primary" id="modalConfirm">Appliquer</button>
      </div>
    `;
    backdrop.appendChild(card);
    root.appendChild(backdrop);

    const colorInput = card.querySelector('#modalColorInput');
    const btnCancel = card.querySelector('#modalCancel');
    const btnConfirm = card.querySelector('#modalConfirm');

    btnCancel.addEventListener('click', () => removeDomModal(backdrop));
    btnConfirm.addEventListener('click', () => {
      const newColor = colorInput.value || color;
      window.dispatchEvent(
        new CustomEvent('ui:buyPixel', {
          detail: { x, y, color: newColor, amount: null },
        })
      );
      removeDomModal(backdrop);
      showToast('Changement de couleur soumis', 2500);
    });
    return;
  }

  // purchase / bid modal
  card.innerHTML = `
    <h3>Acheter / Surenchérir</h3>
    <div class="modal-row">Coordonnées: <strong>${x}, ${y}</strong></div>
    <div class="modal-row">Couleur: <div class="color-swatch-lg" style="background:${color}"></div></div>
    <div class="modal-row">Montant (ETH): <input class="modal-input" id="modalAmountInput" placeholder="0.1" /></div>
    <div class="modal-row"><div id="modalWarning" class="modal-warning" style="display:none;color:#fca5a5"></div></div>
    <div class="modal-actions">
      <button class="btn secondary" id="modalCancel">Annuler</button>
      <button class="btn primary" id="modalConfirm">Confirmer</button>
    </div>
  `;

  backdrop.appendChild(card);
  root.appendChild(backdrop);

  const amountInput = card.querySelector('#modalAmountInput');
  const warningEl = card.querySelector('#modalWarning');
  const btnCancel = card.querySelector('#modalCancel');
  const btnConfirm = card.querySelector('#modalConfirm');

  btnCancel.addEventListener('click', () => removeDomModal(backdrop));
  btnConfirm.addEventListener('click', () => {
    const raw = (amountInput.value || '').trim();
    const cleaned = raw.replace(',', '.');
    const amount = cleaned || null;
    window.dispatchEvent(
      new CustomEvent('ui:buyPixel', { detail: { x, y, color, amount } })
    );
    removeDomModal(backdrop);
    showToast('Transaction soumise', 2500);
  });
}

export function showEditPseudoModal() {
  const root = document.getElementById('modalRoot') || document.body;
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const card = document.createElement('div');
  card.className = 'modal-card';
  const currentEl = document.getElementById('pseudoDisplay');
  const current = currentEl ? currentEl.innerText : '';
  card.innerHTML = `
    <h3>Modifier votre pseudo</h3>
    <div class="modal-row">Pseudo: <input id="modalPseudoInput" class="modal-input" value="${current === '—' ? '' : current}" placeholder="Entrez un pseudo" /></div>
    <div class="modal-actions">
      <button class="btn secondary" id="modalCancel">Annuler</button>
      <button class="btn primary" id="modalSave">Enregistrer</button>
    </div>
  `;
  backdrop.appendChild(card);
  root.appendChild(backdrop);

  const input = card.querySelector('#modalPseudoInput');
  const btnCancel = card.querySelector('#modalCancel');
  const btnSave = card.querySelector('#modalSave');

  btnCancel.addEventListener('click', () => removeDomModal(backdrop));
  btnSave.addEventListener('click', () => {
    const newPseudo = input.value.trim();
    window.dispatchEvent(
      new CustomEvent('ui:setPseudo', { detail: { pseudo: newPseudo } })
    );
    removeDomModal(backdrop);
  });
}

export function showReturnPopup(x, y) {
  const root = document.getElementById('modalRoot') || document.body;
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const card = document.createElement('div');
  card.className = 'modal-card';
  card.innerHTML = `
    <h3>Rendre la case</h3>
    <div class="modal-row">Coordonnées: <strong>${x}, ${y}</strong></div>
    <div class="modal-row">Souhaitez-vous rendre cette case et récupérer votre mise ?</div>
    <div class="modal-actions">
      <button class="btn secondary" id="modalCancel">Non</button>
      <button class="btn primary" id="modalConfirm">Oui, rendre</button>
    </div>
  `;

  backdrop.appendChild(card);
  root.appendChild(backdrop);

  const btnCancel = card.querySelector('#modalCancel');
  const btnConfirm = card.querySelector('#modalConfirm');

  btnCancel.addEventListener('click', () => removeDomModal(backdrop));
  btnConfirm.addEventListener('click', () => {
    window.dispatchEvent(
      new CustomEvent('ui:returnPixel', { detail: { x, y } })
    );
    removeDomModal(backdrop);
    showToast('Demande de retour envoyée', 2500);
  });
}

export default {
  showToast,
  showBuyPopup,
  showEditPseudoModal,
  showReturnPopup,
};
