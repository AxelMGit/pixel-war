import { GRID_SIZE } from './config.js';
import { getCanvasCoordinates, removeDomModal } from './dom.js';
import { syncColor } from './ui/color.js';

const els = {};
let currentColor = '#7C3AED';
let recentColors = [currentColor, '#06B6D4', '#F59E0B', '#E11D48'];
let lastCell = { x: -1, y: -1 };
let zoom = 1;
let lastPixelInfo = null;
let myAddressFull = null;

function qs(id) {
  return document.getElementById(id);
}

function shorten(addr) {
  if (!addr) return '--';
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}

function init() {
  els.colorPicker = qs('colorPicker');
  els.colorPickerLarge = qs('colorPickerLarge');
  els.eraserBtn = qs('eraserBtn');
  els.zoomIn = qs('zoomIn');
  els.zoomOut = qs('zoomOut');
  els.zoomLevel = qs('zoomLevel');
  els.canvas = qs('pixelCanvas');
  els.cellTooltip = qs('cellTooltip');
  els.recentColors = qs('recentColors');
  els.hexInput = qs('hexInput');
  els.connectWallet = qs('connectWallet');
  els.walletAddress = qs('walletAddress');
  els.networkStatus = qs('networkStatus');
  els.txList = qs('txList');
  els.togglePanel = qs('togglePanel');
  els.infoCoords = qs('infoCoords');
  els.infoOwner = qs('infoOwner');
  els.infoAmount = qs('infoAmount');
  els.infoStatus = qs('infoStatus');
  els.pseudoDisplay = qs('pseudoDisplay');
  els.editPseudo = qs('editPseudo');

  renderRecentColors();
  bind();
  updateZoom();
}

function bind() {
  if (els.colorPicker) {
    els.colorPicker.addEventListener('input', (e) => {
      currentColor = e.target.value;
      addRecentColor(currentColor);
      syncColor(currentColor);
    });
  }

  if (els.colorPickerLarge) {
    els.colorPickerLarge.addEventListener('input', (e) => {
      currentColor = e.target.value;
      addRecentColor(currentColor);
      syncColor(currentColor);
    });
  }

  if (els.hexInput) {
    els.hexInput.addEventListener('change', () => {
      const v = els.hexInput.value.trim();
      if (/^#([0-9A-Fa-f]{6})$/.test(v)) {
        currentColor = v;
        addRecentColor(v);
        syncColor(v);
      } else {
        showToast('Format hex invalide (#RRGGBB)');
      }
    });
  }

  if (els.eraserBtn) {
    els.eraserBtn.addEventListener('click', () => {
      currentColor = '#ffffff';
      addRecentColor('#ffffff');
      syncColor('#ffffff');
    });
  }

  if (els.zoomIn)
    els.zoomIn.addEventListener('click', () => {
      zoom = Math.min(3, zoom + 0.25);
      updateZoom();
    });
  if (els.zoomOut)
    els.zoomOut.addEventListener('click', () => {
      zoom = Math.max(0.5, zoom - 0.25);
      updateZoom();
    });

  if (els.canvas) {
    els.canvas.addEventListener('mousemove', (e) => {
      const { x: cellX, y: cellY } = getCanvasCoordinates(e);
      lastCell = { x: cellX, y: cellY };
      if (els.cellTooltip) {
        els.cellTooltip.style.display = 'block';
        els.cellTooltip.textContent = `x: ${cellX} y: ${cellY}`;
        const rect = els.canvas.getBoundingClientRect();
        els.cellTooltip.style.left = `${e.clientX - rect.left + 12}px`;
        els.cellTooltip.style.top = `${e.clientY - rect.top + 12}px`;
      }
      window.dispatchEvent(
        new CustomEvent('ui:cellHover', { detail: { x: cellX, y: cellY } })
      );
    });
    els.canvas.addEventListener('mouseleave', () => {
      if (els.cellTooltip) els.cellTooltip.style.display = 'none';
      lastCell = { x: -1, y: -1 };
    });
    els.canvas.addEventListener('click', onCanvasClick);
  }

  if (els.connectWallet)
    els.connectWallet.addEventListener('click', connectWallet);
  // Left click on canvas emits `ui:cellClick` (acheter/surenchérir).
  // Right click (contextmenu) will emit `ui:returnPixel` to récupérer la mise.
  if (els.canvas) {
    els.canvas.addEventListener('contextmenu', onCanvasRightClick);
  }
  if (els.togglePanel) els.togglePanel.addEventListener('click', togglePanel);

  // listen for pixel info events from `focus.js` and update the panel
  window.addEventListener('pixel:info', (ev) => {
    const d = ev.detail || {};
    lastPixelInfo = d;
    if (els.infoCoords) els.infoCoords.innerText = `${d.x}, ${d.y}`;
    if (els.infoOwner) els.infoOwner.innerText = d.topLockerDisplay || 'N/A';
    if (els.infoAmount) els.infoAmount.innerText = d.amountDisplay || 'N/A';
    if (els.infoStatus)
      els.infoStatus.innerText = d.isPixelSet ? 'Occupé' : 'Libre';
  });

  // listen to wallet connect events (set by this UI or other modules)
  window.addEventListener('ui:walletConnected', (ev) => {
    const addr = ev.detail && ev.detail.address;
    if (addr) myAddressFull = addr;
  });

  // listen for pseudo loaded/saved from main
  window.addEventListener('ui:pseudoLoaded', (ev) => {
    const p = ev.detail && ev.detail.pseudo;
    if (els.pseudoDisplay) els.pseudoDisplay.innerText = p || '—';
  });

  window.addEventListener('ui:pseudoSaved', (ev) => {
    const p = ev.detail && ev.detail.pseudo;
    if (els.pseudoDisplay) els.pseudoDisplay.innerText = p || '—';
    showToast('Pseudo enregistré', 2000);
  });

  if (els.editPseudo) {
    els.editPseudo.addEventListener('click', () => showEditPseudoModal());
  }
}

