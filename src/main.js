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
  claimRefund,
} from './blockchain.js';
import {
  canvas,
  getCanvasCoordinates,
  getSelectedColor,
  setStatus,
  showOwnPixelModal,
  showBidPixelModal,
} from './dom.js';
import { drawGrid, drawSinglePixel, getPixelId } from './grid.js';

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

      const claimBtn = document.getElementById('claimRefundButton');
      if (claimBtn) {
        claimBtn.addEventListener('click', async () => {
          setStatus('Réclamation de remboursement en cours...');
          try {
            await claimRefund(contract, web3);
            setStatus('Remboursement réclamé avec succès.');
          } catch (err) {
            console.error('Erreur claimRefund:', err);
            setStatus('Erreur lors de la réclamation du remboursement.');
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

    canvas.addEventListener('click', async (event) => {
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
  } catch (error) {
    console.error("Erreur d'initialisation:", error);
    setStatus(`Erreur: ${error.message}`);
  }
}

init();
