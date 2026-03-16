import {
    createBlockchainClient,
    loadGrid,
    sendPixel,
    startGridPolling,
    subscribeToPixelChanges
} from './blockchain.js';
import { canvas, getCanvasCoordinates, getSelectedColor, setStatus } from './dom.js';
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

        // Garde un rafraîchissement périodique actif pour synchroniser la grille
        // même si les événements ne sont pas fournis de façon fiable par le provider.
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

            setStatus('Transaction en cours. Veuillez confirmer dans votre wallet...');

            try {
                await sendPixel(contract, web3, { x, y, color });
                drawSinglePixel(getPixelId(x, y), color);
                setStatus('Transaction validée !');
            } catch (error) {
                console.error("Erreur d'envoi:", error);
                setStatus('Erreur ou transaction annulée.');
            }
        });
    } catch (error) {
        console.error("Erreur d'initialisation:", error);
        setStatus(`Erreur: ${error.message}`);
    }
}

init();