function onCanvasMove(e) {
  if (!els.canvas) return;
  const rect = els.canvas.getBoundingClientRect();
  const perPixel = rect.width / GRID_SIZE; // screen pixels per grid cell (accounts for zoom)
  const cellX = Math.floor((e.clientX - rect.left) / perPixel);
  const cellY = Math.floor((e.clientY - rect.top) / perPixel);
  lastCell = { x: cellX, y: cellY };
  if (els.cellTooltip) {
    els.cellTooltip.style.display = 'block';
    els.cellTooltip.textContent = `x: ${cellX} y: ${cellY}`;
    els.cellTooltip.style.left = `${e.clientX - rect.left + 12}px`;
    els.cellTooltip.style.top = `${e.clientY - rect.top + 12}px`;
  }

  // emit hover event
  window.dispatchEvent(
    new CustomEvent('ui:cellHover', { detail: { x: cellX, y: cellY } })
  );
}

function onCanvasClick(e) {
  if (lastCell.x < 0) return;
  // Show purchase / bid popup, then emit `ui:buyPixel` on confirm.
  showBuyPopup(lastCell.x, lastCell.y, currentColor);
}

function onCanvasRightClick(e) {
  e.preventDefault();
  if (lastCell.x < 0) {
    showToast('Sélectionnez un pixel dans la grille.');
    return;
  }
  // Request return permission from the blockchain layer.
  window.dispatchEvent(
    new CustomEvent('ui:returnRequest', {
      detail: { x: lastCell.x, y: lastCell.y },
    })
  );
}

// use removeDomModal from src/dom.js

function showBuyPopup(x, y, color) {
  const root = document.getElementById('modalRoot') || document.body;
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  // If pixel is owned by current user, show color-change modal
  const ownedByMe =
    lastPixelInfo &&
    myAddressFull &&
    lastPixelInfo.topLocker &&
    lastPixelInfo.topLocker.toLowerCase() === myAddressFull.toLowerCase();

  const card = document.createElement('div');
  card.className = 'modal-card';

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

  // Otherwise show purchase / bid modal with amount validation
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
    // Minimal client-side handling: send amount (if any) to main for validation/processing
    window.dispatchEvent(
      new CustomEvent('ui:buyPixel', { detail: { x, y, color, amount } })
    );
    removeDomModal(backdrop);
    showToast('Transaction soumise', 2500);
  });
}

