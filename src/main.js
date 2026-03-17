import {
  createBlockchainClient,
  loadGrid,
  sendPixel,
  startGridPolling,
  subscribeToPixelChanges,
  getPixel,
  ownPixel,
  giveUpPixel,
  getPseudoCached,
  setPseudo,
  ownPixels,
  setPixels,
} from './blockchain.js';
import {
  canvas,
  getCanvasCoordinates,
  getSelectedColor,
  setStatus,
  showOwnPixelModal,
  showBidPixelModal,
} from './dom.js';
import {
  drawGrid,
  drawSinglePixel,
  getPixelId,
  drawSelectionRectangle,
} from './grid.js';

async function init() {
  try {
    const { web3, contract, connectionLabel } = await createBlockchainClient();
    setStatus(connectionLabel);

    // Initialiser le pseudo de l'utilisateur et le contrôle UI
    try {
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];
      const pseudoInput = document.getElementById('pseudoInput');
      const saveBtn = document.getElementById('savePseudoButton');

      if (account && pseudoInput) {
        const myPseudo = await getPseudoCached(contract, account);
        pseudoInput.value = myPseudo || '';
      }

      if (saveBtn && pseudoInput) {
        saveBtn.addEventListener('click', async () => {
          const newPseudo = pseudoInput.value || '';
          setStatus('Enregistrement du pseudo...');
          try {
            await setPseudo(contract, web3, newPseudo);
            setStatus('Pseudo enregistré.');
          } catch (err) {
            console.error('Erreur setPseudo:', err);
            setStatus("Erreur lors de l'enregistrement du pseudo.");
          }
        });
      }
    } catch (err) {
      console.warn("Impossible d'initialiser le pseudo:", err);
    }

    const refreshGrid = async () => {
      try {
        const pixels = await loadGrid(contract);
        drawGrid(pixels);
      } catch (error) {
        console.error('Erreur drawGrid:', error);
      }
    };

    await refreshGrid();

    startGridPolling(refreshGrid);

    subscribeToPixelChanges(contract, {
      onPixelChanged: ({ id, color }) => {
        console.log(`Événement reçu: Pixel ${id} mis à jour avec ${color}`);
        drawSinglePixel(id, color);
        setStatus('Pixel posé !');
      },
      onSubscriptionUnavailable: () => {
        startGridPolling(refreshGrid);
      },
    });

    // on drag, get all pixels in the dragged area and call ownPixels with all coordinate
    let isMouseDown = false;
    let isDragging = false;
    let dragStart = null;

    canvas.addEventListener('click', async (event) => {
      if (isDragging) return; // Ignore single click event if we were just dragging

      const { x, y } = getCanvasCoordinates(event);
      const color = getSelectedColor();

      setStatus('Vérification du propriétaire du pixel...');

      try {
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];
        const pixel = await getPixel(contract, x, y);

        if (pixel.topLocker === '0x0000000000000000000000000000000000000000') {
          const amount = await showOwnPixelModal();
          setStatus(
            'Transaction en cours. Veuillez confirmer dans votre wallet...'
          );
          await ownPixel(contract, web3, { x, y, amount });
          setStatus('Transaction validée ! Vous possédez maintenant ce pixel.');
        } else if (pixel.topLocker.toLowerCase() === account.toLowerCase()) {
          setStatus(
            'Transaction en cours. Veuillez confirmer dans votre wallet...'
          );
          await sendPixel(contract, web3, { x, y, color });
          drawSinglePixel(getPixelId(x, y), color);
          setStatus('Transaction validée !');
        } else {
          const currentBid = web3.utils.fromWei(
            pixel.highestAmountLocked,
            'ether'
          );
          const amount = await showBidPixelModal(currentBid);
          setStatus(
            'Transaction en cours. Veuillez confirmer dans votre wallet...'
          );
          await ownPixel(contract, web3, { x, y, amount });
          setStatus('Surenchère validée !');
        }
      } catch (error) {
        console.error('Erreur:', error);
        setStatus(`Erreur: ${error.message}`);
      }
    });
    canvas.addEventListener('contextmenu', async (event) => {
      event.preventDefault(); // Empêcher le menu contextuel par défaut
      const { x, y } = getCanvasCoordinates(event);

      setStatus('Vérification du propriétaire du pixel...');

      try {
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];
        const pixel = await getPixel(contract, x, y);

        if (pixel.topLocker.toLowerCase() === account.toLowerCase()) {
          setStatus(
            'Transaction en cours pour vendre le pixel. Veuillez confirmer dans votre wallet...'
          );
          await giveUpPixel(contract, web3, { x, y });
          setStatus('Transaction validée ! Vous avez vendu ce pixel.');
        } else {
          setStatus('Vous ne pouvez vendre que vos propres pixels.');
        }
      } catch (error) {
        console.error('Erreur:', error);
        setStatus(`Erreur: ${error.message}`);
      }
    });

    canvas.addEventListener('mousedown', (event) => {
      isMouseDown = true;
      isDragging = false;
      dragStart = getCanvasCoordinates(event);
    });

    canvas.addEventListener('mousemove', (event) => {
      if (!isMouseDown) return;
      const { x, y } = getCanvasCoordinates(event);

      if (x !== dragStart.x || y !== dragStart.y) {
        isDragging = true;
      }

      if (!isDragging) return;

      const width = Math.abs(x - dragStart.x);
      const height = Math.abs(y - dragStart.y);
      const startX = Math.min(x, dragStart.x);
      const startY = Math.min(y, dragStart.y);

      // Redessiner la grille pour effacer les anciens rectangles de sélection
      refreshGrid();
      drawSelectionRectangle(startX, startY, width, height);
    });

    canvas.addEventListener('mouseup', async (event) => {
      if (!isMouseDown) return;
      isMouseDown = false;

      if (!isDragging) return;

      const dragEnd = getCanvasCoordinates(event);

      setStatus('Vérification des pixels sélectionnés...');

      try {
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0].toLowerCase();

        const pixels = await loadGrid(contract);

        const xList = [];
        const yList = [];
        for (
          let x = Math.min(dragStart.x, dragEnd.x);
          x <= Math.max(dragStart.x, dragEnd.x);
          x++
        ) {
          for (
            let y = Math.min(dragStart.y, dragEnd.y);
            y <= Math.max(dragStart.y, dragEnd.y);
            y++
          ) {
            const pixelId = getPixelId(x, y);
            const pixel = pixels[pixelId];

            if (pixel.topLocker.toLowerCase() !== account) {
              xList.push(x);
              yList.push(y);
            }
          }
        }

        if (xList.length === 0) {
          setStatus('Tous les pixels vous appartiennent. Transaction(s) en cours...');
          const color = getSelectedColor();
          let xlistBis = [];
          let ylistBis = [];
          
          for (
            let x = Math.min(dragStart.x, dragEnd.x);
            x <= Math.max(dragStart.x, dragEnd.x);
            x++
          ) {
            for (
              let y = Math.min(dragStart.y, dragEnd.y);
              y <= Math.max(dragStart.y, dragEnd.y);
              y++
            ) {
              xlistBis.push(x);
              ylistBis.push(y);
            }
          }
          await setPixels(contract, web3, { xList: xlistBis, yList: ylistBis, colorList: Array(xlistBis.length).fill(color) });
          setStatus('Couleurs mises à jour avec succès !');
          return;
        }

        const color = getSelectedColor();
        const amountPerPixel = await showBidPixelModal('0');

        setStatus(
          'Transaction en cours pour posséder les pixels sélectionnés. Veuillez confirmer dans votre wallet...'
        );

        await ownPixels(contract, web3, {
          xList,
          yList,
          amount: amountPerPixel,
        });
        setStatus(
          'Transaction validée ! Vous possédez maintenant les pixels sélectionnés.'
        );
      } catch (error) {
        console.error('Erreur:', error);
        setStatus(`Erreur: ${error.message}`);
      }
    });
  } catch (error) {
    console.error("Erreur d'initialisation:", error);
    setStatus(`Erreur: ${error.message}`);
  }
}

init();
