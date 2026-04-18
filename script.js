// Connect to real Ethereum network
const provider = new ethers.providers.JsonRpcProvider(
  "https://rpc.ankr.com/eth"
);

let wallet;

// CREATE WALLET
async function createWallet() {
  wallet = ethers.Wallet.createRandom();

  const mnemonic = wallet.mnemonic.phrase;

  document.getElementById("seed").innerText =
    "Seed: " + mnemonic;

  document.getElementById("address").innerText =
    "Address: " + wallet.address;

  // Encrypt and save
  const encrypted = await wallet.encrypt("1234");
  localStorage.setItem("wallet", encrypted);
}

// LOAD WALLET
async function loadWallet() {
  const encrypted = localStorage.getItem("wallet");

  wallet = await ethers.Wallet.fromEncryptedJson(
    encrypted,
    "1234"
  );

  document.getElementById("address").innerText =
    "Address: " + wallet.address;

  getBalance();
}

// GET REAL BALANCE
async function getBalance() {
  const balance = await provider.getBalance(wallet.address);

  const eth = ethers.utils.formatEther(balance);

  document.getElementById("balance").innerText =
    "Balance: " + eth + " ETH";
}
