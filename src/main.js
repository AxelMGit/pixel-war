import {
    createBlockchainClient,
    loadGrid,
    sendPixel,
    startGridPolling,
    subscribeToPixelChanges,
    getPixel,
    ownPixel
} from './blockchain.js';
import { canvas, getCanvasCoordinates, getSelectedColor, setStatus, showOwnPixelModal } from './dom.js';
import { drawGrid, drawSinglePixel, getPixelId } from './grid.js';

async function init() {
    try {
        const { web3, contract, connectionLabel } = await createBlockchainClient();
        setStatus(connectionLabel);

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
            }
        });

        canvas.addEventListener('mousedown', async (event) => {
            const { x, y } = getCanvasCoordinates(event);
            const color = getSelectedColor();

            setStatus('Vérification du propriétaire du pixel...');

            try {
                const pixel = await getPixel(contract, x, y);
                if (pixel.topLocker === '0x0000000000000000000000000000000000000000') {
                    const amount = await showOwnPixelModal();
                    setStatus('Transaction en cours. Veuillez confirmer dans votre wallet...');
                    await ownPixel(contract, web3, { x, y, amount });
                    setStatus('Transaction validée ! Vous possédez maintenant ce pixel.');
                } else {
                    setStatus('Transaction en cours. Veuillez confirmer dans votre wallet...');
                    await sendPixel(contract, web3, { x, y, color });
                    drawSinglePixel(getPixelId(x, y), color);
                    setStatus('Transaction validée !');
                }
            } catch (error) {
                console.error("Erreur:", error);
                setStatus(`Erreur: ${error.message}`);
            }
        });
    } catch (error) {
        console.error("Erreur d'initialisation:", error);
        setStatus(`Erreur: ${error.message}`);
    }
}

init();