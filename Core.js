let walletData = {};

// CREATE SEED + ADDRESSES
function createMultiWallet() {
  const mnemonic = bip39.generateMnemonic();

  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const root = bitcoin.bip32.fromSeed(seed);

  // BTC
  const btcChild = root.derivePath("m/44'/0'/0'/0/0");
  const btc = bitcoin.payments.p2pkh({
    pubkey: btcChild.publicKey
  }).address;

  // LTC
  const ltcChild = root.derivePath("m/44'/2'/0'/0/0");
  const ltc = bitcoin.payments.p2pkh({
    pubkey: ltcChild.publicKey
  }).address;

  // ETH
  const ethWallet = ethers.Wallet.fromMnemonic(mnemonic);
  const eth = ethWallet.address;

  // SOL
  const solKey = solanaWeb3.Keypair.fromSeed(seed.slice(0, 32));
  const sol = solKey.publicKey.toString();

  walletData = { mnemonic, btc, ltc, eth, sol };

  localStorage.setItem("multiWallet", JSON.stringify(walletData));

  alert("SAVE SEED:\n" + mnemonic);
}

// LOAD
function loadMultiWallet() {
  walletData = JSON.parse(localStorage.getItem("multiWallet"));

  if (!walletData) {
    alert("No wallet found");
    return;
  }

  console.log(walletData);
}
