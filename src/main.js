import {
  createBlockchainClient,
  loadGrid,
  sendPixel,
  startGridPolling,
  subscribeToPixelChanges,
  getPixel,
  giveUpPixel,
  giveUpPixels,
  getPseudoCached,
  setPseudo,
  claimRefund,
  getPendingRefund,
  ownPixels,
  setPixels,
} from './blockchain.js';
import {
  setStatus,
  showOwnPixelModal,
  showBidPixelModal,
} from './dom.js';
import { showBatchBuyPopup, showOwnedBatchPopup } from './ui/modals.js';
import {
  drawGrid,
  drawSinglePixel,
  getPixelId,
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
          await ownPixels(contract, web3, { xList:[x], yList:[y], amount: chosenAmount });
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
          await ownPixels(contract, web3, { xList:[x], yList:[y], amount: chosenAmount });
          setStatus('Surenchère validée !');
        }
      } catch (error) {
        console.error('Erreur:', error);
        setStatus(`Erreur: ${error.message}`);
      }
    });

    window.addEventListener('ui:buyPixels', async (ev) => {
      const { pixels, amount } = ev.detail || {};
      if (!pixels || !pixels.length) return;
      setStatus('Vérification des pixels sélectionnés...');
      try {
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];

        const xList = [];
        const yList = [];
        const colors = [];
        let maxBid = 0;
        let allOwnedByMe = true;

        for (const p of pixels) {
          const pData = await getPixel(contract, p.x, p.y);

          const isOwnedByMe =
            pData.topLocker &&
            pData.topLocker.toLowerCase() === account.toLowerCase();
          if (!isOwnedByMe) {
            allOwnedByMe = false;
          }

          if (
            pData.topLocker &&
            pData.topLocker !==
              '0x0000000000000000000000000000000000000000'
          ) {
            const currentBidStr = web3.utils.fromWei(
              pData.highestAmountLocked,
              'ether'
            );
            const currentBid =
              parseFloat(String(currentBidStr).replace(',', '.')) || 0;
            if (currentBid > maxBid) maxBid = currentBid;
          }
          xList.push(p.x);
          yList.push(p.y);
          colors.push(p.color);
        }

        if (allOwnedByMe) {
          const action = await showOwnedBatchPopup(xList.length, colors[0]);
          if (!action) {
            setStatus('Action annulée.');
            return;
          }

          if (action.action === 'sell') {
            setStatus(
              'Transaction en cours. Veuillez confirmer dans votre wallet...'
            );
            await giveUpPixels(contract, web3, { xList, yList });
            setStatus('Pixels rendus avec succès.');
            window.dispatchEvent(
              new CustomEvent('ui:refundAmountLoaded', {
                detail: { amount: await getPendingRefund(contract, web3) },
              })
            );
            return;
          }

          const chosenColor = action.color || colors[0];
          const colorList = xList.map(() => chosenColor);
          setStatus(
            'Transaction en cours. Veuillez confirmer dans votre wallet...'
          );
          await setPixels(contract, web3, {
            xList,
            yList,
            colorList,
          });
          xList.forEach((x, idx) => {
            const y = yList[idx];
            drawSinglePixel(getPixelId(x, y), chosenColor);
          });
          setStatus('Couleurs mises à jour pour les pixels sélectionnés.');
          return;
        }

        if (amount) {
          const cleaned = String(amount).replace(',', '.');
          const entered = parseFloat(cleaned);
          if (!Number.isFinite(entered) || entered <= 0) {
            setStatus("Montant invalide fourni par l'UI.");
            return;
          }
          if (entered <= maxBid) {
            setStatus(
              `Montant trop faible — il faut surenchérir (max actuel: ${maxBid} ETH).`
            );
            return;
          }
        }

        const chosenAmount =
          amount || (await showBatchBuyPopup(xList.length, maxBid));
        if (!chosenAmount) {
          setStatus('Transaction annulée.');
          return;
        }

        const parsedAmount = parseFloat(String(chosenAmount).replace(',', '.'));
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
          setStatus("Montant invalide fourni par l'UI.");
          return;
        }
        if (parsedAmount <= maxBid) {
          setStatus(
            `Montant trop faible — il faut surenchérir (max actuel: ${maxBid} ETH).`
          );
          return;
        }

        const totalAmount = (parsedAmount * xList.length).toFixed(18);
        setStatus('Transaction en cours. Veuillez confirmer dans votre wallet...');
        await ownPixels(contract, web3, {
          xList,
          yList,
          amount: totalAmount.toString(),
        });
        setStatus('Pixels achetés avec succès !');
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

  } catch (error) {
    console.error("Erreur d'initialisation:", error);
    setStatus(`Erreur: ${error.message}`);
  }
}

init();
