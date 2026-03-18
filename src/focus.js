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
      const xEl = document.getElementById('xValue');
      const yEl = document.getElementById('yValue');
      if (xEl) xEl.innerText = x;
      if (yEl) yEl.innerText = y;

      const pixel = await getPixel(contract, x, y);
      const isPixelSet =
        pixel.topLocker !== '0x0000000000000000000000000000000000000000' &&
        pixel.highestAmountLocked !== '0';

      let topLockerDisplay = 'N/A';
      if (isPixelSet) {
        const pseudo = await getPseudoCached(contract, pixel.topLocker);
        topLockerDisplay =
          pseudo && pseudo.length > 0 ? pseudo : pixel.topLocker;
      }

      const amountDisplay = isPixelSet
        ? (Number(pixel.highestAmountLocked) / 10 ** 18).toString() + ' ETH'
        : 'N/A';

      const topEl = document.getElementById('topLockerValue');
      if (topEl) topEl.innerText = topLockerDisplay;
      const amtEl = document.getElementById('highestAmountLockedValue');
      if (amtEl) amtEl.innerText = amountDisplay;

      // Emit a custom event so the new UI can listen and update side panels.
      window.dispatchEvent(
        new CustomEvent('pixel:info', {
          detail: {
            x,
            y,
            isPixelSet,
            topLocker: pixel.topLocker,
            topLockerDisplay,
            highestAmountLocked: pixel.highestAmountLocked,
            amountDisplay,
          },
        })
      );
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des données du pixel:',
        error
      );
    }
  }
});
