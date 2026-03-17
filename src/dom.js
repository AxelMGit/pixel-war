import { GRID_SIZE } from './config.js';

const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const pixelSize = canvas.width / GRID_SIZE;
const statusEl = document.getElementById('status');
const colorPickerEl = document.getElementById('colorPicker');

const ownPixelModal = document.getElementById('ownPixelModal');
const closeButton = ownPixelModal.querySelector('.close-button');
const ownPixelButton = document.getElementById('ownPixelButton');
const pixelAmountInput = document.getElementById('pixelAmount');

const bidPixelModal = document.getElementById('bidPixelModal');
const bidCloseButton = bidPixelModal.querySelector('.close-button');
const bidPixelButton = document.getElementById('bidPixelButton');
const bidAmountInput = document.getElementById('bidAmount');
const currentBidEl = document.getElementById('currentBid');

function setStatus(message) {
  statusEl.innerText = message;
}

function getCanvasCoordinates(event) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: Math.floor((event.clientX - rect.left) / pixelSize),
    y: Math.floor((event.clientY - rect.top) / pixelSize),
  };
}

function getSelectedColor() {
  return colorPickerEl.value;
}

function showOwnPixelModal() {
  return new Promise((resolve, reject) => {
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

    closeButton.onclick = close;
    ownPixelButton.onclick = own;
  });
}

function showBidPixelModal(currentBid) {
  return new Promise((resolve, reject) => {
    currentBidEl.innerText = currentBid;
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

    bidCloseButton.onclick = close;
    bidPixelButton.onclick = bid;
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
