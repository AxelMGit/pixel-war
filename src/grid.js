import { GRID_SIZE } from './config.js';
import { canvas, ctx, pixelSize } from './dom.js';

function drawSinglePixel(id, color) {
  const x = id % GRID_SIZE;
  const y = Math.floor(id / GRID_SIZE);

  ctx.fillStyle = color;
  ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
}

function drawGrid(pixels) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw grid lines
  ctx.strokeStyle = '#ececec';
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i++) {
    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(i * pixelSize, 0);
    ctx.lineTo(i * pixelSize, canvas.height);
    ctx.stroke();
    // Horizontal lines
    ctx.beginPath();
    ctx.moveTo(0, i * pixelSize);
    ctx.lineTo(canvas.width, i * pixelSize);
    ctx.stroke();
  }

  pixels.forEach((pixel, index) => {
    if (pixel.color && pixel.color !== '') {
      drawSinglePixel(index, pixel.color);
    }
  });
}

function drawSelectionRectangle(x, y, width, height) {
  ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(
    x * pixelSize,
    y * pixelSize,
    width * pixelSize,
    height * pixelSize
  );
}

function getPixelId(x, y) {
  return x + y * GRID_SIZE;
}

export { drawGrid, drawSinglePixel, getPixelId };
