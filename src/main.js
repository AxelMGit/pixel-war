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
  getPendingRefund,
  ownPixels,
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

    try {
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];
      if (account) {
        const myPseudo = await getPseudoCached(contract, account);
        window.dispatchEvent(
          new CustomEvent('ui:pseudoLoaded', {
            detail: { pseudo: myPseudo || '' },
          })
        );

        const pendingRefund = await getPendingRefund(contract, web3);
        window.dispatchEvent(
          new CustomEvent('ui:refundAmountLoaded', {
            detail: { amount: pendingRefund },
          })
        );
      }

      const claimBtn = document.getElementById('claimRefundButton');
      if (claimBtn) {
        claimBtn.addEventListener('click', async () => {
          setStatus('Réclamation de remboursement en cours...');
          try {
            await claimRefund(contract, web3);
            setStatus('Remboursement réclamé avec succès.');
            const pendingRefund = await getPendingRefund(contract, web3);
            window.dispatchEvent(
              new CustomEvent('ui:refundAmountLoaded', {
                detail: { amount: pendingRefund },
              })
            );
          } catch (err) {
            console.error('Erreur claimRefund:', err);
            setStatus('Erreur lors de la réclamation du remboursement.');
          }
        });
      }
    } catch (err) {
      console.warn("Impossible d'initialiser le pseudo:", err);
    }

    window.addEventListener('ui:setPseudo', async (ev) => {
      const newPseudo = ev.detail && ev.detail.pseudo;
      if (typeof newPseudo !== 'string') return;
      try {
        setStatus('Enregistrement du pseudo...');
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];
        await setPseudo(contract, web3, newPseudo);
        window.dispatchEvent(
          new CustomEvent('ui:pseudoSaved', { detail: { pseudo: newPseudo } })
        );
        setStatus('Pseudo enregistré.');
      } catch (err) {
        console.error('Erreur setPseudo:', err);
        setStatus("Erreur lors de l'enregistrement du pseudo.");
      }
    });

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
      onPixelOwnerChanged: async () => {
        try {
          const accounts = await web3.eth.getAccounts();
          if (accounts.length > 0) {
            const pendingRefund = await getPendingRefund(contract, web3);
            window.dispatchEvent(
              new CustomEvent('ui:refundAmountLoaded', {
                detail: { amount: pendingRefund },
              })
            );
          }
        } catch (err) {
          console.warn('Could not refresh pending refund amount', err);
        }
      },
      onSubscriptionUnavailable: () => {
        startGridPolling(refreshGrid);
      },
    });

    window.addEventListener('ui:buyPixel', async (ev) => {
      const { x, y, color, amount } = ev.detail || {};
      setStatus('Vérification du propriétaire du pixel...');
      try {
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];
        const pixel = await getPixel(contract, x, y);

        if (amount) {
          const cleaned = String(amount).replace(',', '.');
          const entered = parseFloat(cleaned);
          if (!Number.isFinite(entered) || entered <= 0) {
            setStatus("Montant invalide fourni par l'UI.");
            return;
          }
          if (
            pixel.topLocker &&
            pixel.topLocker !== '0x0000000000000000000000000000000000000000'
          ) {
            const currentBidStr = web3.utils.fromWei(
              pixel.highestAmountLocked,
              'ether'
            );
            const currentBid =
              parseFloat(String(currentBidStr).replace(',', '.')) || 0;
            if (entered <= currentBid) {
              setStatus(
                `Montant trop faible — il faut surenchérir (actuel: ${currentBid} ETH).`
              );
              return;
            }
          }
        }

        if (pixel.topLocker === '0x0000000000000000000000000000000000000000') {
          const chosenAmount = amount || (await showOwnPixelModal());
          setStatus(
            'Transaction en cours. Veuillez confirmer dans votre wallet...'
          );
          await ownPixel(contract, web3, { x, y, amount: chosenAmount });
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
          const chosenAmount = amount || (await showBidPixelModal(currentBid));
          setStatus(
            'Transaction en cours. Veuillez confirmer dans votre wallet...'
          );
          await ownPixel(contract, web3, { x, y, amount: chosenAmount });
          setStatus('Surenchère validée !');
        }
      } catch (error) {
        console.error('Erreur:', error);
        setStatus(`Erreur: ${error.message}`);
      }
    });

    window.addEventListener('ui:returnRequest', async (ev) => {
      const { x, y } = ev.detail || {};
      try {
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];
        const pixel = await getPixel(contract, x, y);
        if (pixel.topLocker.toLowerCase() === account.toLowerCase()) {
          window.dispatchEvent(
            new CustomEvent('ui:confirmReturn', { detail: { x, y } })
          );
        } else {
          window.dispatchEvent(
            new CustomEvent('ui:notOwner', { detail: { x, y } })
          );
        }
      } catch (error) {
        console.error('Erreur:', error);
        setStatus(`Erreur: ${error.message}`);
      }
    });

    window.addEventListener('ui:returnPixel', async (ev) => {
      const { x, y } = ev.detail || {};
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
          window.dispatchEvent(
            new CustomEvent('ui:refundAmountLoaded', {
              detail: { amount: await getPendingRefund(contract, web3) },
            })
          );
        } else {
          setStatus('Vous ne pouvez vendre que vos propres pixels.');
        }
      } catch (error) {
        console.error('Erreur:', error);
        setStatus(`Erreur: ${error.message}`);
      }
    });

    // on drag, get all pixels in the dragged area and call ownPixels with all coordinate
    let isDragging = false;
    let dragStart = null;

    canvas.addEventListener('mousedown', (event) => {
      isDragging = true;
      dragStart = getCanvasCoordinates(event);
    });

    canvas.addEventListener('mousemove', (event) => {
      if (!isDragging) return;
      const { x, y } = getCanvasCoordinates(event);
      const width = Math.abs(x - dragStart.x);
      const height = Math.abs(y - dragStart.y);
      const startX = Math.min(x, dragStart.x);
      const startY = Math.min(y, dragStart.y);

      // Redessiner la grille pour effacer les anciens rectangles de sélection
      refreshGrid();
      drawSelectionRectangle(startX, startY, width, height);
    });

    canvas.addEventListener('mouseup', async (event) => {
      if (!isDragging) return;
      isDragging = false;
      const dragEnd = getCanvasCoordinates(event);

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
          xList.push(x);
          yList.push(y);
        }
      }

      const color = getSelectedColor();
      const amountPerPixel = await showBidPixelModal('0');

      setStatus(
        'Transaction en cours pour posséder les pixels sélectionnés. Veuillez confirmer dans votre wallet...'
      );

      try {
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
