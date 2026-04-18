const provider = new ethers.providers.JsonRpcProvider(
  "https://rpc.ankr.com/eth"
);let wallet;
async function createWallet() {
  wallet = ethers.Wallet.createRandom();

  const mnemonic = wallet.mnemonic.phrase;

  document.getElementById("seed").innerText =
    "Seed: " + mnemonic;

  document.getElementById("address").innerText =
    "Address: " + wallet.address;

  const encrypted = await wallet.encrypt("1234");

  localStorage.setItem("wallet", encrypted);
}
async function loadWallet() 
  const encrypted = localStorage.getItem("wallet");

  wallet = await ethers.Wallet.fromEncryptedJson(
    encrypted,
    "1234"
  );

  document.getElementById("address").innerText =
    "Address: " + wallet.address;
}
