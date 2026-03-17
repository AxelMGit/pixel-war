import { GRID_SIZE } from '../config.js';
import { getCanvasCoordinates } from '../dom.js';
import { syncColor } from './color.js';
import { showBuyPopup, showToast } from './modals.js';
import { qs } from './utils.js';

let els = {};
let currentColor = '#7C3AED';
let recentColors = [currentColor, '#06B6D4', '#F59E0B', '#E11D48'];
let lastCell = { x: -1, y: -1 };
let zoom = 1;
let lastPixelInfo = null;
let myAddress = null;

export function init() {
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
  els.togglePanel = qs('togglePanel');

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
    els.canvas.addEventListener('click', () => {
      if (lastCell.x < 0) return;
      showBuyPopup(
        lastCell.x,
        lastCell.y,
        currentColor,
        lastPixelInfo,
        myAddress
      );
    });
    els.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (lastCell.x < 0) {
        showToast('Sélectionnez un pixel dans la grille.');
        return;
      }
      window.dispatchEvent(
        new CustomEvent('ui:returnRequest', {
          detail: { x: lastCell.x, y: lastCell.y },
        })
      );
    });
  }

  if (els.togglePanel) els.togglePanel.addEventListener('click', togglePanel);

  window.addEventListener('pixel:info', (ev) => {
    lastPixelInfo = ev.detail || {};
    const d = lastPixelInfo;
    const infoCoords = document.getElementById('infoCoords');
    const infoOwner = document.getElementById('infoOwner');
    const infoAmount = document.getElementById('infoAmount');
    const infoStatus = document.getElementById('infoStatus');
    if (infoCoords) infoCoords.innerText = `${d.x}, ${d.y}`;
    if (infoOwner) infoOwner.innerText = d.topLockerDisplay || 'N/A';
    if (infoAmount) infoAmount.innerText = d.amountDisplay || 'N/A';
    if (infoStatus) infoStatus.innerText = d.isPixelSet ? 'Occupé' : 'Libre';
  });

  window.addEventListener('ui:walletConnected', (ev) => {
    const addr = ev.detail && ev.detail.address;
    if (addr) myAddress = addr;
  });

  window.addEventListener('ui:pseudoLoaded', (ev) => {
    const p = ev.detail && ev.detail.pseudo;
    const el = document.getElementById('pseudoDisplay');
    if (el) el.innerText = p || '—';
  });

  window.addEventListener('ui:pseudoSaved', (ev) => {
    const p = ev.detail && ev.detail.pseudo;
    const el = document.getElementById('pseudoDisplay');
    if (el) el.innerText = p || '—';
    showToast('Pseudo enregistré', 2000);
  });

  const editPseudoBtn = document.getElementById('editPseudo');
  if (editPseudoBtn) {
    editPseudoBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('ui:showEditPseudo'));
    });
  }
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

  const wrapper = document.querySelector('.canvas-wrapper');
  if (!wrapper) return;

  const canvasWidthScaled = els.canvas.width * zoom;
  const canvasHeightScaled = els.canvas.height * zoom;

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

function togglePanel() {
  const p = document.querySelector('.side-panel');
  if (!p) return;
  p.style.display = p.style.display === 'none' ? '' : 'none';
}

export default { init };
