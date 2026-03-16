import { GRID_SIZE } from './config.js';

const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const pixelSize = canvas.width / GRID_SIZE;
const statusEl = document.getElementById('status');
const colorPickerEl = document.getElementById('colorPicker');

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

export {
  canvas,
  ctx,
  pixelSize,
  setStatus,
  getCanvasCoordinates,
  getSelectedColor,
};