function showEditPseudoModal() {
  const root = document.getElementById('modalRoot') || document.body;
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const card = document.createElement('div');
  card.className = 'modal-card';
  const current = els.pseudoDisplay ? els.pseudoDisplay.innerText : '';
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

function showReturnPopup(x, y) {
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

function addRecentColor(hex) {
  recentColors = [hex, ...recentColors.filter((c) => c !== hex)].slice(0, 8);
  renderRecentColors();
}

function renderRecentColors() {
  if (!els.recentColors) return;
  els.recentColors.innerHTML = '';
  recentColors.forEach((c) => {
    const b = document.createElement('div');
    b.className = 'color-swatch';
    b.style.background = c;
    b.title = c;
    b.addEventListener('click', () => {
      currentColor = c;
      syncColor(c);
    });
    els.recentColors.appendChild(b);
  });
}

function updateZoom() {
  if (!els.canvas) return;
  els.canvas.style.transform = `scale(${zoom})`;
  if (els.zoomLevel) els.zoomLevel.textContent = `${Math.round(zoom * 100)}%`;

  // Ensure the scaled canvas stays inside its wrapper and enable scrolling.
  const wrapper = document.querySelector('.canvas-wrapper');
  if (!wrapper) return;

  const canvasWidthScaled = els.canvas.width * zoom;
  const canvasHeightScaled = els.canvas.height * zoom;

  // If we have a last hovered/selected cell, try to center it in the viewport.
  if (lastCell && lastCell.x >= 0) {
    const cellSize = els.canvas.width / GRID_SIZE;
    const targetX = lastCell.x * cellSize * zoom + (cellSize * zoom) / 2;
    const targetY = lastCell.y * cellSize * zoom + (cellSize * zoom) / 2;
    wrapper.scrollLeft = Math.max(
      0,
      Math.min(
        targetX - wrapper.clientWidth / 2,
        canvasWidthScaled - wrapper.clientWidth
      )
    );
    wrapper.scrollTop = Math.max(
      0,
      Math.min(
        targetY - wrapper.clientHeight / 2,
        canvasHeightScaled - wrapper.clientHeight
      )
    );
  } else {
    // center canvas in wrapper
    wrapper.scrollLeft = Math.max(
      0,
      (canvasWidthScaled - wrapper.clientWidth) / 2
    );
    wrapper.scrollTop = Math.max(
      0,
      (canvasHeightScaled - wrapper.clientHeight) / 2
    );
  }
}

async function connectWallet() {
  if (window.ethereum) {
    try {
      const acc = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      const addr = acc[0];
      if (els.walletAddress) els.walletAddress.textContent = shorten(addr);
      if (els.networkStatus) els.networkStatus.textContent = 'Connecté';
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

function showToast(msg, ms = 3000) {
  const t = qs('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => {
    t.style.display = 'none';
  }, ms);
}

function togglePanel() {
  const p = document.querySelector('.side-panel');
  if (!p) return;
  p.style.display = p.style.display === 'none' ? '' : 'none';
}

// utility for other modules to append tx entry
window.UI = window.UI || {};
window.UI.addTx = function (tx) {
  if (!els.txList) return;
  const li = document.createElement('li');
  li.textContent = `${tx.label || 'Tx'} — ${tx.status || 'pending'}`;
  els.txList.prepend(li);
};

document.addEventListener('DOMContentLoaded', init);

// Listen for main thread responses: confirm or not-owner warning
window.addEventListener('ui:confirmReturn', (ev) => {
  const d = ev.detail || {};
  showReturnPopup(d.x, d.y);
});

window.addEventListener('ui:notOwner', (ev) => {
  const d = ev.detail || {};
  // show a warning modal
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
