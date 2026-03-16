import { abi, contractAddress } from "./contract/contract_interface.js";

// 1. Déclaration des variables globales
let web3;
let contract;
const size = 50;
const canvas = document.getElementById("pixelCanvas");
const ctx = canvas.getContext("2d");
const pixelSize = canvas.width / size;

// ---------------------------------------

// 2. Définition des fonctions (AVANT de les appeler)

async function drawGrid() {
  try {
    console.log("Chargement de la grille...");
    const pixels = await contract.methods.getFullGrid().call();

    // Effacer le canvas avant de redessiner
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pixels.forEach((p, index) => {
      if (p.color && p.color !== "") {
        const x = index % size;
        const y = Math.floor(index / size);
        ctx.fillStyle = p.color;
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    });
    console.log("Grille dessinée.");
  } catch (error) {
    console.error("Erreur drawGrid:", error);
  }
}

let lastAction = null;

async function sendPixel(x, y, color) {
  const accounts = await web3.eth.getAccounts();
  const account = accounts[0];

  // Sauvegarde état avant valid transaction
  const pixelData = ctx.getImageData(x * pixelSize, y * pixelSize, 1, 1).data;
  const oldColor = rgbToHex(pixelData[0], pixelData[1], pixelData[2]);

  drawSinglePixel(x, y, color);

  contract.methods
    .setPixel(x, y, color)
    .send({
      from: account,
      gas: 200000,
    })
    .on("transactionHash", (hash) => {
      console.log("Transaction envoyée : " + hash);
      document.getElementById("status").innerText =
        "Enregistrement sur la blockchain...";
    })
    .on("receipt", (receipt) => {
      console.log("Transaction confirmée !");
      document.getElementById("status").innerText = "Pixel enregistré !";
    })
    .on("error", (error) => {
      // Rollback si échec transaction
      console.error("Échec de la transaction, annulation...", error);
      drawSinglePixel(x, y, oldColor);
      document.getElementById("status").innerText =
        "Erreur : transaction échouée.";
    });
}

// Optimisation single pixel
function drawSinglePixel(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
}

function rgbToHex(r, g, b) {
  if (r === 0 && g === 0 && b === 0) return "#ffffff"; // Par défaut blanc si vide
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

async function init() {
  try {
    // Connexion
    web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

    const code = await web3.eth.getCode(contractAddress);
    if (code === "0x" || code === "0x0") {
      throw new Error(
        "Contrat non trouvé à cette adresse. Vérifie l'adresse et Ganache.",
      );
    }

    contract = new web3.eth.Contract(abi, contractAddress);
    document.getElementById("status").innerText = "Connecté à Ganache !";

    // Premier affichage
    await drawGrid();

    // Event Listener pour le clic
    canvas.addEventListener("mousedown", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("Canvas cliqué:", e);
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / pixelSize);
      const y = Math.floor((e.clientY - rect.top) / pixelSize);
      const color = document.getElementById("colorPicker").value;
      await sendPixel(x, y, color);
    });
  } catch (error) {
    console.error("Erreur d'initialisation:", error);
    document.getElementById("status").innerText = "Erreur: " + error.message;
  }
}

init();
