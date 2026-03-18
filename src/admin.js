import { createBlockchainClient, getPastEvents } from './blockchain.js';

const ADMIN_WALLET_ADDRESS = '0xda1eb582986d35966e879970a7eBd1172260f29E';

async function init() {
  try {
    const { web3, contract } = await createBlockchainClient();
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];

    if (account.toLowerCase() !== ADMIN_WALLET_ADDRESS.toLowerCase()) {
      document.body.innerHTML = '<h1>Unauthorized</h1><p>You are not authorized to view this page.</p>';
      return;
    }

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
