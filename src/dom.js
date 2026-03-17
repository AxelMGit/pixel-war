import { GRID_SIZE } from './config.js';

const canvas = document.getElementById('pixelCanvas');
const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
const pixelSize = canvas ? canvas.width / GRID_SIZE : 1;

// status element: keep backward compatibility with previous id `status`
const statusEl =
  document.getElementById('status') ||
  document.getElementById('networkStatus') ||
  null;
const colorPickerEl = document.getElementById('colorPicker');

// Modals may have been removed in the new UI; use optional chaining and fallbacks.
const ownPixelModal = document.getElementById('ownPixelModal');
const closeButton = ownPixelModal
  ? ownPixelModal.querySelector('.close-button')
  : null;
const ownPixelButton = document.getElementById('ownPixelButton');
const pixelAmountInput = document.getElementById('pixelAmount');

const bidPixelModal = document.getElementById('bidPixelModal');
const bidCloseButton = bidPixelModal
  ? bidPixelModal.querySelector('.close-button')
  : null;
const bidPixelButton = document.getElementById('bidPixelButton');
const bidAmountInput = document.getElementById('bidAmount');
const currentBidEl = document.getElementById('currentBid');

function setStatus(message) {
  if (typeof message === 'string' && message.toLowerCase().includes('erreur')) {
    // For errors, show a modal popup instead of writing to header status
    showErrorModal(message);
    console.error('[status]', message);
    return;
  }

  if (statusEl) {
    statusEl.innerText = message;
  } else {
    console.info('[status]', message);
  }
}

function removeDomModal(backdrop) {
  if (backdrop && backdrop.parentNode)
    backdrop.parentNode.removeChild(backdrop);
}

function showErrorModal(message) {
  const root = document.getElementById('modalRoot') || document.body;
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const card = document.createElement('div');
  card.className = 'modal-card';
  card.innerHTML = `
    <h3>Erreur</h3>
    <div class="modal-row">${String(message)}</div>
    <div class="modal-actions">
      <button class="btn primary" id="modalOk">OK</button>
    </div>
  `;

  backdrop.appendChild(card);
  root.appendChild(backdrop);

  const btnOk = card.querySelector('#modalOk');
  btnOk.addEventListener('click', () => removeDomModal(backdrop));
}

function getCanvasCoordinates(event) {
  const rect = canvas.getBoundingClientRect();
  const perPixel = rect.width / GRID_SIZE; // compute from rendered size (accounts for CSS scale)

  return {
    x: Math.floor((event.clientX - rect.left) / perPixel),
    y: Math.floor((event.clientY - rect.top) / perPixel),
  };
}

function getSelectedColor() {
  return colorPickerEl.value;
}

function showOwnPixelModal() {
  return new Promise((resolve, reject) => {
    // If modal is present in DOM, use it, otherwise fallback to prompt
    if (ownPixelModal && pixelAmountInput) {
      ownPixelModal.style.display = 'flex';

      const close = () => {
        ownPixelModal.style.display = 'none';
        reject(new Error('Transaction annulée.'));
      };

      const own = () => {
        const amount = pixelAmountInput.value;
        if (amount) {
          ownPixelModal.style.display = 'none';
          resolve(amount);
        } else {
          alert('Veuillez entrer un montant.');
        }
      };

      if (closeButton) closeButton.onclick = close;
      if (ownPixelButton) ownPixelButton.onclick = own;
    } else {
      const amount = window.prompt(
        'Entrez le montant en ETH pour acheter ce pixel :',
        '0.1'
      );
      if (amount) resolve(amount);
      else reject(new Error('Transaction annulée.'));
    }
  });
}

function showBidPixelModal(currentBid) {
  return new Promise((resolve, reject) => {
    // If modal exists, use it. Otherwise use window.prompt fallback.
    if (currentBidEl) currentBidEl.innerText = currentBid;

    if (bidPixelModal && bidAmountInput) {
      bidPixelModal.style.display = 'flex';

      const close = () => {
        bidPixelModal.style.display = 'none';
        reject(new Error('Transaction annulée.'));
      };

      const bid = () => {
        const amount = bidAmountInput.value;
        if (amount) {
          bidPixelModal.style.display = 'none';
          resolve(amount);
        } else {
          alert('Veuillez entrer un montant.');
        }
      };

      if (bidCloseButton) bidCloseButton.onclick = close;
      if (bidPixelButton) bidPixelButton.onclick = bid;
    } else {
      const amount = window.prompt(
        `Montant actuel: ${currentBid} ETH. Entrez un montant supérieur :`,
        '0.2'
      );
      if (amount) resolve(amount);
      else reject(new Error('Transaction annulée.'));
    }
  });
}

export {
  canvas,
  ctx,
  pixelSize,
  setStatus,
  getCanvasCoordinates,
  getSelectedColor,
  showOwnPixelModal,
  showBidPixelModal,
};
