import { createBlockchainClient, getPastEvents, claimAdminRefunds, getAdminRefunds } from './blockchain.js';

const ADMIN_WALLET_ADDRESS = '0xda1eb582986d35966e879970a7eBd1172260f29E';

async function init() {
  try {
    const adminButton = document.getElementById('claimRefundAdmin');
    const { web3, contract } = await createBlockchainClient();
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];

    if (account.toLowerCase() !== ADMIN_WALLET_ADDRESS.toLowerCase()) {
      document.body.innerHTML = '<h1>Unauthorized</h1><p>You are not authorized to view this page.</p>';
      return;
    }

    try {
      const adminRefund = await getAdminRefunds(contract, web3);
      const refundElement = document.getElementById('valueAdminRefund');
      refundElement.textContent = `Commissions à réclamer : ${adminRefund} ETH`;
    } catch (error) {
      console.error('Error fetching admin refund:', error);
      const refundElement = document.getElementById('valueAdminRefund');
      refundElement.textContent = 'Erreur lors de la récupération des commissions.';
    }

    adminButton.addEventListener('click', async () => {
      try {
        await claimAdminRefunds(contract, web3);
        alert('Commissions réclamées avec succès !');
      } catch (error) {
        console.error('Error claiming admin refund:', error);
        alert('Erreur lors de la réclamation des commissions.');
      }
    });

    const events = await getPastEvents(contract);
    const tableBody = document.querySelector('#logsTable tbody');

    events.forEach(event => {
      const row = tableBody.insertRow();
      const { transactionHash, blockNumber, returnValues } = event;
      const { id, newOwner, color, newAmount } = returnValues;

      row.innerHTML = `
        <td>${transactionHash}</td>
        <td>${blockNumber}</td>
        <td>${id}</td>
        <td>${newOwner}</td>
        <td>${color}</td>
        <td>${web3.utils.fromWei(newAmount, 'ether')} ETH</td>
      `;
    });
  } catch (error) {
    console.error('Error initializing admin page:', error);
    document.body.innerHTML = '<h1>Error</h1><p>Could not initialize admin page.</p>';
  }
}

init();
