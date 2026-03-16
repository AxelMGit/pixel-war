// Focus sur le pixel si la souris est dessus

let web3;
let contract;
const size = 50;
const canvas = document.getElementById("pixelCanvas");
const ctx = canvas.getContext("2d");
const pixelSize = canvas.width / size;

// Écouter les mouvements de la souris sur le canvas pour afficher les données du pixel
canvas.addEventListener('mousemove', async (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);

    if (x >= 0 && x < size && y >= 0 && y < size) {
        try {
            const pixel = await window.contract.methods.getPixel(x, y).call();
            document.getElementById('xValue').innerText = x;
            document.getElementById('yValue').innerText = y;
            document.getElementById('topLockerValue').innerText = pixel.topLocker;
            document.getElementById('highestAmountLockedValue').innerText = pixel.highestAmountLocked;
        } catch (error) {
            console.error('Erreur lors de la récupération des données du pixel:', error);
        }
    }
});
