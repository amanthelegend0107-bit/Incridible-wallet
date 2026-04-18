let wallet;

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
