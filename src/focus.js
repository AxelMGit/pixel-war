import { canvas, getCanvasCoordinates } from './dom.js';
import { GRID_SIZE } from './config.js';
import {
  getPixel,
  createBlockchainClient,
  getPseudoCached,
} from './blockchain.js';

let clientPromise = null;
async function getBlockchainClient() {
  if (!clientPromise) clientPromise = createBlockchainClient();
  return clientPromise;
}

// Écouter les mouvements de la souris sur le canvas pour afficher les données du pixel
canvas.addEventListener('mousemove', async (e) => {
  const { contract } = await getBlockchainClient();
  const { x, y } = getCanvasCoordinates(e);

  if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
    try {
      document.getElementById('xValue').innerText = x;
      document.getElementById('yValue').innerText = y;
      const pixel = await getPixel(contract, x, y);
      const isPixelSet =
        pixel.topLocker !== '0x0000000000000000000000000000000000000000' &&
        pixel.highestAmountLocked !== '0';
      if (isPixelSet) {
        const pseudo = await getPseudoCached(contract, pixel.topLocker);
        document.getElementById('topLockerValue').innerText =
          pseudo && pseudo.length > 0 ? pseudo : pixel.topLocker;
      } else {
        document.getElementById('topLockerValue').innerText = 'N/A';
      }
      document.getElementById('highestAmountLockedValue').innerText = isPixelSet
        ? (Number(pixel.highestAmountLocked) / 10 ** 18).toString()
        : 'N/A';
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des données du pixel:',
        error
      );
    }
  }
});
